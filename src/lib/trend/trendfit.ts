/**
 * C8 '내 채널에 맞는 주제' 데이터(서버 전용, roadmap T10). 순서·규칙은 trendfit-schema.ts 의 runTrendFit(시험: scripts/trend/trendfit.test.mjs).
 *
 *   getTrendFit(userId, end, { plan })   GET /api/trend/fit 만 부른다. 키워드 페이지 서버 렌더는 부르지 않는다(표 TTFB 와 무관)
 *   resetTrendFit(userId)                내 채널 재등록 성공 뒤: 그 사용자의 user_trend_matches 전부 삭제 + 오늘 하루 1회 잠금 키 삭제
 *
 * - 캐시 키 snapshot_date = end(A1 끝 날짜). 그래서 재등록 때 '오늘 행'만 지우면 아무것도 안 지워진다 → user_id 조건만으로 전부 지운다.
 * - 하루 1회 잠금: aiLimit.ts trendfitOnce(Redis SET NX `ai:trendfit:d:{userId}:{UTC날짜}`, TTL 다음 UTC 자정).
 *   알려진 동작: 잠금은 UTC 날짜(한국 09:00 초기화), 캐시는 end 기준이다. cron 이 22:05·23:05 UTC(한국 07:05·08:05)에 새 end 를
 *   만들면 한국 07~09시에는 전날 잠금이 남아 새 end 에 대해 once() 가 실패한다. 그동안은 저장하지 않은 overlap 을 돌려주고,
 *   09시 뒤 첫 요청에서 Claude 결과가 저장된다(같은 end 인데 아침·낮 method 가 다를 수 있음). 하루 최대 1회 비용 상한은 지켜진다.
 *   잠금 날짜를 end 로 맞추려면 aiLimit.ts 수정이 필요해 이 항목 범위 밖(소유자 확인 단계에서 정함).
 * - 사용자 AI 횟수(remix·thumbs)는 차감하지 않는다. 전체 하루 예산(ai:global)만 센다: reserveAi('trendfit') 로 예산 안인지 보고,
 *   Claude 가 실제로 돌았으면 commitAi(전체 +1). trendfit 의 사용 키는 잠금 키와 같은 이름이라 commit 하면 그 값이 1 → 2 가 될 뿐
 *   (화면·한도에 쓰지 않음). 시간 초과 무료 처리(timeoutRelease)는 쓰지 않는다(remix·thumbs 의 하루 2회 몫을 쓰지 않게).
 * - Claude: tier 'light', max_tokens 2000, 상한 15초, 마감 = 요청 시작 + 55초. 키 없음·AI 스위치 꺼짐이면 부르지 않고 overlap.
 * - ai_generations 에는 feature 'trendfit', input 에 term 목록만.
 */
import { getSupabase } from "@/lib/supabase";
import { callClaudeJson, claudeAvailable } from "@/lib/claude";
import { commitAi, releaseAi, reserveAi, trendfitOnce, utcDate } from "@/lib/aiLimit";
import { getRisingTerms } from "./rising";
import { getUserChannel } from "./my-channel";
import {
  TRENDFIT_CAP_MS,
  TRENDFIT_MAX_TOKENS,
  TRENDFIT_SCHEMA,
  TRENDFIT_SYSTEM,
  runTrendFit,
  validateTrendFit,
  type StoredMatch,
  type TrendFitItem,
  type TrendFitMethod,
  type TrendFitResponse,
} from "./trendfit-schema";

type MatchRow = { items: unknown; method: string | null };

function parseItems(raw: unknown): TrendFitItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .filter((r) => typeof r.term === "string" && typeof r.reason === "string")
    .map((r) => ({ term: r.term as string, reason: r.reason as string, covered: r.covered === true }));
}

async function readMatch(userId: string, end: string): Promise<StoredMatch | null | "error"> {
  const db = getSupabase();
  if (!db) return "error";
  const { data, error } = await db
    .from("user_trend_matches")
    .select("items,method")
    .eq("user_id", userId)
    .eq("snapshot_date", end)
    .maybeSingle();
  if (error) {
    console.error("[trend/trendfit] user_trend_matches select error:", error.message);
    return "error";
  }
  if (!data) return null;
  const row = data as MatchRow;
  const method: TrendFitMethod = row.method === "ai" ? "ai" : "overlap";
  return { items: parseItems(row.items), method };
}

export async function getTrendFit(userId: string, end: string, opts: { plan: string }): Promise<TrendFitResponse> {
  return runTrendFit({
    userId,
    end,
    now: () => Date.now(),
    readChannel: () => getUserChannel(userId),
    readMatch: () => readMatch(userId, end),
    readRising: async () => {
      const r = await getRisingTerms({ end });
      if (r.state === "error") return "error";
      return r.rows.map((row) => ({ term: row.term, recentChannels: row.recentChannels, priorChannels: row.priorChannels }));
    },
    available: claudeAvailable,
    once: () => trendfitOnce(userId),
    reserve: async () => {
      const r = await reserveAi("trendfit", userId, opts.plan);
      return r.ok ? r.reservationId : null;
    },
    settle: (id, ran) => (ran ? commitAi(id) : releaseAi(id)),
    call: (prompt, risingTerms, deadline) =>
      callClaudeJson<TrendFitItem[]>({
        tier: "light",
        system: TRENDFIT_SYSTEM,
        content: prompt,
        schema: TRENDFIT_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: TRENDFIT_MAX_TOKENS,
        validate: (raw) => validateTrendFit(raw, risingTerms),
        deadline,
        capMs: TRENDFIT_CAP_MS,
      }),
    insertMatch: async (row) => {
      const db = getSupabase();
      if (!db) return;
      const { error } = await db
        .from("user_trend_matches")
        .upsert(
          { user_id: userId, snapshot_date: end, items: row.items, method: row.method, model: row.model },
          { onConflict: "user_id,snapshot_date", ignoreDuplicates: true },
        );
      if (error) console.error("[trend/trendfit] user_trend_matches insert error:", error.message);
    },
    saveGeneration: async (row) => {
      const db = getSupabase();
      if (!db) return;
      const { error } = await db.from("ai_generations").insert({
        user_id: userId,
        feature: "trendfit",
        ref_id: end,
        input: { terms: row.terms },
        output: { items: row.items },
        model: row.model,
        usage: row.usage,
        status: "ok",
      });
      if (error) console.error("[trend/trendfit] ai_generations insert error:", error.message);
    },
  });
}

/** 재등록 성공 뒤 다시 고르게 한다. 실패는 로그만(등록 자체는 성공으로 돌려준다) */
export async function resetTrendFit(userId: string): Promise<void> {
  const db = getSupabase();
  if (db) {
    // snapshot_date 조건 없이 그 사용자 행 전부(키가 A1 끝 날짜라 '오늘 행'만 지우면 남는다)
    const { error } = await db.from("user_trend_matches").delete().eq("user_id", userId);
    if (error) console.error("[trend/trendfit] user_trend_matches delete error:", error.message);
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return; // 개발 메모리 저장소는 서버를 다시 띄우면 비워진다
  try {
    const { Redis } = await import("@upstash/redis");
    await new Redis({ url, token }).del(`ai:trendfit:d:${userId}:${utcDate(Date.now())}`);
  } catch (e) {
    console.error("[trend/trendfit] trendfit lock delete error:", e);
  }
}
