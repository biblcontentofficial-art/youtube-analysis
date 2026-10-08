# 팔레트 M · 모노크롬 실버

> 소유자용 한 문장: 검정 바탕에 실버와 흰색만 써서 색 대신 밝기로 강조하는, 차분하고 고급스러운 비블랩입니다. 빨강은 유튜브 표시에만 씁니다.

- 레이아웃 기준: 최종 시안 F(2026-10-07 12:24 저장본을 `_orig/` 에 복사해 고정, 이후 F 변경은 따라가지 않음)
- 화면: `home.html` · `app.html` · `brand.html` (세 파일에 같은 토큰 블록)
- 마지막 캡처: `shots/final/` (데스크톱 1440 · 모바일 390, 가로 넘침 0 · 콘솔 오류 0)

---

## 1. 왜 이 팔레트인가: 브랜드 자산과의 연결

| 자산 | 실제 색 | M 에서 맡는 자리 |
|---|---|---|
| 커뮤니티 이름 **Business Black** (배너 검정 92% + 흰 손글씨) | #000000 · #FFFFFF | 바탕(canvas) 과 강조(accent) |
| **실버 플레이 버튼** 사진. 무채색 보정판에서 직접 추출 | 판 #C6C6C6 · 판 위쪽 #BFBFBF · 버튼 면 #A7A7A7 · 하이라이트 #D0D0D0 · 선반 #282828 / #131313 | 실버 판 #C6C6C6 = 로고 B 판·본문·섹션 라벨. 선반 = 그래파이트 면·선 |
| **팀비블 썸네일** (검정 78% + 흰 큰 글자 + 빨강 제목) | 검정·흰 대비 | 흰색 = '지금·핵심'. 빨강 제목은 썸네일(콘텐츠) 몫으로 두고 웹 UI 로 가져오지 않음 |
| 비블 인물 사진 (차콜 정장, 회색 배경) | 무채색 | 그래파이트 단계 |
| 유튜브 | #FF0000 | 유튜브로 나가는 링크 표시(↗)와 유튜브 로고에만 |
| 소유자 이력 | 레드 #E5484D, 블루 #60A5FA 시도 후 되돌림. 에메랄드는 웹에서만 쓰던 색 | "어떤 색을 액센트로 할까"를 밝기로 풀어 색 실험을 끝낸다. 색은 썸네일·사진이 낸다 |

설계 원칙 세 가지
1. **흰색은 한 가지 뜻**: 지금·핵심·행동(핵심어, 주 버튼, 현재 위치, 정렬 열, 선택, 포커스).
2. **실버는 비블의 재질**: 실버 플레이 버튼의 판. 본문 글자, 로고 B 판, 섹션 라벨, 실적 숫자의 +.
3. **채도 있는 색은 네 곳만**: 콘텐츠(썸네일·사진), 유튜브 표시, 카카오 버튼, 앱의 기능 색.

---

## 2. 토큰 (Tailwind v4 `@theme`)

원본은 `_work/theme-m.css` 한 곳. 세 HTML 에 그대로 들어가 있다. 기본 팔레트를 `--color-*: initial;` 로 비워 토큰 밖 색(neutral-*, white, black …)을 쓸 수 없게 했다.

| 토큰 | 값 | 역할 | 검정 위 | 흰 위 | F·지금 사이트 |
|---|---|---|---|---|---|
| `--color-canvas` | #000000 | 페이지 바탕 (비즈니스 블랙) | 1.00 | 21.00 | bg-black |
| `--color-surface` | #0A0A0A | 카드·입력·검색창 | 1.06 | 19.80 | bg-neutral-950 |
| `--color-surface-2` | #171717 | hover·선택 행·이미지 자리 | 1.17 | 17.93 | bg-neutral-900 |
| `--color-surface-3` | #262626 | 눌린 탭·아바타 | 1.39 | 15.13 | bg-neutral-800 |
| `--color-line` | #262626 | 구역·카드 테두리 | 1.39 | 15.13 | border-neutral-800 |
| `--color-line-soft` | #171717 | 표·목록 행 구분 | 1.17 | 17.93 | border/divide-neutral-900 |
| `--color-line-strong` | #404040 | 입력·보조 버튼·배지 테두리 | 2.03 | 10.37 | border-neutral-700 |
| `--color-line-hover` | #525252 | 테두리 hover | 2.69 | 7.81 | #525252 |
| `--color-line-control` | #7A7A7A | 체크박스 테두리 (UI 3:1 이상) | 4.89 | 4.29 | #525252 (2.69:1, 미달이었음) |
| `--color-fg` | #FFFFFF | 제목·숫자 | 21.00 | 1.00 | text-white |
| `--color-fg-1` | #E5E5E5 | 영상 제목 같은 읽을 거리 | 16.67 | 1.26 | text-neutral-100/200 |
| `--color-fg-2` | #C6C6C6 | 본문 (실버 판) | 12.29 | 1.71 | text-neutral-300 #D4D4D4 |
| `--color-fg-3` | #949494 | 보조·캡션 | 6.92 | 3.03 | text-neutral-400 #A1A1A1 |
| `--color-fg-4` | #7A7A7A | 장식 화살표·구분 기호. 작은 글자 하한 | 4.89 | 4.29 | text-neutral-500/600 |
| `--color-accent` | #FFFFFF | 폴리시드 화이트: 핵심어·주 버튼·현재 위치·정렬·선택·포커스 | 21.00 | 1.00 | #00E5A0 |
| `--color-accent-hover` | #E5E5E5 | 흰 버튼 hover | 16.67 | 1.26 | #66FFCC |
| `--color-accent-active` | #C6C6C6 | 흰 버튼 누름 (실버 판으로) | 12.29 | 1.71 | #D4D4D4 |
| `--color-accent-ink` | #000000 | 흰·실버 면 위 글자 | 1.00 | 21.00 | text-black |
| `--color-silver` | #C6C6C6 | 실버 판: 로고 판·섹션 라벨·실적 + | 12.29 | 1.71 | 새로 |
| `--color-positive` | #3DD68C | 좋음·성공·상승 (앱) | 11.20 | 1.88 | green/emerald/teal-400 |
| `--color-caution` | #F5B73B | 주의·경고 (앱) | 11.72 | 1.79 | orange/yellow/amber |
| `--color-negative` | #FF7B72 | 나쁨·오류·하락 (앱) | 8.33 | 2.52 | red-400/500 |
| `--color-chart-1` | #FFFFFF | 차트 주 계열 | 21.00 | | Sparkline #60A5FA |
| `--color-chart-2` | #949494 | 비교 계열 (점선) | 6.92 | | |
| `--color-chart-3` | #525252 | 배경 막대·Normal 막대 | 2.69 | | |
| `--color-chart-grid` | #262626 | 눈금선 | 1.39 | | |
| `--color-heat-1`~`5` | #1F1F1F · #474747 · #7A7A7A · #B0B0B0 · #EDEDED | 히트맵 무채색 5단계. 1·2단계 흰 글자(16.48·9.29), 3단계부터 검정 글자(4.89·9.68·17.94) | | | rgba(0,229,160,x) |
| `--color-paper` / `-ink` / `-muted` | #FFFFFF / #000000 / #6B6B6B | 흰 바탕 문서용 로고 (lab #6B6B6B 흰 위 5.33) | | | 새로 |
| `--color-youtube` | #FF0000 | 유튜브 표시 전용 | 5.25 | 4.00 | 이미 있음 |
| `--color-kakao` / `-hover` | #FEE500 / #FDD835 | 카카오 버튼 | 16.42 | 1.28 | 이미 있음 |
| `--color-kakao-ink` | #191919 | 카카오 버튼 글자 | | | 이미 있음(그대로) |
| `--color-kakao-icon` | #3A1D1D | 상담 버튼 말풍선 (노랑 위 11.96) | | | KakaoChatButton fill |

그래파이트(바탕·면·선)는 지금 사이트의 neutral 값과 똑같이 두었다. 그래서 옮길 때 실제로 색이 바뀌는 곳은 액센트, 본문·보조 글자 두 단계, 체크박스 테두리, 기능 색뿐이다.

---

## 3. 액센트 규칙

- 액센트는 **흰색 #FFFFFF 와 실버 #C6C6C6**, 채도 0 인 한 가지 색의 밝기 두 단계.
- **홈 3곳**: ① 로고 B 마크(실버 판 위 검정 B) ② 첫 화면 핵심어(실버 제목 속 '유튜브 트렌드'만 흰색) ③ 섹션 라벨 SERVICES·CHANNELS 실버, 실적 숫자 뒤 + 도 실버.
- **앱 4곳**: ① 로고 ② 현재 위치(네비 '유튜브 트렌드 서치' 흰 글자 600, 도구 탭 '영상 찾기' 흰 막대 2px) ③ 정렬 열 '조회수 ↓' 흰 글자 ④ 선택 행(흰 체크박스 + 왼쪽 흰 막대 2px).
- 흰 면 버튼은 한 화면에 하나. hover #E5E5E5, 누르면 #C6C6C6.
- 키보드 포커스 링 흰 2px(간격 2px). 글자 선택 영역은 실버 바탕 + 검정 글자.
- 작은 글자에 쓰는 액센트 단계: 흰색 21.00:1, 실버 12.29:1. 둘 다 4.5:1 이상. 작은 글자에 쓸 수 있는 가장 어두운 회색은 #7A7A7A(검정 위 4.89:1, 카드 #0A0A0A 위 4.61:1).
- 두 톤 제목은 두 가지로만: 한 문장 속 핵심어는 '문장 실버 + 핵심어 흰색'(첫 화면 제목), 두 줄 섹션 제목은 '앞줄 #949494 + 뒷줄 흰색'(F 와 같음).

---

## 4. 기능 색 (앱 전용)

| 뜻 | 토큰 | 값 | 쓰는 곳 | 대비 (검정 / #171717) |
|---|---|---|---|---|
| 좋음·성공·상승 | positive | #3DD68C | Great(작은 면 배지, 검정 글자 11.20), Good(테두리 배지), 저장 완료, 상승세 | 11.20 / 9.56 |
| 주의·경고 | caution | #F5B73B | Bad, 남은 횟수 5회 이하, 인앱 브라우저 경고 | 11.72 / 10.00 |
| 나쁨·오류·하락 | negative | #FF7B72 | Worst, 오류 문장, 하락세, 남은 횟수 0회 | 8.33 / 7.11 |
| 보통·안내 | fg-3 / fg-2 | #949494 / #C6C6C6 | Normal, 안내 문장(파랑 쓰지 않음) | 6.92 / 12.29 |
| 양(평가 없음) | chart-1~3, heat-1~5 | 무채색 | 선 차트, 막대, 요일 히트맵 | |

- **정렬 표시**는 액센트(흰색). '지금 적용된 정렬'이라 흰색의 뜻과 같다.
- **남은 횟수**는 평소 무채색(#C6C6C6, 흰색 아님) → 5회 이하 caution → 0회 negative. 자리는 네비 한 곳 그대로.
- **등급**은 조회수 ÷ 채널 평균: Great 5배 이상 · Good 2배 이상 · Normal 0.5배 이상 · Bad 0.1배 이상 · Worst 0.1배 미만(지금 VideoCard 기준값 그대로). 라벨 없이 색만으로 말하지 않는다.
- **알고리즘 점수**(높을수록 좋음): 70 이상만 초록, 50~69 실버, 30~49 #949494, 30 미만 #7A7A7A. 흰색은 쓰지 않는다.
- 흰색으로 '좋음'을 표시하지 않는다(선택과 헷갈림). 기능 색은 글자·테두리·기호에만 쓰고 면은 Great 작은 배지만 예외.
- 유튜브 빨강은 모양(↗·로고)에만, 오류 빨강은 기호 + 문장에만. 둘은 밝기도 다르다(상대 휘도 0.21 대 0.37). 쇼츠·롱폼 배지는 무채색.

---

## 5. F 에서 바뀐 것 (home.html · app.html)

레이아웃·문구·이미지는 그대로다. `<title>`·description 만 '색 시안 M' 으로 바꿨고, 이미지는 F 자산의 시작 시점 사본(`assets/`)을 가리킨다.

1. 모든 색 클래스를 토큰으로: neutral-*·white·black → canvas·surface·line·fg 등. CSS 의 hex 도 `var(--color-*)` 로. 검사 결과 남은 하드코딩 색 0, 브라우저에서 계산된 색 전수 조사에서도 토큰 밖 색 0(토큰의 투명도 변형만).
2. 에메랄드 제거: 첫 화면 '유튜브 트렌드' 에메랄드 → 실버 제목 속 흰색. 검색창 포커스 테두리·포커스 링 → 흰색. 글자 선택 영역 → 실버.
3. 로고 B: 테두리 상자 → 실버 판 #C6C6C6 위 검정 B. 'lab' #A1A1A1 → 실버.
4. 섹션 라벨 흰색 → 실버. 실적 숫자 뒤 + → 실버(70만+ · 1.7억회+ · 10억원+ · 7억+).
5. 대표 채널 이름 옆 ↗ (유튜브로 이동) → 유튜브 빨강.
6. 본문 #D4D4D4 → #C6C6C6, 보조 #A1A1A1 → #949494, 장식 #737373·#525252 → #7A7A7A.
7. 앱 체크박스 테두리 #525252(검정 위 2.69:1, WCAG 1.4.11 미달) → #7A7A7A(4.89:1, 선택 행 위 4.18:1).
8. 정렬 select 화살표: data URI 안 hex 대신 토큰 색으로 그리게(label `::after` 마스크).
9. 카카오 말풍선 `fill="#3A1D1D"` → `currentColor` + `text-kakao-icon`.

브라우저에서 확인한 상태: 검색창 기본 #404040 → 포커스 #FFFFFF, 키보드 포커스 링 흰 2px, 주 버튼 hover #E5E5E5 · 누름 #C6C6C6, 카드 hover 테두리 #525252, 선택 행 흰 막대 2px, 선택 체크박스 흰 면, 선택 스크립트 정상 동작.

---

## 6. 지금 사이트 코드에 적용할 때 바뀌는 곳

1. **`src/app/globals.css` `@theme`**: `--color-accent: #00e5a0` → `#ffffff`, `--color-accent-hover: #66ffcc` → `#e5e5e5`. 위 표의 새 토큰 추가(silver, fg-1~4, surface-2·3, line-*, positive·caution·negative, chart·heat, paper, kakao-icon). `:focus-visible` 은 이미 `var(--color-accent)` 라 자동으로 흰색. `::selection` 바탕은 `var(--color-silver)` 로. "에메랄드 2px" 주석도 고친다.
2. **에메랄드 하드코딩 27개 파일 75곳** (`grep -ri '00e5a0\|66ffcc\|0, 229, 160' src`):
   - `text-[#00E5A0]` 51곳 → 역할대로 `text-accent`(강조·현재 위치, 흰색) 또는 `text-silver`(라벨). `hover:text-[#66FFCC]` → 흰 글자면 `hover:text-fg-2`.
   - `bg-[#00E5A0]` 2곳(에메랄드 면) → 흰 주 버튼(`btn-primary`)이나 테두리 버튼. `bg-[#00E5A0]/10` 2곳 → 색 바탕을 지우고 `bg-surface-2`.
   - `border-[#00E5A0]` 계열 6곳 → 평소 `border-line-strong`, 선택 상태면 `border-accent`. `accent-[#00E5A0]` 3곳(체크박스) → `.chk` 모양 또는 `accent-[var(--color-accent)]`.
   - 많은 순: `studio/consulting/page.tsx` 14 · `layout.tsx` 6 · `incubating/page.tsx` 6 · `studio/class/[slug]/page.tsx` 5 · `pricing/_components/PricingCards.tsx` 4 · `insights/_components/InsightsList.tsx` 4 · `community/admin/_components/BoardManager.tsx` 4.
3. **로고**: `src/app/layout.tsx` 302~309행(헤더)·404~411행(푸터)의 B 상자 `bg-black border border-neutral-700` + 인라인 흰 글자 → `bg-silver` + 검정 B(인라인 style 삭제), `lab` 의 `text-neutral-400` → `text-silver`. 같은 모양이 `mypage/page.tsx`·`sign-in/_components/SignInForm.tsx` 에 있고, `admin/page.tsx` 는 `text-teal-400` lab.
4. **메인 메뉴**: `layout.tsx` 380·386·493행 에메랄드 글자(팀비블 컨설팅·채널 대행) → 흰 글자 + 굵게(F 의 is-strong).
5. **앱 기능 색**
   - `search/_components/VideoCard.tsx` `calcProbabilityLabel`: Great emerald-400 + 🔥 → positive 작은 면 배지(이모지 삭제), Good teal-400 → positive 테두리, Normal gray-400 → fg-3, Bad orange-400 → caution, Worst red-500 → negative. 확률 안내 모달 막대 orange·yellow·teal → positive·fg-2·fg-3. 선택 행 `bg-teal-950/20`·`accent-teal-500`·`hover:text-teal-400` → surface-2 + 흰 막대·`.chk`·`hover:text-fg`. 쇼츠 S(빨강)·롱폼 L(파랑) 배지 → 무채색 테두리 배지.
   - `search/_components/ViewTrendGraph.tsx` 점수 색 #f97316·#eab308·#14b8a6·#6b7280 → positive·#C6C6C6·#949494·#7A7A7A.
   - `my-channel/_components/ChannelDashboard.tsx`: 상승 green-400·하락 red-400 → positive·negative. 요일 히트맵 `rgba(0, 229, 160, x)` → heat-1~5 단계(1·2단계 흰 글자, 3단계부터 검정 글자).
   - `search/_components/KeywordInsights.tsx`: cyan·teal·sky·amber 그라데이션 버튼·패널과 `blur-3xl` 번짐 → 금지 패턴이라 무채색 테두리 버튼·패널로.
   - `components/Sparkline.tsx`(기본 #60A5FA)·`components/PerformanceBadge.tsx` 는 사용처가 없다 → 지우거나 chart-1·등급 토큰으로.
   - 앱 안에 남은 teal 304 · red 179 · amber/yellow/orange 177 · sky/blue 71 · green 51 클래스도 4번 규칙대로 정리(로드맵의 검색 화면 항목 등에 합친다).
6. **체크박스 테두리**: neutral-600(#525252)을 쓰는 곳 → line-control #7A7A7A.
7. **그대로 둬도 되는 것**: `bg-black`·`neutral-950/900/800/700` 은 그래파이트 값과 같아 그대로 보인다. 글자 `neutral-300/400` 은 토큰으로 옮길 때 #C6C6C6·#949494 로 조금 어두워진다.
8. **사진**: 실버 플레이 버튼은 무채색 보정판(`silver-play-button-neutral.jpg`)을 쓴다. 원본 `public/studio/silver-play-button.jpg` 는 청색기(#C5C7CA)가 있다.
9. 소유자가 M 을 고르면 저장소 `DESIGN.md` 와 테마 기록(에메랄드 현재값 줄)을 이 토큰으로 고친다.

---

## 7. 위험

1. **정체성이 약해 보일 위험**: 채도 있는 색이 없으면 흔한 다크 템플릿(Vercel·x.ai 류)처럼 보일 수 있다. 실버 판 로고·실버 라벨·진짜 실버 플레이 버튼 사진이 모든 화면에서 반복돼야 비블로 기억된다.
2. **강조가 약하다**: 핵심어 흰색과 실버 제목의 대비는 1.71:1. F 의 에메랄드보다 덜 눈에 띄고, 모바일 36px 에서는 더 은은하다. 행동 유도는 흰 주 버튼 하나에 기대야 한다.
3. **가장 튀는 색이 콘텐츠와 유튜브 빨강이 된다**: 홈에서 채도 있는 UI 색은 유튜브 ↗ 네 개뿐이라 작은 빨강이 오히려 눈에 띈다. 형광 초록 골프 썸네일 같은 콘텐츠 색이 화면을 압도할 수 있다(콘텐츠 우선이라는 장점이기도 하다).
4. **앱 기능 색이 튈 위험**: 나머지가 무채색이라 초록·노랑·연한 빨강이 강하게 보인다. 남용하면 결과 표가 시끄러워진다(글자·테두리만, 라벨 필수).
5. **유튜브 빨강과 오류 빨강의 혼동**: 밝기는 다르지만 둘 다 빨강 계열이다. '유튜브 = ↗·로고 모양, 오류 = 기호 + 문장' 규칙이 깨지면 섞인다.
6. **흰 바탕에서 실버가 사라진다**: #C6C6C6 은 흰 위 1.71:1. 흰 문서·인쇄에서는 실버를 글자로 못 쓴다(로고 C: 검정 판 + #6B6B6B lab).
7. **실버가 그냥 회색으로 보일 위험**: 금속 느낌은 사진이 낸다. 그라데이션·광택으로 금속을 흉내 내면 금지 패턴(AI스러움)에 걸린다.
8. **본문이 조금 어두워진다**: #D4D4D4 → #C6C6C6. 12.29:1 로 충분하지만, 밝기를 낮춘 휴대폰에서는 F 보다 흐리게 느낄 수 있다.
9. **다크 전용**: 라이트 테마가 생기면 실버 단계를 다시 정해야 한다.

---

## 8. 파일과 검증 도구

| 파일 | 내용 |
|---|---|
| `home.html` · `app.html` · `brand.html` | 화면 3개 (같은 토큰 블록) |
| `notes.md` | 이 문서 |
| `assets/` | F 자산의 시작 시점 사본 |
| `_orig/` | F 원본 사본(2026-10-07 12:24) |
| `_work/theme-m.css` | 토큰 원본 |
| `_work/build_m.py` | `_orig` → home·app, `brand.template` → brand 빌드 + 남은 하드코딩 색 검사 |
| `_work/gen_brand.py` | 대비를 계산해 견본·대비 표를 채운다(손으로 적은 숫자 없음) |
| `_work/colors_audit.py` | 브라우저에서 계산된 모든 색을 모아 토큰 밖 색을 찾는다 |
| `_work/contrast.py` | WCAG 상대 휘도 대비 계산 |
| `shots/it1` · `it2` · `it3` · `final` | 반복 캡처. it3 은 브랜드 시트만, final 은 세 화면 |

반복 기록
- it1: 토큰 변환 후 첫 캡처. 첫 화면 제목 변형 4개(실버 맥락·회색 맥락·두 톤·밑줄)를 비교해 '실버 맥락 + 흰 핵심어' 로 결정(회색 맥락은 '를'에서 문장이 끊겨 보이고, 밑줄은 링크처럼 읽힘).
- it2: 브랜드 시트의 자산 사진 잘림, 기능 색 견본의 큰 색 면, 모바일 표 가로 밀림을 고침.
- it3: flex 안에서 사진이 세로로 늘어나던 문제와 대비 표 구조(데스크톱 한 줄 표 · 모바일 두 줄 목록)를 고침.
- final: 최종 파일로 세 화면 전체. 가로 넘침 0, 콘솔 오류 0, 긴 하이픈 0, 그라데이션·글로우·블러·펄스·이모지 0.
