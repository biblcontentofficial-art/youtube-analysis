/**
 * 한국어 영상 제목 토크나이저(순수 함수, import 없음, enum 없음). 형태소 분석기 없이 규칙으로 주제어·해시태그를 뽑는다.
 * A1(breakout_terms)·B4·C7·C8 이 같은 함수를 쓴다. 설계: docs/trend-dev/research.md 2.2~2.3, roadmap T2.
 *
 * 단어 규칙(순서대로)
 *  ① NFC·소문자, 해시태그(#...)는 통째로 지운다(태그는 tags 에만 센다, 같은 단어가 word·tag 로 두 번 나오지 않게).
 *     글자·숫자·공백이 아닌 문자는 공백으로 바꾸고 공백으로 나눈다.
 *  ② 버림: 순수 숫자 / 숫자+날짜·순서 단위(10월·3회·1위, 뒤에 조사가 붙어도) / 19xx·20xx 로 시작 / 자모만(ㅋㅋ) / 2글자 미만.
 *  ③ 용언형 버림(조사 떼기 전 원래 토큰): '는'으로 끝나면 뗀 어간이 용언 어간 끝(르·키·기·하·주·되·리·치·보·오·가)일 때,
 *     그 밖에는 말뭉치 근거(bareForms)로 조사를 뗄 수 있을 때만 남긴다(맨유는 → 맨유, 모르는·먹는 → 버림).
 *     던·된·했·하·요·까·게·고 로 끝나는 3글자 이상도 버린다('에게' 조사는 근거가 있으면 뗀다).
 *     지·니·서·면·다·한 은 끝 목록에 넣지 않는다(챌린지·할머니·짜장면·캐나다 같은 명사 보호).
 *  ④ 조사 떼기: 3글자 이상에서 끝 조사 하나(긴 것부터)를 떼되, 뗀 형태가 bareForms(같은 날 조사 없이 나온 단어 + 누적 사전)에
 *     있을 때만. bareForms 를 안 주면 떼지 않는다(디스플레이·치이카와·김세의·부캉이 를 깨지 않는 이유).
 *  ⑤ 불용어(rules.stopWords). 남은 단어가 다시 조사로 끝나고 그 조사를 떼면 불용어가 되면 버린다
 *     (이번에는 → 이번에 → 이번 은 불용어 → 버림. 오늘도·최고의 같은 형태도 같다). 한 제목 안 중복은 한 번만.
 *  rules.allowTerms 에 있는 단어는 ②의 길이 검사 말고는 아무 규칙도 적용하지 않고 그대로 둔다.
 *
 * 단어 목록(불용어·예외·해시태그 불용어)은 src/lib/trend/rules.ts 의 TOKEN_RULES 를 넘긴다(이 파일은 Node 직접 시험을 위해
 * 아무것도 import 하지 않는다). rules 를 안 주면 ①~④ 구조 규칙만 적용한다.
 */

export type TokenRules = {
  stopWords?: ReadonlySet<string>;
  allowTerms?: ReadonlySet<string>;
  tagStop?: ReadonlySet<string>;
};

export type TokenizeOptions = {
  /** 조사 없이 나온 단어 집합. 있을 때만 조사를 뗀다 */
  bareForms?: ReadonlySet<string>;
  rules?: TokenRules;
};

export type TitleTokens = { words: string[]; tags: string[] };

const EMPTY: ReadonlySet<string> = new Set<string>();

/** 끝 조사(긴 것부터). research.md 2.2 목록 */
export const PARTICLES: readonly string[] = [
  "에서는", "으로는", "에게서", "이라는",
  "에서", "으로", "까지", "부터", "한테", "에게", "처럼", "보다", "이랑", "이다",
  "은", "는", "이", "가", "을", "를", "의", "에", "로", "와", "과", "도", "만", "랑",
];

/** 숫자+단위만으로 된 토큰(10월·3회·1위·5조·100만명). '1차전' 처럼 뒤에 다른 글자가 더 붙으면 남는다 */
const DATE_UNIT = new RegExp(
  `^\\d+(만|천|억|조)?(년|월|일|시|분|초|회|화|차|강|위|만|억|조|개|가지|탄|명|원|편|부|호|번|배|살|세|회차|년대|년차|분기|주년|시간|개월|주일)?(${PARTICLES.join("|")})?$`,
);
const YEAR_PREFIX = /^(19|20)\d{2}/;
const ALL_DIGITS = /^\p{N}+$/u;
const JAMO_ONLY = /^[ᄀ-ᇿㄱ-ㆎꥠ-꥿ힰ-퟿]+$/;
/** 3글자 이상 토큰의 용언형 끝('는'은 따로 본다) */
const VERB_END = /(던|된|했|하|요|까|게|고)$/;
/** '는' 앞 어간이 이 글자로 끝나면 용언형(모르는·시키는·생기는·안되는·말하는·해주는) */
const VERB_STEM_END = /(르|키|기|하|주|되|리|치|보|오|가)$/;
const NON_WORD = /[^\p{L}\p{N}\s]/gu;
const HASHTAG = /#([\p{L}\p{N}_]+)/gu;

function charLen(s: string): number {
  return Array.from(s).length;
}

/** 단어 정규화: NFC, 소문자, 앞뒤 공백 제거 */
export function normalizeTerm(s: string): string {
  return s.normalize("NFC").toLowerCase().trim();
}

/** ② 구조상 버리는 토큰(숫자·날짜·연도·자모·한 글자) */
export function isNoiseToken(t: string): boolean {
  if (charLen(t) < 2) return true;
  if (ALL_DIGITS.test(t)) return true;
  if (DATE_UNIT.test(t)) return true;
  if (YEAR_PREFIX.test(t)) return true;
  if (JAMO_ONLY.test(t)) return true;
  return false;
}

/** ④ 끝 조사 하나를 떼 bareForms 에 있는 형태를 돌려준다. 없으면 null */
function stripParticle(t: string, bare: ReadonlySet<string>, only?: readonly string[]): string | null {
  if (charLen(t) < 3) return null;
  for (const p of only ?? PARTICLES) {
    if (!t.endsWith(p)) continue;
    const stem = t.slice(0, t.length - p.length);
    if (charLen(stem) >= 2 && bare.has(stem)) return stem;
  }
  return null;
}

/** ⑤ 끝 조사 하나를 떼면 불용어가 되는 단어(이번에·오늘도·최고의). 뗀 앞부분은 2글자 이상만 본다 */
function endsWithStopPlusParticle(t: string, stop: ReadonlySet<string>): boolean {
  if (!stop.size) return false;
  for (const p of PARTICLES) {
    if (!t.endsWith(p)) continue;
    const stem = t.slice(0, t.length - p.length);
    if (charLen(stem) >= 2 && stop.has(stem)) return true;
  }
  return false;
}

/** 해시태그: '#' 를 떼고 소문자. 해시태그 불용어·불용어·숫자·날짜는 버린다. 한 제목 안 중복은 한 번만 */
export function extractTags(title: string, rules?: TokenRules): string[] {
  const tagStop = rules?.tagStop ?? EMPTY;
  const stop = rules?.stopWords ?? EMPTY;
  const allow = rules?.allowTerms ?? EMPTY;
  const out: string[] = [];
  for (const m of normalizeTerm(title).matchAll(HASHTAG)) {
    const t = m[1];
    if (tagStop.has(t) || isNoiseToken(t)) continue;
    if (stop.has(t) && !allow.has(t)) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** 제목 → { words, tags }. 규칙은 파일 머리 주석 */
export function tokenizeTitle(title: string, opts: TokenizeOptions = {}): TitleTokens {
  const bare = opts.bareForms;
  const stop = opts.rules?.stopWords ?? EMPTY;
  const allow = opts.rules?.allowTerms ?? EMPTY;
  const words: string[] = [];

  // ① 해시태그는 tags 쪽에서만 센다(단어 쪽에서는 지운다)
  for (const t of normalizeTerm(title).replace(HASHTAG, " ").replace(NON_WORD, " ").split(/\s+/)) {
    if (!t) continue;
    if (allow.has(t)) {
      if (charLen(t) >= 2 && !words.includes(t)) words.push(t);
      continue;
    }
    if (isNoiseToken(t)) continue;

    let term = t;
    if (t.endsWith("는")) {
      // ③ '는': 용언 어간이면 버림, 아니면 근거가 있을 때만 '명사+는' 으로 보고 조사를 뗀다
      if (VERB_STEM_END.test(t.slice(0, -1))) continue;
      const s = bare ? stripParticle(t, bare) : null;
      if (!s) continue;
      term = s;
    } else if (charLen(t) >= 3 && VERB_END.test(t)) {
      // ③ 용언형 끝. '친구에게' 처럼 '에게' 조사는 근거가 있으면 뗀다
      const s = bare && t.endsWith("에게") ? stripParticle(t, bare, ["에게"]) : null;
      if (!s) continue;
      term = s;
    } else if (bare) {
      // ④ 조사 떼기(근거가 있을 때만)
      term = stripParticle(t, bare) ?? t;
    }

    if (term !== t && isNoiseToken(term)) continue;
    // ⑤ 불용어
    if (!allow.has(term) && (stop.has(term) || endsWithStopPlusParticle(term, stop))) continue;
    if (!words.includes(term)) words.push(term);
  }

  return { words, tags: extractTags(title, opts.rules) };
}
