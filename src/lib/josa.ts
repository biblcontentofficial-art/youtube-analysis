/**
 * 조사 붙이기(순수 함수, 의존성 없음). 화면 문구는 조사를 붙여 쓴다(spec 2.1: 'bibl lab이', 'Free는').
 *
 *   withTopic("Free")   → "Free는"
 *   withTopic("팀비블") → "팀비블은"
 *   withTopic("Admin")  → "Admin은"
 *
 * 한글: 마지막 음절의 받침 유무.
 * 영문: 끝 글자 발음 간단 규칙. m·n·l·ng·le 로 끝나면 받침이 있다고 본다(Admin 어드민, bibl 비블, Google 구글).
 *       그 밖(Free·Starter·Pro·Business)은 받침 없음. 맞지 않는 단어는 TOPIC_OVERRIDES 에 더한다.
 * 숫자: 한국어로 읽은 끝소리(1 일, 3 삼, 6 육, 7 칠, 8 팔, 0 영 은 받침 있음).
 */

const TOPIC_OVERRIDES: Record<string, "은" | "는"> = {};

const DIGIT_HAS_FINAL: Record<string, boolean> = {
  "0": true, "1": true, "2": false, "3": true, "4": false,
  "5": false, "6": true, "7": true, "8": true, "9": false,
};

function hasFinalConsonant(word: string): boolean {
  // 끝의 괄호·따옴표·공백·마침표는 건너뛰고 본다
  const core = word.replace(/[\s)\]"'’”.,!?·]+$/u, "");
  if (!core) return false;
  const last = core[core.length - 1];
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (last in DIGIT_HAS_FINAL) return DIGIT_HAS_FINAL[last];
  const lower = core.toLowerCase();
  if (/[a-z]$/.test(lower)) return /(?:m|n|l|ng|le)$/.test(lower);
  return false;
}

/** 주제 조사 은/는 을 붙인 문자열 */
export function withTopic(word: string): string {
  const override = TOPIC_OVERRIDES[word];
  if (override) return word + override;
  return word + (hasFinalConsonant(word) ? "은" : "는");
}
