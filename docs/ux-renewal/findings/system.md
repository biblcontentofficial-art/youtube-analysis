# system 영역 감사: 디자인 시스템 일관성 (횡단)

- 범위: `src` 의 .tsx 156개에서 className 3,636개를 태그별로 뽑아 역할(버튼·카드·배지·입력·제목·컨테이너)별 레시피를 집계했다. `src/app/globals.css`, `tailwind.config.js`, 빌드 산출물 `.next/static/css/app/layout.css`(10/4 로컬 빌드, 이후 src 변경 없음), 프로덕션 메타 태그(`curl`), 공개 이미지 `public/og-image.png`.
- 집계 기준: "변환 완료 파일" = neutral 을 쓰고 gray·slate·teal 을 하나도 쓰지 않는 .tsx 49개. 구 테마 파일(107개 중 클래스가 있는 것)은 따로 센다.
- 본 스크린샷: `shots/before/` home·pricing·trend-search·incubating·community·about·studio-consulting·studio-class-consulting 데스크톱 첫 조각, home·trend-search·pricing 모바일, `shots/before-studio/studio-desktop-01.png`, `shots/before-auth/community-feed-top.jpg`, 프로덕션 `/opengraph-image`.
- 다른 횡단 영역과의 경계: body 배경·글자색 덮어쓰기(shell-01), 글꼴 미로드(shell-02), 네비 현재 위치(shell-04), 포커스(shell-06·a11y-01), keep-all(shell-07), 명암비 수치(a11y-02), 모달 의미 구조(a11y-04·auth-11)는 해당 보고서가 다룬다. 이 보고서는 같은 문제가 다시 생기지 않게 하는 토큰과 공용 프리미티브, 그리고 아직 아무도 다루지 않은 전역 결함만 다룬다.

## 총평

변환이 끝난 화면은 재료를 맞게 쓴다. 블랙 바탕, `bg-neutral-900` 카드, 화이트 주 버튼, 에메랄드는 글자·밑줄·체크에만 쓰고 버튼 배경으로 쓴 곳이 없으며 글로우(`shadow-[0_0`)는 0건이다. 문제는 토큰과 공용 컴포넌트가 하나도 없다는 점이다. Tailwind 테마에 프로젝트 값이 하나도 등록돼 있지 않고(`globals.css:12-17` 의 등록값은 미사용이거나 자기 참조), `src/components` 에도 Button·Card 같은 프리미티브가 없다. 그래서 같은 역할의 요소가 파일마다 새로 조립된다. 화이트 주 버튼 35개가 19가지, 테두리 보조 버튼 35개가 27가지, 카카오 버튼 8곳이 hover 6색, 페이지 머리 장식이 6종, 컨테이너 폭이 8종, z-index 가 12종이다. 이 차이는 페이지를 옮겨 다닐 때 버튼 모양과 왼쪽 기준선이 바뀌는 형태로 보이고, 요금제처럼 한 화면 안에서 주·보조 위계가 흐려지는 형태로도 보인다. 공유 미리보기 이미지는 아직 남색 그라데이션과 틸 로고다. 해결은 재설계가 아니라 이미 다수가 쓰는 레시피를 표준으로 고정하는 일이다. 최소 토큰 1개 파일과 작은 프리미티브 9개(새 의존성 없음)로 변환 완료 파일 44개를 정리할 수 있고, 구 테마 파일 60개는 테마 변환 때 같은 프리미티브로 갈아 끼우면 된다.

## 유지할 점 (과한 재설계 방지)

1. 화이트 주 버튼의 색 조합 `bg-white text-black font-bold hover:bg-neutral-200` 은 35개 중 32개가 같다. 색은 그대로 두고 크기·반경만 고정한다.
2. 변환된 카드의 재료는 이미 다수안이 있다: `bg-neutral-900` 41개 중 35, `border-neutral-800` 30, `rounded-2xl` 31. 이 다수안을 표준으로 삼는다.
3. 입력 레시피 `src/app/community/write/_components/PostForm.tsx:45-46`(INPUT)은 소유자 규칙에 맞고 변환 화면 전체가 거의 같은 값을 쓴다. Input 프리미티브의 기준으로 그대로 쓴다.
4. 선택 상태 "흰 필 = 선택됨": `src/app/community/_components/CategoryChips.tsx:28-31`(ACTIVE_CHIP/IDLE_CHIP), 랭킹 기간 탭, 트래픽 기간 버튼이 같은 언어를 쓴다. Chip 의 기준.
5. 확정 섹션 헤더 구현 `src/app/studio/page.tsx:252-261`, `src/app/trend-search/page.tsx:85-88`. 모양은 그대로 두고 공용 컴포넌트로 옮기기만 한다.
6. 페이지 탭 `src/app/community/_components/CommunityTabs.tsx:54-59` 의 에메랄드 밑줄 + `aria-current`. 페이지 탭과 네비 현재 위치(shell-04)의 공통 언어로 쓸 수 있다.
7. 전역 확인창 Provider 구조 `src/app/_components/ConfirmDialog.tsx:20-56`(화이트 확인 + neutral 취소). Dialog 셸의 출발점.
8. 액센트 절제: `#00E5A0` 64회 중 글자 50·테두리 6·체크박스 3·작은 표시(라디오 점, 진행 막대) 2. 버튼 배경 0.

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| system-01 | P1 | visual-consistency | 버튼: 주 CTA 19가지, 보조 27가지, 카카오 8구현, 비활성 5단계. 회색 채움 보조 버튼이 비활성처럼 보임 | M |
| system-02 | P1 | theme-violation | 토큰이 없다: 액센트 리터럴 71회, 구 남색·인디고 토큰 잔존, 변환 파일 안에서도 글자 회색 9단계·무채색 테두리 13종 | M |
| system-03 | P1 | theme-violation | 공유 미리보기(OG) 이미지가 남색 그라데이션 + 틸 로고, /pricing·/about 은 이미지 없음 | S |
| system-04 | P2 | bug | 레이어 체계 없음: z-index 12종, z-50 하나에 네비·카카오 버튼·모달 8개·토스트. 카카오 버튼이 모달 딤 위에 뜨고 토스트 닫기와 채널 배너 버튼을 덮음 | S |
| system-05 | P2 | typography | 제목 체계: 섹션 헤더 2벌 복제, 페이지 머리 장식 6종, h1 13가지, 글자 크기 20단계, 11px 이하 141회 | M |
| system-06 | P2 | visual-consistency | 카드 41개 23가지(패딩 12종), hover 표현 4종 | S |
| system-07 | P2 | layout | 바깥 컨테이너 폭 8종, 네비만 풀폭, 섹션 세로 여백 9종 | M |
| system-08 | P2 | visual-consistency | 배지 19개 17가지, 선택 상태 4가지 언어, 커뮤니티 노랑 강조·빨강 N 배지 | M |
| system-09 | P2 | visual-consistency | 입력 레시피가 상수 3벌·인라인 5곳에 복제, 구 입력은 포커스 색 6종 | S |
| system-10 | P3 | performance | globals.css 미사용 규칙·자기 참조 토큰·레이어 밖 유틸 재정의, tailwind.config.js 는 v4 가 읽지 않음 | S |
| system-11 | P3 | visual-consistency | 인라인 SVG 153개(굵기 10종, 검색 아이콘 5벌), 로고 6벌 | M |

## 발견 상세

### system-01 · P1 · visual-consistency · 공수 M
**버튼: 같은 역할의 버튼이 파일마다 다시 조립된다**

- 페이지: 전 페이지(네비 포함), 특히 `/pricing`, `/`, `/studio`, `/community`, `/studio/class/consulting`, 오류 화면
- 근거
  - 화이트 주 버튼(`bg-white`+`text-black`) 35개, 19가지 레시피(변수로 조합한 2곳 `PricingCards.tsx:95`, `CommunitySidebar.tsx:60` 제외). 반경 4종(md·lg·xl·2xl), 가로 패딩 7종(px-3·4·5·6·8·12, w-full), 세로 7종(py-1.5~py-5), 글자 4종(xs·sm·base·lg), 굵기 3종(medium·bold·black), hover 3종(neutral-200·gray-200·gray-100).
    - `src/app/page.tsx:173` px-6 py-2.5 text-sm / `:263` px-8 py-3 (글자 크기 지정 없음) / `src/app/studio/page.tsx:309` px-8 py-4 text-base / `:969` px-12 py-5 text-lg rounded-2xl / `src/app/error.tsx:27` rounded-lg / `src/app/_components/NavUser.tsx:74` rounded-md px-3 py-1.5 text-xs / `src/app/studio/class/consulting/page.tsx:23` font-black + `hover:bg-gray-200` + `shadow-lg shadow-white/10` / `src/app/threads/_components/ConnectMetaButton.tsx:47` font-medium + `hover:bg-gray-100` + rounded-lg text-base.
  - 테두리 보조 버튼 35개, 27가지(변환 파일만). 두 계열이 섞여 있다: 채움형 `bg-neutral-800 border-neutral-700 hover:bg-neutral-700`(`incubating/page.tsx:93`, `error.tsx:33`, `CommunitySidebar.tsx:65`)과 외곽선형 `border-neutral-700 hover:border-neutral-500`(`studio/page.tsx:315`, `studio/consulting/page.tsx:225`). 글자색 3종(white·neutral-300·neutral-400), 반경 4종.
  - 요금제 한 줄 안에 CTA 4개가 3가지 모양: `PricingCards.tsx:46`(neutral-800+테두리 700), `:70`(neutral-700 채움, 테두리 없음), `:95`(화이트), `:117`(neutral-800+테두리 600). 스크린샷 `pricing-desktop-01.png` y≈946, `pricing-mobile-02.png` 의 "Starter 시작하기"(회색 채움).
  - 비활성 표현 5단계: `disabled:opacity-50` 36, `-40` 11, `-60` 5, `-70` 4, `-30` 2. 화이트 버튼의 비활성(`studio/consulting/page.tsx:454`, `studio-consulting-desktop-01.png` 의 "다음 →", `sign-in-desktop-01.png` 의 "동의하고 계속하기")은 회색 채움이 되어, 요금제의 활성 "Starter 시작하기"(neutral-700)와 구분되지 않는다.
  - 카카오 버튼 8곳: 배경 2색(`#FEE500` 6곳, `CourseEnrollButton.tsx:34` 만 `bg-yellow-500`), hover 6색(`#FDD835` `SignInForm.tsx:248`·`LimitModal.tsx:141`, `#FFD700` `studio/consulting/page.tsx:214`, `#F0D900` `PortoneButton.tsx:30`, `#F5DC00` `ShareButton.tsx:97`, `#FFD900` `KakaoChatButton.tsx:13`, `yellow-400`), 글자 3색(`#191919`·`#3A1D1D`·black), 반경 4종.
  - 전체(구 테마 포함) 버튼형 요소 199개, 153가지, 80개 파일. 색 배경 버튼 47개(teal 32 등)는 구 테마 영역 보고서(auth-08, channels-06, pricing-06·15)가 다룬다.
- 문제: 페이지를 옮길 때마다 주 버튼의 높이·반경·굵기가 바뀐다(홈 마지막 CTA 48px 16px 글자, 스튜디오 히어로 56px, 컨설팅은 font-black 에 흰 그림자, 오류 화면은 반경 8px). 요금제에서는 보조 버튼 3종이 나란히 있고 그중 회색 채움은 비활성 버튼과 같은 색이라 누를 수 있는 버튼으로 읽히지 않는다. 컨설팅 CTA 의 `shadow-white/10` 은 흰 번짐으로 금지 패턴(글로우)에 가깝다.
- 제안: `src/components/ui/button.ts` 에 클래스 함수 하나를 두고(서버·클라이언트 공용, 의존성 없음) `<button>`, `<a>`, `<Link>` 모두 같은 함수를 쓴다.
  ```ts
  const BASE = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const VARIANT = {
    primary:   "bg-white text-black font-bold hover:bg-neutral-200",
    secondary: "border border-neutral-700 text-white hover:border-neutral-500 hover:bg-neutral-900",
    ghost:     "text-neutral-300 hover:text-white hover:bg-neutral-900",
    danger:    "border border-red-900/60 text-red-400 hover:bg-red-950/40",
    kakao:     "bg-kakao text-kakao-ink font-bold hover:bg-kakao-hover", // 토큰은 system-02
  };
  const SIZE = { sm: "h-9 px-3.5 text-xs", md: "h-11 px-5 text-sm", lg: "h-14 px-8 text-base" };
  export const buttonClass = ({ variant = "primary", size = "md", block = false } = {}) =>
    `${BASE} ${VARIANT[variant]} ${SIZE[size]}${block ? " w-full" : ""}`;
  ```
  - 매핑: 네비 "시작하기" = primary sm, 카드·폼·오류 화면 = md, 히어로·마지막 CTA = lg(스튜디오 마지막 CTA 도 lg). 보조는 외곽선형 하나로(채움형 neutral-800 계열과 요금제 3종 모두 secondary). 요금제는 추천 카드만 primary, 나머지 3장은 secondary.
  - 컨설팅 CTA 의 `shadow-white/10`, `font-black`, gray hover 제거. 비활성은 40% 하나.
  - 카카오는 kakao 변형 하나(배경 `#FEE500`, hover `#FDD835`, 글자 `#191919`). `CourseEnrollButton.tsx:34` 의 `bg-yellow-500` 도 같은 변형으로.
- 공수: M. 버튼형 요소가 있는 파일 80개(변환 32, 구 테마 48). 변환 32개는 클래스 문자열 치환 수준. 구 테마 48개는 테마 변환 때 함께.

### system-02 · P1 · theme-violation · 공수 M
**토큰이 없다: 확정 규칙이 코드에 등록돼 있지 않아 값이 손으로 복사된다**

- 페이지: 전 페이지
- 근거
  - 액센트가 토큰이 아니라 리터럴: `#00E5A0` 64회/24파일, `#66FFCC` 7회/5파일(예: `src/app/layout.tsx:383, 496`, `src/app/incubating/page.tsx:50`, `src/app/community/_components/CommunityTabs.tsx:58`).
  - 전역 토큰은 구 남색 테마 값 그대로: `src/app/globals.css:4` `--background: #0b0f17`, `:5` `--foreground: #e7eaf0`(청색기 있는 흰색), `:6` `--muted: #97a3b6`, `:7` `--card: #0f1623`, `:9` `--ring: rgba(99,102,241,.55)`(인디고). `--muted`·`--card`·`--card-border`·`--ring` 사용처 0. `@theme inline`(`:12-17`)이 등록한 `bg-background`·`text-foreground` 도 사용 0(빌드 CSS 에 생성되지 않음).
  - Tailwind 테마에 프로젝트 고유 값(액센트, 브랜드색, 반경 역할)이 하나도 없다. `tailwind.config.js` 는 v4 가 읽지 않는다(system-10).
  - 변환 완료 49개 파일 안에서도 역할별 단계가 늘어져 있다: 글자 회색 9단계(white, neutral-100·200·300·400·500·600·700·800), 무채색 테두리 13종(neutral-300·400·500·600·700·800·800/60·900, `white/[0.06]`·`[0.07]`·`[0.08]`·`/30`·`/60`), 무채색 배경 17종(반투명 흰색 `white/[0.015]`·`[0.02]`·`[0.03]`·`[0.06]`·`/95` 포함). hover·focus 변형까지 세면 테두리 31종, 배경 56종. `border-white/[0.06]` 은 #0f0f0f 로 `neutral-800`(#262626)보다 훨씬 흐린 선이다(커뮤니티·인사이트 9개 파일 20회).
  - 액센트 이탈(변환 화면): 커뮤니티 사이드바 강조 메뉴 `text-yellow-400`(`CommunitySidebar.tsx:124-125`, `community-feed-top.jpg` 좌측 "유튜브 인큐베이팅 지원하세요!"), 새 글 표시 빨강 원형 8px 배지 `bg-[#E5484D]`(`CommunitySidebar.tsx:35`, 되돌린 레드 액센트와 같은 값).
  - 참고 규모: gray 1,298회/71파일, teal 396/52, slate 143/9 는 영역별 변환 보고서(auth-08, channels-06, pricing-06·14·15, search, class)가 다룬다.
- 문제: 확정값이 문서(메모리)에만 있고 코드에는 없어서, 새 화면을 만들 때마다 hex 를 복사하거나 비슷한 neutral 단계를 골라 쓰게 된다. 그 결과 변환이 끝난 화면 안에서도 선 굵기·글자 회색이 화면마다 다르고, 커뮤니티처럼 새로 만든 화면에 노랑·빨강 강조가 다시 들어온다. 구 토큰은 OS 라이트 모드에서 body 를 남색으로 칠하는 원인이기도 하다(shell-01).
- 제안: `globals.css` 에 최소 토큰을 등록하고 역할표 밖의 단계는 쓰지 않는다(전체 초안은 부록 A).
  ```css
  @theme {
    --color-accent: #00E5A0;        /* text-accent, border-accent/40, bg-accent/10, accent-accent */
    --color-accent-hover: #66FFCC;  /* hover:text-accent-hover */
    --color-kakao: #FEE500;
    --color-kakao-hover: #FDD835;
    --color-kakao-ink: #191919;
    --radius-control: 0.75rem;      /* rounded-control = 버튼·입력 (xl 과 같은 값) */
    --radius-card: 1rem;            /* rounded-card = 카드·모달 (2xl 과 같은 값) */
  }
  ```
  - 역할표(이 단계만 쓴다): 바탕 `bg-black` / 표면 `bg-neutral-900` / 표면 hover `bg-neutral-800` / 선 `border-neutral-800` / 컨트롤 선 `border-neutral-700` / hover 선 `border-neutral-600` / 포커스 선 `border-neutral-400` / 글자 `text-white`·`text-neutral-300`(본문)·`text-neutral-400`(보조, 작은 글씨의 하한)·`text-neutral-500`(14px 이상 장식·비활성만) / 액센트 `text-accent`(강조 단어·현재 탭 밑줄·체크) / 의미색 `text-red-400`(에러·할인)·`text-amber-300`(경고)·`text-green-400`(성공).
  - 없앨 것: 글자 neutral-100·200·600·700·800, 테두리 `white/[0.0x]`·neutral-900·500·300·`border-2`, 반투명 흰 배경 표면(→ `bg-neutral-900` 또는 `hover:bg-neutral-900`), `bg-neutral-950`(→ `bg-black`, 푸터·모바일 메뉴 줄 `layout.tsx:361, 400` 포함).
  - 커뮤니티 강조 메뉴는 `font-bold text-white`, 새 글 표시는 `text-[11px] font-bold text-accent` 글자 "N"(원형 배경 없이).
  - 구 `:root` 토큰 4개 삭제, `--background/--foreground` 는 #000/#fff 로(shell-01 과 같은 수정).
  - 재발 방지: 변환이 끝나면 `grep -rnE "(gray|slate|teal)-[0-9]|bg-gradient|shadow-\[0_0|\[#00E5A0\]|\[#66FFCC\]" src` 가 0 이어야 한다는 확인 스크립트를 package.json 에 둔다(의존성 없음). 현재 `eslint.config.mjs` 는 설치된 ESLint 8.57 에 없는 `eslint/config` 를 불러와 린트가 돌지 않으므로 grep 쪽이 현실적이다.
- 공수: M. 토큰 등록은 파일 1개(S). 액센트 리터럴 치환 24개 파일은 찾아 바꾸기(S). 역할표 밖 단계 정리는 변환 파일 49개 점검(M).

### system-03 · P1 · theme-violation · 공수 S
**공유 미리보기(OG) 이미지가 구 테마이고, 요금제·소개는 이미지가 없다**

- 페이지: `/`, `/community`, `/trend-search`, `/incubating`, `/terms`, `/sign-in`, `/insights`, `/tools/calculator` 등 개별 이미지가 없는 모든 페이지, 그리고 `/pricing`, `/about`
- 근거
  - `src/app/opengraph-image.tsx:18` `background: linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)`, `:45` "lab" 글자 `#2dd4bf`(틸), `:36` 테두리 `#374151`, `:48, 51` gray 글자.
  - 프로덕션 `og:image` = `https://bibllab.com/opengraph-image?dde98065a2dde640` (`/`, `/community`, `/trend-search`, `/incubating`, `/terms`, `/sign-in`, `/insights`, `/tools/calculator` 에서 확인). 이미지 픽셀 #030713 → #0f172a(남색).
  - 레이아웃이 의도한 이미지 `src/app/layout.tsx:41-48` 의 `/og-image.png`(검정 바탕 흰 글자, `public/og-image.png`)는 파일 기반 OG 가 우선하는 Next 규칙 때문에 `twitter:image` 에만 남았다.
  - `/pricing`, `/about` 은 `og:image` 가 아예 없다: `src/app/pricing/page.tsx:14-18`, `src/app/about/page.tsx:13-17` 의 openGraph 에 images 가 없어 부모 값을 덮는다.
  - 같은 계열: `src/app/manifest.ts:10-11` `background_color: '#030712'`, `theme_color: '#2dd4bf'`(shell-08 이 다룸).
- 문제: 카카오톡·슬랙으로 링크를 공유하면 사이트에서 이미 걷어낸 남색 그라데이션과 틸 로고가 첫인상으로 나간다. 워드마크도 "bibllab" 로 붙어 나온다(사이트는 "bibl lab"). 가장 많이 공유될 요금제 링크는 미리보기 이미지가 없다.
- 제안: `src/app/opengraph-image.tsx` 를 지워 레이아웃의 `/og-image.png` 가 전 페이지에 적용되게 하거나, 남기려면 배경 `#000` 단색, 로고 상자 테두리 `#404040`, "bibl" 흰색 + " lab" `#a3a3a3`(네비와 같은 두 톤), 보조 문구 `#a3a3a3`, 그라데이션·틸 제거. `/pricing`, `/about` 의 openGraph 에 `images: ["https://bibllab.com/og-image.png"]` 를 넣는다. manifest 는 `#000000` 두 값으로(shell-08).
- 공수: S (파일 1개 삭제 또는 수정 + 메타 2곳)

### system-04 · P2 · bug · 공수 S
**레이어 체계가 없다: z-50 하나에 네비·카카오 버튼·모달·토스트가 몰려 DOM 순서로 겹침이 정해진다**

- 페이지: 모달이 뜨는 모든 화면(홈 로그인 유도, 한도 초과, 영상 상세, 마이페이지 해지·탈퇴), `/search`(수집 토스트, 카카오 채널 배너)
- 근거
  - z-index 12종: `z-50` 15, `z-[100]` 4, `z-[9999]` 3, `z-[60]` 3, `z-40` 3, `z-[9998]` 2, `z-30` 2, `z-10` 2, `z-[99]`, `z-[9990]`, `z-[120]`, `z-[10000]`.
  - `z-50` 에 함께 있는 것: 네비 `src/app/layout.tsx:302`, 카카오 플로팅 버튼 `src/app/_components/KakaoChatButton.tsx:13`(레이아웃에서 `{children}` 뒤 `:398` 에 렌더), 모달 8개 `src/app/page.tsx:92`, `search/_components/LimitModal.tsx:70, 122`, `VideoModal.tsx:202`, `VideoCard.tsx:39`, `mypage/_components/CancelSubscriptionButton.tsx:53`, `DeleteAccountButton.tsx:35`, `admin/_components/AdminDashboard.tsx:424`, 토스트 `search/_components/SearchResultList.tsx:545`. 감싸는 요소(`NavigationLoader`, `ConfirmProvider`, 각 `<main>`)가 쌓임 맥락을 만들지 않으므로 같은 z 끼리는 나중에 그려진 카카오 버튼이 위로 온다.
  - 결과 1: 모든 z-50 모달의 검은 딤 위에 노란 카카오 버튼이 밝게 떠 있고 눌린다. 모바일 한도 초과 시트(`LimitModal.tsx:70` `items-end pb-6`)는 오른쪽 아래 모서리가 버튼에 가린다.
  - 결과 2: 수집 완료 토스트 `fixed bottom-6 right-6 z-50`(`SearchResultList.tsx:545`)와 카카오 버튼 `md:bottom-6 md:right-6 z-50` 이 같은 자리다. 토스트 오른쪽 끝의 닫기(✕, `:553-556`)가 버튼 밑에 깔린다.
  - 결과 3: 카카오 채널 배너 `fixed sm:bottom-6 sm:right-6 z-40`(`KakaoChannelBanner.tsx:43`)는 카카오 버튼(z-50) 아래라 "채널 추가하기" 버튼(`:68`) 오른쪽 끝이 가린다.
  - 딤 농도 5종(`bg-black/60` 8, `/65` 1, `/70` 5, `/75` 2, `/80` 1)과 패널 4양식(`bg-neutral-900`+neutral-700 `ConfirmDialog.tsx:63`·`page.tsx:96`, `bg-gray-900` `LimitModal.tsx:71`·`VideoModal.tsx:205`, 남색 hex `bg-[#161b27]` `VideoCard.tsx:43`·`CancelSubscriptionButton.tsx:57`·`DeleteAccountButton.tsx:39`, 흰 패널 `SearchResultList.tsx:451`·`KeywordCompetition.tsx:128`).
- 문제: 겹침 순서를 아무도 정하지 않아, 새 고정 요소가 생길 때마다 우연히 결정된다. 모달이 떠도 카카오 버튼이 계속 위에 남아 시선을 끌고, 토스트 닫기와 배너 버튼이 가려진다. 같은 "확인창"이 화면마다 다른 바탕색과 딤 농도로 뜬다.
- 제안
  - 숫자 스케일을 정하고(Tailwind v4 는 `z-60` 같은 정수 유틸을 그대로 지원) 모든 고정 요소를 여기에 맞춘다: `z-30` 페이지 내부 sticky(보조 헤더, 하단 신청 바, sticky 구매 카드) / `z-40` 전역 네비·카카오 버튼 / `z-50` 모달·바텀시트 / `z-60` 모달 위 확인창(ConfirmDialog) / `z-70` 토스트·배너 / `z-80` 라우트 진행 막대·전역 로딩. `z-[99]`~`z-[10000]` 은 없앤다.
  - 오른쪽 아래 고정 토스트·배너는 카카오 버튼 위로 띄운다: `bottom-24 right-5 md:right-6`.
  - Dialog 셸 하나: 딤 `fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4`, 패널 `w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl shadow-black/50`. 역할·포커스 가둠·Esc 는 a11y-04, auth-11 이 정한 구조를 이 셸에 넣는다.
- 공수: S (z 값이 있는 파일 26개 38줄의 숫자 교체). Dialog 셸 적용은 모달 12개라 M 이지만 a11y-04 와 한 번에 한다.

### system-05 · P2 · typography · 공수 M
**제목 체계: 확정 섹션 헤더가 두 곳에만 있고, 페이지마다 머리 모양과 제목 크기가 다르다**

- 페이지: `/`, `/pricing`, `/trend-search`, `/incubating`, `/community`(비회원 게이트), `/studio`, `/studio/consulting`, `/studio/class/consulting`
- 근거
  - 확정 섹션 헤더(좌 캡션 + 우 영문 라벨 + 헤어라인)는 `studio/page.tsx:252-261` 의 지역 함수 `SectionLabel` 과 `trend-search/page.tsx:85-88` 의 인라인 복사본 두 곳뿐이다. 스튜디오 쪽은 라벨 안에 `<TrackVisit page="studio" />`(`:256`)가 들어 있어 라벨 수만큼 방문이 기록된다(studio-04 의 원인). 그대로 복사하면 버그도 복사된다.
  - 페이지 머리 장식 6종: 홈 회색 외곽선 필 `page.tsx:139`, 요금제 에메랄드 글자 필 `pricing/page.tsx:30`, 인큐베이팅 에메랄드 채움 필 2개 `incubating/page.tsx:50, 53`, 커뮤니티 게이트 영문 대문자 `CommunityGate.tsx:26`(`tracking-[0.2em]`), 상담 폼 대문자 `studio/consulting/page.tsx:258-259`(`tracking-widest`, em-dash 포함), 허브·스튜디오 확정 헤더. 스크린샷 `home-desktop-01.png`, `pricing-desktop-01.png`, `incubating-desktop-01.png`, `community-desktop-01.png`, `studio-consulting-desktop-01.png`, `trend-search-desktop-01.png`.
  - 영문 라벨 자간 4종: `tracking-[0.25em]` 2, `[0.2em]` 1, `widest` 12, `wider` 14.
  - h1(변환 파일) 22개, 13가지. 랜딩 h1 만 5가지 크기: 홈 `text-5xl md:text-6xl`(`page.tsx:145`), 스튜디오 `text-4xl md:text-5xl lg:text-6xl`(`studio/page.tsx:292`), 허브 `text-3xl md:text-5xl`(`trend-search/page.tsx:90`), 요금제 `text-4xl md:text-5xl font-extrabold`(`pricing/page.tsx:33`), 인큐베이팅 `text-2xl lg:text-3xl`(`incubating/page.tsx:57`). 굵기도 black·extrabold·bold 혼재. h2 33개 17가지(홈 `text-2xl md:text-3xl` `page.tsx:244` vs 스튜디오 `text-3xl md:text-5xl` `studio/page.tsx:353`).
  - 글자 크기 20단계(전체): xs~7xl 에 `text-[8px]`·`[9px]`·`[10px]`·`[11px]`·`[12px]`·`[13px]`·`[15px]`·`[16px]`·`[17px]`. 11px 이하 141회/45파일(예: `CommunitySidebar.tsx:35` 8px, `trend-search/page.tsx:105` 10px, `PricingCards.tsx:219` 11px). 굵기 6종(medium 16회, extrabold 2회 포함).
- 문제: 상단 메뉴를 옮겨 다니면 머리 모양이 매번 바뀌어(가운데 필 + 큰 제목, 좌측 헤더 + 왼쪽 제목, 작은 제목) 한 사이트로 읽히지 않는다. 같은 단계(페이지 h1)의 제목이 데스크톱에서 30px~60px 로 다르다. 8~11px 글자는 한글에서 획이 뭉개진다.
- 제안
  - `src/components/ui/section-header.tsx`: 스튜디오 `SectionLabel` 의 마크업을 그대로 옮기되 TrackVisit 은 빼고(페이지에서 1회), 캡션 색만 `text-neutral-400` 으로. 두 톤 제목을 함께 렌더하는 `title` prop:
    ```tsx
    <div className="mb-12 flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
      <span className="text-xs md:text-sm text-neutral-400">{caption}</span>
      <span className="text-sm md:text-base font-black tracking-[0.25em] text-white">{label}</span>
    </div>
    <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
      <span className="text-neutral-400">{lead}</span><br /><span className="text-white">{headline}</span>
    </h2>
    ```
  - 페이지 머리는 이 헤더 하나로 통일하고(홈 히어로만 예외로 가운데 정렬 유지 가능), 필 모양 장식 3종은 없앤다. 영문 라벨 자간은 0.25em 하나.
  - 제목 단계 4개: display `text-4xl md:text-6xl font-black tracking-tight leading-[1.1]`(홈·스튜디오 히어로) / title `text-3xl md:text-5xl font-black tracking-tight leading-tight`(허브·요금제 h1, 섹션 h2) / app-title `text-xl md:text-2xl font-bold tracking-tight`(커뮤니티·마이페이지·글쓰기 h1) / card-title `text-lg md:text-xl font-bold`. 본문 `text-sm md:text-base text-neutral-300 leading-relaxed`, 리드 `text-base md:text-lg text-neutral-400`, 캡션 `text-xs text-neutral-400`.
  - 글자 크기 하한 12px(`text-xs`). 임의 px 크기 9종 제거. 굵기는 regular·semibold·bold·black 네 가지.
- 공수: M. 컴포넌트 1개 신규 + 공개 페이지 약 10개 파일(home-10, studio-15 의 섹션 정리와 함께).

### system-06 · P2 · visual-consistency · 공수 S
**카드: 재료는 맞지만 패딩·반경·hover 가 제각각이다**

- 페이지: `/trend-search`, `/studio`, `/incubating`, `/community`, `/studio/class/*`, `/pricing`, 홈 모달
- 근거
  - 변환 파일의 카드형 컨테이너 41개, 23가지(20개 파일): 반경 3종(2xl 31, xl 8, 3xl 2), 테두리 4종(neutral-800 30, neutral-700 7, 없음 3, `border-2` 1), 패딩 12종(p-3·3.5·4·5·6·7·8, p-5 md:p-6, p-6 md:p-8, p-8 md:p-10, p-10 md:p-16 등).
    - `studio/class/[slug]/page.tsx:77` `rounded-xl p-6`, `community/about/page.tsx:64` `rounded-xl p-5`, `incubating/page.tsx:74` `rounded-2xl p-6`, `studio/page.tsx:882` `rounded-3xl p-8 md:p-10`, `:945` `rounded-3xl bg-neutral-950 p-10 md:p-16`, `page.tsx:96`·`ConfirmDialog.tsx:63` 테두리 neutral-700.
    - 요금제 카드 4장이 테두리 4색 + 2px: `PricingCards.tsx:183` `border-2 ${plan.color}` ← `:32` neutral-800, `:55` neutral-600, `:79` white/60, `:104` neutral-500 (`pricing-desktop-01.png`).
  - hover 표현 4종: 테두리 밝힘 `hover:border-neutral-600`(`trend-search/page.tsx:100`, `FeedCard.tsx:79`), 클릭 안 되는 카드의 배경 hover(`page.tsx:275, 285`, home-10), 떠오름 `.review-card`(`globals.css:143-149`, `studio/page.tsx:737`), 떠오름+확대+그림자 `.channel-card`(`globals.css:132-140`, `studio/page.tsx:453, 840`).
  - 구 테마 카드는 27개 파일에 따로 있다(gray-900, `#161b27` 등).
- 문제: 같은 목록 카드가 페이지마다 16px/12px/24px 반경과 16~40px 안쪽 여백으로 나와 밀도가 다르다. 요금제는 강조할 카드 하나 대신 네 장 모두 다른 테두리라 추천이 덜 드러난다. 눌리는 카드와 안 눌리는 카드가 같은 hover 반응을 하기도 하고, 스튜디오 카드만 위로 떠오른다.
- 제안: `src/components/ui/card.ts`
  ```ts
  export const CARD = "rounded-2xl border border-neutral-800 bg-neutral-900";
  export const CARD_PAD = { sm: "p-4", md: "p-5 md:p-6", lg: "p-8 md:p-10" };
  export const CARD_LINK = "transition-colors hover:border-neutral-600"; // 클릭되는 카드에만
  ```
  - xl·3xl 카드 → 2xl. 강조 패널(스튜디오 마지막 CTA 등)도 2xl + lg 패딩.
  - 요금제: 네 장 모두 1px neutral-800, 추천 카드만 `border-white`(기존 "추천" 흰 배지 유지).
  - hover 는 CARD_LINK 하나. `.channel-card`, `.review-card` 떠오름 효과는 빼고, 클릭 안 되는 카드는 hover 없음.
- 공수: S (변환 20개 파일). 구 테마 27개는 테마 변환 때.

### system-07 · P2 · layout · 공수 M
**컨테이너: 바깥 폭 8종, 네비만 풀폭, 섹션 세로 여백 9종**

- 페이지: 전 페이지
- 근거
  - 바깥 컨테이너: `max-w-xl`(576px) 상담 폼 `studio/consulting/page.tsx:236` / `max-w-3xl`(768) 인큐베이팅 `incubating/page.tsx:47`·약관 3종·계산기·소개 / `max-w-4xl`(896) 홈 하단 `page.tsx:243` / `max-w-[1000px]` 컨설팅 `studio/class/consulting/page.tsx:37, 54, 66, 82` / `max-w-screen-lg`(1024) 허브 `trend-search/page.tsx:84` / `max-w-6xl`(1152) 요금제 `pricing/page.tsx:26` / `max-w-screen-xl`(1280) 스튜디오·커뮤니티·검색·푸터 / 풀폭 네비 `layout.tsx:303`(`w-full px-3`). 홈은 한 페이지 안에서 3xl·2xl·5xl·4xl(`page.tsx:137, 156, 201, 243`).
  - 네비 로고 x≈12px, 푸터 로고 x≈96px(`home-desktop-01.png`, `home-desktop-02.png`). 본문 기준선은 페이지마다 224·352·144·96px 로 바뀐다(`trend-search-desktop-01.png`, `incubating-desktop-01.png`, `pricing-desktop-01.png`, `studio-desktop-01.png`).
  - 섹션 세로 여백: py-14(`studio/class/consulting/page.tsx:82`), py-16(`page.tsx:201`), py-20(`studio/page.tsx:351` 외 8곳), py-28(`:944`), py-24 md:py-36(`:280`), py-16 md:py-24(`trend-search/page.tsx:84`), py-12 lg:py-16(`incubating/page.tsx:47`), py-10 lg:py-16(`community/layout.tsx:48`), pt-12 pb-10(`studio/class/consulting/page.tsx:54`).
  - 네비 높이가 토큰이 아니어서 sticky 보조 헤더가 `top-14`(56px)로 하드코딩: `studio/class/consulting/page.tsx:36`, `insights/admin/_components/PostEditor.tsx:238`. 모바일 네비는 약 134px(shell-05)라 보조 헤더가 네비 밑으로 숨는다(class-03).
- 문제: 메뉴를 옮길 때마다 본문 왼쪽 기준선과 폭이 바뀌어 같은 사이트 안에서도 화면이 흔들린다. 네비는 화면 끝에, 본문과 푸터는 가운데 상자에 붙어 있어 상단과 하단의 정렬이 맞지 않는다.
- 제안: `src/components/ui/container.tsx`
  ```ts
  const SIZE = { wide: "max-w-screen-xl", base: "max-w-screen-lg", narrow: "max-w-3xl", tight: "max-w-sm" };
  // className = `mx-auto w-full px-4 ${SIZE[size]}`
  export const SECTION = "py-16 md:py-24";        // 랜딩 섹션
  export const SECTION_FIRST = "pt-20 pb-16 md:pt-28 md:pb-24"; // 히어로
  export const APP_HEAD = "py-8 md:py-12";         // 앱·커뮤니티 페이지 머리
  ```
  - wide: 네비 안쪽(`layout.tsx:303` → `mx-auto max-w-screen-xl px-4`)·푸터·스튜디오·커뮤니티·검색. base: 홈 하단·허브·요금제·컨설팅(`max-w-[1000px]` → base). narrow: 읽기·폼(약관, 인큐베이팅 본문, 상담 폼). tight: 로그인·오류.
  - sticky 오프셋은 네비 높이 변수로: 네비에 `--nav-h` 를 두고 `top-[var(--nav-h)]`, 앵커 대상에 `scroll-mt-[calc(var(--nav-h)+1rem)]`(shell-05 의 모바일 네비 결정 후).
- 공수: M. 가운데 정렬 컨테이너가 있는 파일 33개(변환 13, 구 테마 20).

### system-08 · P2 · visual-consistency · 공수 M
**배지·칩·탭: 작은 표시와 선택 상태의 모양이 정해져 있지 않다**

- 페이지: `/trend-search`, `/pricing`, `/incubating`, `/studio`, `/studio/class/*`, `/community`, 검색창 추천
- 근거
  - 배지(변환 파일) 19개, 17가지: 반경 3종(full 11, rounded 4, md 4), 글자 3종(xs 12, 10px 6, 11px 1). `incubating/page.tsx:50`(에메랄드 채움), `studio/page.tsx:387, 682`(md 사각 "문제 01"), `:741`(빨강 글자), `studio/class/[slug]/page.tsx:60`(md 10px 에메랄드), `:118`(rounded 10px), `community/[board]/[id]/page.tsx:180`(md 11px 에메랄드/30 테두리), `trend-search/page.tsx:105`(full 10px 회색), `PricingCards.tsx:187`(흰 채움 "추천"), `:241`(10px "준비중"), `_components/SearchBar.tsx:333`(rounded 10px), `insights/_components/InsightsList.tsx:127`(앰버 DRAFT). 전체로는 배지형 78개/35파일.
  - 선택 상태 4가지 언어: 흰 필(`CategoryChips.tsx:28-31`, `community/ranking/page.tsx:131-133`, `admin/traffic/MenuTrafficDashboard.tsx:94`), neutral-700 채움(요금제 월간/연간 `PricingCards.tsx:139-152`), 에메랄드 밑줄(`CommunityTabs.tsx:56-59`), 틸(구 `channels/_components/FilterTabs.tsx:71` 등, channels-06). 전역 네비는 현재 위치 표시 자체가 없다(shell-04).
  - 같은 칩의 hover 3종: `hover:border-neutral-600`(CategoryChips), `hover:bg-white/[0.02]`(랭킹), `hover:bg-white/[0.04]`(트래픽). 홈 인기 키워드 칩은 또 다른 조합(`page.tsx:187`).
  - 페이지 탭 바닥선이 `border-white/[0.06]`(`CommunityTabs.tsx:47`)이라 다른 구분선(neutral-800)보다 흐리다.
  - 같은 네비 항목이 데스크톱은 `rounded-full` 필(`layout.tsx:484`), 모바일 메뉴 줄은 `rounded-md`(`layout.tsx:365, 371, 377`)다(`home-desktop-01.png` 상단, `home-mobile-01.png` 상단).
- 문제: 같은 "플랜 필요", "모집 분야", "새 글" 같은 표시가 위치마다 다른 크기·모양이라 정보의 무게가 섞인다. 선택된 칩은 흰색인데 요금제 토글의 선택은 회색이어서 같은 동작이 다르게 보인다.
- 제안
  ```ts
  // badge.tsx
  const BADGE = "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5";
  const TONE = {
    neutral: "border-neutral-700 text-neutral-300",
    accent:  "border-accent/40 text-accent",
    solid:   "border-white bg-white text-black", // '추천' 한 곳만
    warn:    "border-amber-400/30 text-amber-300",
    danger:  "border-red-900/60 text-red-400",
  };
  // chip.ts (필터·기간·세그먼트 공용)
  const CHIP = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-colors";
  const CHIP_IDLE = "border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-white";
  const CHIP_ACTIVE = "bg-white font-bold text-black"; // + aria-current 또는 aria-pressed
  // tabs.ts (페이지 탭)
  const TAB_LIST = "flex gap-1 overflow-x-auto border-b border-neutral-800";
  const TAB = "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors";
  const TAB_ACTIVE = "border-accent font-semibold text-white";
  const TAB_IDLE = "border-transparent text-neutral-400 hover:text-white";
  ```
  - 요금제 월간/연간은 CHIP 세그먼트(선택 = 흰 필). 인큐베이팅 채움 필 → accent 배지. "문제 01" 사각 배지는 소유자 규칙대로 `01` 텍스트 숫자(`text-sm font-black text-neutral-500 tabular-nums`).
  - 네비 현재 위치(shell-04)도 TAB_ACTIVE 와 같은 언어(흰 글자 + 에메랄드 밑줄)로 맞춘다.
- 공수: M. 배지 변환 11개 파일 + 칩 4개 파일. 구 테마 24개는 변환 때.

### system-09 · P2 · visual-consistency · 공수 S
**입력: 좋은 레시피가 이미 있는데 복사본으로 퍼져 있고, 구 입력은 포커스 색이 6가지다**

- 페이지: `/community/write`, 글 상세 댓글, 커뮤니티 검색, 홈·검색 상단 검색창, `/studio/consulting`, 커뮤니티 관리, 구 테마 화면(수집함·결제·채널·계산기·관리자)
- 근거
  - 같은 레시피가 지역 상수 3벌: `community/write/_components/PostForm.tsx:45-46`(px-4 py-3), `community/admin/_components/GradeManager.tsx:12-13`(px-4 py-2.5), `community/admin/_components/BoardManager.tsx:30-33`(INPUT px-3 py-2, INPUT_LG px-4 py-3). 인라인 복사: `CommentSection.tsx:200, 250`, `_components/SearchBar.tsx:267`, `community/page.tsx:152`(px-4 py-2), `studio/consulting/page.tsx:112` 외 6곳. 패딩 4종.
  - 자리표시 글자 `placeholder-neutral-600` 은 neutral-900 위 2.29:1(a11y 표 값).
  - 구 입력 포커스 색 6종: `focus:border-teal-500`(`tools/calculator/_components/CalculatorClient.tsx:193` 외), `teal-600`(`saved/_components/SavedVideoList.tsx:130`), `teal-400/40`(인사이트 관리), `blue-500`(`payment/_components/InicisButton.tsx:105`), `emerald-500`(`KcpButton.tsx:104`), `red-500`(`admin/_components/AdminDashboard.tsx:494`). 바탕도 gray-700·800·900·`white/[0.03]` 4종.
  - 라벨·도움말·오류 문구 묶음(Field)이 없어 폼마다 라벨 굵기와 오류 표시 방식이 다르다(studio-11 의 폼 검증 문제와 같은 뿌리).
- 문제: 한 레시피를 고칠 때(예: 자리표시 대비, 포커스 링) 복사본 8곳을 모두 찾아야 한다. 구 화면은 입력에 포커스를 줄 때마다 틸·파랑·에메랄드·빨강 테두리가 섞여 나온다.
- 제안: `src/components/ui/field.tsx`
  ```ts
  export const INPUT = "w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 transition-colors focus:border-neutral-400 focus:outline-none disabled:opacity-40";
  export const INPUT_SM = INPUT.replace("px-4 py-3", "px-3 py-2"); // 표 안 편집 칸
  // Field: label "mb-2 block text-sm font-semibold text-white"
  //        hint  "mt-2 text-xs text-neutral-400"
  //        error "mt-2 text-xs text-red-400" + 입력에 "border-red-500/60" + aria-invalid
  ```
  - 지역 상수 3벌과 인라인 복사본을 INPUT/INPUT_SM 으로 교체. 구 입력 포커스는 전부 `focus:border-neutral-400`.
- 공수: S (변환 10개 파일). 구 테마 15개는 변환 때.

### system-10 · P3 · performance · 공수 S
**globals.css: 쓰지 않는 규칙과 레이어 밖 재정의, 읽히지 않는 설정 파일**

- 파일: `src/app/globals.css`, `tailwind.config.js`
- 근거(globals.css 의 아래 규칙은 빌드 CSS `.next/static/css/app/layout.css:6230-6358` 에 모두 레이어 밖으로 출력된다)
  - 미사용인데 모든 페이지에 실려 가는 규칙: `.bg-dashboard`(`globals.css:33-41`, 사용 0), `.card`(`:43-46`, 사용 0, 남색 `--card` 참조), `:root` 의 `--muted`·`--card`·`--card-border`·`--ring`(`:6-9`, 사용 0).
  - 자기 참조 토큰: `@theme inline { --font-sans: var(--font-sans); --font-mono: var(--font-mono); }`(`:15-16`) → 빌드 결과 `:root { --font-sans: var(--font-sans) }`(layout.css:78) 순환 참조로 무효(효과는 shell-02).
  - Tailwind 기본 유틸 재정의: `.line-clamp-2`(`:48-53`, v4 기본 제공과 중복), `.duration-300`(`:81-83`, 기본 유틸을 레이어 밖에서 덮음). 레이어 밖 규칙은 명시도와 무관하게 유틸을 이기므로 이후 `md:line-clamp-none` 같은 반응형 덮어쓰기가 먹지 않는다.
  - 유틸 대용 클래스: `.scrollbar-hide`(`:56-62`), `.animate-fadeIn`(`:65-71`), `.animate-in.slide-in-from-bottom-4`(`:74-80`, 2곳 사용)가 레이어 밖에 있어 `md:` 같은 변형을 붙일 수 없다.
  - 한 페이지 전용 규칙이 전역에: `[data-animate]`(`:88-103`, 52회/2파일), `.highlight-draw`(`:106-123`, 1회), `.stat-num`(`:126-129`), `.channel-card`·`.review-card`·`.feat-img`(`:132-157`, 스튜디오 1개 파일). `[data-animate] { opacity: 0 }` 은 스크립트가 돌기 전까지 내용을 숨긴다(studio-12), 동작 줄이기 설정 대응 없음(a11y-06).
  - `tailwind.config.js`: v4 는 `@config` 지시문이 있어야 JS 설정을 읽는데 globals.css 에 없다. `fontFamily.sans: ['Pretendard']` 는 적용되지 않는 죽은 설정이다.
- 문제: 지금은 대부분 무해하지만, 남색 토큰과 무효 설정이 "적용되는 값"처럼 보여 다음 작업자를 오도하고(Pretendard 가 설정돼 있다고 믿게 됨), 레이어 밖 재정의는 나중에 원인을 찾기 어려운 덮어쓰기 버그를 만든다.
- 제안(부록 A 의 파일 구조로)
  - 삭제: `.bg-dashboard`, `.card`, `:root` 구 토큰 4개, `@theme inline` 의 `--color-background/--color-foreground/--font-*` 자기 참조, `.line-clamp-2`, `.duration-300`, `tailwind.config.js`.
  - 이전: `.scrollbar-hide` → `@utility scrollbar-hide { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }`. 애니메이션 → `@theme { --animate-fade-in: …; --animate-slide-up: …; @keyframes … }` 로 등록하고 `animate-fade-in`, `animate-slide-up` 로 교체(사용 6곳).
  - 스튜디오 전용 규칙은 `@layer components` 안으로 옮기고 `@media (prefers-reduced-motion: no-preference)` 로 감싼다. `.channel-card`·`.review-card` 는 system-06 에 따라 제거.
- 공수: S (파일 2개 + 사용처 8곳)

### system-11 · P3 · visual-consistency · 공수 M
**아이콘과 로고가 복사본으로 흩어져 있다**

- 근거
  - 인라인 `<svg>` 153개/55파일. 선 굵기 10종(`strokeWidth` 2 45회, 1.8 19, 1.5 19, 2.4 5, 2.2 4, 1.6 4, 2.5 3, 5·4·3 각 2). 같은 검색 아이콘이 5벌이고 경로 데이터가 2종(`m21 21-4.35-4.35` 와 `M21 21l-6-6m2-5a7 7 0 11-14 0`), 크기는 w-3.5·w-5·w-7.
  - 로고 워드마크 6벌: `layout.tsx:310, 411`, `admin/page.tsx:36`, `mypage/page.tsx:69`, `ConfirmDialog.tsx:74`, `sign-in/_components/SignInForm.tsx:88`. 네비·푸터 로고 글자는 인라인 style 에 `fontFamily: "sans-serif"`(`layout.tsx:307, 408`).
  - 변환 화면에 남은 상자 안 아이콘: `sso-callback/error.tsx:24`(앰버 원형 상자), `insights/_components/PostRenderer.tsx:85`(빨강 원형 재생 버튼 + `shadow-2xl` + hover 확대), `studio/consulting/page.tsx:198`(studio-14 가 다룸).
- 문제: 같은 기능 아이콘이 화면마다 굵기와 모양이 미세하게 달라 정돈감이 떨어진다. 로고를 바꾸려면 6곳을 고쳐야 한다.
- 제안: `src/components/icons.tsx` 에 쓰는 아이콘만(검색·사용자·차트·저장·화살표·체크·닫기·잠금 등) `strokeWidth={1.75}`, `stroke="currentColor"`, 크기는 className(`size-4`·`size-5`·`size-7`)으로. 맨 아이콘 원칙 유지(상자 없이): 오류 화면 경고는 `size-7 text-amber-400` 맨 SVG, 인사이트 재생 표시는 원형 배경 없이 흰 삼각형 SVG. `src/components/logo.tsx` 하나(size sm·md)로 6곳 교체, 인라인 글꼴 지정 제거.
- 공수: M (55개 파일이지만 기계적 교체, 급하지 않음)

## 부록 A. 최소 토큰 집합 (globals.css 초안, 새 의존성 없음)

```css
@import "tailwindcss";

/* bibllab 토큰. 값은 소유자 확정 규칙 그대로. neutral 단계는 아래 역할표에 있는 것만 쓴다. */
@theme {
  --color-accent: #00E5A0;
  --color-accent-hover: #66FFCC;
  --color-kakao: #FEE500;
  --color-kakao-hover: #FDD835;
  --color-kakao-ink: #191919;

  --radius-control: 0.75rem; /* 버튼·입력 */
  --radius-card: 1rem;       /* 카드·모달 */

  --animate-fade-in: fade-in 0.2s ease-out both;
  --animate-slide-up: slide-up 0.3s ease-out both;
  @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } }
  @keyframes slide-up { from { opacity: 0; transform: translateY(1rem); } }
  /* --font-sans 는 shell-02 의 글꼴 로드 방식이 정해지면 실제 값으로 */
}

@layer base {
  html { color-scheme: dark; }                      /* shell-08 */
  body { @apply bg-black text-white; word-break: keep-all; } /* shell-01, shell-07 */
  h1, h2, h3 { text-wrap: balance; }
}

@utility scrollbar-hide {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

@layer components {
  /* 스튜디오 스크롤 연출 (system-10) */
  @media (prefers-reduced-motion: no-preference) {
    [data-animate] { /* 기존 규칙 */ }
  }
}
```

| 축 | 지금 | 표준 |
|---|---|---|
| 색 역할 | 액센트 리터럴 71회, 글자 회색 9단계, 무채색 테두리 13종, 무채색 배경 17종 | accent·kakao 토큰 + 역할표(바탕 1, 표면 2, 선 4, 글자 4, 의미색 3) |
| 글자 크기 | 20단계, 11px 이하 141회 | 9단계(xs~6xl), 하한 12px, 제목 4단계 레시피 |
| 굵기 | 6종 | regular·semibold·bold·black |
| 반경 | 9종(xl 264, full 184, lg 159, 2xl 123, rounded 66, md 30, sm 6, 3xl 2, [2px] 1) | control(xl)·card(2xl)·full·md(작은 태그) 4종 |
| 테두리 | 21색, 1px·2px | 1px, neutral-800 / 700 / hover 600 / focus 400 |
| 간격 | 섹션 9종, 카드 패딩 12종 | 섹션 py-16 md:py-24, 히어로 pt-20 md:pt-28, 앱 머리 py-8 md:py-12, 카드 p-4 / p-5 md:p-6 / p-8 md:p-10 |
| 컨테이너 | 8폭 + 풀폭 네비 | wide(screen-xl)·base(screen-lg)·narrow(3xl)·tight(sm), px-4 |
| 레이어 | z 12종 | 30 / 40 / 50 / 60 / 70 / 80 |
| 비활성 | 투명도 5단계 | opacity-40 하나 |

## 부록 B. 공용 프리미티브 후보와 도입 비용

위치는 `src/components/ui/`(기존 `src/components` 옆, shadcn 관례). 모두 클래스 문자열 함수 + 얇은 컴포넌트로 만들어 서버 컴포넌트에서도 쓰고 `<Link>`·`<a>` 에도 그대로 붙인다. 새 의존성 없음.

| 프리미티브 | 근거 발견 | 신규 파일 | 영향 파일(변환 / 구 테마) |
|---|---|---|---|
| buttonClass / Button | system-01 | 1 | 32 / 48 |
| CARD / Card | system-06 | 1 | 20 / 27 |
| Badge | system-08 | 1 | 11 / 24 |
| chipClass, Tabs | system-08 | 1 | 5 / 6 |
| INPUT / Field | system-09 | 1 | 10 / 15 |
| Container, SECTION | system-07 | 1 | 13 / 20 |
| SectionHeader (+ 두 톤 제목) | system-05 | 1 | 약 10 / 0 |
| Dialog 셸 | system-04 | 1 | 2 / 10 (a11y-04 와 함께) |
| icons, Logo | system-11 | 2 | 55 (P3) |

- 변환 완료 파일 중 하나라도 손대는 파일: 44개. 구 테마 파일: 60개(테마 변환 작업과 동시에 하면 추가 비용이 거의 없다).
- 권장 순서: ① 토큰(globals.css, shell-01·02 와 한 번에) → ② Button·INPUT·chip(재사용이 가장 많고 치환이 기계적) → ③ Card·Badge·Tabs → ④ SectionHeader·Container 로 공개 페이지 머리·폭 정리(home-10, studio-15 와 함께) → ⑤ 레이어 스케일·Dialog 셸(a11y-04 와 함께) → ⑥ 구 테마 화면 변환 때 프리미티브로 교체 → ⑦ 아이콘·로고.
- 불변 조건: 이 보고서의 제안은 모두 className·마크업·CSS 범위다. `SearchBar.tsx` 의 saveToHistory → router.push(count) 순서, 루트 레이아웃의 인증 미호출, 커뮤니티 게이트는 건드리지 않는다. 검색창 입력에 INPUT 을 적용할 때도 이벤트 핸들러와 제출 흐름은 그대로 둔다.
