/**
 * C8 '내 채널에 맞는 주제' 순수 함수(외부 의존성 없음, 상대 경로만).
 * 근거: docs/trend-dev/spec.md 3.8 · 4.6 · roadmap T10
 *
 *   TRENDFIT_SCHEMA / TRENDFIT_SYSTEM   구조화 출력 스키마(spec 4.6)와 공통 system 규칙(spec 4.2, remix 와 같은 문장)
 *   buildTrendFitPrompt(...)            user 메시지. 내 채널 주제어·최근 제목·급상승 키워드는 escapeForTag 를 거쳐 태그 안에만
 *   validateTrendFit(raw, risingTerms)  모델 출력 손 검증: rising 에 없는 term 버림, 금지 패턴 줄 버림, 최대 8개
 *   overlapFallback(topic, rising, titles)  키 없음·실패·시간 초과 대체(method=overlap): 같거나 2글자 이상 포함 관계
 *   runTrendFit(deps)                   getTrendFit 의 순서(캐시 → 만료 → 하루 1회 잠금 → 호출 → 저장). DB·Redis·Claude 는 deps 로 받아
 *                                       node --test(scripts/trend/trendfit.test.mjs)에서 메모리 구현으로 시험한다
 *   kstMonthDay(iso)                    '10월 21일'(다시 분석 가능 날짜 캡션)
 *
 * Node 의 타입 제거 실행으로 바로 불러오므로 enum·namespace·@/ 별칭을 쓰지 않는다.
 */
import { escapeForTag } from "../escape";
import { withTopic } from "../josa";
import { REMIX_SYSTEM } from "./remix-schema";
import { hasBannedPattern } from "./briefing-schema";

// ─── 한도 ───────────────────────────────────────────────────────────────

export const TRENDFIT_LIMITS = {
  /** 화면·저장 최대 개수 */
  items: 8,
  /** 프롬프트에 넣는 급상승 키워드 수(A1 상위) */
  rising: 50,
  /** 내 채널 주제어 수 */
  topicTerms: 30,
  /** 최근 영상 제목 수 */
  recentTitles: 30,
  /** 이유 한 줄 상한(프롬프트는 40자 안으로 부탁하고, 검증은 조금 넉넉히 본다) */
  reason: 60,
  /** 포함 관계로 볼 때 짧은 쪽 최소 글자 수 */
  overlapMinChars: 2,
} as const;

/** 다시 분석 간격(일). YouTube 쿼터(등록 1회 약 202 unit) 때문에 7일에 한 번 */
export const TRENDFIT_REFRESH_DAYS = 7;
/** 요청 마감(요청 시작 + 55초)과 C8 시간 상한(spec 4.1) */
export const TRENDFIT_DEADLINE_MS = 55_000;
export const TRENDFIT_CAP_MS = 15_000;
export const TRENDFIT_MAX_TOKENS = 2000;

// ─── 타입 ───────────────────────────────────────────────────────────────

export type TrendFitItem = { term: string; reason: string; covered: boolean };
export type TrendFitMethod = "ai" | "overlap";
export type RisingTermInput = { term: string; recentChannels: number; priorChannels: number };
export type RecentTitle = { title: string; publishedAt?: string | null; viewCount?: number | null };

/** 화면에 보이는 내 채널 정보(30일이 지나 비워졌으면 title·thumb 이 null) */
export type TrendFitChannel = { id: string; title: string | null; thumb: string | null };

/** GET /api/trend/fit 응답 */
export type TrendFitResponse =
  | { state: "locked" }
  | { state: "unregistered" }
  | { state: "expired"; channel: TrendFitChannel }
  | {
      state: "ready";
      channel: TrendFitChannel;
      method: TrendFitMethod;
      items: TrendFitItem[];
      /** 다시 분석 가능 시각(ISO). 지금 가능하면 null */
      nextAt: string | null;
      /** AI 기능이 켜져 있는지(overlap 안내 문장을 고른다) */
      aiReady: boolean;
    }
  | { state: "error" };

// ─── 출력 스키마(spec 4.6) ───────────────────────────────────────────────

/**
 * output_config.format 으로 보내는 스키마. maxItems 는 뺐다(remix-schema 와 같은 이유: fetch 로 부르므로
 * SDK 처럼 지원 안 되는 제약을 걷어 내 주지 않는다). 개수는 프롬프트에 적고 validateTrendFit 이 지킨다.
 */
export const TRENDFIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "reason", "covered"],
        properties: {
          term: { type: "string" },
          reason: { type: "string" },
          covered: { type: "boolean" },
        },
      },
    },
  },
} as const;

/** spec 4.2 공통 system 규칙(사용자 입력·제목은 넣지 않는다) */
export const TRENDFIT_SYSTEM = REMIX_SYSTEM;

// ─── 정리 도우미 ─────────────────────────────────────────────────────────

const CONTROL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069\uFEFF]/g;

function len(s: string): number {
  return Array.from(s).length;
}

function tidy(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s*\u2014\s*/g, ", ").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** 비교용 키: NFC · 소문자 · 앞 '#' 제거 · 공백 제거 */
export function fitKey(s: string): string {
  return s.normalize("NFC").toLowerCase().replace(/^#+/, "").replace(/\s+/g, "");
}

/** '{t}'와 / '{t}'과 (받침 규칙은 josa.ts 의 은/는 과 같다) */
function withAnd(word: string): string {
  return withTopic(word).endsWith("은") ? `'${word}'과` : `'${word}'와`;
}

// ─── 프롬프트(spec 4.6) ──────────────────────────────────────────────────

export function buildTrendFitPrompt({
  topicTerms,
  recentTitles,
  rising,
}: {
  topicTerms: string[];
  recentTitles: RecentTitle[];
  rising: RisingTermInput[];
}): string {
  const topics = topicTerms.slice(0, TRENDFIT_LIMITS.topicTerms);
  const titles = recentTitles
    .map((t) => tidy(t?.title))
    .filter(Boolean)
    .slice(0, TRENDFIT_LIMITS.recentTitles);
  const terms = rising.slice(0, TRENDFIT_LIMITS.rising).map((r) => ({
    term: r.term,
    recent_channels: r.recentChannels,
    prior_channels: r.priorChannels,
  }));
  return [
    "내 채널의 주제어와 최근 영상 제목, 그리고 이번 주 급상승 키워드 목록이다.",
    `급상승 키워드 중 내 채널 주제와 실제로 관련 있는 것만 최대 ${TRENDFIT_LIMITS.items}개 골라 줘. 억지로 연결하지 않는다.`,
    "각각 왜 관련 있는지 한 줄(40자 이내), 최근 제목에서 이미 다뤘는지(covered) 표시.",
    "term 은 rising_terms 안의 term 값을 글자 그대로 쓴다. 관련 있는 것이 없으면 items 를 빈 배열로 둔다.",
    `<my_topic_terms>${escapeForTag(JSON.stringify(topics))}</my_topic_terms>`,
    `<my_recent_titles>${escapeForTag(JSON.stringify(titles))}</my_recent_titles>`,
    `<rising_terms>${escapeForTag(JSON.stringify(terms))}</rising_terms>`,
  ].join("\n");
}

// ─── 출력 검증 ──────────────────────────────────────────────────────────

/**
 * 모델 출력 검증(spec 4.6).
 * - items 가 배열이 아니면 null(스키마 위반 → after_output)
 * - 줄마다: term 이 risingTerms 에 없으면 버림(표기는 risingTerms 쪽 원래 글자로), 같은 term 두 번째부터 버림,
 *   reason 은 긴 하이픈을 ', ' 로 바꾼 뒤 1~60자가 아니거나 URL·@핸들·전화번호·계산값이 있으면 그 줄을 버림,
 *   covered 가 boolean 이 아니면 false
 * - 최대 8개. 0개는 정상('억지로 연결하지 않는다')
 */
export function validateTrendFit(raw: unknown, risingTerms: readonly string[]): TrendFitItem[] | null {
  if (!raw || typeof raw !== "object") return null;
  const list = (raw as { items?: unknown }).items;
  if (!Array.isArray(list)) return null;

  const allowed = new Map<string, string>();
  for (const t of risingTerms) {
    if (typeof t === "string" && t) allowed.set(fitKey(t), t);
  }

  const out: TrendFitItem[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (out.length >= TRENDFIT_LIMITS.items) break;
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.term !== "string") continue;
    const key = fitKey(r.term);
    const term = allowed.get(key);
    if (!term || seen.has(key)) continue;
    const reason = tidy(r.reason);
    const n = len(reason);
    if (n < 1 || n > TRENDFIT_LIMITS.reason || hasBannedPattern(reason)) continue;
    seen.add(key);
    out.push({ term, reason, covered: r.covered === true });
  }
  return out;
}

// ─── 대체: 단어 겹침(method=overlap) ─────────────────────────────────────

/** 두 단어가 같거나, 짧은 쪽이 2글자 이상이고 긴 쪽에 들어 있으면 true */
export function termsOverlap(a: string, b: string): boolean {
  const x = fitKey(a);
  const y = fitKey(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = len(x) <= len(y) ? [x, y] : [y, x];
  return len(short) >= TRENDFIT_LIMITS.overlapMinChars && long.includes(short);
}

/**
 * spec 4.6 대체 규칙: topic_terms 와 급상승 키워드가 같거나 한쪽이 다른 쪽을 포함(짧은 쪽 2글자 이상)하는 것만.
 * 순서는 급상승 키워드 순(A1 순위), reason `내 채널 주제어 '{t}'와 겹침`, covered 는 최근 제목(공백 없앤 소문자)에
 * 그 키워드가 들어 있는지. 최대 8개.
 */
export function overlapFallback(
  topicTerms: readonly string[],
  rising: readonly (RisingTermInput | string)[],
  recentTitles: readonly (RecentTitle | string)[] | null | undefined,
): TrendFitItem[] {
  const topics = topicTerms.filter((t): t is string => typeof t === "string" && fitKey(t).length > 0);
  const titles = (recentTitles ?? [])
    .map((t) => fitKey(typeof t === "string" ? t : t?.title ?? ""))
    .filter(Boolean);
  const out: TrendFitItem[] = [];
  const seen = new Set<string>();
  for (const r of rising) {
    if (out.length >= TRENDFIT_LIMITS.items) break;
    const term = typeof r === "string" ? r : r?.term;
    if (typeof term !== "string") continue;
    const key = fitKey(term);
    if (!key || seen.has(key)) continue;
    const topic = topics.find((t) => termsOverlap(t, term));
    if (!topic) continue;
    seen.add(key);
    out.push({
      term,
      reason: `내 채널 주제어 ${withAnd(topic)} 겹침`,
      covered: titles.some((title) => title.includes(key)),
    });
  }
  return out;
}

// ─── 날짜 ───────────────────────────────────────────────────────────────

/** ISO 시각 → 한국 날짜 '10월 21일'. 읽을 수 없으면 빈 문자열 */
export function kstMonthDay(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

/** 다시 분석 가능 시각(refreshed_at + 7일). 비워진 행(30일 지남)이거나 이미 지났으면 null */
export function nextRefreshAt(refreshedAt: string | null | undefined, purged: boolean, now: number): string | null {
  if (purged || !refreshedAt) return null;
  const t = Date.parse(refreshedAt);
  if (!Number.isFinite(t)) return null;
  const next = t + TRENDFIT_REFRESH_DAYS * 86400_000;
  return next > now ? new Date(next).toISOString() : null;
}

// ─── 순서(getTrendFit) ──────────────────────────────────────────────────

/** user_channels 한 행(필요한 칼럼만) */
export type UserChannelRow = {
  channel_id: string;
  channel_title: string | null;
  channel_thumb: string | null;
  subscriber_count: number | null;
  topic_terms: string[] | null;
  recent_titles: RecentTitle[] | null;
  refreshed_at: string;
};

/** purge(30일)가 제목·썸네일·구독자 수·최근 제목을 비운 행 */
export function isPurgedChannel(row: Pick<UserChannelRow, "channel_title" | "channel_thumb" | "subscriber_count" | "recent_titles">): boolean {
  return row.channel_title == null && row.channel_thumb == null && row.subscriber_count == null && row.recent_titles == null;
}

export type StoredMatch = { items: TrendFitItem[]; method: TrendFitMethod };

export type TrendFitCallResult =
  | { status: "ok"; data: TrendFitItem[]; model: string; usage: { input_tokens: number; output_tokens: number } }
  | { status: "unavailable" }
  | { status: "refused"; usage?: unknown }
  | { status: "error"; phase: "before_output" | "after_output" | "timeout"; message: string; usage?: unknown };

export type TrendFitDeps = {
  userId: string;
  /** A1 비교 기준 끝 날짜(user_trend_matches.snapshot_date) */
  end: string;
  now: () => number;
  /** null = 미등록. 'error' = 조회 실패 */
  readChannel: () => Promise<UserChannelRow | null | "error">;
  /** 오늘(end) 저장된 결과. 없으면 null */
  readMatch: () => Promise<StoredMatch | null | "error">;
  /** A1 상위어(롱폼, state 'top' 이어도 쓴다). 'error' = 불러오기 실패 */
  readRising: () => Promise<RisingTermInput[] | "error">;
  /** 키·AI 스위치가 켜져 있는지(claudeAvailable) */
  available: () => boolean;
  /** 하루 한 번 잠금(SET NX). 잡으면 true */
  once: () => Promise<boolean>;
  /** 전체 하루 예산 자리 잡기. null 이면 부르지 않는다(사용자 AI 횟수는 차감하지 않음) */
  reserve: () => Promise<string | null>;
  /** 예약 정리: Claude 가 실제로 돌았으면 commit(전체 하루 예산 +1), 아니면 release */
  settle: (reservationId: string, ran: boolean) => Promise<void>;
  call: (prompt: string, risingTerms: string[], deadline: number) => Promise<TrendFitCallResult>;
  /** insert ... on conflict (user_id, snapshot_date) do nothing */
  insertMatch: (row: { items: TrendFitItem[]; method: TrendFitMethod; model: string | null }) => Promise<void>;
  /** ai_generations(feature 'trendfit', input 에는 term 목록만). 실패해도 응답은 그대로 */
  saveGeneration: (row: { terms: string[]; items: TrendFitItem[]; model: string; usage: unknown }) => Promise<void>;
};

function channelOf(row: UserChannelRow): TrendFitChannel {
  return { id: row.channel_id, title: row.channel_title, thumb: row.channel_thumb };
}

/**
 * getTrendFit 순서(roadmap T10).
 *  ① user_channels 없으면 unregistered. user_trend_matches(user_id, end) 가 있으면 그대로.
 *  ② user_channels 가 비워진 상태(30일 지남)면 expired.
 *  ③ 급상승 키워드를 읽는다(실패면 error, 0개면 저장 없이 빈 목록: 다음 수집 뒤 다시 계산).
 *  ④ 하루 1회 잠금(SET NX)을 못 잡으면 overlap 을 바로 계산해 돌려준다(저장은 잠금을 잡은 요청 몫).
 *  ⑤ 잡았으면 AI 가 켜져 있고 전체 하루 예산 안일 때만 Claude 한 번. 성공 'ai', 키 없음·실패·시간 초과는 'overlap'.
 *     결과는 method 와 함께 insert … on conflict do nothing(overlap 도 저장해 그날 다시 시도하지 않음).
 */
export async function runTrendFit(d: TrendFitDeps): Promise<TrendFitResponse> {
  const startedAt = d.now();
  const [channel, match] = await Promise.all([d.readChannel(), d.readMatch()]);
  if (channel === "error") return { state: "error" };
  if (!channel) return { state: "unregistered" };

  const purged = isPurgedChannel(channel);
  const ready = (method: TrendFitMethod, items: TrendFitItem[]): TrendFitResponse => ({
    state: "ready",
    channel: channelOf(channel),
    method,
    items,
    nextAt: nextRefreshAt(channel.refreshed_at, purged, d.now()),
    aiReady: d.available(),
  });

  if (match && match !== "error") return ready(match.method, match.items);
  if (purged) return { state: "expired", channel: channelOf(channel) };

  const rising = await d.readRising();
  if (rising === "error") return { state: "error" };
  const top = rising.slice(0, TRENDFIT_LIMITS.rising);
  if (top.length === 0) return ready("overlap", []);

  const topicTerms = (channel.topic_terms ?? []).slice(0, TRENDFIT_LIMITS.topicTerms);
  const recentTitles = channel.recent_titles ?? [];
  const overlap = () => overlapFallback(topicTerms, top, recentTitles);

  if (!(await d.once())) return ready("overlap", overlap());

  let method: TrendFitMethod = "overlap";
  let items: TrendFitItem[] | null = null;
  let model: string | null = null;

  if (d.available()) {
    const reservationId = await d.reserve();
    if (reservationId) {
      const terms = top.map((r) => r.term);
      let result: TrendFitCallResult;
      try {
        result = await d.call(buildTrendFitPrompt({ topicTerms, recentTitles, rising: top }), terms, startedAt + TRENDFIT_DEADLINE_MS);
      } catch (e) {
        result = { status: "error", phase: "before_output", message: e instanceof Error ? e.message : String(e) };
      }
      const ran = result.status === "ok" || result.status === "refused" || (result.status === "error" && result.phase !== "before_output");
      await d.settle(reservationId, ran);
      if (result.status === "ok") {
        method = "ai";
        items = result.data;
        model = result.model || null;
        await d.saveGeneration({ terms, items, model: result.model, usage: result.usage });
      }
    }
  }

  if (!items) items = overlap();
  await d.insertMatch({ items, method, model });
  return ready(method, items);
}
