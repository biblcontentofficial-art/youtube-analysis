# search 영역 UX/UI 감사

- 대상: `/search`(영상 찾기), `/saved`(수집한 영상), 공용 `SearchBar.tsx`·`SearchUsageBadge.tsx`
- 방법: `src/app/search/` 전체, `src/app/saved/` 전체, `src/components/` 전체, `src/app/_components/SearchBar.tsx`·`SearchUsageBadge.tsx` 를 읽었다. 근거 확인용으로 `lib/searchLimit.ts`, `lib/db.ts`, `lib/stripe.ts`, `api/saved-videos/route.ts`, `ConfirmDialog.tsx`, `NavigationLoader.tsx`, `KakaoChatButton.tsx`, `layout.tsx`(일부)도 읽었다. 스크린샷 `shots/before/search-desktop-01.png`, `search-mobile-01.png`, `search-mobile-02.png`, `shots/before-auth/search-empty.jpg` 를 직접 봤다.
- 한계: 캡처는 모두 "검색어 없는 빈 화면"뿐이다. 결과 표·모달·모바일 로그인 화면은 코드로 판단했고 항목에 "코드 기준"이라고 적었다. `/saved` 는 캡처가 없다.
- 감사 일자: 2026-10-06 · 읽기 전용(저장소 수정 없음)
- 현재 완성도: **2 / 5**

## 총평

영상 찾기는 검색·필터·정렬·옵트인 분석·수집까지 기능은 갖췄지만, 화면은 구 남색·틸 테마(gray 339건, teal 144건, 그라데이션 13곳)이고 흰 라이트 모달과 이모지 아이콘이 섞여 공개 페이지와 다른 서비스처럼 보인다.

가장 큰 문제는 상태 표시다. 검색어 없이 열면(로그인 직후 기본 이동, 트렌드 서치 허브의 "영상 찾기" 카드) "검색 결과가 없어요"가 뜬다. 한도 초과 모달은 로그인 사용자가 닫을 수 없고, 월 단위 플랜에도 "오늘 · 내일 자정 · Starter로 월 50회"를 말한다(실제 초기화는 한국 시간 오전 9시).

결과 위에 업그레이드 배너·키워드 인사이트 카드·잠금 카드가 쌓여 첫 화면에 영상이 1~2개뿐이고, 모바일에서는 정렬·전체 선택·알고리즘 확률을 쓸 수 없다. 수집·삭제·영상 모달은 실패를 성공처럼 보여 주거나 로딩 문구가 끝나지 않는다.

`/saved` 에는 무한 렌더·폴링·타이머가 없다(0건). 최대 200행 x 이미지 2장을 지연 로딩 없이 한 번에 그리는 것이 캡처 지연의 코드상 유력 후보다.

## 유지할 점

1. **검색 전 확인창과 차감 안내.** "확인 시 검색 사용량 1회가 차감됩니다"(`SearchBar.tsx:230-233`). 이 확인창은 이미 새 테마인 공용 `ConfirmDialog`(`ConfirmDialog.tsx:58-101`, neutral-900 + 화이트 확인 버튼 + Enter/Esc)다. 다른 확인창도 이것으로 모은다.
2. **검색 누적·차감 흐름 자체(불변 조건 1).** 아래 "손대지 말 코드 위치" 표 참고. 마크업·스타일만 손댄다.
3. **상태를 URL 에 담는 구조**(q·filter·v·region·fromHistory). 새로고침·공유가 되고, 필터 탭은 캐시가 있으면 차감하지 않는다(`page.tsx:96-111, 188`).
4. **파생 지표의 옵트인 + 디스클레이머 구조**(알고리즘 확률·경쟁도·상위 영상 패턴, ToS 주석 `VideoCard.tsx:4`, `SearchResultList.tsx:58-62`). 옵트인 단계와 문구는 유지하고 모양만 바꾼다.
5. **데스크톱 표 / 모바일 카드 이원 구조**(`VideoCard.tsx:122-261`)와 모바일 카드의 정보 순서(제목 → 채널 → 조회수·구독자 → 게시일).
6. **사용량 시맨틱 색.** 마지막 1회 앰버, 소진 레드(`page.tsx:219-228`, `SearchUsageBadge.tsx:45-51`). 펄스 도트만 뺀다.
7. **로딩·오류의 기본 골격.** neutral 스피너 오버레이 "검색 중..."(`NavigationLoader.tsx:229-235`), 검색마다 key 를 바꿔 오버레이를 반드시 닫는 `PageLoadedSignal`(`page.tsx:196`), 이미 새 테마인 `error.tsx`(다시 시도 + 검색 초기화), 한국어 쿼터 소진 안내(`page.tsx:257-273`).
8. **/saved 의 CSV 내보내기**(BOM 포함 한글 헤더, `SavedVideoList.tsx:21-43`)와 키워드·정렬 필터.

## 불변 조건 1: 손대지 말 코드 위치 (구현자용)

같은 키워드 반복 검색 시 count 가 누적되는 흐름이다. 아래 줄의 로직·파라미터·호출 순서는 그대로 두고, 감싸는 마크업과 className 만 바꾼다.

| 파일 | 줄 | 내용 |
|---|---|---|
| `src/app/_components/SearchBar.tsx` | 10-60 | 검색 기록 저장 형식(term + count), localStorage 키 스코핑·병합 |
| 같은 파일 | 166-195 | `saveToHistory`: 같은 term 이면 `existing.count + 1`, 서버/로컬 저장 |
| 같은 파일 | 219-239 | `executeSearch`: `v` 계산(224-226, 같은 q 면 prevV + 1), 확인창(230-233), `saveToHistory`(235), `router.push(/search?q=&v=&region=&filter=)`(238) |
| 같은 파일 | 242-249 | 최근 검색어 클릭 → `fromHistory=1` |
| `src/app/search/page.tsx` | 43, 55-58 | `v`(searchVersion)·`fromHistory`·`region` 파라미터 |
| 같은 파일 | 48-50, 86-92 | `INITIAL_RESULT_COUNT`, `MAX_INITIAL_PAGES`, 플랜별 `resultLimit`·`canLoadMore` |
| 같은 파일 | 94-184 | 캐시 확인(97-110) → `incrementSearchCount`(111) → 결과 조회 |
| 같은 파일 | 186-188, 330-332 | 필터 링크 `fromHistory=1&v=${searchVersion}` |
| 같은 파일 | 196, 397 | `PageLoadedSignal`·`SearchResultList` key 에 `searchVersion` 포함(리마운트 보장) |
| `src/app/search/_components/SearchResultList.tsx` | 64-73, 116-195 | 더보기 누적(토큰·정렬 폴백·`resultLimit`) |
| `src/app/page.tsx`(홈, 다른 레인) | 40-73 | 홈 검색의 `saveToHistory` + `/search?q=&count=N`(72). `/search` 는 `count` 를 읽지 않지만 건드리지 않는다 |

시작 상태(search-01)를 넣을 때는 `page.tsx:374` 의 렌더 조건에만 `query &&` 를 더하고 94-184 는 그대로 둔다.

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| search-01 | P0 | bug | 검색어 없이 열면 "검색 결과가 없어요"가 뜬다 (도구의 첫 화면이 오류처럼 보인다) | S |
| search-02 | P1 | bug | 한도 초과 모달: 로그인 사용자는 닫을 수 없고, 월 단위 플랜에도 "오늘·내일 자정·Starter로 월 50회"가 나온다 | S |
| search-03 | P1 | layout | 결과 표보다 홍보·도구 패널이 먼저 쌓여 첫 화면에 영상이 거의 없다 | M |
| search-04 | P1 | mobile | 모바일에서는 정렬·전체 선택·알고리즘 확률을 쓸 수 없고, 액션 버튼 줄이 찌그러진다 | M |
| search-05 | P1 | theme-violation | 앱 전체가 구 남색·틸 테마이고 금지 패턴이 남아 있다 (기능색 구분은 부록 A) | L |
| search-06 | P2 | visual-consistency | 옵트인 확인창 2개가 흰 라이트 모달이고, 나머지는 브라우저 기본 alert/confirm 이다 | S |
| search-07 | P2 | bug | 영상 수집·삭제가 서버 응답을 확인하지 않아 실패해도 "수집 완료"로 보인다 | S |
| search-08 | P2 | bug | 영상 모달: API 실패 시 "채널 정보 분석 중..."이 끝나지 않고 채널 링크·누적 조회수 표시가 틀린다 | M |
| search-09 | P2 | layout | 결과 표 밀도가 낮고, 768~950px 폭에서는 제목 열이 거의 사라진다 | M |
| search-10 | P2 | accessibility | 핵심 동작이 마우스 전용이다 (영상 열기·정렬·최근 검색어가 div 클릭) | M |
| search-11 | P2 | content-clarity | 사실과 다른 문구: "최근 30일 업로드 기준", "월 ₩15,000", 안내 없이 차감되는 연관 키워드, 오타 | S |
| search-12 | P2 | performance | /saved: 무한 렌더·폴링은 없다. 최대 200행 x 이미지 2장을 지연 로딩 없이 한 번에 그린다 | S |
| search-13 | P2 | bug | /saved: 통계 단위가 틀리고(0K·2346K), 200개 상한이 숨겨진 채 "전체 삭제"는 전부 지운다 | S |
| search-14 | P2 | bug | 수집 완료 토스트와 카카오 채널 배너가 우하단 카카오 상담 버튼에 가려진다 | S |
| search-15 | P2 | interaction-feedback | 더보기 실패가 무표시로 무시되고, 채널 제거는 되돌릴 수 없으며, 같은 정보가 중복 표시된다 | S |

---

## 발견 상세

### search-01 · P0 · bug · 공수 S
**검색어 없이 열면 "검색 결과가 없어요"가 뜬다 (도구의 첫 화면이 오류처럼 보인다)**

- 페이지: `/search` (q 없음)
- 근거
  - 스크린샷 `shots/before/search-desktop-01.png`, `search-mobile-01.png`, `shots/before-auth/search-empty.jpg`: 검색창 아래에 돋보기 이모지와 "검색 결과가 없어요 / 다른 키워드로 검색해보세요"만 있다. 로그인(운영자) 화면도 같다.
  - `src/app/search/page.tsx:374-413`: 검색어가 없어도 `!limitExceeded && !apiError` 면 `SearchResultList` 를 `initialData=[]` 로 렌더한다.
  - `src/app/search/_components/SearchResultList.tsx:282-290`: `initialData` 가 비면 query 유무와 상관없이 "검색 결과가 없어요".
  - 이 화면으로 들어오는 길: 트렌드 서치 허브 카드(`trend-search/page.tsx:34`, href `/search`), 로그인 직후 기본 이동(`auth/callback/route.ts:8`, `next ?? "/search"`), 404(`not-found.tsx:20`), 마이페이지(`mypage/page.tsx:62, 210`), 소개(`about/page.tsx:227`), 피드(`feed.xml/route.ts:6`), canonical(`page.tsx:14`).
  - 무료·비로그인은 최근 검색어 패널도 없다(`SearchBar.tsx:321-322`, Starter 이상만 표시). 화면에 오류 문구 하나만 남는다.
- 문제: 아직 검색하지 않은 사람에게 "결과 없음"을 보여 준다. 로그인 직후 첫 화면과 허브에서 "영상 찾기"를 누른 직후 화면이 모두 이 상태다. 무엇을 하면 되는지(키워드 입력, 1회 차감, 남은 횟수)도 알려 주지 않는다.
- 제안: `page.tsx` 에서 `!query` 이면 목록 대신 시작 상태 블록을 렌더한다(374행 조건에 `query &&` 추가 + `!query` 분기). 내용은 사실 서술 2~3줄: "키워드를 입력하면 관련 영상을 조회수·구독자·게시일과 함께 보여 줍니다", "검색 1회마다 사용량이 1회 차감됩니다", 남은 횟수(`used`·`limit` 은 page 에 이미 있다, 75-84행). 아이콘은 맨 SVG(이모지 제거), 카드 대신 헤어라인 + 섹션 헤더 패턴. "검색 결과가 없어요"는 실제로 검색해서 0건일 때만 쓴다(그때 문구는 유지). 94-184행(조회·차감)과 SearchBar 는 건드리지 않는다.

### search-02 · P1 · bug · 공수 S
**한도 초과 모달: 로그인 사용자는 닫을 수 없고, 월 단위 플랜에도 "오늘·내일 자정·Starter로 월 50회"가 나온다**

- 페이지: `/search` (한도 초과 시)
- 근거
  - `LimitModal.tsx:68-118`: 로그인 사용자용 모달에 닫기 버튼·배경 클릭·Esc 가 없다(`fixed inset-0 z-50`, 70행). 같은 정보의 인라인 안내가 `page.tsx:276-323` 에 이미 있어 모달을 닫아도 정보는 남는다.
  - `LimitModal.tsx:80-86`: "오늘 검색 {limit}회를 모두 사용했습니다", "Starter 플랜으로 월 50회 검색", "내일 자정 초기화"가 고정이다. Starter·Pro·팀비블은 월 한도다(`lib/stripe.ts:58-59` Starter dailySearchLimit null·monthly 50, Pro 500). Starter 사용자가 50회를 다 쓰면 "오늘 검색 50회를 모두 사용했습니다 / Starter 플랜으로 월 50회 검색이 가능합니다 / 내일 자정 초기화"를 본다. 인라인 안내도 `page.tsx:290` 에서 현재 플랜과 무관하게 "Starter 플랜으로 업그레이드하면 월 50회".
  - 초기화 시각: 일 한도 키와 TTL 이 UTC 기준이다(`lib/searchLimit.ts:39-41, 124-130`). 한국 시간 오전 9시에 초기화되는데 화면은 "내일 자정"(`LimitModal.tsx:86`, `page.tsx:293`).
  - 금지 패턴: 틸 그라데이션 띠(`LimitModal.tsx:72`, `page.tsx:279`), 아이콘 박스(`LimitModal.tsx:74, 124`, `page.tsx:281`), 틸 채움 CTA(`LimitModal.tsx:106-111`, `page.tsx:315-320`), 문구 em-dash(`LimitModal.tsx:99`, `page.tsx:308`).
- 문제: 결제한 사용자에게 틀린 안내를 한다. 무료 사용자는 모달에 막혀 다른 동작(최근 검색어로 캐시 결과 보기, 네비 이동)을 할 수 없다.
- 제안: 모달에 "닫기" 텍스트 버튼 + Esc + 배경 클릭 닫기(닫으면 인라인 안내가 남는다). 문구는 page 처럼 `isMonthly`(이번달/오늘)와 현재 플랜을 props 로 받아 분기한다(표시만): Starter 면 Pro 안내, Pro 면 다음 달 초기화 안내만. 초기화 시각은 실제 동작대로 "매일 오전 9시(한국 시간) 초기화"로 쓰고, 자정 초기화를 원하면 로직 문제이므로 소유자 확인. 모양은 neutral-900 카드 + 화이트 CTA, 그라데이션 띠·아이콘 박스 제거, em-dash 는 "·".

### search-03 · P1 · layout · 공수 M
**결과 표보다 홍보·도구 패널이 먼저 쌓여 첫 화면에 영상이 거의 없다**

- 페이지: `/search` (결과 있음, 코드 기준)
- 근거
  - 결과 위 순서: 무료 업그레이드 배너 `page.tsx:377-394`(약 84px) → 키워드 인사이트 카드 `KeywordInsights.tsx:160-221`(그라데이션 + "유튜브 채널 대행 문의" CTA + 큰 버튼 2개, 약 180px) → 무료는 블러 잠금 카드 `SearchResultList.tsx:337-374`(약 156px), 유료는 경쟁도 줄 + 제목 패턴 접힘(약 130px) → 표 헤더.
  - 1440x900 기준 첫 행이 약 670px 지점에서 시작하고 행 높이가 약 120px 이라 무료 사용자는 첫 화면에 영상 1~2개를 본다. 390px 모바일은 네비 2줄(약 121px, `search-mobile-01.png`) + 검색 띠·검색어 칩·사용량(약 140px) + 툴바 2줄 + 배너 + 인사이트(버튼이 1열로 쌓여 약 280px) + 잠금 카드 → 첫 영상이 약 990px, 화면 밖이다.
  - 같은 업그레이드 유도가 한 화면에 세 번 나온다: 상단 배너, 잠금 카드(`SearchResultList.tsx:366-371`), 하단 한도 배너(`SearchResultList.tsx:521-538`).
- 문제: "영상 찾기"의 본론인 결과가 밀린다.
- 제안
  1. 키워드 인사이트·경쟁도·제목 패턴을 표 바로 위 "분석 도구" 한 줄(테두리 버튼 4개: 상위 영상 패턴 / 연관 키워드 / 경쟁도 / 제목 패턴)로 접고, 결과 패널은 누른 뒤에만 펼친다. 지금도 옵트인 구조라 상태 로직은 그대로다.
  2. "유튜브 채널 대행 문의"는 같은 줄 오른쪽 텍스트 링크(`text-[#00E5A0]`)로 바꾸거나 결과 하단으로 옮긴다. 노출은 유지한다.
  3. 무료 상단 배너는 툴바 아래 한 줄 문장 + 텍스트 링크로 줄이고, 잠금 카드는 "분석 도구" 줄 안의 잠금 표시(자물쇠 SVG + "Starter")로 대신한다.
  4. 결과 시작점에 섹션 헤더 패턴(좌측 "검색 결과 50건" + 우측 `RESULTS` + 헤어라인)을 둔다.

### search-04 · P1 · mobile · 공수 M
**모바일에서는 정렬·전체 선택·알고리즘 확률을 쓸 수 없고, 액션 버튼 줄이 찌그러진다**

- 페이지: `/search` (모바일, 코드 기준)
- 근거
  - 정렬(조회수·구독자·게시일), 전체 선택 체크박스, "알고리즘 확률" 활성화 버튼이 모두 `hidden md:grid` 헤더 안에만 있다(`SearchResultList.tsx:377-420`). 모바일 카드(`VideoCard.tsx:209-261`)에는 정렬도 확률 표시도 없다.
  - 툴바 액션 줄 `page.tsx:338` 은 `flex items-center gap-2`(줄바꿈 없음). 무료 기준 채널 리포트(잠금 배지)·영상 수집(잠금 배지)·채널 제거·공유+카카오+네이티브 공유·"N건"의 폭 합계가 약 590px(Pro 약 510px)인데 390px 화면의 가용 폭은 358px 이다. 한글이 음절 단위로 꺾이므로 가로 스크롤 대신 버튼 안 글자가 두 줄로 꺾이며 압축된다.
  - 체크박스가 14px(`VideoCard.tsx:217`, `w-3.5 h-3.5`)이고 라벨 영역이 없다.
  - 경쟁도 추천 문장이 모바일에서 숨는다(`KeywordCompetition.tsx:187`, `hidden sm:block`). 남은 검색 횟수 배지도 모바일 네비에서 숨고(`SearchUsageBadge.tsx:30, 45`, `hidden sm:flex`), `/search` 의 사용량 표시는 검색 후에만 나온다(`page.tsx:214`).
- 문제: 영상 찾기의 핵심 동작(조회수순 정렬로 잘 된 영상 찾기)을 모바일에서 할 수 없다.
- 제안: 목록 위에 `md:hidden` 정렬 줄(조회수·구독자·게시일 세그먼트 버튼 또는 `<select>`, 기존 `handleSort` 재사용) + "전체 선택" 체크박스. 알고리즘 확률은 데스크톱과 같은 옵트인 뒤 모바일 카드 지표 줄에 라벨로 표시(옵트인 원칙 유지). 액션 줄은 `flex-wrap` 또는 `overflow-x-auto` 한 줄 스크롤로, 모바일은 짧은 라벨. 체크박스는 `<label>` 로 감싸 44px 터치 영역. 추천 문장은 모바일에서 아래 줄로. 시작 상태(search-01)에 남은 횟수를 넣어 모바일에서도 보이게.

### search-05 · P1 · theme-violation · 공수 L
**앱 전체가 구 남색·틸 테마이고 금지 패턴이 남아 있다 (기능색 구분은 부록 A)**

- 페이지: `/search`, `/saved`
- 근거
  - 담당 파일(미사용 파일 제외) `gray-` 339건/17파일, `teal-` 144건/15파일, `slate-` 21건/3파일, `gradient` 13건/5파일(`KeywordInsights.tsx:163, 171, 176, 184, 197, 205, 225, 272`, `LimitModal.tsx:72`, `page.tsx:279, 378`, `SearchResultList.tsx:522`, `VideoModal.tsx:360`).
  - 글로우 블롭 `KeywordInsights.tsx:165-166, 226, 273`(blur-3xl), 색 그림자 `KeywordInsights.tsx:184`(shadow-teal-900/30), 그라데이션 글자 `KeywordInsights.tsx:176`, 펄스 도트 `page.tsx:232`, 아이콘 박스 `page.tsx:281, 380`, `LimitModal.tsx:74, 124`, `KeywordCompetition.tsx:106`, `KeywordInsights.tsx:171, 230, 277`, 원형 숫자 미리보기 `SearchResultList.tsx:342-344`(틸 원 안 "78").
  - 스크린샷 `search-desktop-01.png`: 검색 띠(`page.tsx:200`, gray-900/40)와 본문(`page.tsx:194`, gray-950)이 남색이다. 이미 neutral 로 바뀐 검색 입력창(`SearchBar.tsx:267`)만 무채색이라 띠 안에서 따로 논다.
  - 색 의미가 섞여 있다: 앰버가 경고(데이터 부족, 디스클레이머)와 장식(연관 키워드 칩 `KeywordInsights.tsx:292`)에 함께 쓰이고, 빨강·파랑이 쇼츠/롱폼 구분(`VideoCard.tsx:136-140`)에 쓰인다.
- 문제: 로그인 후 앱이 공개 페이지와 다른 서비스처럼 보이고, 색이 신호인지 장식인지 구분되지 않는다.
- 제안: 부록 A 매핑대로 일괄 치환한다(channels 보고서 부록 A 와 같은 치환값). 배경 black, 카드 neutral-900/800, 주요 CTA 화이트, 보조는 테두리 버튼, 활성 탭 화이트 필. 기능색은 척도만 유지하고 틸만 바꾼다(경쟁도, 알고리즘 확률, 반응 등급). 이모지 아이콘(📊📥🗑🔖⬇🛠️🤖🚀🎉⚡⚠️🔍)은 맨 SVG 또는 텍스트로. 미사용 파일은 변환하지 말고 정리 대상으로 둔다(부록 A 하단).
  - 다른 레인과 맞출 점: channels 영역은 성과 배율에서 빨강을 "좋음"으로 쓰고(`lib/youtube.ts:157-161`, 1.5배 이상 red-400), 여기서는 빨강이 "Worst"다(`VideoCard.tsx:32`). 두 화면의 등급 색 문법을 오케스트레이터가 하나로 정해야 한다.

### search-06 · P2 · visual-consistency · 공수 S
**옵트인 확인창 2개가 흰 라이트 모달이고, 나머지는 브라우저 기본 alert/confirm 이다**

- 페이지: `/search`, `/saved`
- 근거: 흰 모달 `SearchResultList.tsx:448-482`(알고리즘 확률), `KeywordCompetition.tsx:125-150`(경쟁도): `bg-white`, 틸 테두리/채움 버튼, Esc 처리 없음. 네이티브 대화상자 `SearchResultList.tsx:200, 229, 241`(alert), `SavedVideoList.tsx:75, 91`(alert), `SavedVideoList.tsx:82`(confirm). 테마에 맞는 공용 확인창이 이미 있다(`ConfirmDialog.tsx:58-101`, SearchBar 가 사용 중 `SearchBar.tsx:230-233`).
- 문제: 검은 앱 위에 흰 모달이 번쩍 뜨고, 같은 "확인" 행위가 세 가지 모양으로 나온다.
- 제안: 두 옵트인 창은 `useConfirm({ message: "알고리즘 확률 분석을 진행하시겠습니까?", subMessage: 기존 디스클레이머 })` 로 교체(문구 그대로). alert 는 상황별로: "선택 먼저" 류는 버튼 비활성 + 옆 안내 문구, 실패는 화면 안 오류 문구(search-07). `confirm()` 은 `useConfirm`.

### search-07 · P2 · bug · 공수 S
**영상 수집·삭제가 서버 응답을 확인하지 않아 실패해도 "수집 완료"로 보인다**

- 페이지: `/search`, `/saved`
- 근거: `SearchResultList.tsx:207-235` 는 `await fetch(...)` 결과를 보지 않고 토스트에 `targets.length` 를 쓴다. API 는 401·403·400·500 과 부분 실패 `{ ok, saved, failed }` 를 돌려준다(`api/saved-videos/route.ts:17-18, 30-31, 36-38, 60-65`). fetch 는 HTTP 오류에서 예외를 던지지 않으므로 catch(228-231)로 가지 않는다. `/saved` 도 같다: `SavedVideoList.tsx:65-79`(삭제 실패해도 행 제거), `81-93`(전체 삭제).
- 문제: 세션 만료·DB 오류 때 사용자는 수집했다고 믿고 떠난다. 부분 실패 개수도 숨겨진다.
- 제안(표시 계층만): `res.ok` 와 응답 본문을 확인해 토스트를 `saved`·`failed` 로 쓴다("48개 수집, 2개 실패"). 실패면 레드 오류 토스트 + 다시 시도. 삭제는 성공 응답 뒤에 행을 지우거나, 실패 시 행을 되돌리고 오류 문구.

### search-08 · P2 · bug · 공수 M
**영상 모달: API 실패 시 "채널 정보 분석 중..."이 끝나지 않고 채널 링크·누적 조회수 표시가 틀린다**

- 페이지: `/search` 영상 모달 (코드 기준)
- 근거
  - 서버 액션이 실패를 예외 대신 `null` 로 돌려준다(`actions.ts:59, 71, 90, 145, 157, 186`). 모달 오류 상태(`VideoModal.tsx:217-227`)는 catch 에서만 켜져(108-110) 도달하지 않는다. 채널 정보가 null 이면 `VideoModal.tsx:317-318` 이 "채널 정보 분석 중..."을 계속 보여 준다. YouTube 할당량 소진(`page.tsx:257` 에서 이미 다루는 상황) 때 모든 모달이 이 상태다.
  - "채널 바로가기" href 가 `detail?.channelId`(`VideoModal.tsx:308`) → 로딩 중·실패 시 `youtube.com/channel/undefined`. 목록 데이터에 `video.channelId` 가 이미 있다(`SearchResultList.tsx:216` 에서 사용).
  - 누적 조회수를 항상 억 단위로 쓴다(`VideoModal.tsx:325`): 300만 회 채널은 "0.0억", 1,200만 회는 "0.1억". 다른 곳은 만/억 자동 단위(`KeywordCompetition.tsx:11-15`).
  - 본문 `scrollbar-hide`(214) 안에 고정 높이 스크롤 상자 3개(263, 332, 339, 모두 scrollbar-hide) → 스크롤 가능 표시가 없고 모바일에서 스크롤이 갇힌다.
  - `role="dialog"`·`aria-modal`·제목 연결·포커스 이동이 없고 닫기 "✕"(210)에 이름이 없다.
  - 장식 색: 좋아요 파랑·댓글 초록(246, 250), 채널 바로가기 파랑 채움 버튼(311), 사용자 도구 그라데이션 상자(360)와 틸·보라 버튼(368-390), 이모지 🛠️📊🤖.
- 제안: 로딩이 끝났는데 `detail`·`channelInfo` 가 없으면 해당 영역에 "불러오지 못했습니다 · 다시 시도"(기존 `fetchData` 재사용). 채널 링크는 `video.channelId`. 누적 조회수는 만/억 공용 포맷. 본문 스크롤바 표시, 내부 고정 높이 상자는 "더보기" 펼침으로. dialog 속성 + 닫기 `aria-label`. 유튜브 버튼은 브랜드색 `#FF0000` 유지(또는 화이트), 나머지는 테두리 버튼, 수치는 화이트.

### search-09 · P2 · layout · 공수 M
**결과 표 밀도가 낮고, 768~950px 폭에서는 제목 열이 거의 사라진다**

- 페이지: `/search` 데스크톱·태블릿 (코드 기준)
- 근거
  - 행 구성 `VideoCard.tsx:123-206`: `py-4` + 썸네일 160px(높이 90px) + 채널 열 세로 3단(아바타 32px·이름·구독자) → 행 높이 약 120px, 유료 첫 로드 50행이면 약 6,000px.
  - 숫자 열이 가운데 정렬(조회수 161-163, 게시일 175-179)이고 게시일은 테두리 칩으로 감쌌다. 결과 수가 헤더 "썸네일 (N)"(`SearchResultList.tsx:390`)에 들어 있다.
  - 고정 열 합계 `32+40+160+100+160+110+100`px + 간격 56 + 패딩 24 = 약 784px(`SearchResultList.tsx:379`, `VideoCard.tsx:127`). 표가 `md`(768px)부터 켜져 768px 에서는 제목 열이 0, 820px(iPad Air)에서도 약 4px 다. 행 목록은 `overflow-hidden`(423)이라 오른쪽 열이 잘리고 헤더는 잘리지 않아 열이 어긋난다.
  - 정렬 가능 열이 시각적으로 구분되지 않는다(비활성 화살표 `text-gray-700`, 276).
- 제안: 표 전환을 `lg`(1024px)로 올리고 768~1023px 은 카드 유지. 행: `py-3`, 썸네일 128px, 채널 한 줄(아바타 20px + 이름), 구독자는 별도 숫자 열. 숫자 열은 오른쪽 정렬 + `tabular-nums`, 게시일 칩 제거. 결과 수는 표 위 캡션 하나로. 헤더 sticky(네비 높이 아래). 구분 열은 neutral 텍스트 "쇼츠/롱폼".

### search-10 · P2 · accessibility · 공수 M
**핵심 동작이 마우스 전용이다 (영상 열기·정렬·최근 검색어가 div 클릭)**

- 페이지: `/search`, `/saved`
- 근거
  - 영상 상세 열기: 썸네일 `div onClick`·제목 `h3 onClick`(`VideoCard.tsx:144, 155, 221, 240`).
  - 정렬 헤더 `div onClick`, `aria-sort` 없음(`SearchResultList.tsx:392-400`). 최근 검색어 칩·접기 헤더 `div onClick`(`SearchBar.tsx:324-327, 354-359`).
  - 이름 없는 아이콘 버튼: 검색 제출(`SearchBar.tsx:311-318`), 국가 선택(271-282, title 만), 모달 닫기(`VideoModal.tsx:210`, `ChannelReport.tsx:89-96`, `KeywordInsights.tsx:235, 282`), 카카오 공유(`ShareButton.tsx:95-103`, title 만), 수집 영상 삭제 🗑(`SavedVideoList.tsx:225-232`). 검색 입력에 label 없음(`SearchBar.tsx:262-268`, `SavedVideoList.tsx:125-131`).
  - 모달 4종(영상·채널 리포트·한도 초과·옵트인)에 dialog 속성이 없다.
  - 정보성 글자 10~11px + gray-600(예: 모바일 게시일 `VideoCard.tsx:259`, 디스클레이머 `KeywordCompetition.tsx:192`, 빈 상태 보조 문구 `SearchResultList.tsx:287`).
- 문제: 키보드로는 영상 상세를 열 수도, 정렬할 수도 없다. 스크린리더는 버튼 이름을 알 수 없다.
- 제안: 썸네일+제목을 하나의 `<button type="button">` 으로, 정렬 헤더는 `<button>` + `aria-sort`, 칩은 `<button>`. 아이콘 버튼에 `aria-label`, 입력에 숨김 label. 모달은 `role="dialog" aria-modal aria-labelledby` + 열릴 때 닫기 버튼으로 포커스. 정보성 글자는 neutral-500 이상·12px 이상. focus-visible 링은 전역 과제와 함께.

### search-11 · P2 · content-clarity · 공수 S
**사실과 다른 문구: "최근 30일 업로드 기준", "월 ₩15,000", 안내 없이 차감되는 연관 키워드, 오타**

- 페이지: `/search`
- 근거
  - 제목 패턴 분석 배지 "최근 30일 업로드 기준"(`TitlePatternAnalysis.tsx:128-130`)과 달리 계산은 날짜 필터 없이 전체 결과다(98행 `videos.filter((v) => def.test(v.title))`).
  - 무료 배너 "월 ₩15,000 · 언제든지 취소 · 즉시 적용"(`page.tsx:387`): Starter 월 결제는 19,000원, 15,000원은 연간 결제의 월 환산이다(`pricing/_components/PricingCards.tsx:51-52`). "₩15,000/월부터"(`page.tsx:293`, `LimitModal.tsx:86`)도 같은 문제.
  - 연관 키워드 칩(`KeywordInsights.tsx:288-296`)은 `/search?q=` 로 바로 이동하고 서버가 검색 1회를 차감한다(`page.tsx:111`, fromHistory 없음). 메인 검색은 차감 확인창을 거치는데(`SearchBar.tsx:230-233`) 칩 안내는 "아래 키워드를 클릭하면 새 검색이 시작됩니다"(285)뿐이다. 국가(region)도 전달되지 않아 KR 로 검색된다.
  - 오타 "알고리즘 확률는"(`SearchResultList.tsx:441`). em-dash: `page.tsx:9`(메타 설명), `page.tsx:308`, `LimitModal.tsx:99`, 공유 문구 `ShareButton.tsx:13`.
- 제안: 배지는 "검색 결과 기준"으로 바꾸거나 뺀다. 가격은 "월 ₩19,000 (연간 결제 시 월 ₩15,000)"처럼 실제와 맞춘다. 연관 키워드 안내에 "누르면 검색 1회가 차감됩니다"를 적는다(표시만). 칩을 확인창 경로(`executeSearch`)로 보내는 변경은 누적 로직(불변 조건 1)과 맞닿으므로 소유자 확인 후. "알고리즘 확률은". em-dash 는 "·" 또는 쉼표.

### search-12 · P2 · performance · 공수 S
**/saved: 무한 렌더·폴링은 없다. 최대 200행 x 이미지 2장을 지연 로딩 없이 한 번에 그린다**

- 페이지: `/saved` (코드 기준, 캡처 없음)
- 근거: `src/app/saved/**` 에 useEffect·setInterval·setTimeout·requestAnimationFrame·router.refresh 0건. 서버 컴포넌트가 `auth()`·`currentUser()`·`getSavedVideos(userId)`(기본 limit 200, `lib/db.ts:358-371`)를 한 번씩 부르고, 클라이언트는 상태 5개뿐이다(`SavedVideoList.tsx:13-17`). 행마다 썸네일·채널 아바타 `<img>`(193, 203) → 최대 400개 이미지 동시 요청, `loading="lazy"` 0건, width/height 없음, 페이징·가상화 없음. 정렬·필터는 매 렌더 재계산이지만 200개라 가볍다.
- 문제: 캡처 타임아웃의 코드상 유력 후보는 이미지 대량 즉시 로드로 load 완료가 늦어지는 것이다(확정은 브라우저 성능 기록 필요). 실사용에서도 첫 화면이 무겁다.
- 제안: `<img loading="lazy" decoding="async">` + 크기 지정. 목록은 50개씩 보여 주고 "더보기"(클라이언트 slice, 데이터 로직 불변). `/search` VideoCard 이미지(145, 168, 222, 247)에도 같은 지연 로딩.

### search-13 · P2 · bug · 공수 S
**/saved: 통계 단위가 틀리고(0K·2346K), 200개 상한이 숨겨진 채 "전체 삭제"는 전부 지운다**

- 페이지: `/saved`
- 근거
  - 평균 조회수 `Math.round((totalViews / n) / 1000)}K`(`SavedVideoList.tsx:118`): 평균 400회는 "0K", 평균 234만 회는 "2346K". 총 조회수는 M/K(114), 다른 화면은 만/억.
  - 통계 숫자가 틸·노랑(114, 118)인데 의미 없는 장식이다.
  - 목록은 최신 200개만 받는다(`lib/db.ts:358`). "수집된 영상 {videos.length}"(110)와 CSV 는 200에서 멈추는데, "전체 삭제"(81-93, confirm "N개를 모두")는 사용자 전체를 지운다(`lib/db.ts:381-387`).
  - 통계는 필터와 무관한 전체(63), 옆 "총 N개"(153)는 필터 기준이라 숫자가 엇갈린다.
  - 빈 상태(95-103)에 수집 방법과 이동 링크가 없다. 페이지 `metadata` 가 없어 탭 제목이 기본값이다.
- 제안: 만/억 공용 포맷, 숫자는 화이트 font-black. 200개 이상이면 "최근 200개 표시 중" 캡션, 전체 삭제 확인창에 실제 범위를 적는다(표시만). 통계 캡션에 "전체 기준". 빈 상태: "영상 찾기에서 영상을 선택하고 '영상 수집'을 누르면 여기에 모입니다" + 테두리 버튼 "영상 찾기". `export const metadata = { title: "수집한 영상" }`.

### search-14 · P2 · bug · 공수 S
**수집 완료 토스트와 카카오 채널 배너가 우하단 카카오 상담 버튼에 가려진다**

- 페이지: `/search`
- 근거: 토스트 `fixed bottom-6 right-6 z-50`(`SearchResultList.tsx:545`), 상담 버튼 `fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50 w-14 h-14`(`KakaoChatButton.tsx:13`). 버튼이 `{children}` 뒤에 렌더되어(`layout.tsx:396-398`) 같은 z-index 에서 위에 그려진다. 토스트 오른쪽 끝 닫기 "✕"(553-556)가 정확히 그 56px 영역에 있다. 카카오 채널 배너(`KakaoChannelBanner.tsx:43`, z-40, 같은 모서리)도 "채널 추가하기" 버튼 오른쪽이 덮이고, 노란 카카오 요소 두 개가 겹친다.
- 제안: 토스트·배너를 상담 버튼 위로 올린다(데스크톱 `bottom-24`, 모바일 `bottom-[88px]`) 또는 하단 중앙. 배너는 토스트가 없을 때만 띄운다.

### search-15 · P2 · interaction-feedback · 공수 S
**더보기 실패가 무표시로 무시되고, 채널 제거는 되돌릴 수 없으며, 같은 정보가 중복 표시된다**

- 페이지: `/search`
- 근거
  - 더보기 실패 `catch { // 로드 실패 시 조용히 무시 }`(`SearchResultList.tsx:187-189`): 버튼이 다시 "더보기"로 돌아갈 뿐이다. 몇 개를 더 볼 수 있는지(현재/플랜 한도)도 없다(485-510).
  - 채널 제거(239-249)는 즉시 목록에서 빼고 되돌리기가 없다.
  - 중복: 검색어 칩(`page.tsx:205-211`, 입력창에 이미 있음), 결과 수 2곳(`VideoCountBadge` `page.tsx:369` + 헤더 "썸네일 (N)"). 전체 이용자 집계 "오늘 N건 검색됨"(`TodaySearchCount.tsx:17-20`)이 내 사용량 근처에 있어 내 횟수로 읽힌다.
  - 잠금 버튼 글자·"Pro↑"가 gray-600(`page.tsx:346, 360`)이라 비활성처럼 보이지만 실제로는 요금제 링크다.
- 제안: 더보기 실패 시 버튼 아래 "불러오지 못했습니다 · 다시 시도", 버튼 라벨 "더보기 (50/100)". 채널 제거 뒤 "N개 채널을 숨겼습니다 · 되돌리기" 토스트(목록 상태만, 재검색 없음). 검색어 칩·VideoCountBadge 를 빼고 결과 수는 표 캡션 하나로. "오늘 N건 검색됨"은 "전체 이용자 오늘 N건"으로 주어를 밝히거나 뺀다. 잠금 버튼은 자물쇠 SVG + "Pro", neutral-400.

---

## 부록 A. 테마 변환 매핑과 기능색 구분 (search-05)

| 현재 | 쓰이는 곳 | 성격 | 처리 |
|---|---|---|---|
| `bg-gray-950` 페이지, `bg-gray-900/40` 검색 띠 | `page.tsx:194, 200`, `saved/page.tsx:15, 35-36` | 장식 | `bg-black`, 띠는 배경 없이 `border-b border-neutral-800` |
| `gray-*` 카드·표·글자 | 전 파일 | 장식 | 같은 단계 `neutral-*`. 정보성 `text-gray-600/700` 은 `neutral-500` 이상 |
| 틸 채움 버튼(플랜 업그레이드, 확인, 영상 찾기 →) | `page.tsx:317, 390`, `SearchResultList.tsx:368, 475, 532`, `LimitModal.tsx:108`, `KeywordCompetition.tsx:144`, `saved/page.tsx:23, 44` | 장식 | 주요 CTA 화이트 버튼, 보조는 테두리 버튼 |
| 그라데이션 CTA "유튜브 채널 대행 문의" | `KeywordInsights.tsx:182-189` | 장식 | 텍스트 링크 `text-[#00E5A0]` 또는 화이트 버튼 |
| 활성 필터 탭 `bg-teal-600` | `FilterTab.tsx:21` | 상태 | 화이트 필 `bg-white text-black`, 비활성 `neutral-800` |
| 검색어 칩 틸 | `page.tsx:207` | 장식·중복 | 제거 |
| 정렬 화살표 틸 | `SearchResultList.tsx:276-279` | 상태 | 활성 화이트, 비활성 `neutral-500` |
| 체크박스 `accent-teal-500`, 선택 행 `bg-teal-950/20` | `SearchResultList.tsx:386`, `VideoCard.tsx:125, 131, 212, 217` | 상태 | `accent-white`(또는 `#00E5A0`), 선택 행 `bg-neutral-800/60` |
| 제목·링크 hover 틸 | `VideoCard.tsx:155, 240`, `ChannelReport.tsx:121, 132`, `SavedVideoList.tsx:198`, `SearchResultList.tsx:549` | 상호작용 | `hover:text-white` + 밑줄 |
| "오늘 N건" 틸 숫자, "복사됨" 틸 | `TodaySearchCount.tsx:19`, `ShareButton.tsx:78-81` | 장식 / 성공 | 숫자 화이트, 복사됨은 그린(성공) |
| "시장성 좋음" 틸 배지 | `ViewStatsInline.tsx:29` | 평가 라벨 | `border-neutral-700` + `text-[#00E5A0]` |
| 경쟁도 낮음·보통·높음 = 틸·노랑·빨강 | `KeywordCompetition.tsx:53-69` | **기능(척도)** | 유지. 낮음 `#00E5A0`, 보통 `amber-400`, 높음 `red-400`. 원형 게이지는 "원형 숫자 배지"와 겹쳐 보이므로 가로 막대 + "72 / 100" 텍스트 권장 |
| 알고리즘 확률 Great·Good·Normal·Bad·Worst = emerald·teal·gray·orange·red | `VideoCard.tsx:21-33` | **기능(척도)** | 유지. Great `#00E5A0`, Good 화이트, Normal `neutral-500`, Bad `amber-400`, Worst `red-400` (지금은 emerald-400·teal-400 이 거의 구분 안 됨). 🔥 는 주석상 의도된 것(23행)이라 소유자 확인 |
| 반응 등급 S·A·B·C·D = teal·green·yellow·orange·gray | `TitlePatternAnalysis.tsx:229-240` | 기능, 막대 길이와 중복 | 막대 단색 `#00E5A0`, 등급 글자 neutral 테두리. 색 척도를 원하면 경쟁도와 같은 3색 |
| 제목 패턴 라벨 6색(blue·purple·green·red·yellow·cyan) | `TitlePatternAnalysis.tsx:15-69, 175, 212` | 장식(라벨 글자가 이미 구분) | neutral 테두리 필 |
| 쇼츠/롱폼 S·L = 빨강·파랑 배지 | `VideoCard.tsx:136-140, 229-233` | 기능(유형), 색 불필요 | neutral 텍스트 "쇼츠"/"롱폼" |
| 좋아요 파랑·댓글 초록 수치 | `VideoModal.tsx:246, 250` | 장식 | 화이트 |
| 자가 계산 +% 빨강 / -% 파랑 | `VideoModal.tsx:416` | 기능(증감, 국내 관례) | 상승 빨강 유지, 하락은 `neutral-400`(파랑 액센트 금지) |
| 유튜브에서 보기 `bg-red-600` | `VideoModal.tsx:233` | 브랜드 | `#FF0000` 로 맞추거나 화이트 버튼 |
| 채널 바로가기 `bg-blue-600`, 답글 보기 파랑 | `VideoModal.tsx:311, 53` | 장식 | 테두리 버튼 / `neutral-300` 링크 |
| 사용자 도구 그라데이션 상자, 틸·보라 버튼과 결과 상자 | `VideoModal.tsx:360-439` | 장식 | `neutral-900` 상자 + 테두리 버튼 |
| Pro 보라 글자 | `page.tsx:300`, `LimitModal.tsx:91`, `VideoCard.tsx:84` | 장식(플랜명) | 화이트 bold |
| 한도 임박 앰버 + 펄스 도트 / 소진 빨강 | `page.tsx:219-238` | **시맨틱** | 색 유지, 펄스 도트 제거 |
| API 소진 주황 상자 + ⚠️ | `page.tsx:258-266` | 시맨틱(경고) | 앰버로 통일, 이모지 제거 |
| API 오류 빨강 상자 | `page.tsx:269-272` | 시맨틱 | 유지 |
| 업그레이드 완료 틸 상자 + 🎉 | `page.tsx:246-253` | 시맨틱(성공) | 그린, 이모지 제거 |
| 데이터 부족 앰버, 확률 디스클레이머 앰버 | `TitlePatternAnalysis.tsx:180`, `SearchResultList.tsx:440` | 시맨틱 | 유지 |
| 연관 키워드 앰버 칩, 패턴 스카이 칩·버튼 | `KeywordInsights.tsx:194-218, 225-303` | 장식(앰버 오용) | neutral 필 + 테두리 버튼 |
| 글로우 블롭·그라데이션 글자·아이콘 박스 | `KeywordInsights.tsx:165-176, 230, 277`, `KeywordCompetition.tsx:106`, `LimitModal.tsx:74, 124`, `page.tsx:281, 380` | 금지 | 제거, 맨 SVG |
| 원형 숫자 미리보기 "78" | `SearchResultList.tsx:342-344` | 금지 | 제거(잠금 표시로 대체, search-03) |
| 이모지 아이콘 | `page.tsx:248, 259, 341-367`, `SearchResultList.tsx:285, 525, 546`, `VideoModal.tsx:361-387, 445, 453`, `KeywordCompetition.tsx:107, 120`, `SavedVideoList.tsx:98, 159, 231`, `saved/page.tsx:17, 39` | 장식 | 맨 SVG 또는 텍스트 |
| 흰 확인 모달 | `SearchResultList.tsx:448-482`, `KeywordCompetition.tsx:125-150` | 불일치 | `useConfirm` (search-06) |
| 카카오 `#FEE500` | `KakaoChannelBanner.tsx`, `ShareButton.tsx:97`, `LimitModal.tsx:141` | 브랜드 | 유지 |

변환하지 말 것(미사용, 정리 대상):
- `src/components/VideoCard.tsx`, `Sparkline.tsx`, `PerformanceBadge.tsx`: import 0건.
- `src/app/search/_components/ViewTrendGraph.tsx`: import 0건.
- `VideoCard.tsx:36-107` UpgradeModal: 여는 코드가 없다(`showUpgradeModal` 을 true 로 바꾸는 곳 0건).
- `SearchResultList.tsx:295-316` ColHeader: 사용 0건.
- `SearchSkeleton.tsx`: Suspense 안 클라이언트 컴포넌트가 데이터 때문에 suspend 하지 않아 거의 보이지 않고, 보일 때는 10열 정의(6, 18행)라 실제 8열 표와 어긋난다. 고친다면 8열로 맞추고 neutral.

## 부록 B. /saved 캡처 타임아웃 코드 점검

| 점검 항목 | 결과 |
|---|---|
| useEffect / setInterval / setTimeout / requestAnimationFrame / router.refresh | 0건 (`src/app/saved/**`) |
| 렌더마다 상태를 바꾸는 코드(무한 렌더) | 없음. 상태 변경은 입력·버튼 이벤트에서만 |
| 폴링·재요청 | 없음. 서버에서 1회 조회(`getSavedVideos`, limit 200) |
| 무거운 계산 | `filtered` 필터+정렬이 매 렌더 실행(최대 200개, 가벼움) |
| 렌더 부하 | 최대 200행, 행당 `<img>` 2개 = 최대 400개 즉시 요청, `loading="lazy"` 0건 |
| 전역 요소 | 다른 페이지와 같다(네비·카카오 버튼·NavigationLoader). 다른 페이지는 캡처됨 |

결론: 코드상 무한 렌더·폴링·루프는 없다. 남는 후보는 이미지 대량 즉시 로드(load 이벤트 지연)와 서버 측 인증 2회 + DB 조회 지연이다. 확정하려면 운영자 계정으로 Performance 기록이 필요하다. 개선안은 search-12.

## 부록 C. 범위 밖 참고 (UI 계층이 아님, 오케스트레이터 판단용)

- 최근 검색어 클릭은 코드 주석상 "카운트 증가 없이"(`SearchBar.tsx:241`)지만, 캐시가 만료됐으면 서버가 확인창 없이 차감한다(`page.tsx:99-111`). 누적 로직 영역이므로 소유자 확인 사항.
- 홈 검색은 `count=N` 을 붙이고(`src/app/page.tsx:72`) `/search` 는 `v` 만 읽는다(`page.tsx:43, 57`). 두 경로의 누적 기준이 다르다. 불변 조건 1 영역이라 기록만 한다.
- 로그인 콜백 기본 이동이 `/search` 다(`auth/callback/route.ts:8`). UI 쪽 해법은 search-01 의 시작 상태.
- 일 한도 초기화가 UTC 자정(한국 오전 9시)이다(`lib/searchLimit.ts:39-41, 124-130`). 문구를 맞출지 로직을 맞출지 소유자 결정(search-02).
- 연관 키워드 링크에 region 이 빠져 있다(`KeywordInsights.tsx:291`). 링크 형식 변경은 검색 경로라 소유자 확인 후.
- 등급 색 문법이 channels(`lib/youtube.ts:157-161`, 빨강 = 좋음)와 search(`VideoCard.tsx:21-33`, 빨강 = Worst)에서 반대다.
