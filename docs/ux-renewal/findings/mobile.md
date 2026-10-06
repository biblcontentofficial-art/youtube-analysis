# mobile 영역 감사 보고서 (횡단: 모바일 반응형)

- 범위: `src` 전체 grep(고정 폭·min-w, whitespace-nowrap, overflow-x, 고정 grid-cols, 12px 이하 글자, fixed/sticky, vh, 입력 글자 크기, hover/active) + `shots/before` 모든 페이지 모바일 조각(주요 페이지 전 조각) + `shots/before-studio` 모바일 조각 + 1440px 데스크톱 캡처 실측(태블릿 계산용).
- 캡처 읽는 법: 모바일 조각은 390px 폭 @2x 를 1100px 단위로 자른 것. 화면 표시 좌표 × 0.55 = CSS px. 카카오 버튼·sticky 바 같은 고정 요소는 첫 844px 뷰포트 위치에만 찍힌다.
- 로그인 상태 모바일 캡처는 없다. /search 결과, 커뮤니티 내부·글쓰기, 모달은 코드로 판단했고 "(코드 판단)" 으로 표시했다.
- 이미 끝난 보고서(home·pricing·studio·auth·channels)와 겹치는 증상은 전역 원인 쪽으로 묶고 교차 참조만 남겼다.

## 총평

모바일 레이아웃의 기본기(1열 스택, 결과 목록의 모바일 전용 카드, 가로 스크롤 탭, 하단 시트 모달)는 갖춰져 있다. 그런데 전역 계층의 결함 몇 개가 모든 페이지의 완성도를 끌어내린다. 한글 줄바꿈 규칙이 없어 모든 페이지에서 단어가 음절 단위로 끊기고, 3줄로 접히는 133px 고정 네비가 보이는 화면의 약 5분의 1을 늘 차지하며, 같은 네비가 768~1,116px 폭(태블릿, 가로 모드 휴대폰)에서는 로고·로그인 버튼과 겹친다(1440 캡처 실측 기반 계산). 전역 카카오 버튼은 z-50 으로 맨 마지막에 그려져 하단 고정 신청 버튼·상담 폼 버튼·하단 시트 모달 위에 올라타고, 입력창 30곳 중 28곳이 16px 미만이라 iOS 에서 포커스할 때마다 화면이 확대된다. 핵심 도구 /search 는 모바일에서 정렬과 전체 선택이 사라지고, 첫 메뉴 /incubating 은 지원 버튼이 7,145px 지점에만 있다. 대부분 `globals.css`·`layout.tsx`·`KakaoChatButton.tsx` 몇 줄로 전역 해결되며, 페이지별 보고서가 따로 적은 같은 증상(home-01, home-07, home-13, pricing-11, studio-09, studio-11, auth-07)을 함께 정리한다.

## 유지할 점

1. 표를 모바일에서 다른 구조로 바꾸는 방향: 검색 결과의 모바일 전용 카드(`src/app/search/_components/VideoCard.tsx:209-259`), 수집 목록의 단계별 열 숨김(`src/app/saved/_components/SavedVideoList.tsx:174-178`). 정렬·선택만 보강하면 된다.
2. 한 줄 가로 스크롤 탭·칩: `src/app/community/_components/CommunityTabs.tsx:48-60`, `CategoryChips.tsx:28-35`(shrink-0 + nowrap). 네비 2행과 채널 찾기 탭에 그대로 옮겨 쓸 패턴.
3. `/studio/class/consulting` 의 모바일 하단 고정 신청 바(`src/app/studio/class/consulting/page.tsx:94-104`, md:hidden, 화이트 전폭 버튼). 소유자 규칙에 맞는 형태라 공용 컴포넌트로 만들어 재사용하고, 카카오 버튼 겹침만 고친다.
4. 한도 모달의 모바일 하단 시트 배치(`src/app/search/_components/LimitModal.tsx:70` `items-end sm:items-center`). 엄지가 닿는 위치.
5. 홈 검색창 16px(`src/app/page.tsx:163`), 상담 폼 연락처 `type="tel"`·이메일 `type="email"`(`src/app/studio/consulting/page.tsx:327-328`). 모바일 키보드·확대 측면의 올바른 기준.
6. 읽기 크기: /incubating 본문 15px·행간 1.85(`src/app/incubating/page.tsx:65`), 커뮤니티 피드 제목 15px(`src/app/community/_components/FeedCard.tsx:101`).
7. 반응형 여백 `py-16 md:py-24`(`src/app/trend-search/page.tsx:84`), about 요금 표는 390px 에서 가로 스크롤 없이 들어간다(`about-mobile-04.png`).
8. 카카오 버튼 자체(56px, aria-label, 모바일에서 호버 라벨 숨김, `src/app/_components/KakaoChatButton.tsx:11-24`). 크기·위치는 유지하고 레이어만 정리한다.

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| mobile-01 | P0 | typography | 한글 단어 중간 줄바꿈이 모든 페이지에서 일어난다 (keep-all 0건) | S |
| mobile-02 | P1 | mobile | 전역 네비: 모바일 3줄 133px 고정, 768~1,116px 폭에서는 메뉴가 넘쳐 로고·로그인과 겹침 | M |
| mobile-03 | P1 | mobile | 카카오 플로팅 버튼이 하단 고정 CTA·폼 버튼·하단 시트 모달·배너·토스트 위에 올라탄다 | S |
| mobile-04 | P1 | mobile | /search 모바일: 정렬·전체 선택 불가, 첫 결과가 약 1,000px 아래, 카드 메타 8~11px | M |
| mobile-05 | P1 | mobile | 입력창 30곳 중 28곳이 16px 미만, iOS 포커스 확대 | S |
| mobile-06 | P1 | conversion | /incubating 모바일: 지원 버튼이 7,145px 지점에만, 세로 사진 5장이 각 475~520px | M |
| mobile-07 | P2 | mobile | /studio/class/consulting 모바일: 보조 sticky 바가 네비 뒤에 숨고 이미지 속 글자 4~9px | M |
| mobile-08 | P2 | interaction-feedback | 터치 기기에서 누름 피드백이 없다 (hover 420곳, active 2곳) | S |
| mobile-09 | P2 | bug | 글쓰기 에디터 "+"(사진·유튜브 넣기)가 휴대폰에서 보이지 않는다 | S |
| mobile-10 | P2 | layout | min-h-screen + 133px 네비: 짧은 페이지마다 350~530px 빈 화면, 가운데 정렬이 아래로 처짐 | M |
| mobile-11 | P2 | mobile | 영상 상세 모달: iOS 에서 90vh 가 보이는 화면보다 크고 안쪽 스크롤 상자가 두 개 더 있다 | S |
| mobile-12 | P2 | accessibility | 닫기·체크박스·푸터 링크·댓글 버튼 터치 영역 12~28px | S |
| mobile-13 | P3 | layout | 남은 가로 넘침: 내 채널 입력 줄 +6px, 고정 폭 모달, 채널 찾기 넘침이 카카오 버튼을 화면 밖으로 | S |
| mobile-14 | P3 | visual-consistency | 모바일 브라우저 상단바·기본 폼 컨트롤이 라이트 테마 (theme-color·color-scheme 없음) | S |

## 발견 상세

### mobile-01 · P0 · typography · 공수 S
**한글 단어 중간 줄바꿈이 모든 페이지에서 일어난다 (keep-all 0건)**

- 페이지: 전체 (특히 `/`, `/incubating`, `/studio/class/consulting`, `/community`, `/about`, 전 페이지 푸터)
- 파일: `src/app/globals.css`
- 근거
  - grep `break-keep|keep-all` 0건. `src/app/globals.css:26-30` body 규칙에 word-break 지정 없음.
  - `home-mobile-01.png`: "유튜브 트렌드를 파 / 악하세요", 통계 "무료 2회 가 / 능"
  - `incubating-mobile-02.png`: "썸네일·마케 / 팅", "꾸 / 준함", "아 / 니라" · `incubating-mobile-06.png`: "계시면 됩니 / 다." · `incubating-mobile-07.png`: 지원 카드 제목 "프로젝트 문의하 / 기"
  - `studio-class-consulting-mobile-01.png`: "비블이 1:1 / 로 함께합니다"
  - `community-mobile-01.png`: 게이트 제목 "이용할 수 있습니 / 다"
  - `about-mobile-02.png`: "기능입니 / 다", "도구입 / 니다"
  - 모든 페이지 푸터(`home-mobile-03.png`): "2023-수원권 / 선-1549", "YouTube 서 / 비스 약관", "서비스 / 입니다"
  - `before-studio/studio-mobile-02.png`: "20시 / 간", "없습 / 니다"
- 문제: 390px 폭에서는 거의 모든 문단·제목에서 단어가 음절 단위로 잘리고 한 음절("다.", "기")만 다음 줄에 남는 경우가 잦다. 첫 화면 헤드라인부터 깨져 보인다. home-01·pricing-11·studio-09·pricing-14 가 각자 페이지별 break-keep 을 제안했지만 원인은 전역 한 곳이다.
- 제안
  - `globals.css` 기존 body 규칙에 `word-break: keep-all; overflow-wrap: break-word;` 두 줄. 긴 URL·이메일은 넘칠 때만 끊긴다. PostContent 링크의 `break-all`(`PostContent.tsx:37`)은 요소 자체 지정이라 그대로 유지된다.
  - 제목 `h1, h2, h3 { text-wrap: balance; }`, 본문 `p { text-wrap: pretty; }`(한 음절 고아 줄 방지, 미지원 브라우저는 무시).
  - 페이지별 break-keep 추가 작업은 하지 않는다. 적용 후 좁은 칸(LandingStats 3칸 통계, 강의 상세 메타 줄, 버튼 라벨)만 390·360px 에서 확인.

### mobile-02 · P1 · mobile · 공수 M
**전역 네비: 모바일은 3줄 133px 가 상단에 고정되고, 768~1,116px 폭에서는 데스크톱 메뉴가 넘쳐 로고·로그인 버튼과 겹친다**

- 페이지: 전체
- 파일: `src/app/layout.tsx`, `src/app/_components/NavUser.tsx`, `src/app/studio/class/consulting/page.tsx`, `src/app/globals.css`
- 근거
  - 모바일 높이: `layout.tsx:302` nav 전체가 `sticky top-0 z-50`. 1행 `:303` h-14(56px). 2행 `:361-394` 이 flex-wrap 이라 링크 5개가 두 줄(링크 `text-xs py-1.5` 28px × 2 + 간격 4 + py-2 16 + 테두리) 약 77px. 모든 모바일 캡처에서 네비 하단이 CSS 133px(`home-mobile-01.png` 표시 242px).
  - 390×844 기기에서 브라우저 UI 를 뺀 보이는 높이는 700px 안팎이라 약 19%, 375×667급에서는 약 4분의 1을 스크롤 내내 차지한다. 커뮤니티 피드는 네비 133 + 배너 113 + 제목·탭·칩·검색을 지나 첫 글이 약 510px 지점에서 시작한다(`community/layout.tsx:64-88`, `community/page.tsx:109-160`, 코드 기준 추정).
  - 터치 영역: 2행 링크 높이 28px·좌우 간격 4px(`layout.tsx:362, 365-391`), 로그인·시작하기 28px(`NavUser.tsx:71-76`), 모바일 요금제 24px(`layout.tsx:350-356`). 2행은 앞 3개만 필 배경, 뒤 2개는 글자만이라 모양이 섞여 있고 현재 페이지 표시가 없다(`home-mobile-01.png`). 남은 횟수 배지(`SearchUsageBadge.tsx:30, 45` `hidden sm:flex`)는 모바일에서 숨어 검색 전에는 횟수를 볼 수 없다(검색 후에는 `search/page.tsx:213-239` 에 표시).
  - 파생: `studio/class/consulting/page.tsx:36-37` 보조 바가 `sticky top-14`(56px, 높이 48px)라 스크롤하면 133px 네비 뒤로 완전히 가려진다. `studio/classroom/[courseId]/_components/LessonPlayer.tsx:54` 상단 바는 `sticky top-0` 이라 모든 폭에서 네비 뒤에 숨는다. `/studio` 의 `#process` 앵커(`studio/page.tsx:314, 543`) 이동 시 섹션 라벨이 네비 아래로 들어간다(scroll-padding 0건).
  - 태블릿 겹침(계산): `home-desktop-01.png`(1440px)에서 가운데 메뉴 실측 791px(x 263~1054), 로고 93px, 우측(남은 횟수·로그인·시작하기) 201px. 가운데 영역(`layout.tsx:315` `flex-1 min-w-0 justify-center whitespace-nowrap`)의 링크가 줄어들 수 없어 폭 1,117px 미만에서 내용이 양옆으로 넘친다. 1024px 에서 로고 글자와 약 46px, 남은 횟수 배지와 약 38px 겹치고, 820px(iPad 세로)에서는 왼쪽 약 44px 가 잘리고 우측 버튼과 약 140px 겹친다. 가로 모드 휴대폰(844px 등)도 768px 이상이라 같은 상태가 된다. 1행 `:303` 의 `overflow-x-auto scrollbar-hide` 때문에 스크롤 표시도 없다. 태블릿 캡처는 없으므로 820·1024px 실측 확인 필요.
  - 네비 `px-3`(12px)와 본문 `px-4`(16px)의 좌측 기준선이 4px 어긋난다(모든 모바일 캡처에서 로고 x=12, 본문 x=16).
  - 참고 규칙: ux-guidelines.csv 2번(고정 네비가 콘텐츠를 가리지 않게), 22·23번(터치 44pt, 간격 8px).
- 문제: 모든 페이지에서 콘텐츠가 보이는 면적이 5분의 1 줄고 첫 화면의 핵심 요소(홈 검색창 home-07, 로그인 버튼 auth-07)가 아래로 밀린다. 태블릿·가로 모드·작은 노트북 창에서는 메뉴 글자가 서로 겹쳐 깨져 보인다.
- 제안 (layout.tsx 마크업만, 인증 호출 추가 없음 → 불변 조건 2 유지)
  1. 데스크톱 한 줄 메뉴 전환점을 md → xl(1280px)로 올린다: `:315` `hidden xl:flex`, `:350` 모바일 요금제 `xl:hidden`, `:361` 2행 `xl:hidden`.
  2. xl 미만에서는 1행(로고·요금제·로그인)만 sticky 로 둔다(56px, 데스크톱과 같은 높이). 2행은 nav 밖 body 직계 형제로 옮겨 스크롤과 함께 올라가게 하고, 줄바꿈 대신 한 줄 가로 스크롤(`flex-nowrap overflow-x-auto scrollbar-hide`, 항목 `shrink-0`)로 바꾼다. 커뮤니티 탭과 같은 방식. 링크는 `text-[13px] px-3 py-2.5`(40px 이상), 다섯 개 모두 같은 모양(앞 3개 화이트 글자, 뒤 2개 에메랄드 글자).
  3. 1행·2행 `px-4` 로 본문과 맞춘다. 로그인·시작하기·요금제 `py-2`(36px 이상).
  4. `globals.css` 에 `html { scroll-padding-top: 56px; }`. 그러면 consulting 보조 바 `top-14` 가 모바일에서도 1행 바로 아래 붙고, LessonPlayer 는 `top-14` 로만 바꾸면 된다.
  5. (선택) 현재 페이지 표시: usePathname 을 쓰는 작은 클라이언트 컴포넌트로 2행 링크에 `aria-current` + 화이트 밑줄. 레이아웃은 정적 렌더 유지.

### mobile-03 · P1 · mobile · 공수 S
**카카오 플로팅 버튼이 하단 고정 CTA·폼 버튼·하단 시트 모달·배너·토스트 위에 올라탄다**

- 페이지: `/studio/class/consulting`, `/studio/consulting`, `/search`(한도 모달·카카오 채널 배너·수집 토스트·영상 상세), `/`(로그인 유도 모달), `/mypage`, `/sign-in`
- 파일: `src/app/_components/KakaoChatButton.tsx`, `src/app/globals.css` (+ 표시용 data 속성: `studio/class/consulting/page.tsx`, `search/_components/LimitModal.tsx`, `KakaoChannelBanner.tsx`, `SearchResultList.tsx`, `VideoModal.tsx`)
- 근거
  - `KakaoChatButton.tsx:13` `fixed bottom-5 right-5 z-50`(56px), `layout.tsx:398` 에서 `{children}` 뒤에 렌더. 모달은 모두 페이지 안에서 렌더되고 createPortal 은 0건이라 z-50 끼리는 DOM 순서상 카카오 버튼이 위에 그려진다.
  - `studio-class-consulting-mobile-01.png`: 하단 고정 "1:1 팀비블 신청하기"(`consulting/page.tsx:94-104`, z-30)의 오른쪽 끝을 노란 버튼이 덮는다.
  - `studio-consulting-mobile-01.png`: 상담 폼 주 버튼 "다음 →"의 오른쪽 약 60px 를 덮는다(studio-11 이 전역 담당으로 넘긴 항목). `sign-in-mobile-01.png`: 동의 카드 오른쪽 아래 모서리에 걸친다(auth-07).
  - 코드 기하(390px 기준, 코드 판단): `LimitModal.tsx:70, 122` 모바일 하단 시트(`items-end pb-6`, z-50) → 시트 오른쪽 아래(바닥에서 24~76px, 오른쪽 56px)가 버튼 밑에 깔림. `KakaoChannelBanner.tsx:43`(z-40, bottom-4 right-4, 288px) → "채널 추가하기"(`:66-70`) 오른쪽 40px 를 덮어 노란 요소 두 개가 겹친다. `SearchResultList.tsx:545`(수집 토스트, z-50, bottom-6 right-6) → 닫기 ✕(`:553-556`)가 버튼 밑. `page.tsx:92`, `VideoModal.tsx:202`, `VideoCard.tsx:39`, `mypage/_components/DeleteAccountButton.tsx:35`, `CancelSubscriptionButton.tsx:53`(모두 z-50) → 딤 처리 위에 노란 버튼만 밝게 남고 누르면 새 탭으로 카카오톡이 열린다.
  - 참고 규칙: ux-guidelines.csv 15번(z-index 스케일), 17번(고정 요소끼리 겹침).
- 문제: 늘 떠 있는 버튼이 그 페이지의 주 행동(신청하기·다음)과 모달 내용을 가린다. 신청 버튼 오른쪽 끝을 누르면 신청 대신 일반 카카오 채팅으로 빠진다. studio·auth 보고서가 각각 발견하고 전역 담당으로 넘긴 문제다.
- 제안 (전역 컴포넌트 한 곳 + CSS, 로직 변경 없음)
  1. 레이어 순서: 카카오 버튼 z-30 < 하단 고정 바·토스트·배너 z-40 < 네비 z-50 ≤ 모달. `KakaoChatButton.tsx:13` 을 z-30 으로 내리고 `data-kakao-fab` 속성을 붙이면 모달·배너·토스트는 자동으로 버튼 위에 온다.
  2. 하단 고정 바가 있는 페이지는 버튼을 바 위로 올린다: 바에 `data-bottom-bar`, `globals.css` 에 `@media (max-width: 767px) { body:has([data-bottom-bar]) [data-kakao-fab] { bottom: calc(88px + env(safe-area-inset-bottom)); } }`.
  3. 한 가지 일에 집중하는 화면에서는 숨긴다: `body:has([data-hide-fab]) [data-kakao-fab] { display: none; }` 를 두고 LimitModal·VideoModal·카카오 채널 배너·상담 폼(/studio/consulting)·결제 화면 루트에 `data-hide-fab`. 숨길 화면 목록은 소유자 확인.
  4. 수집 토스트는 모바일에서 `left-4 right-4 bottom-4` 로 옮기거나 같은 속성으로 버튼을 잠시 숨긴다.
  - KakaoChatButton 을 클라이언트 컴포넌트로 바꿀 필요가 없고(`:has()` 는 iOS 15.4 이상), 레이아웃 정적 렌더도 유지된다.

### mobile-04 · P1 · mobile · 공수 M
**/search 모바일: 정렬·전체 선택 기능이 없고, 첫 결과가 약 1,000px 아래에서 시작하며, 결과 카드의 메타 정보가 8~11px**

- 페이지: `/search`(검색 결과, 코드 판단)
- 파일: `src/app/search/_components/SearchResultList.tsx`, `src/app/search/_components/VideoCard.tsx`, `src/app/search/_components/KeywordInsights.tsx`
- 근거
  - `SearchResultList.tsx:376-421` 표 머리글이 `hidden md:grid`. 전체 선택(`:381-388`), 조회수·구독자·게시일 정렬(`:392-400`), 알고리즘 확률 활성화(`:401-418`)가 모두 이 안에만 있다. handleSort 를 부르는 곳은 `:392, 395, 398, 405` 뿐(`:295-316` ColHeader 는 정의만 있고 쓰이지 않음), toggleAll 은 `:385` 뿐.
  - 모바일 카드 `VideoCard.tsx:211-259`: 체크박스 14px(`:217`, 감싸는 label 없음), S/L 배지 8px(`:230-232`), 영상 길이 9px(`:224`), 채널명·구독자 11px(`:249, 255`), 게시일 10px gray-600(`:259`), 핵심 지표인 조회수도 12px(`:254`).
  - 결과 위에 쌓이는 블록(코드 기준 추정, 390px): 네비 133 + 검색 바 영역(모바일은 검색창·검색어 칩·남은 횟수가 세로로 쌓임, `search/page.tsx:200-241`) 약 140 + Free 업그레이드 배너(`:376-394`) 약 90 + 필터·액션 툴바(`:325-370`, 두 줄로 접힘) 약 100 + 키워드 인사이트 카드(`KeywordInsights.tsx:162-221`, 모바일에서 버튼 2개 세로) 약 290 + 잠금 카드 또는 경쟁도·제목 패턴 옵트인 줄(`SearchResultList.tsx:326-375`) 약 190. 첫 결과 카드가 약 1,000px 지점에서 시작해 보이는 화면(약 700px) 안에 결과가 하나도 없다.
- 문제: "조회수·구독자·게시일을 한눈에"가 핵심 가치인데 휴대폰에서는 조회수 순으로 다시 볼 방법이 없다. 수집·채널 제거(`search/page.tsx:341-367`)는 체크한 영상에 작동하는데 14px 체크박스를 하나씩 눌러야 한다. 검색 직후 화면에는 결과 대신 안내 카드만 보인다.
- 제안 (UI 만, 기존 함수 그대로 호출)
  1. 목록 위에 `md:hidden` 줄 하나: "전체 선택" 텍스트 버튼(toggleAll, 선택 수 표시) + 정렬 칩 "조회수 · 구독자 · 게시일"(handleSort, 같은 칩을 다시 누르면 지금처럼 내림/오름 전환, 방향은 ↓↑ 글자). 칩 모양은 `CategoryChips.tsx:28-31` 과 같게. 정렬은 이미 받은 목록을 다시 정렬할 뿐이라(`:83-99` useMemo) 검색 횟수·API 호출과 무관하다(불변 조건 1).
  2. 카드: 체크박스를 label 로 감싸 44px 누를 영역, 배지·길이 11px, 채널·구독자·게시일 12px(neutral-400 수준), 조회수 14px 굵게.
  3. 모바일 위계: 인사이트 카드는 제목 한 줄 + 두 버튼 가로 배치로 줄이고, Free 업그레이드 배너와 잠금 카드는 하나로 합쳐 결과 5개 아래로 내리는 안을 소유자에게 제시(전환 요소 위치라 결정 필요).

### mobile-05 · P1 · mobile · 공수 S
**입력창 30곳 중 28곳이 16px 미만이라 iOS 에서 포커스할 때마다 화면이 확대된다**

- 페이지: `/search`, `/studio/consulting`, `/community`(검색·댓글·글쓰기), `/payment`, `/channels`, `/tools/calculator`, `/insights`, `/saved`, `/threads`
- 파일: `src/app/globals.css`(또는 각 입력 컴포넌트)
- 근거
  - 16px 이상은 홈 검색창(`src/app/page.tsx:163` text-base)과 내 채널 입력(`my-channel/_components/ChannelSearchForm.tsx:29`, 크기 미지정 16px) 둘뿐.
  - 14px(text-sm): `_components/SearchBar.tsx:262`(home-13), 상담 폼 `studio/consulting/page.tsx:107`(TextInput, 성함·연락처·이메일·채널 URL)·`:385`·`:398`·`:411`·`:424`, 댓글 `community/[board]/[id]/_components/CommentSection.tsx:194, 244`, 글쓰기 `community/write/_components/PostForm.tsx:45`(INPUT: 게시판 선택·제목), 커뮤니티 검색 `community/page.tsx:146`, 결제 카드 폼 `payment/_components/PaymentButtons.tsx:254, 261`·`InicisButton.tsx:99, 107`·`KcpButton.tsx:98, 106`, `channels/_components/ChannelSearchBar.tsx:28`, `tools/calculator/_components/CalculatorClient.tsx:188`, `insights/_components/InsightsList.tsx:83`, `saved/_components/SavedVideoList.tsx:125, 133, 144`, `threads/_components/PostPerformanceTable.tsx:92`, `threads/saved/_components/SavedThreadsList.tsx:201`. 15px: 글쓰기 본문 블록 `BlockEditor.tsx:363`. 12px: `SavedThreadsList.tsx:221, 286`.
  - 뷰포트는 Next 기본값(`layout.tsx` 에 viewport export 0건)이라 iOS Safari 가 16px 미만 입력에 포커스하면 자동 확대하고 확대된 채로 남는다. 참고: ux-guidelines.csv 67번.
- 문제: 상담 신청·결제·댓글처럼 전환과 직결된 입력에서 매번 화면이 커졌다가 사용자가 손가락으로 다시 줄여야 한다. 확대된 상태에서는 다음 버튼이 화면 밖으로 나간다.
- 제안
  1. 전역 한 번: `globals.css` 맨 아래(레이어 밖이라 Tailwind 유틸리티보다 우선) `@media (max-width: 767px) { :is(input, textarea, select):is(.text-xs, .text-sm, .text-\[15px\]) { font-size: 16px; } }`. 데스크톱 14px 는 그대로.
  2. 새 입력은 `text-base md:text-sm` 를 기본으로.
  3. 함께: 검색 입력 3곳(SearchBar·ChannelSearchBar·커뮤니티 검색)에 `enterKeyHint="search"`, 계산기 영상 URL 입력에 `inputMode="url"`. 상담 폼 autoComplete 는 studio-11 제안 그대로.
  - `maximum-scale=1` 로 확대를 막는 방식은 쓰지 않는다(손가락 확대까지 막힌다).

### mobile-06 · P1 · conversion · 공수 M
**/incubating 모바일: 지원 버튼이 7,145px 지점에만 있고, 세로 사진 5장이 각각 화면 3분의 2를 차지한다**

- 페이지: `/incubating`(상단 메뉴 첫 번째, 커뮤니티 탭에도 연결)
- 파일: `src/app/incubating/page.tsx`, `src/app/community/_components/PostContent.tsx`
- 근거
  - `incubating-mobile-07.png`: 첫 지원 버튼 "오픈채팅으로 지원하기"가 y≈7,145px(전체 7,992px). 그 앞 첫 실행 수단도 본문 속 오픈채팅 주소 글자 링크(y≈6,866px).
  - `incubating/page.tsx:74-104` 문의 섹션이 본문 맨 끝 한 곳뿐이고 고정·중간 CTA 가 없다.
  - `incubating-mobile-01.png`~`05.png`: 세로 사진 5장이 각 약 475~520px, 합계 약 2,420px(페이지의 약 30%). 첫 화면은 네비·제목·사진 윗부분뿐이고 소개 문단은 y≈825px 부터. `PostContent.tsx:96-102` 본문 이미지가 `w-full` 에 높이 제한이 없다(같은 규칙이 커뮤니티 글 상세의 긴 캡처 문제 원인이며 `community/[board]/[id]/_components/AttachmentList.tsx:35-39` 도 동일).
  - 늘 떠 있는 카카오 버튼은 일반 채널 채팅(`KakaoChatButton.tsx:8` pf.kakao.com/_beBNn/chat)으로 가서 지원 CTA(`incubating/page.tsx:84` open.kakao.com/o/sM3RBKad)와 목적지가 다르다.
  - 대조: 같은 성격의 `/studio/class/consulting` 에는 모바일 하단 고정 신청 바가 있다(`consulting/page.tsx:94-104`).
- 문제: 모바일 방문자는 약 10화면을 내려가야 지원 수단을 만나고, 그 전에 눈에 띄는 노란 버튼을 누르면 지원 창구가 아닌 일반 채팅으로 간다.
- 제안
  1. 모바일 하단 고정 지원 바: `md:hidden sticky bottom-0`, `bg-black/95 border-t border-neutral-800`, 화이트 버튼 "오픈채팅으로 지원하기"(기존 문구·주소 재사용), `pb-[max(12px,env(safe-area-inset-bottom))]`, `data-bottom-bar`(mobile-03 의 버튼 올림 규칙). consulting 의 바와 같은 공용 컴포넌트로 묶는다.
  2. PostContent 에 이미지 클래스 prop(예: `imageClassName`)을 더해 /incubating 에서만 모바일 사진을 `aspect-[4/3] object-cover md:aspect-auto` 로 줄인다(장당 약 270px, 합계 약 1,000px 감소). 커뮤니티 기본값은 `max-h-[75vh] w-auto mx-auto object-contain` + 원본 새 탭 열기 링크를 권장(이미 알려진 긴 캡처 문제 해결).
  3. 본문 글은 커뮤니티 글 원문이라 손대지 않는다.
  - 같은 패턴: 강의 상세(`studio/class/[slug]/page.tsx:148-150`)는 데스크톱 sticky 구매 카드가 모바일에서 맨 아래(y≈2,080px/2,968px, `studio-class-youtube-business-blackmap-mobile-02.png`)로 내려간다. 지금은 공개 링크가 없어 우선순위 낮음.

### mobile-07 · P2 · mobile · 공수 M
**/studio/class/consulting 모바일: 상단 보조 바가 네비 뒤에 숨고, 상세 이미지 속 일부 글자가 4~9px**

- 페이지: `/studio/class/consulting`(상단 메뉴 4번째)
- 파일: `src/app/studio/class/consulting/page.tsx`, `public/studio/consulting/1~7.png`
- 근거
  - `page.tsx:36-37` `sticky top-14`(56px, h-12) z-30 → 스크롤하면 133px 네비(z-50) 뒤로 완전히 가려진다. 보조 바의 "신청하기" 링크(`:41-48`)와 제목은 모바일에서 사실상 쓰이지 않는다.
  - 상세 이미지 7장은 1000px 폭 PNG(1000×5,066~10,132px, 원본 합계 약 10MB)를 390px 로 줄여 보여 준다(`page.tsx:61-77`). 대부분 글자는 14~16px 로 읽히지만 `studio-class-consulting-mobile-14.png` 의 단계 카드 본문은 약 9px, `studio-class-consulting-mobile-05.png` 의 채널 통계 캡처 속 채널명·"구독자 수" 라벨은 약 4px 로 읽을 수 없다. alt 는 "상세 1~7" 뿐이다.
  - "← 스튜디오"(`page.tsx:38-40`)는 /studio 로 가는데 쿠키 없는 방문자는 StudioGuard 가 홈으로 보낸다(studio-01).
- 문제: 모바일에서 보조 바는 그려지지만 보이지 않는 요소이고, 결정에 필요한 단계 설명 일부를 읽을 수 없다.
- 제안
  1. 보조 바는 `hidden md:block`(모바일은 하단 고정 바가 같은 역할). mobile-02 적용 후에는 `top-14` 그대로 둬도 된다.
  2. 작은 글자 구간(단계 카드 1~3, 채널 통계 캡처)만 HTML 텍스트로 옮기거나 모바일용 확대 이미지를 `<picture>` 로 제공(디자인 작업 필요, 이미지 전체 재작업은 아님).
  3. 뒤로 링크는 /studio 공개 여부(소유자 질문 중)에 맞춰 바꾸고, 비공개 유지면 모바일에서 숨긴다.
  4. 하단 고정 바와 카카오 버튼 겹침은 mobile-03, "1:1 / 로" 끊김은 mobile-01.

### mobile-08 · P2 · interaction-feedback · 공수 S
**터치 기기에서 누름 피드백이 없다 (hover 420곳, active 2곳)**

- 페이지: 전체
- 파일: `src/app/globals.css`(또는 공용 버튼 클래스)
- 근거
  - grep: `hover:` 420곳, `active:` 2곳(`sign-in/_components/SignInForm.tsx:115, 141` 앰버 버튼뿐). `-webkit-tap-highlight-color` 지정 0건.
  - 설치된 Tailwind 4.1.18 은 hover 를 `@media (hover: hover)` 로 감싼다(`node_modules/tailwindcss/dist/chunk-CT46QCH7.mjs` 의 hover 변형 정의). 휴대폰에서는 420곳의 hover 스타일이 하나도 적용되지 않는다.
  - 결과적으로 브라우저 기본 탭 하이라이트(iOS 는 반투명 검정)에만 의존해, 검은 배경의 링크·카드·보조 버튼에서는 누른 표시가 사실상 보이지 않는다. 네비 링크가 `<a>` 라 메뉴를 누르면 전체 새로고침 동안 화면이 그대로다(오케스트레이터 확인 사항).
  - 참고: ux-guidelines.csv 11번(hover 는 터치에서 동작하지 않음), 29번(상호작용 시각 피드백).
- 문제: 탭이 먹었는지 알 수 없어 같은 버튼을 두 번 누르게 된다(검색 횟수 차감 확인 창, 결제 버튼 등).
- 제안: `globals.css` 한 곳에 `@media (hover: none) { :is(a, button, [role="button"], summary):active { opacity: .7; } }` 를 두고, 화이트 CTA 같은 주요 버튼은 `active:bg-neutral-300`, 보조 버튼 `active:bg-neutral-700` 을 공용 클래스에 더한다. 색·형태 규칙 변화 없음.

### mobile-09 · P2 · bug · 공수 S
**글쓰기 에디터의 "+"(사진·영상·유튜브·링크·소제목 넣기)가 휴대폰에서는 보이지 않는다**

- 페이지: `/community/write`(회원, 코드 판단)
- 파일: `src/app/community/write/_components/BlockEditor.tsx`
- 근거
  - `BlockEditor.tsx:369` 버튼 래퍼가 `opacity-0 group-hover:opacity-100 focus-within:opacity-100`. Tailwind 4.1.18 의 hover 는 `@media (hover: hover)` 안에서만 적용되어 터치 기기에서는 group-hover 가 동작하지 않는다. focus-within 은 버튼 자신에만 해당하므로 본문 입력에 포커스해도 나타나지 않는다.
  - 본문 placeholder 는 "왼쪽 + 로 사진·영상을 넣습니다"(`:356`). 버튼 크기 24px(`:374` h-6 w-6).
- 문제: 휴대폰으로 글을 쓰는 회원은 본문 중간에 사진·유튜브를 넣는 방법을 볼 수 없다. 하단 "파일 첨부"(`PostForm.tsx:406-430`)로만 올리게 되어 사진이 글 맨 아래로 몰린다.
- 제안: `opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100`(4.1 에 있는 pointer 변형), 터치에서는 버튼 36~40px. 또는 포커스된 블록 아래에 "+ 사진·유튜브" 글자 버튼을 보이는 방식.

### mobile-10 · P2 · layout · 공수 M
**짧은 페이지마다 푸터 앞에 350~530px 빈 화면이 생기고, 가운데 정렬 화면은 아래로 처진다 (min-h-screen + 133px 네비)**

- 페이지: `/search`(검색 전), `/threads`, `/my-channel`, `/sign-in`, `/studio/consulting`, `/mypage`, `/payment`, 에러·404·점검 화면
- 파일: `src/app/layout.tsx`, 각 페이지 main
- 근거
  - main 40곳이 `min-h-screen`(100vh)이고 네비는 main 밖이라 모든 페이지 높이가 최소 "네비 + 화면 높이"다. 모바일 캡처 5장에서 푸터 앞 남색 띠가 정확히 y≈978px(=133+844+1)에서 시작한다: `search-mobile-01.png`(결과 없음 카드 아래 약 530px 빈 공간), `threads-mobile-01.png`(약 370px), `my-channel-mobile-01.png`(약 350px), `sign-in-mobile-01.png`, `studio-consulting-mobile-01.png`.
  - 가운데 정렬 화면(`sign-in/_components/SignInForm.tsx:80`, `mypage/page.tsx:58`, `payment/page.tsx:41`, `error.tsx:17`, `not-found.tsx:5`, `maintenance/page.tsx:7`, `threads/saved/page.tsx:20`)은 133~977px 상자의 가운데(약 555px)에 놓여 실제 보이는 화면의 가운데보다 200px 가까이 아래다. iOS 의 100vh 는 주소창이 접힌 큰 높이 기준이라 더 내려간다(ux-guidelines.csv 20번).
  - 푸터 `mt-16`(`layout.tsx:400`) 틈으로 남색 배경이 드러나는 문제(오케스트레이터 확인)와 같은 구조.
- 문제: 결과가 없거나 짧은 화면에서 빈 검정 화면을 지나 푸터를 만난다. 로그인 카드·결제 버튼이 첫 화면 아래쪽으로 밀린다(auth-07).
- 제안 (레이아웃 마크업만)
  1. body 를 `flex min-h-dvh flex-col`, `{children}` 을 `<div className="flex-1">` 로 감싸고 푸터 `mt-16` 제거 → 짧은 페이지는 푸터가 화면 바닥에 붙고 남색 띠도 사라진다.
  2. 각 페이지 main 의 `min-h-screen` 을 지운다(페이지별 점진 적용).
  3. 가운데 정렬 화면은 `min-h-[calc(100dvh-56px)]`(mobile-02 적용 시 고정 네비 56px) + 모바일 위 정렬(`items-start pt-10 sm:items-center`).

### mobile-11 · P2 · mobile · 공수 S
**영상 상세 모달(VideoModal): iOS 에서 90vh 가 보이는 화면보다 크고, 안쪽 스크롤 상자가 두 개 더 있다**

- 페이지: `/search`(결과 카드 탭, 코드 판단)
- 파일: `src/app/search/_components/VideoModal.tsx`, `src/app/search/_components/ChannelReport.tsx`
- 근거
  - `VideoModal.tsx:202-205` 오버레이 `fixed inset-0 p-4 items-center`, 모달 `max-h-[90vh]`. iOS Safari 의 vh 는 주소창이 접힌 큰 높이 기준(844px → 760px)이고 오버레이는 실제 보이는 높이(약 700px)라, 내용이 길면 모달 위아래가 오버레이 밖으로 나가 머리글의 닫기 ✕ 가 위로 밀려난다. 오버레이는 스크롤되지 않는다.
  - `:214` 본문 `p-6 space-y-8 scrollbar-hide`, 그 안에 `:263` 설명·`:339` 댓글이 `h-40 overflow-y-auto`(스크롤바 숨김). 손가락으로 쓸면 안쪽 상자와 바깥 본문 중 어느 쪽이 움직일지 예측하기 어렵다.
  - 닫기 `:209` `p-2` + "✕" 글자, aria-label 없음. `ChannelReport.tsx:78` 도 `max-h-[85vh]`.
- 문제: 결과를 눌러 들어가는 유일한 상세 화면이 휴대폰에서 잘리거나 스크롤이 엇갈린다.
- 제안
  1. `max-h-[90vh]` → `max-h-[calc(100dvh-2rem)]`, ChannelReport 도 동일.
  2. 모바일은 전체 화면 시트: `h-dvh rounded-none md:h-auto md:rounded-2xl`, 오버레이 `p-0 md:p-4`, 본문 `p-4 md:p-6 space-y-6 md:space-y-8`.
  3. 설명·댓글의 고정 높이 스크롤은 `md:h-40 md:overflow-y-auto` 로 데스크톱에만 두고 모바일은 펼친다. 본문에 `overscroll-contain`.
  4. 닫기 버튼 44px + aria-label="닫기". 카카오 버튼 겹침은 mobile-03.

### mobile-12 · P2 · accessibility · 공수 S
**닫기·체크박스·푸터 링크·댓글 버튼의 터치 영역이 12~28px**

- 페이지: `/search`, 전 페이지 푸터, 커뮤니티 글 상세
- 파일: `KakaoChannelBanner.tsx`, `SearchResultList.tsx`, `KeywordInsights.tsx`, `ChannelReport.tsx`, `VideoCard.tsx`, `layout.tsx`, `CommentSection.tsx`
- 근거
  - 닫기 버튼: 카카오 채널 배너 ✕ 16×16, 패딩 없음(`search/_components/KakaoChannelBanner.tsx:55-58`), 수집 토스트 ✕ 12px 글자(`SearchResultList.tsx:553-556`), 키워드 인사이트 패널 닫기 16px(`KeywordInsights.tsx:235, 282`), 채널 리포트 닫기 28px(`ChannelReport.tsx:89-95`). 모두 aria-label 없음.
  - 체크박스: 결과 카드 14px(`VideoCard.tsx:131, 217`), 전체 선택 14px(`SearchResultList.tsx:386`). (로그인 동의 체크는 auth-15)
  - 푸터 링크 4개: 12px 글자, 줄 높이 16px, 간격 8px(`layout.tsx:428-433`, `home-mobile-03.png` 에서 행 간격 약 24px).
  - 댓글 "답글"·"삭제": 12px 글자 버튼이 8px 간격으로 붙어 있다(`community/[board]/[id]/_components/CommentSection.tsx:153-172`, 삭제는 확인 창이 있어 오조작 피해는 작음).
  - 기준: ux-guidelines.csv 22번(44pt/48dp), 23번(간격 8px 이상).
- 문제: 가장 자주 누르는 닫기·선택 동작이 손가락보다 작다. 토스트 ✕ 는 카카오 버튼 밑에 있어 누를 수 없다(mobile-03).
- 제안: 아이콘 크기는 그대로 두고 누를 영역만 넓힌다. 닫기 `p-2.5 -m-2.5`(약 40px) + aria-label="닫기", 체크박스는 label 로 감싸 `p-3`, 푸터 링크 `py-1.5`(32px) 또는 2열 그리드, 댓글 버튼 `px-2 py-1.5`. 모양 변화 없음.

### mobile-13 · P3 · layout · 공수 S
**남은 가로 넘침: 내 채널 입력 줄 +6px, 고정 폭 모달, 채널 찾기 넘침이 카카오 버튼을 화면 밖으로 밀어냄**

- 페이지: `/my-channel`, `/search`(업그레이드 모달), `/mypage`, `/channels`
- 파일: `my-channel/_components/ChannelSearchForm.tsx`, `search/_components/VideoCard.tsx`, `mypage/_components/DeleteAccountButton.tsx`, `CancelSubscriptionButton.tsx`
- 근거
  - `my-channel-mobile-01.png`: "채널 분석하기" 버튼 오른쪽 끝이 x≈380px 로 본문 여백선(374px)을 약 6px 넘는다. `ChannelSearchForm.tsx:28-37` 입력이 `flex-1` 인데 `min-w-0` 이 없어 입력 기본 너비 아래로 줄지 못한다.
  - 고정 폭 모달 + 여백 없는 오버레이: `VideoCard.tsx:39-43`(UpgradeModal `w-[340px]`), `DeleteAccountButton.tsx:35-39`·`CancelSubscriptionButton.tsx:53-57`(`w-80`). 360px 폭에서 좌우 10~20px, 320px 에서는 넘친다.
  - `channels-mobile-01.png`: 다른 모든 페이지 첫 조각에 있는 카카오 버튼이 이 페이지에만 없다. 정렬 탭 넘침(channels-04)으로 레이아웃 폭이 넓어져 오른쪽 고정 요소가 화면 밖으로 나간 것으로 보인다.
  - 참고: ux-guidelines.csv 69번(가로 스크롤 금지).
- 제안: 입력에 `min-w-0`, 모달은 `w-full max-w-[340px]` + 오버레이 `px-4`, channels-04 의 탭 가로 스크롤 처리. 원인을 고친 뒤 안전장치로 body `overflow-x: clip`(sticky 를 깨지 않음) 검토.

### mobile-14 · P3 · visual-consistency · 공수 S
**모바일 브라우저 상단바·기본 폼 컨트롤이 라이트 테마로 남아 있다 (theme-color·color-scheme 없음)**

- 페이지: 전체
- 파일: `src/app/layout.tsx`, `src/app/globals.css`
- 근거: `layout.tsx` 에 `export const viewport`(themeColor) 0건, `globals.css` 에 `color-scheme` 0건(`:19` 는 prefers-color-scheme 미디어쿼리뿐). `sign-in-mobile-01.png` 의 동의 체크박스가 흰 네모(`sign-in/_components/SignInForm.tsx:179-210` 기본 체크박스 + accent-white). 안드로이드 Chrome 주소창은 theme-color 가 없으면 기본 밝은 색이다.
- 문제: 순수 블랙 화면에 밝은 주소창·흰 체크박스·밝은 select 목록이 섞여 다크 테마 마감이 깨진다.
- 제안: `layout.tsx` 에 `export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" }`(정적 값이라 정적 렌더 유지), `globals.css` 에 `:root { color-scheme: dark; }`. 체크박스·select·스크롤바가 어두운 기본 모양으로 바뀐다.

## 다른 영역 보고서와의 관계

| 기존 발견 | 이 보고서에서 |
|---|---|
| home-01, pricing-11, studio-09, pricing-14 의 페이지별 break-keep | mobile-01 전역 규칙 한 번으로 대체 |
| home-07(검색창이 첫 화면 끝), auth-07(로그인 카드가 아래로) | mobile-02(고정 네비 56px), mobile-10(min-h-screen 제거)로 함께 개선 |
| studio-11 9번, auth-07 의 카카오 버튼 겹침 | mobile-03 |
| home-13(SearchBar 14px) | mobile-05 의 일부 |
| channels-04(정렬 탭 넘침) | mobile-13 에 파생 증상(카카오 버튼 화면 밖) 추가 |
| studio-06(모바일 고정 CTA 없음) | mobile-06 의 공용 하단 바 컴포넌트를 함께 사용 |

## 권장 진행 순서

1. 전역 CSS 몇 줄, 위험 낮음: mobile-01, mobile-05, mobile-08, mobile-14
2. 카카오 버튼 레이어: mobile-03
3. 네비 구조: mobile-02 (이후 mobile-07 의 보조 바는 자동 해결)
4. 레이아웃 높이: mobile-10
5. 페이지 단위: mobile-06, mobile-04, mobile-11, mobile-09
6. 마감: mobile-12, mobile-13, mobile-07 의 이미지 작업
