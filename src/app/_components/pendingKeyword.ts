/**
 * 로그인·가입하는 동안 검색 키워드를 잠시 맡아 둔다 (같은 탭의 sessionStorage).
 * 맡기는 곳: 홈 로그인 모달(모달이 열릴 때), /search 한도 모달의 비로그인 가입 버튼(누를 때).
 *
 * 로그인 뒤 돌아갈 주소에 q 를 싣지 않는다. /search?q= 로 바로 돌아오면 확인창·saveToHistory 없이
 * 서버 검색과 차감이 일어나기 때문이다. 대신 /search 의 SearchBar 가 q 없이 열렸을 때만
 * 입력창을 이 값으로 채우고 지운다. 자동 검색·차감은 하지 않는다.
 */
const PENDING_KEYWORD_KEY = "bibl:pendingKeyword";

export function rememberPendingKeyword(term: string) {
  try {
    sessionStorage.setItem(PENDING_KEYWORD_KEY, term);
  } catch {
    // 저장소를 쓸 수 없는 환경이면 건너뛴다(입력창만 비어 있게 된다)
  }
}

/** 맡아 둔 키워드를 꺼내고 지운다. 없으면 null. */
export function takePendingKeyword(): string | null {
  try {
    const term = sessionStorage.getItem(PENDING_KEYWORD_KEY);
    if (term !== null) sessionStorage.removeItem(PENDING_KEYWORD_KEY);
    return term;
  } catch {
    return null;
  }
}

/** 맡아 둔 키워드를 버린다. 로그인하지 않고 모달을 닫았을 때 쓴다. */
export function forgetPendingKeyword() {
  try {
    sessionStorage.removeItem(PENDING_KEYWORD_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경이면 지울 값도 없다
  }
}
