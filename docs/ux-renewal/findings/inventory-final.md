# 코드 재고 조사 · 최종 디자인(레이아웃 F + 모노크롬 실버) 적용 전

조사일 2026-10-08 · 기준 커밋 `73b1743` · 문서만 작성(src 수정 0, 쿼터 차감 화면 미방문)
대상: `src/app` 전체 page.tsx 66개, 공유 파일, `docs/ux-renewal` 로드맵, 불변 조건.
새 디자인 근거: `docs/ux-renewal/design-final/notes.md`(팔레트 M), `design-final/layout-F/rationale.md`, `design-final/silver/DESIGN-notes.md`, 토큰 원본 `design-final/theme-m.css`.

---

## 0. 한눈 요약

1. 화면 66개 중 실제 리뉴얼 대상은 **사용자 화면 약 40개**(리다이렉트 전용 8개, ux-preview 17개, 관리자 6개 제외).
2. 색 사용(사용자 화면, api 제외, .ts·.tsx 206개): `neutral-*` 1,082 · `gray/slate/zinc/stone` 788 · teal/emerald/에메랄드 리터럴 290 · 기타 채도색 379 · 그라데이션·블러·글로우 17. `check-theme --all` 은 ERROR 1,495 · WARN 448.
3. **실버로 바꿔도 그래파이트(바탕·면·선) 값은 지금 neutral 과 같다.** 실제로 색이 바뀌는 곳은 액센트(에메랄드 → 흰색), 본문·보조 글자 두 단계(#D4D4D4 → #C6C6C6, #A1A1A1 → #949494), 체크박스 테두리, 기능 색뿐이다.
4. **토큰 한 줄로 전파되는 범위가 작다.** `text-accent`·`border-accent` 같은 토큰 클래스는 R04 부품 3파일(badge·field·tabs)에만 5회 쓰이고, 에메랄드는 27파일 75곳에 리터럴(`#00E5A0`·`#66FFCC`·`rgba(0,229,160,x)`)로 박혀 있다. R04 레시피(buttonClass 등)를 쓰는 화면도 8파일뿐이다. 즉 globals.css 만 고치면 포커스 링·글자 선택·R04 부품만 바뀌고, 나머지는 파일별 치환이 필요하다.
5. `theme-m.css` 의 `--color-*: initial;`(기본 팔레트 비우기)은 **지금 사이트에 그대로 넣으면 안 된다.** neutral·white·black·gray 안전망까지 지워져 사이트 전체가 깨진다. 마지막 단계(R22)에서 전 화면 변환 뒤에만 고려.
6. 남은 로드맵 R06a~R23(21개)은 구조·접근성·로직 보호 기준은 거의 그대로 유효하고, **"에메랄드"·"화이트 필"·"레드 강조"·"인기 키워드"·홈 구조(R07·R23)** 를 언급한 부분은 고쳐야 한다(3장).

---

## 1. 화면 목록 (page.tsx 66개)

열 설명
- 로그인: `MW`=middleware 보호 경로(`/mypage`·`/admin`·`/saved`·`/payment`), `페이지`=page 안 redirect·게이트, `한도`=로그인 없이 열리나 횟수 차감, `-`=공개
- 줄 수: page.tsx + 같은 폴더의 .tsx + `_components/**` 합계(대략)
- 색 횟수: grep 결과. N=`neutral-\d`, G=`gray|slate|zinc|stone-\d`, E=`teal|emerald-\d`·`00e5a0`·`66ffcc`·`0,229,160`, O=red·orange·amber·yellow·green·cyan·sky·blue·purple·pink 등, Grad=bg-gradient·from-·blur-
- 렌더: ○ 정적 · ● ISR · ƒ 동적(파일의 export 와 auth 호출로 판단)

### 1.1 사용자 화면 (리뉴얼 범위)

| 경로 | 로그인 | 주요 파일 | 줄 | N | G | E | O | Grad | 렌더·비고 | 로드맵 |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` (page.tsx 단독) | - | `page.tsx`, `_components/LandingStats.tsx`, `SearchBar`(홈 검색 로직 보호) | 304 | 38 | 0 | 2 | 0 | 0 | client 페이지. saveToHistory·trySearch 보호 | R07·R23 |
| `/search` | 한도 | `search/page.tsx` + `_components` 20개(SearchResultList·VideoCard·VideoModal·KeywordInsights·KeywordCompetition·TitlePatternAnalysis·ViewTrendGraph·LimitModal 등) | 3,520 | 69 | 256 | 93 | 152 | 36 | ƒ. 최대 파일. 불변 조건 1 핵심 | R16·R17·R18 |
| `/saved` | MW | `saved/page.tsx`, `SavedVideoList.tsx` | 297 | 0 | 45 | 9 | 6 | 0 | ƒ | R18 |
| `/channels` | 한도 | `page.tsx`, `ChannelResults`·`FilterTabs`·`DateSortToggle`·`ChannelSearchBar` | 678 | 63 | 3 | 3 | 20 | 0 | ƒ. incrementChannelCount | R19 |
| `/channels/[channelId]` | 한도 | `page.tsx`, `DescriptionToggle`·`BackToChannelsLink` | 509 | 46 | 0 | 1 | 12 | 0 | ƒ. 성장 지표 red/orange | R19 |
| `/my-channel` | 한도(쿼터 소모) | `page.tsx`, `ChannelDashboard`·`ChannelSearchForm` | 555 | 44 | 17 | 5 | 5 | 0 | ƒ. 요일 히트맵 rgba(0,229,160) | R19 |
| `/trend-search` | 페이지(잠금 표기용 auth) | `page.tsx` | 133 | 9 | 0 | 0 | 0 | 0 | ƒ(auth 때문) | R08 |
| `/trend-search/breakout` | 페이지(비로그인은 안내) | `page.tsx`, `breakout-view.tsx` | 172 | 16 | 0 | 0 | 0 | 0 | ƒ force-dynamic. **운영 데이터**(cron 수집). 최근 커밋, 로드맵에 없음 | 신규(R16~19 묶음 후보) |
| `/threads` | 페이지(Meta 연결) | `page.tsx` + 7개(MyAccountDashboard·PostPerformanceTable·ProfileViewsChart 등) | 958 | 0 | 100 | 28 | 14 | 10hex | ƒ. recharts 하드코딩 hex | R20 |
| `/threads/saved` | 페이지 | `page.tsx`, `SavedThreadsList.tsx` | 422 | 0 | 61 | 11 | 11 | 0 | ƒ | R20 |
| `/pricing` | - | `page.tsx`, `PricingCards`·`PricingButtons`·`FaqAccordion` | 454 | 45 | 0 | 5 | 0 | 0 | ○ 유지 필수 | R09 |
| `/payment` | MW + 페이지 | `page.tsx` + 결제 버튼 6종(Toss·Payple·Inicis·Kcp·Portone) | 1,012 | 0 | 74 | 6 | 18 | 0 | ƒ. 결제 SDK, 마크업만 | R10 |
| `/payment/toss` | MW + 페이지 | `page.tsx`, `TossPaymentWidget`·`TossCheckoutWidget` | 338 | 0 | 11 | 0 | 12 | 0 | 즉시 redirect(api) | R10 |
| `/payment/toss/fail` | MW | `page.tsx` | 52 | 0 | 7 | 2 | 3 | 0 | client | R10 |
| `/sign-in` | - | `sign-in/_components/SignInForm.tsx`(로고 복제) | 10(+폼) | 0 | 0 | 0 | 0 | 0 | ○ | R10 |
| `/mypage` | MW + 페이지 | `page.tsx` + LogoutButton·CancelSubscriptionButton·DeleteAccountButton·ReferralSection·RecentSearches | 609 | 74 | 0 | 0 | 16 | 2 | ƒ. 로고 복제, 플랜 파랑·보라 | R21 |
| `/community` | 페이지(layout 게이트) | `community/layout.tsx`, `page.tsx` + `_components` 10개(Sidebar·Gate·FeedCard·PostContent·CategoryChips 등) | 1,118 | 86 | 0 | 7 | 1 | 0 | ƒ force-dynamic. 회원 전용 | R14·R15 |
| `/community/[board]/[id]` | 페이지(게이트) | `page.tsx`, CommentSection·LikeButton·PostActions·AttachmentList | 237(+부품) | 10 | 0 | 2 | 0 | 0 | ƒ. canReadBoard | R15 |
| `/community/write` | 페이지 | `page.tsx`, `PostForm`·`BlockEditor` | 1,064 | 58 | 0 | 3 | 2 | 0 | ƒ | R15 |
| `/community/ranking` | 페이지(게이트) | `page.tsx` | 210 | 18 | 0 | 2 | 0 | 0 | ƒ | R14 |
| `/community/about` | 페이지(게이트) | `page.tsx` | 105 | 11 | 0 | 1 | 0 | 0 | ƒ | R14 |
| `/incubating` | - | `page.tsx`(PostContent 재사용) | 111 | 12 | 0 | 6 | 0 | 0 | **● revalidate 60 + unstable_cache** | R13 |
| `/studio` | 비밀 쿠키(StudioGuard) | `page.tsx`, StatsCounter·VideoMarquee·StudioGuard·DevEditor | 1,703 | 127 | 26 | 10 | 5 | 3 | ○ force-static. 레드 #E5484D, 그라데이션 | R11a·R11b |
| `/studio/class/[slug]` | - | `page.tsx` | 195 | 35 | 0 | 5 | 3 | 0 | sticky top-20 구매 카드 | R12a 인접 |
| `/studio/class/consulting` | - | `page.tsx`, `layout.tsx`(R04 buttonClass 사용) | 166 | 9 | 0 | 0 | 0 | 0 | client → 정적화 예정 | R12a |
| `/studio/consulting` | - | `page.tsx`, `layout.tsx` | 522 | 53 | 0 | 14 | 1 | 0 | client. 에메랄드 최다 파일(14) | R12b |
| `/studio/classroom` | 페이지 | `page.tsx` | 99 | 0 | 13 | 8 | 0 | 2 | 수강생 전용 | 로드맵 없음 |
| `/studio/classroom/[courseId]` | 페이지 | `page.tsx`, `LessonPlayer.tsx` | 62(+플레이어) | 0 | 0 | 0 | 0 | 0 | fixed top-12 사이드바 | R06c 인계 |
| `/about` | - | `page.tsx` | 254 | 0 | 41 | 11 | 5 | 0 | ○ | R08 |
| `/terms` · `/privacy` · `/refund` | - | 각 page.tsx | 117·174·102 | 0 | 7·16·20 | 3·5·3 | 1·1·0 | 0 | ○. 문장 변경 금지 | R08 |
| `/tools/calculator` | - | `page.tsx`, `CalculatorClient.tsx` | 388 | 0 | 46 | 12 | 24 | 2 | ○. 진입 링크 추가 금지(결정 14) | R08 |
| `/maintenance` | - | `page.tsx`(R04 적용 완료) | 48 | 3 | 0 | 0 | 0 | 0 | 점검 모드 rewrite 대상 | 완료(R04) |
| `/tmklab-site` | - | `page.tsx`(tmklab.com rewrite) | 306 | 0 | 0 | 0 | 0 | 15hex | 별도 브랜드. **리뉴얼 범위 밖 후보** | 없음 |

### 1.2 리다이렉트 전용 (디자인 작업 없음)

`/sign-up` → /sign-in · `/sso-callback` → /sign-in(error.tsx 만 화면, R10) · `/insights`·`/insights/[slug]` → /community?cat=column · `/community/[board]` → /community?cat= · `/community/incubating` → /incubating · `/studio/class` → /studio/class/consulting · `/payment/toss` → /api/toss/billing/page. 라우트 핸들러만 있는 폴더: `consulting/`·`teambibl/`·`tmkstudio/`(route.ts).

### 1.3 관리자 (리뉴얼 범위 밖 후보)

| 경로 | 로그인 | 주요 파일 | 줄 | N | G | E | O |
|---|---|---|---|---|---|---|---|
| `/admin` | MW + 관리자 | `admin/_components/AdminDashboard.tsx` | 1,718 | 0 | 203 | 23 | 97 |
| `/admin/traffic` | MW + 관리자 | `MenuTrafficDashboard.tsx`(메뉴별 색 #00E5A0·#60A5FA·#FBBF24·#F472B6·#A78BFA) | 489 | 29 | 47 | 7 | 13 |
| `/insights/admin` (+`[id]`·`traffic`) | 페이지 | PostEditor·BlockPicker·ThreadsImport·YouTubeImport·TrafficClient | 2,077 | 0 | 133 | 63 | 40 |
| `/community/admin` | 페이지 | BoardManager·GradeManager | 837 | 59 | 0 | 5 | 7 |

관리자 합계(16파일): neutral 88 · gray 383 · 에메랄드 98 · 기타 157. globals.css 의 gray·slate·zinc 무채색 안전망이 이 화면들을 위해 R22 이후에도 남는다. 액센트를 흰색으로 바꿔도 이 화면들의 에메랄드 리터럴은 그대로 남으므로 "관리자 = 구 테마" 로 명시하고 범위 밖으로 둘 것을 권한다(예외: `insights/admin/PostEditor` 의 sticky top-14 는 R06c 회귀 수정 대상).

### 1.4 ux-preview (17개, 개발용 시안 경로)

`/ux-preview`, `r01-mypage/[state]`, `r01-share(-sdk)`, `r02a-empty`, `r02a-limit/[state]`, `r02b-dashboard`, `r03-tables`, `r04-error`·`r04-throw`·`r04-ui`, `r05-bar-md`·`r05-consulting-head`·`r05-dialog`·`r05-server-classes(-old)`·`r05-toast`, `breakout`. neutral 71 · 기타 10. 실버 전환 후 `r04-ui`(부품 견본)·`r05-dialog` 를 회귀 확인 화면으로 쓰고, 나머지는 정리 후보.

---

## 2. 공유 파일과 영향 범위

| 파일 | 줄 | 색(N/E/hex) | 하는 일 | 영향 범위 |
|---|---|---|---|---|
| `src/app/layout.tsx` | 525 | 39 / 6 / 7 | 네비(데스크톱·2행 모바일)·푸터·로고 2곳(헤더 302~309행, 푸터 404~411행)·JSON-LD·카카오 버튼·NavigationLoader | **전 페이지**. 에메랄드 6곳(컨설팅·대행 메뉴 380·386·493행 등). auth 호출 금지 |
| `src/app/globals.css` | 379 | 2 / 2 / 11 | `@theme` 토큰(accent·surface-raised·kakao·youtube·글자 단계·반경·컨테이너·breakpoint-nav), gray·slate·zinc 무채색 안전망, body 바탕, `:focus-visible`(accent), `::selection`(accent 바탕), /studio 애니메이션·`.highlight-draw`(#fff)·`.channel-card` hover(scale·shadow) | **전 페이지**. accent 값 변경이 포커스·선택·R04 부품에 즉시 전파 |
| `src/app/_components/NavUser.tsx` | 79 | 7 / 0 | 로그인 상태·아바타 | 네비 |
| `src/app/_components/SearchUsageBadge.tsx` | 59 | 7 / 0 / O3 | 남은 횟수 배지 | 네비. 실버 규칙: 평소 #C6C6C6 → 5회 이하 caution → 0회 negative |
| `src/app/_components/SearchBar.tsx` | 386 | 27 / 2 | 검색창·기록·국가 선택 | /search·홈. **불변 조건 1 보호 함수 8개** |
| `src/app/_components/ConfirmDialog.tsx` | 112 | 0 / 0 | 검색 확인창(R05 셸 사용) | SearchBar 확인 흐름 |
| `src/app/_components/KakaoChatButton.tsx` | 30 | 2 / 0 / hex1 | 고정 상담 버튼, 말풍선 fill #3A1D1D | 전 페이지. currentColor + kakao-icon 토큰으로 |
| `src/app/_components/NavigationLoader.tsx` | 239 | 2 / 0 / hex1 | 페이지 이동 진행 막대·오버레이 | 전 페이지. z-[9998]·z-[9999] 정리 대상(R06a) |
| `src/app/_components/LandingStats.tsx` | 130 | 3 / 0 | 홈 실적 숫자 카운터 | 홈. '0+' 초기값 문제(R07) |
| `src/app/_components/DevToolbar.tsx` | 68 | 0 / 0 / G5·O11 | 개발 도구 | 개발 전용 |
| `src/app/error.tsx`·`not-found.tsx` | 41·34 | 2 / 0 | R04 부품 시범 적용 | 오류·404 |
| `src/app/opengraph-image.tsx`·`icon.tsx`·`apple-icon.tsx`·`manifest.ts` | 58·35·35·25 | hex 8·1·1·2 | 공유 이미지·아이콘·theme_color | 공유 미리보기(R06b). 로고 B 를 실버 판으로 바꾸면 함께 |
| `src/components/ui/button.ts` | 57 | | primary 흰 면(hover neutral-200 #E5E5E5, active neutral-300 #D4D4D4), secondary, ghost, danger(red-400) | 사용 8파일. 실버 accent-active #C6C6C6 와 1단계 차이 |
| `src/components/ui/card.ts` | 52 | | CARD neutral-900 면, FEATURED surface-raised | 사용처 소수. F 규칙은 카드 면 #0A0A0A(neutral-950), #171717 은 선택·hover |
| `src/components/ui/badge.ts` | 31 | | neutral·accent(text-accent)·warn(amber)·danger(red)·success(green)·solid(흰) | accent 배지는 실버 전환 시 흰 글자가 되어 neutral 과 구분 약해짐 |
| `src/components/ui/chip.ts` | 25 | | 칩·세그먼트, 선택 = neutral-800 면 + 흰 글자 | 실버 규칙과 일치(그대로 유효) |
| `src/components/ui/tabs.ts` | 24 | | 밑줄 탭, 현재 = border-accent | accent 흰색이면 F 의 '흰 2px 막대'와 자동 일치 |
| `src/components/ui/field.tsx` | 119 | 9 | 입력(neutral-700 테두리, 포커스 border-accent, invalid red-400) | 실버: 기본 #404040 → 포커스 #FFFFFF 와 자동 일치. invalid 는 negative 로 |
| `src/components/ui/dialog.tsx`·`dialog-classes.ts` | 331·14 | 2 | 모달 셸(neutral-900 패널), 제목·설명 | R05. 실버 surface-2 #171717 과 같은 값 |
| `src/components/ui/bottom-cta-bar.tsx` | 114 | 1 | 모바일 하단 고정 바(bg-black/95) | /incubating·/studio 등 예정 |
| `src/components/ui/logo.tsx` | 53 | 3 | B 상자(border-neutral-700 bg-black 흰 B) + bibl 흰 + lab neutral-400 | **R04 로고 부품이 있으나 layout.tsx·mypage·SignInForm 은 아직 자체 마크업**. admin 은 teal lab |
| `src/components/ui/section-header.tsx` | 72 | 5 | 섹션 라벨(흰 영문)·두 톤 제목(neutral-400 리드 + 흰) | 실버: 영문 라벨 → silver, 리드 → fg-3 #949494 |
| `src/components/ui/container.tsx`·`icons.tsx` | 50·141 | 0 | 1200 컨테이너·SVG 아이콘 | 색 무관 |
| `src/components/VideoCard.tsx`·`Sparkline.tsx`·`PerformanceBadge.tsx` | 123·37·12 | | 구 부품. Sparkline #60A5FA, PerformanceBadge gray·채도색 | **사용처 0**(notes 6장). 삭제 또는 chart·등급 토큰으로 |
| `src/app/community/layout.tsx` | 105 | 3 | 커뮤니티 틀·비회원 게이트·noindex | 커뮤니티 전 경로. 불변 조건 3 |
| `src/app/studio/consulting/layout.tsx`·`studio/class/consulting/layout.tsx` | 51·53 | 0 | 메타데이터 | 해당 경로 |

---

## 3. 로드맵 잔여 항목(R06a~R23) · 새 디자인에서 유효/변경

진행: R00~R05 완료(커밋됨), R06a 부터 21개 미완. 아래 "유효"는 그대로 실행, "변경"은 roadmap-v2.json 의 changes·acceptance·amendments 에서 고쳐야 할 문장이다.

| 항목 | 목적 | acceptance 핵심 | 그대로 유효 | 바뀌어야 할 것 |
|---|---|---|---|---|
| **R06a** 전역 네비 | 현재 위치 표시, next/link, 1200 기준선, 건너뛰기 링크, 로더 경고 제거, --breakpoint-nav 실측 | 1440 로고 x=144, aria-current, 문서 재요청 0, 첫 Tab 본문 바로가기, 768·1024 겹침 0 | NavLink(usePathname), next/link, 건너뛰기, 로더 queueMicrotask, 루트 auth 금지 | 결정 3 의 B(화이트 필·아이콘 유지, 컨설팅·대행 #66FFCC 밑줄)가 F 와 충돌. F = '비블과 함께(흰 600)'·'직접 하기(fg-3 500)' 두 묶음, 1280 미만 전체 높이 메뉴 시트, 앱 네비는 '비블과 함께 ▾' 드롭다운 + 도구 탭. 로고를 R04 logo.tsx 실버 판으로 교체하는 작업도 여기 |
| **R06b** 푸터·OG·JSON-LD | 푸터 대비·링크 높이, 공용 OG 상수, 깨진 JSON-LD | og:image /og-image.png, manifest #000, 대비 7:1 | 전부 | 푸터를 F 의 두 묶음 메뉴 + 정책 + 사업자 + API 고지로. OG 이미지·아이콘의 로고 B 를 실버 판으로 |
| **R06c** 모바일 2행·--nav-h | 2행 칩 통일, --nav-h 노출 | 390 2줄, 칩 32px, --nav-h = 실제 높이 | --nav-h·sticky 회귀 수정(class/[slug]·LessonPlayer·PostEditor·#process) | F 는 1280 미만을 **2행 메뉴가 아닌 메뉴 시트(높이 56)** 로 바꾼다. '390 은 2줄'·'2행 칩 높이' 기준은 폐기, 시트의 바깥 누르기·Esc·포커스 가두기(F 약점 5)로 대체. 결정 4 재질문 필요 |
| **R07** 홈 | 입력 히어로 → 기능 → 서비스 → CTA, 모바일 첫 화면, 서버 컴포넌트 분리 | 390 h1+검색창 700px 이내, / 정적, count 1→2, '0+' 없음 | HomeSearch 분리(보호 함수 글자 그대로), 정적화, 모달 접근성 | 구조를 F 8구역(첫 화면 8:4 실적 열 → 결과 미리보기 → 01·02·03 → 서비스 5가지 → 채널 실적·실버 플레이 버튼 → 대행 CTA)으로. h1 '유튜브 트렌드' 는 에메랄드 → '실버 문장 + 흰 핵심어'. '인기 키워드' → '예시'(결정 6 기본 B 와 충돌). 홈 대행 카드 추가 안 함(결정 1 기본 C) → F 는 서비스 카드에 대행 포함 |
| **R09** 요금제 | 실제 청구액·현재 플랜·결제 실패·비교표·FAQ | /pricing ○, 연 ₩180,000 표기, role=alert, aria-pressed | 전부(로직·문구) | 카드 면 #0A0A0A, 추천만 #171717 + 흰 버튼, 가격 800 굵기. '레드 배너' → negative #FF7B72 글자·테두리 |
| **R10** 로그인·결제 | 실패 안내, 인앱 경고, 결제 화면 테마 | role=alert, gray/teal/blue 0, alert( 0 | 전부 | 인앱 경고 = caution, 실패 = negative. 로고 복제 제거(R04 logo) |
| **R08** 정적 공개 페이지 | about·약관 3종·계산기 테마, 허브 잠금 표기 | 그라데이션·쿨색 0, 약관 문장 diff 0, 본문 672 | 전부 | 허브 카드는 F 의 '분석 도구 4가지' 목록 모양과 맞출지 확인 |
| **R13** 본문 렌더러·인큐베이팅 | 세로 이미지 상한, 문단 간격, 지원 CTA, 공유 메타 | /incubating ● 유지, 이미지 ≤ 70vh, og 메타 | 전부(캐시·메타) | 모집 배지 bg-[#00E5A0]/10 → 실버 규칙(테두리 배지). F 확장안: 키위새 배너 히어로 + '01~04' + 오픈채팅(흰) |
| **R12a** 1:1 컨설팅 상세 | 요약 카드, 가격 직후 CTA, 정적화 | 두 경로 ○, CLS < 0.1 | 전부 | F 확장안: 사진 카드 히어로 + '월 49만원' 큰 숫자. 에메랄드 → 흰·실버 |
| **R12b** 상담 폼 | 라벨·검증·오류·정적화 | 폼 ○, 오류 포커스 이동, fetch 본문 동일 | 전부 | 에메랄드 14곳(사이트 최다) 치환을 이 항목에 포함. 오류 = negative |
| **R11a** /studio 금지 패턴·성능 | 그라데이션·모바일 깨짐·JS 없이 첫 화면·마퀴 비용 | gradient/teal/cyan 0, ○ 유지, 마퀴 정지 | 전부 | **레드 #E5484D 유지(결정 7 기본 B)는 실버 원칙과 충돌**(채도색은 콘텐츠·유튜브·카카오·기능색만). 결정 7 재질문. 실버 플레이 버튼은 무채색 보정판 사진 |
| **R11b** /studio 전환 CTA | 챕터 끝 CTA, 가격 카드 CTA, 하단 CTA 1개 | 섹션 라벨 x 동일, 카카오 겹침 0, sticky 가 --nav-h 아래 | 전부 | '결정 7=A 면 레드 → 에메랄드' 문장 폐기(에메랄드는 없어짐). 가격 '월 350만원' 큰 숫자 카드, 홈 채널 실적 띠 재사용 |
| **R14** 커뮤니티 틀 | 현재 게시판 표시, 사이드바, 게이트, 랭킹 | 게이트만(글 0), canReadBoard diff 0, aria-current | 회원 전용 구조·noindex·게이트 값 규칙 | 사이드바 노랑(text-yellow-400)·레드 N 배지(#E5484D)는 소유자 8/30 요청으로 유지(결정 E 기본 B)지만 실버 원칙과 충돌. 재질문 필요. 게이트는 F 확장안(손글씨 워드마크 + 멤버 수 + 게시판 4개 목록) |
| **R15** 글 상세·피드·댓글·글쓰기 | 720 읽기 폭, 썸네일, 오류·답글, 터치 툴바 | 본문 ≤ 720, prompt( 0, 하단 등록 바 겹침 0 | 전부 | 좋아요·링크 액센트 리터럴 → accent(흰). 오류 레드 → negative |
| **R16** 검색 틀·검색창·한도 모달·도구 탭 | 결과 앞 홍보 축소, ToolTabs | 보호 행 diff 0, 남색 0, 키보드 조작 | 보호 구간·ToolTabs·한도 모달 규칙 | 활성 = 'neutral-800 면 + 흰 글자 또는 밑줄 탭' 은 유효. 도구 탭은 F 의 '현재 탭 흰 2px 막대' 로 확정. 국기 이모지 예외 유지 |
| **R17** 분석 패널 | 인사이트·경쟁도·제목 패턴 접기, 기능색만 | 분석 줄 ≤ 64px, 흑백에서도 단계 구분, 파생 지표 문구 불변 | 전부(ToS 제약 포함) | '기능색' 정의를 positive·caution·negative 3색으로 교체. KeywordCompetition 의 yellow·red·amber-50 흰 패널, KeywordInsights cyan·sky 그라데이션·blur-3xl 제거 |
| **R18** 결과 표·모달·/saved | 촘촘한 표, 키보드, 모바일 정렬·선택, 실패 토스트 | 보호 행 diff 0, 1440 8행, 체크 40px | 전부 | 등급 색: Great positive 작은 면(🔥 삭제), Good positive 테두리, Normal fg-3, Bad caution, Worst negative. 선택 행 teal → surface-2 + 흰 막대, 체크박스 테두리 #7A7A7A, 쇼츠·롱폼 배지 무채색. 정렬 열 흰 글자 |
| **R19** 채널 3화면 | 테마, 기능색 범례, 모바일 넘침, 원문 오류 | 쿨색 0, scrollWidth 390, 범례, 히트맵 대비 4.5 | 전부('높음' 을 빨강으로 쓰지 않기 포함) | 히트맵 rgba(0,229,160,α) → heat-1~5 무채색(α 0.54 경계 규칙 폐기, 1·2단계 흰 글자/3단계부터 검정). 상승·하락 → positive·negative. 유튜브 버튼 bg-red-600 흰 글자(대비 미달) → 유튜브 빨강은 ↗·로고에만 |
| **R20** 스레드 | 한국어 오류, 다시 연결, 테마, 즐겨찾기 | 쿨색·confirm( 0, 영어 원문 0 | 전부 | recharts hex(#14b8a6·#1f2937·#374151·#111827) → chart-1·chart-grid·surface 토큰. 즐겨찾기 별 amber 허용 → caution 토큰 |
| **R21** 마이페이지 | 섹션 구조, 계정 관리 분리, 초대 안내 | 쿨색·#161b27·alert( 0, 삭제 모달 포커스 | 전부 | Starter 파랑·Team 보라 플랜 글자 → 무채색, 남은 횟수 큰 숫자(F 확장안), 해지는 아래 negative 글자. 로고 복제 제거 |
| **R22** 접근성·QA·DESIGN.md | 전역 잔여, 전체 검증, 문서 | check:theme 0, 포커스 '에메랄드 2px', axe critical 0 | 불변 조건 검사·320px·200% 확대·axe | '포커스는 모두 에메랄드 2px' → **흰 2px(간격 2px)**. DESIGN.md 는 `design-final/silver/DESIGN-notes.md` 를 바탕으로. `--color-*: initial` 은 관리자 화면 때문에 적용 불가 → check-theme 에 '토큰 밖 색' 규칙 추가로 대체 |
| **R23** 홈 결과 미리보기 | 결과 화면 캡처 1장 | 1440·390 1장, 대체 텍스트, CLS 0 | 목적 | F 는 캡처 이미지가 아니라 **HTML 표 5행(모바일 3행) + 날짜 출처** 다. 데이터 보관 규정상 주기 교체 필요(F 약점 1). R07 에 합칠지 결정 필요 |

로드맵에 없는 화면: `/trend-search/breakout`(최근 추가, 운영 데이터), `/studio/classroom`(수강생 전용), `/studio/class/[slug]`(sticky 회귀만 R06c), `/tmklab-site`(별도 브랜드). breakout 은 R16~R19 앱 셸과 같은 표 부품으로 묶는 것을 권한다.

---

## 4. R03·R04·R05 에서 실버로 바꿀 때 고칠 곳

### 4.1 한 곳 고치면 전파되는 곳 (globals.css `@theme`)

| 고칠 줄 | 지금 | 실버 | 전파 대상 |
|---|---|---|---|
| `--color-accent` | #00e5a0 | #ffffff | `:focus-visible` 링(전 페이지), `::selection` 바탕, `tabs.ts` 현재 탭 밑줄, `field.tsx` 포커스 테두리·윤곽, `badge.ts` accent 톤 |
| `--color-accent-hover` | #66ffcc | #e5e5e5 | 토큰 hover 사용처(현재 거의 없음) |
| `::selection` | accent 바탕 + #000 | `var(--color-silver)` 바탕 + 검정 | 전 페이지 글자 선택 |
| 새 토큰 추가 | 없음 | canvas·surface(-2·-3)·line(-soft·-strong·-hover·-control)·fg(-1~-4)·accent-active·accent-ink·silver·positive·caution·negative·chart-1~3·chart-grid·heat-1~5·paper(-ink·-muted)·kakao-icon | 추가만으로는 아무것도 바뀌지 않는다. 사용처가 생길 때 전파 |
| `--color-surface-raised` #1f1f1f | card FEATURED·hover 면 | 실버 표에 없는 값. surface-2(#171717) 또는 surface-3(#262626)로 통합 결정 필요 |
| 주석 "에메랄드 2px" | | 흰 2px | 문서 |
| `.highlight-draw::after` #fff, `.channel-card:hover` scale·shadow | /studio 전용 | 값은 무채색이라 유지 가능. scale·그림자 hover 는 금지 패턴 정리(R11a) |

**주의**: 토큰 값만 바꾸면 R04 부품과 포커스는 흰색이 되지만, 같은 화면의 리터럴 에메랄드(75곳)는 그대로 남아 **에메랄드 글자 + 흰 포커스가 섞인 과도기**가 생긴다. 토큰 교체와 리터럴 일괄 치환(아래 4.3)을 같은 커밋 묶음으로 내보내는 편이 안전하다.

### 4.2 부품 파일별 수정 (R04·R05)

| 파일 | 수정 |
|---|---|
| `components/ui/button.ts` | primary active `neutral-300`(#D4D4D4) → `accent-active`(#C6C6C6). danger `red-400` → `negative`. 나머지 neutral 값은 그래파이트와 동일해 유지 가능 |
| `components/ui/card.ts` | CARD 면 `neutral-900` → F 규칙은 `surface`(#0A0A0A, neutral-950). FEATURED `surface-raised` 정리 |
| `components/ui/badge.ts` | warn `amber-400` → caution, danger `red-400` → negative, success `green-400` → positive, accent 톤(흰 글자)은 neutral 과 구분 위해 실버 또는 흰 굵기 규칙 확정. 주석 '에메랄드 글자' 수정 |
| `components/ui/field.tsx` | invalid `red-400` → negative, placeholder `neutral-500`(#737373) → fg-4 #7A7A7A, label `neutral-300` → fg-2 |
| `components/ui/logo.tsx` | B 상자 `border-neutral-700 bg-black text-white` → `bg-silver` + 검정 B, lab `neutral-400` → silver. 그 뒤 layout.tsx(헤더·푸터)·mypage·SignInForm 의 복제 마크업을 이 부품으로 교체 |
| `components/ui/section-header.tsx` | 영문 라벨 `text-white` → silver, 캡션·리드 `neutral-400` → fg-3 |
| `components/ui/chip.ts`·`tabs.ts`·`dialog.tsx`·`dialog-classes.ts`·`bottom-cta-bar.tsx`·`container.tsx` | 값이 그래파이트와 같아 수정 없음(dialog 설명 `neutral-400` → fg-3 정도). tabs 는 accent 변경으로 자동 흰 막대 |
| `_components/KakaoChatButton.tsx` | fill `#3A1D1D` → currentColor + `text-kakao-icon` |
| `_components/SearchUsageBadge.tsx` | 남은 횟수 단계 색을 fg-2 → caution → negative 로 |

### 4.3 파일별 치환이 필요한 곳 (전파되지 않음)

- 에메랄드 리터럴 27파일 75곳. 많은 순: `studio/consulting/page.tsx` 14 · `layout.tsx` 6 · `incubating/page.tsx` 6 · `studio/class/[slug]/page.tsx` 5 · `pricing/_components/PricingCards.tsx` 4 · `insights/_components/InsightsList.tsx` 4 · `community/admin/_components/BoardManager.tsx` 4 · `community/write/_components/PostForm.tsx` 3 · 나머지 2곳 이하 19파일(globals.css 2 포함).
- teal/emerald 클래스(사용자 화면): `/search` 93, `/threads` 39, `/studio` 계열 37, `/tools/calculator` 12, `/about` 11, `/saved` 9 등.
- 기능 색 하드코딩: 5장 2절 표.
- gray·slate·zinc 788회는 안전망으로 이미 무채색이라 **보이는 색은 그대로**. 다만 gray-300·400(#D4D4D4·#A1A1A1 상당)도 실버 단계(#C6C6C6·#949494)와 다르므로 화면 변환 시 fg 토큰으로 옮긴다.

---

## 5. 위험

### 5.1 불변 조건 (깨면 안 됨)

| # | 조건 | 위치 | 디자인 작업에서 주의할 점 | 검사 |
|---|---|---|---|---|
| 1 | 검색 결과 수 누적(핵심 비즈니스 정책) | `SearchBar.tsx` localHistoryKey·loadLocalHistory·loadAllLocalHistory·saveLocalHistory·saveToHistory·executeSearch·navigateFromHistory·handleSubmit, `search/page.tsx` `if(query)`·filterBase, `SearchResultList.tsx` handleLoadMore·dedup·`key={video.videoId}`, 홈 `page.tsx` saveToHistory·trySearch, `RecentSearches` `fromHistory=1` | 홈을 F 구조로 갈아엎는 R07 에서 함수 본문을 글자 그대로 옮겨야 한다. F 의 '결과 미리보기'·'예시 칩'이 /search 로 바로 보내면 saveToHistory 를 건너뛸 수 있음(예시 칩은 trySearch 경유 필수). 결과 표 재구성(R18)도 더보기 누적 로직 diff 0 | `node scripts/ux/check-invariants.mjs` → INVARIANTS_OK (2026-10-08 실행 결과 OK, 15개 대상) |
| 2 | 루트 레이아웃 정적 | `src/app/layout.tsx` | auth()·cookies()·currentUser() 금지. F 앱 네비의 '현재 위치'·'남은 횟수'·'비블과 함께 ▾' 는 클라이언트 잎으로. 홈·앱 네비가 달라지는 F 를 경로로 분기할 때도 usePathname | check-invariants 범위 밖. `grep -nE "auth\(|cookies\(|currentUser" src/app/layout.tsx` 0 확인 필요 |
| 2' | /incubating 캐시 | `incubating/page.tsx` `revalidate = 60` + `unstable_cache(tags: incubating-post)` | PostContent 를 바꿔도 이 두 줄 유지, 페이지에 auth 추가 금지 | 빌드 표 ● 확인(buildcheck.sh) |
| 3 | 커뮤니티 회원 전용 | `community/layout.tsx` 비로그인 게이트(42~53행)·robots noindex, `community/page.tsx:50`·`[board]/[id]/page.tsx` canReadBoard | F 게이트 확장안(멤버 수·게시판 4개 목록)도 숫자·게시판 이름만. 글 제목·내용 노출 0 | 비로그인 curl 로 글 0 확인 |
| 4 | 결제·인증·검색 API·DB 로직 | `src/app/api/**`, `src/lib/{searchLimit,channelLimit,stripe,payple,portone,toss,threads,auth,db}.ts`, `auth/callback`, `middleware.ts` | /payment·결제 버튼 6종은 className·마크업만. 채널 찾기는 router.push 금지(재차감) | git diff 범위 확인 |
| 6 | 의존성 추가 금지 | `package.json` | 실버 전환에 라이브러리 불필요 | |

### 5.2 기능 색이 뜻을 가지는 곳 (무채색으로 지우면 정보 손실)

| 위치 | 지금 | 뜻 | 실버 매핑 |
|---|---|---|---|
| `search/_components/VideoCard.tsx` calcProbabilityLabel(21~32행) + 확률 안내 모달 | Great emerald-400 🔥 · Good teal-400 · Normal gray-400 · Bad orange-400 · Worst red-500 | 조회수 ÷ 채널 평균 등급(5·2·0.5·0.1배) | positive 면 · positive 테두리 · fg-3 · caution · negative. 라벨 필수, 기준값 불변 |
| `search/_components/KeywordCompetition.tsx` | yellow·red(900/40 면, 700/50 테두리, stroke) + amber-50 흰 패널 | 키워드 경쟁도 단계 | caution·negative 글자·테두리, 흰 패널 제거. 막대 + 숫자 + 단계 글자(흑백 구분) |
| `search/_components/ViewTrendGraph.tsx` 108~113행 | #f97316·#eab308·#14b8a6·#6b7280 | 알고리즘 점수 높을수록 좋음 | 70+ positive · 50~69 #C6C6C6 · 30~49 #949494 · 30 미만 #7A7A7A. 흰색 금지 |
| `search/_components/KeywordInsights.tsx` | cyan·teal·sky·amber 그라데이션 + blur-3xl | 장식(뜻 없음) | 무채색 테두리 패널 |
| `search/_components/ViewStatsInline.tsx`, 알고리즘 확률 열 | | 파생 지표(YouTube 정책 통지 d5a5164) | 스타일만. 위치·조건·문구 불변, 새 표현 금지 |
| `channels/_components/ChannelResults.tsx` 36~37·92·148·182·246행 | red-400·orange-400(높음), green(신규 채널) | 지표 높음·신규 | '높음'을 빨강으로 쓰지 않는다(Worst 와 충돌). 범례 추가 |
| `channels/[channelId]/page.tsx` 271~279·345·394~395행 | red-400(빠른 성장)·orange-400, bg-red-600 유튜브 버튼 | 성장 속도, 조회/구독 비율 | positive/무채색 단계 + 범례. 유튜브 버튼은 무채색 + 빨강 ↗ |
| `my-channel/_components/ChannelDashboard.tsx` 114~116·270행 | green-400·red-400, rgba(0,229,160,α) 히트맵 | 상승·하락, 요일별 업로드 성과 | positive·negative, heat-1~5 |
| `_components/SearchUsageBadge.tsx`, `search/_components/LimitNotice.tsx`·`LimitModal.tsx` | | 남은 횟수 | 평소 fg-2 → 5회 이하 caution → 0회 negative |
| `threads/_components/ProfileViewsChart.tsx`·`PostPerformanceTable.tsx` | teal 선, 회색 hex | 양(평가 없음) | chart-1 흰 선, chart-grid |
| `community/_components/CommunitySidebar.tsx` 35·125행 | 레드 N 배지 #E5484D, text-yellow-400 | 새 글, 강조 게시판(소유자 요청) | 결정 E 재질문. 유지 시 실버 원칙 예외로 문서화 |
| `studio/page.tsx` 레드 #E5484D, '마감임박' | | 강조(결정 7·6) | 결정 7 재질문 |
| `admin/traffic/MenuTrafficDashboard.tsx` 23~27행 | 메뉴별 5색, 상승 #00E5A0·하락 #E5484D | 범주 구분 | 관리자 범위 밖이면 유지 |
| 결제·로그인 | 인앱 브라우저 경고(amber), 결제 실패(red) | 경고·오류 | caution·negative |

유튜브 빨강(#FF0000)과 오류 빨강(#FF7B72)의 혼동이 가장 큰 의미 충돌 위험이다(notes 7장 5). 규칙: 유튜브 = ↗·로고 모양, 오류 = 기호 + 문장.

### 5.3 운영 데이터를 쓰는 화면 (캡처·검증 때 주의)

| 화면 | 데이터 | 주의 |
|---|---|---|
| `/search`·`/channels`·`/channels/[id]`·`/my-channel` | YouTube API 실시간 + 사용자 차감 | **열면 실제 쿼터·횟수 차감.** 캡처는 ux-preview 고정 데이터(r02a·r02b·r03-tables)로. /my-channel 은 로그인·횟수 제한 없는 쿼터 소모 경로라 새 진입 링크 금지 |
| `/trend-search/breakout` | cron 이 매일 수집한 DB(브레이크아웃 영상) | 도박성 제외 필터 등 운영 판단이 들어간 목록. 표시만 변경 |
| `/community/**`·`/incubating` | Supabase 실제 게시글·회원 수·랭킹 | 회원 실명·아바타 노출. 캡처는 소유자 크롬. 랭킹의 운영자 계정 표시(결정 17) |
| `/mypage`·`/saved`·`/threads(/saved)` | 개인 계정·결제·수집함·Meta 토큰 | 캡처 공유 금지 수준. 계정 삭제·해지 버튼은 실행 금지 |
| `/payment/**`·`/pricing` 현재 플랜 | 결제 SDK·실제 플랜 | 결제 버튼 클릭 금지, 마크업만 |
| 홈 `LandingStats`·F 실적 열·`/studio` StatsCounter | 실적 숫자(70만+·1.7억회+·10억원+·7억+), 63만/70만+ 근거 | 숫자 출처·기준일 문구 확인 필요(F 약점 7) |
| 홈 결과 미리보기(F·R23) | '캠핑' 실제 검색 스냅숏(남의 채널 썸네일) | YouTube 데이터 보관 규정상 날짜 표기·주기 교체, 콘텐츠 권리 부담 |
| `/admin/**`·`/insights/admin/**` | 전체 사용자·매출·트래픽 | 범위 밖 |

### 5.4 기타 구조 위험

1. `--color-*: initial` 을 사이트에 적용하면 관리자·미변환 화면 전부 붕괴. 안전망 gray·slate·zinc 블록도 지워진다.
2. R04 부품 채택률이 낮아(8파일) "부품만 고치면 끝"이 아니다. 화면 항목마다 부품으로 옮기는 작업이 실버 전환과 함께 간다.
3. 로고 마크업 4벌(layout 헤더·푸터, mypage, SignInForm) + admin teal 버전. logo.tsx 하나로 모아야 실버 판 로고가 일관된다.
4. F 네비는 홈·앱이 다른 모양(앱 드롭다운 + 도구 탭)이라 layout.tsx 하나에서 경로 분기가 필요하고, 이는 불변 조건 2 때문에 클라이언트 잎으로만 가능하다.
5. 1024~1279 폭에서 카카오 버튼이 표 마지막 열을 가리고, 360 폭 하단 선택 바가 밀린다(F 약점 2~4). R18 acceptance 에 추가 권장.
6. 본문 글자가 #D4D4D4 → #C6C6C6 로 어두워진다(12.29:1 로 충분하나 체감 변화).
7. `check-theme.mjs` 는 쿨그레이·틸·그라데이션은 잡지만 **채도색(red·orange·amber·blue·purple)과 에메랄드 클래스(emerald-*)·토큰 밖 hex 는 ERROR 로 잡지 않는다**(에메랄드 리터럴은 WARN). 실버 기준 규칙(emerald·기능 색 리터럴·accent-literal 을 ERROR 로) 추가가 필요하다.

---

## 6. 권장 순서 (실버 적용 관점)

1. 결정 재질문: 3(네비), 4(모바일 메뉴 시트), 6('인기 키워드'→'예시'), 7(/studio 레드), E(커뮤니티 노랑·레드 N), R23 을 R07 에 합칠지, 관리자 범위 밖 확정.
2. 토큰 커밋: globals.css 새 토큰 추가 + accent 흰색 + selection 실버 + R04 부품 6파일 + logo 통합 + check-theme 실버 규칙. 같은 묶음에 에메랄드 리터럴 75곳 치환(관리자 제외 시 사용자 화면 약 60곳).
3. 이후 로드맵 순서(R06a → R06b → R06c → R07 …)를 3장의 '바뀌어야 할 것'을 반영해 진행. R16~R19 에 breakout 포함.
