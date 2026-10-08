# bibllab.com 디자인 노트 · 최종 시안 (레이아웃 F + 모노크롬 실버)

> 저장소 `DESIGN.md` 의 바탕. 한 문장: 검정 바탕에 실버와 흰색만 써서 색 대신 밝기로 강조하고, 실버 판 로고·실버 라벨·실버 + ·실버 플레이 버튼 사진으로 비블을 알린다. 채도 있는 색은 콘텐츠(썸네일·사진), 유튜브 ↗ hover, 카카오 버튼, 앱 기능 색 네 곳뿐.

- 화면: `home.html`(홈) · `app.html`(로그인 후 영상 찾기, 2개 선택한 상태) · `brand.html`(브랜드 시트)
- 토큰 원본: `_work/theme-final.css` (세 화면에 같은 블록). 빌드: `python3 _work/build_final.py`
- 레이아웃·문구: 시안 F 그대로. F 의 결과 행 데이터(`F/_work/rows.json`)가 비어 있어 시안 A 의 같은 '캠핑' 10행(2026-10-07 검색값)으로 `_work/fsrc/_work/rows.json` 을 복구해 F 템플릿으로 다시 빌드했다.

---

## 1. 색 토큰 (Tailwind v4 `@theme`)

`--color-*: initial;` 로 기본 팔레트를 비워서 토큰 밖 색(neutral-*, white, black, teal …)은 클래스로 만들 수 없다.

| 토큰 | 값 | 역할 | 검정 위 대비 | 지금 사이트 |
|---|---|---|---|---|
| `--color-canvas` | `#000000` | 페이지 바탕 (Business Black) | | `bg-black` |
| `--color-surface` | `#0a0a0a` | 카드·입력·검색창 | | `bg-neutral-950` |
| `--color-surface-2` | `#171717` | hover·선택 행·이미지 자리·대화상자 | | `bg-neutral-900` |
| `--color-surface-3` | `#262626` | 눌린 탭·아바타 | | `bg-neutral-800` |
| `--color-line` | `#262626` | 구역·카드 테두리 | 1.39 | `border-neutral-800` |
| `--color-line-soft` | `#171717` | 표·목록 행 구분 | 1.17 | `border/divide-neutral-900` |
| `--color-line-strong` | `#404040` | 입력·보조 버튼·배지 테두리 | 2.03 | `border-neutral-700` |
| `--color-line-hover` | `#525252` | 테두리 hover | 2.69 | `border-neutral-600` |
| `--color-line-control` | `#7a7a7a` | 체크박스 테두리 (UI 3:1) | 4.89 | `#525252`(미달) |
| `--color-fg` | `#ffffff` | 제목·숫자 | 21.00 | `text-white` |
| `--color-fg-1` | `#e5e5e5` | 영상 제목 | 16.67 | `text-neutral-100/200` |
| `--color-fg-2` | `#c6c6c6` | 본문 (실버 판) | 12.29 | `text-neutral-300` |
| `--color-fg-3` | `#949494` | 보조·캡션·↗ 평소 | 6.92 | `text-neutral-400` |
| `--color-fg-4` | `#7a7a7a` | 장식 화살표. 작은 글자 하한 | 4.89 | `text-neutral-500/600` |
| `--color-accent` | `#ffffff` | 핵심어·주 버튼·현재 위치·정렬·선택·포커스 | 21.00 | `#00e5a0` |
| `--color-accent-hover` | `#e5e5e5` | 흰 버튼 hover | | `#66ffcc` |
| `--color-accent-active` | `#c6c6c6` | 흰 버튼 누름 | | |
| `--color-accent-ink` | `#000000` | 흰·실버 면 위 글자 | | |
| `--color-silver` | `#c6c6c6` | 섹션 라벨·lab·실적 +·첫 화면 제목 맥락·01·02·03 | 12.29 | 새로 |
| `--color-logo-plate` | `#e3e3e3` | 로고 B 판 (B 글자 대비 16.36) | 16.36 | 새로 |
| `--color-positive` | `#5ee39a` | 좋음·성공·상승 ▲·경쟁 낮음 | 12.93 (#171717 위 11.04) | green/emerald/teal |
| `--color-caution` | `#f5b73b` | 주의·Bad·남은 횟수 5회 이하·경쟁 보통 | 11.72 (10.00) | yellow/amber/orange |
| `--color-negative` | `#fa5570` | 나쁨·오류·하락 ▼·Worst·경쟁 높음 | 6.60 (5.63) | red-400/500 |
| `--color-competition-low/mid/high` | positive/caution/negative 별칭 | 키워드 경쟁도 3단계 | | teal/yellow/red |
| `--color-chart-1` / `-2` / `-3` / `-grid` | `#ffffff` `#949494` `#525252` `#262626` | 주 계열 / 비교(점선) / 배경 막대 / 눈금 | | `#60A5FA` 등 |
| `--color-heat-1`~`5` | `#1f1f1f` `#474747` `#7a7a7a` `#b0b0b0` `#ededed` | 히트맵 5단계 (1·2 흰 글자, 3~ 검정 글자) | | `rgba(0,229,160,x)` |
| `--color-paper` / `-ink` / `-muted` | `#ffffff` `#000000` `#6b6b6b` | 흰 바탕 문서용 로고 | | |
| `--color-youtube` | `#ff0000` | 유튜브 로고, ↗ hover·포커스 때만 | 5.25 | |
| `--color-kakao` / `-hover` / `-ink` / `-icon` | `#fee500` `#fdd835` `#191919` `#3a1d1d` | 카카오 버튼 | | 그대로 |

### 색약 검증 (Machado 2009 강도 1.0, CIEDE2000, `_work/cvd.py`)

| 쌍 | 녹색약 | 적색약 | 보통 |
|---|---|---|---|
| 좋음 #5EE39A ↔ 나쁨 #FA5570 | 11.8 | 29.6 | 76.7 |
| 좋음 ↔ 주의 #F5B73B | 15.5 | 13.2 | 38.6 |
| 주의 ↔ 나쁨 | 17.4 | 30.6 | 44.8 |
| (비교 시안 M) #3DD68C ↔ #FF7B72 | 6.4 | 16.1 | 67.7 |

색은 보조 수단이다. 등급은 Great·Worst 라벨, 배수는 ▲▼ 기호, 경쟁도는 칸 수(1·2·3)와 '경쟁 낮음' 글자를 언제나 함께 쓴다.

## 2. 글자 단계 (Pretendard Variable 하나, R03 그대로)

| 토큰 | 크기 / 행간 / 자간 / 굵기 | 쓰는 곳 |
|---|---|---|
| `text-display` | 60 / 1.15 / −0.03em / 800 | 1280 이상 첫 화면 제목 |
| `text-h1` | 48 / 1.2 / −0.025em / 800 | 섹션 제목(데스크톱), 첫 화면 1024 |
| `text-h2` | 36 / 1.25 / −0.02em / 800 | 첫 화면 제목 모바일 |
| `text-h3` | 28 / 1.3 / −0.02em / 800 | 섹션 제목 모바일 |
| `text-title` | 24 / 1.3 / −0.02em / 800 | 카드 제목 |
| `text-h4` | 20 / 1.4 / −0.01em / 700 | 가격·앱 결과 제목 |
| `text-lead` | 18 / 1.7 | 리드 문장·모바일 메뉴 |
| `text-body` | 16 / 1.75 | 본문 |
| `text-ui` | 15 / 1.6 | 버튼·카드 설명 |
| `text-body-sm` | 14 / 1.7 | 표·보조 본문 |
| `text-caption` | 13 / 1.5 / 500 | 캡션·라벨 |
| `text-micro` | 12 / 1.5 / 500 | 배지·표 머리·법적 고지 |

- 두 톤 제목은 두 가지만: 한 문장 속 핵심어는 '문장 실버 + 핵심어 흰색'(첫 화면), 두 줄 섹션 제목은 '앞줄 fg-3 + 뒷줄 fg'.
- 섹션 라벨: 900 · 14/16px · 자간 0.25em · silver. 숫자는 `tnum`.
- 한글 제목 자간은 −0.03em 까지. 모노 글꼴 없음. `word-break: keep-all`, 가운뎃점 앞뒤 U+2060.

## 3. 간격·반경·폭

- 간격은 Tailwind 4px 단위. 구역 세로 여백 `py-16 md:py-24`, 섹션 머리 아래 40/48px, 카드 안 20/24/32px, 좌우 여백 24(모바일)·32(1024 이상).
- 반경: `--radius-control` 8px(버튼·입력·칩), `--radius-card` 12px(검색창·카드·토스트), `--radius-panel` 16px(패널·사진·대화상자). 알약 CTA 금지.
- 폭: `--container-page` 75rem, `--container-wide` 80rem(홈·앱 기본), `--container-reading` 42rem. 한 줄 메뉴 기준 `--breakpoint-nav` 80rem.
- 깊이는 그림자 없이 면 밝기와 1px 선: canvas → surface → surface-2 → surface-3.

## 4. 컴포넌트 레시피

| 부품 | 레시피 |
|---|---|
| 로고 | `logo-plate`(bg logo-plate, 글자 accent-ink) 헤더 `size-9 rounded-lg text-[22px] font-black` + `text-[17px] font-bold` 'bibl' fg + ' lab' silver. 푸터 `size-8 rounded-[7px] text-[19px]`. 최소 20px, B 는 판 높이 61%, 반경 22%. 흰 바탕은 paper-ink 판 + paper 글자 + lab paper-muted |
| 주 버튼 `.btn-primary` | bg accent · 글자 accent-ink · hover accent-hover · 누름 accent-active · 700 · 반경 control. 한 화면에 하나 |
| 보조 `.btn-secondary` | 1px line-strong · bg surface · 600 · hover line-hover + surface-2 |
| 고스트 `.btn-ghost` | 글자 fg-2 · hover surface-2 + fg |
| 잠긴 기능 | `.is-locked`(fg-3) + `.pro`(1px line-strong, 12px, fg-3) |
| 네비 `.navlink` | fg-3 500 → hover fg. 현재 위치 `aria-current` accent 600. 홈의 사람 서비스 `.is-strong` fg 600 |
| 도구 탭 `.tooltab` | fg-3, 현재 탭 accent 600 + 2px accent 밑줄 |
| 세그먼트 `.seg-item` | 선택 = surface-3 면 + fg 600 |
| 섹션 머리 `.sec-head` | 왼쪽 한글 캡션 fg-3, 오른쪽 영문 라벨 silver, 아래 1px line |
| 카드 `.card` | 1px line · surface · 반경 panel · hover line-hover · 카드 전체 링크면 포커스 링을 카드 둘레에 |
| 칩 `.chip` | 1px line · fg-2 · 40px(모바일)/36px · hover line-hover + fg |
| 검색창 | 56px · 반경 card · 1px line-strong · surface · `focus-within:border-accent` |
| 체크박스 `.chk` | 18px · 1.5px line-control · 선택 accent 면 + accent-ink 체크 |
| 표 행 `.row` | hover surface-2 55% · 선택 surface-2 + 왼쪽 inset 2px accent |
| 정렬 열 | 머리 글자 accent 600 + 화살표 |
| 유튜브 ↗ `.ext` | 평소 fg-3, `a:hover`/`a:focus-visible` 일 때만 youtube |
| 등급 `.grade` | Great 면 positive + accent-ink(유일한 기능 색 면) · Good 1px positive 55% + positive · Normal line-strong + fg-3 · Bad caution · Worst negative. 배수 글자는 ▲(2배 이상)·없음(0.5~2)·▼(0.5 미만) |
| 키워드 경쟁도 | 점수 26px 800 단계 색 + `.meter`(3칸 14×6px, 채운 칸 = 단계, 빈 칸 surface-3) + '경쟁 낮음/보통/높음' 700 단계 색 + 권장 문장 fg-2. 낮음 0~35 low · 보통 36~65 mid · 높음 66~100 high. 원형 링·색 면 배경 대신 |
| 남은 횟수 | 평소 1px line + fg-2 → 5회 이하 caution → 0회 negative. 흰색 아님 |
| 상태 메시지 | 1px line 상자 + 기호·제목만 기능 색, 설명 fg-3. 안내는 fg-2 기호(파랑 없음) |
| 대화상자 `.dlg` | surface-2 · 1px line · 반경 panel · 배경 막 canvas 80% · 그림자·블러 없음 |
| 차트 | 주 계열 chart-1 2px, 비교 chart-2 점선, 눈금 chart-grid, 선 아래 칠하기 없음. 평가 있는 값만 기능 색 |
| 포커스·선택 | `:focus-visible` 2px accent, 간격 2px. `::selection` silver 바탕 + accent-ink |

## 5. 액센트 자리 (리브랜딩으로 보이게)

- 홈: ① 로고 판(#E3E3E3, 36px) ② 첫 화면 제목 실버 + '유튜브 트렌드' 흰색 ③ 섹션 라벨 SERVICES·CHANNELS 와 01·02·03 실버 ④ 실적 숫자의 + 실버(70만+·1.7억회+·10억원+·7억+) ⑤ 실버 플레이 버튼 사진(무채색 보정판).
- 앱: 로고 · 현재 위치(네비 흰 글자, 도구 탭 흰 막대) · 정렬 열 · 선택 행.
- 흰 면 버튼: 홈 '분석 시작'·'채널 대행 문의하기', 앱 '검색'.

## 6. 하지 말 것

그라데이션·글로우·블러, 틸(teal·cyan), 펄스 점, 아이콘 상자, 원형 숫자 배지, 이모지, 청색기 회색(slate·zinc·gray, 사진 포함), 화면 문구의 긴 하이픈, 유튜브 빨강을 오류·할인·쇼츠 배지에 쓰기, 기능 색으로 넓은 면 칠하기, 흰색으로 '좋음' 표시, 실버를 광택·반사로 금속처럼 꾸미기.

## 7. 다른 페이지로 넓히는 법

1. `src/app/globals.css` 의 `@theme` 를 `_work/theme-final.css` 의 색 블록으로 바꾼다(`--color-*: initial` 은 마지막에, 남은 neutral·teal 클래스를 다 옮긴 뒤 켠다). `:focus-visible` 은 이미 accent 라 자동으로 흰색, `::selection` 은 silver.
2. 클래스 옮김표: `bg-black`→`bg-canvas`, `neutral-950/900/800`→`surface/surface-2/surface-3`(선이면 `line`/`line-soft`), `text-white`→`text-fg`, `neutral-100·200/300/400/500·600`→`fg-1/fg-2/fg-3/fg-4`, `border-neutral-700/600`→`line-strong/line-hover`. `_work/build_final.py` 의 `CLASS_MAP` 이 같은 표다.
3. 에메랄드 하드코딩(`grep -ri '00e5a0\|66ffcc\|0, 229, 160' src`): 강조·현재 위치는 `text-accent`, 라벨은 `text-silver`, 면은 흰 주 버튼 또는 테두리 버튼, 체크박스는 `.chk`.
4. 로고 4곳(`layout.tsx` 헤더·푸터, `mypage`, `sign-in`, `admin` 의 teal lab)을 위 로고 레시피로.
5. 유튜브 채널 링크의 ↗ 는 `.ext` 하나로(평소 fg-3, hover 빨강).
6. 앱 기능 색: `VideoCard` 등급(🔥 삭제, 위 등급 레시피 + ▲▼), `KeywordCompetition` LEVEL_CONFIG 의 teal/yellow/red → `competition-low/mid/high`, 원형 링 → 막대 + `.meter`, 📊·⚡ 이모지와 teal 버튼 → 보조 버튼. `ViewTrendGraph` 점수 4색 → positive · fg-2 · fg-3 · fg-4. `ChannelDashboard` 상승·하락 → positive▲·negative▼, 히트맵 → heat-1~5. `TitlePatternAnalysis` yellow/gray 배지 → 등급 레시피. `KeywordInsights` 그라데이션·blur → 테두리 패널.
7. 새 화면 점검: 섹션 머리(실버 라벨) 하나 이상, 흰 면 버튼 하나 이하, 기능 색은 라벨·기호와 함께, `python3 _work/build_final.py` 의 check 처럼 하드코딩 색 0 · 금지 패턴 0, 1440·390 캡처에서 가로 넘침 0.
8. 사진: 청색기 있는 원본(`public/studio/silver-play-button.jpg` B−R +4.6) 대신 무채색 보정판.
