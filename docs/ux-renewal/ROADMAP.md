# bibllab.com UX/UI 리뉴얼 로드맵 (v2)

- v1: 2026-10-06 총괄 설계 통합본(감사 12개 영역 약 170건 + 레퍼런스 명세 2종). 아래 '부록: v1 원문'.
- v2: 같은 날 비판 검토(`critique.md`, 지적 36건·누락 7건)를 반영. **항목을 실행할 때는 `roadmap-v2.json` 의 해당 항목(amendments_v2 가 v1 원문보다 우선)을 기준으로 한다.**
- 진행 현황·이어받는 법: `README.md`. 소유자 결정: `DECISIONS.md`.

## v2 에서 바뀐 것

1. **R00 신설(완료)**: 기준 태그 `ux-baseline`, `scripts/ux/check-invariants.mjs`(검색 누적 로직 함수 본문 해시 비교, 줄 번호가 아니라 AST 로 추적), `scripts/ux/check-theme.mjs`(문자열·JSX 텍스트만 검사, 주석·`src/app/api` 제외), `scripts/ux/buildcheck.sh`(개발 서버와 분리된 폴더에서 빌드 + 렌더 방식 ○●ƒ 기준 비교), `scripts/ux/shot.py`(1440·390 캡처). 로그인 화면 확인용 로컬 전용 `src/app/ux-preview/`(커밋 제외).
2. **항목 분리**: R02 → R02a(검색·홈·한도 모달, 불변 조건 1 파일)·R02b(채널·내 채널), R06 → R06a(네비)·R06b(푸터·OG)·R06c(모바일 2행·--nav-h), R11 → R11a(금지 패턴·모바일·첫 화면)·R11b(전환 CTA), R12 → R12a(상세)·R12b(폼). R23(홈 결과 미리보기) 추가.
3. **네비 시작점**: `xl:` 하드코딩 대신 `--breakpoint-nav` 토큰(`nav:` 변형). R06a 에서 실측해 확정.
4. **불변 조건 주변 보강**: 비파괴 확인창 autoFocus 는 확인 버튼(Enter-Enter 검색 유지), 한도 모달 가입은 `/sign-in`(필수 동의 복구·가입 직후 자동 차감 방지), 더보기 실패 안내 제외(보호 구간).
5. **소유자가 직접 만든 것은 기본 유지**: /studio 레드(결정 7 기본 B), 커뮤니티 노란 강조·레드 N(결정 E 신규), 요금제 Pro 흰 배지(결정 G 신규), 컨설팅 '20명·3개월 대기'(결정 6 에 추가).
6. **YouTube 정책**: 파생 지표(알고리즘 확률·경쟁도)는 스타일만, 노출·문구 불변. 계산기 노출 확대 금지.
7. **사실 오류 수정**: openGraph 얕은 덮어쓰기(OG_DEFAULT 공용 상수), /trend-search 는 원래 ƒ, /studio 미사용 상수 범위, 로고 정렬 144px, 내 채널 시간은 Asia/Seoul 고정 계산, ReferralApply 쿠키·문구.

## 실행 순서 (v2)

| # | 항목 | 단계 | 공수 | 선행 | 결정 대기 |
|---|---|---|---|---|---|
| 1 | **R01** 전역·공개 페이지 즉시 수정 (태블릿 네비 겹침·카카오 SDK·/incubating 메타·부가세 라벨·방문 중복·결제 주기·해지 표시) | 버그·기반 | S | - |  |
| 2 | **R02a** 검색 시작 화면·홈 키워드 전달·한도 모달 안내·가입 경로 복구 | 버그·기반 | M | - | 결정 11(모달 닫기·로그인 1단계 통합)은 대기. 가입 경로 /sign-in 은 기본 적용. |
| 3 | **R02b** 채널 찾기 재차감·돌아가기·잔여 표시·내 채널 업로드 시간 | 버그·기반 | M | - | 결정 12(기본 탭 이름 vs 계산)는 대기, 이 항목은 표시 오류만. |
| 4 | **R03** 디자인 토큰·글꼴·한글 타이포·포커스·모션 기반 (globals.css·루트 레이아웃) | 버그·기반 | M | R01 |  |
| 5 | **R04** 공용 부품(버튼·카드·배지·칩·탭·입력·컨테이너·섹션 헤더·아이콘·로고) + 오류·404·점검 화면 시범 적용 | 공용 UI | M | R03 |  |
| 6 | **R05** 대화상자 셸·레이어 체계·하단 고정 바·카카오 버튼 겹침 | 공용 UI | M | R04 |  |
| 7 | **R06a** 전역 네비 (현재 위치·next/link·컨테이너 정렬·건너뛰기 링크·로더 예외·시작점 실측) | 공용 UI | M | R01, R03, R04, R05 | 결정 3(텍스트 링크 통일), 결정 1(/studio 공개) |
| 8 | **R06b** 푸터·공유 이미지(OG)·JSON-LD·manifest·아이콘 | 공용 UI | S | R06a | 결정 1(푸터 대행 링크) |
| 9 | **R06c** 모바일·태블릿 2행 메뉴와 --nav-h | 공용 UI | S | R06a | 결정 4(모바일 2행 고정 범위) |
| 10 | **R07** 홈 (입력 히어로·섹션 헤더·서비스 갈래·서버 컴포넌트 분리) | 공개 페이지 | M | R02, R04, R05, R06 | 결정 6('10,000+ 키워드 분석됨'·'인기 키워드' 라벨 처리), 결정 10(예시 칩도 확인창을 거칠지), 결정 1(홈에 채널 대행 카드를 |
| 11 | **R09** 요금제 (실제 청구액·현재 플랜·결제 실패 안내·비교표·FAQ 시맨틱) | 공개 페이지 | M | R04 | 결정 2(로그인 뒤 결제 화면으로 바로 복귀), 결정 8(TEAM BIBL 명칭·구성과 요금제 하단 환불 문장 정정) |
| 12 | **R10** 로그인·결제 화면 (실패 안내·인앱 경고·대비·결제 화면 테마) | 공개 페이지 | M | R04 | 결정 2(로그인 뒤 원래 화면 복귀 허용 여부), 결정 11(로그인 동의·로그인 2단계를 한 화면으로 합칠지) |
| 13 | **R08** 트렌드 서치 허브·소개·약관류·계산기 (정적 공개 페이지 테마 정리) | 공개 페이지 | M | R04 | 결정 9(허브 잠금 표기를 실제 무료 정책에 맞출지), 결정 8(about·약관 사실 정정 범위), 결정 14(계산기 진입 경로) |
| 14 | **R13** 본문 렌더러·브랜드 인큐베이팅 (이미지 높이 상한·문단·지원 CTA·공유 메타) | 공개 페이지 | M | R04, R05 |  |
| 15 | **R12a** 1:1 컨설팅 상세: 요약 카드·가격 직후 CTA·이미지 크기·정적화 | 공개 페이지 | M | R01, R04, R05 | 결정 6(희소성 문구), 결정 1·13(돌아가기 링크) |
| 16 | **R12b** 상담 신청 폼 (/studio/consulting): 라벨·검증·오류 안내·정적화 | 공개 페이지 | M | R04, R05 | 결정 16(폼 질문 구성·개인정보 고지) |
| 17 | **R11a** 채널 대행 /studio: 금지 패턴·모바일 깨짐·첫 화면·성능 | 공개 페이지 | M | R03, R04, R05, R06a | 결정 7(레드 유지 여부), 결정 6(마감임박) |
| 18 | **R11b** 채널 대행 /studio: 전환 CTA·가격 카드·섹션 정렬 | 공개 페이지 | M | R11a, R06c | 결정 7(레드), 결정 1(공개) |
| 19 | **R14** 커뮤니티 틀·탐색·비회원 게이트·랭킹 (현재 게시판 표시·사이드바·팔레트·h1) | 커뮤니티 | M | R04, R06 | 결정 5(배너 크기·글쓰기 집중 모드), 결정 17(랭킹의 운영자 계정 표시), 결정 1(커뮤니티 안 대행 문의 링크) |
| 20 | **R15** 글 상세·피드 카드·댓글·글쓰기 (읽기 폭·썸네일·답글·툴바·터치 기기) | 커뮤니티 | L | R05, R13, R14 | 결정 5(글쓰기 화면에서 배너·사이드바를 숨기는 집중 모드) |
| 21 | **R16** 검색 화면 틀·검색창·한도 모달·도구 탭 | 앱 내부 | M | R02, R04, R05, R06 | 결정 11(한도 초과 모달을 닫을 수 있게 할지, 가입 버튼을 /sign-in 으로 보낼지) |
| 22 | **R17** 검색 분석 패널 (인사이트·경쟁도·제목 패턴 접기, 기능색만 유지) | 앱 내부 | M | R16 | 결정 10(연관 키워드 칩도 차감 확인창을 거치게 할지) |
| 23 | **R18** 검색 결과 표·영상 모달·수집한 영상 (/saved) | 앱 내부 | L | R05, R16 |  |
| 24 | **R19** 채널 찾기·채널 상세·내 채널 분석 (테마·기능색 범례·모바일 넘침·원문 오류) | 앱 내부 | L | R02, R04, R16 | 결정 12(기본 탭 '영상 평균 조회수 순'을 이름에 맞출지 계산에 맞출지), 결정 9(무료 1회/일 표기) |
| 25 | **R20** 스레드 (한국어 오류·다시 연결·테마·수집함 즐겨찾기) | 앱 내부 | M | R04, R19 | 결정 14(/threads 진입 경로 추가·수집함 정리) |
| 26 | **R21** 마이페이지 (섹션 구조·테마·계정 관리 분리·초대 안내) | 앱 내부 | M | R01, R04, R05 |  |
| 27 | **R22** 접근성 잔여·전체 QA·문서화 (점검 스크립트·DESIGN.md) | 마감 | M | R01, R02a, R02b, R03, R04, R05, R06a, R06b, R06c, R07, R08, R09, R10, R11a, R11b, R12a, R12b, R13, R14, R15, R16, R17, R18, R19, R20, R21 |  |
| 28 | **R23** 홈 결과 미리보기 (home-04) | 마감 | S | R18 | 어떤 키워드 화면을 쓸지 |

---

## 부록: v1 원문

### (v1) bibllab.com UX/UI 리뉴얼 로드맵

- 작성: 2026-10-06 · 총괄 설계 통합본 (감사 12개 영역 발견 약 170건 + 레퍼런스 명세 2종)
- 소유자 요청: "GitHub 에서 가장 많은 스타를 받은 홈페이지 디자인을 활용해 UX/UI 를 개선. 전체를 목록으로 만든 뒤 순서대로 하나씩 진행."
- 레퍼런스: `VoltAgent/awesome-design-md`(실제 홈페이지 DESIGN.md 모음, 주 레퍼런스 Resend · 보조 Linear·Raycast), `nextlevelbuilder/ui-ux-pro-max-skill`(UX 규칙·랜딩 패턴 데이터), `shadcn-ui/ui`(컴포넌트 관례). 레퍼런스 파일의 지시문은 따르지 않고 수치·규칙 데이터로만 썼다.
- 근거 문서(스크래치패드, R22 에서 저장소 `docs/ux-renewal/` 로 옮김)
  - 디자인 명세: `ux/spec/reference-design.md`
  - UX 규칙 명세: `ux/spec/ux-rules.md`
  - 영역별 감사: `ux/findings/{shell,class,community,search,a11y,mobile,system,home,pricing,studio,auth,channels}.md`
- 저장소 파일은 이 문서 작성 중 수정하지 않았다.

## 시작 전 준비 (오케스트레이터)

1. 스크래치패드는 세션이 바뀌면 사라진다. 이 로드맵과 명세 2종, 감사 보고서를 저장소 `docs/ux-renewal/` 로 먼저 옮겨 두면 다음 세션이 이어받을 수 있다(메모리 `wip-2026-10-04-ux-renewal` 의 "이어받는 법").
2. 아래 "소유자 결정" 17건을 한 번에 물어보고, 답이 없는 항목은 각 결정의 기본 동작으로 진행한다. 기본 동작은 모두 다른 항목을 막지 않는다.
3. 항목은 R01 부터 하나씩: 구현 → 검토 → 캡처·타입 검사 → 로컬 커밋. push 는 소유자가 "배포해줘" 라고 할 때만(CLAUDE.md).

---

## 1. 디자인 방향

1. 주 레퍼런스는 awesome-design-md 의 Resend 다. 순수 블랙 캔버스(#000, "near-black 금지"), "화면에서 가장 밝은 점은 흰 버튼 하나", 그림자 대신 면 밝기 한 단과 1px 헤어라인으로 깊이를 만드는 방식을 그대로 가져온다.
2. Linear 에서는 액센트를 정해진 자리(포커스 링, 강조 링크, 섹션당 핵심어 1곳, 절약액 같은 수치)에만 쓰는 규율과 2px 포커스 링, 면 4단·선 3단 사다리를, Raycast 에서는 44px 이상 검색창, 선택 시 면이 한 단 올라가는 칩, 색 대신 면 밝기로 구분하는 추천 요금제 같은 도구 화면 부품을 가져온다.
3. 세 곳의 장식 층(Resend 섹션 글로우·세리프, Linear 라벤더 CTA·청색기 회색·#010102, Raycast 그라데이션 띠·앱 아이콘 타일)은 소유자 금지 규칙과 충돌하므로 버린다.
4. 수치는 Tailwind v4 `@theme` 토큰(액센트·카카오·유튜브 색, 글자 11단계, 반경 8/12/16, 컨테이너 1200/672)으로 고정하고, 한글에 맞춰 자간은 레퍼런스의 약 80%, 행간은 0.1~0.25 넓게, 최소 글자 12px, 전역 keep-all 로 보정한다. 글꼴은 Pretendard Variable 하나를 자체 호스팅한다.
5. 페이지 구조와 상호작용은 ui-ux-pro-max 의 규칙 데이터를 따른다. 홈은 입력 히어로 → 기능 → 서비스 갈래 → 마지막 CTA, 요금제는 카드 → 비교표 → FAQ → CTA, 고가 서비스는 챕터 끝 미니 CTA 와 모바일 하단 고정 CTA 1개, 데이터 화면은 정렬·빈 상태·오류 복구를 갖춘다.
6. 컴포넌트는 shadcn/ui 관례(변형을 한 곳에서 관리하는 버튼, 제목·설명이 연결된 대화상자, 링크 탭의 aria-current)를 설치 없이 클래스 함수와 네이티브 `<dialog>` 로 구현한다.
7. 순서는 눈에 보이는 버그 → 전역 토큰·글꼴·포커스 → 공용 부품·네비·푸터 → 공개 페이지 → 커뮤니티 → 앱 내부 → 접근성·QA 이며, 검색 누적 로직·루트 레이아웃 정적성·커뮤니티 회원 전용은 모든 항목에서 건드리지 않는다.

### 1.1 확정값 요약 (구현자용)

| 축 | 값 | 출처 |
|---|---|---|
| 캔버스·면 | 페이지 `bg-black` · 카드 `bg-neutral-900` · 들린 면(추천·링크 카드 hover) `#1f1f1f`(`bg-surface-raised`) · 선택 면 `bg-neutral-800` · 오목면(카드 안 입력) `bg-neutral-950` | Resend + 소유자 규칙 |
| 선 | `border-neutral-800` 기본 · `neutral-700` 입력·보조 버튼 · `neutral-600` hover·추천 · 2px 는 포커스 링뿐 | Resend 14% 헤어라인, Linear 3단 |
| 글자색 | 흰색 제목 · `neutral-300` 본문 · `neutral-400` 보조(작은 글자 하한) · `neutral-500` 은 24px 이상·비활성·placeholder 만 · `neutral-600/700` 글자 금지 | 대비 계산(검정 위 8.1 / 4.4 / 2.7) |
| 액센트 | `#00E5A0`(hover `#66FFCC`) 글자·포커스 외곽선만. 배경 채움·색 테두리·반복 표식 금지. 본문은 화면당 2곳 이하(네비 2곳 별도) | Linear 액센트 자리, Supabase 희소성 |
| 주 버튼 | `bg-white text-black font-bold hover:bg-neutral-200 active:bg-neutral-300`, 흰 면은 폴드당 1개(네비 '시작하기' 별도) | Resend·Raycast |
| 버튼 단계 | primary · secondary(`border-neutral-700 bg-neutral-900`) · ghost · danger(레드 글자+테두리) · kakao(#FEE500 브랜드 예외). 높이 sm 36 / md 44 / lg 48 | reference-design §4.4 |
| 반경 | 버튼·입력 8px(`rounded-control`) · 카드·요금제·검색창 12px(`rounded-card`) · 모달·미디어 16px(`rounded-panel`) · 칩·배지 full. 알약 CTA 금지 | Resend·Linear·Raycast 공통 |
| 글자 단계 | display 60 · h1 48 · h2 36 · h3 28 · h4 20 · lead 18 · body 16 · body-sm 14 · caption 13 · micro 12 · label-en 14(0.25em). 제목 900, 행간 본문 1.75 | reference-design §4.1·§4.2 |
| 자간 | 48px 이상 -0.03~-0.025em · 28~40px -0.02em · 20~24px -0.01em · 16px 이하 0 · 양수 자간은 영문 라벨만 | Linear 값의 약 80% |
| 간격 | 섹션 `py-16 md:py-24` · 히어로 `pt-20 pb-16 md:pt-32 md:pb-24`(홈은 모바일 예외) · 카드 `p-6 md:p-8` · 그리드 `gap-4 md:gap-6` · 섹션 헤더 아래 `mb-10 md:mb-12` | Resend·Linear 96px |
| 컨테이너 | `max-w-page`(1200px) + `px-4 md:px-6` 를 네비·섹션·푸터 공통, 글 폭 `max-w-reading`(672px) | Resend 1200 |
| 포커스 | 상호작용 요소 `outline: 2px solid #00E5A0; outline-offset: 2px`(base 레이어), 입력은 테두리 + 외곽선 1px 씩 | Linear 2px 액센트 링 |
| 레이어 | z-10 표 머리 · z-30 페이지 sticky·하단 고정 바 · z-40 카카오 버튼 · z-50 전역 네비 · z-70 토스트·배너 · z-80 진행 막대·검색 오버레이 · 모달은 `dialog.showModal()` top layer | ux-rules 5.6 보정 |
| 모션 | 색 전환 150ms 만, hover 들림·확대·그림자·장식 펄스 금지(로딩 스켈레톤만), 스크롤 등장 0.3s·12px·JS 없이도 보임, reduced-motion 전역 대응 | reference-design §4.3, ux-rules 4장 |
| 섹션 헤더 | 좌 캡션(`neutral-400`) + 우 영문 라벨(`font-black tracking-[0.25em]`, `aria-hidden`) + 헤어라인, 두 톤 헤드라인(회색 리드 + 흰색) | 소유자 패턴 유지 |

---

## 2. 공통 규칙

### 2.1 모든 항목의 공통 완료 기준

각 항목의 "완료 기준"은 아래에 더해 확인한다.

1. `npx tsc --noEmit` 오류 0, `npm run build` 성공.
2. 빌드 표의 렌더 방식이 시작 전과 같다: 정적(○) 페이지는 정적, `/incubating` 은 ISR(●, revalidate 60), `/studio` 는 force-static.
3. `grep -nE '(auth|cookies|currentUser)\(' src/app/layout.tsx` 결과가 97행 경고 주석뿐.
4. 바꾼 사용자 화면 파일에서 `(gray|slate|zinc|teal)-[0-9]`, `bg-gradient|from-[a-z]+-[0-9]|shadow-\[0_0|animate-ping`, 화면 문구의 `—`, 이모지 아이콘이 0건(보존 시맨틱색 앰버·레드·그린과 브랜드색은 예외).
5. 바꾼 파일에서 정보 글자 `text-neutral-600/700` 0건, `text-neutral-500` 은 24px 이상·비활성·placeholder 에만, `text-[8~11px]` 0건(영문 라벨 예외).
6. 범위 페이지 1440px·390px 캡처(로컬 next dev/start, Playwright + 시스템 크롬). 로그인 화면은 운영 사이트를 소유자 크롬(로그인됨)으로 확인.
7. 새 문구는 담백한 사실 서술, 기존 문장은 유지(문장 변경은 결정 8 범위 안에서만).

### 2.2 불변 조건과 손대지 말 코드 위치

| 불변 조건 | 위치 | 규칙 |
|---|---|---|
| 1. 검색 결과 수 누적 | `src/app/_components/SearchBar.tsx` 10-60(기록 형식), 166-195(saveToHistory), 219-239(executeSearch: v 계산·확인창·saveToHistory·router.push), 242-249(fromHistory) · `src/app/search/page.tsx` 43, 48-50, 55-58, 86-92, 94-184(캐시 확인 → incrementSearchCount), 186-188, 196, 330-332, 397 · `src/app/search/_components/SearchResultList.tsx` 64-73, 116-195(더보기 누적) · `src/app/page.tsx`(홈) 40-73(`/search?q=…&count=N`) · `mypage/_components/RecentSearches.tsx` 의 `fromHistory=1` 링크 | 로직·파라미터·호출 순서 불변. 마크업·className·aria 만. 로그인 뒤 `/search?q=` 로 자동 검색되게 만들면 saveToHistory 를 건너뛰므로 금지 |
| 2. 루트 레이아웃 정적 | `src/app/layout.tsx` | auth()·cookies()·currentUser() 금지. 현재 위치 표시 등은 usePathname 클라이언트 잎으로. `/incubating` 의 `revalidate = 60`·`unstable_cache` 유지 |
| 3. 커뮤니티 회원 전용 | `community/layout.tsx:28`(robots noindex), `:44-53`(비로그인 게이트), `community/page.tsx:50`·`[board]/[id]/page.tsx`(canReadBoard) | 그대로. 게이트에 넘기는 값은 숫자(멤버·글 수)뿐 |
| 4. 결제·인증·검색 API·DB 로직 | `src/app/api/**`, `src/lib/{searchLimit,channelLimit,stripe,payple,portone,toss,threads,auth,db}.ts`, `auth/callback/route.ts`, `middleware.ts` | 수정 대상 아님. 예외는 토스 카드등록 HTML 의 링크·인라인 CSS 문자열(R01·R10)뿐 |
| 5. git | | push 금지(커밋은 오케스트레이터) |
| 6. 의존성 | `package.json` | 추가하지 않는다. Pretendard 는 `public/fonts/` 자산 |

---

## 3. 항목 요약

| ID | 단계 | 제목 | 공수 | 의존 | 소유자 결정 |
|---|---|---|---|---|---|
| R01 | 버그·기반 | 전역·공개 페이지 즉시 수정 | S | | |
| R02 | 버그·기반 | 검색 시작 화면·채널 재차감 등 앱 동작 버그 | M | | 2, 11 |
| R03 | 버그·기반 | 디자인 토큰·글꼴·한글 타이포·포커스·모션 기반 | M | R01 | |
| R04 | 공용 UI | 공용 부품 + 오류·404·점검 화면 | M | R03 | |
| R05 | 공용 UI | 대화상자 셸·레이어 체계·하단 고정 바·카카오 버튼 | M | R04 | |
| R06 | 공용 UI | 전역 네비·푸터·공유 이미지·로딩 표시 | M | R01 R03 R04 R05 | 1, 3, 4 |
| R07 | 공개 페이지 | 홈 | M | R02 R04 R05 R06 | 1, 6, 10 |
| R08 | 공개 페이지 | 트렌드 서치 허브·소개·약관류·계산기 | M | R04 | 8, 9, 14 |
| R09 | 공개 페이지 | 요금제 | M | R04 | 2, 8 |
| R10 | 공개 페이지 | 로그인·결제 화면 | M | R04 | 2, 11 |
| R11 | 공개 페이지 | 채널 대행 /studio | L | R03 R04 R05 | 1, 6, 7 |
| R12 | 공개 페이지 | 1:1 컨설팅 상세·상담 신청 폼 | L | R01 R04 R05 | 1, 13, 16 |
| R13 | 공개 페이지 | 본문 렌더러·브랜드 인큐베이팅 | M | R04 R05 | |
| R14 | 커뮤니티 | 커뮤니티 틀·탐색·비회원 게이트·랭킹 | M | R04 R06 | 1, 5, 17 |
| R15 | 커뮤니티 | 글 상세·피드 카드·댓글·글쓰기 | L | R05 R13 R14 | 5 |
| R16 | 앱 내부 | 검색 화면 틀·검색창·한도 모달·도구 탭 | M | R02 R04 R05 R06 | 11 |
| R17 | 앱 내부 | 검색 분석 패널 | M | R16 | 10 |
| R18 | 앱 내부 | 검색 결과 표·영상 모달·수집한 영상 | L | R05 R16 | |
| R19 | 앱 내부 | 채널 찾기·채널 상세·내 채널 분석 | L | R02 R04 R16 | 9, 12 |
| R20 | 앱 내부 | 스레드 | M | R04 R19 | 14 |
| R21 | 앱 내부 | 마이페이지 | M | R01 R04 R05 | |
| R22 | 마감 | 접근성 잔여·전체 QA·문서화 | M | R01~R21 | |

---

## 4. 항목 상세

### R01 · 버그·기반 · 전역·공개 페이지 즉시 수정 · 공수 S

- 목표: 디자인 작업 전에 모든 방문자가 바로 겪는 오작동을 작은 수정으로 없앤다. 태블릿 폭 네비 겹침, 전 페이지 카카오 SDK 차단 오류, /incubating 검색 메타 오류, 상담 폼 부가세 라벨, 방문 기록 중복, 토스 돌아가기의 결제 주기 유실, 해지 후 마이페이지 표시.
- 범위 페이지: 전 페이지(네비), /search(공유), /incubating, /studio, /studio/consulting, /studio/class/consulting, 토스 카드등록 화면, /mypage
- 범위 파일: `src/app/layout.tsx`, `src/app/search/_components/ShareButton.tsx`, `src/app/incubating/page.tsx`, `src/app/studio/consulting/page.tsx`, `src/app/studio/page.tsx`, `src/app/studio/class/consulting/page.tsx`, `src/app/api/toss/billing/page/route.ts`, `src/app/mypage/page.tsx`, `src/app/mypage/_components/CancelSubscriptionButton.tsx`
- 변경
  1. `layout.tsx:315` 데스크톱 메뉴 `hidden md:flex` → `hidden xl:flex` + `justify-center-safe`, `:352` 모바일 요금제 링크와 `:361` 2행 메뉴 `md:hidden` → `xl:hidden`. 1279px 이하는 이미 있는 2행 메뉴를 쓴다.
  2. `layout.tsx:279` 카카오 SDK `<script>` 와 `:291-299` 인라인 `Kakao.init` 삭제. `ShareButton.tsx` 에서만 `next/script`(strategy `lazyOnload`, 2.7.4, integrity `sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka`, crossOrigin `anonymous`)로 싣고 onLoad 에서 키가 있고 `!Kakao.isInitialized()` 일 때만 init. 키가 비면 기존 링크 복사 폴백 그대로.
  3. `incubating/page.tsx:34` title 을 "브랜드 인큐베이팅" 으로(템플릿이 접미사를 붙임), `alternates.canonical: "https://bibllab.com/incubating"` 추가.
  4. `studio/consulting/page.tsx:361` "(부가세 포함)" → "(부가세 별도)". 가격표·선택지와 일치(9/3 커밋 2eb599e 에서 빠진 한 곳).
  5. `studio/page.tsx:256` SectionLabel 안 `TrackVisit` 을 StudioPage 루트에 1회로, `studio/class/consulting/page.tsx:25` ApplyButton 안 `TrackVisit` 을 main 바로 아래 1회로. 추적 로직·키 불변.
  6. `studio/class/consulting/page.tsx:36` 보조 헤더를 `hidden xl:block`, `:94` 하단 고정 바 `md:hidden` → `xl:hidden`(1번으로 1279px 이하 네비가 2행이 되어 `top-14` 가 가려지는 것 방지).
  7. `api/toss/billing/page/route.ts:69` 돌아가기 링크에 `&period=${period}` 추가(HTML 문자열 한 줄).
  8. `mypage/page.tsx`: "구독 취소"는 `subscription?.status === "active"` 일 때만. cancelled 면 라벨 "이용 종료 예정일" + "해지됨 · 자동 갱신 안 함". 플랜 이름은 `PLANS[plan].name`(team "팀비블", admin "Admin"). CancelSubscriptionButton 은 표시 조건만.
- 완료 기준
  - 1024·820·768px(비로그인) 캡처: 로고·메뉴·우측 묶음이 겹치지 않고 2행 메뉴가 보인다. 로고 중앙의 `document.elementFromPoint` 가 로고 링크. 1280·1440px 은 한 줄 메뉴가 겹침 없이 보인다.
  - 모든 페이지 콘솔에 integrity 오류 0건. /search 외 페이지에서 `typeof window.Kakao === "undefined"`. 공유 버튼이 있는 /search 결과 화면에서만 kakao.min.js 요청.
  - /incubating HTML: `<title>브랜드 인큐베이팅 | 비블랩 (bibl lab)</title>`(접미사 1회), canonical `https://bibllab.com/incubating`.
  - `grep -n "부가세 포함" src/app/studio/consulting/page.tsx` 0건.
  - 새 세션에서 /studio, /studio/class/consulting 첫 방문 시 POST /api/track 각각 정확히 1건.
  - 토스 카드등록 화면에서 월간 선택 후 돌아가기 → `/payment?plan=…&period=monthly` 로 월간 금액.
  - 해지된 구독 계정 /mypage: "구독 취소" 없음, "해지됨 · 자동 갱신 안 함". team 플랜은 "팀비블", 취소 버튼 없음.
  - 컨설팅 상세 1024px: 보조 헤더 없음 + 하단 신청 바. 1440px: 보조 헤더.
- 적용 레퍼런스 규칙
  - reference-design §4.4 네비: 메뉴 6개 + 오른쪽 묶음이 한 줄에 들어가는 폭을 실측해 데스크톱 메뉴 시작점을 정한다(Linear·Raycast 네비는 56px 한 줄)
  - ux-rules C01 재배치·200% 확대에서 겹치지 않기(ux#112, WCAG 1.4.4·1.4.10)
  - ux-rules M22 서드파티 스크립트는 쓰는 화면에서만 지연 로드(ux#51, react#8)
  - ux-rules N09 페이지별 메타데이터(next#25~#27)
  - ux-rules H12 상태를 사실대로 보여 주기(ux#61)
- 위험
  - 불변 조건 2: layout.tsx 변경은 head 스크립트 삭제와 클래스뿐.
  - 불변 조건 4: route.ts 는 링크 문자열만, mypage 는 표시 조건만. `/api/cancel-subscription` 호출부 불변.
  - 1279px 이하가 2행 네비(약 100~134px)가 되어 `studio/class/[slug]/page.tsx:150`(sticky top-20), `insights/admin/_components/PostEditor.tsx:238`(top-14)이 가려질 수 있다. 블랙맵·관리자 화면이라 R06 의 `--nav-h` 도입 때 함께 본다.
  - 프로덕션 HTML 에 `Kakao.init('')` 가 출력된다(2026-10-06 curl 확인). 해시를 고쳐도 키가 없으면 카카오톡 공유는 링크 복사로 동작한다(결정 15).
  - 마이페이지는 로컬에서 로그인 화면을 볼 수 없다. 운영 사이트는 소유자 크롬으로 확인.
- 관련 발견: shell-01, a11y-07, mobile-02(일부), shell-09, shell-12(일부), community-07(일부), studio-03, studio-04, class-07, class-03(일부), pricing-04, auth-04(일부), auth-03

### R02 · 버그·기반 · 검색 시작 화면·채널 재차감 등 앱 동작 버그 · 공수 M

- 목표: 로그인한 사용자가 실제로 겪는 잘못된 화면과 차감을 고친다. 검색어 없는 /search 의 "검색 결과가 없어요", 가입 동선의 키워드 유실, 한도 모달의 틀린 안내, 채널 찾기 정렬·돌아가기마다 재차감, 내 채널 "최적 업로드 시간" 9시간 오차.
- 범위 페이지: /search, /, /channels, /channels/[channelId], /my-channel
- 범위 파일: `src/app/search/page.tsx`, `src/app/_components/SearchBar.tsx`, `src/app/page.tsx`, `src/app/search/_components/LimitModal.tsx`, `src/app/channels/page.tsx`, `src/app/channels/_components/ChannelResults.tsx`(신규), `src/app/channels/_components/FilterTabs.tsx`, `src/app/channels/_components/DateSortToggle.tsx`, `src/app/channels/[channelId]/page.tsx`, `src/app/my-channel/_components/ChannelDashboard.tsx`
- 변경
  1. `search/page.tsx:374` 렌더 조건에 `query &&` 추가. `!query` 면 시작 상태 블록: 허브 "영상 찾기" 설명 문장, SearchBar 의 "확인 시 검색 사용량 1회가 차감됩니다.", 이미 계산된 used/limit, 맨 SVG. "검색 결과가 없어요"는 실제 0건일 때만.
  2. 홈 로그인 모달(`page.tsx:113, 119`): redirect_url 을 `/search` 로(q 제거), 입력 키워드를 sessionStorage `bibl:pendingKeyword` 에 저장. SearchBar 는 q 가 없을 때만 이 값으로 입력창을 채우고 읽은 뒤 지운다. 자동 검색·차감 없음.
  3. LimitModal 에 `isMonthly`·`plan` prop(값은 search/page.tsx 에 있음). 초기화 문구를 실제 동작대로 "매일 오전 9시(한국 시간) 초기화" / "매월 1일 초기화", 기간 "오늘" / "이번 달", 권유 플랜 Free→Starter·Starter·team→Pro, 가격 "월 ₩19,000 (연간 결제 시 월 ₩15,000)". `search/page.tsx:287-293` 인라인 카드도 같은 문구 상수.
  4. 채널 정렬을 클라이언트로: page.tsx 는 받은 목록(최대 25개)을 정렬 전 그대로 ChannelResults 에 넘기고, `sortChannels` 는 공용 모듈로 옮겨 클라이언트에서 실행. FilterTabs·DateSortToggle 은 `router.push` 대신 상태 변경 + `window.history.replaceState` 로 URL 의 sort·dateOrder 만 갱신.
  5. `channels/[channelId]/page.tsx:263-288` 돌아가기: 목록에서 왔으면 `router.back()`(작은 클라이언트 링크), 아니면 /channels. `from` 은 `/channels` 로 시작할 때만, 이중 decode 제거.
  6. `channels/page.tsx:204-206` 잔여 표시는 증가 후 값 기준, `:233` 일 한도 사용자 문구 "오늘".
  7. ChannelDashboard: 최적 요일·시간을 recentVideos 로 브라우저에서 계산(서버 값 미표시), 보조 문구 "최근 N개 영상 기준", 영상 0개면 "-".
- 완료 기준
  - /search(검색어 없음) 1440·390: 시작 안내·차감 안내·남은 횟수, DOM 에 "검색 결과가 없어요" 없음. 결과 0건 키워드는 기존 빈 상태 유지.
  - 비로그인 홈에서 키워드 입력 → 모달 → /search 직접 열기: 입력창에 키워드, `/search?q=` 이동·서버 검색 요청 없음.
  - `grep -n "자정" src/app/search/_components/LimitModal.tsx src/app/search/page.tsx` 0건. 월 한도 플랜 모달에 "이번 달", Starter 사용자 권유가 Pro.
  - 채널 찾기(테스트 계정): 검색 1회 후 정렬 탭 3개·개설일 토글·상세 진입 후 돌아가기 → 사용량 정확히 +1, 탭 클릭 시 `_rsc` 요청 없음, URL sort 갱신.
  - `/channels/<id>?from=https%3A%2F%2Fexample.com` 의 돌아가기 href 가 /channels.
  - 한국 시간 18시에 올린 영상이 많은 채널에서 카드가 "18시".
  - `git diff src/app/_components/SearchBar.tsx` 가 초깃값 채우기뿐(10-60·166-195·219-249 행 변화 0), `git diff src/app/search/page.tsx` 에 94-184 행 변화 0.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max QR §8 empty-states, ux-rules M09 빈 상태는 이유와 다음 행동(ux#79, ux#90), 1장 (바) 7 검색어 없이 들어오면 시작 안내
  - ux-rules C07 로그인 뒤 하던 일로 복귀(app#9, QR §9 back-stack-integrity)
  - ux-rules M02 화면 상태를 URL 에(ux#5), reasoning#7 데이터 화면은 정렬·필터
  - ux-rules H12 사실과 맞는 피드백(ux#61)
- 위험
  - 불변 조건 1: 위 2.2 표의 SearchBar·search/page·홈 행. 홈 모달은 redirect_url 값과 sessionStorage 쓰기만 바꾼다.
  - 불변 조건 4: incrementChannelCount·searchChannels·한도 정책 불변. 서버를 다시 부르지 않아야 차감이 멈추므로 router.push·router.replace 금지.
  - Next 14.2 의 history.replaceState 연동으로 useSearchParams 가 갱신되는지 확인.
- 소유자 결정: 결정 11(한도 초과 모달 닫기·가입 경로), 결정 2(로그인 뒤 원래 화면 복귀). 이 항목은 둘 다 "지금 그대로"에서 할 수 있는 화면 보완만 한다.
- 관련 발견: search-01, search-02(문구), home-02(화면 보완), home-14(일부), auth-01(화면 보완), auth-09(검색 화면), channels-01, channels-05

### R03 · 버그·기반 · 디자인 토큰·글꼴·한글 타이포·포커스·모션 기반 · 공수 M

- 목표: globals.css 와 루트 레이아웃 몇 줄로 47개 라우트의 바탕을 한 번에 바꾼다. 남색 띠·청색기 글자 제거, Pretendard 실제 로드, 한글 어절 줄바꿈, 일관된 포커스 링, 움직임 줄이기, JS 없이도 보이는 스크롤 등장, 다크 네이티브 컨트롤.
- 범위 페이지: 전 페이지
- 범위 파일: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/_components/AnimationObserver.tsx`, `tailwind.config.js`(삭제), `public/fonts/pretendard/`(신규 자산)
- 변경
  1. 레이어 밖 `:root` 토큰·body 규칙·prefers-color-scheme 블록·`@theme inline` 자기참조·`.bg-dashboard`·`.card`·`.line-clamp-2`(v4 기본과 동일)·`.duration-300` 삭제.
  2. `@theme`: `--font-sans`("Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif), `--font-mono`(ui-monospace, SFMono-Regular, Menlo, Consolas, monospace), 색 `accent #00e5a0`·`accent-hover #66ffcc`·`surface-raised #1f1f1f`·`kakao #fee500`·`kakao-hover #fdd835`·`kakao-ink #191919`·`youtube #ff0000`, 글자 단계 `text-display/h1/h2/h3/h4/lead/body/body-sm/caption/micro/label-en`(크기·행간·자간·굵기 묶음, reference-design §4.1 값), `--radius-control 8px`·`--radius-card 12px`·`--radius-panel 16px`, `--container-page 75rem`·`--container-reading 42rem`. neutral 은 Tailwind 기본값 그대로.
  3. 임시 안전망: `@theme` 에서 gray·slate·zinc 11단계를 neutral oklch 값으로 재매핑(구 테마 화면의 청색기 즉시 제거). teal 은 재매핑하지 않는다(틸 채움 버튼이 에메랄드 채움 버튼이 됨).
  4. `@layer base`: html `background #000; color #fff; color-scheme: dark; -webkit-font-smoothing: antialiased; word-break: keep-all; overflow-wrap: break-word`, h1~h3 `text-wrap: balance`, p·li `text-wrap: pretty`, `:focus-visible { outline: 2px solid #00E5A0; outline-offset: 2px }`, `button:not(:disabled), [role="button"], summary { cursor: pointer }`, `::selection` 에메랄드 + 검정 글자.
  5. 레이어 밖: `@media (prefers-reduced-motion: reduce)` 전역 블록(ux-rules 4.4), `@media (hover: none)` 에서 a·button·summary `:active` opacity .7, `@media (max-width: 767px)` 에서 `.text-xs/.text-sm/.text-[13px]/.text-[15px]` 인 input·select·textarea 를 16px(iOS 확대 방지).
  6. 스크롤 등장: 숨김을 `html[data-motion="ready"] [data-animate]:not(.in-view)` 에만, 이동 12px·0.3s. AnimationObserver 는 마운트 때 화면 안 요소에 먼저 `in-view` 를 붙인 뒤 html 에 `data-motion="ready"`. reduced-motion 이면 즉시 표시.
  7. `.scrollbar-hide` 는 `@utility`, `.animate-fadeIn`·`.animate-in.slide-in-from-bottom-4` 와 /studio 전용 규칙은 이름 그대로 `@layer components` 로(정리는 R11·R17).
  8. Pretendard Variable v1.3.9 dynamic-subset(css + woff2)을 `public/fonts/pretendard/` 에 두고 head 에 `<link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css">`. `next/font` Inter import·`inter.className` 삭제, body 클래스 `bg-black text-white`. `tailwind.config.js` 삭제(v4 가 읽지 않음).
  9. `layout.tsx` 에 `export const viewport = { themeColor: "#000000", colorScheme: "dark" }`.
- 완료 기준
  - 1440 홈 하단 캡처에서 마지막 CTA 와 푸터 사이 #0b0f17 픽셀 0.
  - `getComputedStyle(document.body).fontFamily` 에 "Pretendard Variable", document.fonts 에 Pretendard, `.font-mono` 요소 고정폭, Windows 크롬에서 h1 이 900 굵기.
  - 390 홈·요금제·/studio 캡처에 "파 / 악하세요", "선택하세 / 요", "됩니 / 다." 같은 어절 중간 끊김 0.
  - 키보드 Tab: 네비 링크·화이트 CTA·FAQ 버튼이 모두 같은 에메랄드 2px 링.
  - reduced-motion 에뮬레이션에서 /studio 의 [data-animate] 요소가 처음부터 보이고 이동 없음. JS 비활성으로 /studio 를 열어도 히어로·본문이 보임.
  - 컴파일 CSS 에 `text-display` 4속성, `rounded-card`, `max-w-page`, `bg-gray-900` → `oklch(20.5% 0 0)`. /channels(비로그인) 배경 픽셀 B-R ≈ 0.
  - 모바일 에뮬레이션에서 /search 입력 포커스 시 확대 없음.
  - `ls public/fonts/pretendard/*.woff2` 결과 있음, package.json 의존성 변화 0.
- 적용 레퍼런스 규칙
  - Resend: 캔버스 #000 하나, near-black 금지(reference-design §2.1)
  - Linear: 2px 액센트 포커스 링, 액센트는 포커스 링·링크 강조 자리에만(reference-design §2.1, §4.4 {F})
  - reference-design §4.2 한글 보정(keep-all, balance, 크기별 자간, 행간 1.75, 최소 12px)
  - ux-rules 5.2 전역 CSS, C05 reduced-motion(app#24, ux#9), H17 입력 16px(ux#67), M05 cursor(ux#29), M06 눌림 피드백(ux#30), 4.5 스크롤 등장은 JS 없이도 보이게(motion#4), 6.2 Pretendard 자체 호스팅(next#22~#24)
- 위험
  - 불변 조건 2: layout.tsx 변경은 head 링크·viewport·body 클래스뿐.
  - 불변 조건 6: Pretendard 는 npm 이 아니라 자산(SIL OFL 1.1). 파일 내려받기는 사용자 승인 후. CSP 의 font-src·style-src 가 `'self'`(+Google Fonts)라 jsDelivr 는 차단되므로 자체 호스팅만 가능. middleware matcher 가 css·woff2 를 건너뛰어 점검 모드에서도 로드된다.
  - 한글 글꼴이 OS 글꼴에서 Pretendard 로 바뀌어 줄 길이가 미세하게 달라진다. 홈·요금제·/studio 캡처를 변경 전과 비교.
  - `:focus-visible` 을 base 레이어에 두므로 `focus:outline-none` 이 붙은 입력은 링이 없다(테두리 변화만). 각 화면 변환 때 INPUT 레시피로, 남은 곳은 R22 에서 정리.
  - gray 재매핑은 관리자 화면 때문에 R22 이후에도 남긴다(주석으로 이유 기록).
- 관련 발견: shell-02, shell-03, shell-06, shell-07(전역), mobile-01, mobile-05(전역), mobile-08, mobile-14, system-02(토큰), system-10, a11y-01(전역), a11y-06(CSS), home-01(줄바꿈), studio-12(전역 숨김), studio-15(₩ 글꼴)

### R04 · 공용 UI · 공용 부품 + 오류·404·점검 화면 · 공수 M

- 목표: 같은 역할의 요소를 파일마다 새로 조립하지 않게 레퍼런스 레시피를 의존성 없는 클래스 함수·얇은 컴포넌트로 고정하고, 오류·404·점검 화면에 먼저 적용해 검증한다.
- 범위 페이지: 404, 오류 화면, /maintenance
- 범위 파일: `src/components/ui/{button.ts, card.ts, badge.ts, chip.ts, tabs.ts, field.tsx, container.tsx, section-header.tsx, icons.tsx, logo.tsx}`(신규), `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/maintenance/page.tsx`
- 변경
  1. `button.ts`: `buttonClass({ variant, size, block })` 완성 문자열 맵. primary `bg-white text-black font-bold hover:bg-neutral-200 active:bg-neutral-300` · secondary `border border-neutral-700 bg-neutral-900 text-white font-semibold hover:border-neutral-600 hover:bg-neutral-800` · ghost `text-neutral-300 hover:bg-neutral-900 hover:text-white` · danger `border border-red-400/40 text-red-400 hover:bg-red-500/10` · kakao `bg-kakao text-kakao-ink font-bold hover:bg-kakao-hover`. 공통 `inline-flex items-center justify-center gap-2 rounded-control whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40`. 크기 sm `h-9 px-3.5 text-sm` · md `h-11 px-5 text-[15px]` · lg `h-12 px-6 text-base`. button·a·Link 공용.
  2. `card.ts`: CARD `rounded-card border border-neutral-800 bg-neutral-900`, 여백 sm `p-4 md:p-5` · md `p-6 md:p-8`, CARD_LINK `transition-colors duration-150 hover:border-neutral-700 hover:bg-surface-raised`(누를 수 있는 카드만), CARD_FEATURED `border-neutral-600 bg-surface-raised`.
  3. `badge.ts`: `inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-medium` + neutral·accent·warn·danger·success·solid(추천 1곳).
  4. `chip.ts`: 칩 `inline-flex h-8 items-center rounded-full border border-neutral-800 px-3 text-[13px] text-neutral-300 hover:border-neutral-700 hover:text-white` + 선택 `aria-pressed:`/`aria-[current=page]:` 면 한 단(neutral-800), 세그먼트 토글(틀 neutral-950, 선택 `aria-selected:bg-neutral-800`).
  5. `tabs.ts`: 밑줄 탭(CommunityTabs 패턴) 목록 `flex gap-1 overflow-x-auto border-b border-neutral-800`, 탭 `-mb-px border-b-2 px-3 py-2.5 text-sm`, 현재 `aria-[current=page]:border-accent aria-[current=page]:text-white aria-[current=page]:font-semibold`, 대기 `border-transparent text-neutral-400 hover:text-white`.
  6. `field.tsx`: INPUT `h-11 w-full rounded-control border border-neutral-700 bg-neutral-900 px-3.5 text-base md:text-[15px] text-white placeholder:text-neutral-500 hover:border-neutral-600 focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50 aria-[invalid=true]:border-red-400`, TEXTAREA, Label(htmlFor), Hint, ErrorText(role="alert"), Field 묶음(aria-describedby 연결).
  7. `container.tsx`: Container(page/reading, `mx-auto w-full px-4 md:px-6`), SECTION `py-16 md:py-24`, SECTION_HERO `pt-20 pb-16 md:pt-32 md:pb-24`, APP_HEAD `py-8 md:py-12`.
  8. `section-header.tsx`: studio SectionLabel 마크업 이전(TrackVisit 없이), 캡션 neutral-400, 영문 라벨 `lang="en" aria-hidden` + `font-black tracking-[0.25em]`, 헤어라인, `mb-10 md:mb-12`. TwoToneHeading(리드 neutral-400 + 흰색, `text-h3 md:text-h1`).
  9. `icons.tsx`: 검색·화살표·체크·닫기·잠금·아래 화살표·외부 링크·재생·경고·정보, stroke 2, 16/20/24px, aria-hidden 기본. `logo.tsx`: B 마크 + "bibl"(흰색) " lab"(neutral-400), sm/md, 인라인 font-family 없음.
  10. 시범 적용: not-found·error·maintenance 를 같은 틀로(큰 텍스트 "404"/"ERROR"/"점검 중" font-black neutral-700 aria-hidden + 제목 + 설명 + primary·secondary), 이모지 제거, gray→neutral, `min-h-screen` → `min-h-[60vh]`, not-found metadata title "페이지를 찾을 수 없어요", maintenance title 은 "시스템 점검 중"만, 404 보조 버튼 /trend-search, 점검 문의 mailto + 카카오 채널 링크. error.tsx 의 홈 링크는 `<a>` 유지(오류 복구에 전체 새로고침).
- 완료 기준
  - `src/components/ui/` 에 10개 파일, 클래스 함수에 문자열 조립 0(`grep -n '\${' src/components/ui/*.ts` 에 클래스 조립 없음).
  - 없는 경로·/maintenance(로컬 MAINTENANCE_MODE=true)·error(강제 throw) 1440·390 캡처가 같은 레이아웃, 이모지 0, 화이트 버튼 1개.
  - 404 탭 제목 "페이지를 찾을 수 없어요 | 비블랩 (bibl lab)", 점검 탭 제목 접미사 1회.
  - 버튼 실측 높이 36/44/48px, 반경 8px.
- 적용 레퍼런스 규칙
  - Resend·Raycast 주 버튼: 흰 면 + 검정 글자, 반경 8px, 흰 면은 뷰포트당 1개(reference-design §2.7)
  - Linear "Don't pill-round CTAs", 반경 3단 8/12/16(reference-design §2.4)
  - Raycast 칩: 선택 시 면 한 단(reference-design §2.7)
  - shadcn#7·#57·#58 버튼 변형을 한 곳에서, tw#56 완성 토큰(ux-rules 5.6·5.7)
  - ux-rules H07·H08 보이는 라벨·필드 아래 오류(ux#43, ux#55), 6.4 아이콘 한 가족·선 굵기 2·이모지 금지
- 위험
  - 클래스를 조립하면 Tailwind 가 생성하지 못한다(T17). 맵 값은 항상 완성 문자열.
  - 반경이 기존 rounded-xl 버튼·rounded-2xl 카드보다 한 단 작아진다. `rounded-control`·`rounded-card` 만 쓰게 해 토큰 한 줄로 되돌릴 수 있다.
  - 점검 모드는 middleware rewrite 라 네비가 보인다(브라우저 주소가 원래 경로라 클라이언트에서 판정 불가). 이번 범위는 화면 틀만.
- 관련 발견: system-01, system-05, system-06, system-07, system-08, system-09, system-11(아이콘·로고), shell-15, shell-11(로고 컴포넌트)

### R05 · 공용 UI · 대화상자 셸·레이어 체계·하단 고정 바·카카오 버튼 · 공수 M

- 목표: 겹침 순서를 정하고 모달을 네이티브 `<dialog>` 하나로 통일해, 카카오 버튼이 모달·하단 CTA·토스트를 덮지 않게 한다.
- 범위 페이지: 전역 확인창(검색 확인·삭제 확인), /studio/class/consulting(모바일 하단 바), /search(토스트·카카오 채널 배너)
- 범위 파일: `src/components/ui/dialog.tsx`(신규), `src/components/ui/bottom-cta-bar.tsx`(신규), `src/app/_components/ConfirmDialog.tsx`, `src/app/_components/KakaoChatButton.tsx`, `src/app/globals.css`, `src/app/studio/class/consulting/page.tsx`, `src/app/search/_components/SearchResultList.tsx`(토스트 위치 클래스만), `src/app/search/_components/KakaoChannelBanner.tsx`(위치 클래스만)
- 변경
  1. 레이어 단계(1.1 표)를 globals.css 주석으로 문서화. 모달은 top layer 라 z 값을 쓰지 않는다.
  2. `dialog.tsx`: `<dialog>` + showModal()/close(), aria-labelledby·aria-describedby, 열 때 첫 버튼(destructive 면 "취소")에 포커스, 닫을 때 연 요소로 복귀, Esc(cancel 이벤트, `dismissible=false` 면 막음), 바깥 클릭 닫기(dismissible 일 때), html 스크롤 잠금, 패널 `w-full max-w-sm rounded-panel border border-neutral-800 bg-neutral-900 p-6`, `backdrop:bg-black/80`, 모바일 하단 정렬 변형, 그림자·블러 없음.
  3. ConfirmDialog 를 dialog 셸로(useConfirm API·Promise 결과 불변). window keydown 의 Enter 처리 삭제(Enter 는 포커스된 버튼만), `destructive` 옵션(확인 버튼 danger + 처음 포커스 취소), 마크를 Logo(B)로, 버튼은 buttonClass.
  4. KakaoChatButton: z-50 → z-40, `data-kakao-fab`, hover:scale·shadow 제거, hover `#FDD835`. globals.css 에 `@media (max-width: 1279px) { body:has([data-bottom-bar]) [data-kakao-fab] { bottom: calc(88px + env(safe-area-inset-bottom)) } }`.
  5. `bottom-cta-bar.tsx`: `sticky bottom-0 z-30 border-t border-neutral-800 bg-black/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]` + `data-bottom-bar`, `hideFrom: "md" | "xl"`(완성 클래스 맵). 컨설팅 상세의 기존 하단 바를 교체(hideFrom xl).
  6. 수집 완료 토스트(`SearchResultList.tsx:545`)·카카오 채널 배너(`KakaoChannelBanner.tsx:43`): 모바일 `left-4 right-4 bottom-24`, 데스크톱 `bottom-24 right-6`, z-70. 클래스만.
- 완료 기준
  - /search 검색 확인창: Tab 이 창 안에서만 돌고 Esc 로 닫히며 포커스가 검색 버튼으로 복귀. "취소"에 포커스 + Enter → 검색 실행 안 됨.
  - 확인창이 열린 상태 1440·390 캡처에서 노란 카카오 버튼이 배경 막 위에 보이지 않음.
  - /studio/class/consulting 390: 카카오 버튼과 하단 바의 getBoundingClientRect 겹침 0, 신청 버튼 전체 폭 클릭 가능.
  - 토스트·채널 배너의 닫기 버튼이 카카오 버튼과 겹치지 않음(390·1440).
  - `grep -n 'z-\[' src/app/_components/ConfirmDialog.tsx src/app/_components/KakaoChatButton.tsx` 0건.
- 적용 레퍼런스 규칙
  - shadcn#13·#53 대화상자 제목·설명, 포커스 가둠·복귀, Esc(ux-rules 5.7, H02)
  - shadcn#42·#43 파괴적 확인 표준형(ux-rules H13)
  - ux#15·tw#5 z-index 는 정한 단계만(ux-rules H28·5.6), ux#16·#17 고정 요소 겹쳐 쌓지 않기, ux#105 도움 수단은 같은 자리(ux-rules M16·M17)
  - Resend 모달: 그림자 없이 neutral 면 + 선, 블러 없음(reference-design §4.4)
  - landing#1·#14 모바일 하단 고정 CTA(ux-rules 1장 (다))
- 위험
  - ConfirmDialog 는 검색 확인(`SearchBar.tsx:230-233`)에 쓰인다. useConfirm 반환값과 호출 순서를 그대로 둬야 불변 조건 1 이 지켜진다.
  - 네이티브 dialog 는 iOS 15.4+, `body:has()` 는 Safari 15.4+·Firefox 121+.
  - 카카오 버튼은 숨기지 않고 층과 위치만 바꾼다(소유자가 만든 전역 도움 수단).
- 관련 발견: system-04, shell-08, mobile-03, search-14, a11y-04(셸), auth-11, auth-10, class-03(카카오 겹침), studio-11(카카오 겹침 일부)

### R06 · 공용 UI · 전역 네비·푸터·공유 이미지·로딩 표시 · 공수 M

- 목표: 모든 페이지의 위아래 틀을 레퍼런스 네비·푸터 레시피로 정리한다. 현재 위치 표시, 새로고침 없는 이동, 본문과 같은 좌우 기준선, 대비가 충분한 푸터와 서비스 링크, 사이트와 같은 공유 미리보기.
- 범위 페이지: 전 페이지(네비·푸터), 링크 미리보기, 홈 화면 추가 아이콘
- 범위 파일: `src/app/layout.tsx`, `src/app/_components/NavLink.tsx`(신규), `src/app/_components/NavUser.tsx`, `src/app/_components/SearchUsageBadge.tsx`, `src/app/_components/NavigationLoader.tsx`, `src/app/globals.css`, `src/app/opengraph-image.tsx`(삭제), `src/app/manifest.ts`, `src/app/icon.tsx`
- 변경
  1. NavTab → NavLink 클라이언트 잎(usePathname): 활성 경로에 `aria-current="page"` + 표시. 결정 3 기본: 필 항목 `bg-white/[0.12]`, 요금제 흰 글자, 컨설팅·대행 `#66FFCC` + 2px 밑줄. 결정 3=A: 아이콘·필 제거, 기본 neutral-400·활성 흰 글자 + 2px 흰 밑줄, 컨설팅·대행 에메랄드 유지.
  2. 네비·로고·푸터·모바일 2행의 내부 `<a>` 를 next/link 로(외부·mailto 는 `<a>`), 긴 페이지(/studio/class/consulting)는 `prefetch={false}`.
  3. 네비 안쪽을 `mx-auto max-w-page px-4 md:px-6 h-14` 로, 우측 묶음 고정 최소 폭, NavUser 스켈레톤은 버튼 두 개 크기의 정적 자리(펄스 없음), 로그인·시작하기는 buttonClass(ghost sm·primary sm), 아바타 `aria-label="마이페이지"` + 40px. SearchUsageBadge 는 조회 전 같은 폭 자리, pathname 변경 시 재조회, sr-only 문장("영상 검색 2회 남음") aria-live polite.
  4. 모바일 2행: 5개를 같은 칩(h-9 px-3 rounded-full text-[13px], 데스크톱 필과 같은 반경, 필 3개 `bg-white/[0.06]`, 에메랄드 2개 글자색만), 배경 bg-black 하나, 1행 요금제·로그인·시작하기 높이 36px 이상. 결정 4=A 면 nav 를 header 로 감싸 1행만 sticky.
  5. `:root --nav-h`(1280px 이상 56px, 미만은 결정 4 에 따른 실측값), `html { scroll-padding-top: calc(var(--nav-h) + 16px); scroll-padding-bottom: 6rem }`.
  6. body 첫 요소 "본문 바로가기"(sr-only, focus 시 화이트 칩, z-[90]) + `{children}` 을 `<div id="content" tabIndex={-1} className="flex-1">` 로 감싸고 body 를 `flex min-h-dvh flex-col`, 푸터 `mt-16` 삭제.
  7. 푸터: bg-black, Container(page) `py-12 md:py-16`, 글자 neutral-400 이상(사업자 정보·YouTube 고지 포함), "서비스" 열(브랜드 인큐베이팅·커뮤니티&자료·유튜브 트렌드 서치·팀비블 1:1 유튜브 컨설팅·요금제·비블랩 소개. 대행 문의는 결정 1 이 A·B 일 때만), 링크 h-8, 문의하기 옆 카카오톡 채널 링크, 태그라인 `—` → "·", Logo, `<nav aria-label="푸터">`.
  8. 공유 이미지: `opengraph-image.tsx` 삭제(레이아웃의 `/og-image.png` 가 전 페이지 og:image), manifest `background_color`·`theme_color` #000000, `icon.tsx` 모양을 favicon.svg 와 같은 둥근 사각, head 수동 아이콘 링크 3줄(278, 280-281) 삭제.
  9. NavigationLoader: 클릭 인터셉터에서 `/api/` 링크·`download` 링크 제외, 오버레이 카드 `role="status" aria-live="polite"` + 스피너 aria-hidden, z 값을 z-80 단계로, 투명 span·"글로우" 주석 삭제.
  10. 네비 로고는 Logo(인라인 fontFamily 삭제), `<nav aria-label="주 메뉴">`.
- 완료 기준
  - 1440 캡처: 네비 로고 x = 푸터 로고 x = 섹션 본문 시작 x(1200 컨테이너 기준 120px).
  - /pricing 에서 "요금제" 링크 aria-current + 활성 표시, /community 하위에서 "커뮤니티&자료" 활성.
  - 메뉴 클릭 시 문서 재요청 없음(`performance.getEntriesByType('navigation').length` 1 유지), 로그인 상태 전환에도 첫 메뉴 x 좌표 불변.
  - 첫 Tab 에 "본문 바로가기", Enter 후 포커스 #content.
  - 390 푸터: 정보 글자 대비 7:1 이상, 링크 높이 32px 이상, `—` 0.
  - curl: /, /community, /trend-search, /pricing 의 og:image 가 `/og-image.png`, manifest theme_color #000000.
  - 768·1024px 겹침 0 유지(R01), 2행 칩 높이 36px 이상.
- 적용 레퍼런스 규칙
  - Linear·Raycast 네비: 높이 56, 캔버스 배경, 아래 1px 선, 텍스트 링크, 오른쪽 로그인 + 흰 버튼(reference-design §2.7, §4.4 네비 바)
  - Resend 컨테이너 1200 + 거터 16/24 를 네비·섹션·푸터 공통(reference-design §4.1, ux-rules T05)
  - Raycast 푸터: 캔버스 배경, 위 1px 선, 여백 64, 링크 본문색(reference-design §4.4 푸터)
  - ux-rules M01 aria-current(ux#3), N01 next/link(next#42), M03 건너뛰기 링크·랜드마크(ux#45), H03 고정 헤더가 포커스를 가리지 않게(ux#100), H22 배지 숫자는 문장으로(ux#118), M18 dvh(ux#20), H16 터치 타깃(ux#104)
- 위험
  - 불변 조건 2: 경로 판정은 NavLink 클라이언트 잎에서만.
  - SearchUsageBadge 재조회는 표시용 GET(/api/usage)만. 검색 차감과 무관.
  - 1200 컨테이너(본문 1152px)에서 1280px 로그아웃 상태 메뉴 6개 + 우측 묶음(약 1,138px)이 빠듯하다. 겹치면 데스크톱 메뉴 시작점을 `min-[1320px]` 로 올린다(결정 3=A 면 폭이 줄어 여유가 생김).
  - 화이트 필·아이콘(8/14 커밋 3c5cbba)과 모바일 2행 전체 노출(8/30 925a943)은 소유자가 정한 것이라 결정 3·4 전에는 모양을 바꾸지 않는다.
  - 카카오톡 미리보기는 캐시가 남을 수 있다(카카오 공유 디버거로 갱신).
- 소유자 결정: 결정 3(데스크톱 메뉴 모양), 결정 4(모바일 2행 고정), 결정 1(푸터 대행 문의 링크)
- 관련 발견: shell-04, shell-05, shell-10, shell-11, shell-12(아이콘 중복), shell-13, shell-14(진행 막대), mobile-02, mobile-10, mobile-12(푸터), system-03, system-07(네비), system-11(로고), a11y-08, a11y-09(로딩 오버레이), auth-12(아바타 이름)

### R07 · 공개 페이지 · 홈 · 공수 M

- 목표: 홈을 "입력 히어로 → 기능 → 서비스 갈래 → 마지막 CTA" 구조로 정리하고 모바일 첫 화면에 헤드라인과 검색창이 다 들어오게 한다. 검색 누적 로직은 글자 하나 바꾸지 않고 옮기기만 한다.
- 범위 페이지: /
- 범위 파일: `src/app/page.tsx`, `src/app/_components/HomeSearch.tsx`(신규), `src/app/_components/LandingStats.tsx`, `src/app/layout.tsx`(루트 canonical 만)
- 변경
  1. page.tsx 를 서버 컴포넌트로. 검색 폼·예시 칩·로그인 모달·인증 확인·방문 기록을 HomeSearch(클라이언트)로 그대로 이동. 홈 metadata 에 canonical "/" 를 두고 `layout.tsx:56-58` 루트 canonical 삭제.
  2. 히어로: h1 `text-h2 md:text-display`, 핵심어 에메랄드 1곳 유지, 숨김 br 앞 `{" "}`, 모바일 `pt-10 pb-12 md:pt-32 md:pb-24`·`space-y-6 sm:space-y-8`, 검색창은 히어로 검색창 레시피(h-14 md:h-16, rounded-card, focus-within 에메랄드, 그림자 없음), 입력 aria-label "검색할 키워드", 버튼 primary md.
  3. 예시 칩: 칩 레시피(h-8). 로그인 사용자에게 칩 아래 "누르면 검색 1회가 차감됩니다" 한 줄(결정 10=A 면 칩도 확인창).
  4. 로그인 모달 → Dialog 셸, 버튼은 primary "회원가입 후 검색하기" + 닫기, 안내 문구 neutral-400(R02 의 sessionStorage 동작 유지).
  5. LandingStats: 초기 HTML 을 최종값으로(0+ 없음), 화면에 들어올 때 1초 이하 카운트업, reduced-motion 이면 생략, `border-y` → `border-t`. 숫자·라벨 문구는 결정 6.
  6. 기능·3단계 섹션에 SectionHeader(좌 "bibl lab" + 우 FEATURES·HOW IT WORKS)와 TwoToneHeading, 컨테이너 page 하나, 클릭 안 되는 카드의 hover·`-m-4` 제거, 제목 단계 h1→h2→h3.
  7. 서비스 갈래 섹션 신설: CARD_LINK 로 커뮤니티&자료·팀비블 1:1 컨설팅·브랜드 인큐베이팅(결정 1 이 A·B 면 채널 대행 추가). 문구는 각 페이지의 기존 문장.
  8. 마지막 CTA: primary "무료로 시작"(상단 검색창으로 이동) + 텍스트 링크 "요금제 보기"(기존 문구).
- 완료 기준
  - 빌드 표에서 / 가 정적(○).
  - 390×844: 네비 아래 첫 화면에 h1 전체와 검색창 하단(위에서 약 700px 이내), h1 어절 단위.
  - 1440: 섹션마다 같은 왼쪽 기준선, 섹션 헤더 패턴, 흰 면은 검색 버튼 1개(+네비 "시작하기").
  - `curl /` 에 "0+" 없음, 통계 최종값 포함.
  - 로그인 사용자로 같은 키워드 두 번 검색 → `/search?q=…&count=N` 의 N 이 1 → 2(변경 전과 같은 형식), localStorage 기록 count 증가.
  - 모달: Esc 로 닫힘, 열 때 첫 버튼 포커스, dialog 이름이 제목.
  - 자체 canonical 이 없는 페이지 HTML 에 홈 canonical 없음.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max landing#30·#22: 입력 히어로, 검색이 주 CTA, 예시 칩으로 마찰 감소(ux-rules 1장 (가))
  - landing#1·#31: 핵심 기능 3~5개, 카드당 메시지 하나, 히어로 + 하단 CTA 반복
  - Resend 히어로: 디스플레이 헤드라인 1개 + 흰 CTA 1개, 장식 없음(reference-design §2.7, §4.4 히어로)
  - Raycast 44px 이상 검색창, 그림자 없음(reference-design §4.4 히어로 검색창)
  - landing#12·#20·#23 수치는 현재값·검증·날짜가 있을 때만(결정 6)
  - ux-rules N04 서버 컴포넌트 기본(next#7~#9), H02 모달 접근성
- 위험
  - 불변 조건 1: `page.tsx:40-73`(saveToHistory, trySearch, router.push)를 HomeSearch 로 글자 그대로 이동. 방문 기록 fetch 도 그대로(TrackVisit 으로 바꾸면 집계 방식이 바뀜).
  - 불변 조건 2: layout.tsx 는 canonical 줄 삭제만.
  - 루트 canonical 삭제 뒤 색인 대상인데 자체 canonical 이 없는 페이지(/channels/[channelId])는 R19 에서 추가. noindex 페이지는 불필요.
  - 서비스 카드의 대행 링크는 결정 1 전에는 넣지 않는다(일반 방문자가 홈으로 튕김).
- 소유자 결정: 결정 6(10,000+·"인기 키워드"), 결정 10(예시 칩 확인창), 결정 1(대행 카드)
- 관련 발견: home-01, home-03, home-05, home-07, home-10, home-11, home-12, home-15, shell-12(루트 canonical), a11y-04(홈 모달), a11y-06(LandingStats)

### R08 · 공개 페이지 · 트렌드 서치 허브·소개·약관류·계산기 · 공수 M

- 목표: 구 테마로 남은 정적 공개 페이지(소개·약관 3종·계산기)를 확정 테마로 바꾸고, 허브 잠금 표기와 모바일 밀도를 정리한다. 문장은 바꾸지 않는다(결정 8 범위 제외).
- 범위 페이지: /trend-search, /about, /terms, /privacy, /refund, /tools/calculator
- 범위 파일: `src/app/trend-search/page.tsx`, `src/app/about/page.tsx`, `src/app/_components/LegalArticle.tsx`(신규), `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/app/refund/page.tsx`, `src/app/tools/calculator/page.tsx`, `src/app/tools/calculator/_components/CalculatorClient.tsx`
- 변경
  1. 허브: h1 두 톤, 카드 CARD_LINK, 잠금은 badge(neutral) + 자물쇠 SVG + 글자, 모바일 카드 p-5·아이콘과 제목 한 줄, 잠금 이유 한 줄 + "요금제 보기". 판정은 결정 9(A 면 PLANS 의 canChannelSearch·dailyChannelSearchLimit 로 "무료 1회/일" 캡션 + 바로가기).
  2. about: bg-black, gray→neutral, 틸·블루·퍼플 소제목 → 흰색, 에메랄드는 h1 핵심어 1곳, 틸 배지 → SectionHeader(좌 "bibl lab" 우 ABOUT), h1·h2 font-black, 틸 채움 CTA → primary + secondary, 카드 19개 중 FAQ·기능은 `divide-neutral-800` 헤어라인 목록, openGraph images. 사실 정정(플랜명·팀 공유·연간 기준 표기)은 결정 8 이 B 이상일 때.
  3. LegalArticle: bg-black, Container(reading), 본문 `text-[15px] leading-[1.75] text-neutral-300`, h1 `text-h3 md:text-h2`, h2 `text-h4`, 목록 `list-outside pl-5`, 링크는 본문 링크 레시피(흰색 밑줄), 이메일 mailto·전화 tel, YouTube API 고지 박스 최상단 유지 + border-neutral-700, 표 13px 이상·첫 열 whitespace-nowrap·모바일 `overflow-x-auto` 상자, h2 id + 상단 조항 목록. terms·privacy·refund 를 이 래퍼로(문장 불변).
  4. 계산기: bg-black, 카드 neutral, 단계 01·02 텍스트 숫자, 이모지 제거, "데이터 가져오기" primary, 계산 버튼 4색 → secondary 하나, 결과 박스 neutral-900 단색(그라데이션 제거), 사용 안내 앰버 + 맨 SVG, 고지문 12px neutral-400, label htmlFor, 버튼 묶음 fieldset/legend, 결과 aria-live polite, placeholder 짧게 + 형식 안내는 입력 아래 도움말, 제목 줄 "영상 ID: …", 입력 `inputMode="url"`.
- 완료 기준
  - 여섯 경로 정적(○) 유지.
  - 범위 파일 `grep -E '(gray|slate|teal|blue|purple|pink|orange)-[0-9]|bg-gradient'` 0건(앰버 시맨틱 제외), 이모지 0.
  - 1440·390: 배경 #000, 화이트 버튼 화면당 1개, 약관 표는 상자 안에서만 가로 스크롤(페이지 scrollWidth = 390), 목록 둘째 줄이 글머리표 오른쪽에서 시작.
  - 약관 본문 폭 672px, `git diff --word-diff` 에서 약관 문장 변화 0(className·마크업만).
  - 허브 390: 카드 4장이 약 1.5화면 안.
- 적용 레퍼런스 규칙
  - ux-rules 1장 (가) 트렌드 서치: 카드 전체가 링크, 잠금은 테두리 배지 + 글자(QR §1 color-not-only), 잠금 이유를 숨기지 않음(QR §9 empty-nav-state)
  - reference-design §4.1 reading 672px, §4.2 본문 행간 1.75
  - ux-rules M19 한글 약 36~45자(ux#21, ux#73), H18 넓은 표는 상자 안 스크롤(ux#69)
  - ux-rules 9.1 #7 플랜별 색·#8 색 배경 CTA 불채택, 6.4 이모지 금지
- 위험
  - 약관류는 법적 문서라 문장·조항 번호를 바꾸지 않는다. 내용 불일치(pricing-09)는 결정 8.
  - 허브의 auth() 는 페이지 안이라 불변 조건 2 와 무관. 표시만 바꾸고 결제·한도 로직은 그대로.
  - 계산기 영상 제목은 서버 액션이 제목을 주지 않아 "영상 ID"로 표기(액션 수정은 범위 밖).
- 소유자 결정: 결정 9(허브 잠금 표기), 결정 8(about·약관 사실 정정), 결정 14(계산기 진입 경로)
- 관련 발견: home-06, home-08, home-09, home-14(모바일 카드), pricing-14, pricing-15, channels-09(허브 잠금), system-03(about OG)

### R09 · 공개 페이지 · 요금제 · 공수 M

- 목표: 요금제를 "카드 → 비교표 → FAQ → 마지막 CTA" 구조로 다듬고, 실제 청구액·현재 플랜·결제 실패를 카드에서 바로 알게 한다.
- 범위 페이지: /pricing
- 범위 파일: `src/app/pricing/page.tsx`, `src/app/pricing/_components/PricingCards.tsx`, `src/app/pricing/_components/PricingButtons.tsx`, `src/app/pricing/_components/FaqAccordion.tsx`, `src/app/pricing/_components/PricingNotice.tsx`(신규)
- 변경
  1. 결제 실패 안내: PricingNotice(클라이언트, Suspense 안)가 `?error=billing|payment|portone` 과 토스 message 를 읽어 헤더와 토글 사이에 레드 시맨틱 배너(role="alert", 맨 SVG, 문구는 `payment/page.tsx:29-31` 기존 문장). page 는 searchParams 를 읽지 않는다.
  2. 연간 선택 시 가격 아래 "연 ₩180,000 결제"(yearlyTotal), 월간은 "매월 결제", 절약 문구 유지, 가격 `text-h3 md:text-h2 font-extrabold tabular-nums`.
  3. 카드: 네 장 모두 1px neutral-800, 추천(Pro)만 CARD_FEATURED + 카드 안 에메랄드 "추천" 글자, primary 는 추천 1개·나머지 secondary 하나, lg 이상 가격 블록 고정 높이(빈 줄 invisible)로 행 정렬·토글 시 밀림 0, 체크·제외는 맨 SVG(체크 neutral-300, 제외 neutral-500 + sr-only "미포함", 취소선 제거), 12px 이하 글자 neutral-400, 한글 uppercase 제거, h1 font-black.
  4. 현재 플랜: PricingCards 가 `/api/usage` 를 1회 읽어 현재 플랜 CTA 를 "현재 플랜"(비활성)으로, 인증 확인은 1회로 내려 줌, 로딩 중에도 정상 스타일.
  5. 비로그인 유료 플랜 클릭: plan·period 를 sessionStorage 에 저장, 로그인 뒤 /pricing 에 오면 해당 CTA "결제 이어서 하기"(결정 2=A 면 redirect_url 에 `/payment?plan=&period=` 방식으로 대체).
  6. TEAM BIBL CTA 아래 기존 문장 "신청 페이지로 이동합니다" + 새 창 아이콘, "컨설팅 안내 보기" 텍스트 링크. 명칭·구성 문구는 결정 8.
  7. 모바일: 제외 기능 줄 `hidden sm:flex`, CTA h-11 이상.
  8. 토글: `role="group" aria-label="결제 주기"` + aria-pressed, 세그먼트 레시피, 할인 배지는 두 상태 모두 에메랄드 글자.
  9. FAQ: 질문 `h3 > button`(type, aria-expanded, aria-controls), 답변 항상 렌더 + hidden 속성, 답변 속 "환불 정책 페이지"·"마이페이지 > 구독 관리" 를 Link 로.
  10. 카드 아래 기능 비교표(카드에 있는 항목만, thead·th scope, 모바일 가로 스크롤 상자)와 마지막 CTA(primary "무료로 시작" + 텍스트 링크).
- 완료 기준
  - /pricing 정적(○) 유지(page 에 searchParams·auth() 없음).
  - /pricing?error=billing 1440·390: 레드 배너와 기존 안내 문장, role=alert.
  - 연간 기본: Starter·Pro 카드에 "연 ₩180,000 결제"·"연 ₩468,000 결제".
  - 1440: 네 카드의 "사용량" 라벨 y 동일, 토글 전환 시 FAQ 시작 y 변화 0, 테두리 색 2종.
  - Pro 계정(소유자 크롬): Pro 카드 "현재 플랜".
  - 키보드: 토글 aria-pressed 전환, FAQ Enter 로 열림, 닫힌 답변도 Ctrl+F 로 찾힘.
  - 범위 파일 `text-neutral-(600|700)`·`border-2` 0건.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max landing#8·#14: 카드 → 비교표 → FAQ → 마지막 CTA, 실제 월·연 합계와 절약액(ux-rules 1장 (나))
  - Resend·Linear·Raycast 공통: 추천 요금제는 색 대신 면 한 단 + 같은 1px 선(reference-design §2.7, §3 #12)
  - reference-design §4.4 요금제 안쪽 레시피(tabular-nums, 제외 sr-only)
  - shadcn#29·#30 아코디언 aria-expanded, ux-rules C03 토글 상태(ux#117), H10 role=alert(ux#44), QR §4 primary-action
- 위험
  - 불변 조건 4: 결제 API·리다이렉트 그대로. 실패 안내는 쿼리만 읽는 표시 계층.
  - `/api/usage` 는 네비 배지가 쓰는 표시용. 결제 진입 조건으로 쓰지 않는다.
  - useSearchParams 컴포넌트를 Suspense 로 감싸지 않으면 페이지가 CSR 로 떨어진다.
- 소유자 결정: 결정 2(로그인 뒤 결제 복귀), 결정 8(TEAM BIBL 명칭·하단 환불 문장)
- 관련 발견: pricing-01, pricing-02, pricing-03, pricing-08(일부), pricing-10, pricing-11, pricing-12, pricing-13, auth-04(요금제 안내), system-06(요금제 카드), system-08(토글)

### R10 · 공개 페이지 · 로그인·결제 화면 · 공수 M

- 목표: 가입·결제 직전 화면을 같은 블랙 테마로 맞추고 실패·취소를 화면에서 알린다.
- 범위 페이지: /sign-in, /sign-up, /sso-callback(오류), /payment, /payment/toss/fail, 토스 카드등록 화면
- 범위 파일: `src/app/sign-in/_components/SignInForm.tsx`, `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`, `src/app/sso-callback/error.tsx`, `src/app/payment/page.tsx`, `src/app/payment/_components/PaymentButtons.tsx`, `src/app/payment/toss/fail/page.tsx`, `src/app/api/toss/billing/page/route.ts`
- 변경
  1. SignInForm: `?error=auth_failed|no_code` 를 읽어 카드 상단 role="alert" 안내(레드 글자 + `border-red-400/40`, "로그인을 완료하지 못했습니다. 다시 시도해 주세요." / "로그인이 취소되었습니다."), OAuth 호출 오류도 같은 자리, 동의 체크 sessionStorage 보관·복원.
  2. 모바일 위 정렬(`items-start pt-8 sm:items-center`), 카드 위 로고·태그라인 블록 삭제, 이미 로그인 상태면 "이미 로그인되어 있습니다" + 검색으로 가는 primary, `?ref=` 가 있으면 초대 안내 한 줄.
  3. 대비·터치: 보조 문구 neutral-400 이상(`:224, :285, :298`), 동의 행 py-2.5(44px)·체크박스 18px·"보기" px-2 py-2, "전체 동의 (선택 포함)".
  4. 인앱 브라우저 경고: 카드 안 구글 버튼 아래 앰버 글자 + `border-amber-400/40`(채움 없음), 외부 열기·주소 복사 secondary, 복사 후 "주소를 복사했습니다", 실패 시 주소 텍스트 선택 가능, 구글 버튼은 흐리게 하지 않고 "(Chrome에서 열기)".
  5. 결정 11=A 면 동의·로그인 2단계를 한 화면으로(필수 동의 전 OAuth 버튼 비활성). 결정 2=A 면 redirect_url·next 를 읽어 `/` 로 시작하는 내부 경로만(`//`·`/\` 시작 차단) encodeURIComponent 로 콜백 next 에 전달, sign-up 리다이렉트는 쿼리 유지.
  6. sign-in metadata title "로그인", 최상위 main.
  7. 결제 화면: bg-black, gray→neutral, 선택 상태 border-white, 스피너 neutral, 입력 INPUT(보이는 라벨, autoComplete name·tel, inputMode numeric), "카드 등록 및 결제" primary, 결제수단 로고 박스 → 이름 텍스트, 준비중 카카오페이 disabled + aria-disabled, `alert()` → 목록 아래 인라인 레드 영역 role=alert, 폼을 여는 항목은 아래 화살표·이동 항목은 오른쪽 화살표, 자동 갱신·7일 취소 고지 neutral-400 13px, 연간 주문 요약 "월 ₩15,000 꼴 · 12개월".
  8. 토스 카드등록 HTML(`route.ts:52-64` 인라인 CSS): #000 배경, #171717 카드, #262626 테두리, 흰 버튼 + 검정 글자, `.back` #a1a1a1. 스크립트 불변.
  9. /payment/toss/fail·sso-callback/error: R04 상태 화면 틀, 원형 아이콘 박스 제거.
- 완료 기준
  - /sign-in?error=auth_failed 1440·390: 카드 상단 안내(role=alert). 390 에서 진행 버튼(또는 합친 화면의 카카오 버튼) 하단이 위에서 640px 이내.
  - 범위 파일 `grep -E '(gray|teal|blue)-[0-9]|bg-(amber|green)-[0-9]'` 0건, PaymentButtons `alert(` 0건, SignInForm `text-neutral-(600|700)` 0건.
  - 결정 2=A 적용 시 `/sign-in?redirect_url=%2Fcommunity` → 로그인 후 /community, `//evil.com`·`https://evil.com`·`@evil.com` 은 /search.
  - `git diff src/app/payment src/app/api/toss` 가 className·마크업·인라인 CSS 만.
- 적용 레퍼런스 규칙
  - ux-rules 1장 (사) 로그인: OAuth 구조 유지(QR §1 accessible-authentication), 실패는 화면 안 원인 + 다시 시도(QR §8 error-recovery), 로그인 뒤 하던 일로(QR §9 back-stack-integrity)
  - ux-rules H07·H08·H10·H11 폼, M12 입력 유형·자동완성(ux#57~#63), H16 터치 44px(ux#104), H04 대비(ux#36)
  - 확정 규칙: 색 채움 버튼 금지(앰버·그린 채움 → 글자·테두리), 카카오 #FEE500 은 브랜드 예외
  - Resend 입력: 카드면 + 선, 포커스 때 테두리 밝게(reference-design §2.7)
- 위험
  - 불변 조건 4: OAuth 호출·콜백·결제 SDK·금액 계산 그대로. redirect 전달은 결정 2 승인 후에만, 그때도 `auth/callback/route.ts` 는 수정하지 않는다(이미 next 지원).
  - 콜백이 `${origin}${next}` 로 붙이므로 내부 경로 검증이 없으면 외부로 보내는 통로가 된다(`@evil.com` 은 userinfo 로 해석됨).
  - 미사용 결제 컴포넌트 7개는 변환하지 않는다.
  - 로컬에서 OAuth 를 끝까지 볼 수 없다. 화면은 로컬, 흐름은 운영 사이트에서.
- 소유자 결정: 결정 2(로그인 뒤 원래 화면), 결정 11(로그인 2단계 통합)
- 관련 발견: auth-01, auth-02, auth-07, auth-14, auth-15(로그인), auth-04(실패 화면), auth-08(fail·sso 오류), pricing-06, pricing-07, a11y-13(로그인 제목)

### R11 · 공개 페이지 · 채널 대행 /studio · 공수 L

- 목표: 주력 세일즈 페이지에 전환 경로(챕터 끝 CTA·가격 카드 CTA·모바일 하단 CTA)를 만들고, 모바일 깨짐·첫 화면 지연·금지 패턴을 정리한다. 실적 수치·문장은 그대로 둔다.
- 범위 페이지: /studio
- 범위 파일: `src/app/studio/page.tsx`, `src/app/studio/_components/StatsCounter.tsx`, `src/app/studio/_components/VideoMarquee.tsx`, `src/app/studio/studio-content.json`(em-dash 만), `src/app/globals.css`(/studio 전용 규칙 정리)
- 변경
  1. 레드 #E5484D 10곳(결정 7 기본 A): 헤드라인 색 강조 3곳(`:524, :547, :652`) 제거(두 톤만), 핵심 수치 2~3곳(`:287` 70만+, `:509` 연 매출 7억+, `:876` 가격 부제 중)만 text-accent, 후기 배지(`:741`) 흰 글자 + neutral 테두리, 직함(`:762`) neutral-400, 포트폴리오 70만+(`:441`) 흰색 bold.
  2. CTA: 비교표 아래·가격 카드 안·후기 직후에 primary "채널 대행 문의하기"(기존 문구), 90일 성과 카드 아래 텍스트 링크형 보조 CTA, 모바일 BottomCTABar(hideFrom md), CTA 는 next/link.
  3. 가격 카드: 컨테이너 폭 카드 하나(`md:grid-cols-[1fr_auto]`). 왼쪽 패키지명 + 월 발행량 + 포함 6항목 맨 SVG 체크 + FAQ 의 조건 3줄, 오른쪽 "부가세(VAT) 별도" + ₩3,500,000/월 + primary CTA + "야외·해외 촬영: 가격 협의", 각주 neutral-400. 이미 있는 문장만.
  4. 모바일: 비교표는 md 미만에서 항목별 스택(항목명 캡션 / 일반 대행사 neutral-400 / TMK STUDIO 흰색), 최종 CTA 카드 `p-6 md:p-16`·헤드라인 `text-h3 md:text-h1`, StatsCounter 모바일 `grid-cols-3` + text-h3(min-w 제거), 히어로 버튼 모바일 w-full.
  5. 첫 화면: 히어로 요소의 data-animate·data-delay 제거, 히어로 Image `priority` + `sizes="(min-width: 768px) 50vw, 100vw"` + 내용 alt, StatsCounter 초기 렌더 최종값 + 뷰 진입 시 1초 이하 카운트업 + reduced-motion 생략, data-animate left/right → up, `.highlight-draw` 삭제(현재 동작하지 않음).
  6. 비용: 인터뷰 iframe `loading="lazy"` + title, 차별점 이미지·채널 배너 `unoptimized` 제거 + sizes, 마퀴는 IntersectionObserver 로 보일 때만 rAF·scrollWidth 는 마운트·리사이즈 때만·복제본 2벌 aria-hidden + 링크 tabIndex=-1·포커스·터치 시 정지·"일시정지/재생" 텍스트 버튼·안내 문구 md 이상, 삭제된 썸네일(naturalWidth ≤ 120)은 카드 숨김.
  7. 금지 패턴: `:636` 그라데이션 오버레이 삭제, 마퀴 폴백 teal-900·cyan-900 → neutral-900, 채널 배지 `bg-black/60` + 흰 글자, 빨간 원형 재생 아이콘 → 맨 SVG 삼각형, 화면 문구 `—` → "·"·쉼표, 미사용 상수(`:137-250`) 삭제. "마감임박" 알약은 결정 6(유지 시 모바일 한 줄).
  8. 정렬·대비: INTERVIEW 섹션 라벨 컨테이너 통일, PROCESS·FAQ 데스크톱 2단(왼쪽 헤드라인 `sticky top-[calc(var(--nav-h)+2rem)]`), "문제 01~03" 배지 위치 통일 + DIFFERENCE 는 "01" 텍스트 숫자, 후기 lg 6분할(3+2), 결과 배지를 배너 밖 줄로, 정보 글자 neutral-400, `#process` scroll-mt, SectionLabel → 공용 SectionHeader.
  9. `.channel-card`·`.review-card`·`.feat-img` hover 들림·확대 제거 → CARD_LINK 테두리 변화, globals.css 해당 규칙 삭제.
- 완료 기준
  - /studio 정적(○, force-static) 유지, StudioGuard 렌더 유지(결정 1 전).
  - 결정 7=A 이면 `grep -n "E5484D" src/app/studio/page.tsx` 0건. `grep -E 'bg-gradient|from-|teal|cyan|#134e4a|#164e63'` 범위 0건.
  - `curl /studio`(쿠키 없음)에 히어로 h1 텍스트와 "70만+" 최종값, 첫 화면 요소에 data-animate 없음.
  - 390(쿠키 있음): TMK STUDIO 값 잘림 0, 최종 CTA 헤드라인 어절 단위, 통계 3칸 한 줄, 하단 CTA·카카오 버튼 겹침 0.
  - 1440: 가격 카드 안 CTA, 모든 섹션 라벨 왼쪽 x 동일.
  - 키보드로 마퀴를 지날 때 정지점 24개 이하, 일시정지 버튼 동작, reduced-motion 에서 정지.
  - 모바일 Lighthouse 에서 iframe 이 화면 진입 전 로드되지 않음.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max landing#33·#10: 신뢰 히어로 → 증거 → 과정 → 비교 → 후기 → 투명한 가격 → FAQ, 챕터 끝 미니 CTA + 마지막 CTA(ux-rules 1장 (다))
  - landing#2 증거 뒤 CTA, landing#13 비교표 다음 CTA·사실만, landing#1·#14 모바일 하단 CTA 1개
  - Linear 액센트 규율: 섹션당 핵심어 1곳·수치 강조만(reference-design §2.1)
  - ux-rules H24 자동 움직임 일시정지(ux#108, motion#17), H15 이미지 크기·포맷(next#17·#21), M24 영상 지연
  - reference-design §4.3 hover 들림·확대·그림자 금지
- 위험
  - force-static·JSON-LD·메타데이터 유지, 서버 인증 금지.
  - StudioGuard 는 결정 1 전까지 그대로.
  - unoptimized 제거는 Vercel 이미지 최적화 사용량을 늘린다. 부담이면 로컬 4장을 1200px WebP 로 미리 줄이고 배너 URL 을 w800 으로.
  - 실적 수치·후기·FAQ 문장은 바꾸지 않는다. STRENGTH 헤드라인은 문구가 없어 보류.
- 소유자 결정: 결정 7(레드 강조), 결정 6("마감임박"), 결정 1(공개 여부, 이 항목은 화면만)
- 관련 발견: studio-02, studio-05, studio-06, studio-07, studio-08, studio-09, studio-12, studio-13, studio-14, studio-15, system-06(호버), a11y-06(마퀴·카운트업)

### R12 · 공개 페이지 · 1:1 컨설팅 상세·상담 신청 폼 · 공수 L

- 목표: 컨설팅 상세에서 결정 정보(구성·정원·가격)를 HTML 로 앞에 보여 주고 가격 직후에 신청 버튼을 두며, 상담 폼은 검증·오류 안내·자동완성이 되는 진짜 폼으로 만든다.
- 범위 페이지: /studio/class/consulting, /studio/consulting
- 범위 파일: `src/app/studio/class/consulting/page.tsx`, `src/app/studio/class/consulting/layout.tsx`, `src/app/studio/consulting/page.tsx`, `src/app/studio/consulting/layout.tsx`
- 변경 (상세)
  1. 페이지를 서버 컴포넌트로(`'use client'` 제거, TrackVisit 만 클라이언트). 이미지 7장에 실제 높이(8695/10132/7741/8637/7379/8465/5066) 또는 정적 import + `sizes="(max-width: 1000px) 100vw, 1000px"`.
  2. 상단 CTA 블록 → 요약 카드: SectionHeader(캡션 "비블의 1:1 유튜브 컨설팅" + 영문 라벨) + 두 톤 h1, 이미지 속 기존 문장으로 사실 4~6줄(매주 1회 30분 1:1 / VOD 100강 / 매월 오프라인 커뮤니티 / 20명 소수 정예·평균 3개월 대기 / 부가세 포함 월 49만원·카드결제), primary 신청 버튼 + "신청 페이지로 이동합니다"(neutral-400), "구성 · 후기 · FAQ · 목차" 점프 링크(이미지 4·6·7 경계 앵커).
  3. 이미지마다 figure + 이미지 속 소제목을 쓴 한 줄 alt, 6번과 7번 사이(가격 직후)에 HTML CTA 블록(같은 버튼, 기존 문구 "1:1 팀비블과 시작하세요").
  4. 보조 헤더(xl 이상): 가운데 중복 제목 제거, "신청하기" → primary sm. "← 스튜디오" 는 결정 1 전까지 유지.
  5. gray 11건 → neutral, `shadow-lg shadow-white/10` 삭제, 버튼은 buttonClass lg.
  6. layout.tsx 의 og·twitter image(세로 8,695px 를 1000×1000 으로 선언) 삭제 → 사이트 `/og-image.png`.
- 변경 (폼)
  7. 전체를 `<form onSubmit>`, "다음"·"상담 신청하기"는 submit, label htmlFor + input id·name·autoComplete(name, tel, email, url)·inputMode, RadioCard 그룹 `role="radiogroup"` + `role="radio" aria-checked`, 선택 테두리 흰색.
  8. 버튼은 항상 누를 수 있게, 누르면 비었거나 형식이 틀린 필드 아래 레드 한 줄(aria-describedby, aria-invalid) + 첫 오류로 포커스. 전화번호 숫자 9자리 이상, 이메일은 입력했을 때만 형식 확인.
  9. 서버 제한에 맞춘 maxLength(성함 50, 연락처 30, 텍스트 4항목 합 2,000 안: 현황 300·고민 1,200·지역 50·기간 50) + 고민 칸 글자 수, 응답 status 별 문구(429 "문의가 많아 잠시 뒤에 다시 보내 주세요", 400 입력 확인), 단계 전환·완료 시 맨 위 스크롤 + 제목 포커스, 오류 role=alert.
  10. useSearchParams 부분을 작은 자식 + Suspense 로 분리해 폼 본체를 정적 프리렌더.
  11. 완료 화면 원형 테두리 체크 → 맨 체크 SVG, 카카오 링크 https, 이모지(`:263`)·`—`(`:259`) 제거, 정보 글자 neutral-400, 모바일 하단 여백 `pb-28 md:pb-0`(카카오 버튼이 주 버튼을 덮지 않게).
  12. 결정 16=A 면 단일 선택지 서비스 자동 선택, 유입 경로 질문을 마지막 단계로, 제출 버튼 위 개인정보 수집·이용 고지 + /privacy 링크.
- 완료 기준
  - 두 경로 정적(○). 폼 HTML 에 `BAILOUT_TO_CLIENT_SIDE_RENDERING` 없음, 폼 필드가 초기 HTML 에 있음.
  - 상세 1440·390: 첫 화면에 요약 카드(사실 4~6줄 + 신청 버튼), 가격 이미지 직후 HTML CTA, 이미지 로딩 중 스크롤바 길이 변화 0(CLS < 0.1).
  - 폼: 빈 칸으로 "다음" → 첫 필드 아래 오류 + 포커스, Enter 로 다음 단계, 자동완성 제안, 2,000자 초과 입력 불가.
  - 390 폼: 스크롤 끝에서 카카오 버튼과 "다음" 버튼 겹침 0.
  - `git diff` 에서 상담 API fetch 본문·필드 이름 동일.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max landing#33(신뢰 히어로 + 투명한 가격 + 명확한 CTA), reasoning#79(커리큘럼·결과): ux-rules 1장 (다) 1:1 컨설팅
  - landing#10 챕터 끝 미니 CTA, landing#7 필요한 정보만 요청(결정 16)
  - ux-rules H06 글자가 든 이미지는 대체 텍스트(ux#38), H14 이미지 크기 선언(next#18)
  - ux-rules H07·H08·H09·H10·H11 폼(ux#43·#55·#109·#44·#32), M12 입력 유형·자동완성, R12 onSubmit(rstack#27)
  - ux-rules N04 페이지 전체를 클라이언트로 만들지 않음(next#7)
- 위험
  - 불변 조건 4: `/api/studio/contact` 호출·전송 필드·필수 항목(8/15 결정 34a46b6)은 그대로. 검증은 화면에서만.
  - 요약 카드의 사실은 이미지 속 문장만(새 수치 금지). 이미지 개정·전체 HTML 전환은 범위 밖.
  - "← 스튜디오"(결정 1)와 블랙맵 "← 강의 목록"(결정 13)은 결정 전 유지.
- 소유자 결정: 결정 16(상담 폼 구성), 결정 1·13(돌아가기 링크)
- 관련 발견: class-02(요약·대체 텍스트), class-04(보류), class-05, class-08, class-09, class-10, class-11, studio-10(결정), studio-11, studio-12(폼 정적화), studio-14(폼), studio-15(폼 대비), mobile-07, a11y-05(상세 이미지)

### R13 · 공개 페이지 · 본문 렌더러·브랜드 인큐베이팅 · 공수 M

- 목표: 커뮤니티 글 본문을 읽기 좋게(세로 이미지 높이 상한, 문단 간격) 만들고, 이를 그대로 쓰는 /incubating 에 첫 화면 지원 버튼·모바일 하단 지원 바·올바른 공유 메타를 둔다.
- 범위 페이지: /incubating, /community/[board]/[id](본문 렌더 공통)
- 범위 파일: `src/app/community/_components/PostContent.tsx`, `src/app/community/[board]/[id]/_components/AttachmentList.tsx`, `src/app/incubating/page.tsx`, `src/lib/community.ts`(표시용 함수 추가)
- 변경
  1. PostContent: img `mx-auto block h-auto w-auto max-w-full max-h-[70vh] rounded-panel border border-neutral-800` + 원본 새 탭 링크, video `mx-auto block w-auto max-w-full max-h-[70vh] bg-black`, alt "본문 이미지", `imageClassName` prop.
  2. 텍스트를 빈 줄 기준으로 나눠 문단마다 `<p>` + `space-y-4`(저장 형식 불변), 링크 wrap-anywhere.
  3. AttachmentList 이미지·영상 같은 높이 상한, 다운로드 링크에 `download` 속성.
  4. `community.ts` 에 `toPreviewText(content, n)`: 이미지·영상·유튜브 줄, "## "·"> " 접두어, "---" 줄 제거 후 excerpt(검색·저장 로직 불변).
  5. /incubating: h1 아래 primary "지원하기"(`href="#apply"`), CTA 카드 `id="apply"` scroll-mt, 오픈채팅 primary·메일 secondary(라벨 유지)·"비블 커뮤니티"는 카드 밖 텍스트 링크, 모바일 BottomCTABar(기존 "오픈채팅으로 지원하기" 문구·주소, hideFrom md), 모바일 사진 `imageClassName="aspect-[4/3] w-full object-cover md:aspect-auto"`, 최상위 main.
  6. 메타: description = `toPreviewText(post.content, 160)`, openGraph·twitter(title 글 제목, url /incubating, images 첫 본문 이미지 또는 `/og-image.png`).
- 완료 기준
  - /incubating ISR(●, revalidate 60)·unstable_cache 유지.
  - 글 상세(소유자 크롬)·/incubating 1440: 세로 캡처 이미지 높이 ≤ 화면 높이 70%, 문단 사이 16px.
  - /incubating 390: 첫 화면에 "지원하기", 하단 지원 바 상시, 카카오 버튼 겹침 0, 사진 5장 합계 높이 약 1,000px 감소.
  - `curl /incubating` meta description 이 "/community-images/" 로 시작하지 않음, og:title = 글 제목, og:url = /incubating.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max reasoning#178: 기한·자격·절차·증거·보낼 내용, 첫 화면 지원 CTA, 모바일 하단 CTA(ux-rules 1장 (라)), landing#5 Multiple CTAs
  - ux-rules 1장 (마) 글 상세: 이미지 높이 상한 + 원본 보기, 읽기 폭(QR §6 line-length)
  - reference-design §4.1 reading 폭, §4.2 문단 text-wrap pretty
  - ux-rules H19 사용자 글은 wrap-anywhere(ux#111), N09 페이지별 메타·OG(next#25~#27)
- 위험
  - 불변 조건 2: `revalidate = 60` 과 `unstable_cache` 유지.
  - 불변 조건 3: /incubating 은 인큐베이팅 글 하나만 보여 준다. PostContent 변경은 권한 판정(canReadBoard)에 영향이 없다.
  - 본문은 커뮤니티 글 원문이라 손대지 않는다. 첫 이미지를 둘째 문단 뒤로 옮기는 일은 소유자가 글을 수정해야 한다(안내만).
- 관련 발견: community-01, community-03(렌더), community-07, community-08, community-10(표시 함수), mobile-06, a11y-05(본문 이미지), a11y-08(main)

### R14 · 커뮤니티 · 커뮤니티 틀·탐색·비회원 게이트·랭킹 · 공수 M

- 목표: 지금 어느 게시판인지 어디서나 알 수 있게 하고(데스크톱 사이드바·모바일 칩·피드 머리), 확정 팔레트를 벗어난 강조를 정리하며, 비회원 게이트가 가입 근거를 보여 주게 한다. 회원 전용 구조는 그대로.
- 범위 페이지: /community(피드·게이트), /community/ranking, /community/about, 커뮤니티 하위 전체(틀)
- 범위 파일: `src/app/community/layout.tsx`, `src/app/community/_components/CommunityChrome.tsx`(신규), `src/app/community/_components/CommunitySidebar.tsx`, `src/app/community/_components/SidebarBoardLink.tsx`(신규), `src/app/community/_components/CategoryChips.tsx`, `src/app/community/page.tsx`, `src/app/community/_components/CommunityGate.tsx`, `src/app/community/ranking/page.tsx`, `src/app/community/loading.tsx`(신규)
- 변경
  1. CommunityChrome(usePathname): 레이아웃 제목을 /community 에서만 h1, 하위 화면은 p. 배너는 결정 5(기본: 지금처럼 모든 화면), 배너 alt "Business Black".
  2. 사이드바: SidebarBoardLink(useSearchParams)로 현재 게시판 `bg-white/[0.06] font-semibold text-white` + aria-current, 메뉴 카드 `lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:max-h-[calc(100vh-var(--nav-h)-2rem)] lg:overflow-y-auto`, 그룹 구분선 하나, 노란 강조 메뉴 → `font-bold text-accent`, 빨간 원형 "N" → `text-accent` 12px "N" + sr-only "새 글".
  3. 피드 머리 툴바: 현재 게시판 이름(h2, 없으면 "전체글") + 글 수 + 설명 한 줄, 오른쪽 검색창(INPUT)과 최신·인기(aria-current="true", px-2 py-2).
  4. 모바일 칩: 그룹 순서 유지, 활성 칩 `scrollIntoView({ inline: "center" })`, 칩 레시피 + aria-current, 오픈채팅 버튼(참여코드 표기)을 모바일 헤더 보조 버튼으로.
  5. 게이트: 칩 22개 → 그룹 4줄 텍스트 목록(그룹명 bold + 대표 게시판 2~3개 neutral-400), CTA 위 "멤버 N명 · 글 N개"(레이아웃이 이미 조회한 stats 를 props 로), 오픈채팅 문장 끝 "(참여코드 230000)".
  6. 랭킹: "+23" → "좋아요 23"(neutral-200, 상위 3위 에메랄드), 기준 설명을 표 바로 위로, 내 줄 `bg-white/[0.03]`. 운영자 표시는 결정 17.
  7. loading.tsx: neutral-900 카드 3~4개 스켈레톤(내용 크기 일치).
- 완료 기준
  - 커뮤니티 경로 dynamic 유지. 비로그인으로 /community, /community/about, /community/<board>/<id> → 게이트만(글 제목·내용 0), robots noindex 유지, `page.tsx:50` canReadBoard diff 0.
  - 1440(소유자 크롬): `?cat=column` 에서 사이드바 해당 항목 aria-current, 피드 머리 "비블 bibl 칼럼", 스크롤해도 사이드바 메뉴가 보임.
  - 390: 뒤쪽 게시판 칩을 누른 뒤 활성 칩이 화면 안.
  - 게이트 1440·390: 칩 없음, 멤버·글 수 한 줄, 참여코드가 화면 글자로.
  - 범위 파일 `grep -E 'yellow-|E5484D'` 0건, 글 상세·글쓰기에서 h1 1개.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max reasoning#164(훑기 쉬운 목록·운영 표시), reasoning#184 tag-filter(ux-rules 1장 (마))
  - reasoning#71 "Hidden benefits·No community proof" 방지, landing#20 회원 수는 현재값으로
  - ux-rules M01 aria-current(ux#3), M04 페이지당 h1 하나(ux#39), H20 칩 묶음(ux#115), H26 로딩 스켈레톤(ux#10), shadcn#27 이동 탭은 링크 + aria-current
  - Linear 액센트 규율: 반복 표식은 에메랄드 글자만, 원형 배지 금지(reference-design §2.1)
- 위험
  - 불변 조건 3: `layout.tsx:44-53` 게이트, `page.tsx:50` canReadBoard, `layout.tsx:28` noindex 불변. 게이트에는 숫자만 넘긴다.
  - 배너·사이드바 정보 카드는 소유자가 만든 것이라 결정 5 전에는 크기·위치를 바꾸지 않는다.
  - 레이아웃은 서버 컴포넌트라 경로 판정은 클라이언트 잎에서만.
  - 커뮤니티 안 /studio 링크(`community.ts:165-168`, `about/page.tsx:96-101`)는 결정 1 전 유지.
- 소유자 결정: 결정 5(배너·글쓰기 집중 모드), 결정 17(랭킹 운영자), 결정 1(대행 문의 링크)
- 관련 발견: community-02(h1), community-05, community-06, community-09(보류), community-13, community-14, community-15, a11y-05(배너), a11y-12(커뮤니티), a11y-13(커뮤니티 h1), system-02(커뮤니티 색)

### R15 · 커뮤니티 · 글 상세·피드 카드·댓글·글쓰기 · 공수 L

- 목표: 글을 읽고 쓰는 화면의 기본기를 다듬는다. 720px 읽기 폭, 훑기 쉬운 피드 카드, 눈에 띄는 오류와 답글 입력, 터치 기기에서도 보이는 사진·영상 넣기.
- 범위 페이지: /community(피드 카드), /community/[board]/[id], /community/write
- 범위 파일: `src/app/community/[board]/[id]/page.tsx`, `src/app/community/_components/FeedCard.tsx`, `src/app/community/[board]/[id]/_components/CommentSection.tsx`, `src/app/community/[board]/[id]/_components/PostActions.tsx`, `src/app/community/write/page.tsx`, `src/app/community/write/_components/PostForm.tsx`, `src/app/community/write/_components/BlockEditor.tsx`
- 변경
  1. 글 상세 전체(헤더·본문·첨부·좋아요·댓글)를 `mx-auto max-w-[720px]`, 댓글 아래 "목록으로" 텍스트 링크(상단 뒤로가기와 같은 주소).
  2. FeedCard: 미리보기 toPreviewText, 본문 첫 이미지가 있으면 오른쪽 72px 정사각 썸네일(`object-cover rounded-lg border border-neutral-800`), 메타 줄 "작성자 · 시간"과 게시판 이름(neutral-400) 분리, 반응 수를 메타 줄 오른쪽 끝으로.
  3. 댓글: 오류 `text-red-400` + role="alert"(PostActions 도), 답글 입력을 대댓글 목록 아래 + autoFocus, 답글·삭제 버튼 `rounded-lg px-2 py-1.5` 터치 영역·간격, 글 작성자 댓글에 "작성자" 라벨(12px), 댓글 본문 linkify 재사용, textarea aria-label("댓글 내용"·"답글 내용"), 삭제 확인 `destructive: true`.
  4. 글쓰기 툴바: 에디터 위 항상 보이는 한 줄(사진·동영상 / 유튜브 / 링크 / 소제목 / 인용구 / 구분선, 기존 핸들러, 마지막 포커스 블록 뒤 삽입), 유튜브·링크 `prompt()` → 인라인 입력 줄 + 추가 버튼, 블록 옆 "+" 는 `opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100` + 터치 기기 36px, 본문 상자 `min-h-[240px]`, placeholder 를 실제 동작대로("Enter 는 문단 나누기, Shift+Enter 는 줄바꿈"), 에디터 미리보기 이미지 `max-h-80 w-auto`.
  5. 글쓰기 폼: `?board=` 없으면 빈 값 + "게시판을 선택하세요"(disabled) 첫 옵션, 등록·취소 줄 `sticky bottom-0 border-t border-neutral-800 bg-black/95 py-3`, 확장자 28개는 "문서·이미지·영상·압축 파일, 파일당 최대 50MB" + `<details>`, 상단 "커뮤니티" 링크에 왼쪽 화살표, 첨부 상자 아래 "글 중간에 사진을 넣으려면 위 툴바의 사진·동영상을 쓰세요", 오류 role=alert. 집중 모드(배너·사이드바 숨김)는 결정 5.
- 완료 기준
  - 글 상세·글쓰기 noindex 유지, canReadBoard 판정 diff 0.
  - 글 상세 1440(소유자 크롬): 본문 폭 720px 이하, 댓글 아래 "목록으로".
  - 피드 1440: 이미지가 든 글 카드에 썸네일, 미리보기에 "/api/community/image" 문자열 0.
  - 390 글쓰기(터치 에뮬레이션): 툴바·"+" 가 보이고 사진 넣기 동작, 등록 버튼 하단 고정.
  - 댓글 등록 실패(네트워크 차단) 시 레드 안내 + 알림, 답글 클릭 시 입력창 커서.
  - BlockEditor `prompt(` 0건.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max reasoning#164(reply-composer·vote-signals·scan-friendly), products#164 리치 에디터(ux-rules 1장 (마))
  - ux-rules 1장 (마) 글쓰기 순서, 등록 중 잠금·완료/실패 피드백(QR §2 loading-buttons)
  - ux-rules H27 hover 에만 기대지 않기(ux#11), H16 터치 타깃(ux#104), H10 오류 알림(ux#44), M19 읽기 폭
  - reference-design §4.1 reading 폭
- 위험
  - 불변 조건 3: canReadBoard·notFound·noindex 그대로. 썸네일은 권한 검사를 통과한 글 본문에서만.
  - 저장 형식(블록 → "\n\n")과 업로드·재시도 로직(`PostForm.tsx:143-210`) 불변. 렌더만.
  - Tailwind 4.1 의 hover 변형은 `(hover: hover)` 안에서만 생성되므로 pointer-fine 으로 갈라야 터치 기기에서 보인다.
- 소유자 결정: 결정 5(글쓰기 집중 모드)
- 관련 발견: community-03(상세 폭), community-04, community-10, community-11, community-12, mobile-09, mobile-12(댓글), a11y-09(커뮤니티), auth-10(삭제 확인)

### R16 · 앱 내부 · 검색 화면 틀·검색창·한도 모달·도구 탭 · 공수 M

- 목표: 영상 찾기 화면의 틀을 확정 테마로 바꾸고, 결과 앞에 쌓인 홍보·중복 표시를 줄이며, 도구 사이를 오가는 탭을 만든다. 검색 누적 로직은 마크업·클래스만.
- 범위 페이지: /search(틀·검색창·상태 배너·한도 모달)
- 범위 파일: `src/app/search/page.tsx`, `src/app/_components/SearchBar.tsx`, `src/app/search/_components/LimitModal.tsx`, `src/app/search/_components/FilterTab.tsx`, `src/app/_components/ToolTabs.tsx`(신규), `src/app/search/loading.tsx`(신규), `src/app/search/_components/SearchSkeleton.tsx`, `src/app/search/_components/TodaySearchCount.tsx`, `src/app/search/error.tsx`
- 변경
  1. bg-black, 남색 검색 띠(`:200`) → 배경 없이 `border-b border-neutral-800`, sr-only h1 "유튜브 영상 찾기", 상단 ToolTabs(영상 찾기·채널 찾기·채널 분석·수집한 영상, 허브 TOOLS 와 같은 목록, 잠금은 배지 + 글자, tabs 레시피, aria-current).
  2. 상태 배너: 펄스 점 삭제(색 유지), 쿼터 소진 주황 + ⚠️ → 앰버 + 맨 SVG, API 오류 레드 유지, 업그레이드 완료 틸 + 🎉 → 그린 테두리 + "플랜이 적용되었습니다. 결제 내역은 마이페이지에서 확인할 수 있습니다." + 마이페이지 링크.
  3. 무료 배너(`:377-394`) 한 줄 문장 + 텍스트 링크, 그라데이션·아이콘 박스 제거, 가격 "월 ₩19,000 (연간 결제 시 월 ₩15,000)". 검색어 칩(`:205-211`)·VideoCountBadge(`:369`) 제거.
  4. 액션 줄(`:338`) flex-wrap + 모바일 짧은 라벨, 잠금 버튼 자물쇠 SVG + "Pro" neutral-400.
  5. SearchBar(마크업만): 입력 aria-label "검색할 키워드", 제출 버튼 44px + aria-label "검색", 국가 버튼 aria-label "검색 국가: {label}" + aria-expanded + aria-haspopup, 국가 항목 `role="menuitemradio" aria-checked`, 기록 펼치기·항목 div → button(펼치기 aria-expanded), 삭제 버튼 aria-label "{term} 기록 삭제", ▼ → SVG, 기록 삭제 확인 `destructive: true`.
  6. LimitModal → Dialog 셸(결정 11 이 C 면 `dismissible={false}`), 패널 neutral-900 + primary, 그라데이션 띠·아이콘 박스 삭제, `—` → "·".
  7. FilterTab 활성 흰 필(`bg-white text-black`), 비활성 neutral-800, aria-current.
  8. TodaySearchCount "전체 이용자 오늘 N건"(주어 명시), 숫자 흰색.
  9. loading.tsx + SearchSkeleton 을 실제 8열 표·카드 크기와 같은 neutral 스켈레톤, search/error.tsx 를 R04 상태 화면 틀로.
- 완료 기준
  - `git diff src/app/_components/SearchBar.tsx` 에서 10-60·166-195·219-249 행 로직 변경 0(className·aria·태그만), `git diff src/app/search/page.tsx` 에서 43·48-50·55-58·86-92·94-184·186-188·196·330-332·397 행 변경 0. 같은 키워드 두 번 검색 시 기록 count·v 증가가 변경 전과 같다.
  - /search?q=캠핑 1440: 남색 픽셀 0, 검색어 칩·VideoCountBadge 없음.
  - 범위 파일 `grep -E '(gray|slate|teal|purple)-[0-9]|bg-gradient|animate-ping'` 0건, 펄스 점 0(스켈레톤 animate-pulse 는 허용).
  - 키보드만으로 국가 선택·기록 펼치기·기록 검색·기록 삭제 가능.
  - 한도 초과 상태: 모달 패널 neutral, 결정 11=C 면 Esc 로 닫히지 않음.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max reasoning#7(Data-Dense, "Ornate design" 안티패턴), ux-rules 1장 (바) 검색 결과 배치
  - ux-rules H22 사용량 문장 알림, M27 무한 반복은 로딩에만(ux#12), C06 아이콘 버튼 이름(app#1), C03 칩·토글 의미(ux#117)
  - shadcn#27 이동 탭은 링크 + aria-current, CommunityTabs 밑줄 패턴(reference-design §4.4)
  - 확정 규칙: 펄스 도트·그라데이션·아이콘 박스 금지, 앰버·레드·그린 시맨틱 보존
  - ux-rules N02 loading.tsx 스켈레톤은 내용 크기(next#5, shadcn#41)
- 위험
  - 불변 조건 1: 2.2 표의 SearchBar·search/page 행. 이벤트 핸들러·제출 흐름(saveToHistory → router.push)·확인창 호출 순서 그대로.
  - 결제 성공 배너는 표시용(`upgraded=1`). 결제 API 불변.
- 소유자 결정: 결정 11(한도 초과 모달)
- 관련 발견: search-02(시각), search-03(배너), search-05(틀), search-11(가격), search-15(중복 표시), home-13, home-14(도구 탭), channels-09(도구 탭), auth-04(성공 배너), auth-05·auth-06(결정 11), a11y-03(검색 기록), a11y-10(검색창), a11y-12(국가), a11y-13(/search h1)

### R17 · 앱 내부 · 검색 분석 패널 · 공수 M

- 목표: 결과 위에 쌓인 인사이트·경쟁도·제목 패턴 패널을 "분석 도구" 한 줄로 접고, 기능적 색만 남겨 확정 테마로 바꾼다.
- 범위 페이지: /search(분석 패널·공유·카카오 채널 배너)
- 범위 파일: `src/app/search/_components/KeywordInsights.tsx`, `src/app/search/_components/KeywordCompetition.tsx`, `src/app/search/_components/TitlePatternAnalysis.tsx`, `src/app/search/_components/ShareButton.tsx`, `src/app/search/_components/KakaoChannelBanner.tsx`
- 변경
  1. 분석 도구 줄: 세 패널을 표 위 secondary 버튼 한 줄로 접고 누른 뒤 펼침(옵트인 상태 로직·디스클레이머 문구 그대로), "유튜브 채널 대행 문의"는 같은 줄 오른쪽 text-accent 텍스트 링크(그라데이션 CTA 삭제), 잠금 카드 → 자물쇠 SVG + "Starter".
  2. KeywordInsights: 글로우 블롭·그라데이션 글자·아이콘 박스 삭제, 연관 키워드 앰버 칩 → neutral 칩, 패턴 스카이 칩·버튼 → neutral 칩·secondary, 닫기 aria-label + p-2, 연관 키워드 옆 "누르면 검색 1회가 차감됩니다"(결정 10=A 면 확인창 경로).
  3. KeywordCompetition: 원형 게이지 → 가로 막대 + "72 / 100", 낮음 #00E5A0·보통 amber-400·높음 red-400 + 단계 글자, 흰 옵트인 모달 → useConfirm(문구 그대로), 추천 문장 모바일 아래 줄, 10px → 12px.
  4. TitlePatternAnalysis: 6색 라벨 → neutral 테두리 필, 반응 등급 막대 단색 #00E5A0 + 등급 글자 neutral, "최근 30일 업로드 기준" → "검색 결과 기준"(결정 8 기본 범위), 데이터 부족 앰버 유지.
  5. ShareButton: aria-label("카카오톡으로 공유"·"링크 공유"), "복사됨" 틸 → 그린, 카카오 #FEE500 유지, 버튼 36px 이상.
  6. KakaoChannelBanner: 닫기 aria-label + p-2, 브랜드색 유지, 토스트가 있을 때는 띄우지 않음.
- 완료 기준
  - 범위 파일 `grep -E '(gray|slate|teal|sky|purple|cyan|blue)-[0-9]|bg-gradient|blur-|shadow-\[0_0'` 0건(시맨틱 제외), 이모지 0.
  - /search?q=캠핑(무료 계정) 1440: 분석 도구 줄 높이 64px 이하, 첫 결과 행 y ≤ 450px. 390: 첫 결과 y ≤ 700px.
  - 경쟁도: 막대 + 숫자 + 단계 글자, 흑백 에뮬레이션에서도 단계 구분.
  - 옵트인 확인창이 공용 확인창 모양(흰 모달 0). 옵트인 상태·디스클레이머 로직 diff 0.
- 적용 레퍼런스 규칙
  - ux-rules 7.3 기능색 유지 조건, 7.2 경쟁도 3단계 색(charts#8·#18)
  - QR §10 color-not-only, ux#37(ux-rules H05)
  - ux-rules 9.1 #2 그라데이션·#3 글로우·#11 아이콘 박스 불채택
  - Raycast 칩: 기본 투명·선택 시 면 한 단(reference-design §2.7)
  - ux-rules C06 아이콘 버튼 이름(app#1)
- 위험
  - 불변 조건 1: 연관 키워드 칩은 `/search?q=` 로 바로 이동해 서버에서 차감된다. 확인창 경로는 결정 10 승인 후에만, 그때도 SearchBar 의 executeSearch 를 그대로 호출. 링크 형식(region 누락 포함)은 바꾸지 않는다.
  - 파생 지표의 옵트인 단계와 디스클레이머는 YouTube API 정책 대응이라 유지.
- 소유자 결정: 결정 10(연관 키워드 확인창)
- 관련 발견: search-03(패널 접기), search-05(패널), search-06(경쟁도 옵트인), search-11(배지·차감 안내), a11y-10(공유·배너 닫기), a11y-11(패널 작은 글자)

### R18 · 앱 내부 · 검색 결과 표·영상 모달·수집한 영상 · 공수 L

- 목표: 결과 표를 데이터 도구답게 촘촘하고 키보드로 쓸 수 있게 만들고, 모바일에서도 정렬·전체 선택을 제공하며, 수집·삭제·모달의 실패를 사실대로 보여 준다.
- 범위 페이지: /search(결과 표·카드·영상 모달·채널 리포트), /saved
- 범위 파일: `src/app/search/_components/SearchResultList.tsx`, `src/app/search/_components/VideoCard.tsx`, `src/app/search/_components/VideoModal.tsx`, `src/app/search/_components/ChannelReport.tsx`, `src/app/search/_components/ViewStatsInline.tsx`, `src/app/saved/page.tsx`, `src/app/saved/_components/SavedVideoList.tsx`
- 변경
  1. 표: lg(1024) 이상에서만, 그 아래 카드. 행 py-3·썸네일 128px·채널 한 줄(아바타 20px + 이름)·구독자 별도 숫자 열, 숫자 열 오른쪽 정렬 + tabular-nums, 게시일 칩 제거, 헤더 sticky, 결과 수는 표 위 캡션 "검색 결과 N건"(SectionHeader "RESULTS").
  2. 키보드·스크린리더: 제목 `<h3><button type="button">`, 썸네일은 마우스 전용 + `alt=""`, 정렬 머리글 button + aria-sort + SVG 화살표, 체크박스 aria-label("{제목} 선택"·"전체 선택") + label p-3(히트 40px 이상)·시각 16~18px, 그리드 role=table/row/columnheader/cell.
  3. 모바일: md 미만 정렬 줄(조회수·구독자·게시일 칩, 기존 handleSort, 다시 누르면 방향 전환)과 "전체 선택"(toggleAll, 선택 수), 알고리즘 확률은 같은 옵트인 뒤 카드 지표 줄 라벨, S/L 8px 배지 → "쇼츠"/"롱폼" 12px neutral 글자 배지, 메타 12px·조회수 14px 굵게.
  4. 상태: 수집은 res.ok 와 응답 본문 확인 후 "N개 수집, M개 실패"(실패면 레드 + 다시 시도), 더보기 실패 시 "불러오지 못했습니다 · 다시 시도" + 라벨 "더보기 (50/100)", 채널 제거 뒤 "N개 채널을 숨겼습니다 · 되돌리기"(목록 상태만), 오타 "알고리즘 확률은", 흰 옵트인 모달 → useConfirm, `alert` → 화면 안 문구, 토스트 role=status.
  5. 영상 모달: Dialog 셸(모바일 전체 화면 시트 `h-dvh md:h-auto`, `max-h-[calc(100dvh-2rem)]`), 로딩 후 detail·channelInfo 가 없으면 "불러오지 못했습니다 · 다시 시도"(fetchData 재사용), 채널 링크 `video.channelId`, 누적 조회수 만/억 공용 포맷(`lib/format.ts`), 고정 높이 중첩 스크롤은 md 이상에서만, 닫기 44px + aria-label "닫기", 유튜브 버튼 #FF0000(또는 흰 버튼)·나머지 secondary·수치 흰색, 사용자 도구 그라데이션 상자 → neutral-900, 하락 파랑 → neutral-400.
  6. ChannelReport: 같은 Dialog 셸, 닫기 이름, 85vh → dvh.
  7. 테마: 알고리즘 확률 Great #00E5A0·Good 흰색·Normal neutral-500·Bad amber-400·Worst red-400(글자 병기), 체크박스 accent-white, 선택 행 `bg-neutral-800/60`, 제목 hover 흰색 + 밑줄, "시장성 좋음" 배지 `border-neutral-700 text-accent`, 이모지 → 맨 SVG, 이미지 `loading="lazy" decoding="async"` + width/height.
  8. /saved: bg-black, 통계 만/억 포맷 + 흰 font-black + "전체 기준" 캡션, 200개 이상이면 "최근 200개 표시 중", 전체 삭제 확인창에 실제 삭제 범위, 삭제는 성공 응답 뒤 행 제거(실패 시 되돌림 + 오류), `confirm()` → useConfirm(destructive), 빈 상태 "영상 찾기에서 영상을 선택하고 영상 수집을 누르면 여기에 모입니다" + secondary "영상 찾기", 50개씩 + "더보기"(클라이언트 slice), 입력 숨김 label, metadata title "수집한 영상", ToolTabs.
- 완료 기준
  - `SearchResultList.tsx` 64-73·116-195 로직 diff 0, 더보기 결과 수 규칙 동일.
  - 1440 /search?q=캠핑: 한 화면 영상 행 8개 이상. 768·820px: 카드형(제목 열이 사라지지 않음).
  - 키보드만으로 영상 상세 열기(Enter)·정렬(aria-sort 갱신)·전체 선택.
  - 390: 정렬 칩·전체 선택 보임, 체크박스 히트 40px 이상, 메타 12px 이상.
  - 수집 API 를 401 로 막고 수집 → 레드 실패 토스트(성공 문구 없음).
  - VideoModal 네트워크 차단 시 "불러오지 못했습니다"·다시 시도, 300만 회 채널 누적 조회수 "300만".
  - 범위 파일 `grep -E '(gray|slate|teal|blue|purple)-[0-9]|bg-gradient|confirm\(|alert\('` 0건, `text-\[(8|9|10|11)px\]` 0건.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max reasoning#7·styles#28(행 약 36px·정렬 표·고정 머리줄), QR §10 sortable-table aria-sort(ux-rules 1장 (바), 7.4)
  - ux-rules C03·R08 클릭 동작은 button(rstack#43), H16 터치, H17 12px 하한
  - ux-rules H12·M10 조용한 실패 금지·복구 경로(ux#61·#80), M08 토스트 aria-live
  - ux-rules H15·H32 이미지 지연 로드·긴 목록(next#21, react#26), L03 만·억(ux#86)
  - Raycast 데이터 화면: 선택은 면 한 단(reference-design §2.7)
- 위험
  - 불변 조건 1: 더보기 누적(116-195)·`page.tsx:397` key 의 searchVersion·정렬 함수 그대로. 정렬 UI 는 기존 handleSort·toggleAll 호출만.
  - 불변 조건 4: 수집·삭제 API 호출부 그대로, 응답 확인과 표시만 추가.
  - 확률·경쟁도 옵트인과 디스클레이머 유지. 🔥 표시(`VideoCard.tsx:23` 주석상 의도)는 맨 SVG 로 바꾸되 위치·조건 유지.
  - 썸네일 next/image 전환은 비용 때문에 하지 않는다.
- 관련 발견: search-04, search-05(결과), search-06(옵트인), search-07, search-08, search-09, search-10, search-11(오타), search-12, search-13, search-15(더보기·되돌리기), a11y-03, a11y-04(영상 모달), a11y-05(썸네일 alt), a11y-11, a11y-12(S/L), mobile-04, mobile-11, mobile-12(체크박스)

### R19 · 앱 내부 · 채널 찾기·채널 상세·내 채널 분석 · 공수 L

- 목표: 채널 도구 세 화면을 확정 테마로 바꾸고, 기능색(등급·성장)은 범례와 함께 유지하며, 모바일 넘침과 원문 오류를 없앤다.
- 범위 페이지: /channels, /channels/[channelId], /my-channel
- 범위 파일: `src/app/channels/page.tsx`, `src/app/channels/_components/ChannelResults.tsx`, `src/app/channels/_components/FilterTabs.tsx`, `src/app/channels/_components/DateSortToggle.tsx`, `src/app/channels/_components/ChannelSearchBar.tsx`, `src/app/channels/[channelId]/page.tsx`, `src/app/my-channel/page.tsx`, `src/app/my-channel/_components/ChannelSearchForm.tsx`, `src/app/my-channel/_components/ChannelDashboard.tsx`, `src/lib/chartTheme.ts`(신규)
- 변경
  1. 공통: bg-black, channels 부록 A 매핑(gray→neutral, 틸 버튼 → primary/secondary, 틸 활성 → 흰 필), 정보 글자 neutral-400 이상, 이모지 24곳 → 글자·맨 SVG, 아이콘 박스 제거, 장식 아이콘 neutral-400 한 색, 노랑 응원·"60점 이상" → 중립, 상단 ToolTabs.
  2. /channels 첫 화면: SectionHeader(캡션 "유튜브 트렌드 서치" + CHANNELS) + h1 "채널 찾기" + 기존 안내 문장, 검색창 본문 폭 + primary + 제출 중 `showLoading("채널 검색 중...")`·버튼 비활성, 예시는 입력창에 채우는 칩(자동 검색 없음), 정렬 설명 카드 1벌, 배지 "채널 검색 N회 남음"(무제한이면 생략), 모바일에도 남은 횟수·정렬 설명.
  3. 모바일: 정렬 탭 자체 가로 스크롤(`overflow-x-auto scrollbar-hide -mx-4 px-4`), md 미만 결과는 행 카드(1행 썸네일·이름·핸들, 2행 구독자 · 핵심 지표).
  4. 등급 색(보라·빨강·주황·회색)·신생 그린 유지 + 표 아래 범례 한 줄, "최고 조회수" 흰색, 업로드 빈도 틸 → 에메랄드, 숫자 포맷 `lib/format.ts` 하나, 정렬 머리글 button + aria-sort + SVG 화살표.
  5. 채널 상세: 헤더 → 핵심 수치 4개 → 최근 영상 요약(전체 평균 vs 최근 12개 평균, 최고 영상) → 그리드 → 소개, 개설일 중복 제거, "성장 등급" 칩 → 값 옆 등급 글자 + 계산 근거 캡션(기존 문장), 섹션 제목 한 스타일, 유튜브 버튼 #FF0000, 자체 canonical, title 의 "| 비블랩" 중복 제거, "업로드 패턴 분석 보기"(/my-channel?channel=).
  6. /my-channel: 안내는 h1 아래 한 번, 폼 왼쪽 정렬·입력값 유지·입력 min-w-0, 빈 상태에 지표 4개 이름 윤곽, 원문 오류 → 준비된 한국어 문구 + 기본 문구, 히트맵 `rgba(0,229,160,α)` + α≥0.55 칸 검정 글자, title 중복 제거.
  7. chartTheme.ts: 주 #00E5A0, 비교 neutral-400 파선·neutral-500 점선, 격자 #262626, 축 #404040, 눈금 #a1a1a1, 툴팁 #171717/#404040, 상승·하락·경고 의미색(ux-rules 7.5).
  8. R02 의 클라이언트 정렬 유지(서버 재요청 없음).
- 완료 기준
  - 범위 파일 `grep -E '(gray|slate|teal)-[0-9]'` 0건, 이모지 0, `text-\[(9|10|11)px\]` 0건.
  - /channels 390: `document.scrollingElement.scrollWidth === 390`, 세 번째 탭을 탭 영역 스크롤로 누를 수 있음, 카카오 버튼 화면 안.
  - 1440(소유자 크롬): 등급 범례, 열 제목과 값 단위 일치(결정 12 에 따름).
  - R02 기준(탭 3개·상세 왕복 후 사용량 +1) 재확인.
  - /my-channel: 영어 원문 오류 0, 히트맵 칸 글자 대비 4.5:1 이상.
  - /channels/<id> HTML 에 자체 canonical.
- 적용 레퍼런스 규칙
  - ux-rules 7.2·7.3 차트 색·기능색 유지 조건, channels 부록 A
  - ui-ux-pro-max styles#32 Drill-Down(쉬운 뒤로가기·맥락 유지), styles#33 비교(부호·화살표)
  - ux-rules H18 가로 스크롤 금지(ux#69), H05 색만으로 전달 금지(ux#37), L03 만·억, shadcn#48 차트 색은 한 파일
  - ux-rules M10 오류 복구 경로, H26 대기 표시(QR §2 loading-buttons)
- 위험
  - 불변 조건 4: incrementChannelCount·searchChannels·한도 정책·my-channel actions 의 API 호출 그대로. 오류 문구는 표시 계층에서만.
  - 결정 12 전에는 기본 탭의 정렬·값을 바꾸지 않는다.
  - /my-channel 무제한 실행(쿼터 위험)은 서버 로직이라 범위 밖.
- 소유자 결정: 결정 12(기본 탭), 결정 9(무료 표기)
- 관련 발견: channels-03(내 채널), channels-04, channels-06, channels-07, channels-08, channels-10, channels-13, channels-14, mobile-13, a11y-13(/channels h1), shell-12(상세 canonical)

### R20 · 앱 내부 · 스레드 · 공수 M

- 목표: 스레드 화면을 확정 테마로 바꾸고, 영어 원문 오류 대신 한국어 안내와 "다시 시도·다시 연결"을 둔다.
- 범위 페이지: /threads, /threads?tab=saved, /threads/saved
- 범위 파일: `src/app/threads/page.tsx`, `src/app/threads/saved/page.tsx`, `src/app/threads/_components/{ConnectMetaButton, MyAccountDashboard, PostPerformanceTable, ProfileMetricCard, ProfileViewsChart, ThreadsTabNav}.tsx`, `src/app/threads/saved/_components/SavedThreadsList.tsx`
- 변경
  1. 오류: 서버의 임의 문자열을 그리지 않고 알려진 코드(META_NOT_CONNECTED, TOKEN_EXPIRED)만 한국어, 그 외 "Threads 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", role=alert + primary "다시 시도"(같은 기간) + secondary "다시 연결하기"(/api/threads/auth), OAuth detail 원문 화면 표시 삭제.
  2. 테마: 부록 A(틸 버튼 → primary, 틸 활성 → 흰 필, 연속 기록 칸 에메랄드 불투명도 3단계, "연결 완료" 틸 → 그린), ProfileViewsChart 는 chartTheme, 이모지·아이콘 박스·색 장식 아이콘 정리.
  3. 기간 버튼은 항상 남기고 이전 데이터를 흐리게 둔 채 갱신(aria-busy).
  4. 프로필 개요 카드와 6개 지표 카드의 숫자 중복 정리(상단 3카드), 용어 "스레드"·"Threads 계정".
  5. 무료 사용자에게 플랜 안내를 먼저, 연결 카드는 그 아래.
  6. 수집함: useMemo 의존성에 favOnly, 모바일 즐겨찾기 버튼(44px), 개별 삭제·연결 해제 `confirm()` → useConfirm(destructive), 10px → 12px, "+ 메모" neutral-400, 정렬 button + aria-sort + SVG, 숫자 `lib/format.ts`, 입력 label, outline-none → outline-hidden + 테두리 포커스.
- 완료 기준
  - 범위 파일 `grep -E '(gray|slate|teal|yellow)-[0-9]|confirm\('` 0건(즐겨찾기 별 amber 허용), 이모지 0, `text-\[10px\]` 0건.
  - 오류 재현(만료 토큰 또는 API 차단): 영어 원문 0, "다시 시도"·"다시 연결하기".
  - 수집함 즐겨찾기 토글 즉시 필터링, 390 에서 즐겨찾기 가능, 기간 버튼 클릭 시 버튼 줄 유지.
- 적용 레퍼런스 규칙
  - ux-rules H12·M10 조용한 실패 금지·복구 경로(ux#61·#80), N03 한국어 오류 + 다시 시도
  - ux-rules 7.2 차트 색, 7.4 빈 데이터·로딩·오류 상태
  - ux-rules H13 되돌릴 수 없는 동작 확인(ux#35), H16 터치, H26 레이아웃 유지 로딩(ux#10)
- 위험
  - 불변 조건 4: Threads API·토큰 처리(`lib/threads.ts`) 그대로. 토큰 갱신 미호출(60일 만료)은 서버 로직이라 별도 보고.
  - 진입 경로 추가·수집함 정리는 결정 14 전에는 하지 않는다.
- 소유자 결정: 결정 14(/threads 진입 경로·수집함)
- 관련 발견: channels-03(스레드), channels-06(스레드), channels-07(스레드), channels-11(일부), channels-12, channels-13(스레드), channels-14(스레드), a11y-01(SavedThreadsList)

### R21 · 앱 내부 · 마이페이지 · 공수 M

- 목표: 마이페이지를 확정 테마와 섹션 헤더 구조로 바꾸고, 계정 관리(로그아웃·해지·삭제)를 분리해 결과를 분명히 알린다.
- 범위 페이지: /mypage, 초대 링크 첫 방문
- 범위 파일: `src/app/mypage/page.tsx`, `src/app/mypage/_components/{ReferralSection, RecentSearches, CancelSubscriptionButton, DeleteAccountButton, LogoutButton}.tsx`, `src/app/_components/ReferralApply.tsx`
- 변경
  1. 페이지 안 구 로고(재생 아이콘 + 틸 lab) 삭제, `max-w-3xl` 컨테이너에 섹션 PLAN·USAGE·INVITE·ACCOUNT(SectionHeader), 카드 속 카드 제거, md 이상 사용량·초대 2열.
  2. 테마: gray→neutral, 틸·퍼플·블루 플랜 글자 → 흰색, 틸 버튼 → primary, 사용량 막대 neutral-800 트랙 + 흰 채움(소진 시 레드), 결제 상태 배지 그린/neutral/레드 글자, 그라데이션·아이콘 박스·이모지 제거, "매일 자정 리셋" → "매일 오전 9시(한국 시간) 리셋".
  3. 초대·최근 검색 카드: 같은 높이 자리 표시 먼저(밀림 0), 초대 코드가 비면 "초대 코드를 불러오지 못했습니다" + 다시 시도.
  4. 계정 관리 행: 로그아웃(secondary, 처리 중 표시), 구독 취소(secondary, 활성 구독일 때만: R01), 계정 삭제(danger, 14px). 두 모달 → Dialog 셸 destructive(처음 포커스 "돌아가기"), 삭제 대상 목록(검색 기록·수집한 영상·유료면 구독 종료), 실패 시 모달 안 role=alert(모달 유지), `w-80` → `w-full max-w-sm`.
  5. ReferralApply: 응답 성공 시에만 쿠키 삭제·"초대 보너스 무료 검색 3회가 추가되었습니다" 한 번(role=status).
  6. 보조 글자 neutral-400 이상.
- 완료 기준
  - 범위 파일 `grep -E '(gray|slate|teal|purple|blue)-[0-9]|bg-\[#161b27\]|bg-red-700|alert\('` 0건, 이모지 0.
  - 소유자 크롬 1440·390: 섹션 4개 헤더, 카드 한 겹, 로드 중 버튼 위치 변화 0, 390 내용 폭 340px 이상.
  - 계정 삭제 모달: 처음 포커스 "돌아가기", 실패 시 닫히지 않고 레드 안내.
  - RecentSearches 링크가 `/search?q=…&fromHistory=1` 그대로.
- 적용 레퍼런스 규칙
  - ux-rules 1장 (사) 마이페이지: 플랜·사용량 → 결제 → 계정 → 로그아웃·탈퇴 분리(QR §9 destructive-nav-separation)
  - ux-rules H13 파괴적 동작 확인·레드·분리(ux#35, shadcn#42·#43), H10 상태 알림, H14 늦게 오는 내용 자리 잡기(ux#19)
  - 확정 섹션 헤더 패턴, Resend 면 한 겹(reference-design §2.6)
- 위험
  - 불변 조건 1: RecentSearches 의 검색 횟수 표시와 `fromHistory=1` 링크는 스타일만.
  - 불변 조건 4: `/api/cancel-subscription`·`/api/delete-account`·초대 API 호출 그대로.
- 관련 발견: auth-08, auth-09(마이페이지), auth-12, auth-13, auth-15(마이페이지), a11y-04(마이페이지 모달), mobile-13(모달 폭)

### R22 · 마감 · 접근성 잔여·전체 QA·문서화 · 공수 M

- 목표: 화면별 항목이 끝난 뒤 남은 전역 접근성 결함을 쓸어 담고, 사용자 화면 전체를 같은 기준으로 검증하며, 다음 작업자가 이어받을 문서를 저장소에 남긴다.
- 범위 페이지: 전 라우트(운영자 화면 제외)
- 범위 파일: 사용자 화면 중 남은 파일(점검 스크립트 결과로 결정), `package.json`(scripts 만), `scripts/check-theme.sh`(신규), `DESIGN.md`(신규), `docs/ux-renewal/ROADMAP.md`(신규·갱신), `src/app/globals.css`(재매핑 주석)
- 변경
  1. 남은 outline-none(사용자 화면) → outline-hidden + INPUT 포커스, 대체 표시 없는 입력 0.
  2. 남은 아이콘 버튼 aria-label, 장식 SVG aria-hidden, 공용 버튼 type="button" 기본.
  3. 남은 `text-[8~11px]` → 12px 이상(영문 라벨 예외), 정보 글자 neutral-500/600/700 → neutral-400, 이모지 아이콘 → 맨 SVG, 화면 문구·메타데이터 `—` → "·"·쉼표(결정 8 범위).
  4. main 없는 라우트에 최상위 main, 페이지 제목 중복 접미사 제거, 남은 `min-h-screen` 정리.
  5. `scripts/check-theme.sh` + `package.json` "check:theme": 사용자 화면(admin·insights/admin·insights/_components·community/admin·tmklab-site·DevEditor 제외, 결정 13 이 C 인 동안은 studio/class/[slug]·studio/classroom 도 제외)에서 `(gray|slate|zinc|teal)-[0-9]`, `bg-gradient|bg-linear|bg-radial|shadow-\[0_0|animate-ping`, `—`, 이모지, `text-\[(8|9|10|11)px\]`, `\[#00E5A0\]`(토큰 미사용) 0건 확인. 의존성 없음.
  6. 전체 캡처 QA: 공개 라우트 1440·1024·768·390, 로그인 화면 1440·390(소유자 크롬). ux-rules 8장 점검표(대비·포커스·reduced-motion·키보드·200% 확대·320px).
  7. 빌드 표 비교: 정적(○)·ISR(●) 시작 전과 동일.
  8. 문서: 확정값(토큰·레시피·결정 결과)만 `DESIGN.md` 로, 로드맵·항목별 완료 커밋을 `docs/ux-renewal/ROADMAP.md` 로, 감사 원문은 `docs/ux-renewal/findings/` 로.
- 완료 기준
  - `npm run check:theme` 0건, tsc·build 통과.
  - 불변 조건: layout.tsx 인증 호출 0, SearchBar.tsx·search/page.tsx 보호 행 diff 0(시작 커밋 대비), 커뮤니티 게이트·noindex·canReadBoard diff 0, package.json dependencies 변화 0.
  - 키보드만으로 홈 검색·요금제 결제 버튼·커뮤니티 글 열기·검색 결과 상세 열기 가능, 포커스는 모두 에메랄드 2px.
  - 320px 폭 공개 라우트 가로 스크롤 0, 200% 확대(1280px 창)에서 네비 겹침 0.
  - axe 확장으로 공개 라우트 critical 위반 0.
  - DESIGN.md·docs/ux-renewal/ROADMAP.md 존재, 항목마다 완료 커밋 해시.
- 적용 레퍼런스 규칙
  - ui-ux-pro-max README 납품 전 점검표 + QR §1~§3(ux-rules 8장)
  - ux-rules 0.2 마스터(확정 규칙) + 오버라이드(페이지 구조)
  - ux-rules T12 경계 폭 320/375/414/768/1024/1440(tw#31)
  - awesome-design-md DESIGN.md 형식(토큰 앞머리 + 색·타이포·컴포넌트·Do/Don't)(reference-design §0)
- 위험
  - 운영자 화면은 제외 범위라 점검 스크립트에서 빼고 R03 의 gray 재매핑을 유지한다.
  - 커밋·push 는 하지 않는다(오케스트레이터 몫).
- 관련 발견: a11y-01, a11y-02, a11y-08(main), a11y-09, a11y-10, a11y-11, a11y-13, mobile-10(min-h), system-02(점검 스크립트), system-11(아이콘 잔여)

---

## 5. 소유자 결정 필요 사항

답이 없으면 "기본 동작"으로 진행한다. 기본 동작은 소유자가 직접 만든 것은 그대로 두는 쪽이고, 확정 규칙과 충돌하는 경우(결정 7)와 명백한 사실 오류(결정 8 B)만 예외다.

| # | 질문 | 선택지 | 권장 | 이유 | 기본 동작 |
|---|---|---|---|---|---|
| 1 | 상단 메뉴 "유튜브 채널 대행 문의"(/studio)를 일반 방문자에게 공개할까요? 지금은 비밀 링크(/tmkstudio) 쿠키가 없으면 홈으로 튕깁니다. | A. 공개: StudioGuard 제거(/tmkstudio 는 유입 추적용으로 계속 동작) / B. 비공개 유지: 메뉴·커뮤니티·문의 폼의 /studio 링크를 /studio/consulting 으로 바꾸고 /studio 는 noindex·사이트맵 제외 / C. 지금 그대로 | A | 사이트맵 priority 1.0·canonical·메뉴 강조까지 공개 페이지로 설계됐는데 방문자·검색엔진 모두 도달하지 못한다. 쿠키 없이 받은 HTML 에 본문이 이미 다 들어 있어 비공개 효과도 없다. | C. 가드·링크 유지. R11 은 화면만, 홈·푸터에 대행 링크를 새로 넣지 않는다 |
| 2 | 로그인 화면이 돌아갈 주소(redirect_url·next)를 읽어 로그인 뒤 원래 화면(요금제 결제, 커뮤니티 글, 마이페이지)으로 돌려보내게 할까요? 인증 흐름의 파라미터 전달입니다. | A. 허용(`/` 로 시작하는 내부 경로만, `//`·`/\` 차단) / B. 지금처럼 항상 /search, 화면 보완만(검색 시작 화면, 입력 키워드·선택 플랜 sessionStorage 복원) | A(+B 보완 유지) | 돌아갈 주소를 보내는 곳 18곳이 모두 무시돼 신규 가입자 전원이 빈 검색 화면에 도착한다. 콜백은 이미 next 를 지원해 로그인 폼 한 곳만 바뀐다. | B |
| 3 | 데스크톱 네비 메뉴를 레퍼런스(Resend·Linear)처럼 아이콘·화이트 필 없는 텍스트 링크로 통일할까요? (8/14 "커뮤니티 3종 화이트 필 통일" 결정을 바꾸는 일) | A. 텍스트 링크 통일: 기본 neutral-400, 현재 페이지 흰 글자 + 2px 밑줄, 컨설팅·대행 에메랄드 유지 / B. 화이트 필·아이콘 유지, 현재 위치 표시만 추가 | A | 6개 중 5개가 강조(필 3 + 에메랄드 2)라 강조가 의미를 잃고 "요금제"만 비활성처럼 보인다. 텍스트 링크는 폭이 줄어 1280px 에서 겹침 여유가 생긴다. | B |
| 4 | 모바일·태블릿에서 메뉴 2행까지 상단에 고정(약 134px, 화면의 16~20%)하는 지금 방식을 유지할까요? | A. 1행(56px)만 고정, 2행은 페이지 맨 위에서 모두 보이고 스크롤하면 올라감 / B. 지금처럼 두 줄 모두 고정 | A | "모든 메뉴를 스크롤 없이 노출"(layout.tsx:360) 의도는 페이지 맨 위에서 그대로 지켜지고 본문 공간이 약 15% 늘어난다. 홈 검색창·로그인 카드가 첫 화면에 들어온다. | B. 2행 칩 모양 통일·터치 높이만 적용 |
| 5 | 커뮤니티 "Business Black" 배너를 글 상세·글쓰기·랭킹·소개에서도 지금처럼 크게(1440px 에서 높이 약 390px) 보여 줄까요? 글쓰기에서 배너·사이드바를 숨기는 집중 모드도 함께 묻습니다. | A. 피드 첫 페이지에서만 배너, 글쓰기는 집중 모드 / B. 피드는 지금 크기, 하위 화면은 높이 64px 띠 / C. 지금 그대로 | A | 노트북 화면에서 글 상세 본문이 첫 화면 밖으로 밀리고, 글쓰기 중 사이드바 링크를 누르면 작성 내용을 잃는다. | C |
| 6 | 근거를 확인할 수 없는 수치·긴급성 표현을 어떻게 할까요? 홈 "10,000+ 키워드 분석됨"(고정값)과 "인기 키워드"(고정 목록), 구조화 데이터 평점 4.8·리뷰 47, 블랙맵 강의 "342명·4.8점·BESTSELLER", /studio "이번달 신규 대행 마감임박". | A. 실제 값(집계·날짜)을 주시면 교체, 없으면 숫자·문구를 빼고 확인 가능한 사실(총 구독자 70만+, 검색 국가 5개, 하루 2회 무료, "예시 키워드")로 대체 / B. 지금 그대로 | A | ui-ux-pro-max landing#12·#20·#23 은 수치를 현재값·검증·날짜가 있을 때만 쓰라고 한다. 근거 없는 수치는 /studio 의 실제 실적까지 의심받게 한다. | B. 카운트업이 0 에서 시작하는 문제와 움직임 줄이기 대응만 R07·R11 에서 고침 |
| 7 | /studio 에 남은 레드(#E5484D) 강조 10곳을 확정 규칙대로 바꿀까요? 8/14 오전에 이 페이지에만 넣고, 같은 날 사이트 전체를 에메랄드로 되돌릴 때 빠진 것으로 보입니다. | A. 확정 규칙: 핵심 수치 2~3곳만 에메랄드, 헤드라인은 회색 리드 + 흰색, 후기 배지는 흰 글자 + neutral 테두리 / B. 레드 유지 | A | 확정 규칙 "액센트는 #00E5A0 하나, 레드는 되돌림"에 어긋나고 네비(에메랄드) → /studio(레드) → 문의 폼(에메랄드)으로 색이 바뀐다. | A. 확정 규칙이 기준(답이 B 면 R11 에서 되돌림) |
| 8 | 화면 문구가 실제 동작·가격과 다른 곳을 어디까지 고칠까요? 예: 한도 모달 "내일 자정 초기화"(실제 오전 9시), 월 한도 사용자에게 "오늘", "월 ₩15,000"(월간 19,000), 제목 패턴 "최근 30일 기준", about "Business 플랜·팀원 5명", 요금제 하단 "남은 기간 환불" vs 환불정책 "7일 초과 환불 불가", 약관 요금·시행일·수탁사(Clerk), 상담 폼 "채널 URL만 보내주시면", TEAM BIBL 명칭 3종 | A. 모두 실제에 맞춤(법적 문서는 소유자가 문장 확인) / B. 앱 안내 문구의 사실 오류(초기화 시각·기간·권유 플랜·가격·통계 기준·about 플랜명)만 고치고, 약관·환불·개인정보·FAQ 환불 답변·상품 명칭·마케팅 약속 문구는 그대로 / C. 문구는 하나도 바꾸지 않음 | A | 요금·환불·초기화 시각은 결제와 분쟁에 직결된다. 법적 문서는 문장 확인이 필요해 기본안에서 뺐다. | B |
| 9 | 트렌드 서치 허브가 "채널 찾기·채널 분석"을 Starter+ 잠금으로 보여 주는데, 실제로는 Free 도 채널 검색 1회/일이 되고(요금제 카드에도 표기) 채널 분석은 제한이 없습니다. 어느 쪽에 맞출까요? | A. 실제 정책대로: 플랜 설정(PLANS)을 읽어 표시, 채널 찾기는 "무료 1회/일" 캡션 + 바로가기 / B. 허브 표기가 맞음(정책 변경은 로직 작업이라 별도) / C. 지금 그대로 | A | 무료 사용자는 무료 체험이 있는지 알 수 없어 요금제와 허브 사이를 맴돈다. 허브·요금제·실제 동작 세 곳이 다 다르다. | C |
| 10 | 직접 입력 검색은 "1회 차감" 확인창을 거치는데, 홈 예시 키워드 칩과 검색 화면 연관 키워드 칩은 확인 없이 바로 차감됩니다. 칩도 같은 확인창을 거치게 할까요? | A. 칩도 같은 확인창(누적 로직의 순서·파라미터는 그대로, 앞단에 확인만) / B. 확인창 없이 칩 옆에 "누르면 검색 1회가 차감됩니다" 안내만 | A | 하루 2회인 무료 사용자가 칩 한 번에 절반을 잃는다. | B |
| 11 | 가입·로그인 동선: (가) 검색 한도 초과 모달을 닫을 수 있게, (나) 모달의 카카오·구글 바로 가입을 약관 동의 단계(/sign-in)로, (다) 로그인 화면의 동의 → 로그인 2단계를 한 화면으로(필수 동의 전 버튼 비활성) 바꿀까요? | A. 세 가지 모두 / B. (가)만 / C. 지금 그대로 | A | 모달에 닫기가 없어 상단 메뉴까지 막히고, 모달 가입 경로만 필수 동의(1dcb8fb 에서 신설)와 마케팅 동의 기록을 건너뛴다. 기존 회원은 로그인할 때마다 3번 눌러야 버튼이 나온다. | C. 모달은 테마만 바꾸고 닫기·가입 경로·2단계 구조 유지 |
| 12 | 채널 찾기 기본 탭 "영상 평균 조회수 순"이 실제로는 총조회수÷구독자 비율로 정렬하고 "N배"로 표시합니다. 어느 쪽에 맞출까요? | A. 이름대로 영상당 평균 조회수로 정렬·표시 / B. 계산 유지, 이름을 "조회수/구독자 비율 순"으로 / C. 지금 그대로 | A | 데이터 도구에서 열 제목과 값이 다르면 표 전체를 믿기 어렵다. 값은 이미 데이터에 있다(신생 탭이 사용). | C |
| 13 | 영상 0개·수강 신청 404·수강권 조회 불가 상태인 강의 상세(/studio/class/youtube-business-blackmap)와 강의실(/studio/classroom)을 어떻게 할까요? | A. 준비될 때까지 비공개(상세 notFound 또는 noindex, 강의실 링크 정리) / B. 공개 유지, 신청 버튼 "준비 중" + 근거 없는 수치 숨김 / C. 지금 그대로 | A | 검색·공유로 들어온 사람이 할인가와 342명·4.8점을 보고 버튼을 눌러 404 를 만난다. | C. 강의 화면 작업은 결정 전까지 보류 |
| 14 | 진입 경로가 없거나 쓰이지 않는 화면을 어떻게 할까요? /threads(사이트 안 링크 0건), 스레드 수집함(글을 담을 방법이 없음), /tools/calculator(링크 0건), /tmklab-site(구 랜딩, 열면 비블랩 네비가 깨짐). | A. /threads·계산기는 허브에 카드 추가, 수집함은 저장 글이 있는 사용자에게만 탭, /tmklab-site 는 /studio 로 리다이렉트 후 정리 / B. 모두 숨김(noindex·피드·사이트맵 제외) / C. 지금 그대로 | A | 만들어 둔 기능이 사용자에게 보이지 않거나, 쓸 수 없는 기능으로 업그레이드를 권한다. | C. R08·R20 은 테마·오류 처리만 |
| 15 | 카카오 SDK 무결성 값을 고쳐도 프로덕션 빌드의 NEXT_PUBLIC_KAKAO_JS_KEY 가 비어 있어(`Kakao.init('')`, 10/6 확인) 카카오톡 공유가 동작하지 않습니다. Vercel 환경변수에 카카오 JavaScript 키를 넣을까요? | A. 키를 넣어 카카오톡 공유를 살림 / B. 공유 메뉴에서 카카오 항목을 빼고 링크 복사·기기 공유만 / C. 지금 그대로(누르면 링크 복사) | A | 공유 버튼이 "카카오톡 공유"인데 실제로는 링크 복사라 기대와 다르다. | C. R01 은 콘솔 오류와 전 페이지 SDK 로드만 없앤다 |
| 16 | /studio/consulting 문의 폼에서 (가) 선택지가 1개뿐인 "서비스" 질문 자동 선택, (나) 첫 질문 "유입 경로"를 마지막 단계로, (다) 제출 버튼 위 개인정보 수집·이용 고지 + /privacy 링크를 할까요? 필수 항목 수(8/15 결정)는 그대로입니다. | A. 세 가지 모두 / B. (가)·(다)만 / C. 지금 그대로 | A | 1단계에서 왜 잠겼는지 모르는 필수 질문을 눌러야 넘어가고, 이름·전화·이메일을 받으면서 수집 안내가 없다. | C. R12 는 라벨·검증·오류 안내 등 구조만 |
| 17 | 커뮤니티 랭킹 1·2위가 "비블 bibl 운영자" 두 계정입니다. 회원 순위에서 운영진을 어떻게 보일까요? | A. 순위에서 빼고 표 위 "운영진" 줄로 / B. 순위에서 제외 / C. 지금 그대로 | A | 같은 이름이 두 줄 연속 나와 중복 오류처럼 보이고 회원 순위표 맨 위를 운영진이 차지한다. | C |

---

## 6. 제외한 것

| 제외 항목 | 이유 |
|---|---|
| a11y-02 의 전역 neutral-500 재매핑(oklch 60%) | Tailwind 기본 팔레트 값과 달라져 명세(토큰 = Tailwind 기본값)와 어긋나고 테두리·placeholder 밝기도 함께 바뀐다. text-neutral-500/600/700 을 쓰는 34개 파일 중 운영자·미사용 파일 5개와 결정 13 대기 중인 강의 상세 2개를 뺀 27개가 모두 R01~R21 범위에 있어 파일별로 neutral-400 으로 고치고 R22 점검 스크립트로 확인한다 |
| 흰색 포커스 링(ux-rules 5.2, a11y-01 안) | Linear 의 "액센트는 포커스 링에" 규율과 reference-design §4.4 를 따라 에메랄드 2px 로 통일했다. 흰 버튼 위에서도 2px 간격 덕분에 검정 바탕 위에 링이 그려진다 |
| 운영자 전용 화면(admin, admin/traffic, insights/admin, community/admin) 테마 변환 | 원칙 7. R03 의 gray·slate 재매핑으로 청색기만 사라진다. 틸·클래스 정리는 소유자가 원할 때 별도 일괄 치환 |
| /insights 공개 경로, InsightsList·PostRenderer | 칼럼이 커뮤니티로 통합돼 /insights 는 리다이렉트만 남았다. PostRenderer 는 관리자 에디터 미리보기에서만, InsightsList 는 사용처 0 |
| 홈 결과 미리보기(home-04) | 검색 결과 화면 변환(R16~R18) 뒤 실제 캡처가 필요하다. 로드맵 이후 후속 항목으로, 어떤 키워드 화면을 쓸지 소유자 확인 |
| 컨설팅 상세 이미지 7장의 전체 HTML 전환·이미지 개정(class-02 3단계, class-15) | 디자인 산출물 수정과 대량 전사라 이번 범위 밖. R12 는 요약 카드·대체 텍스트·가격 직후 CTA 만 |
| 강의실·플레이어·강의 상세 화면(class-12, class-13, class-14)과 수강권 조회(class-06) | 지금은 누구도 강의실에 들어갈 수 없고(수강권 필드 미조회) 공개 여부가 결정 13 에 걸려 있다. 수강권 조회는 DB 로직이라 별도 작업 |
| 서버·결제 로직 문제(소유자 별도 보고) | 토스 결제 내역 금액 기록 오류(pricing-05), 상담 API 가 DB 저장 실패에도 ok 반환, /my-channel 로그인·횟수 제한 없음(쿼터 위험), 스레드 장기 토큰 갱신 미호출(60일 만료), 비로그인 채널 검색 차감 미기록 가능성, 최근 검색어 재방문 시 캐시 만료면 확인 없이 차감, 홈 count 와 /search v 의 누적 기준 차이(불변 조건 1 영역), 토스 화면의 이메일·이름 쿼리스트링 전달 |
| 새 기능(데이터 내보내기 확대, 검색 자동완성, 글쓰기 자동 보관·이탈 확인) | 기능 추가는 소유자 판단(ux-rules 9.3 #30) |
| shadcn CLI·Radix·아이콘 라이브러리·@tailwindcss/typography 설치 | 불변 조건 6. 관례만 클래스 함수·네이티브 dialog 로 구현(ux-rules 9.5) |
| ESLint 설정 복구 | eslint.config.mjs 가 설치된 ESLint 8.57 에 없는 eslint/config 를 불러온다. 도구 영역이라 제외하고 R22 의 의존성 없는 grep 점검 스크립트로 대신 |
| 모바일 네비 2행을 한 줄 가로 스크롤로 바꾸는 안(mobile-02) | layout.tsx:360 "스크롤 없이 모두 노출" 소유자 의도와 충돌. 고정 범위만 결정 4 |
| 커뮤니티 탭에서 "브랜드 인큐베이팅" 제거, 모바일 칩 줄을 게시판 선택 버튼으로 교체(community-09·05 일부) | 소유자가 만든 메뉴 구성이라 유지하고 현재 위치 표시·활성 칩 스크롤만(R14) |
| /studio 차별점 스톡 사진 교체, STRENGTH 헤드라인 신규 문구 | 자산·문구를 소유자가 제공해야 한다 |
| 검색 결과 목록 가상화(ux-rules H32) | 최대 200행이라 이미지 지연 로드와 50개씩 보여 주기로 충분 |
| 썸네일 next/image 전환(ux-rules H15) | Vercel 이미지 최적화 비용. `<img loading="lazy" width height>` 유지 |
| 결제 미사용 컴포넌트 7개와 검색 미사용 파일(src/components/VideoCard·Sparkline·PerformanceBadge, ViewTrendGraph, UpgradeModal, ColHeader) 변환 | 사용처 0. 삭제는 소유자 확인 후 |
| 점검 모드에서 네비 메뉴 숨김(shell-15 일부) | middleware rewrite 라 브라우저 주소가 원래 경로로 남아 클라이언트에서 판정할 수 없다. 화면 틀만 R04 |

---

## 부록 A. 발견 → 항목 매핑

| 영역 | 매핑 |
|---|---|
| shell | 01→R01 · 02→R03(+R06 푸터) · 03→R03 · 04→R06 · 05→R06(결정 4) · 06→R03 · 07→R03(+R06 건너뛰기) · 08→R05 · 09→R01(+결정 15) · 10→R06 · 11→R06(+R04 Logo) · 12→R01·R06·R07·R19 · 13→R06 · 14→R06(+R14·R16 loading) · 15→R04 |
| class | 01→결정 13 · 02→R12(일부)·제외 · 03→R01·R05·R12 · 04→R12(결정 1·13) · 05·08·09·10·11→R12 · 06·12·13·14·15→제외(결정 13) |
| community | 01→R13 · 02→R14(결정 5) · 03→R13·R15 · 04→R15 · 05·06→R14 · 07→R01·R13 · 08→R13 · 09→R14(결정 1) · 10→R13·R15 · 11·12→R15 · 13·14→R14 · 15→R14(결정 17) |
| search | 01→R02 · 02→R02·R16(결정 11) · 03→R16·R17 · 04→R18 · 05→R16·R17·R18 · 06→R17·R18 · 07·08·09·10·12·13→R18 · 11→R16·R17·R18(결정 8·10) · 14→R05 · 15→R16·R18 |
| a11y | 01→R03·R20·R22 · 02→각 항목·R22 · 03→R16·R18 · 04→R05(+R07·R16·R18·R21) · 05→R12·R13·R14·R18 · 06→R03·R07·R11 · 07→R01 · 08→R06·R13·R22 · 09→R06·R15·R22 · 10→R16·R17·R22 · 11→각 항목·R22 · 12→R14·R16·R18 · 13→R10·R14·R16·R19·R22 |
| mobile | 01→R03 · 02→R01·R06(결정 4) · 03→R05 · 04→R18 · 05→R03(+각 입력) · 06→R13(+R05) · 07→R12 · 08→R03 · 09→R15 · 10→R06·R22 · 11→R18 · 12→R06·R15·R18 · 13→R18·R19·R21 · 14→R03 |
| system | 01·05·06·07·08·09→R04(+각 항목) · 02→R03·R14·R22 · 03→R06 · 04→R05 · 10→R03 · 11→R04·R06·R22 |
| home | 01→R03·R07 · 02→R02(결정 2) · 03→R07(결정 6) · 04→제외(후속) · 05→R07(결정 1) · 06→R08(결정 9) · 07·10·12·15→R07 · 08·09→R08 · 11→R07(결정 10) · 13→R03·R16 · 14→R02·R08·R16 |
| pricing | 01·02·03·10·11·12·13→R09 · 04→R01 · 05→제외(보고) · 06·07→R10 · 08→R09(결정 8) · 09→결정 8 · 14·15→R08 |
| studio | 01→결정 1 · 02·05·06·07·08·09·13·15→R11 · 03·04→R01 · 10→R12(결정 16) · 11→R12 · 12→R03·R11·R12 · 14→R11·R12 |
| auth | 01→R10(결정 2)·R02 · 02·07·14→R10 · 03→R01 · 04→R01·R09·R10·R16 · 05·06→결정 11(R16) · 08→R10·R16·R21 · 09→R02·R21 · 10·11→R05 · 12·13→R21 · 15→R10·R21 |
| channels | 01·05→R02 · 02→결정 12(R19) · 03→R19·R20 · 04·08·10→R19 · 06·07·13·14→R19·R20 · 09→결정 9·14(+R16 도구 탭) · 11·12→R20(결정 14) · 15→결정 14 |
