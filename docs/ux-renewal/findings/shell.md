# 전역 셸 감사 (lane: shell)

대상: `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.js`, `postcss.config.mjs`, `next.config.mjs`, `src/app/_components/`(NavUser·NavigationLoader·SearchUsageBadge·KakaoChatButton·ConfirmDialog·ReferralApply·AnimationObserver·TrackVisit), `error.tsx`, `not-found.tsx`, `maintenance/page.tsx`
확인 방법: 코드 정독 + 지정 스크린샷 + 스크린샷 픽셀 측정 + 프로덕션 HTML·CSS·헤더 조회(curl) + 프로덕션 /pricing 브라우저 실측(1024px·820px, 계산 스타일·콘솔). 저장소 파일은 하나도 바꾸지 않았다.

완성도: 2 / 5

## 총평
데스크톱 1440px 에서 보이는 셸(블랙 네비, 화이트 CTA, neutral 푸터)은 소유자 규칙에 거의 맞지만, 그 아래 기반이 여러 군데 어긋나 있다. 전역 CSS 가 Tailwind v4 캐스케이드 레이어 밖에 있어 body 배경·글자색이 구 토큰으로 바뀌고(푸터 위 남색 띠), `@theme` 자기참조로 font-sans·font-mono 가 무효이며, Pretendard 는 로드되지 않아 한글이 OS 기본 글꼴(Windows 맑은 고딕은 900 굵기 없음)로 나온다. 네비는 768~1137px 폭에서 로고·버튼과 겹쳐 깨지고(실측), 현재 위치 표시가 없으며, 링크가 전부 `<a>` 라 이동마다 전체 새로고침과 레이아웃 이동이 반복된다. 포커스 표시·본문 건너뛰기·reduced-motion 같은 전역 접근성 기반이 없고, 카카오 SDK 는 integrity 해시 오류로 모든 페이지에서 차단된다. 대부분 globals.css 와 layout.tsx 몇 줄로 고치는 근본 원인이라, 셸을 먼저 고치면 47개 라우트에 한 번에 반영된다.

## 유지할 점
1. 루트 레이아웃이 auth()/cookies() 없이 정적 렌더를 지키고, 사용자 표시는 NavUser(클라이언트)로 분리한 구조 (layout.tsx:97-98, NavUser.tsx:14-33). 활성 메뉴 표시도 usePathname 클라이언트 컴포넌트로 이 원칙 안에서 해결한다.
2. 블랙 네비 + border-neutral-800 헤어라인 + 화이트 "시작하기" 단일 CTA (layout.tsx:302, NavUser.tsx:74). 소유자 규칙과 레퍼런스(Vercel nav-cta) 모두에 맞다.
3. 카카오 플로팅 버튼: 서버 컴포넌트(JS 0), aria-label, 브랜드색 #FEE500, 데스크톱 호버 라벨 (KakaoChatButton.tsx:7-24). 층(z)만 조정한다.
4. 404 화면의 텍스트 숫자 "404"(font-black neutral-700) + 화이트·neutral 버튼 2개 구성 (not-found.tsx:7-24). 오류·점검 화면을 이 틀로 통일한다.
5. NavigationLoader 의 3px 화이트 진행 바와 검색 메시지 오버레이, 10초 안전 타이머 (NavigationLoader.tsx:96-121, 144-154, 229-236). 예외 처리만 보강한다.
6. 모바일에서 모든 메뉴를 스크롤 없이 노출하려는 의도 (layout.tsx:360 주석). sticky 범위와 칩 모양만 손보고 의도는 유지한다.
7. 푸터에 사업자 정보·약관·환불정책·YouTube API 고지가 모두 있다 (layout.tsx:418-445). 내용은 유지하고 대비·서비스 링크만 보강한다.
8. CSP 가 font-src 'self' 를 허용하고 next.config.mjs:58 이 woff2 를 1년 캐시한다. Pretendard 를 CSP 변경 없이 자체 호스팅할 수 있는 바탕이다.

## 발견 목록 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| shell-01 | P0 | layout | 768~1137px 폭에서 데스크톱 네비가 로고·버튼과 겹치고 첫 메뉴가 화면 밖으로 잘림 | S |
| shell-02 | P1 | bug | 전역 다크 기반 깨짐: body 규칙이 유틸리티를 이겨 남색 띠·쿨톤 글자, color-scheme 없어 흰 스크롤바 | S |
| shell-03 | P1 | typography | 한글이 OS 기본 글꼴로 나오고 font-mono 는 동작하지 않음 | M |
| shell-04 | P1 | navigation-ia | 현재 위치 표시 없음, 메뉴 스타일 3종 혼재, 전부 `<a>` 라 이동마다 전체 새로고침 | M |
| shell-05 | P1 | mobile | 모바일 네비 2단 134px 전체 sticky, 2행 칩 모양 제각각, 작은 탭 영역 | S |
| shell-06 | P1 | typography | 전역 keep-all 부재로 모바일 헤드라인·푸터가 단어 중간에서 끊김 | S |
| shell-07 | P1 | accessibility | 전역 접근성 기반 부재: 포커스 표시 0, 건너뛰기 없음, reduced-motion 0, [data-animate] 가 JS 전까지 내용 숨김 | S |
| shell-08 | P1 | layout | 카카오 플로팅 버튼이 모든 모달 위에 뜨고 하단 시트·토스트·배너를 가림 | S |
| shell-09 | P1 | bug | 카카오 SDK 가 integrity 1글자 누락으로 전 페이지 차단, init 경쟁, 전역 로드 | S |
| shell-10 | P2 | layout | 네비만 풀폭이라 기준선 불일치, 우측 로그인 영역 폭 변화가 메뉴를 밀어냄 | S |
| shell-11 | P2 | theme-violation | 공유 이미지(OG) 틸·그라데이션, manifest 틸, 로고 마크 3종 | S |
| shell-12 | P2 | bug | 루트 canonical 상속으로 /incubating 이 홈을 canonical 로 선언, 아이콘 링크 중복 | S |
| shell-13 | P2 | navigation-ia | 푸터에 서비스 링크 없음, 사업자 정보 대비 2.5:1 이하 | S |
| shell-14 | P2 | interaction-feedback | 첨부 다운로드 시 진행 바 10초 멈춤, loading.tsx 0개 | S |
| shell-15 | P2 | content-clarity | 오류·점검 화면 이모지·쿨그레이, 404 보조 버튼이 빈 검색 화면으로 | S |

---

### shell-01 · P0 · layout · 공수 S
**768~1137px 폭에서 데스크톱 네비가 로고·우측 버튼과 겹치고 첫 메뉴가 화면 밖으로 잘림**
- 페이지: 전 페이지 (태블릿·좁은 데스크톱 창)
- 근거: `src/app/layout.tsx:303` (`overflow-x-auto scrollbar-hide`), `:315` (`hidden md:flex flex-1 justify-center whitespace-nowrap min-w-0`), `:347` (우측 `shrink-0`). 프로덕션 /pricing 브라우저 실측 1024px: 로고 12~105px, 첫 탭 48~188px, 마지막 탭 710~846px, 우측 묶음 797~997px. 820px: 첫 탭 -54~86px. 캡처 `tool-results/mcp-Claude_Browser-blob-1791286542161-gguql9.jpg`(1024), `mcp-Claude_Browser-blob-1791286576271-fmai3l.jpg`(820)
- 문제: 데스크톱 메뉴 6개(약 798px)가 md(768px)부터 켜지는데 로고·우측(남은 횟수·로그인·시작하기)까지 합치면 약 1,138px(로그인 상태는 약 970px)가 필요하다. 그보다 좁으면 justify-center 때문에 양쪽으로 넘쳐 "브랜드 인큐베이팅"이 로고 글자 위에 겹치고(820px 에선 왼쪽 54px 가 화면 밖), "유튜브 채널 대행 문의"는 "2회 남음"·"시작하기" 밑에 깔린다. 스크롤바도 숨겨져 넘친 사실을 알 수 없다. 아이패드 세로·가로(768~1133px)와 좁힌 데스크톱 창의 모든 페이지에서 보인다.
- 제안: 데스크톱 메뉴 기준을 md → xl(1280px)로 올린다. `:315` `hidden md:flex` → `hidden xl:flex`, 모바일 전용 요금제 링크 `:352` 와 2행 메뉴 `:361` 의 `md:hidden` → `xl:hidden`. 1279px 이하는 이미 있는 2행 메뉴를 쓰므로 새 디자인이 필요 없다. 보조로 `:315` 에 `justify-center-safe`(Tailwind 4.1.18 에 있음, `justify-content: safe center`)를 붙여 넘쳐도 왼쪽이 잘리지 않게 한다.

### shell-02 · P1 · bug · 공수 S
**전역 다크 기반 깨짐: body 규칙이 Tailwind 유틸리티를 이겨 푸터 위 64px 남색 띠·쿨톤 글자, color-scheme 이 없어 흰 스크롤바**
- 페이지: 전 페이지
- 근거: `src/app/globals.css:3-10, 19-30` (레이어 밖 :root 토큰·body 규칙), `src/app/layout.tsx:283` (`bg-neutral-950 text-white`), `:400` (푸터 `mt-16`). 프로덕션 CSS `0e9c1b50b5d122db.css` 에서 body 규칙이 utilities 레이어가 닫힌 직후 중괄호 깊이 0(레이어 밖). `home-desktop-02.png` y=228~291 픽셀 #0b0f17(정확히 64px), 그 아래 #262626 경계선, 푸터 #0a0a0a. `home-mobile-03.png` 같은 띠. 브라우저 실측(다크 모드 OS): body color rgb(237,237,237) 로 text-white 무시, html color-scheme "normal". `before-auth/mypage.jpg` x=1385~1399, `community-feed-top.jpg` x=1066~1079 밝은 스크롤바(트랙 #f6~#fc, 썸 #c6). 프로덕션 head 에 theme-color·color-scheme 메타 없음
- 문제: Tailwind v4 는 유틸리티를 `@layer utilities` 안에 넣고, globals.css 의 body 규칙은 레이어 밖에 있다. 캐스케이드 레이어 규칙상 레이어 밖 선언이 명시도와 상관없이 이기므로 body 의 bg-neutral-950·text-white 가 무시되고 구 토큰이 적용된다. --background 는 OS 라이트 모드일 때만 #0b0f17(남색)이라(:19-24 다크 블록은 #0a0a0a) 라이트 모드 방문자에게만 푸터 mt-16 틈 64px 가 남색으로 보이고, 기본 글자색은 푸른 기가 도는 #e7eaf0 이 된다(쿨그레이 금지 위반). color-scheme 이 없어 스크롤바·select·날짜 선택 같은 네이티브 컨트롤이 라이트 스타일이고, theme-color 도 없다.
- 제안: (1) globals.css 의 :root 토큰과 body 규칙을 `@layer base { ... }` 로 감싼다. 그러면 body 클래스가 다시 이긴다. (2) body 클래스를 `bg-black text-white` 로(본문 bg-black 과 같아 64px 틈이 보이지 않음), :19-24 prefers-color-scheme 블록과 쓰이지 않는 구 토큰(--card·--card-border·--ring·--muted, .card, .bg-dashboard: src 사용처 0건, tmklab-site 는 자체 :root 에 --muted 를 따로 정의)을 지운다. (3) base 레이어 :root 에 `color-scheme: dark;`, layout.tsx 에 `export const viewport = { themeColor: "#000000", colorScheme: "dark" }` 추가. cookies/auth 를 쓰지 않으므로 정적 렌더 유지.

### shell-03 · P1 · typography · 공수 M
**한글이 OS 기본 글꼴로 나오고 font-mono 는 동작하지 않음 (Pretendard 미로딩, Inter 클래스가 글꼴 스택을 덮음, @theme 자기참조)**
- 페이지: 전 페이지
- 근거: `src/app/layout.tsx:2, 12, 283` (Inter latin 만, body 에 inter.className). `src/app/globals.css:29` (Pretendard 스택, 로드 코드 없음, public 에 폰트 파일 0개). `globals.css:12-17` (`--font-sans: var(--font-sans); --font-mono: var(--font-mono);`). 프로덕션 CSS: `--font-mono:var(--font-mono)`, `.font-mono{font-family:var(--font-mono)}`, `.__className_f367f3{font-family:__Inter_f367f3,__Inter_Fallback_f367f3}`. 브라우저 실측: body·h1 font-family "__Inter_f367f3, __Inter_Fallback_f367f3", `.font-mono` 요소도 같은 값, :root --font-sans 계산값 빈 문자열, document.fonts 에 Inter 만. `tailwind.config.js:9-11` (@config 지시어가 없어 v4 가 읽지 않음, tailwindcss 4.1.18). font-mono 사용처 18곳: `search/_components/VideoCard.tsx:147, 224`(재생시간), `mypage/_components/ReferralSection.tsx:60`(추천 코드), `insights/admin/_components/PostEditor.tsx`(편집기) 등. `home-desktop-01.png` 통계 줄 "YouTube 데이터 수집"(라틴 Inter + 한글 OS 글꼴 혼용)
- 문제: next/font 의 Inter 클래스(명시도 0,1,0)가 body 글꼴 스택(0,0,1)을 이겨 Pretendard 스택은 한 번도 적용되지 않고 파일도 없다. Inter 는 latin 서브셋이라 한글은 브라우저 기본 글꼴로 떨어진다: macOS·iOS Apple SD Gothic Neo, Windows 맑은 고딕, 안드로이드 Noto Sans CJK. 맑은 고딕에는 900 굵기가 없어 Windows 에서는 font-black 두 톤 헤드라인이 Bold 로 뭉개지고, 혼용 문장은 라틴과 한글의 글자 높이·굵기가 어긋난다. `@theme inline` 자기참조로 --font-sans·--font-mono 가 순환 참조가 되어 무효이고, font-mono 18곳이 고정폭이 아닌 Inter 로 나온다. tailwind.config.js 는 죽은 파일이다.
- 제안: CSP(font-src 'self', style-src 'self')를 바꾸지 않고 같은 출처로 싣는다. 권장: Pretendard 배포본의 dynamic-subset(unicode-range 로 나뉜 woff2 + CSS)을 `public/fonts/pretendard/` 에 두고 layout.tsx head 에 `<link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css">` 한 줄(쓰인 글자 조각만 받음, middleware matcher 가 css·woff2 를 건너뜀, next.config.mjs:58 이 woff2 1년 캐시, 버전은 폴더명에). 의존성 추가가 괜찮다면 `pretendard` 패키지의 같은 CSS 를 layout 에서 import 해도 /_next/static/media 로 같은 출처가 된다. 이어서 (1) Inter import 와 inter.className 삭제(Pretendard 라틴이 Inter 기반이라 숫자·영문 인상 유지, 48KB 프리로드 1개 감소), (2) globals.css 를 `@theme { --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }` 로 고치고(inline 제거) body 의 font-family 줄 삭제, (3) tailwind.config.js 삭제.

### shell-04 · P1 · navigation-ia · 공수 M
**네비에 현재 위치 표시가 없고, 메뉴 스타일이 세 가지로 섞여 있으며, 모든 링크가 `<a>` 라 이동마다 전체 새로고침**
- 페이지: 전 페이지
- 근거: `src/app/layout.tsx:457-528` (NavTab: 경로 비교 없음, 강조 필·회색+아이콘·에메랄드 세 갈래), `:317-343` (아이콘은 6개 중 4개만), `:305, 350, 363-391, 406, 429-432` (모두 `<a href>`), `NavUser.tsx:71, 74` (로그인·시작하기도 `<a>`). `pricing-desktop-01.png` (/pricing 에서 "요금제"가 홈과 똑같은 회색). `before-auth/community-feed-top.jpg` (/community 에서 "커뮤니티&자료"가 다른 두 필과 구분 안 됨). `SearchUsageBadge.tsx:16-21` (마운트 때 한 번만 조회). 참고 `research/awesome-design-md/vercel.DESIGN.md:155-159` (nav-link 한 가지 스타일)
- 문제: 6개 중 3개는 회색 필+아이콘, "요금제"는 비활성처럼 보이는 회색 글자+아이콘, 컨설팅·대행 2개는 아이콘 없는 에메랄드 글자다. 절반이 "강조"라 강조가 의미를 잃고, 지금 어느 섹션인지는 어떤 페이지에서도 알 수 없다(aria-current 없음). 링크가 `<a>` 라 메뉴를 누를 때마다 문서를 다시 받고 하이드레이션하며, 그때마다 NavUser 스켈레톤 교체와 /api/usage 재조회가 반복되고 prefetch 이점도 없다.
- 제안: NavTab 을 작은 클라이언트 컴포넌트(NavLink)로 분리해 usePathname 으로 활성 여부를 계산한다(루트 레이아웃은 서버·정적 그대로, 불변 조건 2 안전). 스타일 하나로: 기본 `text-neutral-400 hover:text-white`, 활성 `text-white` + 아래 2px 흰 헤어라인(또는 bg-white/[0.06] 필을 활성에만), `aria-current="page"`. 컨설팅·대행은 소유자가 정한 에메랄드 글자 유지, 활성일 때 #66FFCC + 헤어라인. 아이콘은 모두 빼는 쪽을 권장. 링크는 next/link, 긴 페이지(/studio/class/consulting 약 57,000px)는 `prefetch={false}`. 레이아웃이 유지되므로 SearchUsageBadge 는 pathname 변경 시 재조회해 검색 뒤 낡은 값을 보이지 않게 한다(표시용 GET, 검색 누적 로직과 무관). /studio 튕김은 studio-01 에서 다룸.

### shell-05 · P1 · mobile · 공수 S
**모바일 네비 2단 134px 전체가 sticky 라 화면 16~20% 를 상시 차지, 2행 칩 모양 제각각, 작은 탭 영역**
- 페이지: 전 페이지(모바일)
- 근거: `src/app/layout.tsx:302` (nav 전체 sticky), `:361-394` (2행이 nav 안), `:363-380` (3개는 bg-white/[0.06] 칩) vs `:381-392` (2개는 배경 없는 글자), `:350-356` (요금제 `text-xs px-2 py-1`, 높이 24px). `home-mobile-01.png` 픽셀 측정: 1행 56px + 경계 1px + 2행 76px + 경계 1px = 134px, 1행 #000 과 2행 #0a0a0a 배경이 다름. 390×844 기준 15.9%, iOS Safari 툴바 제외 시 약 20%
- 문제: 스크롤해도 2행 메뉴까지 붙어 있어 작은 화면의 본문 공간을 크게 잃는다. 2행 앞 3개는 칩, 뒤 2개는 맨 글자라 두 번째 줄이 덜 만든 것처럼 보이고, 1행 요금제·로그인은 높이 24~28px 로 탭이 어렵다.
- 제안: "스크롤 없이 모두 노출"(:360 주석) 의도는 유지하고 sticky 범위만 줄인다. nav 를 `<header>` 로 감싸 1행(56px)만 sticky, 2행은 일반 흐름(페이지 맨 위에선 지금처럼 다 보이고 스크롤하면 사라짐). 2행 5개를 같은 칩(`px-3 py-2 rounded-md bg-white/[0.06] text-xs font-semibold`)으로 통일하고 에메랄드 2개는 글자색만 다르게. 1행 텍스트 링크는 `py-2.5` 이상으로 높이 확보, 1·2행 배경은 bg-black 하나로. shell-01 대로 기준을 xl 로 올리면 태블릿도 이 구조를 쓴다.

### shell-06 · P1 · typography · 공수 S
**전역 keep-all 이 없어 모바일 헤드라인·통계·푸터가 단어 중간에서 끊김**
- 페이지: 전 페이지(모바일)
- 근거: src 전체에 `break-keep`·`keep-all`·`word-break` 0건. `home-mobile-01.png` ("파 / 악하세요", "로그인 후 무료 2회 가 / 능"). `home-mobile-03.png` 푸터 ("2023-수원권 / 선-1549", "YouTube 서 / 비스 약관", "서비스 / 입니다"). studio-09 와 같은 원인
- 문제: 한국어 기본 줄바꿈이 글자 단위라 좁은 화면에서 어절이 쪼개지고, 첫 화면의 가장 큰 글자에서 깨져 누구나 본다. 페이지마다 break-keep 을 붙이면 47개 라우트에 흩어진다.
- 제안: globals.css base 레이어 body 에 `word-break: keep-all; overflow-wrap: break-word;` 두 줄. keep-all 은 공백에서만 줄을 바꾸고, overflow-wrap 이 긴 이메일·URL 만 넘칠 때 끊는다. base 레이어라 필요한 곳은 `break-all` 유틸리티로 덮인다(threads/page.tsx:92 의 기존 break-all 유지).

### shell-07 · P1 · accessibility · 공수 S
**전역 접근성 기반 부재: 포커스 표시 0, 본문 건너뛰기 없음, reduced-motion 0, [data-animate] 가 JS 전까지 내용을 숨김**
- 페이지: 전 페이지, /studio
- 근거: focus-visible 0건, outline-none 68건. 건너뛰기 링크 없음(layout.tsx:300-302). prefers-reduced-motion·motion-reduce 0건. `globals.css:88-103` (`[data-animate]{opacity:0}` 이 기본, JS 가 .in-view 를 붙여야 보임). `studio/page.tsx:283-327` (히어로 배지·h1 두 줄·설명·CTA·우측 카드 모두 data-animate, data-delay 최대 500ms), `:272`. `AnimationObserver.tsx:10-38` (마운트 때 한 번 querySelectorAll). `globals.css:131-157` (호버 이동·확대). `NavUser.tsx:36` (animate-pulse). 참고 `research/uiux-pro-max/data/motion.csv:5` (Scroll Reveal: y 8~16px, reduced-motion 이면 최종 상태 즉시, 무 JS 대비 없이 숨기지 말 것)
- 문제: 키보드 사용자는 포커스 위치를 볼 수 없고, 매 페이지 네비 링크 10여 개를 Tab 으로 지나야 본문에 닿는다(전체 새로고침이라 매번 반복). 움직임 줄이기 설정 사용자에게도 32~40px 슬라이드·호버 확대가 나온다. /studio 는 히어로 h1 과 CTA 까지 opacity 0 으로 시작해 JS 다운로드·하이드레이션·지연이 끝나야 보인다. 느린 모바일에서는 첫 화면이 빈 채로 기다리고(LCP 지연) JS 가 실패하면 영영 안 보인다.
- 제안: globals.css 에 세 덩어리. (1) 레이어 밖(그래야 outline-none 유틸리티 68곳을 이김) `:where(a, button, [role="button"], summary, select, [tabindex]):focus-visible { outline: 2px solid #00E5A0; outline-offset: 2px; }` (액센트 1색, 글로우 아님, Linear 도 액센트를 포커스 링에 씀). 입력창은 기존 focus 테두리 유지. (2) body 첫 요소로 `<a href="#main" class="sr-only focus:not-sr-only ...">본문 바로가기</a>`, children 을 `<div id="main">` 으로 감쌈. (3) 첫 화면 요소(히어로)는 data-animate 를 빼거나 JS 없이 도는 CSS 키프레임으로 바꾸고, 나머지는 head 인라인 스크립트가 html 에 붙인 `js` 클래스 아래에서만 숨김(`.js [data-animate]{opacity:0}`). `@media (prefers-reduced-motion: reduce)` 에서 [data-animate] 즉시 표시, 카드 호버 transform 제거, 장식 애니메이션 끔(로딩 스피너는 유지). 이동 거리는 12~16px 로 줄이는 것을 검토.

### shell-08 · P1 · layout · 공수 S
**카카오 플로팅 버튼이 모든 모달·딤 위에 뜨고, 모바일 하단 시트 버튼·수집 토스트 닫기·카카오 채널 배너를 가림**
- 페이지: /, /search, /mypage, /admin 등
- 근거: `KakaoChatButton.tsx:13` (`fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50`, 56px). `layout.tsx:396-398` ({children} 뒤에 렌더 → 같은 z-50 이면 나중 요소가 위). 같은 z-50 오버레이: `page.tsx:92`(홈 로그인 유도 모달), `search/_components/LimitModal.tsx:70, 122`(모바일 `items-end pb-6` 하단 시트, 맨 아래 :182-185 약관 동의 문구·링크 줄), `VideoModal.tsx:202`, `VideoCard.tsx:39`, `mypage/_components/CancelSubscriptionButton.tsx:53`, `DeleteAccountButton.tsx:35`, `admin/_components/AdminDashboard.tsx:424`. `SearchResultList.tsx:545` (수집 완료 토스트 `fixed bottom-6 right-6 z-50`, 오른쪽 끝이 닫기 ✕). `KakaoChannelBanner.tsx:43` (`bottom-4 right-4 sm:bottom-6 sm:right-6 z-40`, 맨 아래 전폭 "채널 추가하기"). z-index 값이 z-10~z-[10000] 12종
- 문제: 노란 원형 버튼이 모달의 어두운 배경 위에 홀로 밝게 떠 집중을 깨고, 모바일 한도 초과 하단 시트에서는 맨 아래 약관 동의 문구(이용약관·개인정보처리방침 링크) 줄의 오른쪽 끝을 덮어 그 자리를 누르면 카카오 채팅이 열린다. 수집 완료 토스트의 닫기 ✕ 는 버튼 밑에 깔리고, 카카오 로그인 사용자에게 뜨는 채널 추가 배너는 노란 카드 위에 노란 버튼이 겹친다. 전역 z 기준이 없어 생긴 일이다.
- 제안: z 층을 고정한다: 본문 0~30, 플로팅(카카오) 40, 네비·모달 50, 로딩 오버레이 9998, 진행 바 9999, 확인창 10000. 카카오 버튼을 `z-40` 으로 내리면 8개 모달이 덮는다. 같은 모서리를 쓰는 토스트·배너는 z-50 으로 올리거나 `bottom-24` 로 버튼 위에 쌓는다(클래스만 변경). auth-05/auth-11 의 공용 모달 셸이 이 층을 쓴다.

### shell-09 · P1 · bug · 공수 S
**카카오 SDK 가 모든 페이지에서 차단됨(integrity 1글자 누락), 해시를 고쳐도 init 이 경쟁 상태, 쓰지 않는 페이지에도 로드**
- 페이지: 전 페이지, /search 공유
- 근거: `layout.tsx:279` (integrity 63자, 끝 `a` 누락). 프로덕션 콘솔 "Failed to find a valid digest in the 'integrity' attribute ... computed SHA-384 integrity 'DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'. The resource has been blocked." (로드마다), 실측 `typeof window.Kakao` = "undefined". `layout.tsx:291-299` (body 인라인 init 은 async SDK 보다 먼저 실행될 수 있음). `search/_components/ShareButton.tsx:37-40` (미초기화면 조용히 링크 복사). SDK 사용처는 ShareButton 하나
- 문제: 카카오톡 공유 버튼이 늘 링크 복사로 동작하고 모든 페이지 콘솔에 오류가 남는다. 해시만 고쳐도 인라인 init 이 async 스크립트 도착 전에 실행되면 init 을 건너뛰어 같은 증상이 남는다(캐시 상태에 따른 경쟁). 쓰지 않는 46개 라우트도 SDK 를 받는다.
- 제안: head 의 script 와 body 인라인 init 을 지우고 ShareButton 에서만 next/script 로 싣는다: `src=".../kakao_js_sdk/2.7.4/kakao.min.js"`, `integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"`, `crossOrigin="anonymous"`, `strategy="lazyOnload"`, `onLoad` 에서 `Kakao.isInitialized()` 확인 후 init. CSP script-src 에 t1.kakaocdn.net 이 이미 있어 변경 없음. 공유 인자(sendDefault)는 그대로.

### shell-10 · P2 · layout · 공수 S
**네비만 풀폭이라 좌우 기준선이 페이지·푸터와 어긋나고, 우측 로그인 영역 폭 변화가 가운데 메뉴를 밀어냄**
- 페이지: 전 페이지
- 근거: `layout.tsx:303` (`w-full px-3`), `:402` (푸터 `max-w-screen-xl mx-auto px-4`), `community/layout.tsx:48, 64, 75` 등 12개 파일이 max-w-screen-xl. `home-desktop-01.png`(네비 로고 x=12) vs `home-desktop-02.png`(푸터 로고 x=96, 링크 x≈1344). `layout.tsx:315` (가운데 flex-1 justify-center), `:347`. `NavUser.tsx:35-37` (32px 펄스 스켈레톤) → `:69-77` (로그인·시작하기 약 130px). `SearchUsageBadge.tsx:23` (조회 전 null, 조회 후 약 70px 배지 등장). 참고 `research/awesome-design-md/linear.app.DESIGN.md:359-361` (콘텐츠 최대 폭 약 1280px)
- 문제: 1440px 에서 네비 로고는 12px, 푸터 로고·커뮤니티 본문은 96px 에서 시작해 위아래 선이 84px 어긋난다. 가운데 메뉴는 남은 공간 기준 가운데 정렬이라 우측이 32px → 약 130px → 약 200px 로 커질 때마다 두 번 왼쪽으로 움직인다. 전체 새로고침이라 메뉴를 누를 때마다 반복되는 레이아웃 이동이다.
- 제안: 네비 안쪽 컨테이너를 `max-w-screen-xl mx-auto px-4` 로 바꿔 푸터·커뮤니티·스튜디오와 같은 선에 맞춘다. 메뉴를 로고 옆 좌측 정렬(Vercel·Linear 관례)로 두면 우측 폭이 바뀌어도 움직이지 않는다. 가운데 정렬을 유지한다면 우측 묶음에 고정 최소 폭(`min-w-[200px] justify-end`), 스켈레톤은 버튼 두 개 크기의 정적 자리(펄스 없이), 배지는 null 대신 같은 폭의 투명 자리를 먼저 그린다.

### shell-11 · P2 · theme-violation · 공수 S
**전역 브랜드 자산이 구 테마·제각각: 공유 이미지(OG)는 틸·남색 그라데이션, manifest 틸, 로고 마크 3종**
- 페이지: 전 페이지(링크 미리보기, 탭 아이콘, 확인창, 마이페이지)
- 근거: `opengraph-image.tsx:18` (`linear-gradient(135deg, #030712, #0f172a, #030712)`), `:45` ("lab" #2dd4bf 틸), `:48, 51` (#9ca3af·#6b7280). 프로덕션 head `og:image = https://bibllab.com/opengraph-image?...` (파일 규칙이 layout.tsx:41-48 의 /og-image.png 설정을 덮음), twitter:image 는 /og-image.png 로 서로 다름. `manifest.ts:10-11` (background #030712, theme_color #2dd4bf). 로고: `layout.tsx:307, 408` (B, 인라인 fontFamily "sans-serif" → OS 마다 다른 글자꼴), `sign-in/_components/SignInForm.tsx:85` (B, 다른 글꼴 스택), `ConfirmDialog.tsx:67-71` (▶ 재생 아이콘 마크), `before-auth/mypage.jpg` (▶ + 틸 "lab" 이 네비의 B 마크와 한 화면에 공존). `public/favicon.svg` (rx=8 둥근 사각) vs `icon.tsx:13` (원형)
- 문제: 카카오톡·슬랙에 링크를 붙이면 보이는 미리보기가 소유자가 금지한 그라데이션·틸이라 사이트와 첫인상이 다르다. 홈 화면에 추가하면 상단이 틸로 칠해진다. 같은 화면에 B 마크와 ▶ 마크가 함께 보이고, B 글자는 OS 마다 다른 글꼴이다.
- 제안: opengraph-image.tsx 를 순수 블랙 배경, 흰 "bibl" + neutral-400 "lab"(네비와 동일), 그라데이션 없음으로 바꾼다(또는 이 파일을 지워 /og-image.png 설정이 쓰이게 하고 그 이미지를 같은 규칙으로 교체). manifest 색은 #000000. 로고는 `<Logo size>` 컴포넌트 하나로 네비·푸터·확인창·로그인에서 공유하고, B 글자는 인라인 글꼴 대신 사이트 글꼴(shell-03 Pretendard 900)을 쓴다. icon.tsx 모양을 favicon.svg 와 같은 둥근 사각으로 맞춘다.

### shell-12 · P2 · bug · 공수 S
**루트 레이아웃의 canonical 이 하위 페이지로 상속되어 /incubating 이 홈을 canonical 로 선언, 아이콘 링크 중복**
- 페이지: /incubating (와 자체 canonical 이 없는 공개 페이지)
- 근거: `layout.tsx:56-58` (`alternates.canonical: "https://bibllab.com"`). 자체 canonical 이 있는 파일은 14개(about, channels, my-channel, pricing, privacy, refund, search, studio, studio/class/consulting, studio/consulting, terms, threads, tools/calculator, trend-search). 프로덕션 /incubating: `<link rel="canonical" href="https://bibllab.com">` + robots "index, follow". 프로덕션 head 에 favicon.svg·/icon·apple-icon 링크가 2번씩(`layout.tsx:278, 280-281` 수동 + `:70-77` metadata.icons). 404 응답에 robots 메타가 "noindex" 와 "index, follow" 두 개. 참고: 프로덕션 sitemap.xml 에도 /incubating 이 없음(sitemap.ts 는 이 영역 밖)
- 문제: 상단 메뉴 첫 항목인 공개 모집 페이지가 검색엔진에 "원본은 홈"이라고 알려 검색 노출에서 홈과 합쳐지거나 빠질 수 있다. 앞으로 canonical 을 잊은 새 페이지도 전부 홈을 가리킨다.
- 제안: 최소 수정은 `incubating/page.tsx` metadata 에 `alternates: { canonical: "https://bibllab.com/incubating" }` 추가. 근본 수정은 루트에서 canonical 을 빼고 홈 전용으로 두기(src/app/page.tsx 는 클라이언트라 서버 래퍼에 metadata). layout.tsx:278, 280-281 수동 아이콘 링크 3줄 삭제.

### shell-13 · P2 · navigation-ia · 공수 S
**푸터에 서비스 링크가 없고, 사업자 정보 글자 대비가 2.5:1 이하**
- 페이지: 전 페이지
- 근거: `layout.tsx:400-447` (브랜드·사업자 정보·약관 3개+mailto 만, 서비스 링크 0). `:415` (태그라인 em-dash). `:419-424` text-neutral-600(#525252) on #0a0a0a = 2.53:1, `:436` text-neutral-700(#404040) = 1.91:1, `:429-432` neutral-500 = 4.18:1 (모두 12px, WCAG AA 4.5:1 미달). `:428` 링크 `flex-col gap-2 text-xs` (높이 16px). `home-desktop-02.png`, `home-mobile-03.png`
- 문제: 페이지 끝까지 읽은 사람이 다음으로 갈 곳이 약관뿐이다. shell-05 대로 모바일 2행 메뉴를 sticky 밖으로 빼면 맨 아래에서 다른 섹션으로 가려면 다시 올라가야 한다. 전자상거래법상 표시해야 하는 사업자 정보와 YouTube API 고지가 거의 안 보이는 회색이고, 카카오 채널 문의 경로도 푸터에 없다.
- 제안: 사업자 정보 왼쪽에 "서비스" 열 추가: 브랜드 인큐베이팅, 커뮤니티&자료, 유튜브 트렌드 서치, 팀비블 1:1 유튜브 컨설팅, 유튜브 채널 대행 문의, 요금제, 비블랩 소개(/about). 상단 메뉴 라벨 재사용. 읽어야 하는 정보는 neutral-400(7.66:1), 링크는 `py-1.5` 로 탭 높이 확보, 문의하기 옆에 카카오톡 채널 링크. 태그라인의 em-dash 는 "·" 로(문장 유지, 기호만).

### shell-14 · P2 · interaction-feedback · 공수 S
**첨부파일 다운로드를 누르면 상단 진행 바가 10초간 멈춰 있고, 서버 렌더 페이지에 loading 화면이 하나도 없음**
- 페이지: /community/[board]/[id], /search, /trend-search, /community
- 근거: `NavigationLoader.tsx:158-185` (내부 링크 클릭이면 무조건 showLoading, /api/·download 예외 없음), `:147-153` (10초 안전 타이머), `:34-48` (경로가 바뀌어야만 숨김). `community/[board]/[id]/_components/AttachmentList.tsx:46-47, 67-68` (`<a href="/api/community/download/...">`). `api/community/download/[id]/route.ts:46-48, 60` (`createSignedUrl(..., { download })` 후 302, Content-Disposition attachment 라 페이지 이동 없음). `find src -name loading.tsx` 0건. `NavigationLoader.tsx:110-120` (빛 번짐·원형 글로우 주석과 투명 span 잔재)
- 문제: "원본 저장"이나 첨부파일을 누르면 파일은 받아지지만 페이지는 그대로라 흰 진행 바가 92% 에서 10초간 멈춘 채 로딩 중처럼 보인다. 요청마다 서버에서 그리는 페이지(검색 결과, 트렌드 서치, 커뮤니티 게이트)에 loading.tsx 가 없어 응답이 올 때까지 이전 화면이 멈춰 있다.
- 제안: 클릭 인터셉터 예외에 `href.startsWith("/api/") || anchor.hasAttribute("download")` 추가, AttachmentList 링크에 download 속성(다운로드 로직 동일). search·trend-search·community 에 neutral 스켈레톤 loading.tsx(카드 자리 bg-neutral-900, 펄스 없이). 진행 바의 투명 span 과 "글로우" 주석 삭제.

### shell-15 · P2 · content-clarity · 공수 S
**오류·점검 화면이 이모지·쿨그레이를 쓰고, 404 보조 버튼은 빈 검색 화면으로 보냄**
- 페이지: 오류 화면, 404, /maintenance
- 근거: `error.tsx:19` (⚠️ text-5xl), `:17` (min-h-screen). `not-found.tsx:7` ("404" 텍스트 숫자, 좋은 패턴), `:19-24` (보조 버튼 "영상 찾기" → /search, 검색어 없이 열면 "검색 결과가 없어요": home-14), `:5` (min-h-screen). 프로덕션 404 탭 제목이 홈 제목 그대로. `maintenance/page.tsx:7, 13, 18` (bg-gray-950·text-gray-400·bg-gray-900·text-gray-500), `:9` (🔧), `:2` (title "시스템 점검 중 | bibl lab" + 템플릿 → "시스템 점검 중 | bibl lab | 비블랩 (bibl lab)"), `:19` (이메일 텍스트만). `middleware.ts:47-54` (점검 모드는 모든 경로를 /maintenance 로 rewrite, 루트 레이아웃이라 전체 네비·카카오 버튼이 함께 보임)
- 문제: 세 화면이 서로 다른 시각 언어(이모지 둘, 텍스트 숫자 하나)를 쓰고 점검 화면만 청색 기 회색이다. min-h-screen 이 네비·푸터 레이아웃 안에 있어 짧은 안내 아래로 화면 한 장 높이가 비고 그 끝에 남색 띠(shell-02)가 보인다. 404 에서 "영상 찾기"를 누르면 또 빈 상태를 만나고, 점검 중에는 네비 메뉴가 살아 있어 눌러도 같은 화면만 나온다.
- 제안: not-found 틀(큰 텍스트 숫자 font-black neutral-700 + 제목 + 설명 + 화이트/neutral 버튼 2개)로 통일: 오류는 "ERROR" 텍스트, 점검은 "점검 중" 텍스트, 이모지 제거, gray- → neutral-, 높이 min-h-[60vh]. 404 보조 버튼은 /trend-search 또는 /community. not-found 에 `export const metadata = { title: "페이지를 찾을 수 없어요" }`(Next 14.2 는 not-found metadata 를 처리함), maintenance title 은 "시스템 점검 중"만. 점검 문의는 mailto 링크 + 카카오톡 채널 링크. error.tsx 의 홈 링크는 오류 복구에 전체 새로고침이 맞으므로 `<a>` 유지.

---
참고(중복 회피): ConfirmDialog 의 Enter 즉시 확인(삭제 포함)·dialog 역할·포커스 가둠은 auth-10·auth-11, /studio 튕김은 studio-01, /search 빈 상태는 home-14 에서 다룬다. Tailwind v4 자동 소스 감지가 src 밖(public/*.html, scripts)에서 끌어온 유틸리티는 6개(약 330B)뿐이라 문제 아님.
