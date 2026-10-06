# pricing 영역 감사 보고서 (요금제 · 결제 · 약관류 · 계산기)

- 대상 라우트: `/pricing`, `/payment`, `/payment/toss`, `/payment/toss/fail`, 토스 카드등록 화면(`/api/toss/billing/page`), `/terms`, `/privacy`, `/refund`, `/tools/calculator`
- 읽은 파일: `src/app/pricing/` 4개, `src/app/payment/` 11개, `src/app/terms|privacy|refund/page.tsx`, `src/app/tools/calculator/` 2개 전부. 동선 확인을 위해 `src/lib/{payple,portone,toss,stripe,searchLimit,auth}.ts`, `src/app/api/toss/billing/{page,confirm}/route.ts`, `src/app/sign-in/_components/SignInForm.tsx`, `src/app/auth/callback/route.ts`, `src/app/studio/class/consulting/page.tsx` 를 함께 읽음.
- 본 스크린샷: `pricing-desktop-01~02`, `pricing-mobile-01~04`, `terms-desktop-01~02`, `terms-mobile-01~04`, `privacy-desktop-01~03`, `privacy-mobile-01~04`, `refund-desktop-01~02`, `refund-mobile-01~02`, `tools-calculator-desktop-01`, `tools-calculator-mobile-01~02`, `payment-desktop-01`, `payment-mobile-01`, `studio-class-consulting-desktop-01`, `studio-class-consulting-mobile-18`.
- 컨설팅 상세는 이미지 7장(`public/studio/consulting/1~7.png`)이라 가격·구성 문구는 Read 와 메모리 내 OCR(파일 생성 없음)로 확인.
- 한계: `/payment` 캡처는 비로그인이라 로그인 동의 화면으로 바뀌어 있다. 로그인 후 결제 화면은 코드로만 판단했다.
- 저장소 파일은 수정하지 않았다.

## 총평

완성도 2 / 5 (요금제 페이지 단독은 4, 결제 · 약관류 · 계산기는 2).

요금제 페이지(`/pricing`)는 이미 확정 테마(블랙, neutral, 에메랄드 체크, 화이트 CTA)로 바뀌어 있고, 카드의 한도 수치와 가격이 실제 설정값과 일치해 이 영역에서 가장 잘 되어 있다. 문제는 그 다음 단계에 몰려 있다. 결제가 실패하면 `/pricing?error=...` 로 돌아오는데 요금제 페이지가 이 값을 읽지 않아 아무 안내가 없고, 로그아웃 상태에서 유료 플랜을 누르면 로그인 뒤 `/search` 로 떨어져 선택한 플랜이 사라지며, 토스 카드등록 화면의 돌아가기 링크는 월간 선택을 연간으로 바꾼다. 연간이 기본 선택인 카드에는 "₩15,000 / 월"만 보이고 실제 청구액(연 ₩180,000 일시 결제)은 결제 화면에서 처음 나온다. `/payment`, 약관류 3종, 계산기는 구 gray · blue · teal 테마 그대로다(담당 폴더 합계 `gray-` 181건, `teal-` 25건). TEAM BIBL 가격(₩490,000/월)은 컨설팅 페이지와 일치하지만 명칭, CTA 문구, 구성 설명은 어긋나고, 요금제 하단 · FAQ · 환불정책 · 약관이 환불과 요금에 대해 서로 다른 내용을 말한다.

## 유지할 점

1. `/pricing` 은 확정 테마로 변환 완료(`src/app/pricing` 내 `gray-` 0건, `teal-` 0건, `neutral-` 45건). 다시 설계할 필요 없이 손질만 하면 된다.
2. 추천 플랜 강조 방식: 화이트 테두리 + 화이트 "추천" 배지 + 화이트 CTA. 색이나 글로우 없이 명도만으로 강조하며, 레퍼런스(Vercel · Cursor · Resend 의 featured tier)와 같은 방향이다.
3. 연간 토글 안의 "최대 21% 할인" 배지와 카드의 "월간 대비 ₩48,000 절약" 실제 절약액 표기(계산 정확). TEAM BIBL 의 "월간 결제만 제공됩니다" 예외 안내.
4. 카드 수치의 정확성: 플랜별 검색 한도가 `src/lib/stripe.ts` 설정과, 가격이 `src/lib/{payple,portone,toss}.ts` 3곳과 모두 일치한다.
5. 데스크톱 4열에서 CTA 가 `flex-1` 로 같은 높이에 정렬되고, FAQ 는 7문항 · 헤어라인 구분 · 넓은 클릭 영역(`py-4`)으로 간결하다.
6. `/pricing`, `/terms`, `/privacy`, `/refund` 는 서버에서 인증을 읽지 않는 정적 페이지다. 개선 시에도 `searchParams` · `auth()` 를 page 에서 읽지 않는다.
7. `/payment` 의 구조(420px 단일 컬럼, 주문 요약 → 결제수단 → 고지 → 약관 링크, 뒤로가기, noindex)는 그대로 두고 색과 상태 표시만 고친다.
8. 약관류의 조항 단위 `section > h2` 구조, YouTube API 고지 박스의 최상단 배치, 환불 기준 표, 계산기의 2단계 흐름과 고지 문장(YouTube API 정책 대응)은 문장을 바꾸지 않는다.

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| pricing-01 | P1 | bug | 결제 실패 후 요금제 페이지에 아무 안내가 없다 | S |
| pricing-02 | P1 | bug | 로그아웃 상태에서 유료 플랜을 누르면 로그인 뒤 /search 로 떨어진다 | S |
| pricing-03 | P1 | content-clarity | 연간 기본 상태에서 실제 청구액이 카드에 없다 | S |
| pricing-04 | P1 | bug | 토스 카드등록 화면의 돌아가기가 월간을 연간으로 바꾼다 | S |
| pricing-05 | P1 | bug | 토스 결제 내역에 실제 청구액이 아닌 금액이 기록된다 | S |
| pricing-06 | P1 | theme-violation | 결제 화면 3종이 구 gray · blue · teal 테마 | M |
| pricing-07 | P2 | interaction-feedback | 결제수단 선택과 카드 폼의 상태 표시 부족 | M |
| pricing-08 | P2 | content-clarity | TEAM BIBL 카드: 가격은 일치, 명칭 · CTA · 구성은 불일치 | S |
| pricing-09 | P2 | content-clarity | 요금제 하단 · FAQ · 환불정책 · 약관이 서로 다른 사실을 말한다 | M |
| pricing-10 | P2 | layout | 플랜 카드의 행 어긋남, 테두리 · 보조 버튼 · 저대비 | M |
| pricing-11 | P2 | mobile | 모바일에서 추천 플랜이 2화면 아래, 헤드라인 단어 중간 끊김 | S |
| pricing-12 | P2 | accessibility | FAQ 아코디언과 월간/연간 토글에 상태 시맨틱이 없다 | S |
| pricing-13 | P2 | interaction-feedback | 요금제 CTA 가 로그인 · 구독 상태를 반영하지 않는다 | M |
| pricing-14 | P2 | typography | 약관류 3종: gray · teal 잔재와 본문 가독성 | M |
| pricing-15 | P2 | theme-violation | 계산기: 구 테마, 이모지, 4색 버튼, 그라데이션, 제목 오표시 | M |

---

## 발견 상세

### pricing-01 · P1 · bug · 공수 S
**결제 실패 후 요금제 페이지에 아무 안내가 없다**

- 페이지: `/pricing`, `/payment`
- 파일: `src/app/pricing/page.tsx`, `src/app/payment/page.tsx` (참고: `src/app/api/toss/billing/confirm/route.ts`, `src/app/api/toss/billing/page/route.ts`)
- 근거
  - 실패 리다이렉트가 전부 `/pricing?error=billing|payment|portone` 로 간다: `src/app/api/toss/billing/confirm/route.ts:28,34,64,103,138`, `src/app/api/toss/billing/page/route.ts:41`(failUrl), `src/app/api/portone/confirm/route.ts:88,92`.
  - `src/app/pricing/page.tsx:23` 의 `PricingPage()` 는 `searchParams` 를 받지 않고, `PricingCards` · `FaqAccordion` · `PricingButtons` 어디에도 `useSearchParams` 가 없다.
  - 에러 문구와 배너는 `src/app/payment/page.tsx:28-32, 68-75` 에 있지만 `/payment?error=` 로 보내는 코드는 0건이다.
  - 실패 전용 화면 `src/app/payment/toss/fail/page.tsx` 는 미사용 컴포넌트(`toss/_components/TossPaymentWidget.tsx:73`)만 가리킨다.
- 문제: 카드 등록이나 첫 결제가 실패하면 사용자는 요금제 페이지 맨 위로 돌아올 뿐이다. 실패했는지 결제됐는지, 다시 눌러도 되는지 판단할 근거가 화면에 없다.
- 제안
  - `/pricing` 헤더와 토글 사이에 에러 배너를 넣는다. 정적 렌더를 지키기 위해 page 에서 `searchParams` 를 읽지 말고, `useSearchParams` 를 쓰는 작은 클라이언트 컴포넌트를 `<Suspense>` 로 감싼다.
  - 문구는 `payment/page.tsx:29-31` 의 기존 문장을 그대로 쓴다. 토스가 failUrl 에 붙여 주는 `message` 가 있으면 보조 줄로 보여 준다.
  - 스타일은 시맨틱 레드(`border-red-500/40 bg-red-500/10 text-red-300`), 맨 SVG 아이콘, `role="alert"`.
  - API 라우트는 건드리지 않는다.

### pricing-02 · P1 · bug · 공수 S
**로그아웃 상태에서 유료 플랜을 누르면 로그인 뒤 /search 로 떨어진다**

- 페이지: `/pricing`, `/sign-in`, `/payment`
- 파일: `src/app/pricing/_components/PricingButtons.tsx`, `src/app/sign-in/_components/SignInForm.tsx`, `src/app/auth/callback/route.ts`
- 근거
  - `PricingButtons.tsx:37-40` 이 `/sign-in?redirect_url=/pricing` 으로 보낸다(`payment/page.tsx:19` 도 동일).
  - `SignInForm.tsx:63` 은 콜백을 `/auth/callback?next=/search` 로 고정한다. `redirect_url` 을 읽는 코드는 저장소 전체에 0건이다.
  - `auth/callback/route.ts:8,15` 는 `next` 로 이동한다.
  - `shots/before/payment-desktop-01.png`: `/payment` 가 로그인 동의 화면으로 바뀐 모습.
- 문제: 요금제 페이지 방문자의 대부분인 비로그인 사용자가 "Pro 시작하기"를 누르면 동의 → 소셜 로그인 뒤 검색 화면에 도착한다. 선택한 플랜과 결제 주기가 사라지고, 결제를 이으려면 요금제 메뉴를 다시 찾아 같은 버튼을 한 번 더 눌러야 한다.
- 제안
  - 로그인 폼이 `redirect_url`(같은 출처의 `/` 로 시작하는 상대 경로만 허용)을 콜백의 `next` 로 넘기고, `PricingButtons` 는 `redirect_url` 에 `/payment?plan=..&period=..` 를 인코딩해 넣는다.
  - 인증 흐름 수정이라 불변 조건 4에 걸린다. 소유자 승인 후 진행한다.
  - 승인 전까지의 UI 대안: 선택한 plan · period 를 `sessionStorage` 에 저장해 두고, 로그인 뒤 `/pricing` 에 다시 오면 해당 카드 CTA 를 "결제 이어서 하기"로 표시한다.

### pricing-03 · P1 · content-clarity · 공수 S
**연간 기본 상태에서 실제 청구액이 카드에 없다**

- 페이지: `/pricing`
- 파일: `src/app/pricing/_components/PricingCards.tsx`
- 근거
  - `shots/before/pricing-desktop-01.png`, `pricing-mobile-02.png`: Starter 카드에 "₩15,000 / 월"과 "월간 대비 ₩48,000 절약"만 보인다.
  - `PricingCards.tsx:130` 기본값이 연간, `:178` 단위는 항상 "/ 월". `yearlyTotal` 은 `:12, 53, 77` 에 정의만 되고 렌더(`:193-216`)에서 쓰이지 않는다.
  - 실제 청구는 연 1회 ₩180,000 · ₩468,000 (`src/lib/payple.ts:14,21`, `src/app/payment/page.tsx:37-38, 61-64` "연 1회 결제").
- 문제: 사용자는 월 15,000원이 매달 나가는 줄 알고 누르고, 결제 화면에서 처음 ₩180,000 을 본다. 결제 직전에 금액 인식이 12배로 바뀐다. 부가세 포함 여부도 표기가 없다(컨설팅 상세 이미지는 "부가세(VAT) 포함"으로 적는다).
- 제안
  - 연간 선택 시 가격 아래에 한 줄을 추가한다: "연 ₩180,000 결제" (`yearlyTotal` 사용, `text-xs text-neutral-400`). 기존 절약 문구는 유지.
  - 월간 선택 시에는 같은 자리에 "매월 결제".
  - 토글 라벨을 "월간 결제 / 연간 결제"로 바꾸는 것을 검토.
  - 부가세 포함 여부는 소유자 확인 후 카드 아래 안내에 한 줄.
  - 레퍼런스: ui-ux-pro-max `landing.csv` 의 Pricing 패턴 2건이 "월 · 연 실제 합계와 절약액을 투명하게 표시"를 전환 최적화 항목으로 든다.

### pricing-04 · P1 · bug · 공수 S
**토스 카드등록 화면의 돌아가기가 월간을 연간으로 바꾼다**

- 페이지: `/payment`, `/payment/toss` (실제 화면은 `/api/toss/billing/page`)
- 파일: `src/app/api/toss/billing/page/route.ts`, `src/app/payment/toss/page.tsx`
- 근거
  - `route.ts:69`: `href="${origin}/payment?plan=${plan}"` 에 `period` 가 없다.
  - `src/app/payment/page.tsx:24`: `period` 가 없으면 `yearly` 로 처리한다.
  - 같은 화면이 이메일과 이름을 쿼리스트링으로 받는다: `payment/toss/page.tsx:26-27`, `route.ts:31-32`.
- 문제: 월간(₩19,000)을 고른 사용자가 토스 화면에서 "결제수단 선택으로 돌아가기"를 누르면 결제 화면이 연간 ₩180,000 으로 바뀐다. 10px 배지와 금액 숫자 외에는 변화를 알리는 표시가 없어 그대로 연간 결제를 진행할 수 있다. 부수적으로 이메일 · 이름이 URL 에 실려 브라우저 기록과 서버 로그에 남는다.
- 제안
  - 링크에 `&period=${period}` 를 추가한다(마크업 1줄).
  - 이메일 · 이름은 라우트가 이미 `auth()` 를 호출하므로 서버에서 `currentUser()` 로 읽고 쿼리에서 빼는 방안을 소유자에게 제안한다(결제 로직 영역, 승인 필요).

### pricing-05 · P1 · bug · 공수 S
**토스 결제 내역에 실제 청구액이 아닌 금액이 기록된다**

- 페이지: `/mypage` 결제 내역, 관리자 매출
- 파일: `src/app/api/toss/billing/confirm/route.ts`
- 근거
  - `route.ts:40` 에서 `chargeAmount`(연간 180,000 / 월간 19,000)로 청구하고(`:83`), `insertPayment` 에는 `planData.amount`(15,000, 연간 월환산값)를 저장한다(`:98`, `:127`).
  - 포트원 경로는 `chargeAmount` 를 저장한다(`src/app/api/portone/billing/confirm/route.ts:68, 99`).
  - 마이페이지는 저장값을 그대로 보여 준다(`src/app/mypage/page.tsx:187`).
- 문제: 토스로 결제한 사용자의 결제 내역에 ₩15,000 이 찍힌다(카드 청구는 ₩180,000 또는 ₩19,000). 사용자에게는 금액 불일치, 운영자에게는 매출 집계 오차다.
- 제안: 결제 API 로직이라 이번 UI 작업 범위 밖이다. 소유자에게 별도 보고한다. 두 곳의 `amount` 를 `chargeAmount` 로 바꾸는 수정과 기존 레코드 보정 여부를 정해야 한다.

### pricing-06 · P1 · theme-violation · 공수 M
**결제 화면 3종이 구 gray · blue · teal 테마**

- 페이지: `/payment`, `/payment/toss/fail`, `/api/toss/billing/page`
- 파일: `src/app/payment/page.tsx`, `src/app/payment/_components/PaymentButtons.tsx`, `src/app/payment/toss/fail/page.tsx`, `src/app/api/toss/billing/page/route.ts`
- 근거
  - `payment/page.tsx:41` `bg-gray-950`, `:56, 78` `bg-gray-900 border-gray-800` (파일 내 `gray-` 23건).
  - `PaymentButtons.tsx:225` 선택 상태 `border-blue-500 bg-blue-500/10`, `:241` 스피너 `border-t-blue-400`, `:259, 266` `focus:outline-none focus:border-blue-500`, `:273` `bg-blue-600` 색 배경 버튼.
  - `PaymentButtons.tsx:177-181, 188-192, 201-204`: 둥근 색 박스 안에 글자 T · K 와 카드 아이콘을 넣은 가짜 로고(아이콘 박스).
  - `toss/fail/page.tsx:30` `bg-teal-500` 버튼, `:15` 원형 아이콘 박스.
  - `route.ts:52-64`: `#0a0a0f` 배경 + 흰 카드 + `#3182F6` 버튼의 별도 인라인 스타일. `.back` 색 `#666`(대비 약 3.4:1).
  - 미사용 컴포넌트 7개(import 0건): `PaypleWidget`, `TossBillingButton`, `InicisButton`, `KcpButton`, `PortoneButton`, `toss/_components/TossPaymentWidget`, `toss/_components/TossCheckoutWidget`.
- 문제: 블랙 요금제 페이지에서 CTA 를 누르면 남색 배경 · 파란 버튼 화면으로, 토스를 누르면 흰 카드 화면으로 바뀐다. 결제 직전 세 화면의 톤이 모두 달라 같은 서비스로 보이지 않는다.
- 제안
  - `gray-` → `neutral-`, 배경 `bg-black`, 카드 `bg-neutral-900 border-neutral-800`.
  - 선택 상태 `border-white`, 스피너 neutral, 입력 포커스 `focus-visible:border-white`, "카드 등록 및 결제"는 화이트 CTA.
  - 로고 박스를 빼고 결제수단 이름 텍스트만 둔다(필요하면 맨 SVG 카드 아이콘).
  - 토스 HTML 화면도 같은 값(`#000` 배경, `#171717` 카드, `#262626` 테두리, 흰 버튼 + 검은 글자)으로 인라인 CSS 를 교체한다. 스크립트 부분은 건드리지 않는다.
  - fail 페이지는 화이트 CTA + 맨 SVG.
  - 미사용 7개는 변환하지 않는다. 삭제는 결제 관련 파일이므로 소유자 확인 후.

### pricing-07 · P2 · interaction-feedback · 공수 M
**결제수단 선택과 카드 폼의 상태 표시 부족**

- 페이지: `/payment`
- 파일: `src/app/payment/_components/PaymentButtons.tsx`, `src/app/payment/page.tsx`
- 근거
  - 준비중인 카카오페이는 클릭을 무시하지만(`PaymentButtons.tsx:31`) 버튼은 `disabled` 가 아니고(`:222` 는 loading 만 본다) hover 스타일이 있다(`:227`).
  - 토스 키가 없으면 클릭을 무시하는데(`:26, 30`) 화면은 활성 상태 그대로다.
  - 실패 안내가 `alert()` 이다(`:132, 148, 154, 158`). 입력 검증 실패만 인라인(`:268`).
  - 입력칸에 label · aria-label · autoComplete · inputMode 가 없고 placeholder 뿐이다(`:254-267`).
  - "토스페이먼츠 / 신용·체크카드 간편결제 (우리카드 제외)"(`:173-176`)와 "신용·체크카드 / 정기결제 (자동결제)"(`:184-186`)가 모두 카드 결제인데 차이 설명이 없다. 하나는 다른 화면으로 이동하고 하나는 폼이 펼쳐지는데 둘 다 같은 오른쪽 화살표다(`:245-247`).
  - 자동 갱신 · 7일 취소 고지가 `text-xs text-gray-600`(`payment/page.tsx:91-96`, 대비 약 2.7:1), 약관 동의 문장 11px(`:101`), "SSL 보안 결제" `text-gray-700`(`:112`, 약 2.0:1). WCAG AA 4.5:1 미달.
  - 결제 성공 뒤 이동하는 `/search?upgraded=1` 배너는 틸 + 이모지 + "새로고침하면 표시" 안내다(`src/app/search/page.tsx:246-253`, 검색 영역 담당).
- 문제: 누를 수 없는 항목이 누를 수 있어 보이고, 실패는 브라우저 기본 경고창으로만 알려 주며, 자동 갱신 고지가 거의 보이지 않는다.
- 제안
  - 준비중 항목: `disabled` + `aria-disabled` + `cursor-not-allowed`, hover 제거.
  - 실패 메시지: 결제수단 목록 아래 인라인 레드 영역(`role="alert"`)으로 통일.
  - 입력칸: 보이는 라벨, `autoComplete="name"` / `"tel"`, `inputMode="numeric"`.
  - 두 카드 수단의 설명 줄을 사실대로 구분한다(문구는 소유자 확인). 폼을 여는 항목은 아래 방향 화살표, 이동하는 항목은 오른쪽 화살표.
  - 고지문은 `text-neutral-400` 12~13px.
  - 주문 요약에 연간일 때 "월 ₩15,000 꼴 · 12개월" 한 줄(표시만).

### pricing-08 · P2 · content-clarity · 공수 S
**TEAM BIBL 카드: 가격은 일치, 명칭 · CTA · 구성은 불일치**

- 페이지: `/pricing`, `/studio/class/consulting`
- 파일: `src/app/pricing/_components/PricingCards.tsx`, `src/app/pricing/_components/FaqAccordion.tsx`, `src/app/pricing/page.tsx`
- 근거
  - 가격 일치: 카드 ₩490,000 / 월(`PricingCards.tsx:100`). 컨설팅 상세 `public/studio/consulting/6.png` 하단 "부가세(VAT) 포함 ₩490,000/월", "컨설팅은 부가세 포함 월 49만원이며, 카드결제로만 등록이 가능합니다".
  - 명칭: 카드 "TEAM BIBL" + "1:1 유튜브 비즈니스 컨설팅"(`:99, 103`), FAQ "Team bibl 플랜"(`FaqAccordion.tsx:28`), 메타 설명 "Business" · "비즈니스 플랜"(`pricing/page.tsx:8, 16`), 약관 "Business"와 "TEAM BIBL" 혼용(`terms/page.tsx:40, 66`), 컨설팅 페이지와 상단 메뉴 "팀비블 1:1 유튜브 컨설팅"(`studio/class/consulting/page.tsx:56`).
  - CTA: 카드 "TEAM BIBL 시작하기"(`:116`)가 새 탭으로 외부 결제 페이지에 바로 간다(`:120, 249-257`). 외부 이동 표시가 없다. 컨설팅 페이지는 같은 URL 에 "1:1 팀비블 신청하기" + "신청 페이지로 이동합니다"를 쓴다(`consulting/page.tsx:17, 62`, `studio-class-consulting-desktop-01.png`).
  - 구성: `4.png` "매주 1회, 30분간 비블 1:1 컨설팅 / VOD 100강 제공 / 매월 오프라인 유튜버 커뮤니티 / 24시간 내 답변드리는 비블 핫라인 / 비블 주관 모든 행사 VIP 초청", `2.png` "20명 소수 정예", `6.png` "평균적으로 3개월의 대기 기간". 카드에는 핫라인 · VIP · 정원 · 대기 안내가 없고, 카드에만 "영상 · 채널 검색 무제한, Pro의 모든 기능 포함"(`:106-111`)이 있다.
  - FAQ 는 "Pro 최대 2명, Team bibl 최대 5명, 팀 공유는 준비 중"(`FaqAccordion.tsx:28`)이라고 하는데 Pro 카드는 "팀 공유"를 취소선으로 제외 표시한다(`PricingCards.tsx:92`). `comingSoon` 배지(`:6, 240-242`)는 정의만 있고 쓰이지 않는다.
  - 코드에 플랜이 둘 있다: `business` "Team bibl"(무제한, `src/lib/stripe.ts:93-111`)과 `team` "팀비블"(Starter 와 같은 한도, 관리자 지정, `:112-130`). 외부 결제 고객에게 어느 쪽을 주는지는 코드로 확인할 수 없다.
- 문제: 같은 상품이 화면마다 다른 이름으로 나오고, 월 49만원 상품의 버튼이 설명 없이 외부 결제로 넘어간다. 컨설팅 페이지가 알리는 정원과 대기 조건을 요금제에서 온 사용자는 보지 못한다.
- 제안
  - 표시 이름을 하나로 정해 카드 · FAQ · 메타 · 약관에 통일한다(소유자 결정).
  - 카드 CTA 문구를 컨설팅 페이지와 같은 "1:1 팀비블 신청하기"로 맞추고 버튼 아래 "신청 페이지로 이동합니다"(기존 문장)를 표기한다.
  - 그 아래 "컨설팅 안내 보기" 텍스트 링크로 `/studio/class/consulting` 을 연결한다.
  - 가격 줄에 "부가세 포함", 목록에 컨설팅 페이지 문장 그대로 "20명 소수 정예" 추가를 검토한다.
  - Pro 의 "팀 공유"는 FAQ 가 맞다면 `disabled` 대신 `comingSoon` 으로 바꾼다.
  - `team` / `business` 부여 기준은 소유자 확인.

### pricing-09 · P2 · content-clarity · 공수 M
**요금제 하단 · FAQ · 환불정책 · 약관이 서로 다른 사실을 말한다**

- 페이지: `/pricing`, `/refund`, `/terms`, `/privacy`, `/payment`
- 파일: `src/app/pricing/page.tsx`, `src/app/pricing/_components/FaqAccordion.tsx`, `src/app/refund/page.tsx`, `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`
- 근거
  1. 환불: `pricing/page.tsx:48` "구독은 언제든지 취소 가능하며 남은 기간은 환불 처리됩니다" 와 `refund/page.tsx:51-52` "결제 후 7일 초과: 원칙적으로 환불 불가", `:26` "취소 후에도 현재 결제 기간이 종료될 때까지 이용". FAQ(`FaqAccordion.tsx:16`)는 7일 제한 없이 "잔여 기간에 비례하여 환불".
  2. 해지 후 데이터: FAQ(`:32`) "구독 해지 즉시 … 모두 삭제" 와 `refund/page.tsx:26`, 마이페이지 취소 확인창(`src/app/mypage/_components/CancelSubscriptionButton.tsx:63`) "현재 결제 기간 종료까지 계속 이용".
  3. 요금과 주기: `terms/page.tsx:63-66` "월 단위 자동 갱신 … Starter ₩15,000/월, Pro ₩39,000/월", `refund/page.tsx:19` "월 구독 서비스", 환불 계산식 "잔여 일수 / 30일"(`:48`). 실제는 월간 ₩19,000 · ₩45,000, 연간은 일시 결제(`PricingCards.tsx:51-53, 75-77`).
  4. 결제수단: FAQ(`:24`) "신용카드 및 체크카드(국내외)" 와 결제 화면 "(우리카드 제외)"(`PaymentButtons.tsx:175`).
  5. 날짜: `terms/page.tsx:14` "시행일: 2026년 5월 16일" 과 `:103` "2024년 1월 1일부터 시행". `privacy/page.tsx:14` 와 `:168` 도 같다(`terms-desktop-01.png`, `terms-desktop-02.png`).
  6. 수탁사와 수집 항목: `privacy/page.tsx:106` "Clerk, Inc. 회원 인증·관리"인데 실제 인증은 Supabase 다(`src/lib/auth.ts:1-5`, `package.json` 에 clerk 없음). 카드 결제 폼이 휴대폰 번호를 받는데(`PaymentButtons.tsx:261-267, 152`) 제3조 항목(`privacy/page.tsx:55-57`)에 없다.
  7. 초기화 시각: FAQ(`:20`) "매일 자정(UTC 기준)"은 한국 시간 오전 9시다.
- 문제: 환불 범위를 가장 눈에 띄는 요금제 페이지가 가장 넓게 적고 있고, 약관의 요금 · 주기 · 수탁사 표기가 실제 서비스와 다르다.
- 제안: 법적 문서이므로 문장 수정은 소유자 확인 후 진행한다. 순서는 다음과 같다.
  1. 요금제 하단 문장을 환불정책과 같은 뜻으로 맞추고 `/refund` 링크를 단다.
  2. FAQ 의 환불 · 해지 답변을 환불정책 문장에 맞춘다.
  3. 약관 제5조에 월간 · 연간 금액을 모두 적고 "Business" 명칭과 시행일을 정리한다.
  4. 수탁사 표와 수집 항목을 갱신한다.
  5. 초기화 시각에 "오전 9시(한국 시간)"를 병기한다.
  - 같은 값이 `src/app/about/page.tsx:186-189`, `src/app/layout.tsx:124-145, 211` 에도 있어 함께 맞춰야 한다(다른 영역 담당).

### pricing-10 · P2 · layout · 공수 M
**플랜 카드의 행 어긋남, 테두리 · 보조 버튼 · 저대비**

- 페이지: `/pricing`
- 파일: `src/app/pricing/_components/PricingCards.tsx`, `src/app/pricing/page.tsx`
- 근거
  - `shots/before/pricing-desktop-01.png`: "사용량" 라벨의 세로 위치가 Free 576px, TEAM BIBL 596px, Starter · Pro 624px 로 다르다. 취소선 가격 · 절약 문구 · 월간 전용 안내가 조건부 렌더이기 때문이다(`PricingCards.tsx:197-215`). 같은 이유로 토글을 바꾸면 카드 높이가 변해 아래 FAQ 가 밀린다.
  - 테두리 색이 4종이다(`:32` neutral-800, `:55` neutral-600, `:79` white/60, `:104` neutral-500). 굵기는 `border-2`(`:183`).
  - 보조 CTA 스타일이 3종이다(`:46`, `:70`, `:117`).
  - 제외 기능은 `text-neutral-600 line-through`, 엑스 표시는 `text-neutral-700`(`:234-236`, 대비 약 2.3:1, 1.7:1).
  - 카드 설명 12px `text-neutral-500`(`:194`, 약 3.8:1), 섹션 라벨 11px(`:219, 231`), 하단 안내 `text-neutral-600`(`page.tsx:46`, 약 2.7:1).
  - 체크와 엑스가 글자다(`:223, 236`).
  - h1 이 `font-extrabold`(`page.tsx:33`)로 홈(`font-black tracking-tight`, `src/app/page.tsx:144`)과 다르다.
  - 섹션 구성이 헤더 → 카드 → FAQ 뿐이다.
- 문제: 4개 플랜을 가로로 훑어 비교하려 해도 같은 항목이 같은 높이에 없고, 무엇이 빠졌는지는 흐린 취소선이라 읽기 어렵다. 테두리 밝기가 4단계라 추천 플랜의 화이트 테두리가 덜 두드러진다.
- 제안
  1. 4열 구간(`lg` 이상)에서 가격 블록을 고정 높이로 잡는다(해당 없는 줄은 `invisible` 로 자리만 유지). 행이 맞고 토글 시 밀림이 없어진다.
  2. 추천 외 카드는 전부 `border border-neutral-800`, 추천만 `border-white/60` 유지.
  3. 보조 CTA 는 한 가지(`border border-neutral-700 text-white hover:bg-neutral-800`)로 통일. 화이트 CTA 는 Pro 만.
  4. 제외 기능은 취소선을 빼고 `text-neutral-500` + 맨 SVG, 체크도 맨 SVG.
  5. 12px 이하 설명 · 라벨 · 하단 안내는 `text-neutral-400`.
  6. h1 `font-black tracking-tight`.
  7. 선택(P3): 카드 아래에 4열 기능 비교표와 하단 CTA 한 줄. ui-ux-pro-max `landing.csv` 의 "Pricing Page + CTA" 순서(카드 → 기능 비교표 → FAQ → 최종 CTA).

### pricing-11 · P2 · mobile · 공수 S
**모바일에서 추천 플랜이 2화면 아래, 헤드라인 단어 중간 끊김**

- 페이지: `/pricing`
- 파일: `src/app/pricing/page.tsx`, `src/app/pricing/_components/PricingCards.tsx`, `src/app/pricing/_components/PricingButtons.tsx`
- 근거
  - `shots/before/pricing-mobile-01.png`: h1 이 "원하는 플랜을 선택하세 / 요"로 끊긴다(`page.tsx:33`, `break-keep` 없음).
  - `pricing-mobile-01~03.png`: 카드 순서가 Free → Starter → Pro → TEAM BIBL(`PricingCards.tsx:168`). 추천 Pro 카드는 약 1,570px 지점에서 시작하고, 카드 4장이 약 550~2,580px 구간(약 2,030px, 844px 화면 2.4장)을 차지한다.
  - CTA 높이 약 40px(`py-2.5 text-sm`: `PricingCards.tsx:254`, `PricingButtons.tsx:49`).
- 문제: 모바일 방문자는 추천 플랜을 보기 전에 카드 두 장을 지나야 하고, 제외 기능 줄(Free 3줄, Starter 2줄, Pro 1줄)이 길이만 늘린다.
- 제안
  - h1 에 `break-keep`, 모바일 크기 `text-3xl`.
  - 기본안: 순서는 유지하고(레퍼런스 Vercel · Resend 도 모바일에서 순서 유지) 모바일에서 제외 기능 줄을 숨긴다(`hidden sm:flex`).
  - 대안(소유자 선택): `sm` 미만에서만 Pro 카드에 `order-first`.
  - CTA `py-3`(44px 이상).

### pricing-12 · P2 · accessibility · 공수 S
**FAQ 아코디언과 월간/연간 토글에 상태 시맨틱이 없다**

- 페이지: `/pricing`
- 파일: `src/app/pricing/_components/FaqAccordion.tsx`, `src/app/pricing/_components/PricingCards.tsx`
- 근거
  - `FaqAccordion.tsx:47-50`: 버튼에 `aria-expanded` · `aria-controls` · `type` 이 없고 질문이 제목 요소가 아니다.
  - 답변은 열렸을 때만 DOM 에 있다(`:61-65`). 닫힌 답변은 페이지 내 검색과 서버 렌더 HTML 에 없다.
  - 답변 안의 "환불 정책 페이지", "마이페이지 > 구독 관리"가 링크 없는 글자다(`:8, 12, 16`).
  - 토글 버튼(`PricingCards.tsx:137-163`)은 `aria-pressed` 없이 배경색으로만 선택을 표시한다. 월간을 고르면 할인 배지가 회색으로 바뀐다(`:156-160`).
- 문제: 스크린리더는 어떤 질문이 열렸는지, 어떤 결제 주기가 선택됐는지 알 수 없다. 닫힌 FAQ 답변은 Ctrl+F 로 찾을 수 없다.
- 제안
  - 질문을 `h3 > button`(`type="button"`, `aria-expanded`, `aria-controls`)으로 바꾸고, 답변은 항상 렌더한 뒤 `hidden` 속성으로 접는다(`id`, `role="region"`, `aria-labelledby`). 의존성 추가 없이 가능하다.
  - 답변 안의 페이지 언급은 `Link` 로 바꾼다.
  - 토글은 `role="group" aria-label="결제 주기"` + 각 버튼 `aria-pressed`. 할인 배지는 두 상태 모두 에메랄드 글자 유지.
  - 포커스 링은 전역 `focus-visible` 작업과 함께 맞춘다.

### pricing-13 · P2 · interaction-feedback · 공수 M
**요금제 CTA 가 로그인 · 구독 상태를 반영하지 않는다**

- 페이지: `/pricing`
- 파일: `src/app/pricing/_components/PricingButtons.tsx`, `src/app/pricing/_components/PricingCards.tsx`
- 근거
  - `PricingButtons.tsx:32-35`: Free 버튼은 로그인 여부와 무관하게 `/sign-up` 으로 보낸다. `/sign-up` 은 `/sign-in` 으로 리다이렉트하고(`src/app/sign-up/[[...sign-up]]/page.tsx:3`) 로그인 폼에는 세션 확인이 없어 로그인한 사용자도 동의 화면을 다시 본다.
  - 현재 플랜 표시가 없다. 버튼은 `isSignedIn` 만 본다(`:15, 22-23`).
  - 로딩 전에는 `disabled` + `opacity-50`(`:48-49`)이라 첫 화면에서 화이트 CTA 가 반투명으로 나왔다가 바뀐다.
  - 버튼 3개가 각각 `getUser()` 를 호출한다(`:19-27`).
  - 문구: "무료로 시작" 하나만 다르고 나머지는 "~ 시작하기"(`PricingCards.tsx:45, 69, 94, 116`).
  - 앱 내부의 업그레이드 링크 약 20곳이 `/pricing` 으로 온다(search, channels, saved, threads, mypage, 사용량 배지 등).
- 문제: 한도 초과로 업그레이드하러 온 로그인 사용자에게 자기 플랜이 어느 카드인지 보이지 않고, 이미 구독 중인 플랜도 "시작하기"로 나온다.
- 제안
  - `PricingCards` 에서 `/api/usage`(네비 배지가 이미 쓰는 엔드포인트, `plan` 반환: `src/lib/searchLimit.ts:177-211`)를 한 번 읽어 현재 플랜 카드의 CTA 를 "현재 플랜" 비활성 표시로 바꾼다. 로그인한 Free 사용자의 Free 버튼도 같다.
  - 인증 확인은 `PricingCards` 에서 1회만 하고 버튼에 내려 준다.
  - 로딩 중에는 반투명 대신 정상 스타일을 유지하고 클릭 시점에 판단한다.
  - "무료로 시작하기"로 문구를 맞출지는 소유자 확인.

### pricing-14 · P2 · typography · 공수 M
**약관류 3종: gray · teal 잔재와 본문 가독성**

- 페이지: `/terms`, `/privacy`, `/refund`
- 파일: `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/app/refund/page.tsx`
- 근거
  - 세 파일 모두 `main bg-gray-950` + `text-gray-400`(각 파일 `:11, 16`). `gray-` 합계 43건. 링크 `text-teal-400` 11건(`terms:26, 28, 30`, `privacy:21-24, 157`, `refund:68, 69, 72`).
  - `terms-desktop-01.png`: 배경이 요금제의 순수 블랙과 달리 남색이다. 본문 14px 가 한 줄에 약 70자(`max-w-3xl`)이고 "서비 / 스", "단 / 계적으로", "법 / 령을"처럼 단어 중간에서 줄이 바뀐다.
  - 목록이 `list-inside`(`terms:25, 36, 52, 62, 74` 등)라 둘째 줄이 글머리표 아래에서 시작한다(`terms-mobile-01.png`).
  - `privacy` 수탁사 표는 `text-xs` 3열(`:65-117`)이라 모바일에서 "위탁계약 종 / 료 시까지"가 8행 반복된다(`privacy-mobile-03.png`).
  - `refund` 표 첫 열이 "결제 후 7일 / 이내", "서비스 미이용 / 시"로 끊긴다(`refund-mobile-01.png`).
  - h1 `font-bold`, h2 `font-semibold`(사이트 헤드라인은 `font-black`).
  - 이메일 · 전화가 링크가 아니다(`terms:110`, `privacy:26, 130, 143`).
  - 조항 목차와 앵커가 없다(`privacy` 모바일 4,828px).
- 문제: 약관류만 구 남색 테마로 남아 있고, 데스크톱에서는 줄이 너무 길며 모바일에서는 단어가 잘려 읽기 어렵다.
- 제안
  - 세 페이지 공용 래퍼 하나로 정리: `bg-black`, 본문 `max-w-2xl`, `text-[15px] leading-7 text-neutral-300`, `break-keep`.
  - h1 `font-black tracking-tight`, h2 `font-bold text-white`.
  - 목록 `list-outside pl-5`.
  - 링크 `text-[#00E5A0] hover:text-[#66FFCC] underline`.
  - 박스는 `bg-neutral-900 border-neutral-800`. YouTube API 고지 박스는 최상단 위치를 유지하고 테두리만 `border-neutral-700`.
  - 표는 13px 이상, 첫 열 `whitespace-nowrap`, 모바일에서는 `min-w` + 가로 스크롤 또는 행을 세로로 쌓는다.
  - 이메일 `mailto:`, 전화 `tel:` 링크.
  - 선택(P3): h2 에 `id` 를 주고 상단에 조항 목록.
  - 문장은 바꾸지 않는다(내용 불일치는 pricing-09).
  - 레퍼런스: ui-ux-pro-max `ux-guidelines.csv` 73번 Line Length(영문 65~75자, 한글은 그 절반 폭이 기준).

### pricing-15 · P2 · theme-violation · 공수 M
**계산기: 구 테마, 이모지, 4색 버튼, 그라데이션, 제목 오표시**

- 페이지: `/tools/calculator`
- 파일: `src/app/tools/calculator/page.tsx`, `src/app/tools/calculator/_components/CalculatorClient.tsx`
- 근거
  - `tools-calculator-desktop-01.png`, `tools-calculator-mobile-01.png`: 남색 배경, 틸 배지, 틸 버튼.
  - `page.tsx:14` `bg-gray-950`, `:18-20` 틸 배지 + 이모지, `:33, 47` 제목 이모지.
  - `CalculatorClient.tsx:201` `bg-teal-500` 색 버튼, `:267, 274, 281, 288` 틸 · 블루 · 핑크 · 오렌지 4색 버튼, `:299` `bg-gradient-to-br`.
  - 라벨 · 버튼 · 결과 제목의 이모지(`:185, 209, 262, 269-290, 302`, 결과 라벨 `:116-162`).
  - `:193` `focus:outline-none focus:border-teal-500`. 폴더 합계 `gray-` 46건, `teal-` 12건.
  - `:184, 261` label 에 `htmlFor` 가 없다(두 번째는 버튼 묶음의 제목).
  - `:252, 303` 고지문이 10px `text-gray-600` / `text-gray-500`(대비 약 2.4:1).
  - `:92` 영상 제목 자리에 설명 첫 줄 80자를 넣는다. `fetchVideoDetail` 은 제목을 돌려주지 않고(`src/app/search/actions.ts:76-84`), 설명이 없으면 "설명이 없습니다."가 제목처럼 나온다.
  - 모바일에서 placeholder 가 잘린다(`tools-calculator-mobile-01.png`).
  - 사이트 안에서 이 페이지로 오는 링크가 0건이다(`src/app/sitemap.ts:72` 만).
- 문제: 금지 항목(틸, 그라데이션, 색 배경 버튼, 이모지 장식)이 한 화면에 모여 있고, 가져온 영상의 제목 대신 설명 문장이 나와 맞는 영상인지 확인하기 어렵다. 정책 대응용 고지문이 가장 작고 흐린 글자다.
- 제안: 문장은 그대로 두고 표현만 바꾼다.
  - `bg-black`, 카드 `bg-neutral-900 border-neutral-800`.
  - 단계 표시는 텍스트 `01`, `02`. 이모지 제거.
  - "데이터 가져오기"는 화이트 CTA.
  - 계산 버튼 4개는 같은 아웃라인(`border-neutral-700 hover:border-neutral-500 text-white`).
  - 결과 박스는 `bg-neutral-900` 단색.
  - 사용 안내는 앰버 시맨틱 유지 + 맨 SVG.
  - 고지문 12px `text-neutral-400`.
  - label `htmlFor` 연결, 버튼 묶음은 `fieldset` / `legend`, 결과 영역 `aria-live="polite"`.
  - placeholder 는 짧게 줄이고 형식 안내는 입력칸 아래 도움말로 옮긴다.
  - 제목 줄은 "영상 ID: ..."로 사실대로 표시한다(실제 제목은 서버 액션 수정이 필요해 별도 판단).
  - 진입 경로는 트렌드 서치 도구 목록 담당과 협의.

---

## 확인한 사실 (문제 없음)

| 항목 | 요금제 카드 | 대조한 곳 | 결과 |
|---|---|---|---|
| Starter 월간 / 연간 | ₩19,000 / 월 ₩15,000 (연 ₩180,000) | `src/lib/payple.ts:12-14`, `portone.ts:17-19`, `toss.ts:7-9` | 일치 |
| Pro 월간 / 연간 | ₩45,000 / 월 ₩39,000 (연 ₩468,000) | 같은 파일 | 일치 |
| TEAM BIBL | ₩490,000 / 월 | 컨설팅 상세 `6.png` "부가세(VAT) 포함 ₩490,000/월" | 일치 (카드에 부가세 표기만 없음) |
| 절약액 | ₩48,000 / ₩72,000, 최대 21% | (19,000-15,000)×12, (45,000-39,000)×12, 4,000/19,000 | 일치 |
| 검색 한도 | Free 2회·1회/일, Starter 50·30/월, Pro 500·500/월 | `src/lib/stripe.ts:36-91` | 일치 |

## 다른 영역 담당에 전달할 메모

- 결제 성공 배너(`src/app/search/page.tsx:246-253`)가 틸 + 이모지이고 "새로고침하면 표시"를 요구한다. 검색 영역.
- 홈의 `redirect_url`(`src/app/page.tsx:113, 119`)도 pricing-02 와 같은 이유로 무시된다. 인증 영역.
- 카카오 상담 플로팅 버튼이 모바일에서 약관 본문과 환불 표의 오른쪽을 덮는다(`privacy-mobile-01.png`, `refund-mobile-01.png`). 전역.
- `src/app/about/page.tsx:186-189` 와 `src/app/layout.tsx:124-145` 의 "월 요금"도 연간 환산가만 적혀 있다. pricing-03 · pricing-09 와 같이 맞춰야 한다.
- 푸터 위 남색 띠는 약관류와 계산기에서 본문 배경(`bg-gray-950`)과 겹쳐 더 넓게 보인다(`terms-desktop-02.png`).
