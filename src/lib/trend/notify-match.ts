/**
 * C7 관심 키워드·채널 매칭 규칙(순수 함수, import 없음, enum 없음). 설계: docs/trend-dev/spec.md 3.7, roadmap T9.
 * cron notify 단계(notify.ts)·관심 등록 API(watch.ts)·화면(WatchManager)이 같이 쓴다.
 * Node 직접 시험(scripts/trend/notify.test.mjs)을 위해 아무것도 import 하지 않는다.
 *
 * 매칭(그날 breakout_videos 한 행)
 *  - 분류 칼럼이 생기기 전 수집 행(kind·category_id·outlier 모두 null, rules.ts isLegacyRow 와 같은 판정)은 키워드·채널 모두 제외.
 *  - 채널: channel_id 가 등록 채널이면 kind 와 상관없이 매치.
 *  - 키워드: kind 가 null 이고, 정규화한 제목(소문자·공백 제거)에 term_norm 이 들어 있고, outlier ≥ 2 또는 ratio ≥ 1.
 *    2글자 이하 영문·숫자 단어('lg', 'tv')는 다른 단어 속에 걸리지 않게 제목 토큰과 똑같을 때만 매치한다.
 *    토큰은 글자·숫자가 아닌 문자로만 나누므로 한글이 바로 붙은 제목('LG전자', 'TV조선')에서는 걸리지 않는다(의도한 동작).
 */

/** 관심 키워드 길이(정규화 뒤 글자 수) */
export const WATCH_TERM_MIN = 2;
export const WATCH_TERM_MAX = 30;
/** 키워드 알림 기준: 채널 평균 대비 */
export const NOTIFY_MIN_OUTLIER = 2;
/** 키워드 알림 기준: 구독자 대비(조회수 ÷ 구독자) */
export const NOTIFY_MIN_RATIO = 1;
/** YouTube 채널 id(UC + 22자). 관심 채널 추가는 이 형식만 받는다 */
export const CHANNEL_ID_RE = /^UC[\w-]{22}$/;

/** 짧은 영문·숫자 단어(토큰 일치로만 매칭) */
const SHORT_ASCII = /^[a-z0-9]{1,2}$/;
const SPACES = /\s+/g;
const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u;

function charLen(s: string): number {
  return Array.from(s).length;
}

/** 제목·키워드 공통 정규화: NFC, 소문자, 공백 모두 제거 */
export function normalizeText(s: string): string {
  return s.normalize("NFC").toLowerCase().replace(SPACES, "");
}

/** 관심 키워드 정규화. '맨 유' → '맨유'. 정규화 뒤 2~30자가 아니면 null */
export function normalizeWatch(term: string): string | null {
  if (typeof term !== "string") return null;
  const norm = normalizeText(term);
  const n = charLen(norm);
  if (n < WATCH_TERM_MIN || n > WATCH_TERM_MAX) return null;
  return norm;
}

/** 화면에 남길 원래 입력(앞뒤 공백 정리, 속 공백은 한 칸) */
export function displayWatch(term: string): string {
  return term.normalize("NFC").trim().replace(SPACES, " ");
}

/** 매칭에 쓰는 breakout_videos 칼럼 */
export type MatchVideo = {
  title: string | null;
  channel_id: string | null;
  kind: string | null;
  category_id: string | number | null;
  outlier: number | null;
  ratio: number | null;
};

export type WatchSets = { keywords: ReadonlySet<string>; channels: ReadonlySet<string> };
export type WatchMatch = { kind: "keyword"; term: string } | { kind: "channel" };

/** 분류 칼럼이 생기기 전 수집 행(rules.ts isLegacyRow 와 같은 조건) */
function isLegacy(v: MatchVideo): boolean {
  return v.kind == null && v.category_id == null && v.outlier == null;
}

/** 제목 토큰(소문자, 글자·숫자가 아닌 문자로 나눔). 짧은 영문 단어 매칭용 */
function titleTokens(title: string): Set<string> {
  return new Set(title.normalize("NFC").toLowerCase().split(TOKEN_SPLIT).filter(Boolean));
}

/**
 * 영상 한 개가 어떤 관심 키워드·채널에 걸리는가. keywords 는 term_norm 집합, channels 는 channel_id 집합.
 * 결과 순서: 키워드(정렬 순) → 채널. 걸린 것이 없으면 빈 배열.
 */
export function matchVideo(video: MatchVideo, { keywords, channels }: WatchSets): WatchMatch[] {
  if (isLegacy(video)) return [];
  const out: WatchMatch[] = [];

  const strong = (video.outlier ?? 0) >= NOTIFY_MIN_OUTLIER || (video.ratio ?? 0) >= NOTIFY_MIN_RATIO;
  if (video.kind == null && strong && video.title && keywords.size) {
    const norm = normalizeText(video.title);
    let tokens: Set<string> | null = null;
    const hits: string[] = [];
    for (const term of keywords) {
      if (SHORT_ASCII.test(term)) {
        tokens ??= titleTokens(video.title);
        if (tokens.has(term)) hits.push(term);
      } else if (norm.includes(term)) {
        hits.push(term);
      }
    }
    hits.sort();
    for (const term of hits) out.push({ kind: "keyword", term });
  }

  if (video.channel_id && channels.has(video.channel_id)) out.push({ kind: "channel" });
  return out;
}

/**
 * 받침에 맞는 주제 조사(은/는). 'Free' → 'Free는', '팀비블' → '팀비블은', 'Team bibl' → 'Team bibl은'.
 * 영문은 끝 글자를 읽는 소리로 본다(l·m·n 은 받침, 그 밖은 받침 없음). 숫자는 읽는 소리(0·1·3·6·7·8 은 받침).
 */
export function withTopic(word: string): string {
  const w = word.trim();
  const last = Array.from(w).pop() ?? "";
  const code = last.charCodeAt(0);
  let batchim: boolean;
  if (code >= 0xac00 && code <= 0xd7a3) batchim = (code - 0xac00) % 28 !== 0;
  else if (/[a-z]/i.test(last)) batchim = /[lmn]/i.test(last);
  else if (/[0-9]/.test(last)) batchim = /[013678]/.test(last);
  else batchim = false;
  return `${w}${batchim ? "은" : "는"}`;
}

/** 등록 한도 문구(spec 3.7): 'Free는 3개까지 등록할 수 있어요.' */
export function watchLimitMessage(planName: string, limit: number): string {
  return `${withTopic(planName)} ${limit}개까지 등록할 수 있어요.`;
}
