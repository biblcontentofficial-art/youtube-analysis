/**
 * 프롬프트 태그 경계 보호(순수 함수, 의존성 없음).
 * 근거: docs/trend-dev/spec.md 4.1
 *
 * Claude 에 보내는 user 메시지에서 <videos>·<user_topic> 같은 태그 안에 넣는 모든 문자열
 * (JSON.stringify 결과 포함)에 쓴다. JSON.stringify 는 '<'·'>' 를 바꾸지 않아서
 * 영상 제목 안의 '</videos>' 로 태그 경계를 깰 수 있다.
 *
 *   `<videos>${escapeForTag(JSON.stringify(rows))}</videos>`
 *
 * 바꾼 결과는 JSON 문자열 안에서도 같은 글자로 읽힌다('\u003c' 는 JSON 의 유효한 이스케이프).
 * JSON 이 아닌 원문 문자열(예: 사용자가 쓴 주제)에도 쓴다. 이때 모델에는 '\u003c' 가 글자 그대로 보이며,
 * 목적은 태그 경계 보호다.
 */
export function escapeForTag(s: string): string {
  return s.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
