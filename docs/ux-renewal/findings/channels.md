# channels 영역 UX/UI 감사

- 대상: `/channels`, `/channels/[channelId]`, `/my-channel`, `/threads`, `/threads/saved`, `/tmklab-site`, (테마만) `/admin`, `/insights/admin`
- 방법: 담당 파일을 전부 읽었다(admin·insights 는 테마 관점으로 훑음). 스크린샷은 비로그인 데스크톱·모바일(`shots/before/*`)과 로그인 데스크톱(`shots/before-auth/*`)을 직접 확인했다.
- 한계: 로그인 상태 모바일 화면과 "검색 결과가 있는" 화면은 캡처가 없다. 그 부분은 코드로 판단했고 항목에 "코드 기준"이라고 적었다.
- 감사 일자: 2026-10-04 · 읽기 전용(저장소 수정 없음)
- 현재 완성도: **2 / 5**

## 총평

채널 찾기·내 채널 분석·스레드 세 화면은 기능은 돌아가지만 전부 구 남색·틸 테마이고(gray 323건·teal 77건, 15개 파일), 블랙 네비 바로 아래에서 남색 본문이 시작되어 로그인 전후가 다른 서비스처럼 보인다.

테마보다 먼저 고쳐야 할 실제 버그가 있다. 채널 찾기는 정렬 탭·개설일 토글·"돌아가기"를 누를 때마다 검색 횟수가 다시 차감되어, 로그인한 무료 사용자(1회/일)는 탭을 한 번 누르면 한도 초과 화면이 된다. 기본 탭 "영상 평균 조회수 순"은 실제로는 총조회수÷구독자 비율로 정렬·표시한다. 내 채널 분석의 "최적 업로드 시간"은 UTC 기준이라 한국 시간과 9시간 어긋난다.

스레드는 영어 원문 에러가 복구 수단 없이 노출된다. 토큰 갱신 함수가 호출되지 않아 연결 후 60일이 지나면 누구나 이 에러 화면에 도달한다.

동선도 끊겨 있다. `/threads` 는 사이트 어디에도 링크가 없고, 허브는 무료 사용자에게 채널 찾기를 잠금으로 보여 주지만 실제 정책은 1회/일 무료이며, 스레드 수집함은 글을 담을 방법이 없는 탭이다. 모바일에서는 채널 찾기 정렬 탭이 화면 밖으로 잘린다.

`tmklab-site` 는 tmklab.com 용으로 만든 구 랜딩이다. 도메인이 현재 아임웹으로 연결되어 있어 `bibllab.com/tmklab-site` 로만 열리고, 그 상태로는 비블랩 네비까지 깨진다. 재디자인이 아니라 정리(noindex 또는 `/studio` 로 통합) 대상이다.

## 유지할 점

1. **채널 결과 표의 구성.** 순위·채널(썸네일+이름+핸들+토픽 태그)·구독자·핵심 지표를 한 줄에 두고 `tabular-nums` 로 자릿수를 맞추며, 폭이 줄면 영상 수·개설일(md) → 설명(lg) 순으로 접는다(`channels/page.tsx:339-347, 426, 451`). 데스크톱에서는 표 형식을 유지한다.
2. **지표 등급 색(보라 > 빨강 > 주황 > 회색)과 신생 채널 그린.** `/search` 의 성과 배율 색(`lib/youtube.ts:157-161`)과 같은 문법의 기능색이다. 색은 유지하고 범례만 보탠다.
3. **상태를 URL 에 담는 구조**(q·sort·dateOrder, tab, channel). 새로고침과 공유가 된다. 정렬을 클라이언트로 옮기더라도 URL 반영은 유지한다.
4. **내 채널 분석 폼의 처리.** label+htmlFor, 입력 예시, `useTransition` 으로 버튼 비활성+스피너(`ChannelSearchForm.tsx:9-17, 22-27, 36-68`). 채널 찾기 검색에도 같은 패턴을 쓴다.
5. **Threads 연결 카드의 화이트 버튼과 currentColor 로고 SVG**(`ConnectMetaButton.tsx:45-51`, `ThreadsLogo.tsx`). 이미 확정 규칙과 같다.
6. **한도 초과 안내의 사실 서술 문구**(현재 플랜·사용량·초기화 시점, `channels/page.tsx:263-268`)와 임박 앰버·초과 레드 구분. 문구와 시맨틱 색은 유지하고 이모지와 틸 버튼만 바꾼다.
7. **작은 마감들.** 요일별 히트맵의 범례 문구(`ChannelDashboard.tsx:229-231`), 채널 소개 접기/펼치기, CSV 내보내기(BOM 포함 한글 헤더).
8. **안전한 기본값.** 외부 링크 `rel="noopener noreferrer"`, 값 없음 폴백("-"), API 쿼터 소진 시 한국어 안내(`channels/page.tsx:187-191`).

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| channels-01 | P0 | bug | 정렬 탭·개설일 토글·돌아가기를 누를 때마다 검색 횟수가 다시 차감된다 | M |
| channels-02 | P1 | bug | 기본 탭 "영상 평균 조회수 순"의 정렬·표시 값이 이름과 다르다 | S |
| channels-03 | P1 | interaction-feedback | 에러 원문(영어·내부 메시지)이 그대로 노출되고 복구 수단이 없다 | S |
| channels-04 | P1 | mobile | 모바일 채널 찾기: 정렬 탭이 화면 밖으로 잘리고 페이지가 가로로 밀린다 | M |
| channels-05 | P1 | bug | 내 채널 분석 "최적 업로드 시간"이 한국 시간과 9시간 어긋난다 | S |
| channels-06 | P1 | theme-violation | 세 화면 전체가 구 남색·틸 테마 (변환 범위와 기능색 구분) | L |
| channels-07 | P2 | theme-violation | 이모지 24곳, 색 입힌 장식 아이콘, 아이콘 박스가 남아 있다 | M |
| channels-08 | P2 | content-clarity | 첫 화면이 시작을 돕지 못한다 (제목 없음, 같은 설명 3중, 대상 없는 "N회 남음" 2개) | M |
| channels-09 | P2 | navigation-ia | 진입 동선: /threads 는 링크가 없고, 허브 잠금 표기와 실제 동작이 다르다 | M |
| channels-10 | P2 | layout | 채널 상세: 정보가 반복되고 요약이 영상 목록 뒤에 있으며 차트가 없다 | M |
| channels-11 | P2 | navigation-ia | 스레드: 수집함은 채울 방법이 없는 탭이고, 연결 권유가 플랜 잠금보다 먼저 나온다 | M |
| channels-12 | P2 | bug | 수집함 즐겨찾기 필터가 적용되지 않고, 모바일에서는 즐겨찾기를 할 수 없다 | S |
| channels-13 | P2 | interaction-feedback | 채널 검색·정렬에 대기 표시가 없고, 스레드는 기간을 바꾸면 화면 전체가 스피너가 된다 | S |
| channels-14 | P2 | accessibility | 표 3종 마감 불일치: 마우스 전용 정렬 헤더, "v"/"^" 표시, 숫자 단위 혼재, 10px·저대비 글자 | M |
| channels-15 | P2 | bug | /tmklab-site: 쓰이지 않는 구 랜딩이 깨진 상태로 공개되어 있다 | S |

---

## 발견 상세

### channels-01 · P0 · bug · 공수 M
**정렬 탭·개설일 토글·돌아가기를 누를 때마다 검색 횟수가 다시 차감된다**

- 페이지: `/channels`, `/channels/[channelId]`
- 근거
  - `src/app/channels/page.tsx:179-186`: `q` 가 있으면 렌더할 때마다 `incrementChannelCount()` 를 호출한다.
  - `src/app/channels/_components/FilterTabs.tsx:55-58`, `DateSortToggle.tsx:15-26`: 탭과 토글이 `router.push('/channels?q=…&sort=…')` 로 서버를 다시 부른다. 그때마다 위 차감이 다시 일어난다.
  - `src/app/channels/[channelId]/page.tsx:263-288`: "채널 찾기로 돌아가기"가 목록 URL 을 새로 요청한다. 역시 차감된다.
  - `src/lib/youtube.ts:231-235, 361` + `src/lib/cache.ts:29`: 검색 결과는 키워드 단위로 48시간 캐시된다. 정렬을 바꿔도 데이터는 같고 순서만 달라진다.
  - `src/lib/stripe.ts:41`(Free 채널 검색 1회/일), `:61`(Starter 30회/월).
  - `page.tsx:204-206`: 잔여 횟수를 차감 전 값으로 계산한다. `page.tsx:233`: 일 한도 사용자에게도 "이번 달 한도 초과"라고 쓴다(`263` 의 카드는 "오늘"로 맞게 구분함).
  - `[channelId]/page.tsx:263-265`: `from` 파라미터를 검증 없이 링크 주소로 쓰고 `decodeURIComponent` 를 한 번 더 건다.
- 문제
  - 로그인한 무료 사용자는 검색 1회 뒤 정렬 탭을 한 번 누르면 "오늘 채널 검색 횟수를 모두 사용했어요" 화면으로 바뀌고 결과가 사라진다. 채널 상세를 보고 돌아와도 같다. 이 페이지의 핵심 기능인 정렬 3종을 무료 사용자는 쓸 수 없다.
  - Starter 는 검색 1번에 탭 2번, 상세 왕복 1번이면 4회가 줄어든다. 사용자는 이유를 알 수 없다.
  - 잔여 표시가 한 박자 늦다. 방금 쓴 1회가 반영되지 않아 "1회 남음"으로 보이는 상태에서 다음 클릭에 막힌다.
  - `from` 값에 `https://…` 를 넣은 주소를 받으면 "채널 찾기로 돌아가기"가 외부 사이트 링크가 된다. 검색어에 `&`·`#` 이 들어가면 이중 디코딩 때문에 돌아가기 주소가 잘린다.
- 제안 (차감 함수와 한도 정책은 건드리지 않는다. `/search` 의 결과 수 누적 로직과도 무관하다)
  1. 정렬과 개설일 정렬을 클라이언트에서 처리한다. 이미 받은 목록(최대 25개)을 화면에서 재배열하는 일이므로 서버를 다시 부를 이유가 없다. `page.tsx` 는 정렬 전 목록을 클라이언트 컴포넌트에 넘기고, 정렬 상태는 `history.replaceState` 로 URL 에만 반영한다. 탭 전환이 즉시 되고 차감도 일어나지 않는다.
  2. 상세의 돌아가기는 목록에서 넘어온 경우 `router.back()` 으로 복원한다(재검색 없음, 스크롤 위치 유지). 직접 진입이면 `/channels` 로 보낸다. `from` 은 `/channels` 로 시작할 때만 받아들이고 중복 디코딩을 없앤다.
  3. 잔여 표시는 `incrementChannelCount()` 가 돌려주는 `used` 기준으로 계산하고, 일 한도 사용자는 "오늘 한도 초과"로 쓴다.
  4. 확인 필요(UI 범위 밖): 비로그인 차감은 서버 컴포넌트 렌더 중 `cookies().set()` 을 부르는데(`src/lib/channelLimit.ts:175-177`, try/catch 로 감쌈) Next 14 는 여기서 예외를 던진다. 비로그인은 횟수가 기록되지 않아 사실상 무제한이고 배지는 계속 "1회 남음"일 가능성이 높다.

### channels-02 · P1 · bug · 공수 S
**기본 탭 "영상 평균 조회수 순"의 정렬·표시 값이 이름과 다르다**

- 페이지: `/channels`
- 근거
  - `src/app/channels/page.tsx:63-68`: `trending` 정렬은 `viewCount / subscriberCount`(총조회수÷구독자).
  - `page.tsx:356, 433-437`: 셀에는 그 비율을 "N배"로 표시한다.
  - `page.tsx:198-202`: 같은 열의 제목은 "영상당 평균 조회".
  - `FilterTabs.tsx:30-31`(탭 이름·툴팁), `page.tsx:123-124`(빈 상태 설명), `page.tsx:247`("영상당 평균 조회수 기준"): 네 곳 모두 영상당 평균 조회수라고 말한다.
- 문제: 기본으로 열리는 탭에서 열 제목은 "영상당 평균 조회"인데 값은 "312배" 같은 비율이다. 정렬 기준도 설명과 다르다. 데이터 도구에서 라벨과 값이 다르면 표 전체를 믿기 어렵다.
- 제안: 둘 중 하나로 맞춘다(소유자 결정).
  - (권장) 탭 이름대로 맞춘다. 정렬과 표시를 `avgViewsPerVideo`("N회")로 바꾼다. 값은 이미 데이터에 있고 "신생" 탭이 같은 값을 쓰고 있다.
  - 계산을 유지한다면 탭·열·설명을 "조회수/구독자 비율 순"으로 바꾼다. 상세 페이지 칩(`[channelId]/page.tsx:420`)이 이미 이 용어를 쓴다.

### channels-03 · P1 · interaction-feedback · 공수 S
**에러 원문(영어·내부 메시지)이 그대로 노출되고 복구 수단이 없다**

- 페이지: `/threads`, `/my-channel`
- 근거
  - `shots/before-auth/threads.jpg`: 연결된 계정(@bibl_youtube) 아래 붉은 상자에 "Failed to fetch Threads profile" 한 줄만 있다. 버튼이 없다.
  - `src/app/threads/_components/MyAccountDashboard.tsx:129-135, 154-160`: 서버가 준 `message ?? error` 문자열을 그대로 그린다.
  - `src/app/api/threads/insights/route.ts:141-152`: 알 수 없는 예외는 `err.message` 를 그대로 내려보낸다. 출처는 `src/lib/threads.ts:298`("Failed to fetch Threads profile"), `:685`("Failed to fetch user posts: " + Meta 응답 원문).
  - `src/lib/threads.ts:246`: `refreshLongLivedToken` 은 정의만 있고 호출하는 곳이 없다. 장기 토큰은 60일(`:209, 218`)이다.
  - `src/app/threads/page.tsx:91-95`: OAuth 실패 시 URL 의 `detail` 원문을 mono 글꼴로 화면에 찍는다.
  - `src/app/my-channel/actions.ts:92, 301-304` → `my-channel/page.tsx:54-59`: "YouTube API error: 403 …", "YOUTUBE_API_KEY is not set" 같은 내부 메시지가 "분석 실패" 상자에 그대로 나온다.
- 문제: 사용자는 무엇이 잘못됐는지, 무엇을 해야 하는지 알 수 없다. 스레드는 연결 60일 뒤 누구나 이 화면에 도달하는데 "다시 연결" 버튼이 없어 "연결 해제"를 먼저 눌러야 한다는 것을 스스로 알아내야 한다. 만료 문구가 뜨는 경우에도 버튼은 없다.
- 제안 (UI 계층만)
  - 화면에는 서버의 임의 문자열을 그리지 않는다. 알려진 코드(`META_NOT_CONNECTED`, `TOKEN_EXPIRED`)만 한국어 문구로 보여 주고, 그 외에는 기본 문구 "Threads 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."를 쓴다.
  - 에러 상자에 동작을 둔다: 화이트 버튼 "다시 시도"(같은 기간으로 재요청), 테두리 버튼 "다시 연결하기"(`/api/threads/auth`). 루트 `error.tsx` 의 버튼 조합(화이트 + 중립)과 같은 형태로 맞춘다. 상자에 `role="alert"`.
  - OAuth `detail` 은 화면에 표시하지 않는다(서버 로그에 이미 남는다).
  - 내 채널 분석은 "채널을 찾을 수 없습니다…" 등 준비된 한국어 문구만 보여 주고, 나머지는 기존 기본 문구 "채널 분석 중 오류가 발생했습니다."로 대체한다.

### channels-04 · P1 · mobile · 공수 M
**모바일 채널 찾기: 정렬 탭이 화면 밖으로 잘리고 페이지가 가로로 밀린다**

- 페이지: `/channels`
- 근거
  - `shots/before/channels-mobile-01.png`: 세 번째 탭이 "신…"에서 잘려 있다.
  - `FilterTabs.tsx:61, 69`: 필 그룹이 `inline-flex` + `whitespace-nowrap` 이고 줄바꿈·스크롤 처리가 없다. 탭 3개 합계 약 510px(스크린샷 실측 160+146+190)인데 본문 폭은 358px 이다. 상위에 overflow 처리가 없어 페이지 자체가 가로로 스크롤된다.
  - `page.tsx:217, 223`: 사용량 배지가 `hidden sm:flex` 라 모바일에서는 남은 횟수가 보이지 않는다.
  - `page.tsx:246-252`: 정렬 기준 설명이 `hidden md:block`, 탭 설명은 hover 툴팁(`FilterTabs.tsx:79-93`)이라 터치 기기에서는 볼 방법이 없다.
  - (코드 기준) `page.tsx:319-320, 369, 401`: 결과 표의 최소 폭이 약 520px(순위 48 + 채널 최대 296 + 구독자 87 + 지표 102)이라 핵심 수치 두 열이 화면 밖에서 시작한다.
- 문제: 세 번째 정렬("신생 채널")은 페이지를 옆으로 밀어야 누를 수 있고, 페이지가 좌우로 흔들린다. 모바일 사용자는 남은 횟수를 모른 채 한도 화면을 만난다.
- 제안
  - 탭 그룹을 자체 가로 스크롤 영역에 넣는다(`overflow-x-auto` + 이미 있는 `.scrollbar-hide`, 좌우 여백은 `-mx-4 px-4`). Vercel 레퍼런스의 모바일 탭 필 처리와 같다. 페이지 가로 스크롤이 사라진다.
  - 사용량 배지는 모바일에서 검색창 아래 한 줄 글자로 보여 준다.
  - 정렬 기준 한 줄 설명을 모바일에도 노출한다(툴팁 대체).
  - 결과는 md 미만에서 행 카드로 바꾼다: 1행 썸네일+이름+핸들, 2행 "구독자 · 핵심 지표". 최소 조치로는 순위 열 숨김, 셀 패딩 축소, 이름 최대 폭 140px.

### channels-05 · P1 · bug · 공수 S
**내 채널 분석 "최적 업로드 시간"이 한국 시간과 9시간 어긋난다**

- 페이지: `/my-channel` (같은 원인: `/threads` 연속 기록)
- 근거
  - `src/app/my-channel/actions.ts:247, 259`: 서버에서 `new Date(publishedAt).getDay()/getHours()` 로 요일·시간을 뽑는다. Vercel 함수는 리전(icn1)과 무관하게 UTC 로 동작한다.
  - `src/app/my-channel/_components/ChannelDashboard.tsx:154-158`: 그 값을 "N시 업로드 시 조회수 높음"으로 표시한다.
  - `ChannelDashboard.tsx:73`: 같은 화면의 요일 히트맵은 브라우저 시간대로 다시 계산한다. 카드와 히트맵이 서로 다른 시간대를 쓴다.
  - `src/app/api/threads/insights/route.ts:65, 73, 86-89`: 스레드 연속 기록과 최근 30일 칸도 UTC 날짜로 묶는다.
- 문제: 18시(KST)에 올린 영상이 "9시 업로드"로 집계된다. 화면의 핵심 인사이트 한 줄이 틀리고, 사용자는 이를 믿고 업로드 시간을 정할 수 있다. 영상이 없는 채널은 "0시 업로드 시 조회수 높음"이 나온다.
- 제안
  - UI 계층에서 해결할 수 있다. `ChannelDashboard` 가 이미 `recentVideos` 로 요일 집계를 브라우저에서 하고 있으므로, 최적 요일·시간도 같은 자리에서 계산해 카드에 쓴다(서버 값은 표시하지 않음).
  - 카드 보조 문구에 표본을 밝힌다: "최근 30개 영상 기준". 영상이 없으면 "-".
  - 스레드 연속 기록은 서버 계산이므로 KST 기준으로 바꿀지 소유자 확인 후 처리.

### channels-06 · P1 · theme-violation · 공수 L
**세 화면 전체가 구 남색·틸 테마 (변환 범위와 기능색 구분)**

- 페이지: `/channels`, `/channels/[channelId]`, `/my-channel`, `/threads`, `/threads/saved` (후순위: `/admin`, `/insights/admin`)
- 근거
  - 클래스 집계: channels `gray-` 105·`teal-` 26, my-channel `gray-` 57·`teal-` 12, threads `gray-` 161·`teal-` 39. `neutral-` 0건, `#00E5A0` 0건.
  - `shots/before-auth/channels.jpg`, `my-channel.jpg`, `threads.jpg`: 블랙 네비 아래 남색 본문과 틸 버튼·탭.
  - 틸 채움 버튼: `ChannelSearchBar.tsx:40`, `ChannelSearchForm.tsx:41`, `channels/page.tsx:271`, `threads/page.tsx:110, 140, 167`, `PostPerformanceTable.tsx:101`, `SavedThreadsList.tsx:235`, `threads/saved/page.tsx:23, 38`.
  - 틸 활성 상태: `FilterTabs.tsx:71`, `DateSortToggle.tsx:42`, `ThreadsTabNav.tsx:47`, `MyAccountDashboard.tsx:181`.
  - 하드코딩 색: `ProfileViewsChart.tsx:41-70`, `ChannelDashboard.tsx:216-217`.
  - 대비: `text-gray-600` on `gray-900` 2.35:1, `text-gray-700` on `gray-900` 1.72:1.
- 문제: 확정된 규칙(블랙 배경, neutral, 화이트 CTA, 틸 금지)과 전부 어긋난다. 변환 시 기능색까지 지우면 표의 의미가 사라지므로 구분이 필요하다.
- 제안: 부록 A 의 매핑대로 변환한다. 순서는 채널 찾기 목록·상세 → 내 채널 분석 → 스레드 → admin·insights admin(운영자 전용, 클래스 일괄 치환만).
  - 바꾸는 것: 배경·카드·테두리·회색 글자, 틸 버튼(→ 화이트 버튼 / 보조는 테두리 버튼), 틸 활성 탭(→ 화이트 필 또는 화이트 밑줄), 틸 강조 글자, 포커스 테두리(→ focus-visible 링), 차트·히트맵의 틸(→ #00E5A0 계열).
  - 유지하는 기능색: 지표 등급(보라·빨강·주황·회색), 신생·상승 그린, 하락·에러 레드, 한도 임박 앰버, 즐겨찾기 별 앰버, 유튜브 브랜드 레드.
  - 정보를 담은 `gray-600`·`gray-700` 글자는 1:1 치환하지 말고 `neutral-500` 이상으로 올린다(1:1 치환 시 `neutral-600` on `neutral-900` 은 2.29:1).
  - 밝은 에메랄드 칸 위의 글자는 검정으로 쓴다(흰 글자 대비 1.65:1).

### channels-07 · P2 · theme-violation · 공수 M
**이모지 24곳, 색 입힌 장식 아이콘, 아이콘 박스가 남아 있다**

- 페이지: `/channels`, `/channels/[channelId]`, `/my-channel`, `/threads`, `/threads/saved`
- 근거
  - 이모지: `channels/page.tsx:218(✨), 232(🚫⚠️📺), 262(🚫), 302-303(📅), 311(🌱), 389(📺)`, `[channelId]/page.tsx:191-192(👍💬), 223(⚠️), 250-251(🚀📈), 303(📺), 397·403·409·419(📈🎯📅🔥)`, `threads/saved/page.tsx:33(🔒)`, `SavedThreadsList.tsx:172(📭), 303(📝)`.
  - 색 입힌 장식 아이콘: `channels/page.tsx:118(주황), 128(파랑), 137(초록)`, `MyAccountDashboard.tsx:82(주황), 195(틸), 234(노랑), 265(보라)`.
  - 아이콘 박스·원: `my-channel/page.tsx:67`, `threads/page.tsx:102-104, 132, 159`, `ConnectMetaButton.tsx:19, 38`.
  - 아이콘 불일치: 빈 상태의 "신생 채널" 카드는 마이크 아이콘(`channels/page.tsx:137-139`), 같은 항목의 탭은 반짝이 아이콘(`FilterTabs.tsx:20-24`). `shots/before-auth/channels.jpg` 에서 확인.
  - 의미 없는 노랑: 응원 문구(`MyAccountDashboard.tsx:95`), "60점 이상" 수치(`SavedThreadsList.tsx:194`).
- 문제: 소유자가 반복해서 걷어낸 패턴(아이콘 박스, 컬러 장식)이 이 영역에만 남아 있다. 이모지는 OS 마다 다르게 보이고 국가 깃발 이모지는 Windows 에서 글자("KR")로 나온다.
- 제안
  - 이모지를 모두 없앤다. 사용량 배지는 글자만, 한도·에러 카드는 아이콘 없이 제목+설명+버튼, 썸네일 폴백은 빈 원, 좋아요·댓글은 "좋아요 1.2만 · 댓글 340", 성장 등급은 "급상승·빠른 성장·성장 중·완만" 글자에 기능색만.
  - 장식 아이콘은 `neutral-400` 한 색의 맨 SVG 로 통일하고, "신생 채널" 아이콘은 탭과 같은 것으로 맞춘다. 카드에 번호가 필요하면 "01 02 03" 텍스트.
  - 아이콘을 감싼 박스·원은 테두리와 배경을 없애고 아이콘만 둔다.
  - 노랑 응원 문구와 "60점 이상" 수치는 중립색으로 바꾼다. 즐겨찾기 별의 앰버는 유지한다.

### channels-08 · P2 · content-clarity · 공수 M
**첫 화면이 시작을 돕지 못한다 (제목 없음, 같은 설명 3중, 대상 없는 "N회 남음" 2개)**

- 페이지: `/channels`, `/my-channel`
- 근거
  - `channels/page.tsx` 에 `<h1>` 이 없다. `shots/before-auth/channels.jpg`: 좌상단에 작은 검색창과 비활성 탭, 화면 가운데에 정렬 설명 카드 3장.
  - 같은 정렬 설명이 세 곳에 있다: 탭 이름(`FilterTabs.tsx:26-45`), hover 툴팁(`:79-93`), 빈 상태 카드(`page.tsx:108-154`).
  - `shots/before/channels-desktop-01.png`: 네비에 "2회 남음", 검색창 옆에 "1회 남음". 무엇의 횟수인지 표시가 없다(네비는 영상 검색, 본문은 채널 검색). 로그인 화면에서는 "무제한"이 두 번 나온다(`channels.jpg`).
  - `shots/before/channels-mobile-01.png`: "한눈 / 에 비교할", "정렬합 / 니다" 등 단어 중간 줄바꿈.
  - `/my-channel`: 같은 뜻의 안내가 3번(`my-channel/page.tsx:41-43`, `ChannelSearchForm.tsx:26`, `page.tsx:82-88`). `shots/before/my-channel-desktop-01.png`: "…성과 지표 / 를 확인할 수 있습니다" 줄바꿈.
  - `my-channel/page.tsx:38-39` 와 `:47`: 제목은 왼쪽 끝, 폼과 빈 상태는 가운데 정렬. 헤더 띠와 본문의 좌측 기준선도 16px 다르다(스크린샷 x=80 과 x=96. `channels/page.tsx:211-212` 와 `:258` 도 같다).
  - `ChannelSearchForm.tsx:8`: 분석 후 입력창이 비워진다(`useState("")`, 현재 `channel` 값을 받지 않음).
  - 문서 제목 중복: "내 채널 분석 | 비블랩 | 비블랩 (bibl lab)"(manifest, `my-channel/page.tsx:8`, `[channelId]/page.tsx:83-85`).
- 문제: 처음 온 사람은 이 화면이 무엇인지(제목), 무엇을 넣으면 되는지(예시)보다 정렬 방식 설명을 먼저 본다. 횟수 배지 두 개는 서로 다른 숫자를 말해 혼란을 준다.
- 제안
  - 두 화면 상단을 이미 변환된 `/trend-search` 와 같은 섹션 헤더 패턴으로 맞춘다: 좌측 캡션 "유튜브 트렌드 서치"(허브 링크) + 우측 영문 라벨("CHANNELS" / "CHANNEL ANALYSIS") + 헤어라인 + h1. 앱 화면이므로 여백은 랜딩보다 작게 잡는다.
  - `/channels`: h1 "채널 찾기", 기존 안내 문장(`page.tsx:112`)을 h1 아래로 올린다. 검색창은 본문 폭 기준으로 키우고 화이트 버튼을 쓴다. placeholder 의 예시(골프·다이어트·주식)는 누르면 입력창에 채워지는 칩으로 둔다(자동 검색·차감 없음). 정렬 설명 카드는 1벌만 남긴다.
  - 배지는 "채널 검색 N회 남음"으로 대상을 밝히고 네비 배지(`SearchUsageBadge.tsx:44-58`)와 같은 중립 스타일로 맞춘다. 무제한이면 본문 배지를 생략한다.
  - `/my-channel`: 안내는 h1 아래 한 번만. 폼을 왼쪽 정렬해 제목과 기준선을 맞추고 입력값을 유지한다. 빈 상태는 제공 지표 4개 이름(평균 조회수·업로드 주기·최적 업로드 요일·조회수 추이)을 카드 윤곽으로 미리 보여 준다.
  - 줄바꿈은 전역 `break-keep` 적용 시 함께 해결된다. 문서 제목의 "| 비블랩" 중복을 지운다.

### channels-09 · P2 · navigation-ia · 공수 M
**진입 동선: /threads 는 링크가 없고, 허브 잠금 표기와 실제 동작이 다르다**

- 페이지: `/threads`, `/channels`, `/my-channel` (연관: `/trend-search`)
- 근거
  - `href="/threads"` 검색 결과는 `src/app/feed.xml/route.ts:8` 한 곳뿐이다. 네비(`layout.tsx:315-344`)에도 허브 도구 목록(`trend-search/page.tsx:31-83`, 4개)에도 스레드가 없다.
  - `trend-search/page.tsx:46-48, 58-60`: 무료 사용자에게 채널 찾기·채널 분석을 "Starter+ 필요"로 잠그고 `/pricing` 으로 보낸다.
  - 실제 정책: `stripe.ts:41`(Free 채널 검색 1회/일), `layout.tsx:120`(구조화 데이터에도 "채널 검색 1회/일 무료 제공").
  - `my-channel/page.tsx:20-33`: 로그인·플랜 확인이 없다(`shots/before/my-channel-desktop-01.png` 는 비로그인 화면). 한 번 분석에 search.list 를 2회 호출한다(`actions.ts:110, 167`).
  - `threads/page.tsx:108-113` → `sign-in/_components/SignInForm.tsx:63`: 스레드에서 "로그인하고 시작하기"를 눌러 로그인하면 `/search` 로 간다. 돌아올 링크가 없다.
  - 세 페이지 모두 허브나 다른 도구로 가는 링크가 없다(채널 찾기는 `/pricing` 과 상세 링크뿐).
- 문제: 스레드 분석은 주소를 직접 입력해야만 갈 수 있다. 무료 사용자는 무료 1회 체험이 있다는 사실을 허브에서 알 수 없다(체험 후 업그레이드 흐름이 끊김). 채널 분석은 허브에서는 잠금, 주소로는 무제한이다.
- 제안
  - 도구 페이지 4곳(영상 찾기·채널 찾기·채널 분석·수집한 영상) 상단에 같은 서브 탭을 둔다. 목록은 허브의 `TOOLS` 배열을 단일 출처로 쓴다(search 담당과 공용 컴포넌트 조율).
  - `/threads` 는 소유자 결정이 필요하다. 살릴 기능이면 허브에 카드를 추가하고, 숨겨 둘 기능이면 feed 와 색인에서도 내린다.
  - 허브 카드의 잠금 표기를 실제 정책에 맞춘다(무료는 "하루 1회 무료" 캡션 + 바로가기). trend-search 담당 항목과 묶어 처리.
  - 범위 밖 참고: `/my-channel` 무제한 실행은 YouTube API 쿼터 소진 위험이 있다(부록 C).

### channels-10 · P2 · layout · 공수 M
**채널 상세: 정보가 반복되고 요약이 영상 목록 뒤에 있으며 차트가 없다**

- 페이지: `/channels/[channelId]` (코드 기준. 결과 화면 캡처 없음)
- 근거 (`src/app/channels/[channelId]/page.tsx`)
  - `:320-322` 와 `:388`: 개설일이 헤더 메타와 "채널 나이" 카드에 두 번 나온다.
  - `:396-407`: "월 평균 구독자 증가"와 "성장 등급"은 같은 값에서 나온 칩 두 개이고 색도 같다.
  - `:375-384` 와 `:464-470`: 전체 영상당 평균 조회수와 최근 12개 평균이 설명·영상 12장을 사이에 두고 떨어져 있다. 둘을 비교하는 것이 이 화면에서 가장 쓸모 있는 정보다.
  - `:458-489`: "최근 영상 통계" 요약이 영상 그리드 뒤에 있다.
  - `:394, 430, 465`(text-xs 회색)와 `:437`(text-sm semibold): 섹션 제목의 크기와 색이 제각각이다.
  - `:239-246`: 월 평균 구독자 증가와 업로드 빈도는 "누적 ÷ 개설 후 개월 수"인데 화면에 계산 근거가 없다. "급상승" 같은 등급이 최근 추세로 읽힌다.
  - `:473`: "최고 조회수"는 등급과 무관하게 항상 보라색이다. 같은 화면에서 보라는 최상위 등급 색이다.
  - 등급 색 범례가 없다. 영역 안에 3가지 척도가 섞여 있다: 보라·빨강·주황(채널), 틸·그린·회색(`:412-416` 업로드 빈도), 틸·노랑·회색(스레드 `PostPerformanceTable.tsx:171-175`, `SavedThreadsList.tsx:320`).
  - 화면에 차트가 하나도 없다.
- 제안
  - 순서: 헤더(이름·핸들·국가·개설일·유튜브 링크) → 핵심 수치 4개(구독자·총 조회수·영상 수·영상당 평균 조회수) → 최근 영상 요약(전체 평균과 최근 12개 평균을 나란히, 최고 영상) → 최근 영상 그리드 → 채널 소개.
  - "성장 등급" 칩을 없애고 "월 평균 구독자 증가" 값 옆에 등급 글자를 붙인다. 캡션으로 계산 근거를 밝힌다(목록 빈 상태에 이미 있는 문장 `channels/page.tsx:133` 을 재사용).
  - 섹션 제목을 한 가지 스타일로 통일한다.
  - 등급 색은 한 척도(보라·빨강·주황·회색)로 통일하고 표 아래에 범례 한 줄을 둔다. "최고 조회수"는 화이트로.
  - (선택, P3) 최근 12개 영상 조회수 막대 차트를 요약 옆에 둔다. 전체 평균을 기준선으로 긋고, 막대는 `neutral-600`, 평균을 넘는 막대만 `#00E5A0`. Recharts 는 이미 의존성에 있다. 내 채널 분석의 "조회수 추이" 카드에도 같은 차트를 쓸 수 있다.
  - 상세에서 "업로드 패턴 분석 보기" 링크로 `/my-channel?channel={channelId}` 를 연결하면 두 화면이 이어진다.

### channels-11 · P2 · navigation-ia · 공수 M
**스레드: 수집함은 채울 방법이 없는 탭이고, 연결 권유가 플랜 잠금보다 먼저 나온다**

- 페이지: `/threads`, `/threads/saved`
- 근거
  - `POST /api/threads/saved`(`api/threads/saved/route.ts:41`)를 부르는 화면 코드가 없다. 호출부는 `SavedThreadsList.tsx` 의 PATCH·DELETE 뿐이다.
  - `SavedThreadsList.tsx:169-178`: 빈 상태의 "스레드 검색하러 가기 →" 가 `/threads` 로 간다. 거기에는 검색이 없다. `threads/saved/page.tsx:56-61` 에도 "← 스레드 검색".
  - `threads/page.tsx:157-170`: 수집함 탭은 "Pro 플랜부터 이용 가능 … 게시물 수집과 CSV 내보내기"로 업그레이드를 권한다.
  - `/threads/saved` 는 탭(`/threads?tab=saved`)과 같은 내용의 별도 라우트이고 제목 크기·잠금 표현이 다르다. 링크된 곳이 없다.
  - `threads/page.tsx:118-120` 과 `:130-143`: 로그인한 무료 사용자에게 "Meta 계정 연결 필요 … Threads로 연결하기"가 먼저 나오고 그 아래에 "Starter 플랜부터 이용 가능"이 나온다.
  - `MyAccountDashboard.tsx:193-226` 과 `:289-296`: "프로필 개요" 카드와 바로 아래 6개 지표 카드가 같은 숫자 6개를 두 번 보여 준다.
  - 용어: 화면 제목 "Threads 분석", 문서 제목 "스레드 분석", 카드 "Meta 계정 연결 필요".
- 문제: 수집함은 예전 스레드 검색 기능의 잔재로 보인다. 새 사용자는 항상 비어 있고, 쓸 수 없는 기능으로 Pro 업그레이드를 권한다. 무료 사용자는 계정을 연결한 뒤에야 플랜이 필요하다는 것을 알게 된다.
- 제안
  - 수집함(소유자 결정): 수집 수단을 되살릴 계획이 없으면 저장된 글이 있는 사용자에게만 탭을 보이고, 빈 상태 링크와 "← 스레드 검색", Pro 권유 문구를 정리한다. `/threads/saved` 는 탭 주소로 합친다.
  - 무료 사용자에게는 플랜 안내를 먼저 보여 주고 연결 카드는 그 아래에 비활성으로 두거나 숨긴다.
  - "프로필 개요" 카드를 빼고 상단은 3카드(연속 기록·인기 콘텐츠·콘텐츠 아이디어)로 구성한다.
  - 용어를 "스레드"와 "Threads 계정" 두 가지로 정리한다.

### channels-12 · P2 · bug · 공수 S
**수집함 즐겨찾기 필터가 적용되지 않고, 모바일에서는 즐겨찾기를 할 수 없다**

- 페이지: `/threads?tab=saved`, `/threads/saved`
- 근거 (`src/app/threads/saved/_components/SavedThreadsList.tsx`)
  - `:68-103`: 필터 계산 `useMemo` 가 `:72` 에서 `favOnly` 를 쓰는데 의존성 배열(`:103`)은 `[threads, search, queryFilter, sortKey, sortAsc]` 이다. `favOnly` 가 빠져 있다.
  - `:324-339`: 즐겨찾기·삭제 버튼 묶음이 `hidden md:flex`. `:342-347`: 모바일 행에는 삭제(✕)만 있다.
  - `:143-150`: 개별 삭제는 확인 없이 바로 지운다. 글자 크기 `text-xs` 의 ✕ 하나다.
  - `:153`, `ConnectMetaButton.tsx:11`: 브라우저 기본 `confirm()` 을 쓴다. 공용 `useConfirm`(`_components/ConfirmDialog.tsx`, 커뮤니티·검색에서 사용)을 쓰지 않는다.
- 문제: "☆ 즐겨찾기"를 누르면 버튼만 "★"로 바뀌고 목록은 그대로다(검색어나 정렬을 건드려야 반영). 모바일에서는 즐겨찾기를 켤 수 없고, 작은 ✕ 를 잘못 누르면 되돌릴 수 없다.
- 제안: 의존성 배열에 `favOnly` 를 넣는다. 모바일 행에 즐겨찾기 버튼을 추가하고 터치 영역을 44px 로 잡는다. 삭제와 연결 해제는 공용 확인 창(`useConfirm`)을 쓴다.

### channels-13 · P2 · interaction-feedback · 공수 S
**채널 검색·정렬에 대기 표시가 없고, 스레드는 기간을 바꾸면 화면 전체가 스피너가 된다**

- 페이지: `/channels`, `/threads`
- 근거
  - `ChannelSearchBar.tsx:15-23`, `FilterTabs.tsx:55-58`, `DateSortToggle.tsx:15-26`: `router.push` 만 하고 펜딩 상태가 없다. 버튼 비활성도 없다.
  - `src/app` 아래에 `loading.tsx` 가 없다(error.tsx·not-found.tsx 만 있음).
  - 기존 패턴: `/search` 는 `showLoading("검색 중...")` 을 부른다(`_components/SearchBar.tsx:237`, `search/_components/FilterTab.tsx:18`). 내 채널 분석은 `useTransition` 으로 처리한다(`ChannelSearchForm.tsx:9, 43-65`).
  - `_components/NavigationLoader.tsx:197-213`: 전역 진행 막대는 `history.pushState` 시점에 켜진다. `router.push` 는 서버 응답이 온 뒤에 pushState 를 하므로 대기 중에는 막대가 보이지 않을 가능성이 높다(브라우저 확인 권장).
  - `MyAccountDashboard.tsx:145-152`: `loading` 이면 기간 버튼까지 포함해 전체를 스피너로 바꾼다.
- 문제: 채널 검색은 YouTube API 응답까지 화면이 멈춘 듯 보여 중복 클릭을 부른다(클릭마다 차감, channels-01). 스레드는 기간을 누를 때마다 화면이 통째로 사라졌다 나타난다.
- 제안
  - 채널 검색 제출에 `/search` 와 같은 `showLoading("채널 검색 중...")` 을 붙이고 제출 중에는 버튼을 비활성으로 둔다. 정렬은 channels-01 대로 클라이언트 처리하면 대기가 없어진다.
  - 스레드는 기간 버튼을 항상 남기고, 이전 데이터를 흐리게 둔 채 갱신하거나 카드 윤곽 스켈레톤을 쓴다. 영역에 `aria-busy`.

### channels-14 · P2 · accessibility · 공수 M
**표 3종 마감 불일치: 마우스 전용 정렬 헤더, "v"/"^" 표시, 숫자 단위 혼재, 10px·저대비 글자**

- 페이지: `/my-channel`, `/threads`, `/threads?tab=saved`, `/channels`
- 근거
  - 정렬 헤더: `ChannelDashboard.tsx:247-270`, `PostPerformanceTable.tsx:119-131` 은 `<th onClick>` 이다. 키보드로 누를 수 없고 `aria-sort` 가 없다.
  - 정렬 표시가 표마다 다르다: `PostPerformanceTable.tsx:127-129` 는 글자 "v" / "^", `ChannelDashboard.tsx:82-88` 은 ↑↓, `SavedThreadsList.tsx:167` 은 " ↑" / " ↓".
  - 숫자 포매터가 7개다: `channels/page.tsx:49-54`·`[channelId]/page.tsx:11-16`("1.2K", "12만"), `ChannelDashboard.tsx:6-11`("1.2천", "12.3만"), `MyAccountDashboard.tsx:58-62`·`ProfileMetricCard.tsx:10-14`·`PostPerformanceTable.tsx:26-30`("1.2K", "1.2만"), `SavedThreadsList.tsx:10-14`("1.2k"). 같은 열에 "9.5K회"와 "12만회"가 섞인다. 공용 `lib/format.ts` 가 있지만 쓰지 않는다.
  - 10px 글자: `SavedThreadsList.tsx:252`(표 헤더), `:279, 295-296, 301, 308`. `:308` 의 "+ 메모"는 `text-gray-700`(배경 대비 1.72:1).
  - 이름 없는 컨트롤: `PostPerformanceTable.tsx:149-160`(10px 아이콘만 있는 링크), `ChannelSearchBar.tsx:28-36`·`PostPerformanceTable.tsx:92-98`·`SavedThreadsList.tsx:201-207, 221-225`(label 없는 입력·선택).
  - `outline-none` 뒤 대체 포커스가 없는 곳: `SavedThreadsList.tsx:224, 291`.
- 문제: 같은 종류의 표가 화면마다 다르게 동작하고 다르게 읽힌다. 키보드 사용자는 정렬할 수 없고, 작은 회색 글자는 사실상 보이지 않는다.
- 제안
  - 정렬 헤더는 `<th>` 안에 `<button>` 을 넣고 `aria-sort` 를 준다. 표시는 한 가지 SVG 화살표로 통일한다.
  - 숫자는 공용 포매터 하나로 통일한다(천·만·억 한글 단위, 소수 자릿수 한 규칙).
  - 최소 글자 크기 12px. 정보가 담긴 글자는 `neutral-500` 이상.
  - 아이콘만 있는 컨트롤에 `aria-label`, 터치 영역 최소 24px(모바일 44px), 입력에 label 또는 `aria-label`.
  - 표 머리글 스타일을 한 가지로 맞춘다(작은 글자·`neutral-500`·좌우 정렬 규칙).

### channels-15 · P2 · bug · 공수 S
**/tmklab-site: 쓰이지 않는 구 랜딩이 깨진 상태로 공개되어 있다**

- 페이지: `/tmklab-site`
- 무엇인가: tmklab.com 도메인용으로 만든 "TMK STUDIO"(유튜브 채널 대행) 단독 랜딩이다. `src/middleware.ts:16-25` 가 tmklab.com 요청을 이 경로로 rewrite 하게 되어 있다. 그런데 2026-10-04 기준 tmklab.com 은 아임웹으로 응답한다(`curl -sI https://tmklab.com` 에 `IMWEBVSSID` 쿠키와 CloudFront 헤더, 네임서버 hostcocoa). 지금 이 페이지는 `bibllab.com/tmklab-site` 주소로만 열리고, 링크된 곳은 없다.
- 근거
  - `shots/before/tmklab-site-desktop-01.png`: 비블랩 네비와 TMK 네비가 겹쳐 두 줄이고, 비블랩 네비는 메뉴 간격이 사라지고 "시작하기" 버튼 글자가 안 보인다. `tmklab-site-mobile-01.png` 도 같다.
  - 원인: `src/app/tmklab-site/page.tsx:29`(`*{margin:0;padding:0}`), `:33`(`a{color:inherit}`), `:34`(`nav{…}`), `:118`(`footer{…}`) 가 레이어 없는 전역 선택자라 Tailwind 유틸리티를 덮어쓴다. `:300-305` 에서 `<html>` 문서를 통째로 div 에 주입한다.
  - `tmklab-site-desktop-02.png`, `-03.png`: 서비스 이미지 4장이 깨져 대체 글자만 보인다. `page.tsx:203, 207, 211, 215` 가 images.unsplash.com 을 쓰는데 CSP `img-src`(`next.config.mjs:27`)에 없다. "배고팡" 배너와 아바타도 깨져 있다(`:231`, 고정 URL 만료).
  - `tmklab-site-desktop-05.png`: TMK 푸터 아래 비블랩 푸터가 또 나오고 좌측 여백이 사라져 있다.
  - 규칙 위반: 틸 변수와 틸 버튼(`:30, 42, 56`), 그라데이션(`:48, 115`), 글로우(`:49, 56`), 숫자 박스(`:76, 83`), 남색 배경(`:30`).
  - noindex 가 없고 robots 차단 목록(`src/app/robots.ts:3-14`)에도 없다.
- 같은 디자인 규칙을 적용해야 하는가: bibllab.com 아래에서 열리는 한 적용 대상이고 현재 거의 모든 규칙을 어긴다. 다만 내용이 `/studio`(채널 대행)와 겹치고 유입 경로가 없으므로 재디자인에 공수를 쓰지 않는 편이 맞다.
- 제안
  - 권장(소유자 결정): 이 경로를 `/studio` 진입 경로로 넘기고 파일을 정리한다. tmklab.com 을 이 앱으로 옮길 계획이 있으면 그때 `/studio` 섹션을 재사용해 구성한다.
  - 당장 할 최소 조치(S): `robots: { index: false }` 메타 추가, 전역 선택자를 래퍼 클래스 범위로 한정해 비블랩 네비·푸터가 깨지지 않게 한다.
  - 유지하기로 하면 필요한 것: 틸 → 화이트 CTA, 그라데이션·글로우 제거, 숫자 박스 → 텍스트 숫자, 외부 이미지 4장을 자체 자료로 교체, 채널 썸네일 갱신.

---

## 부록 A. 구 테마 변환 매핑과 기능색 구분 (channels-06)

| 현재 | 쓰이는 곳 | 처리 |
|---|---|---|
| `bg-gray-950` | 페이지 배경 (`channels/page.tsx:209` 외) | `bg-black` |
| `bg-gray-900/50`·`/40` 헤더 띠 | `channels/page.tsx:211`, `my-channel/page.tsx:38` | 배경 없이 헤어라인만. 섹션 헤더 패턴으로 교체 |
| `bg-gray-900` + `border-gray-800` | 카드·표 | `bg-neutral-900` + `border-neutral-800` |
| `text-gray-200~500` | 본문·보조 글자 | 같은 단계의 `neutral-` |
| `text-gray-600`·`700` (정보 글자) | 순위, 보조 수치, "+ 메모" | `neutral-500` 이상 (대비 2.35·1.72 → 3.78 이상) |
| `bg-teal-600`·`500` 버튼 | 검색, 채널 분석하기, 플랜 업그레이드, 로그인하고 시작하기 | 화이트 버튼 (`bg-white hover:bg-neutral-200 text-black font-bold`) |
| 같은 틸 버튼 (보조 동작) | CSV, CSV 내보내기 | 테두리 버튼 (`border-neutral-700 text-white`) |
| 틸 활성 탭·토글 | FilterTabs, ThreadsTabNav, 기간 버튼, DateSortToggle | 화이트 필(`bg-white text-black`) 또는 화이트 밑줄 |
| `text-teal-400` 수치 | 구독자 수, 일 평균 게시 수 | 화이트 `font-black` |
| `text-teal-400` 링크·hover | 최고 영상, 더 보기, 제목 hover | `neutral-300` + hover 화이트(밑줄) |
| `focus:border-teal-*` | 입력창 | `focus-visible` 링 (화이트 또는 `neutral-400`) |
| 차트 선 `#14b8a6`, 격자·축 `#1f2937`·`#374151`·`#6b7280`, 툴팁 `#111827` | `ProfileViewsChart.tsx:41-70` | 선 `#00E5A0`, 격자 `#262626`, 축 `#404040`·`#737373`, 툴팁 `#171717` |
| 히트맵 `rgba(20,184,166,α)` | `ChannelDashboard.tsx:216-217` | `rgba(0,229,160,α)`, 밝은 칸 글자는 검정 |
| 연속 기록 칸 `teal-400/500/700` | `MyAccountDashboard.tsx:101-109` | 에메랄드 불투명도 3단계 |
| 보라·빨강·주황·회색 등급 | 채널 지표, 성장 등급, 평균 조회수 | **유지** (기능색) + 범례 추가 |
| 그린 신생·상승, 레드 하락·에러, 앰버 임박 | NEW 배지, 추이, 한도 배지 | **유지** (시맨틱) |
| 틸·노랑·회색 등급 | 참여율, 바이럴 점수 | 척도 유지, 색만 에메랄드·앰버·중립으로 |
| 주황 API 에러 상자 | `channels/page.tsx:280` | 앰버(경고)로 통일 |
| 틸 "연결 완료" 배너 | `threads/page.tsx:78` | 그린(성공) |
| 노랑 응원 문구, "60점 이상" 수치 | `MyAccountDashboard.tsx:95`, `SavedThreadsList.tsx:194` | 중립색 |
| ★ 노랑 | 즐겨찾기 | **유지** (별 앰버 관례) |
| `bg-red-600` 유튜브 버튼 | `[channelId]/page.tsx:331` | 브랜드색 유지 가능. 색은 `#FF0000` 에 맞춤 |

admin·insights admin 집계(참고): admin `gray-` 250·`teal-` 27·`blue-` 15·`purple-` 17, insights admin `slate-` 127·`teal-` 63. 운영자 전용이므로 위 표의 배경·글자·버튼 치환만 일괄 적용하고 플랜 배지·유입 소스 색(범주 구분용)은 그대로 둔다. `admin/page.tsx:36` 의 로고 "lab" 틸은 현재 로고(중립 회색)와 다르다.

## 부록 B. 색 대비 계산값

| 조합 | 대비 |
|---|---|
| gray-600 on gray-950 | 2.66 |
| gray-600 on gray-900 | 2.35 |
| gray-700 on gray-900 | 1.72 |
| neutral-600 on neutral-900 | 2.29 |
| neutral-500 on neutral-900 | 3.78 |
| neutral-500 on black | 4.43 |
| neutral-400 on neutral-900 | 7.11 |
| white on teal-600 (현재 버튼) | 3.74 |
| white on #00E5A0 | 1.65 |
| black on #00E5A0 | 12.72 |

## 부록 C. 범위 밖 참고 (UI 계층이 아님, 오케스트레이터 판단용)

- `/my-channel` 은 로그인·플랜·횟수 제한이 없다(`my-channel/page.tsx:20-33`). 한 번 분석에 search.list(100유닛)를 2회 부르고 단일 키(`YOUTUBE_API_KEY`)를 쓴다. 누구나 반복 실행하면 쿼터가 소진되어 영상·채널 검색 전체에 영향을 줄 수 있다.
- 스레드 장기 토큰 갱신 함수 `refreshLongLivedToken`(`lib/threads.ts:246`)을 호출하는 곳이 없다. 60일 뒤 연결이 만료된다.
- 비로그인 채널 검색 차감이 기록되지 않을 가능성(channels-01 의 4번).
- 채널 상세·`/tmklab-site`·`/threads/saved` 는 canonical 을 따로 주지 않아 루트 레이아웃의 `https://bibllab.com` 을 물려받는다(`layout.tsx:56-58`). 검색엔진에 홈의 중복 문서로 신고하는 셈이다.
