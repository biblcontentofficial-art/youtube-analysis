/**
 * C8 내 채널 등록(서버 전용, roadmap T10). 테이블 user_channels(supabase/migrations/trend_dev.sql).
 *
 *   getUserChannel(userId)            본인 행(없으면 null, 조회 실패면 'error')
 *   hasUserChannel(userId)            키워드 페이지 카드 자리를 정할 때(실패면 true: 카드 잎이 다시 묻는다)
 *   registerMyChannel(userId, input)  7일 제한 확인 → 기존 analyzeChannel(input) 1회 → topic_terms·recent_titles 저장(upsert)
 *
 * - 7일 제한: refreshed_at 이 7일 안이면 { error:'too_soon', nextAt }. 단 purge(30일)가 제목·통계를 비운 행은 바로 허용.
 * - analyzeChannel(src/app/my-channel/actions.ts, 수정하지 않음)은 핸들·검색어면 search.list 2회 + channels/videos 약 202 unit.
 *   '다시 분석'은 저장된 channel_id(UC…)로 부르므로 핸들 검색 100 unit 이 빠진다.
 * - topic_terms: 채널 설정 키워드 + 최근 영상 제목을 A1 과 같은 토크나이저(tokenize.ts, TOKEN_RULES)로 단어화해
 *   나온 제목 수가 많은 순 상위 30. 조사 떼기 근거(bareForms)는 terms.ts 처럼 같은 입력의 1차 토큰화로 만든다.
 * - 모든 쿼리에 user_id = 본인 조건(service role 이라 RLS 가 막아 주지 않는다).
 */
import { getSupabase } from "@/lib/supabase";
import { tokenizeTitle } from "./tokenize";
import { ALLOW_TERMS, STOP_WORDS, TAG_STOP, TOKEN_RULES } from "./rules";
import {
  TRENDFIT_LIMITS,
  isPurgedChannel,
  nextRefreshAt,
  type RecentTitle,
  type UserChannelRow,
} from "./trendfit-schema";

export const MY_CHANNEL_INPUT_MAX = 200;

const COLUMNS = "channel_id,channel_title,channel_thumb,subscriber_count,topic_terms,recent_titles,refreshed_at";

export type RegisteredChannel = { id: string; title: string; thumb: string | null; subscriberCount: number };

export type RegisterResult =
  | { ok: true; channel: RegisteredChannel; topic_terms: string[]; refreshed_at: string }
  | { ok: false; error: "too_soon"; nextAt: string }
  | { ok: false; error: "not_found" | "youtube_error" | "db" };

export async function getUserChannel(userId: string): Promise<UserChannelRow | null | "error"> {
  const db = getSupabase();
  if (!db) return "error";
  const { data, error } = await db.from("user_channels").select(COLUMNS).eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("[trend/my-channel] user_channels select error:", error.message);
    return "error";
  }
  return (data as UserChannelRow | null) ?? null;
}

export async function hasUserChannel(userId: string): Promise<boolean> {
  const row = await getUserChannel(userId);
  return row !== null;
}

/**
 * 채널 키워드 + 최근 제목 → 주제어 상위 30.
 * 한 제목(또는 키워드 한 개) 안 중복은 한 번만 센다. 같은 수면 먼저 나온 순.
 */
export function buildTopicTerms(keywords: string[], titles: string[]): string[] {
  const sources = [...keywords, ...titles].filter((s) => typeof s === "string" && s.trim());
  const bare = new Set<string>();
  const firstRules = { allowTerms: ALLOW_TERMS, tagStop: TAG_STOP };
  for (const s of sources) {
    const t = tokenizeTitle(s, { rules: firstRules });
    for (const w of t.words) bare.add(w);
    for (const w of t.tags) bare.add(w);
  }
  for (const w of STOP_WORDS) bare.add(w);

  const count = new Map<string, { n: number; first: number }>();
  sources.forEach((s, i) => {
    const t = tokenizeTitle(s, { rules: TOKEN_RULES, bareForms: bare });
    for (const w of new Set([...t.words, ...t.tags])) {
      const c = count.get(w);
      if (c) c.n++;
      else count.set(w, { n: 1, first: i });
    }
  });
  return [...count.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first)
    .slice(0, TRENDFIT_LIMITS.topicTerms)
    .map(([w]) => w);
}

/** analyzeChannel 의 오류 문장 → 오류 종류(채널을 못 찾은 두 경우만 not_found, 나머지는 YouTube 오류·쿼터) */
function classifyAnalyzeError(message: string): "not_found" | "youtube_error" {
  return /채널을 찾을 수 없습니다|채널 정보를 가져올 수 없습니다/.test(message) ? "not_found" : "youtube_error";
}

export async function registerMyChannel(userId: string, input: string): Promise<RegisterResult> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "db" };

  const existing = await getUserChannel(userId);
  if (existing === "error") return { ok: false, error: "db" };
  if (existing) {
    const nextAt = nextRefreshAt(existing.refreshed_at, isPurgedChannel(existing), Date.now());
    if (nextAt) return { ok: false, error: "too_soon", nextAt };
  }

  // 등록할 때만 불러온다(키워드 페이지가 hasUserChannel 때문에 이 파일을 불러도 서버 액션 모듈을 끌어오지 않게)
  const { analyzeChannel } = await import("@/app/my-channel/actions");
  const analysis = await analyzeChannel(input);
  if ("error" in analysis) return { ok: false, error: classifyAnalyzeError(analysis.error) };

  const recent: RecentTitle[] = analysis.recentVideos.slice(0, TRENDFIT_LIMITS.recentTitles).map((v) => ({
    title: v.title,
    publishedAt: v.publishedAt,
    viewCount: v.viewCount,
  }));
  const topicTerms = buildTopicTerms(analysis.channel.keywords ?? [], recent.map((r) => r.title));
  const refreshedAt = new Date().toISOString();
  const channel: RegisteredChannel = {
    id: analysis.channel.id,
    title: analysis.channel.title,
    thumb: analysis.channel.thumbnail || null,
    subscriberCount: analysis.channel.subscriberCount,
  };

  const { error } = await db.from("user_channels").upsert(
    {
      user_id: userId,
      channel_id: channel.id,
      channel_title: channel.title,
      channel_thumb: channel.thumb,
      subscriber_count: channel.subscriberCount,
      topic_terms: topicTerms,
      recent_titles: recent,
      refreshed_at: refreshedAt,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[trend/my-channel] user_channels upsert error:", error.message);
    return { ok: false, error: "db" };
  }
  return { ok: true, channel, topic_terms: topicTerms, refreshed_at: refreshedAt };
}
