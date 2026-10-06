# home 영역 감사 보고서 (홈 · 소개 · 트렌드 서치 허브)

- 대상 파일: `src/app/page.tsx`, `src/app/_components/LandingStats.tsx`, `src/app/_components/SearchBar.tsx`, `src/app/about/page.tsx`, `src/app/trend-search/page.tsx`
- 대상 화면: `shots/before/home-desktop-01~02`, `home-mobile-01~04`, `about-desktop-01~03`, `about-mobile-01~06`, `trend-search-desktop-01`, `trend-search-mobile-01~02` (전부 확인)
- 방법: 코드 전문 읽기 + 스크린샷 육안 확인 + 스크린샷 픽셀 실측(읽기 전용). 저장소 파일은 수정하지 않았다.
- 현재 완성도: 3 / 5

## 총평

홈은 데스크톱에서는 확정 테마(블랙, neutral, 에메랄드 한 곳, 화이트 CTA)를 잘 지키고 가치 제안과 검색 행동이 첫 화면에 정리돼 있다. 그러나 모바일에서는 헤드라인이 단어 중간에서 끊기고 두 문장이 붙어 보이며, 검색창이 첫 화면 끝으로 밀린다. 내용 면에서는 분석 도구만 소개해 컨설팅·대행·커뮤니티·인큐베이팅이 본문에 없고, 제품 화면 미리보기와 검증 가능한 사회적 증거가 없으며 "10,000+"는 코드에 박힌 고정 숫자다. 가입 동선은 입력한 키워드를 잃고 "검색 결과가 없어요" 화면으로 끝나며, 허브는 Free 플랜에 포함된 채널 검색을 Starter+ 전용으로 표시한다. about 은 구 남색·틸 테마와 지난 요금제 정보가 그대로 남아 있다. 발견 15건 중 9건은 공수 S 라서 순서대로 빠르게 처리할 수 있다.

## 유지할 점

1. 홈 히어로의 구성과 카피(배지, 두 줄 헤드라인에 에메랄드 강조 한 곳, 서브카피, 검색창, 예시 칩). 데스크톱 첫 화면에서 가치 제안과 주 행동이 한눈에 들어온다. (`home-desktop-01.png`, `src/app/page.tsx:136-193`)
2. 홈·허브·통계 컴포넌트는 확정 테마를 정확히 지킨다. bg-black, neutral 계열만 사용(gray·teal 0건), 에메랄드는 2곳, 화이트 CTA, 맨 SVG 아이콘, 01·02·03 텍스트 숫자. (`src/app/page.tsx:286`)
3. 허브의 섹션 헤더(좌 캡션 + 우 영문 라벨 + 헤어라인), 카드 전체가 링크인 구조, 테두리만 쓴 잠금 배지. 홈·about 을 고칠 때 기준으로 삼는다. (`src/app/trend-search/page.tsx:85-88, 97-115`)
4. 검색 누적 흐름(saveToHistory 다음 router.push 에 count=N), 확인 다이얼로그와 "검색 중" 오버레이 연계는 그대로 둔다. (`src/app/page.tsx:40-73`, `src/app/_components/SearchBar.tsx:166-239`)
5. 로그인 모달이 입력한 키워드를 문구에 되비추고 무료 조건을 함께 알려 주는 방식. 키워드 전달 버그만 고친다. (`src/app/page.tsx:104-109`)
6. about 의 문장과 정보(서비스 성격 안내, FAQ, 요금 요약, JSON-LD)는 심사·검색 대응 목적이 있으므로 유지하고 스타일만 바꾼다. (`src/app/about/page.tsx:20-60, 136-150`)
7. 통계 숫자에 tabular-nums 를 써서 카운트 중 폭이 흔들리지 않고, 관찰자는 한 번 실행 후 해제된다. (`src/app/_components/LandingStats.tsx:43-53, 60`)
8. SearchBar 는 이미 neutral 테마이고, 검색 전 "사용량 1회 차감" 확인과 국가 선택 구성이 실용적이다. 홈 입력창은 16px 라 iOS 확대가 없다. (`src/app/_components/SearchBar.tsx:230-233, 270-308`, `src/app/page.tsx:168`)

## 발견 목록 (중요한 순서)

### home-01 · P0 · mobile · 공수 S
**모바일 홈 히어로 문구가 깨져 보인다 (단어 중간 줄바꿈, 띄어쓰기 누락)**

- 페이지: `/`
- 파일: `src/app/page.tsx`, `src/app/_components/LandingStats.tsx`
- 근거: `home-mobile-01.png` ("유튜브 트렌드를 파 / 악하세요", "확인하고경쟁력 있 / 는", 통계 라벨 "2회 가 / 능"), `home-mobile-03.png` ("업그레이드하세요.영상 검색", 마지막 줄에 "것" 한 글자) · `src/app/page.tsx:145-151, 256-258` · `src/app/_components/LandingStats.tsx:123-126`
- 문제: 390px 폭에서 h1(text-5xl, 48px)이 "파/악하세요"로 끊긴다. 서브카피와 하단 CTA 문단은 `<br className="hidden sm:block" />` 앞뒤에 공백이 없어서, 모바일에서 br 이 숨겨지면 두 문장이 붙는다("확인하고경쟁력", "업그레이드하세요.영상 검색"). 통계 라벨도 3칸 그리드(칸당 약 108px)에서 "가/능"으로 끊긴다. 모바일 방문자 전원이 첫 화면에서 보는 오류다.
- 제안: h1 에 `break-keep text-balance` 를 주고 크기를 `text-4xl sm:text-5xl md:text-6xl` 로 낮춘다. 36px 이면 "키워드 하나로 / 유튜브 트렌드를 / 파악하세요" 3줄, 32px 이면 2줄로 떨어진다(글꼴에 따라 달라지므로 실측 필요). 두 곳의 br 앞에 `{" "}` 를 넣는다. p 와 통계 라벨에도 break-keep 을 준다(전역 규칙으로 넣는다면 그쪽에 맡김).

### home-02 · P1 · bug · 공수 S
**로그인 모달의 "회원가입 후 검색하기"가 입력한 키워드를 넘기지 못한다**

- 페이지: `/`, `/sign-in`, `/search`
- 파일: `src/app/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`, `src/app/sign-in/_components/SignInForm.tsx`, `src/app/auth/callback/route.ts`, `src/app/_components/SearchBar.tsx`
- 근거: `src/app/page.tsx:113, 119` (redirect_url=/search?q=…) · `src/app/sign-up/[[...sign-up]]/page.tsx:3` (redirect("/sign-in"), 쿼리를 버림) · `src/app/sign-in/_components/SignInForm.tsx:61-63` (URL 에서 ref 만 읽고 next=/search 고정) · `src/app/auth/callback/route.ts:8, 15` · `search-desktop-01.png`, `src/app/search/_components/SearchResultList.tsx:286` · redirect_url 은 src 전체에서 쓰는 곳 7곳, 읽는 곳 0곳(grep)
- 문제: 비로그인 방문자가 키워드를 입력하면 확인 다이얼로그(`page.tsx:79`) → 로그인 모달(`:65-68`) → 동의 화면(`SignInForm.tsx:15`) → 소셜 로그인 → 빈 /search 순서로 이동한다. 입력한 키워드는 사라지고, 가입 직후 첫 화면이 "검색 결과가 없어요"라서 검색이 실패한 것처럼 보인다. 비로그인에게 확인 다이얼로그는 의미 없는 한 단계다. 모달의 두 버튼은 결국 같은 /sign-in 으로 간다. 모달은 "1분 만에 시작"(`page.tsx:109`), 로그인 화면은 "3초 만에"(`SignInForm.tsx:232`)로 문구도 다르다.
- 제안: UI 계층 해결안: 모달을 열 때 키워드를 sessionStorage 에 넣고, /search 가 q 없이 열리면 SearchBar 입력창에 미리 채운다(자동 검색·차감 없음, executeSearch·saveToHistory 불변). 비로그인이면 확인 다이얼로그 없이 바로 모달을 띄우고, 버튼은 화이트 하나("로그인하고 검색하기")와 닫기로 줄인다. 정석 해결(SignInForm 의 next 에 /search?q=… 전달)은 인증 흐름 수정이라 소유자 승인 후 진행하고, 그때 next 는 "/search" 로 시작하는 경로만 허용한다(`route.ts:15` 가 origin 뒤에 값을 그대로 붙인다).

### home-03 · P1 · content-clarity · 공수 S
**통계 띠의 "10,000+"는 고정값이고 나머지 두 칸은 통계가 아니다**

- 페이지: `/`
- 파일: `src/app/_components/LandingStats.tsx`, `src/app/page.tsx`
- 근거: `src/app/_components/LandingStats.tsx:124` (end={10000} 고정, 데이터 연결 없음), `:125-126` · `home-desktop-01.png` (9,990+ 로 찍힘), `home-mobile-01.png` (9,557+) · `src/app/page.tsx:11, 180-182` (고정 목록인데 라벨은 "인기 키워드") · `src/app/api/search-count/route.ts:19-23` (실데이터는 오늘 검색 수뿐) · `src/app/layout.tsx:186-192` (JSON-LD 평점 4.8, 리뷰 47 도 고정값)
- 문제: "10,000+ 키워드 분석됨"은 실제 집계와 연결되지 않은 숫자다. 근거를 댈 수 없는 수치는 /studio 의 실제 실적(70만 구독자 등)까지 의심받게 한다. "실시간", "무료"는 숫자가 아니라 기능 설명이라 증거 역할을 못 한다. 고정 예시 목록에 "인기 키워드"라는 이름을 붙인 것도 같은 문제다. 카운트업은 JS 실행 전 HTML 에 "0+"로 들어가고 prefers-reduced-motion 을 보지 않는다.
- 제안: 소유자가 누적 수치를 확인해 주면 그 값으로, 아니면 숫자를 빼고 확인 가능한 사실로 바꾼다. 후보: 이미 공개된 운영 실적(`src/app/studio/_components/StatsCounter.tsx:12-16` 총 구독자 70만+, 누적 조회수 1.7억회+), 제품 사실(검색 국가 5개 `SearchBar.tsx:15-21`, 하루 2회 무료 `src/lib/stripe.ts:39`). 라벨은 "예시 키워드"로 바꾼다. 초기 렌더를 최종값으로 하고 모션 축소 설정이면 카운트업을 생략한다. JSON-LD 평점은 근거 확인 전까지 제거를 검토한다(레이아웃 담당에 전달).

### home-04 · P1 · conversion · 공수 M
**가입 전에 결과 화면을 볼 방법이 없다 (제품 미리보기 없음)**

- 페이지: `/`
- 파일: `src/app/page.tsx`
- 근거: `src/app/page.tsx:199-251` (아이콘과 문장만 있고 이미지 0개) · `home-desktop-01.png` · `src/app/page.tsx:65-68, 83-85` (검색과 예시 칩 모두 로그인 모달로 끝남) · public/ 에 제품 화면 이미지 없음 · 레퍼런스 `research/awesome-design-md/linear.app.DESIGN.md:266, 274`, `supabase.DESIGN.md:232` (제품 화면 캡처가 페이지의 중심)
- 문제: 비로그인 방문자가 누를 수 있는 것은 모두 로그인 모달로 끝나는데, 결과 화면이 어떻게 생겼는지 보여 주는 이미지가 한 장도 없다. 가입할지 판단할 근거가 문장뿐이다. "3단계로 바로 시작"은 히어로가 이미 말한 내용(입력하면 분석된다)을 되풀이한다.
- 제안: 통계 띠 아래에 실제 검색 결과 화면 캡처 1장을 넣는다. bg-neutral-900 + border-neutral-800 + rounded-2xl 패널에 화면 그대로(장식 효과 없이) 싣고, next/image 를 쓰며 모바일용 세로 캡처를 따로 둔다. 3단계 섹션은 이 패널의 캡션(01 입력, 02 수집, 03 확인)으로 합친다. 선행 조건: /search 결과 화면의 테마 변환이 끝난 뒤 캡처한다(현재 구 남색·틸).

### home-05 · P1 · navigation-ia · 공수 M
**홈 본문이 분석 도구만 소개한다 (컨설팅·대행·커뮤니티·인큐베이팅 없음)**

- 페이지: `/`
- 파일: `src/app/page.tsx`
- 근거: `src/app/page.tsx` 본문에 해당 단어·링크 0건(본문 링크는 `:262` /pricing 하나) · `:139-141` 배지 "bibl lab · 유튜브 트렌드 분석" · `src/app/layout.tsx:340-343` ("메인 서비스: 팀비블 컨설팅 · 채널 대행") · `src/app/sitemap.ts:9-14, 28-33` (대행 priority 1.0, 홈 0.9) · `home-desktop-01.png`
- 문제: 상단 메뉴는 사업 5개를 보여 주고 그중 컨설팅과 대행을 에메랄드로 강조하는데, 홈 본문은 키워드 검색 도구 이야기뿐이다. 처음 온 사람은 누가 운영하는지, 도구 말고 무엇을 하는지 본문에서 알 수 없고, 주력 사업으로 가는 길이 네비 한 줄뿐이다.
- 제안: 히어로(검색)는 그대로 두고 아래에 섹션 하나를 추가한다. 카드 4개(커뮤니티&자료, 팀비블 1:1 컨설팅, 유튜브 채널 대행, 브랜드 인큐베이팅)를 허브 카드와 같은 모양(`src/app/trend-search/page.tsx:97-115`)으로 놓고, 문구는 각 페이지의 기존 문장을 재사용한다(`src/app/studio/studio-content.json:7`, `src/app/studio/class/consulting/page.tsx:59`, `src/app/incubating/page.tsx:37`, `src/app/community/layout.tsx:26`). 히어로 배지에 운영 주체 사실(`studio-content.json:3` "총 70만+ 구독자 유튜브 크리에이터 '비블bibl'") 재사용을 검토한다. /studio 카드는 StudioGuard 문제(일반 방문자가 홈으로 튕김)가 풀린 뒤 연결한다.

### home-06 · P1 · bug · 공수 S
**허브가 "채널 찾기"를 Starter+ 전용으로 막는데 Free 플랜에는 채널 검색 1회/일이 들어 있다**

- 페이지: `/trend-search`, `/pricing`, `/channels`
- 파일: `src/app/trend-search/page.tsx`
- 근거: `src/app/trend-search/page.tsx:47-48, 59-60, 99` · `trend-search-desktop-01.png` ("Starter+ 필요", "요금제 보기 →") · `src/lib/stripe.ts:41, 49` (free: dailyChannelSearchLimit 1, canChannelSearch true) · `src/app/pricing/_components/PricingCards.tsx:36` ("채널 검색 1회/일"), `:91` ("채널 분석 리포트"는 Pro 항목) · `src/app/about/page.tsx:31` · `src/app/channels/page.tsx:159-186` (플랜 차단 없이 한도만 확인) · `src/app/my-channel/page.tsx`, `actions.ts` (플랜 확인 코드 없음) · `src/app/layout.tsx:120` 과 `:235` (JSON-LD 안에서도 설명이 서로 다름)
- 문제: 네비 간소화(커밋 a09f56b) 이후 허브가 /channels 로 가는 유일한 길인데, Free·비로그인에게는 카드 링크가 /pricing 으로 바뀐다. 요금제 페이지는 Free 에 "채널 검색 1회/일"을 적어 두었으므로 방문자는 요금제와 허브 사이를 맴돈다. "채널 분석"도 허브는 Starter+ 라고 하지만 페이지에는 플랜 제한이 없고 요금제 카드에는 Pro 항목으로 적혀 있어 세 곳이 다 다르다.
- 제안: 소유자에게 정책을 확인한 뒤 허브 표기를 실제 동작과 요금제 카드에 맞춘다. Free 채널 검색이 정책이면 "채널 찾기"는 잠금을 풀고 "무료 1회/일" 캡션을 달아 /channels 로 연결한다. "채널 분석", "수집한 영상"의 플랜명도 요금제 카드와 통일한다. 잠금 표시는 PLANS(`src/lib/stripe.ts`) 값을 읽어 정하면 다시 어긋나지 않는다. 표시 판정만 바꾸고 결제·검색 한도 로직은 건드리지 않는다.

### home-07 · P1 · mobile · 공수 S
**모바일 첫 화면에서 검색창이 맨 아래로 밀린다**

- 페이지: `/`
- 파일: `src/app/page.tsx`, `src/app/layout.tsx`
- 근거: `home-mobile-01.png` 실측(@2x): 네비 하단 266px(=133px), 검색창 1134~1265px(=화면 위에서 567~632px), 예시 칩은 665px 부터 · `src/app/page.tsx:136` (py-20), `:137` (space-y-8), `:145` (48px 헤드라인 3줄, 180px) · `src/app/layout.tsx:302, 361-394` (고정 네비 2줄)
- 문제: 390×844 기기에서 브라우저 UI 를 빼면 보이는 높이는 660px 안팎이다. 검색창이 그 끝에 걸리고 예시 칩은 잘린다. 375×667 급 기기에서는 검색창 자체가 첫 화면 밖이다. 홈의 유일한 주 행동이 첫 화면에 온전히 들어오지 않는다.
- 제안: 모바일에서 히어로 여백을 `py-10 sm:py-20`, 간격을 `space-y-6 sm:space-y-8`, 헤드라인을 text-4xl(home-01)로 줄이면 검색창 상단이 약 465px 로 100px 가량 올라와 검색창과 예시 칩이 한 화면에 들어온다(계산값, 실측 필요). 네비 2번째 줄(약 76px) 축소는 네비 담당 영역과 함께 처리한다.

### home-08 · P2 · theme-violation · 공수 M
**about 페이지가 구 남색·틸 테마 그대로다**

- 페이지: `/about`
- 파일: `src/app/about/page.tsx`
- 근거: `src/app/about/page.tsx` 클래스 집계: gray- 41, teal- 11, blue- 1, purple- 1, neutral- 0 · `:68` (bg-gray-950), `:73` (틸 배지), `:76-78` (font-extrabold, text-teal-400), `:91, :99, :107` (틸·블루·퍼플 소제목), `:136`, `:202`, `:228` (bg-teal-600 색 배경 CTA), `:234` · `about-desktop-01.png`, `about-desktop-03.png`, `about-mobile-05.png`
- 문제: 확정 규칙 네 가지(순수 블랙 배경, neutral 무채색, 에메랄드 단일 액센트, 화이트 CTA)를 모두 어긴다. 소제목에 틸·블루·퍼플이 쓰여 액센트가 셋이다. 홈·허브·요금제에서 넘어오면 다른 사이트처럼 보인다. 4,437px 내내 같은 모양의 회색 카드 19개가 이어져 구분이 없다.
- 제안: bg-black 으로 바꾸고 gray 를 neutral 로 치환한다. 소제목은 text-white 로 통일하고 에메랄드(#00E5A0)는 h1 강조 한 곳에만 쓴다. 틸 배지는 허브와 같은 섹션 헤더(좌 "bibl lab" + 우 "ABOUT" + 헤어라인)로 바꾸고 h1·h2 는 font-black. CTA 는 화이트 버튼 + 테두리 보조 버튼. 체크는 에메랄드, ✕ 는 레드 유지(시맨틱). FAQ 와 기능 목록은 카드 대신 요금제 FAQ 와 같은 헤어라인 목록(divide-neutral-800)으로 바꿔 리듬을 만든다. 문장은 그대로 둔다.

### home-09 · P2 · content-clarity · 공수 S
**about 내용이 현재 요금제·사이트 구조와 어긋난다**

- 페이지: `/about`
- 파일: `src/app/about/page.tsx`, `src/app/layout.tsx`
- 근거: `src/app/about/page.tsx:158` ("Pro 플랜으로 팀원 2명까지, Business 플랜으로 최대 5명") ↔ `src/app/pricing/_components/PricingCards.tsx:92` (Pro 의 팀 공유는 미제공 표시), `FaqAccordion.tsx:28` ("팀 공유 기능은 현재 준비 중"), about `:189` (현재 플랜명은 TEAM BIBL) · `:187-188` (₩15,000, ₩39,000 은 연간 결제 기준가, `PricingCards.tsx:51-52, 75-76`) · `:87-114` 와 `:117-133` (같은 기능을 두 섹션에서 반복) · `:242-248` ↔ `src/app/layout.tsx:419-425` (운영사 정보 중복, `about-desktop-03.png`) · `:227` (CTA 가 /search 로 연결, `search-desktop-01.png` "검색 결과가 없어요") · 내부 링크 0건(`src/app/sitemap.ts:66`, feed.xml 만 참조)
- 문제: 없어진 플랜명(Business)과 아직 제공하지 않는 팀 공유를 제공 중인 것처럼 적었다. 요금 표는 "월 요금"이라면서 연간 결제 기준가를 적었다. 주 CTA "무료로 분석 시작"은 빈 검색 화면으로 떨어진다. 운영사 정보가 바로 아래 푸터와 두 번 나온다. 사이트 어디에서도 이 페이지로 오는 링크가 없다.
- 제안: 사실만 고친다. 플랜명은 TEAM BIBL, 팀 공유는 요금제 FAQ 문구와 맞추고, 표 머리글에 "연간 결제 기준"을 적는다. 기능 설명 두 섹션은 하나로 합친다. CTA 는 홈(/)의 검색창으로 보낸다. 운영사 정보 블록은 푸터와 중복이므로 삭제를 검토하되 심사 대응용이면 유지한다. 푸터 링크 열에 "서비스 소개"(/about)를 추가한다(레이아웃 담당).

### home-10 · P2 · visual-consistency · 공수 M
**홈 하단 섹션이 확정 섹션 패턴을 따르지 않고 폭·제목 체계가 제각각이다**

- 페이지: `/`
- 파일: `src/app/page.tsx`, `src/app/_components/LandingStats.tsx`
- 근거: `src/app/page.tsx:156` (max-w-2xl), `LandingStats.tsx:123` (max-w-3xl), `page.tsx:201` (max-w-5xl, 좌측 정렬), `:243` (max-w-4xl, 가운데 정렬) · `:199-239` (기능 섹션에 제목 없음, FeatureCard 가 h3 라서 h1 다음에 h3) · `:244, :255` (h2 가 text-2xl md:text-3xl, 허브 h1 과 /studio h2 는 text-3xl md:text-5xl: `trend-search/page.tsx:90`, `studio/page.tsx:353`) · `:275, :285` (클릭되지 않는 카드에 hover 배경·테두리) · `LandingStats.tsx:122` border-y 와 `page.tsx:200` border-t 가 겹쳐 헤어라인 2겹(`home-desktop-01.png` y=769~770 만 2px, 다른 구분선은 1px) · `home-desktop-02.png` y=228~291 (마지막 CTA 바로 아래 #0b0f17 띠 64px)
- 문제: 섹션마다 컨테이너 폭이 672·768·1024·896px 로 달라 왼쪽 기준선이 계속 바뀌고, 가운데 정렬과 좌측 정렬이 섞인다. /studio 와 허브에 쓰는 확정 섹션 헤더(좌 캡션 + 우 영문 라벨 + 헤어라인)가 홈에는 없다. 기능 4개에는 섹션 제목이 없어 제목 단계가 h1 에서 h3 로 건너뛴다. 클릭할 수 없는 카드가 hover 에 반응해 눌릴 것처럼 보인다.
- 제안: 히어로 아래 섹션의 컨테이너를 허브와 같은 max-w-screen-lg 하나로 통일한다. 각 섹션에 확정 헤더(예: 좌 "bibl lab" + 우 "FEATURES", "HOW IT WORKS")와 두 톤 h2(text-3xl md:text-5xl font-black)를 붙인다. 기능 카드는 해당 도구(또는 /trend-search)로 가는 링크로 만들거나 hover 효과를 뺀다. 통계 띠의 border-y 를 border-t 로 바꿔 이중선을 없앤다.

### home-11 · P2 · interaction-feedback · 공수 S
**같은 검색인데 진입 방법마다 확인·안내가 다르고, 마지막 CTA 가 요금제뿐이다**

- 페이지: `/`, `/search`
- 파일: `src/app/page.tsx`, `src/app/_components/SearchUsageBadge.tsx`
- 근거: `src/app/page.tsx:83-85` (예시 칩은 확인 없이 바로 검색), `:79` (직접 입력은 확인하지만 차감 안내 없음) ↔ `src/app/_components/SearchBar.tsx:230-233` ("확인 시 검색 사용량 1회가 차감됩니다.") · `src/lib/stripe.ts:39` (Free 하루 2회) · `src/app/page.tsx:260-267` (마지막 CTA 는 "요금제 보기" 하나) · `home-desktop-01.png` 우상단 "2회 남음", `src/app/_components/SearchUsageBadge.tsx:55`, `src/lib/searchLimit.ts:180-183` (비로그인에게도 표시) ↔ `page.tsx:65-68` (홈은 로그인 필수)
- 문제: 로그인한 무료 사용자가 예시 칩을 누르면 확인 없이 하루 2회 중 1회가 차감된다. 직접 입력은 확인을 묻지만 왜 묻는지(차감)는 알려 주지 않는다. 페이지 끝에서는 아직 써 보지 않은 방문자에게 요금제만 권한다. 비로그인 방문자에게 네비는 "2회 남음"을, 홈은 "로그인이 필요합니다"를 보여 줘 말이 엇갈린다.
- 제안: 예시 칩도 입력과 같은 확인 다이얼로그를 거치게 하고(문구는 SearchBar 의 차감 안내 문장 재사용), 홈 확인에도 같은 안내를 넣는다. 마지막 섹션은 화이트 버튼 "무료로 시작"(상단 검색창으로 이동 또는 /sign-in)과 텍스트 링크 "요금제 보기"로 위계를 나눈다. 네비 배지는 로그인 상태에서만 보이게 하는 방안을 네비 담당에 전달한다. saveToHistory 에서 router.push 로 이어지는 순서와 count 파라미터는 그대로 둔다.

### home-12 · P2 · accessibility · 공수 S
**로그인 모달이 대화상자로 인식되지 않고, 안내 문구의 대비가 낮다**

- 페이지: `/`
- 파일: `src/app/page.tsx`, `src/app/_components/LandingStats.tsx`
- 근거: `src/app/page.tsx:90-134` (role, aria-modal, aria-labelledby 없음, Esc 닫기 없음, 포커스 이동 없음) · `:92` (z-50) 와 `src/app/_components/KakaoChatButton.tsx:13` (z-50, DOM 순서상 뒤: `src/app/layout.tsx:396-398`) · `:109` (text-neutral-600, neutral-900 위 대비 약 2.3:1), `:128`, `:168` (placeholder-neutral-600, 약 2.7:1), `:182` · `:278, :288`, `LandingStats.tsx:64, 110` (text-neutral-500 작은 글자, 약 4.4:1) · `:163-170` (검색 입력에 label·aria-label 없음)
- 문제: 모달이 열려도 스크린리더는 대화상자로 알리지 않고, 키보드 포커스는 뒤 페이지에 남으며 Esc 로 닫히지 않는다. 카카오 문의 버튼이 어두운 배경 위에 그대로 떠서 모달보다 눈에 띈다. 가입 혜택 문구("가입 후 하루 2회 무료 검색")와 닫기가 가장 흐린 neutral-600 이라 WCAG AA(4.5:1)에 못 미친다.
- 제안: 모달에 role="dialog", aria-modal="true", aria-labelledby 를 달고 Esc 닫기, 열릴 때 첫 버튼으로 포커스 이동, 닫힐 때 복귀를 넣는다. z 를 플로팅 버튼보다 위(예: z-[100])로 올린다. 정보를 전달하는 글자는 최소 text-neutral-400(약 8:1), neutral-500 은 큰 글자나 보조 정보, neutral-600 은 장식(01·02 숫자)에만 쓴다. 검색 입력에 aria-label 을 단다.

### home-13 · P2 · mobile · 공수 S
**검색 페이지 검색창: 입력 글자 14px(iOS 자동 확대), 20px 아이콘 버튼, 이름 없는 버튼**

- 페이지: `/search`
- 파일: `src/app/_components/SearchBar.tsx`
- 근거: `src/app/_components/SearchBar.tsx:267` (입력 text-sm = 14px) ↔ `src/app/page.tsx:168` (홈 입력은 text-base) · `:311-318` (제출 버튼이 20px 아이콘뿐, aria-label 없음) · `:272-282` (국가 버튼은 title 만, aria-expanded 없음) · `:360-368` (삭제 버튼 aria-label 없음) · `:324-327, :354-359` (div 에 onClick, 키보드로 못 누름) · `:334` ("▼" 문자) · `search-desktop-01.png`
- 문제: iOS Safari 는 16px 미만 입력창에 포커스하면 화면을 확대하므로 휴대폰에서 검색할 때마다 화면이 튄다. 검색 실행 버튼의 터치 영역이 20×20px 로 권장 최소(24px, 실사용 44px)보다 작다. 아이콘 버튼에 이름이 없어 스크린리더가 "버튼"으로만 읽고, 최근 검색어와 접기 머리글은 키보드로 조작할 수 없다.
- 제안: 입력을 `text-base md:text-sm` 로 바꾼다. 제출 버튼에 패딩을 줘 44px 터치 영역을 만들고 aria-label="검색"을 단다. 국가 버튼에 aria-label·aria-expanded, 삭제 버튼에 aria-label 을 달고, div 클릭 요소는 button 으로, ▼ 는 SVG 화살표로 바꾼다. executeSearch·saveToHistory 등 검색 실행·기록 함수는 손대지 않는다.

### home-14 · P2 · navigation-ia · 공수 M
**허브의 "영상 찾기"가 빈 결과 화면으로 떨어지고, 도구 사이를 오갈 수단이 없다**

- 페이지: `/trend-search`, `/search`, `/channels`, `/my-channel`, `/saved`
- 파일: `src/app/trend-search/page.tsx`, `src/app/community/_components/CommunityTabs.tsx`(패턴 참고)
- 근거: `src/app/trend-search/page.tsx:34, 99` (영상 찾기 → /search) · `search-desktop-01.png`, `src/app/search/_components/SearchResultList.tsx:286-287` ("검색 결과가 없어요 / 다른 키워드로 검색해보세요") · 커밋 a09f56b (네비의 도구 4탭 제거) · 도구 페이지 상단에 다른 도구로 가는 상시 링크 없음(grep: 수집 완료 토스트의 /saved, 빈 상태의 /search 뿐) · `trend-search-mobile-01.png`, `trend-search-mobile-02.png` (카드 4장에 약 930px) · `src/app/trend-search/page.tsx:17-28` (플랜 확인 때문에 요청마다 서버 렌더)
- 문제: 허브 첫 카드의 "바로가기"를 누르면 아무것도 검색하지 않았는데 "검색 결과가 없어요"가 나온다. 도구를 바꾸려면 매번 네비(전체 새로고침) → 허브 → 카드를 거쳐야 한다. 허브에는 남은 횟수나 최근 검색 같은 정보가 없어 재방문 사용자에게는 지나가는 화면일 뿐이다.
- 제안: (1) /search 의 초기 화면 문구는 검색 담당 영역에서 "키워드를 입력하세요" 상태로 분리한다(교차 참조). (2) 도구 4개를 커뮤니티 탭(`src/app/community/_components/CommunityTabs.tsx:47-67`)과 같은 밑줄 탭으로 만들어 허브와 각 도구 페이지 상단에 공통으로 둔다. 잠긴 탭에는 플랜 배지를 붙인다. (3) 모바일에서는 카드 패딩을 줄여(p-5, 아이콘과 제목 한 줄) 4개가 한 화면 반 안에 들어오게 한다.

### home-15 · P3 · performance · 공수 M
**홈 전체가 클라이언트 컴포넌트다**

- 페이지: `/`
- 파일: `src/app/page.tsx`
- 근거: `src/app/page.tsx:1` ("use client") · `:17-31` (인증 확인과 방문 기록 때문) · `:199-268` (상태 없는 정적 섹션도 함께 하이드레이션) · `src/app/about/page.tsx`, `src/app/trend-search/page.tsx` 는 서버 컴포넌트
- 문제: 지금 체감 문제는 작다. 다만 앞으로 넣을 미리보기 이미지와 브랜드 섹션(home-04, home-05)까지 전부 클라이언트 번들에 들어가고, 페이지 단위 metadata 를 쓸 수 없다.
- 제안: page.tsx 를 서버 컴포넌트로 바꾸고 검색 폼, 예시 칩, 로그인 모달, 인증 확인, 방문 기록을 클라이언트 컴포넌트 하나(HomeSearch)로 그대로 옮긴다. saveToHistory, trySearch, router.push(`/search?q=…&count=N`)는 글자 하나 바꾸지 않고 위치만 옮긴다(불변 조건 1). 방문 기록 fetch 도 그대로 둔다(TrackVisit 으로 바꾸면 세션당 1회로 집계 방식이 달라진다). 참고: /search 는 현재 count 를 읽지 않고 v 만 읽는다(`src/app/search/page.tsx:38-45, 57`). 이 부분은 이번 작업에서 건드리지 않고 소유자 판단에 맡긴다.

## 다른 영역에 전달할 것 (요약)

| 받는 쪽 | 내용 | 관련 발견 |
|---|---|---|
| 검색 담당 | /search 를 q 없이 열었을 때 "검색 결과가 없어요" 대신 입력 유도 상태. 로그인 후 기본 도착지(`SignInForm.tsx:63`), 허브 "영상 찾기", about CTA 가 모두 이 화면으로 온다 | home-02, home-09, home-14 |
| 인증 담당 | SignInForm 이 redirect_url 을 읽지 않음. next 연결 시 "/search" 로 시작하는 경로만 허용 | home-02 |
| 네비·레이아웃 담당 | 비로그인에게 보이는 "2회 남음" 배지, 푸터에 /about 링크 없음, JSON-LD 평점 4.8/47 근거, 모바일 고정 네비 133px | home-03, home-07, home-09, home-11 |
| 소유자 확인 | Free 채널 검색 정책(허브 잠금 표기), "10,000+" 실제 수치, about 운영사 정보 블록 유지 여부 | home-03, home-06, home-09 |

## 불변 조건 관련 메모

- 이 보고서의 어떤 제안도 `saveToHistory` 와 `router.push(/search?q=…&count=N)` 의 로직·파라미터·호출 순서를 바꾸지 않는다. home-02, home-11, home-15 는 그 앞단의 화면(모달, 확인 다이얼로그, 파일 위치)만 다룬다.
- 루트 레이아웃에 인증 호출을 넣는 제안은 없다. 허브의 `auth()` 는 페이지 안에 있으므로 조건 2 위반이 아니다.
