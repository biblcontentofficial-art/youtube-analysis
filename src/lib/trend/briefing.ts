/**
 * cron 단계 brief(B4 오늘의 트렌드 브리핑, roadmap T6)와 화면용 조회 getBriefing. 서버 전용.
 * 프롬프트·스키마·검증은 briefing-schema.ts(순수), 테이블은 supabase/migrations/trend_dev.sql 의 trend_briefings.
 *
 * runBrief(date, { dry, deadline })
 *   1. dry 가 아니고 AI 를 부를 수 없으면(claude.ts: 키 없음 또는 AI_FEATURES_ENABLED 꺼짐) DB 를 읽지 않고 바로 skipped.
 *      detail 은 키가 없으면 'no_api_key', 키는 있는데 스위치가 꺼져 있으면 'ai_disabled'. trend_briefings 에 쓰지 않는다.
 *   2. 그날 집계 대상 행(isCountedRow: 가로 롱폼만, 소유자 결정 2026-10-16) 중 조회수÷구독자(ratio) 상위 30. 없으면 skipped(no_breakout_rows).
 *      쇼츠 목록은 넣지 않는다(프롬프트는 shorts_note 를 빈 문자열로 쓰게 하고, 검증이 null 로 바꾼다).
 *      프롬프트에는 { title, format, duration_sec, view_count, subscriber_count } 만(outlier·ratio 제외).
 *   3. rpc trend_rising_window → trend_rising_terms 로 그날 기준 롱폼 급상승 키워드 상위 15(실패·자료 부족이면 생략).
 *   4. 롱폼 상위 12개 썸네일 이미지 블록(주소는 video_id 로 서버가 만든다).
 *   5. dry 면 Claude 를 부르지 않고 { status:'ok', detail: { dry, prompt_chars, videos, ... } } 만 돌려준다.
 *   6. callClaudeJson({ tier:'main', effort:'medium', maxTokens:8000, capMs:40000, deadline }).
 *      첫 결과가 before_output(이미지 가져오기 실패 포함)이고 남은 시간이 25초 이상이면 이미지 없이 한 번 더(detail.retry_without_images).
 *   7. 성공이면 trend_briefings upsert(model, usage, input_stats, version 2). 실패(거절·검증 실패·시간 초과)는 예외로 던져
 *      trend_jobs 에 failed 로 남기고, 다음 실행의 따라잡기가 attempts < 3 까지 다시 시도한다(jobs.ts pendingBriefDate).
 *
 * 발송(메일·카카오)은 범위 밖. 붙일 때는 trend_briefings.bullets 를 그대로 읽되, 보내기 전 소유자 검토 단계를 먼저 넣는다.
 * 시험: scripts/trend/briefing.test.mjs(createBrief 에 모의 저장소·모의 호출을 넣는다). Node 직접 시험을 위해 상대 경로 import 만 쓴다.
 */
import { getSupabase } from "../supabase";
import { aiFeaturesEnabled, callClaudeJson, type ClaudeResult, type ClaudeUsage } from "../claude";
import { MIN_PRIOR_DAYS, MIN_RECENT_CHANNELS, MIN_RECENT_DAYS, SHORTS_MAX_SEC, TOP_MAX_DAY_RATIO, TOP_MIN_HIST_DAYS, isCountedRow, type CountedRowLike } from "./rules";
import {
  BRIEFING_LIMITS,
  BRIEFING_SCHEMA,
  BRIEFING_SYSTEM,
  BRIEFING_VERSION,
  buildBriefingContent,
  validateBriefing,
  type Briefing,
  type BriefingContentBlock,
  type BriefingData,
  type BriefingTerm,
  type BriefJob,
} from "./briefing-schema";
import type { StepDef, StepOutcome } from "./jobs";

/** Claude 호출 상한(spec 4.1: B4 40초) */
export const BRIEF_CAP_MS = 40_000;
/** 이미지 없이 다시 부를 때 필요한 남은 시간 */
export const BRIEF_RETRY_MIN_MS = 25_000;

/** breakout_videos 에서 읽는 칼럼 */
export type BriefSourceRow = CountedRowLike & {
  video_id: string;
  title: string | null;
  view_count: number | null;
  subscriber_count: number | null;
};

export type BriefingRow = {
  snapshot_date: string;
  bullets: Briefing["bullets"];
  long_note: string | null;
  shorts_note: string | null;
  body: unknown;
  model: string;
  input_stats: Record<string, unknown>;
  usage: ClaudeUsage;
  version: number;
  updated_at: string;
};

/** DB 접근(시험에서는 모의 객체로 바꾼다) */
export interface BriefStore {
  /** 그날 집계 대상 행(가로 롱폼) 중 ratio 상위 limit 개 */
  topVideos(date: string, limit: number): Promise<BriefSourceRow[]>;
  /** 그날 기준 롱폼 급상승 키워드 상위 limit. 자료가 부족하면 빈 배열 */
  risingTerms(date: string, limit: number): Promise<BriefingTerm[]>;
  saveBriefing(row: BriefingRow): Promise<void>;
}

export type BriefCall = (content: BriefingContentBlock[], deadline: number, capture: (raw: unknown) => void) => Promise<ClaudeResult<Briefing>>;

export type BriefDeps = {
  store: () => BriefStore;
  call: BriefCall;
  /** AI 기능 스위치(AI_FEATURES_ENABLED=1) */
  aiEnabled: () => boolean;
  /** 키가 있는가(ANTHROPIC_API_KEY) */
  hasKey: () => boolean;
  now?: () => number;
};

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function createBrief({ store, call, aiEnabled, hasKey, now = () => Date.now() }: BriefDeps) {
  async function runBrief(date: string, { dry, deadline }: { dry: boolean; deadline: number }): Promise<StepOutcome> {
    const started = now();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`bad date ${date}`);

    const keyOk = hasKey();
    const enabled = aiEnabled();
    if (!dry && (!keyOk || !enabled)) {
      return { status: "skipped", detail: keyOk ? "ai_disabled" : "no_api_key" };
    }

    const s = store();
    // 저장소가 이미 거르지만, 다른 저장소(시험·뒷날 바뀐 쿼리)가 쇼츠·세로·라이브를 섞어 보내도 여기서 한 번 더 뺀다
    const long = (await s.topVideos(date, BRIEFING_LIMITS.long)).filter(isCountedRow).slice(0, BRIEFING_LIMITS.long);
    if (!long.length) return { status: "skipped", detail: "no_breakout_rows" };

    let risingTerms: BriefingTerm[] = [];
    let risingError: string | undefined;
    try {
      risingTerms = (await s.risingTerms(date, BRIEFING_LIMITS.risingTerms)).slice(0, BRIEFING_LIMITS.risingTerms);
    } catch (e) {
      risingError = errMsg(e);
      console.error(`[trend/brief] rising terms ${date}:`, risingError);
    }

    const videos = long.map((v) => ({ ...v, title: v.title ?? "" }));
    const first = buildBriefingContent({ date, videos, risingTerms, withImages: true });
    const inputStats: Record<string, unknown> = {
      videos: videos.length,
      thumbnails: first.thumbnails,
      rising_terms: risingTerms.map((t) => t.term),
      prompt_chars: first.text.length,
    };
    if (risingError) inputStats.rising_terms_error = risingError;

    if (dry) {
      return {
        status: "ok",
        detail: { dry: true, would_call: keyOk && enabled, ai_enabled: enabled, has_key: keyOk, ...inputStats, ms: now() - started },
      };
    }

    let raw: unknown = null;
    const capture = (v: unknown) => {
      raw = v;
    };
    let result = await call(first.blocks, deadline, capture);
    let retried = false;
    if (result.status === "error" && result.phase === "before_output" && first.thumbnails > 0 && deadline - now() >= BRIEF_RETRY_MIN_MS) {
      retried = true;
      const second = buildBriefingContent({ date, videos, risingTerms, withImages: false });
      inputStats.first_error = result.message;
      inputStats.thumbnails = 0;
      inputStats.prompt_chars = second.text.length;
      raw = null;
      result = await call(second.blocks, deadline, capture);
    }

    if (result.status === "unavailable") return { status: "skipped", detail: "no_api_key" };
    if (result.status === "refused") throw new Error(`claude_refused${retried ? " (retry_without_images)" : ""}`);
    if (result.status === "error") {
      throw new Error(`claude_${result.phase}: ${result.message}${retried ? " (retry_without_images)" : ""}`);
    }

    const { bullets, long_note } = result.data;
    await s.saveBriefing({
      snapshot_date: date,
      bullets,
      long_note,
      // 쇼츠 목록을 넣지 않으므로 쇼츠 줄은 언제나 비운다(모델이 무언가 써도 화면에 '쇼츠' 줄이 생기지 않게)
      shorts_note: null,
      body: raw,
      model: result.model,
      input_stats: inputStats,
      usage: result.usage,
      version: BRIEFING_VERSION,
      updated_at: new Date(now()).toISOString(),
    });
    return {
      status: "ok",
      detail: { model: result.model, usage: result.usage, bullets: bullets.length, retry_without_images: retried, ...inputStats, ms: now() - started },
    };
  }

  return { runBrief };
}

// ─── 운영 저장소(Supabase service role) ─────────────────────────────────────

function requireDb() {
  const db = getSupabase();
  if (!db) throw new Error("supabase_unavailable");
  return db;
}

const SOURCE_COLUMNS = "video_id,title,duration_sec,video_format,view_count,subscriber_count,kind,category_id,outlier";

export const supabaseBriefStore: BriefStore = {
  async topVideos(date, limit) {
    const db = requireDb();
    // 집계 대상 행(trend_dev.sql 머리 주석): kind is null 이고 분류 칼럼이 생기기 전 수집 행이 아니고, 가로 롱폼(rules.ts isLongFormRow 와 같은 조건)
    const l = await db
      .from("breakout_videos")
      .select(SOURCE_COLUMNS)
      .eq("snapshot_date", date)
      .is("kind", null)
      .or("category_id.not.is.null,outlier.not.is.null")
      .or(`video_format.eq.long,and(video_format.is.null,duration_sec.gt.${SHORTS_MAX_SEC})`)
      .order("ratio", { ascending: false, nullsFirst: false })
      .order("video_id")
      .limit(limit);
    if (l.error) throw new Error(`breakout_videos long: ${l.error.message}`);
    return (l.data ?? []) as BriefSourceRow[];
  },

  async risingTerms(date, limit) {
    const db = requireDb();
    // rising.ts 와 같은 판정: 최근 7일 수집 일수가 적으면 생략, 이전 7일이 적으면 top(많이 나온 단어)
    const w = await db.rpc("trend_rising_window", { p_end: date, p_format: "long", p_shorts_max: SHORTS_MAX_SEC });
    if (w.error) throw new Error(`trend_rising_window: ${w.error.message}`);
    const win = (Array.isArray(w.data) ? w.data[0] : w.data) as { recent_days?: number; prior_days?: number } | null;
    if (!win || Number(win.recent_days ?? 0) < MIN_RECENT_DAYS) return [];
    const t = await db.rpc("trend_rising_terms", {
      p_end: date,
      p_format: "long",
      p_mode: Number(win.prior_days ?? 0) < MIN_PRIOR_DAYS ? "top" : "rising",
      p_min_recent: MIN_RECENT_CHANNELS,
      p_limit: limit,
      p_shorts_max: SHORTS_MAX_SEC,
      p_max_day_ratio: TOP_MAX_DAY_RATIO,
      p_min_hist_days: TOP_MIN_HIST_DAYS,
    });
    if (t.error) throw new Error(`trend_rising_terms: ${t.error.message}`);
    return ((t.data ?? []) as { term?: unknown; term_type?: unknown; recent_channels?: unknown }[])
      .filter((r) => r && typeof r.term === "string")
      .slice(0, limit)
      .map((r) => ({ term: r.term_type === "tag" ? `#${r.term}` : String(r.term), channels: Number(r.recent_channels) || 0 }));
  },

  async saveBriefing(row) {
    const { error } = await requireDb().from("trend_briefings").upsert(row, { onConflict: "snapshot_date" });
    if (error) throw new Error(`trend_briefings upsert: ${error.message}`);
  },
};

/** 운영 호출: 공용 클라이언트(claude.ts)에 B4 설정을 넣는다 */
const claudeBriefCall: BriefCall = (content, deadline, capture) =>
  callClaudeJson<Briefing>({
    tier: "main",
    effort: "medium",
    system: BRIEFING_SYSTEM,
    content,
    schema: BRIEFING_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 8000,
    capMs: BRIEF_CAP_MS,
    deadline,
    validate: (v) => {
      capture(v);
      return validateBriefing(v);
    },
  });

export const brief = createBrief({
  store: () => supabaseBriefStore,
  call: claudeBriefCall,
  aiEnabled: aiFeaturesEnabled,
  hasKey: () => !!process.env.ANTHROPIC_API_KEY,
});

/** jobs 레지스트리에 등록하는 단계 정의(scope 'date'). 따라잡기 날짜 고르기는 jobs.ts pendingBriefDate */
export const briefStep: StepDef = {
  scope: "date",
  run: (date, { dry, deadline }) => brief.runBrief(date, { dry, deadline }),
};

// ─── 화면용 조회 ──────────────────────────────────────────────────────────

/**
 * 영상 탭 브리핑 카드 데이터: trend_briefings 한 행 + trend_jobs(date, brief) 상태를 함께 읽는다.
 * AI 스위치가 꺼져 있으면 DB 를 읽지 않는다(화면은 '준비 중' 한 줄). 예외를 던지지 않는다(실패는 error: true).
 */
export async function getBriefing(date: string): Promise<BriefingData> {
  if (!aiFeaturesEnabled()) return { briefing: null, briefJob: null, ai: "off" };
  const ai = process.env.ANTHROPIC_API_KEY ? "ready" : "no_key";
  const db = getSupabase();
  if (!db) return { briefing: null, briefJob: null, ai, error: true };
  try {
    const [b, j] = await Promise.all([
      db.from("trend_briefings").select("bullets,long_note,shorts_note").eq("snapshot_date", date).maybeSingle(),
      db.from("trend_jobs").select("status,detail").eq("job_date", date).eq("step", "brief").maybeSingle(),
    ]);
    if (b.error || j.error) {
      console.error("[trend/brief] getBriefing:", b.error?.message ?? j.error?.message);
      return { briefing: null, briefJob: null, ai, error: true };
    }
    // 저장된 행도 한 번 더 검증해 화면에 금지 패턴이 나오지 않게 한다(손으로 고친 행 등)
    const briefing = b.data ? validateBriefing(b.data) : null;
    const briefJob = (j.data as BriefJob | null) ?? null;
    return { briefing, briefJob, ai };
  } catch (e) {
    console.error("[trend/brief] getBriefing:", errMsg(e));
    return { briefing: null, briefJob: null, ai, error: true };
  }
}
