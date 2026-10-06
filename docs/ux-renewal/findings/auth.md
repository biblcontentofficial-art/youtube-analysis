# auth 영역 UX/UI 감사 (로그인·회원가입·마이페이지·모달)

- 대상: `/sign-in`, `/sign-up`, `/sso-callback`, `/auth/callback`, `/mypage`, 한도 초과 모달(LimitModal), 전역 확인창(ConfirmDialog), 초대 코드 적용(ReferralApply), 토스 결제 결과 화면
- 코드 경로는 저장소 루트 `/Users/taemin/Downloads/youtube-analysis` 기준, 스크린샷은 scratchpad 기준
- 본 자료: `shots/before/sign-in-desktop-01.png`, `sign-in-mobile-01.png`, `sign-in-mobile-02.png`, `shots/before-auth/mypage.jpg`, `shots/before-auth/search-empty.jpg`, `shots/before/manifest.json`
- 로그인 2단계(카카오·구글 버튼 화면), 인앱 브라우저 상태, 마이페이지 모바일은 캡처가 없어 코드로 판단했다
- 현재 완성도: **2 / 5**

## 총평

로그인 화면은 이미 블랙·neutral·화이트 CTA 로 변환돼 있고 소셜 버튼 브랜드색도 맞지만, 겉모습과 달리 동선에 구멍이 많다. 로그인 후 돌아갈 곳을 18곳에서 보내는데(`redirect_url` 7곳, `next` 11곳) 로그인 폼이 어느 것도 읽지 않아 모든 로그인이 검색어 없는 `/search`("검색 결과가 없어요")로 끝나고, 로그인 실패와 결제 실패는 화면에 아무 안내가 없다. 마이페이지는 구 남색·틸 테마 그대로인 데다 구독 상태를 보지 않아, 해지 후에도 "자동 갱신"과 "구독 취소"가 남고 결제가 없는 팀비블 플랜은 "구독 취소"를 누르면 즉시 Free 가 된다. 모달은 구현이 네 벌로 갈려 있고 dialog 역할·포커스·ESC 처리가 제각각이며, 한도 초과 모달은 닫을 수 없고 상단 메뉴까지 덮는다. 테마 변환보다 버그 성격의 auth-01~06 을 먼저 처리하는 편이 효과가 크다.

## 유지할 점

1. 로그인 카드의 현재 톤: 블랙 배경 + neutral-900 카드 + 화이트 CTA, 카카오(#FEE500)·구글(흰 배경 + 4색 로고) 버튼의 브랜드색, 로딩 스피너와 중복 클릭 방지 (`SignInForm.tsx:165, 216-223, 245-283`).
2. 동의 UI 의 뼈대: 전체 동의 + [필수]/[선택] 구분, 네이티브 checkbox + label, 약관 "보기" 새 탭, 필수 미동의 시 진행 버튼 비활성 (`SignInForm.tsx:173-223`). 마케팅 미동의는 최초 의사표시일 때만 기록하는 콜백 처리도 유지 (`auth/callback/route.ts:49-74`).
3. 인앱 브라우저 감지와 OS 별 분기(안드로이드 Chrome intent, iOS 주소 복사 + 2단계 안내) 자체 (`lib/inAppBrowser.ts:15-96`, `SignInForm.tsx:112-161`). 고칠 것은 위치·톤·버튼 색뿐이다.
4. ConfirmDialog 의 구조: `useConfirm()` Promise 훅 하나로 전역 사용, 화이트 확인 + neutral 취소 버튼, ESC·바깥 클릭 닫기. 새 테마의 기준 모달로 삼기 좋다 (`ConfirmDialog.tsx:20-32, 57-103`).
5. LimitModal 의 로그인 복귀 경로 처리(`next=현재 경로`)와 모바일 하단 정렬(`items-end sm:items-center`) (`LimitModal.tsx:55, 70`). auth-01 수정의 본보기다.
6. 마이페이지 사용량 카드의 정보 구성: 사용/한도 숫자, 진행 막대, "매일 09:00 (KST) 리셋"처럼 구체적인 초기화 시점 (`mypage/page.tsx:116-137`).
7. 구독 취소 모달이 결과를 설명한다("현재 결제 기간 종료까지 이용, 다음 결제일에 자동 갱신 중단"). 취소 직후 종료일 안내도 있다 (`CancelSubscriptionButton.tsx:30-39, 61-65`).
8. RecentSearches 의 검색 횟수 표시와 `/search?q=…&fromHistory=1` 재방문 링크는 검색 누적 정책에 걸려 있으므로 스타일만 바꾸고 동작은 그대로 둔다 (`RecentSearches.tsx:88, 92-96`).

## 발견 목록 (심각도 순)

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| auth-01 | P0 | bug | 로그인 후 돌아갈 곳이 무시돼 모든 로그인이 빈 검색 화면으로 끝남 | S |
| auth-02 | P1 | bug | 로그인 실패·취소가 화면에 표시되지 않음 | S |
| auth-03 | P1 | bug | 마이페이지가 구독 상태를 보지 않음 (해지 후 "자동 갱신", 팀비블은 즉시 Free) | S |
| auth-04 | P1 | bug | 토스 결제 결과 화면: 실패 무안내, 뒤로가기 시 결제 주기 유실, 성공은 빈 검색 화면 | M |
| auth-05 | P1 | interaction-feedback | 한도 초과 모달을 닫을 수 없고 상단 메뉴까지 덮음 | S |
| auth-06 | P1 | bug | 한도 초과 모달의 가입 버튼이 약관 동의 단계를 건너뜀 | S |
| auth-07 | P1 | conversion | 로그인 첫 화면에 로그인 버튼이 없고 모바일에서 진행 버튼이 아래로 밀림 | M |
| auth-08 | P1 | theme-violation | 마이페이지·한도 모달·결제 실패 화면이 구 남색·틸 테마 (8개 파일 94줄) | M |
| auth-09 | P2 | bug | 한도 안내 문구의 사실 오류 (초기화 "자정", 월 한도 사용자에게 "오늘") | S |
| auth-10 | P2 | bug | ConfirmDialog 의 Enter 가 포커스와 무관하게 "확인" 처리 (삭제 확인 포함) | S |
| auth-11 | P2 | accessibility | 모달 구현 4벌, dialog 역할·포커스 가둠·스크롤 잠금 없음 | M |
| auth-12 | P2 | navigation-ia | 마이페이지 정보 구조: 한 줄 카드에 10개 넘는 블록이 구분 없이 쌓임 | M |
| auth-13 | P2 | interaction-feedback | 구독 취소·계정 삭제의 표현: 흐린 글자, 삭제 범위 미고지, 실패는 alert | S |
| auth-14 | P2 | mobile | 인앱 브라우저 경고: 앰버 채움 버튼, 큰 경고, 나가라는 안내가 먼저 | M |
| auth-15 | P2 | accessibility | 보조 문구 대비 2.0~2.3:1, 동의 행·"보기" 터치 영역 20px 안팎 | S |

---

### auth-01 · P0 · bug · 공수 S
**로그인 후 돌아갈 곳이 무시돼 모든 로그인이 빈 검색 화면으로 끝남**

- 페이지: `/sign-in`, `/sign-up`, `/`, `/community`, `/pricing`, `/payment`, `/mypage`, `/saved`, `/search`
- 근거
  - `src/app/sign-in/_components/SignInForm.tsx:61-63`: URL 에서 `ref` 만 읽고 콜백 주소는 `next=/search` 고정
  - `?redirect_url=` 을 보내는 7곳: `src/app/page.tsx:113,119` · `src/app/pricing/_components/PricingButtons.tsx:38` · `src/app/payment/page.tsx:19` · `src/app/payment/toss/page.tsx:15` · `src/app/admin/page.tsx:12` · `src/app/api/toss/billing/auth/route.ts:18`
  - `?next=` 를 보내는 11곳: `src/app/community/_components/CommunityGate.tsx:39,45` · `src/app/community/[board]/[id]/page.tsx:119` · `…/_components/CommentSection.tsx:220` · `…/_components/LikeButton.tsx:69,149` · `src/app/community/write/page.tsx:47` · `src/app/community/admin/page.tsx:23` · `src/app/insights/admin/page.tsx:15` 외 2곳
  - `src/app/sign-up/[[...sign-up]]/page.tsx:3`: 쿼리를 버리고 `/sign-in` 으로 리다이렉트
  - `src/middleware.ts:84-88`: 보호 경로에서 원래 경로를 넘기지 않고 `/sign-in` 으로
  - `src/app/auth/callback/route.ts:8,15`: 콜백은 `next` 를 이미 지원
  - `src/app/search/_components/SearchResultList.tsx:282-289`, `shots/before-auth/search-empty.jpg`: 검색어 없는 `/search` 는 "검색 결과가 없어요"
- 문제: 돌아갈 주소를 보내는 곳은 18곳인데 읽는 곳이 없다. 홈에서 키워드를 입력한 방문자는 "'키워드' 검색을 시작하려면 로그인" 모달을 거쳐 가입하지만 키워드가 사라진 `/search` 에 도착해 "검색 결과가 없어요"를 본다. 커뮤니티 게이트의 "무료로 가입하고 입장하기"도, 요금제의 결제 버튼도, 좋아요·댓글의 로그인 링크도 전부 같은 빈 검색 화면으로 간다. 신규 가입자 전원이 첫 화면에서 오류처럼 보이는 빈 상태를 본다.
- 제안: SignInForm 에서 `redirect_url` 과 `next` 를 읽어 콜백의 `next` 로 넘긴다(콜백은 수정 불필요). 값은 `/` 한 개로 시작하는 내부 경로만 허용하고(`//`, `/\`, 그 밖의 시작은 버리고 `/search`) `encodeURIComponent` 로 감싼다. 콜백이 `${origin}${next}` 로 이어 붙이므로 이 검증이 없으면 외부 주소로 보내는 통로가 된다. `/sign-up` 리다이렉트는 쿼리를 그대로 실어 보내고, 미들웨어도 원래 경로를 실어 보내면 `/mypage`·`/saved` 진입도 복구된다. 파라미터 이름은 한 가지로 정리한다. 검색 횟수 누적 로직(`saveToHistory`, `count`)은 건드리지 않고 기존 링크가 넘기던 값을 전달만 한다. 인증 파라미터를 다루므로 오케스트레이터 확인 후 진행.

### auth-02 · P1 · bug · 공수 S
**로그인 실패·취소가 화면에 표시되지 않음**

- 페이지: `/sign-in`, `/auth/callback`, `/sso-callback`
- 근거
  - `src/app/auth/callback/route.ts:12,38`: 실패 시 `/sign-in?error=no_code`, `/sign-in?error=auth_failed` 로 보냄
  - `src/app/sign-in/_components/SignInForm.tsx:61-76`: `error` 파라미터를 읽는 코드가 없고 OAuth 호출 오류는 `console.error` 뿐
  - `SignInForm.tsx:15-18`: 동의 상태가 메모리에만 있어 복귀하면 초기화
  - `src/app/sso-callback/page.tsx:1-4`, `error.tsx`: 페이지가 리다이렉트만 해서 오류 화면에는 도달할 수 없음
- 문제: 카카오·구글 화면에서 취소하거나 코드 교환이 실패하면 `/sign-in` 으로 돌아오는데, 화면은 처음과 똑같은 동의 단계이고 체크도 풀려 있다. 사용자는 무엇이 잘못됐는지 모른 채 처음부터 다시 한다.
- 제안: 카드 상단에 `role="alert"` 안내 한 줄을 둔다(레드 시맨틱: `border-red-500/40 text-red-400`, 채움 없음). 문구 예: auth_failed 는 "로그인을 완료하지 못했습니다. 다시 시도해 주세요.", no_code 는 "로그인이 취소되었습니다." OAuth 호출 오류(70-76줄)도 같은 자리에 표시한다. 동의 체크는 sessionStorage 에 보관했다가 복귀 시 복원한다. 도달하지 않는 `sso-callback/error.tsx` 는 정리 대상.

### auth-03 · P1 · bug · 공수 S
**마이페이지가 구독 상태를 보지 않음: 해지 후에도 "자동 갱신", 팀비블 플랜은 "구독 취소" 시 즉시 Free**

- 페이지: `/mypage`
- 근거
  - `src/app/mypage/page.tsx:161-173`: `status` 확인 없이 "다음 결제일 · 자동 갱신" 표시
  - `page.tsx:220-222`: `plan !== "free" && plan !== "admin"` 이면 "구독 취소" 노출
  - `src/lib/db.ts:84-98`: 해지는 `status` 만 cancelled 로 바꾸고 `next_billing_at` 유지
  - `src/app/mypage/_components/CancelSubscriptionButton.tsx:8,30-39`: 해지 안내가 컴포넌트 state 라 새로고침하면 사라짐
  - `src/lib/stripe.ts:112-131`: team 은 관리자가 지정하는 결제 없는 플랜
  - `src/app/api/cancel-subscription/route.ts:18-27`: 구독 행이 없으면 즉시 free 로 변경
  - `CancelSubscriptionButton.tsx:61-65`: 모달은 "현재 결제 기간 종료까지 이용" 이라고 안내
  - `page.tsx:40-45`, `shots/before-auth/mypage.jpg`: 플랜 이름 표에 admin·team 이 없어 "현재 플랜 admin" 처럼 내부 키가 그대로 나옴
- 문제: (1) 해지한 사용자가 마이페이지를 다시 열면 "다음 결제일 … 자동 갱신"과 "구독 취소" 버튼이 그대로라 해지가 안 된 것으로 보인다. (2) 팀비블(team) 플랜은 결제가 없는데 "구독 취소"가 보이고, 누르면 안내 문구와 달리 그 자리에서 Free 로 바뀐다. (3) admin·team 은 플랜 이름이 내부 키로 나오고 team 은 혜택 설명 줄도 없다.
- 제안: 표시 조건만 고친다(API 변경 없음). "구독 취소" 버튼은 `subscription?.status === "active"` 일 때만 보인다. status 가 cancelled 면 카드 라벨을 "이용 종료 예정일", 우측 문구를 "해지됨 · 자동 갱신 안 함" 으로 바꾼다. 플랜 이름과 설명은 `PLANS[plan].name`(`src/lib/stripe.ts`) 한 곳에서 가져와 team 은 "팀비블", admin 은 "Admin" 으로 표시한다.

### auth-04 · P1 · bug · 공수 M
**토스 결제 결과 화면: 실패는 안내 없이 요금제로, 뒤로가기는 결제 주기 유실, 성공은 "검색 결과가 없어요" 위 배너**

- 페이지: `/pricing`, `/payment`, `/payment/toss`, `/payment/toss/fail`, `/search`
- 근거
  - 실패: `src/app/api/toss/billing/page/route.ts:41`, `src/app/api/toss/billing/confirm/route.ts:28,34,64,103,138`, `src/app/api/toss/widget/confirm/route.ts:28,35,62,91` 등 20여 곳이 `/pricing?error=billing|payment|portone` 로 보냄. `src/app/pricing/page.tsx:23` 은 `searchParams` 를 받지 않고 `src/app/pricing` 안에 `error` 를 읽는 코드가 없음(grep 0건). 안내 문구는 `src/app/payment/page.tsx:28-32,68-75` 에만 있는데 `/payment?error=` 로 보내는 곳은 없음
  - 뒤로가기: `src/app/api/toss/billing/page/route.ts:69` 의 링크가 `/payment?plan=${plan}` 으로 period 가 빠짐. `src/app/payment/page.tsx:24` 는 period 가 없으면 yearly
  - 성공: `src/app/api/toss/billing/confirm/route.ts:135` 가 `/search?upgraded=1` 로 보냄. `src/app/search/page.tsx:246-254` 는 틸 박스 + 이모지 + "새로고침하면 … 표시됩니다". 그 아래는 `SearchResultList.tsx:282-289` 의 빈 결과(`shots/before-auth/search-empty.jpg`)
  - 고아 화면: `src/app/payment/toss/fail/page.tsx` 는 `TossPaymentWidget.tsx:73` 에서만 참조되는데 그 컴포넌트를 import 하는 곳이 없음
- 문제: 카드 등록이나 결제가 실패하면 요금제 페이지가 아무 설명 없이 다시 뜬다. 월간을 고른 사람이 토스 화면에서 "결제수단 선택으로 돌아가기"를 누르면 연간 금액으로 바뀐 결제 화면이 나온다(Starter 19,000원이 180,000원으로, `src/lib/toss.ts:6-10`). 결제에 성공하면 플랜·결제 내역 안내 없이 "플랜 업그레이드 완료" 배너 아래에 "검색 결과가 없어요"가 보인다. 참고(UI 범위 밖, 기록만): 카카오페이 복귀 주소 `/payment/success` 는 라우트가 없지만 카카오페이가 현재 비활성이라 노출되지 않는다. `/payment/toss` 가 이메일·이름을 쿼리스트링으로 넘긴다(`payment/toss/page.tsx:26`).
- 제안: (1) `/pricing` 이 `error` 를 읽어 `payment/page.tsx` 와 같은 레드 안내줄을 카드 위에 `role="alert"` 로 표시한다. (2) 뒤로가기 링크에 `&period=${period}` 를 붙인다(HTML 링크 한 줄). (3) 성공 배너는 이모지를 빼고 그린 시맨틱 테두리로 바꾸고, 문구는 "플랜이 적용되었습니다. 결제 내역은 마이페이지에서 확인할 수 있습니다." + 마이페이지 링크. 검색어가 없을 때는 빈 결과 문구를 숨긴다(검색 영역 담당과 조율). (4) 쓰이지 않는 `/payment/toss/fail` 은 삭제하거나 실패 안내의 표준 화면으로 정해 테마를 변환한다.

### auth-05 · P1 · interaction-feedback · 공수 S
**한도 초과 모달을 닫을 수 없고 상단 메뉴까지 덮음, 로그인 사용자에게 가입 유도가 먼저 깜빡임**

- 페이지: `/search`
- 근거
  - `src/app/search/_components/LimitModal.tsx:70,122`: `fixed inset-0 z-50`, 닫기 버튼·바깥 클릭·ESC 없음
  - `src/app/layout.tsx:302`: nav 도 `z-50` 이고 DOM 순서가 앞이라 오버레이에 덮임
  - `src/app/search/page.tsx:197` 과 `276-323`: 모달 뒤 본문에 같은 내용의 인라인 카드가 한 번 더 렌더됨
  - `LimitModal.tsx:15,21-29,68,120-122`: `user` 초깃값이 null 이라 로그인 사용자에게도 비로그인용 "카카오로 무료 가입" 화면이 먼저 그려졌다가 바뀜
- 문제: 무료 한도(하루 2회)를 다 쓴 사용자가 한 번 더 검색하면 화면 전체가 모달로 막힌다. 닫을 수단이 없고 상단 메뉴도 오버레이 아래에 있어서, 결제할 생각이 없는 사람은 브라우저 뒤로가기 말고는 커뮤니티나 마이페이지로 갈 방법이 없다. 같은 안내가 본문에 한 번 더 있어 중복이다. 로그인 사용자는 세션 확인이 끝나기 전 잠깐 가입 버튼을 보게 되고, 그때 누르면 OAuth 가 시작된다.
- 제안: 모달에 닫기(우상단 X, ESC, 바깥 클릭)를 넣고, 닫으면 본문의 인라인 카드가 남게 한다(강제 노출이 의도라면 소유자 확인). 오버레이는 공용 모달 셸(auth-11)로 옮겨 메뉴와의 겹침을 정리한다. 세션 확인 전에는 아무것도 그리지 않거나 서버 페이지가 로그인 여부를 prop 으로 내려 준다. 인라인 카드와 모달의 문구·버튼은 한 컴포넌트로 합친다.

### auth-06 · P1 · bug · 공수 S
**한도 초과 모달의 가입 버튼이 약관 동의 단계를 건너뜀**

- 페이지: `/search`, `/sign-in`
- 근거
  - `src/app/search/_components/LimitModal.tsx:138-175`: 카카오·구글 버튼이 바로 OAuth 호출. `52-56`: redirectTo 에 `mkt` 없음. `182-186`: "가입하면 … 동의합니다" 한 줄
  - `src/app/sign-in/_components/SignInForm.tsx:173-223`: 필수 2건을 체크해야 진행. `63`: `mkt` 전달
  - git log: `83cce7a`(마케팅 수신 동의 수집), `1dcb8fb`(로그인 전 약관 동의 단계 신설) 이후 LimitModal 은 수정되지 않음(마지막 변경 `d5a5164`)
  - `src/app/_components/SearchBar.tsx:230-238`: 비로그인도 `/search` 에서 검색할 수 있어 이 모달에 도달함
- 문제: 로그인 화면에는 필수 동의 2건과 선택 동의 1건을 체크해야 넘어가는 단계가 새로 생겼는데, 비로그인 방문자가 무료 검색을 다 쓰고 만나는 이 모달에서는 체크 없이 바로 가입된다. 마케팅 수신 동의 여부도 기록되지 않는다. 같은 서비스의 가입 경로 두 개가 서로 다른 동의 절차를 가진다.
- 제안: 모달의 OAuth 버튼 두 개를 화이트 CTA 하나("가입하고 계속 검색하기")로 바꿔 `/sign-in` 으로 보낸다. auth-01 이 적용되면 현재 검색 주소를 실어 보내 가입 후 같은 검색으로 돌아온다. 모달 안에서 바로 가입시키려면 SignInForm 의 동의 블록을 공용 컴포넌트로 빼서 모달에도 넣는다. 어느 쪽이든 인앱 브라우저 안내가 한 벌로 줄어든다. 가입 경로를 바꾸는 일이라 소유자 확인 필요.

### auth-07 · P1 · conversion · 공수 M
**로그인 첫 화면에 로그인 버튼이 없고, 모바일에서는 진행 버튼이 화면 아래로 밀림**

- 페이지: `/sign-in`
- 근거
  - `src/app/sign-in/_components/SignInForm.tsx:15`(기본 단계 consent), `166-227`(동의 단계), `228-294`(로그인 단계)
  - `src/app/_components/NavUser.tsx:71-76`: "로그인"·"시작하기" 둘 다 `/sign-in`. `src/app/page.tsx:112-123`: "회원가입 후 검색하기"·"로그인" 둘 다 같은 화면
  - `SignInForm.tsx:80`(`min-h-screen` + `items-center`), `83-93`(전역 메뉴 아래 로고·태그라인 반복)
  - `shots/before/sign-in-mobile-01.png`(390x844 캡처): 메뉴 2줄 약 134px, 그 아래 빈 공간 약 165px, 카드 시작 약 390px, "동의하고 계속하기" 약 669~717px. 카카오 문의 버튼이 카드 오른쪽 아래 모서리에 걸침
  - `shots/before/sign-in-desktop-01.png`: 첫 화면이 "시작하기 전에" 동의 카드
  - `SignInForm.tsx:61-63`: `?ref=` 를 읽지만 화면에는 표시 없음
  - `src/app/pricing/_components/PricingButtons.tsx:32-35` + SignInForm 에 세션 확인 없음: 로그인한 사용자도 Free 버튼으로 동의 화면에 옴
- 문제: "로그인"을 누르고 들어온 기존 회원이 처음 보는 것은 "시작하기 전에 · 서비스 이용을 위한 동의가 필요합니다" 이고 카카오·구글 버튼은 보이지 않는다. 매번 최소 3번(전체 동의, 동의하고 계속하기, 카카오/구글)을 눌러야 OAuth 가 시작되고, 로그인이 취소되면 체크부터 다시 한다. 모바일에서는 메뉴 2줄과 세로 가운데 정렬 때문에 카드가 390px 부터 시작해 진행 버튼이 캡처 화면 맨 아래 근처에 놓인다. 주소창과 하단바가 있는 실제 브라우저에서는 첫 화면 밖으로 나갈 가능성이 높다(추정). 인앱 경고 카드가 붙으면 더 내려간다. 초대 링크로 들어와도 초대 혜택 안내가 없다.
- 제안: 두 단계를 한 화면으로 합친다. 제목 "로그인 · 회원가입", 그 아래 동의 블록(전체 동의 + 3항목), 그 아래 카카오·구글 버튼. 버튼은 필수 동의 전에는 비활성으로 두어 현재의 동의 조건을 그대로 지킨다(조작이 2번으로 줄어든다). 보조 문구 예: "카카오 또는 Google 계정으로 로그인합니다. 처음이면 자동으로 가입됩니다." 동의 체크는 sessionStorage 에 보관해 실패·취소 후 복원한다(기기에 기억시켜 재방문 시 생략할지는 소유자 결정). 모바일은 위 정렬(`items-start pt-8`, sm 이상에서만 가운데 정렬)로 바꾸고 카드 위 로고·태그라인 블록은 없앤다. `?ref=` 가 있으면 카드 상단에 "초대 링크로 들어오셨습니다. 가입하면 무료 검색 3회가 추가됩니다." 한 줄을 보여 준다. 이미 로그인한 상태면 폼 대신 "이미 로그인되어 있습니다" 와 검색으로 가는 화이트 버튼을 보여 준다.

### auth-08 · P1 · theme-violation · 공수 M
**마이페이지·한도 모달·결제 실패 화면이 구 남색·틸 테마 그대로 (8개 파일 94줄)**

- 페이지: `/mypage`, `/search`(한도 모달), `/payment/toss/fail`, `/sso-callback`
- 근거
  - `shots/before-auth/mypage.jpg`: 남색 배경, 재생 아이콘 + 틸 "lab" 구 로고
  - `src/app/mypage/page.tsx:47-52`(플랜별 blue/teal/purple 글자색), `58`(bg-gray-950), `63-71`(구 로고), `79-82`(틸 박스 + 이모지), `102`(bg-teal-600 버튼), `132`·`153`(틸·퍼플 막대), `189`(틸 배지)
  - `src/app/mypage/_components/ReferralSection.tsx:48,55,67,77` · `RecentSearches.tsx:89,93` · `CancelSubscriptionButton.tsx:57,78` · `DeleteAccountButton.tsx:39,59`(`bg-[#161b27]`, `bg-red-700`)
  - `src/app/search/_components/LimitModal.tsx:71-74`(그라데이션 바 + 아이콘 박스), `90-91`(플랜별 teal/purple), `99`(em-dash), `108`(bg-teal-600)
  - `src/app/payment/toss/fail/page.tsx:13,15,30` · `src/app/sso-callback/error.tsx:24`(원형 아이콘 박스)
  - 집계(gray-/teal-/purple-/blue-/gradient 클래스가 든 줄): page.tsx 38, LimitModal 26, ReferralSection 9, CancelSubscriptionButton 6, fail 6, DeleteAccountButton 4, RecentSearches 4, LogoutButton 1
- 문제: 상단 메뉴와 로그인 화면은 블랙·neutral 인데 아바타를 눌러 들어간 마이페이지는 남색 배경에 틸·퍼플·블루가 섞여 다른 서비스처럼 보인다. 금지 패턴이 모여 있다: 틸 채움 버튼, 그라데이션 바, 아이콘 박스, 이모지, em-dash. 로고도 전역 메뉴의 B 마크와 다른 재생 아이콘 + 틸 "lab" 이다(`ConfirmDialog.tsx:68-72` 도 재생 아이콘 마크).
- 제안: gray- 를 neutral- 로 치환하고 배경 `bg-black`, 카드 `bg-neutral-900 border-neutral-800`. 틸 버튼과 "플랜 업그레이드"는 화이트 CTA, 플랜 이름 색 구분은 흰 글자로 통일. 사용량 막대는 neutral-800 트랙에 흰 채움, 소진 시에만 레드(`SearchUsageBadge.tsx:46-50` 과 같은 규칙). 결제 상태 배지는 그린/neutral/레드 글자만. 그라데이션 바·아이콘 박스·이모지는 없애고 아이콘은 맨 SVG. 페이지 안 구 로고 블록은 삭제하고 ConfirmDialog 의 마크는 B 마크로 맞춘다. 모달 패널 `#161b27` 은 neutral-900 으로.

### auth-09 · P2 · bug · 공수 S
**한도 안내 문구의 사실 오류: 초기화 시각 "자정"(실제 09:00 KST), 월 한도 사용자에게 "오늘 검색"·Starter 권유**

- 페이지: `/search`, `/mypage`
- 근거
  - `src/lib/searchLimit.ts:39-41,126-129`, `src/lib/channelLimit.ts:29,49-52`: 일별 키와 만료가 UTC 날짜 기준이라 한국 시간 09:00 에 초기화
  - `src/app/mypage/page.tsx:126`("매일 09:00 (KST) 리셋", 맞음) 대 `page.tsx:147`("매일 자정 리셋")
  - `src/app/search/_components/LimitModal.tsx:86`("내일 자정 초기화"), `src/app/search/page.tsx:293`("내일 자정 초기화까지")
  - `LimitModal.tsx:14,81,84-86`: isMonthly·plan 을 받지 않아 항상 "오늘 검색 N회", "Starter 플랜으로 월 50회". `src/lib/searchLimit.ts:207-210`: Starter·Pro·team 은 월 한도. `src/app/search/page.tsx:197`(show, limit 만 전달), `287-293`(인라인 카드는 기간을 구분)
- 문제: 무료 사용자가 밤에 한도를 다 쓰면 "내일 자정 초기화"를 보고 자정 이후 다시 오지만 실제로는 오전 9시까지 막혀 있다. 마이페이지 안에서도 영상 검색은 "09:00 (KST)", 채널 검색은 "자정"으로 서로 다르다. 월 50회를 다 쓴 Starter·팀비블 사용자는 "오늘 검색 50회를 모두 사용했습니다 · Starter 플랜으로 월 50회 검색이 가능합니다"라는 맞지 않는 모달을 본다.
- 제안: 초기화 문구를 상수 한 곳에 모아 "매일 오전 9시(한국 시간) 초기화", "매월 1일 초기화" 로 통일한다. LimitModal 에 isMonthly 와 plan 을 prop 으로 넘겨(값은 `search/page.tsx` 에 이미 있음) 기간 표현과 권유 플랜을 인라인 카드와 같게 맞춘다. 무료는 Starter 안내, Starter·팀비블은 Pro 안내, 월 한도는 "이번 달".

### auth-10 · P2 · bug · 공수 S
**ConfirmDialog 의 Enter 가 포커스 위치와 무관하게 "확인"으로 처리됨 (삭제 확인 포함)**

- 페이지: 전역(`/`, `/search`, `/community/*`)
- 근거
  - `src/app/_components/ConfirmDialog.tsx:44-52`: window keydown 에서 Enter 면 preventDefault 후 handleConfirm
  - 삭제 확인 사용처: `src/app/community/[board]/[id]/_components/PostActions.tsx:26-29`, `CommentSection.tsx:108-111`, `src/app/_components/SearchBar.tsx:199,209`
  - `ConfirmDialog.tsx:5-10`(위험 동작 구분 옵션 없음), `96-101`(확인 버튼은 항상 화이트 기본 버튼)
- 문제: 키보드로 "취소" 버튼에 포커스를 옮긴 뒤 Enter 를 눌러도 전역 keydown 처리 때문에 "확인"이 실행된다. 글·댓글 삭제 확인창에서도 같아서 취소하려던 사용자가 삭제하게 된다. 되돌릴 수 없는 삭제와 "검색하시겠습니까?" 같은 일반 확인이 같은 모양(화이트 확인 버튼, Enter 즉시 확인)이다.
- 제안: 전역 Enter 처리를 없애고 열릴 때 포커스를 버튼에 둔다. 일반 확인은 "확인" 버튼에(검색 확인의 Enter 흐름 유지), destructive 옵션이 켜진 확인은 "취소" 버튼에 둔다. destructive 일 때 확인 버튼은 레드 글자 + 레드 테두리(채움 없음)로 구분한다. 삭제 사용처 4곳은 `destructive: true` 만 추가한다. ESC 처리는 유지.

### auth-11 · P2 · accessibility · 공수 M
**모달 구현이 4벌로 갈려 있고 dialog 역할·포커스 가둠·스크롤 잠금이 없음**

- 페이지: 전역, `/search`, `/mypage`, `/`
- 근거
  - `src` 전체에서 `role="dialog"`·`aria-modal` 0건(grep)
  - 구현 4벌: `src/app/_components/ConfirmDialog.tsx:57-66`(z-[10000], bg-black/60, ESC·바깥 클릭 있음) / `src/app/search/_components/LimitModal.tsx:70-71,122-123`(z-50, bg-black/75, 닫기 없음) / `src/app/mypage/_components/CancelSubscriptionButton.tsx:51-59`, `DeleteAccountButton.tsx:33-41`(z-50, bg-black/60, `w-80` 고정, ESC 없음) / `src/app/page.tsx:90-98`(z-50, bg-black/70, ESC 없음)
  - 포커스 이동·복귀·Tab 순환 코드는 4벌 모두 없음
  - `src/app/_components/KakaoChatButton.tsx:13`(fixed z-50) + `src/app/layout.tsx:396-398`(children 뒤에 렌더): z-50 오버레이 위에 노란 버튼이 떠 있음
  - z-index 값이 50/60/100/9990/9998/10000 으로 흩어져 있음(`fixed inset-0` 16개 파일)
- 문제: 모달이 열려도 스크린리더는 대화상자로 알리지 않고, 포커스는 뒤 페이지에 남아 Tab 이 가려진 요소를 돈다. 배경은 계속 스크롤된다. ESC 는 4벌 중 1벌에서만 동작한다. 오버레이 농도·모서리·버튼 순서·폭이 제각각이고, z-50 모달 위로 카카오 문의 버튼이 그대로 떠 있어 눌린다.
- 제안: 의존성 추가 없이 네이티브 `<dialog>` + `showModal()` 기반의 공용 셸 하나를 `src/app/_components` 에 둔다. 브라우저가 포커스 가둠·ESC·최상위 레이어(메뉴와 카카오 버튼 위)를 처리하므로 z-index 경쟁이 사라진다. 셸이 맡을 것: `aria-labelledby`/`aria-describedby`, 열 때 첫 포커스, 닫을 때 포커스 복귀, body 스크롤 잠금, 패널 `bg-neutral-900 border-neutral-800 rounded-2xl w-full max-w-sm`, 오버레이 한 가지 농도, 버튼 순서(취소 왼쪽, 실행 오른쪽), focus-visible 링. 변형은 기본·destructive·모바일 하단 정렬 세 가지. ConfirmDialog, LimitModal, 마이페이지 2개, 홈 로그인 유도 순으로 옮긴다. 구성은 shadcn 의 Dialog/AlertDialog(제목·설명·취소·실행)를 따르되 Radix 는 들이지 않는다.

### auth-12 · P2 · navigation-ia · 공수 M
**마이페이지 정보 구조: 384px 한 줄 카드에 10개 넘는 블록이 구분 없이 쌓임**

- 페이지: `/mypage`
- 근거
  - `shots/before-auth/mypage.jpg`: 넓은 데스크톱 화면에 `max-w-sm` 카드 하나, 좌우가 비어 있음
  - `src/app/mypage/page.tsx:58-59`(`max-w-sm` 가운데 정렬), `75`(카드 하나에 `space-y-6`), `86-200`(카드 안에 `bg-gray-800/50` 카드가 다시 들어감), `108-114`(플랜 설명 줄이 플랜 카드 밖에 떨어져 있음), `203-225`(친구 초대, 최근 검색, 검색으로 이동, 로그아웃, 구독 취소, 계정 삭제 순)
  - `src/app/mypage/_components/ReferralSection.tsx:41`, `RecentSearches.tsx:76`: 로딩 중 null 이라 나중에 끼어들어 아래 버튼들이 밀림(mypage.jpg 캡처에도 초대 카드가 아직 없음)
  - `ReferralSection.tsx:16,24,60-62`: API 실패 시 빈 코드 상자와 ref 가 빈 링크가 복사됨
  - `src/app/_components/ReferralApply.tsx:14-23`: 초대 적용 결과를 화면에 알리지 않고, 응답 성공 여부와 무관하게 쿠키 삭제
  - `src/app/_components/NavUser.tsx:52`: 마이페이지 진입은 32px 아바타뿐, 접근 이름은 이미지 alt "프로필" 또는 이니셜 한 글자
- 문제: 계정·플랜·사용량·결제·초대·최근 검색·계정 관리가 제목 없이 같은 모양의 회색 상자로 이어져 훑어보기 어렵다. 데스크톱은 화면의 4분의 1만 쓰고 길게 스크롤한다. 모바일은 바깥 여백 16 + 카드 28 + 안쪽 카드 16 으로 좌우 60px 씩이 패딩이라 내용 폭이 270px 이다. 초대·최근 검색 카드가 늦게 끼어들며 로그아웃·삭제 버튼 위치가 바뀐다. 초대받아 가입한 사람은 보너스가 적용됐다는 안내를 어디서도 받지 못한다.
- 제안: 페이지 안 로고를 없애고 `max-w-3xl` 컨테이너에 섹션을 나눈다. 계정(이름·이메일) / 플랜·결제(플랜, 혜택 한 줄, 다음 결제일 또는 종료 예정일, 결제 내역, 업그레이드) / 사용량(영상·채널) / 친구 초대 / 최근 검색 키워드 / 계정 관리(로그아웃·구독 취소·계정 삭제). 각 섹션은 확정된 헤더 패턴(좌측 캡션 + 우측 영문 라벨 PLAN·USAGE·INVITE·ACCOUNT + 헤어라인)을 쓰고, 카드 속 카드는 없애 neutral-900 카드 한 겹으로 한다. md 이상에서 사용량과 초대는 2열. 초대·최근 검색은 같은 높이의 자리 표시를 먼저 그려 밀림을 없애고, 초대 코드가 비면 "초대 코드를 불러오지 못했습니다" 와 다시 시도 버튼을 보여 준다. 초대가 적용된 첫 방문에는 "초대 보너스 무료 검색 3회가 추가되었습니다" 를 한 번 보여 준다(ReferralApply 응답 사용). 아바타 링크에는 `aria-label="마이페이지"` 와 40px 이상 터치 영역.

### auth-13 · P2 · interaction-feedback · 공수 S
**구독 취소·계정 삭제의 표현: 거의 안 보이는 회색 글자, 삭제 범위 미고지, 실패는 브라우저 alert**

- 페이지: `/mypage`
- 근거
  - `shots/before-auth/mypage.jpg`: "계정 삭제" 가 로그아웃 아래 흐린 12px 글자
  - `src/app/mypage/_components/DeleteAccountButton.tsx:26-31`, `CancelSubscriptionButton.tsx:44-49`: `text-xs text-gray-600`, 배경 대비 약 2.3:1
  - `DeleteAccountButton.tsx:42-47`("모든 데이터가 영구적으로 삭제" 한 줄) 대 `src/app/api/delete-account/route.ts:10-14`(구독 취소 + 검색 기록 + 수집 영상 삭제)
  - `DeleteAccountButton.tsx:17-21`, `CancelSubscriptionButton.tsx:23-25`: 실패 시 `alert()`, 삭제 모달은 실패하면 닫힘
  - `DeleteAccountButton.tsx:56-62`, `CancelSubscriptionButton.tsx:75-81`: `bg-red-700` 채움 버튼
  - `src/app/mypage/_components/LogoutButton.tsx:9-14`: 처리 중 표시 없음
- 문제: 탈퇴·해지 링크가 대비 2.3:1 의 12px 글자라 찾기 어렵다. 삭제 확인창은 무엇이 지워지는지, 유료 구독이 함께 끝나는지 알려 주지 않는다. 실패하면 서비스 톤과 다른 브라우저 alert 이 뜨고 삭제 모달은 닫혀 버려 다시 열어야 한다. 실행 버튼은 색 채움(레드)이다.
- 제안: "계정 관리" 섹션(auth-12)에 행으로 배치한다. 로그아웃(neutral 테두리 버튼), 구독 취소(neutral 테두리, 활성 구독일 때만: auth-03), 계정 삭제(레드 글자 + `border-red-500/40`, 채움 없음). 글자는 14px 이상, 대비 4.5:1 이상. 삭제 확인창 본문에 삭제 대상을 목록으로 적는다: 검색 기록, 수집한 영상, 구독(유료 플랜이면 "이용 중인 구독도 함께 종료됩니다"). 실패 안내는 모달 안 `role="alert"` 한 줄로 바꾸고 모달은 열어 둔다. 실행 버튼은 레드 글자 + 레드 테두리, 처음 포커스는 "돌아가기". 공용 셸(auth-11)의 destructive 변형을 쓴다.

### auth-14 · P2 · mobile · 공수 M
**인앱 브라우저 경고: 앰버 채움 버튼, 카드 위 큰 경고, 되는 방법(카카오 로그인)보다 나가라는 안내가 먼저**

- 페이지: `/sign-in`, `/search`(한도 모달)
- 근거
  - `src/app/sign-in/_components/SignInForm.tsx:96-163`: 동의 카드 위에 별도 앰버 카드, 두 단계 모두 표시
  - `SignInForm.tsx:106-111`: "Chrome으로 열어서 로그인해 주세요"
  - `SignInForm.tsx:113-122`, `136-143`: `bg-amber-500` 버튼, 복사 후 `bg-green-600` 채움
  - `SignInForm.tsx:40-44`: 복사 실패 시 무반응
  - `SignInForm.tsx:261-283`, `52-55`: 구글 버튼이 `opacity-40 cursor-not-allowed` 인데 누르면 외부 열기·복사가 실행됨
  - `src/app/search/_components/LimitModal.tsx:33-39`(iOS 에서 주소 복사 후 피드백 없음), `176-180`
  - `src/lib/inAppBrowser.ts:23-27`: 카카오톡 인앱 감지
  - 모바일 캡처에는 인앱 상태가 없어 코드로 판단
- 문제: 카카오톡 안에서 링크를 연 사용자는 카카오 로그인이 그대로 되는데도, 화면 맨 위의 큰 앰버 경고는 Chrome 으로 나가라고만 한다. 경고 카드가 동의 카드 위에 놓여 모바일에서 진행 버튼을 더 아래로 민다(auth-07). 버튼은 색 채움(앰버·그린)이라 화이트 CTA 규칙과 어긋난다. 구글 버튼은 비활성처럼 보이지만 실제로는 동작해 신호가 엇갈리고, LimitModal 에서는 iOS 에서 눌러도 주소가 복사됐다는 표시가 없다.
- 제안: 경고를 카드 안 구글 버튼 바로 아래의 작은 안내로 옮긴다(앰버 글자 + `border-amber-500/40`, 채움 없음). 문구는 되는 것부터 쓴다: "{앱이름} 앱 안에서는 카카오 로그인을 쓸 수 있습니다. Google 로그인은 Chrome(Safari)에서 열어야 합니다." 외부 열기·주소 복사 버튼은 neutral 테두리 보조 버튼으로 바꾸고, 복사 후에는 버튼 글자를 "주소를 복사했습니다" 로 바꾼다(그린 채움 없음). 복사가 실패하면 주소를 선택 가능한 텍스트로 보여 준다. 구글 버튼은 흐리게 하지 말고 라벨을 "Google로 계속하기 (Chrome에서 열기)" 로 바꾼다. 이 안내를 컴포넌트 하나로 만들어 LimitModal 과 같이 쓴다(auth-06 적용 시 로그인 화면 한 곳만 남는다).

### auth-15 · P2 · accessibility · 공수 S
**보조 문구 대비 2.0~2.3:1, 동의 체크 행·"보기" 링크의 터치 영역 20px 안팎**

- 페이지: `/sign-in`, `/mypage`
- 근거
  - `shots/before/sign-in-desktop-01.png`, `sign-in-mobile-01.png`: "Free 플랜으로 즉시 이용 가능 · 카드 불필요", "선택 항목은 동의하지 않아도 …" 가 거의 안 보임
  - `src/app/sign-in/_components/SignInForm.tsx:298`(text-neutral-700 on black, 약 2.0:1), `224`·`285`(text-neutral-600 on neutral-900, 약 2.3:1), `169`·`231`(text-neutral-500 on neutral-900, 약 3.8:1)
  - `SignInForm.tsx:184-213`: 체크박스 14px, 행 높이 약 20px, 행 간격 12px, "보기" 12px 글자
  - `src/app/mypage/page.tsx:109,125,146,171`: text-gray-600, 약 2.3:1 (mypage.jpg 의 "무제한")
  - 기준: 본문 4.5:1, 터치 44pt/48dp (`research/uiux-pro-max/data/ux-guidelines.csv` 36번, 22번)
- 문제: "선택 항목은 동의하지 않아도 서비스를 이용할 수 있습니다", "카드 불필요" 처럼 가입을 안심시키는 문구가 가장 안 보인다. 모바일에서 동의 3행이 32px 간격으로 붙어 있고 체크박스가 14px 이라 옆 행이나 "보기" 링크를 잘못 누르기 쉽다. "전체 동의합니다" 에 선택 항목이 포함된다는 표시가 없다.
- 제안: 보조 문구는 `text-neutral-400`(약 7:1) 이상으로 올리고, neutral-500 은 14px 이상 덜 중요한 글자에만 쓴다. 동의 행은 `py-2.5` 로 높이 44px 을 확보하고 체크박스 18~20px, "보기" 는 `px-2 py-2` 로 누를 영역을 넓힌다. 전체 동의 라벨은 "전체 동의 (선택 포함)". 마이페이지의 리셋 시점과 "무제한" 같은 정보도 neutral-400 으로 올린다. 체크박스와 버튼에 `focus-visible:ring-2 ring-white/70` 을 넣는다(전역 focus-visible 0건 이슈와 함께 처리).

## 처리 순서 제안

1. auth-01, auth-02 (로그인 폼 한 파일에서 같이 처리, 인증 파라미터라 확인 후)
2. auth-03, auth-09 (표시 조건과 문구만, 위험 낮음)
3. auth-04 의 (1)(2) (요금제 오류 안내, 뒤로가기 링크)
4. auth-05, auth-06 (한도 모달) → auth-11 공용 셸 → auth-10, auth-13
5. auth-07, auth-14, auth-15 (로그인 화면 재구성을 한 번에)
6. auth-08, auth-12 (마이페이지 테마 변환과 구조 개편을 한 번에)
