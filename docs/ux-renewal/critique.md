# 로드맵 비판 검토 (2026-10-06)

## 판정

조건부 진행 권장. 방향(Resend 무채색 캔버스·흰 CTA 1개·에메랄드 규율·Tailwind v4 토큰)과 상당수 근거는 코드와 맞는다(부가세 consulting/page.tsx:361, 카카오 integrity 63자 layout.tsx:279, TrackVisit 12회 중복 studio/page.tsx:256, 토스 돌아가기 period 누락 route.ts:69, 컨설팅 이미지 7장 실제 높이, 커뮤니티 게이트 layout.tsx:44-53·canReadBoard page.tsx:50, Tailwind 4.1.18 의 center-safe·pointer-fine 지원 모두 확인). 그러나 그대로 실행하면 ① R01 이 정한 네비 시작점(xl)을 R03 글꼴·R06 1200 컨테이너가 다시 뒤집어 R01·R05·R12 의 xl 하드코딩을 재작업하게 되고, ② 불변 조건 1 주변에서 회귀·모순이 생긴다(확인창 초기 포커스 미정으로 Enter-Enter 검색 취소 위험, LimitModal 가입 직후 자동 검색 차감이 기본값으로 남음, R18 더보기 실패 안내는 보호 구간을 고쳐야만 가능하고 그래도 API 실패를 못 잡음). ③ 사실 오류로 완료 기준이 실패한다(openGraph 얕은 덮어쓰기로 /pricing·컨설팅 og:image 없음, /trend-search 는 이미 동적, /studio 미사용 상수 범위 오류, 결정 2 의 '로그인 폼 한 곳'은 middleware 가 돌아갈 주소를 버려 성립 안 함, 로고 x=120 은 실제 144). ④ 소유자가 명시 요청한 8/30 커뮤니티 노란 강조·레드 N(bdb074a·6df0c2d)을 묻지 않고 바꾸고, 8/14 /studio 레드(67c2c4e·d18a88c)는 무응답 기본값으로 교체한다. ⑤ YouTube ToS III.E.4h 통지(d5a5164)로 지웠다가 옵트인으로 되살린 파생 지표의 노출면을 R18·결정 14 가 넓힌다. ⑥ 줄 번호 기반 불변 조건 검사, 운영자 계정 하나로는 재현할 수 없는 플랜별 완료 기준 등 검증 수단이 약하다. 아래 이슈 반영과 R00(기준 커밋·검사 스크립트·브레이크포인트 토큰) 추가 후 진행할 것.

## 항목별 지적 (36건)

### R01 · wrong-order

R01 은 현재 풀폭 네비(layout.tsx:303 `w-full px-3`, 1280px 에서 가용 약 1256px)와 OS 글꼴 기준으로 `hidden xl:flex` 를 정하고 '1280·1440 한 줄 무겹침'을 완료 기준으로 둔다. 그런데 R03 이 글꼴을 Pretendard 로 바꾸고 R06 이 네비를 `max-w-page px-6`(1280px 에서 본문 1152px)로 줄이며, R06 위험 항목 스스로 '약 1,138px 로 빠듯, 겹치면 min-[1320px]'라고 적었다. 측정은 로그아웃 상태뿐이고 로그인 상태 우측 묶음(SearchUsageBadge '한도 초과 · 업그레이드' 알약 + 아바타)은 빠졌다. 시작점이 바뀌면 R01 의 studio/class/consulting/page.tsx:36·94 `xl:` 클래스, R05 의 `@media (max-width: 1279px)` 카카오 오프셋, BottomCTABar `hideFrom 'xl'`, R12 보조 헤더를 모두 다시 고쳐야 한다.

**수정안**: R03 의 @theme 에 `--breakpoint-nav`(초기 80rem)를 두고 R01·R05·R06·R12 는 `nav:` 변형과 CSS `@variant` 로만 참조. R01 은 임시값으로 768~1279 겹침만 없애고 '1280 한 줄 표시' 판정은 R06a 로 이관. 시작점은 R06 최종 레시피(1200 컨테이너·Pretendard·결정 3 결과)로 로그아웃·로그인(가장 긴 배지)·125% 확대(1229px)에서 한 번만 실측.

### R05 · risk-understated

지금 확인창은 window keydown Enter 로 확인되고(ConfirmDialog.tsx:44-52) 사용자는 검색창 Enter → 확인창 Enter 로 검색한다(SearchBar.tsx:251-254→230-235, 홈 page.tsx:75-80). R05 는 이 처리를 지우고 'Enter 는 포커스된 버튼만'으로 바꾸면서 초기 포커스를 '첫 버튼(destructive 면 취소)'으로만 적었다. 버튼 순서가 [취소][확인](ConfirmDialog.tsx:89-101)이고 showModal() 도 autofocus 가 없으면 첫 포커스 요소(취소)에 포커스하므로, 문구대로면 두 번째 Enter 가 검색을 취소한다. 완료 기준은 '취소+Enter → 실행 안 됨'만 확인해 이 회귀를 못 잡는다. 덧붙여 `body:has([data-bottom-bar]) [data-kakao-fab]` 는 hideFrom='md' 바(/studio·/incubating)가 768~1279px 에서 숨겨져도 매칭되어 버튼이 88px 떠 있고, 레이어 안에 두면 `bottom-5` 유틸리티에 진다. `backdrop:bg-black/80` 은 컴파일 결과 `var(--color-black)` 을 써서 ::backdrop 이 테마 변수를 상속하지 않는 Safari 17.3 이하에서 투명해질 수 있다.

**수정안**: '비파괴 확인창은 확인 버튼에 autoFocus, destructive 만 취소'를 명시하고 완료 기준에 '검색창 Enter → 확인창 Enter 로 /search?q=…&v=… 이동(현행 동일)'을 추가. 카카오 오프셋은 `data-bottom-bar='md|xl'` 값별 미디어 쿼리 2개로, 레이어 밖에 둔다. 백드롭은 `backdrop:bg-[rgb(0_0_0/0.8)]` 같은 리터럴 값.

### R16 · risk-understated

LimitModal 의 비로그인 가입은 /sign-in 필수 동의 단계를 거치지 않고 바로 OAuth 를 연다(LimitModal.tsx:41-65). 이 단계는 소유자가 1dcb8fb 에서 '/sign-up 은 /sign-in 리다이렉트라 단일 적용으로 양쪽 커버'라며 모든 가입에 걸도록 만든 것이고 마케팅 동의 기록(mkt, 83cce7a)도 이 경로만 빠진다. 또 redirectTo 가 `next=현재 경로(/search?q=…)`(LimitModal.tsx:55)라 가입 직후 서버 검색이 다시 돌아 새 회원의 무료 1회가 확인 없이 차감되고 saveToHistory 를 건너뛴다. 로드맵 2.2 표가 금지한 바로 그 패턴인데 결정 11 기본값(C)이 그대로 남긴다.

**수정안**: 결정 11 의 (나)는 디자인 선택이 아니라 소유자 기존 요구의 복구이므로 질문에서 분리해 기본 적용(가능하면 R02a 로 앞당김): 모달 가입 버튼을 돌아갈 주소 없는 `/sign-in` 으로. (가)·(다)만 질문으로 남긴다. R10 의 redirect 검증에도 '/search 대상이면 q 를 뗀다' 규칙을 추가.

### R18 · constraint-violation

'더보기 실패 시 불러오지 못했습니다 · 다시 시도'를 넣으려면 handleLoadMore 의 catch(SearchResultList.tsx:187-188 '로드 실패 시 조용히 무시')에 상태를 세팅해야 하는데 이 줄은 보호 구간 116-195 안이고 완료 기준은 같은 구간 diff 0 을 요구한다. 게다가 getMoreVideos 는 searchVideos 의 error 를 버리고 항상 `error: null` 을 돌려줘(search/actions.ts:29-41, 불변 조건 4) 쿼터 소진은 빈 결과로 와서 exhausted 처리된다. 보호 구간을 고쳐도 API 실패는 잡히지 않는다.

**수정안**: R18 에서 더보기 실패 안내를 빼거나, 네트워크 예외만 다루는 catch 한 줄을 불변 조건 예외로 소유자 승인 후 진행. 쿼터 소진 표시는 서버 액션 수정이 필요한 별도 보고로 넘긴다.

### R18 · risk-understated

d5a5164(5/23) 커밋 메시지는 YouTube 위반 통지 V.2 가 '디스클레이머만으로는 불가, 독자 계산·파생 지표 표시를 완전히 제거'를 요구했다고 기록한다. 3일 뒤 37c6343·8d7e451·e8c87d5 가 옵트인 형태로 되살렸고 코드 주석도 'ToS III.E.4h 회피'다(SearchResultList.tsx:58-60, KeywordCompetition.tsx:27). 로드맵은 옵트인을 '정책 대응'으로 보고 R18 에서 모바일 카드에 알고리즘 확률을 새로 노출하고(search-04 제안 채택) Great~Worst 를 색으로 더 두드러지게 하며, R17 은 경쟁도를 '72 / 100' 숫자 막대로 바꾼다. API 키 회수 위험이 있는 영역의 노출면을 넓히는데 위험 항목에 없다. 업셀 문구 '알고리즘 탑승 확률'(search/page.tsx:299)도 d5a5164 가 지운 마케팅 표현이다.

**수정안**: R17·R18 의 파생 지표는 '스타일 변환만, 노출 위치·조건·문구 불변'으로 한정하고 모바일 노출 추가는 소유자 결정으로. R02/R16 이 LimitModal·인라인 카드 문구를 다시 쓸 때 '알고리즘 탑승 확률'은 넣지 않고, R09 비교표의 '키워드 경쟁도' 행도 같은 확인을 거친다.

### R06 · factually-wrong

완료 기준 2건과 부수 효과가 코드와 맞지 않는다. (1) Next 메타데이터는 openGraph 를 얕게 덮어써, 자체 openGraph 에 images 가 없는 /pricing(pricing/page.tsx:14-18)·/about·/search·/channels·/threads 는 opengraph-image.tsx 를 지워도 og:image 가 생기지 않는다(system-03 이 /pricing·/about 무이미지를 운영에서 확인). 이 페이지들이 R06 범위에 없어 'curl /pricing og:image = /og-image.png' 는 실패한다. (2) JSON-LD `screenshot: https://bibllab.com/opengraph-image`(layout.tsx:155)가 삭제 후 404 를 가리킨다. (3) '1440 에서 로고 x = 120px'은 `max-w-page px-6`(border-box) 기준 120+24=144px 이다.

**수정안**: 공용 `OG_DEFAULT`(images /og-image.png 1280×720)를 만들어 openGraph 를 가진 페이지 5곳에 spread 하는 작업을 R06 범위에 넣거나 /pricing 기준을 R09 로 옮긴다. JSON-LD screenshot 을 /og-image.png 로 교체. 정렬 기준은 '네비 로고 x = 푸터 로고 x = 섹션 첫 글자 x(1440 에서 144px)'로.

### R06 · risk-understated

지금 모바일 2행은 text-xs·px-2.5·py-1.5(줄 28px)로 390px 에서 2줄, 전체 고정 높이 133px 다(mobile-02). R06 은 h-9·px-3·13px 칩으로 키우는데 결정 4 기본값(B)은 두 줄 모두 sticky 다. 줄 높이만으로 약 149px 가 되고, 칩 폭 합이 늘어 360px 폭(갤럭시 S 기본 모델의 CSS 폭)에서는 3줄로 넘어가 약 190px(화면의 24%)가 된다(글꼴 폭 추정치). shell-05·mobile-02 가 지적한 문제를 키운다. 또 `--nav-h` 를 '결정 4 에 따른 실측값' 하나로 두지만 2행은 폭에 따라 1~3줄로 접혀 단일 값이 될 수 없고, R11·R14 의 `top-[calc(var(--nav-h)+…)]`·scroll-padding 이 일부 폭에서 어긋난다.

**수정안**: 결정 4=B 인 동안은 칩을 h-8(32px, 명세의 칩 하한)·text-xs·px-2.5 로 두어 2줄을 유지하고 360·375·390·768·1024 에서 고정 높이를 완료 기준으로 측정. `--nav-h` 는 작은 클라이언트 잎이 ResizeObserver 로 html 에 써 넣거나, 결정 4=A(1행 56px 만 고정)를 칩 확대의 선행 조건으로.

### R06 · too-big

한 항목이 불변 조건 2 대상인 루트 레이아웃 전체를 다시 쓴다: NavLink·next/link 전환·컨테이너·NavUser/배지 재조회·모바일 2행·--nav-h·건너뛰기 링크와 content 래퍼·body flex·푸터 재구성·OG/manifest/icon·NavigationLoader 10건에 결정 3건이 걸린다. 회귀 시 원인 분리가 어렵고, 'pathname 변경 시 /api/usage 재조회'는 next/link 로 클라이언트 이동이 생기는 이 항목에서 메뉴 클릭마다 인증+Redis 호출을 늘린다(성능 기준선 메모와 반대 방향).

**수정안**: R06a(네비: NavLink·next/link·컨테이너·현재 위치·건너뛰기 링크·로더의 /api 예외), R06b(푸터·OG·manifest·icon·JSON-LD), R06c(모바일 2행·--nav-h, 결정 4 답 이후)로 나누고 각각 빌드 표·인증 grep 확인. 배지 재조회는 /search 이탈 때나 검색 완료 이벤트에서만.

### R02 · factually-wrong

'최적 요일·시간을 recentVideos 로 브라우저에서 계산'은 /my-channel 구조와 맞지 않는다. 이 페이지는 ?channel= 이 있으면 서버에서 analyzeChannel 을 돌리고(my-channel/page.tsx:20-33) 'use client' ChannelDashboard 를 SSR 한다(:62). 렌더 중에 getHours() 로 계산하면 서버(Vercel UTC)와 브라우저(KST) 값이 달라 하이드레이션 텍스트 불일치로 루트가 클라이언트 렌더로 떨어지고, useEffect 로 미루면 '-' 에서 값으로 깜빡인다. 기존 요일 히트맵도 렌더 중 getDay() 를 써 같은 잠재 결함이 있다(ChannelDashboard.tsx:73). 해외 시간대 브라우저는 또 다른 값을 본다.

**수정안**: `Intl.DateTimeFormat` 에 `timeZone: 'Asia/Seoul'`(hourCycle h23, weekday)을 지정해 서버·클라이언트가 같은 값을 내도록 계산하고 히트맵도 같은 함수로. 완료 기준에 '콘솔 hydration 경고 0'을 추가.

### R02 · too-big

검색 시작 화면, 홈 모달, LimitModal 문구, 채널 정렬의 서버→클라이언트 이전(신규 ChannelResults·history.replaceState), 상세 돌아가기, 잔여 표시, 내 채널 시간 계산까지 서로 무관한 7건이 한 항목(M)이다. 앞 3건은 불변 조건 1 파일(SearchBar·search/page·홈)이라 diff 검사가 핵심이고, 채널 건은 렌더 구조 변경이라 검토 관점이 다르다. R19 가 같은 ChannelResults 를 다시 크게 고친다.

**수정안**: R02a(검색·홈·LimitModal + 결정 11 나 가입 경로, 불변 조건 1 검사)와 R02b(채널 재차감·돌아가기·잔여 표시·내 채널 시간)로 분리. R02b 의 ChannelResults 는 마크업을 옮기기만 하고 테마는 R19 에서.

### R14 · constraint-violation

R14 는 사이드바 노란 강조(CommunitySidebar.tsx:125 `text-yellow-400`)를 에메랄드로, 레드 원형 N(NewBadge :31-39 `bg-[#E5484D]`, CategoryChips.tsx:46 에서도 사용)을 에메랄드 글자로 바꾸고 완료 기준에서 `yellow-|E5484D` 0건을 요구한다. 둘 다 소유자가 8/14 테마 확정 이후인 8/30 에 명시 요청한 것이다: bdb074a '사이드바 유튜브 인큐베이팅 지원하세요! 노란색 강조', 6df0c2d '좌측 사이드바·모바일 카테고리 칩에 레드 N 배지 (카페 원본 스타일)'. 일반 규칙(원형 배지 금지·단일 액센트)과 충돌하더라도 묻지 않고 뒤집을 대상이 아니며 결정 목록에 없다.

**수정안**: 소유자 결정을 추가(A 확정 규칙대로 교체 / B 유지하고 N 글자만 8px→12px·sr-only '새 글'). 답이 없으면 색·모양은 유지하고 접근성 보정만 하며, 완료 기준 grep 에서 두 줄을 예외로.

### R11 · constraint-violation

결정 7 은 /studio 레드를 '같은 날 되돌릴 때 빠진 것'으로 보고 무응답 시 A(교체)로 간다. 커밋 이력은 의도를 시사한다: 67c2c4e(8/14 12:00) '/studio: 강조색을 톤 다운 레드(#E5484D)로 교체 + 강조 확대', d18a88c(12:13) 기본 구성 문구에 레드 추가, 3c5cbba(12:52)는 밑줄만 흰색으로 되돌리고 본문 레드는 유지, c026103 테마 스윕은 /studio 를 범위에서 뺐고, 6801d40(8/16) 카피 수정 때도 '70만+' 레드를 유지했다. §5 원칙('소유자가 만든 것은 그대로')과도 어긋난다.

**수정안**: 결정 7 기본값을 B(유지)로 바꾸고 근거 문구를 '의도 여부 불명'으로 고쳐 묻는다. 또는 R11 의 레드 변경(:287·441·509·524·547·652·741·762·876)만 답변 대기로 분리.

### R10 · factually-wrong

결정 2 의 '콜백은 이미 next 를 지원해 로그인 폼 한 곳만 바뀐다'는 사실과 다르다. middleware 가 /mypage·/saved·/payment 비로그인 접근을 돌아갈 주소 없이 `/sign-in` 으로 보내므로(middleware.ts:84-87) 질문에 예로 든 마이페이지·결제 화면 복귀는 로그인 폼만 고쳐서는 되지 않고, middleware 는 불변 조건 4 목록에 있다. 돌아갈 주소 이름도 redirect_url(PricingButtons.tsx:38 등)·next(커뮤니티 7곳)·redirect(classroom 2곳) 세 가지다. 또 ?error 를 useSearchParams 로 읽으면 Suspense 없이는 정적 /sign-in 이 CSR 로 떨어지거나 빌드가 막힌다(지금은 window.location 사용, SignInForm.tsx:61).

**수정안**: 결정 2 의 범위를 '로그인 폼 + middleware 의 redirect_url 부착(불변 조건 4 예외 필요)'으로 고쳐 묻거나 middleware 를 건드리지 않는 범위(커뮤니티·요금제)로 좁힌다. 세 파라미터를 모두 읽도록 명시하고 ?error 는 window.location 또는 Suspense 로.

### R08 · factually-wrong

완료 기준 '여섯 경로 정적(○) 유지'는 시작 상태와 다르다. 허브는 페이지 안에서 auth() 를 부르고(trend-search/page.tsx:17-28) auth() 는 cookies() 를 쓴다(lib/supabase/server.ts:5). Next 14.2 는 try/catch 로 감싸도 `store.revalidate = 0` 을 먼저 세팅하므로(node_modules/next/dist/server/app-render/dynamic-rendering.js:123) /trend-search 는 지금 동적(ƒ)이다.

**수정안**: 기준을 '/trend-search 는 시작과 같은 ƒ, 나머지 다섯은 ○'로 고치거나, 잠금 표시를 /api/usage 를 읽는 클라이언트 잎으로 옮겨 허브를 정적화(성능 기준선의 공개 페이지 정적 방향)하고 기준을 ○ 로.

### R08 · risk-understated

R08 이 참조하는 결정 14 의 권장안 A 에 함정 두 개가 있다. (1) /tools/calculator 는 e8c87d5 에서 'ToS III.E.4h 대응용 사용자 자가 계산기'로 만들어 사이트맵에만 두고 내부 링크를 걸지 않은 파생 지표 4종 계산 도구다. 허브 카드로 노출하면 R18 과 같은 정책 위험이 커지는데 결정 이유에 없다. (2) '/tmklab-site 는 /studio 로 리다이렉트': middleware 가 tmklab.com 의 모든 경로를 /tmklab-site 로 rewrite 하므로(middleware.ts:16-25) 상대 경로 리다이렉트는 tmklab.com/studio → 다시 /tmklab-site 로 무한 반복되고, 절대 경로로 보내도 결정 1 기본값(C)에서는 StudioGuard 가 쿠키 없는 방문자를 bibllab 홈으로 보낸다(StudioGuard.tsx:9-16).

**수정안**: 결정 14 에서 계산기 노출을 정책 확인 조건부로 분리하고, tmklab 은 'https://bibllab.com/tmkstudio(쿠키 설정 후 /studio)로 절대 경로 이동, middleware 수정 필요(불변 조건 4 예외)'를 명시해 결정 1 과 묶어 묻는다.

### R11 · factually-wrong

'미사용 상수(:137-250) 삭제'의 범위가 틀렸다. 127-196 의 CHANNELS 는 445행에서, 197 의 BIBL_CHANNEL 은 843·847·855행에서 쓰인다. 실제 미사용은 FEATURES(199)·REVIEWS(234)·FAQS(243-250)뿐이다. 또 완료 기준 '결정 7=A 면 E5484D 0건'은 결정 6 기본값(B, 마감임박 알약 유지)이면 951행 레드 글자가 남아 성립하지 않는다(유지 시 색이 정해져 있지 않음).

**수정안**: 삭제 범위를 199-250 으로 고치고, 결정 6=B 일 때 알약 글자색(예: neutral-300)을 명시하거나 완료 기준에서 951행을 예외로.

### R11 · wrong-order

R11 은 PROCESS·FAQ 에 `sticky top-[calc(var(--nav-h)+2rem)]`를 쓰지만 --nav-h 는 R06 이 만든다. 의존이 R03·R04·R05 뿐이라 R06 전에 진행하면 변수가 없어 calc 가 무효가 되고 sticky 가 동작하지 않는다. 또 공수 L 의 전환 장치(챕터 CTA·가격 카드 CTA·하단 CTA)는 결정 1 기본값(C)에서 일반 방문자가 도달할 수 없는 페이지에 들어간다.

**수정안**: R11 의존에 R06 추가. R11a(금지 패턴·모바일 깨짐·첫 화면·성능)와 R11b(전환 CTA·가격 카드, 결정 1·7 답 이후)로 분리.

### R12 · factually-wrong

'상세 layout.tsx 의 og·twitter image 삭제 → 사이트 /og-image.png'는 성립하지 않는다. studio/class/consulting/layout.tsx:21-43 은 openGraph·twitter 객체를 따로 갖고 있어 images 만 지우면 부모 값이 상속되지 않고(얕은 덮어쓰기) og:image·twitter:image 가 아예 없어진다.

**수정안**: images 를 지우지 말고 `https://bibllab.com/og-image.png`(1280×720)로 교체하고, 완료 기준에 'curl /studio/class/consulting 의 og:image = /og-image.png'를 추가.

### R12 · constraint-violation

요약 카드가 '20명 소수 정예·평균 3개월 대기'를 첫 화면 HTML 로 올린다. 이미지 속 문장이라도 HTML 로 옮기면 검색 결과·미리보기에 노출되는 확인 불가 희소성 주장이 된다. 로드맵은 같은 이유(landing#12 without fabricated scarcity)로 /studio '마감임박'을 결정 6 에 올렸는데 이 문구는 묻지 않는다.

**수정안**: 이 줄을 결정 6 대상에 추가하고, 답이 없으면 요약 카드에서 빼고 이미지 속에만 둔다.

### R14 · risk-understated

'레이아웃이 이미 조회한 stats 를 props 로'라는 전제가 다르다. 커뮤니티 레이아웃은 비로그인이면 통계를 기다리지 않고 게이트만 그리도록 일부러 짜여 있다(layout.tsx:32-53 주석). getCommunityStats 는 React cache 만 쓰는 exact count 2건(communityDb.ts:488-494)이라 게이트에 숫자를 넣으면 모든 비로그인 /community 요청이 count 두 번을 기다리게 된다.

**수정안**: 게이트의 '멤버 N명 · 글 N개' 줄을 Suspense 안 작은 서버 컴포넌트로 스트리밍하거나 숫자 없이 출시. 완료 기준에 비로그인 /community TTFB 를 시작 대비 비교.

### R16 · other

범위 파일 누락. /search 툴바의 채널 리포트·영상 수집·채널 제거 버튼은 ActionButton(search/_components/SearchActionButtons.tsx:9-21, gray 4곳)이 그리고 아이콘은 이모지 문자열 prop 이다(search/page.tsx:341·355·367 의 📊📥🗑). R16·R18 어느 범위에도 이 파일이 없어 '범위 파일 grep 0건'으로 잡히지 않고, 이모지를 SVG 로 바꾸려면 icon 타입부터 바꿔야 한다.

**수정안**: R16 범위에 SearchActionButtons.tsx 를 추가하고 icon prop 을 ReactNode(R04 icons)로 변경.

### R16 · other

ToolTabs 는 '허브 TOOLS 와 같은 목록, 잠금은 배지 + 글자'인데 허브 판정은 Free 도 쓸 수 있는 채널 찾기(1회/일)와 제한 없는 채널 분석을 Starter+ 잠금으로 본다(trend-search/page.tsx:47·59, 결정 9). 결정 9 기본값(C)에서 이 틀린 잠금이 /search·/channels·/my-channel·/saved 상단에 반복되고, 무료 사용자가 /channels 를 쓰는 화면의 탭이 '잠금'으로 보인다.

**수정안**: 결정 9 답 전에는 ToolTabs 에 잠금 배지를 넣지 않거나, PLANS 의 canChannelSearch·dailyChannelSearchLimit 로 실제 정책을 표시한다고 R16 에 명시.

### R16 · unverifiable

보호 구간이 원본 줄 번호(SearchBar 10-60·166-195·219-249, search/page.tsx 43…397)로만 정의돼 있다. 항목마다 로컬 커밋을 하므로 R02 커밋 뒤 R16 의 `git diff`(HEAD 기준)에서는 번호가 어긋난다. 예: R02 가 374행에 시작 상태 블록을 넣으면 397행 key 가 밀리고 R16 이 205-211·369행을 지우면 다시 밀린다. SearchBar 10-60 에는 국기 이모지 배열 REGIONS(15-21)가 들어 있어 공통 기준 2.1 #4(이모지 0)와도 충돌한다. R07 은 홈 40-73 을 다른 파일로 옮기는데 '글자 그대로'를 확인할 방법이 없다(R18·R22 동일).

**수정안**: R01 전에 기준 커밋을 태그하고 check-invariants 스크립트(saveToHistory·executeSearch·navigateFromHistory·handleLoadMore·홈 trySearch 본문과 SearchResultList key 식을 추출해 해시 비교)를 만들어 모든 항목 완료 기준에서 실행. REGIONS 는 보호 대상에서 빼거나 국기 이모지를 예외로 명시.

### R16 · constraint-violation

R16 FilterTab 활성 'bg-white text-black', R19·R20 '틸 활성 → 흰 필'은 R04 chip.ts(선택 = neutral-800 면 한 단)·tabs.ts(밑줄)와 다르고 1.1 확정값 '흰 면은 폴드당 1개'에 걸린다. /channels 에서는 흰 검색 버튼(primary)과 흰 활성 탭이 한 화면에 둘이 된다.

**수정안**: 앱 내부 활성 상태를 R04 의 aria-pressed/aria-current 레시피(neutral-800 + 흰 글자) 또는 밑줄 탭으로 통일하고 R16·R19·R20 에서 '흰 필' 문구를 삭제.

### R19 · risk-understated

채널 상세 유튜브 버튼은 지금 bg-red-600(v4 oklch 57.7%) + 흰 14px 글자로 대비 4.76:1 이다([channelId]/page.tsx:331). R19 의 '#FF0000'으로 바꾸면 4.0:1 로 AA(4.5:1) 미달이 되며 ux-rules 5.6 brand 행이 같은 경고를 적어 두었다. R18 VideoModal 도 '#FF0000(또는 흰 버튼)'이다.

**수정안**: 유튜브는 secondary 버튼 + 빨간 로고 SVG(ux-rules 5.6 권고)로 하거나 red-600 을 유지. 완료 기준에 대비 4.5:1 이상.

### R19 · scope-creep

신규 링크 '업로드 패턴 분석 보기(/my-channel?channel=)'는 누를 때마다 서버에서 analyzeChannel 이 돌아(my-channel/page.tsx:26-33) search.list 2회를 쓴다. /my-channel 은 로그인·횟수 제한이 없고(channels 부록 C) 로드맵 스스로 쿼터 위험으로 제외 목록에 올렸는데, 모든 채널 상세에 진입로를 새로 만든다.

**수정안**: 서버 쪽 제한(별도 보고)이 생기기 전까지 이 링크를 빼거나 결정 14 와 함께 소유자에게 묻는다.

### R09 · risk-understated

PricingNotice 가 '?error=… 과 토스 message 를 읽어' 레드 배너(role=alert)에 넣는다. message 는 URL 쿼리라 누구나 bibllab.com/pricing?error=payment&message=… 링크로 공식 경고 상자 안에 임의 문장(연락처 등)을 띄울 수 있다. 결제 화면은 이미 error 값별 고정 문장만 쓰고(payment/page.tsx:28-32), R20 도 '서버 임의 문자열을 그리지 않는다'를 원칙으로 둔다.

**수정안**: error 값별 고정 문장만 표시하고 토스 code 는 알려진 값만 한국어로 매핑, message 원문은 쓰지 않는다.

### R09 · other

비로그인 유료 플랜 클릭을 sessionStorage 에 저장해 '로그인 뒤 /pricing 에 오면' '결제 이어서 하기'를 보여 준다. 결정 2 기본값(B)에서는 로그인 뒤 항상 /search 로 간다(SignInForm.tsx:63 next=/search). 사용자가 스스로 /pricing 에 돌아오지 않으면 복원은 보이지 않고, 완료 기준도 이 흐름을 검사하지 않는다.

**수정안**: 저장된 plan 이 있으면 /search 시작 상태(R02)나 네비 아래에 '선택하신 플랜 결제를 이어서 하기' 한 줄을 띄우거나, 이 기능을 결정 2=A 일 때만 적용. 완료 기준에 흐름 추가.

### R09 · other

R09 는 Pro 의 흰 '추천' 배지(PricingCards.tsx:185-191)를 카드 안 에메랄드 글자로 바꾼다. 이 흰 배지는 소유자 승인 스윕 c026103('Pro 추천 배지 화이트')의 결과이고, 로드맵 근거 문서 ux-rules 1장 (나)도 '추천 플랜은 현재처럼 화이트 테두리 + 화이트 배지 + 화이트 CTA'라고 적었다. 두 명세가 다른데 묻지 않고 reference-design 쪽을 골랐다.

**수정안**: 흰 배지를 유지하고 테두리·면만 조정하거나, 결정 항목에 추가해 묻는다.

### R21 · factually-wrong

ReferralApply 변경 두 가지가 실제 동작과 어긋난다. (1) '응답 성공 시에만 쿠키 삭제'로 바꾸면 already_referred·invalid_code·self_referral 같은 영구 실패(400, api/referral/route.ts:61-69) 때 쿠키가 1시간(auth/callback/route.ts:78-80 maxAge) 남아 페이지를 새로 열 때마다 POST 가 반복된다. (2) 새 문구 '초대 보너스 무료 검색 3회가 추가되었습니다'는 사실과 다르다. 보너스는 만료 없는 ref:bonus 로 무료 플랜의 하루 한도에 매일 더해지고(route.ts:75-77, searchLimit.ts:194-197) 유료 플랜에는 적용되지 않는다.

**수정안**: 2xx·4xx 는 쿠키 삭제, 네트워크 오류·5xx 만 유지. 문구는 '무료 플랜 하루 검색 한도가 3회 늘었습니다'처럼 동작대로(결정 8 범위 확인).

### R15 · risk-understated

등록·취소 줄을 `sticky bottom-0` 으로 두지만 BottomCTABar(data-bottom-bar)를 쓰지 않아 R05 의 카카오 오프셋이 적용되지 않는다. 카카오 버튼(fixed bottom-5 right-5, 56px, KakaoChatButton.tsx:13)이 모바일에서 오른쪽 등록 버튼을 덮는다(class-03 과 같은 구조).

**수정안**: 등록 줄에 data-bottom-bar 를 달거나 BottomCTABar 를 재사용하고, 완료 기준에 '390 에서 등록 버튼과 카카오 버튼 getBoundingClientRect 겹침 0'을 추가.

### R22 · too-big

check-theme 스크립트가 마지막 항목에서야 생기고, 그 스크립트에 걸릴 실사용 파일 중 R01~R21 범위에 없는 것이 있다: SearchActionButtons.tsx(gray·이모지), LikeButton.tsx:121(액센트 리터럴), CommunityTabs.tsx:58, community/about/page.tsx:81(R14 범위 페이지인데 파일 누락), channels/[channelId]/_components/DescriptionToggle.tsx:14(gray), incubating/page.tsx:50·53 의 `bg-[#00E5A0]/10` 배지, PostContent.tsx:37 링크 `text-[#00E5A0]`. 또 em-dash 143건 중 114건이 주석이고 나머지 일부는 API 라우트(keyword-insight LLM 프롬프트, 메일 제목)라 단순 grep 이면 '0건'이 불가능하거나 불변 조건 4 를 건드리게 된다. 여기에 전 라우트 4폭 캡처·axe·문서 이전까지 공수 M 에 묶였다.

**수정안**: check-theme·check-invariants 를 R00(또는 R03)에서 만들어 항목마다 실행하고, 주석과 src/app/api/** 는 제외. 위 파일을 R13·R14·R15·R16·R19 범위에 배정하고 R22 는 최종 QA·문서만.

### R22 · factually-wrong

'남은 outline-none → outline-hidden + INPUT 포커스'는 Tailwind 4.1.18 에서 의도대로 그려지지 않는다. 프로젝트 Tailwind 로 직접 컴파일하면 outline-hidden 은 `--tw-outline-style: none; outline-style: none` 을 세팅하고 focus-visible:outline-1 은 `outline-style: var(--tw-outline-style)` 이라 같은 요소에 두면 외곽선이 없다. base 레이어의 전역 :focus-visible 링도 유틸리티 outline-hidden 에 진다. 완료 기준 '포커스는 모두 에메랄드 2px'가 실패한다(R20 의 테두리 포커스는 영향 없음).

**수정안**: outline-none/outline-hidden 을 지우고 전역 링이나 INPUT 레시피에 맡기거나, 남겨야 하면 focus-visible:outline-solid 를 함께 쓴다. R04 field.tsx 에 outline 숨김 클래스를 섞지 않는다고 명시.

### R03 · unverifiable

(1) 'Windows 크롬에서 h1 굵기 900'은 이 환경(macOS, Playwright+시스템 크롬)에서 확인할 수 없다. (2) 공통 기준 '인증 grep 결과가 97행 주석뿐'은 R03 의 viewport export·R07 의 canonical 삭제(56-58행)로 줄 번호가 바뀐다. (3) 전역 keep-all 은 표·그리드의 min-content 를 키워 앱 화면(채널 표 channels/page.tsx:320, 검색 그리드, 마이페이지 결제 표)을 넓힐 수 있는데 완료 기준은 마케팅 3페이지만 본다. (4) AnimationObserver 가 html 에 단 data-motion 을 언마운트 때 지우지 않으면 R06 의 클라이언트 이동으로 /studio 에 다시 들어올 때 첫 화면 요소가 잠깐 숨는다.

**수정안**: (1) `getComputedStyle(h1).fontWeight==='900'` + document.fonts.check 로 대체. (2) '주석 줄 외 0건'으로. (3) /search·/channels·/mypage 390·1024 scrollWidth 검사 추가. (4) cleanup 에서 속성 제거.

### R18 · unverifiable

'1440 /search?q=캠핑: 한 화면 영상 행 8개 이상'은 뷰포트 높이가 없다. R17 기준(첫 결과 행 y ≤ 450px)과 R18 행 높이(썸네일 128px 폭 → 72px + py-3 ≈ 96px)를 합치면 1440×900 에서 약 4~5행이고 8행에는 약 1,220px 높이가 필요하다.

**수정안**: 뷰포트(예: 1440×900)를 명시하고 '첫 화면 4행 이상' 또는 '행 높이 ≤ 96px'처럼 측정 가능한 값으로 바꾼다.

### R18 · factually-wrong

제외 근거 두 개가 코드와 다르다. (1) '검색 결과 가상화: 최대 200행이라 충분'은 틀렸다. resultLimit 은 pro 500·business 1000·admin 9999(lib/stripe.ts:81·100·140)이고 '50개씩 보여 주기'는 /saved 에만 있다. (2) '미사용 파일 UpgradeModal·ColHeader 는 변환하지 않는다'고 했지만 둘은 파일이 아니라 R18 범위 파일 안의 죽은 코드다(VideoCard.tsx:36 의 UpgradeModal 은 setShowUpgradeModal(true) 호출 0건, SearchResultList.tsx:295 ColHeader 는 사용 0건). gray·teal·purple 클래스가 있어 R18 완료 기준 '범위 파일 grep 0건'과 충돌한다.

**수정안**: 결과 행에 의존성 없는 `@utility content-auto`(content-visibility:auto, ux-rules 5.2)를 적용하거나 표시만 50행 단위로 끊는다(누적 상태는 그대로). 죽은 UpgradeModal·ColHeader 는 R18 에서 삭제한다고 명시.

## 누락 (7건)

- **[높음] 불변 조건 자동 검사와 기준 커밋을 R01 전에 만드는 단계(R00)가 없다**: 보호 구간이 원본 줄 번호로만 정의돼 항목별 커밋 뒤에는 어긋나고, check-theme 도 R22 에서야 생긴다. 시작 커밋 태그, 보호 함수 본문 해시 비교(check-invariants), 주석·src/app/api 를 뺀 check-theme, 빌드 표(○·●·ƒ) 기록을 먼저 만들어 모든 항목 완료 기준에서 돌려야 R01~R21 이 검증 가능해진다.
- **[높음] P0 studio-01 이 무응답 기본값(결정 1=C)에서 그대로 남는다**: 로드맵은 '기본 동작은 다른 항목을 막지 않는다'고 하지만 C 면 R06 이 새로 만드는 next/link 네비·푸터, 커뮤니티 대행 링크, 컨설팅 '← 스튜디오'가 계속 일반 방문자를 StudioGuard 로 홈에 보낸다(StudioGuard.tsx:9-16). 메뉴를 /studio 로 바꾼 4105a90(8/30)이 4월의 가드(8e6db8d)를 모른 채였을 가능성이 커서, P0 인 결정 1 은 R06·R11 착수 전 차단 결정으로 받아야 한다.
- **[중간] 검색·채널 화면의 등급 색 의미 충돌을 정리하는 항목이 없다**: /channels 는 빨강을 '높음'으로 쓰고(lib/youtube.ts:157-160 1.5배 이상 red-400, channels/page.tsx metricColor), /search 알고리즘 확률은 빨강이 Worst 다(VideoCard.tsx:32). search-05 가 오케스트레이터에게 하나로 정하라고 요청했는데 R18 은 Worst red-400, R19 는 보라·빨강·주황 등급 유지 + 범례로 두 의미를 모두 남긴다. ux-rules 7.3(기능색은 뜻이 하나일 때만 유지)에 어긋난다.
- **[중간] class-01(P1) 블랙맵 상세의 안전한 기본값이 없다**: 결정 13=C 면 신청 404·영상 0개·고정 342명·4.8점 페이지가 index,follow 로 남는다. 화면을 바꾸지 않는 generateMetadata robots noindex 와 버튼 조사 오류('297,000원로', CourseEnrollButton.tsx:57) 수정은 무응답이어도 적용할 수 있는 최소 조치다.
- **[중간] 플랜·구독 상태별 완료 기준을 확인할 계정이 없다**: 검증은 '운영 사이트를 소유자 크롬으로'인데 캡처 자료(before-auth/INDEX.md)상 소유자 계정은 운영자 플랜이다. R01 해지 구독·team 표시, R09 Pro '현재 플랜', R16 무료 배너, R20 만료 토큰, R21 초대 보너스는 이 계정으로 재현할 수 없다. 소유자가 플랜을 바꾼 테스트 계정을 준비하거나 해당 컴포넌트를 고정 데이터로 렌더해 캡처하는 방법을 항목별로 정해야 한다.
- **[중간] JSON-LD 고정 평점 4.8·리뷰 47 이 기본값(결정 6=B)에서 남는다**: layout.tsx:186-192 의 aggregateRating 은 근거를 확인할 수 없는 고정값으로 모든 페이지에 출력된다. 화면에는 보이지 않아 제거해도 디자인 영향이 없고 구조화 데이터 정책 위험만 줄어든다. 결정 6 과 분리해 aggregateRating 만 빼는 것을 기본값으로 제안할 만하다.
- **[낮음] home-04(P1 결과 미리보기)의 후속 항목 번호가 없다**: 제외 사유(R16~R18 뒤 실제 캡처 필요)는 타당하지만 담당 항목이 없어 R22 이후 잊힌다. R18 뒤 R23(예시 키워드 소유자 확인 후 정적 캡처 1장 + 대체 텍스트)으로 등록해 둘 것.

## 순서 조언

1) R00 신설(반나절): 기준 커밋 태그, check-invariants(saveToHistory·executeSearch·navigateFromHistory·handleLoadMore·홈 trySearch 본문 해시 + SearchResultList key 식), check-theme(주석·src/app/api 제외), @theme `--breakpoint-nav` 자리. 같은 시점에 결정 1(P0)·4(R06 칩 크기 좌우)·7(기본값을 B 로 고쳐서)·13(최소 noindex)·14(ToS·tmklab 조건 명시)와 신규 결정(커뮤니티 노란 강조·레드 N, Pro 흰 배지, '20명·3개월 대기')을 한 번에 묻고, 결정 11 의 (나)는 질문에서 빼 기본 적용. 2) 기반: R01(네비는 임시 시작점, 1280 판정은 R06a 로 이관) → R02a(검색 시작 화면·홈 키워드·LimitModal 문구·가입 경로 /sign-in) → R03 → R04 → R05(비파괴 확인창 autoFocus 확인 명시) → R06a(네비·건너뛰기·로더, 시작점 실측) → R06b(푸터·OG 공용 상수·JSON-LD). R06c(모바일 2행·--nav-h)는 결정 4 답 뒤. 3) 공개 페이지: R07 → R09 → R10(결정 2 범위 재질문 뒤) → R08 → R13 → R12a(상세)·R12b(폼) → R11a(금지 패턴·모바일·첫 화면, R06 뒤) → R11b(전환 CTA, 결정 1·7 답 뒤). 4) 커뮤니티: R14 → R15. 5) 앱 내부: R02b(채널 재차감·내 채널 시간, Asia/Seoul 고정)는 R02a 직후 독립 진행 가능, 이후 R16 → R17·R18(파생 지표는 스타일만, /saved 분리) → R19 → R20 → R21. 6) R22 는 남은 파일을 앞 항목에 배정한 뒤 최종 QA·문서만.
