/**
 * B6 썸네일 비교 보드 순수 함수(외부 의존성 없음, 상대 경로만).
 * 근거: docs/trend-dev/spec.md 3.6 · 4.1 · 4.2 · 4.5 · 5.2 · roadmap T8
 *
 *   pickTop(videos, 16, format)       지금 결과에서 길이(전체·롱폼·쇼츠)로 거른 뒤 조회수 순 상위 n개(격자, 무료·API 호출 없음)
 *   parseThumbsRequest(body)          요청 본문 검사(query 50자, videos 1~16개, videoId 11자 정규식). plan 필드는 읽지 않는다
 *   buildThumbsContent({query,videos}) user 메시지 블록. 검색어는 <user_query>, 번호·제목·조회수 JSON 은 <videos> 안(모두 escapeForTag),
 *                                     이어서 '썸네일 n:' 텍스트 + 이미지 블록. 이미지 URL 은 videoId 로만 만든다(외부 URL 받지 않음)
 *   validateThumbs(raw)               모델 출력 손 검증. 통과 못 하면 null → after_output(차감)
 *   runThumbs(deps)                   POST /api/ai/thumbs 의 순서(로그인 → 본문 → 키 → 플랜 → 예약 → 호출 → 정산 → 저장)
 *
 * Node 의 타입 제거 실행(scripts/trend/thumbs.test.mjs)으로 바로 불러오므로 enum·namespace·@/ 별칭을 쓰지 않는다.
 */
import { escapeForTag } from "../escape";
import { REMIX_SYSTEM, VIDEO_ID_RE, cleanLine } from "./remix-schema";

// ─── 한도 ───────────────────────────────────────────────────────────────

export const THUMBS_LIMITS = {
  query: 50,
  title: 100,
  maxVideos: 16,
  finding: 80,
  evidence: 30,
  tip: 100,
  text: 40,
  color: 12,
} as const;

/** 쇼츠 경계(초). VideoCard·KeywordInsights 와 같은 기준(길이 모르면 롱폼) */
const SHORTS_MAX_SEC = 180;
const MAX_COUNT = 1e13;

/** 요청 시작부터 55초(함수 maxDuration 60초 안에서 저장·정산 시간을 남긴다) */
export const THUMBS_DEADLINE_MS = 55_000;

// ─── 타입 ───────────────────────────────────────────────────────────────

export type ThumbsFormat = "all" | "long" | "shorts";

/** 격자 칸 하나. id 는 videoId(격자는 key={t.id}) */
export type ThumbItem = { id: string; title: string; viewCount: number; thumbnail: string; durationSeconds?: number };

export type ThumbsVideo = { videoId: string; title: string; viewCount: number };

export type ThumbsAspect = "글자 수" | "색" | "얼굴" | "구도" | "기타";

export type ThumbsResult = {
  common: { aspect: ThumbsAspect; finding: string; evidence: string }[];
  tips: string[];
  per_thumb: { index: number; has_face: boolean | null; text: string | null; text_length: number | null; colors: string[] }[];
};

// ─── 격자 ───────────────────────────────────────────────────────────────

export function isShorts(durationSeconds: number | undefined): boolean {
  return (durationSeconds ?? 9999) <= SHORTS_MAX_SEC;
}

/** 지금 결과에서 길이로 거른 뒤 조회수 순 상위 n개. 원본 배열은 바꾸지 않는다(같은 videoId 는 한 번만) */
export function pickTop<T extends { videoId: string; viewCount: number; durationSeconds?: number }>(
  videos: readonly T[],
  n: number = THUMBS_LIMITS.maxVideos,
  format: ThumbsFormat = "all",
): T[] {
  const seen = new Set<string>();
  return videos
    .filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      if (format === "shorts") return isShorts(v.durationSeconds);
      if (format === "long") return !isShorts(v.durationSeconds);
      return true;
    })
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (b.v.viewCount || 0) - (a.v.viewCount || 0) || a.i - b.i)
    .slice(0, Math.max(0, n))
    .map(({ v }) => v);
}

/** 서버가 만드는 썸네일 주소. videoId 형식이 아니면 null */
export function thumbUrl(videoId: string): string | null {
  return VIDEO_ID_RE.test(videoId) ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;
}

// ─── 요청 본문 ──────────────────────────────────────────────────────────

export type ThumbsRequest = { query: string; videos: ThumbsVideo[] };

export type ThumbsParseResult =
  | { ok: true; value: ThumbsRequest }
  | { ok: false; error: "invalid_query" | "invalid_videos" | "invalid_body" };

function count(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > MAX_COUNT) return null;
  return Math.floor(n);
}

/**
 * 요청 본문 검사. 영상 값은 클라이언트가 보낸 것이라 위조할 수 있다: 형식·길이·개수만 본다(결과는 본인에게만 보인다).
 * videos 는 1~16개, videoId 는 ^[A-Za-z0-9_-]{11}$ 만. 하나라도 틀리면 400. 같은 videoId 는 하나로 합친다.
 * thumbnail 같은 다른 필드와 plan 은 읽지 않는다.
 */
export function parseThumbsRequest(body: unknown): ThumbsParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = body as { query?: unknown; videos?: unknown };
  const query = cleanLine(b.query, THUMBS_LIMITS.query);
  if (!query) return { ok: false, error: "invalid_query" };
  if (!Array.isArray(b.videos) || b.videos.length < 1 || b.videos.length > THUMBS_LIMITS.maxVideos) {
    return { ok: false, error: "invalid_videos" };
  }
  const seen = new Set<string>();
  const videos: ThumbsVideo[] = [];
  for (const raw of b.videos) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_videos" };
    const v = raw as Record<string, unknown>;
    const videoId = typeof v.videoId === "string" ? v.videoId : "";
    if (!VIDEO_ID_RE.test(videoId)) return { ok: false, error: "invalid_videos" };
    const viewCount = count(v.viewCount ?? 0);
    if (viewCount === null) return { ok: false, error: "invalid_videos" };
    if (seen.has(videoId)) continue;
    seen.add(videoId);
    videos.push({ videoId, title: cleanLine(v.title, THUMBS_LIMITS.title), viewCount });
  }
  return { ok: true, value: { query, videos } };
}

// ─── 프롬프트(spec 4.5) ─────────────────────────────────────────────────

/** spec 4.2 공통 system 규칙(사용자 입력·영상 제목은 넣지 않는다). B5 와 같은 문장 */
export const THUMBS_SYSTEM = REMIX_SYSTEM;

export type ThumbsContentBlock = { type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } };

/**
 * user 메시지 블록. 안내 문장에는 꺾쇠 태그를 쓰지 않아(태그 이름만 글자로) 태그 경계가 검색어·제목에만 생기게 한다.
 * videoId 형식이 아닌 항목은 건너뛰고, 번호는 남은 항목 순서(1부터)로 매긴다.
 */
export function buildThumbsContent({ query, videos }: { query: string; videos: readonly { videoId: string; title: string; viewCount: number }[] }): ThumbsContentBlock[] {
  const items = videos
    .map((v) => ({ v, url: thumbUrl(v.videoId) }))
    .filter((x): x is { v: (typeof videos)[number]; url: string } => x.url !== null)
    .slice(0, THUMBS_LIMITS.maxVideos);
  const n = items.length;
  const rows = items.map(({ v }, i) => ({ index: i + 1, title: v.title, view_count: v.viewCount }));
  const intro = [
    `user_query 태그 속 검색어의 상위 영상 썸네일 ${n}장이다. 번호 순서대로 본다.`,
    "공통점(common)을 글자 수, 색, 얼굴, 구도 중심으로 3~5줄 정리하고, 각 줄의 evidence 에 \"N개 중 M개\" 근거를 붙여 줘.",
    `썸네일마다(per_thumb, index 는 1~${n}) 얼굴이 보이는지, 큰 글자가 있으면 그 글자와 글자 수, 눈에 띄는 색 두 가지를 적어 줘.`,
    "보이지 않거나 확실하지 않으면 null.",
    "마지막으로 내 썸네일에 적용해 볼 점(tips) 2~3개.",
    `<user_query>${escapeForTag(query)}</user_query>`,
    `<videos>${escapeForTag(JSON.stringify(rows))}</videos>`,
  ].join("\n");
  const blocks: ThumbsContentBlock[] = [{ type: "text", text: intro }];
  items.forEach(({ url }, i) => {
    blocks.push({ type: "text", text: `썸네일 ${i + 1}:` });
    blocks.push({ type: "image", source: { type: "url", url } });
  });
  return blocks;
}

// ─── 출력 스키마(spec 4.5) ───────────────────────────────────────────────

/**
 * output_config.format 으로 보내는 스키마. spec 4.5 의 minItems·maxItems 는 뺐다(구조화 출력은 복잡한 배열 제약을 지원하지
 * 않고, 이 저장소는 SDK 대신 fetch 로 불러 제약을 자동으로 걷어 내 주지 않는다. remix-schema 와 같은 이유).
 * 개수는 프롬프트에 적고 validateThumbs 가 지킨다. null 이 되는 칸은 anyOf 로 적는다.
 */
export const THUMBS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["common", "tips", "per_thumb"],
  properties: {
    common: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["aspect", "finding", "evidence"],
        properties: {
          aspect: { type: "string", enum: ["글자 수", "색", "얼굴", "구도", "기타"] },
          finding: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
    tips: { type: "array", items: { type: "string" } },
    per_thumb: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "has_face", "text", "text_length", "colors"],
        properties: {
          index: { type: "integer" },
          has_face: { anyOf: [{ type: "boolean" }, { type: "null" }] },
          text: { anyOf: [{ type: "string" }, { type: "null" }] },
          text_length: { anyOf: [{ type: "integer" }, { type: "null" }] },
          colors: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

// ─── 출력 검증 ──────────────────────────────────────────────────────────

const CONTROL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069\uFEFF]/g;

/** URL·@핸들·전화번호(모든 칸) */
const CONTACT = [/https?:\/\//i, /\bwww\./i, /\.(?:com|net|kr|co|io|me|ly)\b/i, /@[\w.]{2,}/, /\d{2,4}-\d{3,4}-\d{4}/];
/** 계산값(공통점·적용해 볼 점): 근거는 개수로만(spec 4.2) */
const DERIVED = [/\d+(?:\.\d+)?\s*배/, /%/, /퍼센트/, /평균\s*대비/, /구독자\s*대비/];

const ASPECTS: readonly ThumbsAspect[] = ["글자 수", "색", "얼굴", "구도", "기타"];

const len = (s: string) => Array.from(s).length;

function cut(s: string, max: number): string {
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join("").trim() : s;
}

/** 긴 하이픈(U+2014)은 쉼표로, 제어 문자 제거, 공백 한 칸 */
function tidy(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s*\u2014\s*/g, ", ").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

const hasAny = (s: string, list: RegExp[]) => list.some((re) => re.test(s));

/**
 * 모델 출력 검증(spec 4.5, roadmap T8).
 * - common: 금지 패턴(URL·@핸들·전화번호·계산값) 줄과 빈 줄을 버리고 앞 5개. 3개 미만이면 null.
 *   aspect 가 목록 밖이면 '기타'. finding 80자 · evidence 30자로 자른다
 * - tips: 같은 기준으로 거르고 앞 3개(각 100자). 2개 미만이면 null
 * - per_thumb: index 가 1~n(n = 보낸 썸네일 수) 안인 것만, 같은 index 는 처음 것만. has_face 는 boolean 이 아니면 null,
 *   text 는 연락처 패턴이면 null(40자로 자름), text_length 는 0~99 정수가 아니면 null, colors 는 문자열 앞 2개(각 12자)
 * - 모든 문자열의 긴 하이픈(U+2014)은 쉼표로 바꾼다
 */
export function validateThumbs(raw: unknown, n: number = THUMBS_LIMITS.maxVideos): ThumbsResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const common = (Array.isArray(r.common) ? r.common : [])
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const finding = cut(tidy(o.finding), THUMBS_LIMITS.finding);
      const evidence = cut(tidy(o.evidence), THUMBS_LIMITS.evidence);
      if (len(finding) < 1 || hasAny(finding, CONTACT) || hasAny(finding, DERIVED)) return null;
      if (hasAny(evidence, CONTACT) || hasAny(evidence, DERIVED)) return null;
      const aspect = ASPECTS.includes(o.aspect as ThumbsAspect) ? (o.aspect as ThumbsAspect) : "기타";
      return { aspect, finding, evidence };
    })
    .filter((c): c is ThumbsResult["common"][number] => c !== null)
    .slice(0, 5);
  if (common.length < 3) return null;

  const tips = (Array.isArray(r.tips) ? r.tips : [])
    .map((t) => cut(tidy(t), THUMBS_LIMITS.tip))
    .filter((t) => len(t) > 0 && !hasAny(t, CONTACT) && !hasAny(t, DERIVED))
    .slice(0, 3);
  if (tips.length < 2) return null;

  const seen = new Set<number>();
  const per_thumb: ThumbsResult["per_thumb"] = [];
  for (const p of Array.isArray(r.per_thumb) ? r.per_thumb : []) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const index = o.index;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 1 || index > n || seen.has(index)) continue;
    seen.add(index);
    const text0 = cut(tidy(o.text), THUMBS_LIMITS.text);
    const text = text0 && !hasAny(text0, CONTACT) ? text0 : null;
    const tl = o.text_length;
    const text_length = typeof tl === "number" && Number.isInteger(tl) && tl >= 0 && tl <= 99 ? tl : null;
    const colors = (Array.isArray(o.colors) ? o.colors : [])
      .map((c) => cut(tidy(c), THUMBS_LIMITS.color))
      .filter((c) => len(c) > 0 && !hasAny(c, CONTACT))
      .slice(0, 2);
    per_thumb.push({ index, has_face: typeof o.has_face === "boolean" ? o.has_face : null, text, text_length, colors });
  }
  per_thumb.sort((a, b) => a.index - b.index);

  return { common, tips, per_thumb };
}

/**
 * 칸 아래 태그(spec 3.6): '얼굴' · '글자 n자'. 글자 수는 모델 값(text_length)을 먼저 쓰고, 없으면 글자에서 공백을 빼고 센다.
 */
export function thumbTags(p: ThumbsResult["per_thumb"][number] | undefined): string[] {
  if (!p) return [];
  const tags: string[] = [];
  if (p.has_face === true) tags.push("얼굴");
  const n = p.text_length ?? (p.text ? len(p.text.replace(/\s/g, "")) : null);
  if (n !== null && n > 0) tags.push(`글자 ${n}자`);
  return tags;
}

// ─── API 순서(route.ts 가 deps 를 넣어 부른다) ───────────────────────────

type Usage = { input_tokens: number; output_tokens: number };

/** ClaudeResult(lib/claude.ts)와 같은 모양. 순수 모듈이라 import 대신 구조만 맞춘다 */
export type ThumbsCallResult =
  | { status: "ok"; data: ThumbsResult; model: string; usage: Usage }
  | { status: "unavailable" }
  | { status: "refused"; usage?: Usage }
  | { status: "error"; phase: "before_output" | "after_output" | "timeout"; message: string; usage?: Usage };

export type ThumbsReserve =
  | { ok: true; reservationId: string; used: number; limit: number }
  | { ok: false; reason: "limit" | "global_limit" | "limit_unavailable"; used?: number; limit?: number };

export type ThumbsResponseBody = {
  data?: ThumbsResult;
  /** 분석한 썸네일 순서(per_thumb.index 1 = videoIds[0]) */
  videoIds?: string[];
  error?: "unauthorized" | "invalid_query" | "invalid_videos" | "invalid_body" | "ai_unavailable" | "limit" | "ai_temporary" | "generation_failed";
  charged: boolean;
  remaining?: number;
  used?: number;
  limit?: number;
};

export type ThumbsDeps = {
  userId: string | null;
  body: unknown;
  now: () => number;
  /** 요청을 받은 시각(route POST 첫 줄). 마감 = startedAt + THUMBS_DEADLINE_MS. 없으면 now() */
  startedAt?: number;
  /** 서버에서 profiles 로 읽은 플랜(auth.ts getUserPlan). 본문 값은 쓰지 않는다 */
  getPlan: (userId: string) => Promise<string>;
  /** Claude 키가 있는지(claudeAvailable) */
  available: () => boolean;
  reserve: (userId: string, plan: string) => Promise<ThumbsReserve>;
  /** n = 보낸 썸네일 수(검증 때 index 범위) */
  call: (content: ThumbsContentBlock[], n: number, deadline: number) => Promise<ThumbsCallResult>;
  settle: (reservation: { ok: true; reservationId: string; used: number; limit: number }, result: ThumbsCallResult) => Promise<{ charged: boolean }>;
  /** 성공 결과 저장(ai_generations). 실패해도 응답은 그대로 */
  save: (row: { userId: string; query: string; input: { query: string; videoIds: string[] }; output: ThumbsResult; model: string; usage: unknown }) => Promise<void>;
};

export async function runThumbs(d: ThumbsDeps): Promise<{ status: number; body: ThumbsResponseBody }> {
  const startedAt = d.startedAt ?? d.now();
  if (!d.userId) return { status: 401, body: { error: "unauthorized", charged: false } };

  const parsed = parseThumbsRequest(d.body);
  if (!parsed.ok) return { status: 400, body: { error: parsed.error, charged: false } };

  // 키가 없으면 예약·호출 없이 503(횟수 그대로)
  if (!d.available()) return { status: 503, body: { error: "ai_unavailable", charged: false } };

  const plan = await d.getPlan(d.userId);
  const reservation = await d.reserve(d.userId, plan);
  if (!reservation.ok) {
    if (reservation.reason === "limit") {
      const used = reservation.used ?? 0;
      const limit = reservation.limit ?? 0;
      return { status: 429, body: { error: "limit", used, limit, remaining: Math.max(0, limit - used), charged: false } };
    }
    return { status: 503, body: { error: "ai_unavailable", charged: false } };
  }

  const { query, videos } = parsed.value;
  const videoIds = videos.map((v) => v.videoId);
  const result = await d.call(buildThumbsContent({ query, videos }), videos.length, startedAt + THUMBS_DEADLINE_MS);
  const { charged } = await d.settle(reservation, result);
  const remaining = Math.max(0, reservation.limit - reservation.used - (charged ? 1 : 0));

  if (result.status === "ok") {
    try {
      await d.save({ userId: d.userId, query, input: { query, videoIds }, output: result.data, model: result.model, usage: result.usage });
    } catch (e) {
      console.error("[thumbs] save error:", e);
    }
    return { status: 200, body: { data: result.data, videoIds, charged, remaining } };
  }
  // 차감 여부(charged)로 화면 문구를 고른다: false → AiTemporaryError, true → AiChargedError
  if (!charged) return { status: 503, body: { error: "ai_temporary", charged, remaining } };
  return { status: 502, body: { error: "generation_failed", charged, remaining } };
}
