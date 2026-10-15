/**
 * B4 오늘의 트렌드 브리핑 순수 함수(외부 의존성 없음, 상대 경로만).
 * 근거: docs/trend-dev/spec.md 3.4 · 4.1 · 4.2 · 4.3 · roadmap T6
 *
 *   BRIEFING_SCHEMA                    output_config.format 으로 보내는 JSON 스키마(spec 4.3, 배열 개수 제약은 뺌)
 *   buildBriefingPrompt({ date, videos, risingTerms, withImages })
 *                                      user 텍스트. videos·rising_terms JSON 은 escapeForTag 를 거쳐 태그 안에만.
 *                                      videos 는 { title, format, duration_sec, view_count, subscriber_count } 만 남긴다(outlier·ratio 없음)
 *   buildBriefingContent(...)          위 텍스트 + 롱폼 앞 12개 썸네일 이미지 블록(주소는 video_id 로 서버가 만든다)
 *   validateBriefing(raw)              모델 출력 손 검증. 통과 못 하면 null → after_output
 *
 * 화면(BriefingCard)과 cron(briefing.ts)이 같은 타입을 쓴다.
 * Node 의 타입 제거 실행(scripts/trend/briefing.test.mjs)으로 바로 불러오므로 enum·namespace·@/ 별칭을 쓰지 않는다.
 */
import { escapeForTag } from "../escape";
import { REMIX_SYSTEM, VIDEO_ID_RE } from "./remix-schema";

// ─── 한도 ───────────────────────────────────────────────────────────────

export const BRIEFING_LIMITS = {
  /** 롱폼 입력 영상 수(조회수÷구독자 상위) */
  long: 30,
  /** 쇼츠 입력 영상 수 */
  shorts: 20,
  /** 썸네일 이미지 블록 수(롱폼 상위) */
  thumbnails: 12,
  /** 급상승 키워드 입력 수 */
  risingTerms: 15,
  /** 브리핑 줄 수 */
  minBullets: 3,
  maxBullets: 5,
  /** 한 줄(bullet text·note) 최대 글자 수 */
  text: 80,
  /** 입력 제목 최대 글자 수 */
  title: 120,
} as const;

/** 프롬프트 판 번호. 소유자가 첫 일주일 결과를 읽고 프롬프트를 고치면 올린다(trend_briefings.version) */
export const BRIEFING_VERSION = 2;

/** 쇼츠 경계(초). lib/breakout.ts·rules.ts 의 SHORTS_MAX_SEC 와 같은 값 */
const SHORTS_MAX_SEC = 180;

// ─── 타입 ───────────────────────────────────────────────────────────────

export type BriefingLabel = "포맷" | "제목" | "썸네일" | "주제";
export const BRIEFING_LABELS: readonly BriefingLabel[] = ["포맷", "제목", "썸네일", "주제"];

export type BriefingBullet = { label: BriefingLabel; text: string };

/** 검증을 통과한 브리핑(trend_briefings 의 bullets·long_note·shorts_note 와 같은 모양) */
export type Briefing = { bullets: BriefingBullet[]; long_note: string | null; shorts_note: string | null };

/** 프롬프트에 넣는 영상(이 다섯 칸만) */
export type BriefingVideo = {
  title: string;
  format: "long" | "shorts";
  duration_sec: number;
  view_count: number;
  subscriber_count: number;
};

/** 프롬프트에 넣는 급상승 키워드(최근 7일 서로 다른 채널 수) */
export type BriefingTerm = { term: string; channels: number };

/** trend_jobs 의 brief 기록 중 화면이 보는 칸 */
export type BriefJob = { status: "running" | "ok" | "skipped" | "failed"; detail: unknown };

/**
 * 화면에 넘기는 브리핑 상태(getBriefing 이 만든다).
 * ai: off = AI 기능 스위치 꺼짐(준비 중), no_key = 켜졌지만 키 없음, ready = 켜짐 + 키 있음.
 * error: 조회 실패(카드·문구 모두 그리지 않는다)
 */
export type BriefingData = {
  briefing: Briefing | null;
  briefJob: BriefJob | null;
  ai: "off" | "no_key" | "ready";
  error?: boolean;
};

// ─── system·스키마 ───────────────────────────────────────────────────────

/** spec 4.2 공통 system 규칙(B5·B6 와 같은 문장). 영상 제목·채널명은 넣지 않는다 */
export const BRIEFING_SYSTEM = REMIX_SYSTEM;

/**
 * output_config.format 으로 보내는 스키마. spec 4.3 의 minItems·maxItems 는 뺐다(구조화 출력은 복잡한 배열 제약을 지원하지 않고,
 * 이 저장소는 SDK 대신 fetch 로 불러 제약을 자동으로 걷어 내 주지 않는다. remix-schema 와 같은 이유).
 * 개수는 프롬프트에 적고 validateBriefing 이 지킨다. label 의 enum 은 지원되므로 그대로 둔다.
 */
export const BRIEFING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["bullets", "long_note", "shorts_note"],
  properties: {
    bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "text"],
        properties: {
          label: { type: "string", enum: ["포맷", "제목", "썸네일", "주제"] },
          text: { type: "string" },
        },
      },
    },
    long_note: { type: "string" },
    shorts_note: { type: "string" },
  },
} as const;

// ─── 입력 정리 ──────────────────────────────────────────────────────────

const CONTROL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069\uFEFF]/g;

const len = (s: string) => Array.from(s).length;

function cut(s: string, max: number): string {
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join("").trim() : s;
}

function count(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** 영상 한 줄을 프롬프트용 다섯 칸으로. 다른 칸(outlier·ratio·video_id 등)은 버린다 */
export function toBriefingVideo(v: { title?: unknown; duration_sec?: unknown; view_count?: unknown; subscriber_count?: unknown }): BriefingVideo {
  const duration = count(v.duration_sec);
  const title = typeof v.title === "string" ? cut(v.title.replace(CONTROL, " ").replace(/\s+/g, " ").trim(), BRIEFING_LIMITS.title) : "";
  return {
    title,
    format: duration > 0 && duration <= SHORTS_MAX_SEC ? "shorts" : "long",
    duration_sec: duration,
    view_count: count(v.view_count),
    subscriber_count: count(v.subscriber_count),
  };
}

/** 서버가 만드는 썸네일 주소(mqdefault 320×180). video_id 형식이 아니면 null */
export function briefingThumbUrl(videoId: string): string | null {
  return VIDEO_ID_RE.test(videoId) ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;
}

// ─── 프롬프트(spec 4.3) ─────────────────────────────────────────────────

/** 'YYYY-MM-DD' → '10월 14일' */
export function briefingDateLabel(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

/**
 * user 텍스트. 안내 문장에는 꺾쇠 태그를 쓰지 않아(태그 이름만 글자로) 태그 경계가 데이터 앞뒤에만 생기게 한다.
 * videos 는 toBriefingVideo 로 다시 걸러 outlier·ratio 같은 칸이 들어오지 않게 한다. risingTerms 가 비면 그 태그를 생략한다.
 * withImages 가 false 면(이미지 없이 다시 부를 때) 썸네일 문장을 뺀다.
 */
export function buildBriefingPrompt({
  date,
  videos,
  risingTerms = [],
  withImages = true,
  thumbnails = 0,
}: {
  date: string;
  videos: readonly Parameters<typeof toBriefingVideo>[0][];
  risingTerms?: readonly BriefingTerm[];
  withImages?: boolean;
  /** 붙인 썸네일 수(롱폼 앞에서부터) */
  thumbnails?: number;
}): string {
  const rows = videos.map(toBriefingVideo);
  const terms = risingTerms
    .slice(0, BRIEFING_LIMITS.risingTerms)
    .map((t) => ({ term: cut(String(t.term ?? "").replace(CONTROL, " ").trim(), 40), channels: count(t.channels) }))
    .filter((t) => t.term);
  const images = withImages && thumbnails > 0;
  const lines = [
    images
      ? `아래는 ${date} 하루 동안 한국에서 게시된 영상 중 구독자 수에 비해 조회수가 잘 나온 영상 목록과 썸네일이다.`
      : `아래는 ${date} 하루 동안 한국에서 게시된 영상 중 구독자 수에 비해 조회수가 잘 나온 영상 목록이다.`,
    images
      ? "오늘 뜨는 포맷, 제목 패턴, 썸네일 경향, 주제를 3~5줄로 요약해 줘."
      : "오늘 뜨는 포맷, 제목 패턴, 주제를 3~5줄로 요약해 줘. 썸네일 이미지는 없으니 썸네일 줄은 쓰지 않는다.",
    "- 각 줄은 60자 이내, 관찰한 근거(몇 개 중 몇 개 같은 개수)를 짧게 붙인다.",
    "- 각 줄의 label 은 포맷, 제목, 썸네일, 주제 중 하나.",
    "- 롱폼과 쇼츠가 다르면 long_note, shorts_note 에 한 줄씩. 다르지 않으면 빈 문자열.",
  ];
  if (images) lines.push(`- 썸네일 이미지는 videos 의 롱폼(format long) 앞에서부터 ${thumbnails}개와 같은 순서다.`);
  if (terms.length) lines.push("- rising_terms 는 최근 7일 여러 채널 제목에 함께 나온 단어와 그 채널 수다.");
  lines.push(`<videos>${escapeForTag(JSON.stringify(rows))}</videos>`);
  if (terms.length) lines.push(`<rising_terms>${escapeForTag(JSON.stringify(terms))}</rising_terms>`);
  return lines.join("\n");
}

export type BriefingContentBlock = { type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } };

/**
 * user 메시지 블록: 텍스트 하나 + (withImages 면) 롱폼 앞 12개 썸네일 이미지. 이미지 주소는 video_id 로만 만든다.
 * 돌려주는 thumbnails 는 실제로 붙인 이미지 수.
 */
export function buildBriefingContent({
  date,
  videos,
  risingTerms = [],
  withImages = true,
}: {
  date: string;
  videos: readonly (Parameters<typeof toBriefingVideo>[0] & { video_id: string })[];
  risingTerms?: readonly BriefingTerm[];
  withImages?: boolean;
}): { blocks: BriefingContentBlock[]; text: string; thumbnails: number } {
  const urls = withImages
    ? videos
        .filter((v) => toBriefingVideo(v).format === "long")
        .map((v) => briefingThumbUrl(v.video_id))
        .filter((u): u is string => u !== null)
        .slice(0, BRIEFING_LIMITS.thumbnails)
    : [];
  const text = buildBriefingPrompt({ date, videos, risingTerms, withImages: urls.length > 0, thumbnails: urls.length });
  const blocks: BriefingContentBlock[] = [{ type: "text", text }];
  for (const url of urls) blocks.push({ type: "image", source: { type: "url", url } });
  return { blocks, text, thumbnails: urls.length };
}

// ─── 출력 검증(spec 4.3) ────────────────────────────────────────────────

/** URL·@핸들·전화번호 */
const CONTACT = [/https?:\/\//i, /\bwww\./i, /\.(?:com|net|kr|co|io|me|ly)\b/i, /@[\w.]{2,}/, /\d{2,4}-\d{3,4}-\d{4}/];
/** 계산값: 근거는 개수로만(spec 4.2) */
const DERIVED = [/\d+(?:\.\d+)?\s*배/, /%/, /퍼센트/, /평균\s*대비/, /구독자\s*대비/];

/** 긴 하이픈(U+2014)은 ', ' 로, 제어 문자 제거, 공백 한 칸 */
function tidy(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s*\u2014\s*/g, ", ").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** 금지 패턴이 있으면 true */
export function hasBannedPattern(s: string): boolean {
  return CONTACT.some((re) => re.test(s)) || DERIVED.some((re) => re.test(s));
}

/** 한 줄 검사: 1~80자이고 금지 패턴이 없으면 정리한 문장, 아니면 null */
function line(value: unknown): string | null {
  const s = tidy(value);
  const n = len(s);
  if (n < 1 || n > BRIEFING_LIMITS.text) return null;
  if (hasBannedPattern(s)) return null;
  return s;
}

/**
 * 모델 출력 검증(spec 4.3, roadmap T6).
 * - bullets 가 배열이 아니거나 6개 이상이면 null(스키마 위반)
 * - 줄마다: label 이 허용값(포맷·제목·썸네일·주제) 밖이면 버림, text 는 긴 하이픈을 ', ' 로 바꾼 뒤 1~80자가 아니거나
 *   URL·@핸들·전화번호·계산값(배수·%·퍼센트·평균 대비·구독자 대비)이 있으면 버림
 * - 남은 줄이 3개 미만이면 null
 * - long_note·shorts_note 는 같은 기준으로 검사해 통과 못 하면 null(브리핑 자체는 살린다)
 */
export function validateBriefing(raw: unknown): Briefing | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.bullets) || r.bullets.length > BRIEFING_LIMITS.maxBullets) return null;

  const bullets: BriefingBullet[] = [];
  for (const b of r.bullets) {
    if (!b || typeof b !== "object") continue;
    const o = b as Record<string, unknown>;
    if (!BRIEFING_LABELS.includes(o.label as BriefingLabel)) continue;
    const text = line(o.text);
    if (text === null) continue;
    bullets.push({ label: o.label as BriefingLabel, text });
  }
  if (bullets.length < BRIEFING_LIMITS.minBullets) return null;

  return { bullets, long_note: line(r.long_note), shorts_note: line(r.shorts_note) };
}
