# bibllab.com 디자인 시스템 (DESIGN.md)

- 상태: **확정** (2026-10-07 소유자 확정, 2026-10-08 문서화)
- 레이아웃: **F** = 시안 C(크리에이터 브랜드, 순수 블랙)의 디자인 언어 + 시안 A 의 '유튜브 트렌드' 첫 화면. 첫 화면 인물 사진 없음.
- 색: **M 모노크롬 실버** = 블랙·그래파이트·실버·흰색. 채도 있는 강조색 없음. 에메랄드 `#00E5A0` 폐기.
- 우선순위(2026-10-08 비평 반영으로 나눔):
  - **레이아웃·구성·상호작용·클래스 값**(무엇이 어디에 몇 px 로 놓이고 누르면 무엇이 되는지)은 **시안 HTML(`home.html`·`app.html`)이 우선**이다. 이 문서의 레시피는 시안을 옮겨 적은 것이라, 둘이 다르면 시안을 실측해 따르고 이 문서를 고친다.
  - **토큰 값·금지 패턴·기능 색 규칙·접근성 기준·불변 조건**은 **이 문서가 우선**이다.
  - 이 문서가 시안과 **일부러 다르게** 정한 곳은 아래 목록뿐이다. 목록 밖의 차이는 문서 오류로 보고 시안을 따른다.

| 일부러 다른 곳 | 시안 | 이 문서·로드맵 | 근거 |
|---|---|---|---|
| 대행 링크 | 서비스 카드·네비 `/studio` | 결정 1 답 전까지 `/studio/consulting`(상담 신청). `/studio` 는 가드로 일반 방문자가 홈으로 튕긴다 | DECISIONS 결정 1 |
| 앱 도구 탭 '채널 분석' | 탭 4개(`/my-channel` 포함) | 결정 18 답 전까지 탭 3개(채널 분석 제외) | `/my-channel` 은 로그인·횟수 제한 없는 쿼터 소모 경로(6.3) |
| 소유자 예외 색 | 없음 | 3.4 의 자리에만 `owner-red`·`owner-yellow` | 소유자 직접 요청 |
| 메뉴 시트·드롭다운 | `<details>` | 클라이언트 컴포넌트(바깥 누르기·Esc·포커스 가두기) | 접근성(6.2) |
| 홈 예시 칩·검색창 제출 | 정적 폼 | 기존 `trySearch` 경유(바로 `/search` 금지) | 불변 조건 1(검색 누적) |
| 정책 문구 | '검색할 때마다 1회 차감 · 매월 1일 초기화' 등 시안 문장 | 실제 정책 문구 확인 후(다르면 실제 정책대로) | 결정 8 |
| 시안 속 숫자 | 10행·312.6만·1,284건 등 그림용 | 실제 데이터 값. '10행' 같은 그림용 숫자를 문구로 옮기지 않는다 | 7.2 |

| 참조 | 경로 |
|---|---|
| 최종 시안 홈 | `docs/ux-renewal/design-final/silver/home.html` |
| 최종 시안 앱(영상 찾기, 2개 선택 상태) | `docs/ux-renewal/design-final/silver/app.html` |
| 브랜드 시트(견본·대비 표·부품·차트·색약 검증·로고) | `docs/ux-renewal/design-final/silver/brand.html` |
| 토큰 원본 | `docs/ux-renewal/design-final/silver/_work/theme-final.css` |
| 시안 디자인 노트(이 문서의 바탕) | `docs/ux-renewal/design-final/silver/DESIGN-notes.md` |
| 팔레트 M 근거·위험 | `docs/ux-renewal/design-final/notes.md` (기능 색 값은 이 문서의 최종값이 우선) |
| 레이아웃 F 판단·실측 기록 | `docs/ux-renewal/design-final/layout-F/rationale.md` |
| 시안 빌드·검사 | `docs/ux-renewal/design-final/silver/_work/build_final.py`(`CLASS_MAP`), `_work/colors_audit.py`, `_work/contrast.py`, `_work/cvd.py` |
| 소유자 결정 목록 | `docs/ux-renewal/DECISIONS.md` |
| 테마 규칙 검사 스크립트 | `scripts/ux/check-theme.mjs` |

> 시안 HTML 은 Tailwind 브라우저 빌드(CDN)로 돌아가는 정적 파일이다. 이미지 경로가 작업용 임시 폴더를 가리키는 곳이 있어 사진이 안 보일 수 있다. 같은 사진은 `docs/ux-renewal/design-final/silver/assets/` 에 있다.

---

## 목차

1. 원칙과 금지 패턴
2. 색 토큰과 마이그레이션 매핑
3. 기능 색 · 외부 브랜드 색 · 소유자 예외
4. 타이포그래피
5. 간격 · 반경 · 테두리 · 그림자 · 폭 · 겹침
6. 컴포넌트 레시피
7. 페이지 레이아웃
8. 접근성 기준
9. 전환 단계안 (`--color-*: initial`)
10. 새 화면 점검표 (10.1 로그인 화면·운영 데이터 화면 검증)

---

## 1. 원칙과 금지 패턴

### 1.1 한 문장

**검정 바탕에 실버와 흰색만 써서 색 대신 밝기로 강조하고, 실버 판 로고·실버 라벨·실버 + ·실버 플레이 버튼 사진으로 비블을 알린다.**

### 1.2 세 가지 원칙

1. **흰색은 한 가지 뜻: 지금·핵심·행동.** 첫 화면 핵심어, 주 버튼, 현재 위치, 정렬 중인 열, 선택, 키보드 포커스. 흰색으로 '좋음'을 표시하지 않는다(선택과 헷갈린다).
2. **실버(#C6C6C6)는 비블의 재질.** 실버 플레이 버튼 판에서 뽑은 색. 본문 글자, 로고 B 판(한 단 밝은 #E3E3E3), 섹션 영문 라벨, 실적 숫자의 `+`, 01·02·03 단계 숫자, 첫 화면 제목의 문장 부분.
3. **채도 있는 색은 네 곳뿐.** ① 콘텐츠(썸네일·사진) ② 유튜브 표시(↗ hover·로고) ③ 카카오 버튼 ④ 앱의 기능 색(좋음·주의·나쁨). 여기에 3장의 소유자 예외가 더해진다.

깊이는 그림자가 아니라 **면 밝기 한 단 + 1px 선**으로 만든다: canvas `#000` → surface `#0a0a0a` → surface-2 `#171717` → surface-3 `#262626`.

### 1.3 금지 패턴 (소유자가 "AI스럽다"며 반복 제거를 요청한 것 포함)

| 금지 | 대신 | 검사 |
|---|---|---|
| 그라데이션(`bg-gradient-*`, `bg-linear-*`, `from-/via-/to-*`), 사진 위 그라데이션 막 | 단색 면, 사진 위 글자는 단색 반투명 막(`bg-canvas/70`~`/80`) | check-theme `gradient` ERROR |
| 글로우·번짐(`shadow-[0_0_…]`, `blur-*`, `backdrop-blur-*`), 장식 그림자 | 1px 선 + 면 밝기 | check-theme `glow` ERROR, `blur` 는 grep |
| 틸·시안(`teal-*`, `cyan-*`) | 역할대로 흰색(액센트)·positive(좋음)·무채색 | check-theme `cool-gray/teal` ERROR |
| 쿨그레이(`gray-*`, `slate-*`, `zinc-*`, `stone-*`), 청색기 있는 사진 | 그래파이트 토큰, 무채색 보정 사진 | 같은 규칙 |
| 펄스 점(`animate-ping`), 깜빡이는 장식 | 정적 글자 | `ping` ERROR. `animate-pulse` 는 로딩 스켈레톤만 |
| 아이콘 상자(색 면·원 안에 든 아이콘) | 맨 SVG 선 아이콘(`components/ui/icons.tsx`, 24 격자·선 2) | 눈으로 |
| 원형 숫자 배지(① 같은 원 안 숫자) | 글자 숫자 `01` `02` `03` + 위 가는 선 | 눈으로 |
| 이모지 아이콘(🔥 📊 ⚡ 등) | 맨 SVG 또는 글자 | grep |
| 화면 문구의 긴 하이픈 `—` | 쉼표, `·`, 줄바꿈 | `grep -rn '—' src/app --include='*.tsx'` (주석 제외 판단) |
| 에메랄드 `#00E5A0` · `#66FFCC` · `rgba(0,229,160,…)` | 2.4 의 에메랄드 대응표 | check-theme `accent-literal` WARN → 전환 뒤 ERROR |
| 알약(완전 원형 끝) CTA·칩·세그먼트 | 반경 8px(`rounded-control`) | 눈으로. 원형은 아바타·카카오 버튼만 |
| 색 채움 버튼(틸·초록·앰버 면) | 흰 주 버튼 하나 + 테두리 보조 버튼 | 눈으로 |
| 기능 색으로 넓은 면 칠하기(`bg-red-500/10` 상자 등) | 1px 선 상자 + 기호·제목만 기능 색. 면은 Great 작은 배지만 예외 | 눈으로 |
| 유튜브 빨강을 오류·할인·쇼츠 배지에 쓰기 | 오류는 negative, 쇼츠·롱폼 배지는 무채색 | 눈으로 |
| 실버를 광택·반사·금속 그라데이션으로 꾸미기 | 단색 실버. 금속 느낌은 진짜 실버 플레이 버튼 사진이 낸다 | 눈으로 |
| 모노 글꼴, 한글 제목 자간 −0.03em 초과 | Pretendard 하나, 자간 −0.02~−0.03em | 눈으로 |
| 한 화면에 흰 면 버튼 둘 이상 | 흰 면은 한 화면(한 폴드)에 하나, 나머지는 보조 버튼 | 눈으로 |

---

## 2. 색 토큰과 마이그레이션 매핑

### 2.1 토큰 표 (Tailwind v4 `@theme`, 값은 `theme-final.css` 그대로)

대비는 WCAG 상대 휘도 기준. "검정 위"는 canvas `#000` 위, 괄호는 surface-2 `#171717` 위.

#### 바탕·면 (그래파이트, 지금 neutral 값과 같은 단계)

| 토큰 | 값 | 역할 | 지금 코드 |
|---|---|---|---|
| `canvas` | `#000000` | 페이지·네비·푸터·메뉴 시트 바탕 (커뮤니티 이름 Business Black) | `bg-black` |
| `surface` | `#0a0a0a` | 카드·입력·검색창·미리보기 패널·드롭다운 | `bg-neutral-950` |
| `surface-2` | `#171717` | hover 면·선택 행·이미지 자리·대화상자·추천 카드 | `bg-neutral-900` |
| `surface-3` | `#262626` | 눌린 탭·세그먼트 선택·아바타 자리·미터 빈 칸 | `bg-neutral-800` |

#### 선

| 토큰 | 값 | 역할 | 검정 위 | 지금 코드 |
|---|---|---|---|---|
| `line` | `#262626` | 구역·카드·섹션 머리 테두리 | 1.39 | `border-neutral-800` |
| `line-soft` | `#171717` | 표 행·목록 구분 | 1.17 | `border/divide-neutral-900` |
| `line-strong` | `#404040` | 입력·보조 버튼·태그 테두리 | 2.03 | `border-neutral-700` |
| `line-hover` | `#525252` | 테두리 hover, 추천 카드 테두리 | 2.69 | `border-neutral-600` |
| `line-control` | `#7a7a7a` | 체크박스 테두리 (UI 구성요소 3:1 이상) | 4.89 (4.18) | `#525252`(2.69, 미달) |

#### 글자

| 토큰 | 값 | 역할 | 검정 위 | surface-2 위 | 지금 코드 |
|---|---|---|---|---|---|
| `fg` | `#ffffff` | 제목·숫자·주요 링크 | 21.00 | 17.93 | `text-white` |
| `fg-1` | `#e5e5e5` | 영상 제목 같은 읽을 거리 | 16.67 | 14.23 | `text-neutral-100/200` |
| `fg-2` | `#c6c6c6` | 본문 (실버 판) | 12.29 | 10.50 | `text-neutral-300` `#d4d4d4` |
| `fg-3` | `#949494` | 보조·캡션·placeholder·↗ 평소 | 6.92 | 5.91 | `text-neutral-400` `#a1a1a1` |
| `fg-4` | `#7a7a7a` | 장식 화살표·구분 기호. **작은 글자 하한** | 4.89 | 4.18 | `text-neutral-500/600` |

`fg-4` 는 surface-2·surface-3 위에서 4.5:1 아래로 떨어진다. 그 면 위의 읽는 글자는 `fg-3` 이상을 쓴다.

#### 액센트 (채도 0, 밝기 단계만)

| 토큰 | 값 | 역할 | 대비 |
|---|---|---|---|
| `accent` | `#ffffff` | 핵심어·주 버튼 면·현재 위치·정렬 열·선택(체크·왼쪽 막대)·포커스 링 | 검정 위 21.00 |
| `accent-hover` | `#e5e5e5` | 흰 버튼 hover | 검정 글자 16.67 |
| `accent-active` | `#c6c6c6` | 흰 버튼 누름(실버 판으로) | 검정 글자 12.29 |
| `accent-ink` | `#000000` | 흰·실버·기능 색 면 위 글자 | |
| `silver` | `#c6c6c6` | 섹션 영문 라벨, 'lab', 실적 `+`, 01·02·03, 첫 화면 제목 문장, `::selection` 바탕 | 검정 위 12.29 |
| `logo-plate` | `#e3e3e3` | 로고 B 판 (B 글자 대비 16.36) | |

실버와 흰색의 대비는 1.71:1 이다. 그래서 '실버 문장 속 흰 핵심어'는 은은한 강조이고, 행동 유도는 흰 주 버튼 하나가 맡는다.

#### 기능 색 (앱 전용, 언제나 글자 라벨·기호와 함께)

| 토큰 | 값 | 뜻 | 검정 위 (surface-2 위) |
|---|---|---|---|
| `positive` | `#5ee39a` | 좋음·성공·상승 ▲·Great/Good·경쟁 낮음 | 12.93 (11.04) |
| `caution` | `#f5b73b` | 주의·경고·Bad·남은 횟수 5회 이하·경쟁 보통 | 11.72 (10.00) |
| `negative` | `#fa5570` | 나쁨·오류·하락 ▼·Worst·경쟁 높음·남은 횟수 0 | 6.60 (5.63) |
| `competition-low` / `-mid` / `-high` | positive / caution / negative 별칭 | 키워드 경쟁도 0~35 / 36~65 / 66~100 | |

색약 검증(Machado 2009 강도 1.0, CIEDE2000, `_work/cvd.py`): positive↔negative 녹색약 ΔE 11.8 · 적색약 29.6, positive↔caution 15.5 · 13.2, caution↔negative 17.4 · 30.6. 그래도 색은 보조 수단이다(3장).

> `notes.md` 의 초기 M 값(positive `#3DD68C`, negative `#FF7B72`, 로고 판 `#C6C6C6`)은 최종안에서 바뀌었다. 위 표가 최종이다.

#### 차트·히트맵

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `chart-1` | `#ffffff` | 주 계열 (선 2px) |
| `chart-2` | `#949494` | 비교 계열 (점선) |
| `chart-3` | `#525252` | 배경 막대·Normal 막대 |
| `chart-grid` | `#262626` | 눈금선 |
| `heat-1` ~ `heat-5` | `#1f1f1f` `#474747` `#7a7a7a` `#b0b0b0` `#ededed` | 히트맵 5단계. 1·2단계는 흰 글자(16.48·9.29), 3단계부터 검정 글자(4.89·9.68·17.94) |

#### 흰 바탕 문서·외부 브랜드

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `paper` / `paper-ink` / `paper-muted` | `#ffffff` / `#000000` / `#6b6b6b` | 흰 종이·인쇄·흰 배경 이미지 위 로고(lab 은 muted, 흰 위 5.33) |
| `youtube` | `#ff0000` | 유튜브 로고, 유튜브로 나가는 ↗ 의 hover·포커스 때만 (검정 위 5.25) |
| `kakao` / `kakao-hover` / `kakao-ink` / `kakao-icon` | `#fee500` / `#fdd835` / `#191919` / `#3a1d1d` | 카카오 버튼만 (글자 13.75, 말풍선 11.96) |

### 2.2 `@theme` 블록

C18b(2026-10-10)부터 `--color-*: initial;` 을 켠 상태다(9.3·9.4). `globals.css` 의 첫 `@theme` 는 이 줄 뒤에 `theme-final.css` 의 아래 토큰과 `--font-mono`·`--text-label-en` 을 두고, 기본 팔레트 중 허용 목록 화면이 쓰는 색은 바로 다음 `@theme`(허용 목록 재선언, 쿨그레이 안전망 포함)에 값 그대로 다시 선언한다(9.4). `--color-surface-raised`(`#1f1f1f`)는 부품을 옮긴 뒤 지운다.

```css
@theme {
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;

  --color-*: initial;  /* 9장 단계 3b(C18b)에서 켰다. 색 선언보다 앞에 둔다 */

  --color-canvas: #000000;
  --color-surface: #0a0a0a;
  --color-surface-2: #171717;
  --color-surface-3: #262626;

  --color-line: #262626;
  --color-line-soft: #171717;
  --color-line-strong: #404040;
  --color-line-hover: #525252;
  --color-line-control: #7a7a7a;

  --color-fg: #ffffff;
  --color-fg-1: #e5e5e5;
  --color-fg-2: #c6c6c6;
  --color-fg-3: #949494;
  --color-fg-4: #7a7a7a;

  --color-accent: #ffffff;          /* 지금 #00e5a0 → 흰색 */
  --color-accent-hover: #e5e5e5;    /* 지금 #66ffcc */
  --color-accent-active: #c6c6c6;
  --color-accent-ink: #000000;
  --color-silver: #c6c6c6;
  --color-logo-plate: #e3e3e3;

  --color-positive: #5ee39a;
  --color-caution: #f5b73b;
  --color-negative: #fa5570;
  --color-competition-low: var(--color-positive);
  --color-competition-mid: var(--color-caution);
  --color-competition-high: var(--color-negative);

  --color-chart-1: #ffffff;
  --color-chart-2: #949494;
  --color-chart-3: #525252;
  --color-chart-grid: #262626;
  --color-heat-1: #1f1f1f;
  --color-heat-2: #474747;
  --color-heat-3: #7a7a7a;
  --color-heat-4: #b0b0b0;
  --color-heat-5: #ededed;

  --color-paper: #ffffff;
  --color-paper-ink: #000000;
  --color-paper-muted: #6b6b6b;

  --color-youtube: #ff0000;
  --color-kakao: #fee500;
  --color-kakao-hover: #fdd835;
  --color-kakao-ink: #191919;
  --color-kakao-icon: #3a1d1d;

  /* 소유자 예외(3.4). 기본 팔레트를 비운 뒤에도 남겨야 해서 토큰으로 둔다 */
  --color-owner-red: #e5484d;       /* /studio 강조·커뮤니티 N 배지 */
  --color-owner-yellow: #facc15;    /* 커뮤니티 사이드바 '유튜브 인큐베이팅 지원하세요!' (지금 yellow-400 값) */

  /* 글자 단계·반경·폭은 4·5장 */
}
```

`globals.css` 의 base 레이어에서 바꿀 것: `::selection` 바탕 `var(--color-accent)` → `var(--color-silver)`, 글자 `#000` → `var(--color-accent-ink)`. `:focus-visible` 은 이미 `var(--color-accent)` 라 토큰만 바꾸면 흰 링이 된다("에메랄드 2px" 주석도 고친다). `html` 바탕 `#000`·글자 `#fff` 는 `var(--color-canvas)`·`var(--color-fg)` 로.

### 2.3 클래스 대응표 (기계적 1단계)

**적용 규칙**
- 모든 변형 접두사(`hover:` `focus:` `focus-visible:` `group-hover:` `aria-*:` `md:` 등)에 똑같이 적용한다. 투명도 접미사는 그대로 옮긴다(`bg-neutral-800/50` → `bg-surface-3/50`).
- 쿨그레이(`gray` `slate` `zinc` `stone`)는 `globals.css` 안전망이 이미 neutral 과 같은 값으로 그리므로 **같은 단계의 neutral 행을 그대로 따른다**.
- 이 표의 대응은 "보이는 값이 같거나 한 단 차이"다. 바꾼 뒤 화면이 거의 그대로여야 정상이고, 바뀌는 곳은 표의 '보이는 변화' 열뿐이다.
- 경계 정규식: `(?<![\w-])<클래스>(?![\w-])`(투명도 붙은 형태는 따로). 시안 빌드의 `CLASS_MAP`(`_work/build_final.py` 81행)과 같은 방식이다.

#### 면

| 지금 | 새 토큰 | 보이는 변화 |
|---|---|---|
| `bg-black` | `bg-canvas` | 없음 |
| `bg-black/α` (사진 위 막, 배경 막) | `bg-canvas/α` | 없음 |
| `bg-neutral-950` | `bg-surface` | 없음 |
| `bg-neutral-900` | `bg-surface-2` | 없음 (카드라면 2단계에서 `bg-surface` 로 낮춘다, 6.7) |
| `bg-neutral-800` | `bg-surface-3` | 없음 |
| `bg-neutral-700` (막대·토글 바탕), `hover:bg-neutral-700` | `bg-line-strong`, `hover:bg-line-strong` | 없음 |
| `bg-neutral-600` | `bg-line-hover` | 없음 |
| `bg-neutral-300`, `active:bg-neutral-300` (흰 버튼 누름) | `bg-accent-active` | `#d4d4d4` → `#c6c6c6` |
| `hover:bg-neutral-200` (흰 버튼 hover, 43곳) | `hover:bg-accent-hover` | 없음 |
| `bg-neutral-100` | `bg-fg-1` | 없음 |
| `bg-white` (주 버튼·흰 면) | `bg-accent` | 없음 |
| `bg-surface-raised` (`#1f1f1f`, R04 카드) | `bg-surface-2` | 한 단 어두워짐 |

#### 글자

| 지금 | 새 토큰 | 보이는 변화 |
|---|---|---|
| `text-white` | `text-fg` | 없음. 현재 위치·정렬·핵심어 자리라면 `text-accent` 로(값은 같고 뜻이 다르다) |
| `text-neutral-100`, `text-neutral-200` | `text-fg-1` | 200 은 없음, 100 은 한 단 어두움 |
| `text-neutral-300` | `text-fg-2` | `#d4d4d4` → `#c6c6c6` 조금 어두움 |
| `text-neutral-400` | `text-fg-3` | `#a1a1a1` → `#949494` 조금 어두움 |
| `text-neutral-500` | `text-fg-4` | `#737373`(4.43, 미달) → `#7a7a7a`(4.89) 조금 밝아짐 |
| `text-neutral-600` | `text-fg-4` | `#525252` → `#7a7a7a` 밝아짐. 정보 글자면 2단계에서 `text-fg-3` |
| `text-neutral-700/800/900` | 검정 위: `text-fg-4`(장식이면 `aria-hidden`) · 흰 면 위: `text-accent-ink` | 대비 보정 |
| `text-black` | `text-accent-ink` | 없음 |
| `placeholder-neutral-500/600`, `placeholder:text-neutral-*` | `placeholder:text-fg-3` | placeholder 대비 6.53 이상 (rationale 비평 반영) |
| `decoration-neutral-600` | `decoration-fg-4` | 조금 밝아짐 |

#### 선

| 지금 | 새 토큰 | 보이는 변화 |
|---|---|---|
| `border-neutral-900`, `divide-neutral-900` | `border-line-soft`, `divide-line-soft` | 없음 |
| `border-neutral-800`, `divide-neutral-800`, `border-t-neutral-800` | `border-line` (`divide-line`, `border-t-line`) | 없음 |
| `border-neutral-700`, `ring-neutral-700` | `border-line-strong`, `ring-line-strong` | 없음 |
| `border-neutral-600` | `border-line-hover` | 없음 |
| `border-neutral-500`, `hover:border-neutral-500`, `ring-neutral-500` | `border-line-control` 등 | `#737373` → `#7a7a7a` |
| `focus:border-neutral-400`, `focus-within:border-neutral-400` (입력 포커스, 16곳) | `focus:border-accent`, `focus-within:border-accent` | 회색 → 흰 테두리 (확정 규칙) |
| `border-neutral-400` (그 밖) | `border-fg-3` | 조금 어두움 |
| `border-neutral-300` | `border-fg-2` | 조금 어두움 |
| `border-white` (선택 표시) | `border-accent` | 없음 |

#### 흰색·검정 투명도 (검정 위에서 실제로 보이는 값 기준)

| 지금 | 새 토큰 | 근거 |
|---|---|---|
| `bg-white/[0.015]` ~ `bg-white/[0.06]` | `bg-surface` | 검정 위 `#040404`~`#0f0f0f` ≈ `#0a0a0a` |
| `bg-white/[0.08]` ~ `bg-white/[0.10]`, `hover:bg-white/[0.10]` | `bg-surface-2` | `#141414`~`#1a1a1a` ≈ `#171717` |
| `bg-white/[0.12]` 이상 | `bg-surface-3` | `#1f1f1f` 이상 ≈ `#262626` |
| `bg-white/95` 등 거의 불투명 | `bg-accent` | 흰 면 |
| `border-white/[0.03]` ~ `[0.10]`, `divide-white/α` | `border-line-soft` | `#080808`~`#1a1a1a` |
| `border-white/[0.12]` ~ `[0.20]` | `border-line` | `#1f1f1f`~`#333333` |
| `text-white/α` | 0.9 이상 `text-fg-1` · 0.7~0.8 `text-fg-2` · 0.5~0.6 `text-fg-3` · 그 아래 `text-fg-4` | 반투명 글자 금지(대비 계산 불가) |
| `accent-white` (체크박스) | 체크박스 레시피 `.chk` (6.10) | 테두리 3:1 확보 |
| `shadow-black/α`, `shadow-*` | **삭제** | 그림자 없음 |
| `from-black/α` `via-black/α` `to-black` | **삭제** → 사진 위 글자는 `bg-canvas/70`~`/80` 단색 막 | 그라데이션 금지 |

> 투명도 클래스는 바탕이 검정이 아닌 곳(카드 안)에서는 다른 값으로 보인다. 위 표대로 바꾼 뒤 그 화면을 1440·390 캡처로 확인한다. 반투명 면은 겹칠 때 밝기가 계산되지 않아, 불투명 토큰이 원칙이다.

### 2.4 에메랄드 하드코딩 대응표 (27개 파일 75곳, 2026-10-08 grep)

`grep -rnE '#00[eE]5[aA]0|#66[fF][fF][cC][cC]|0, ?229, ?160' src`

| 지금 | 곳 | 새 토큰 | 판단 기준 |
|---|---|---|---|
| `text-[#00E5A0]` | 51 | `text-accent` 또는 `text-silver` | 강조·현재 위치·핵심어 = accent(흰). 라벨·눈썹 문구·단계 숫자 = silver |
| `hover:text-[#66FFCC]` | 7 | 흰 글자 링크면 `hover:text-fg-2`, 회색 글자면 `hover:text-fg` | |
| `bg-[#00E5A0]` (면 버튼) | 2 | 주 버튼 레시피(흰) 또는 보조 버튼 | 한 화면 흰 면 하나 |
| `bg-[#00E5A0]/10` | 2 | `bg-surface-2` (색 바탕 지움) | |
| `border-[#00E5A0]`, `/30`, `/40` | 6 | 평소 `border-line-strong`, 선택 상태면 `border-accent` | |
| `accent-[#00E5A0]` (체크박스) | 3 | `.chk` | |
| `rgba(0, 229, 160, x)` (요일 히트맵) | 1 | `heat-1`~`heat-5` 단계 + 글자색 규칙 | |
| CSS 의 `#00e5a0` | 2 | `var(--color-accent)` | `globals.css` 토큰 정의는 값만 교체 |

많은 순: `studio/consulting/page.tsx` 14 · `layout.tsx` 6 · `incubating/page.tsx` 6 · `studio/class/[slug]/page.tsx` 5 · `pricing/_components/PricingCards.tsx` 4 · `insights/_components/InsightsList.tsx` 4 · `community/admin/_components/BoardManager.tsx` 4.

`insights/_components/` 두 파일 처리(옮기지 않는다):
- `InsightsList.tsx`(에메랄드 3곳): 사용처 0(`/insights`·`/insights/[slug]` 는 커뮤니티 칼럼으로 리다이렉트만 한다). C18a 에서 `grep -rn InsightsList src` 0 을 다시 확인한 뒤 **삭제**한다. 위 '4'는 grep 시점 집계라 이 삭제로 사라진다.
- `PostRenderer.tsx`(에메랄드 1곳): `insights/admin/_components/PostEditor.tsx` 미리보기에서만 쓴다. 관리자 전용이라 **3.3 허용 목록에 경로 예외로 넣는다**(구 테마 유지, 에메랄드 1곳만 `accent` 로 이름 교체는 해도 되고 안 해도 된다).

### 2.5 채도 있는 Tailwind 색 대응표 (2단계, 역할 판단 필요)

| 지금 | 곳 | 새 토큰 |
|---|---|---|
| `green-*`, `emerald-*` (성공·상승) | 51 · 11 | `positive` (글자·테두리·기호) |
| `teal-*` | 304 | 역할대로: 채움 버튼 → 주/보조 버튼, 활성·선택 → `accent`, 성공·낮음 → `positive`, 장식 → 무채색 |
| `cyan-*` | 6 | 삭제(KeywordInsights 그라데이션) → 무채색 테두리 패널 |
| `red-400/500` (오류·하락·삭제) | 179 | `negative`. 유튜브 표시면 `youtube`. 소유자 예외(3.4)는 `owner-red` |
| `amber-*`, `yellow-*`, `orange-*` (경고·별점) | 177 | `caution`. 커뮤니티 사이드바 노란 강조만 `owner-yellow`(3.4) |
| `sky-*`, `blue-*`, `indigo-*` (안내·링크·차트) | 75 | 안내 = `fg-2` + 기호(파랑 없음), 차트 = `chart-1`, 링크 = `fg` + 밑줄 |
| `purple/violet/pink/rose/fuchsia/lime-*` | 58 | 관리자 화면 범주색은 예외(3.3), 그 밖은 무채색 |
| `bg-<기능색>-500/10` 같은 색 면 상자 | | `border border-<기능>/55 bg-surface` + 기호·제목만 기능 색 (6.13 상태 메시지) |

---

## 3. 기능 색 · 외부 브랜드 색 · 소유자 예외

### 3.1 기능 색 규칙 (앱 안에서만)

- **색만으로 말하지 않는다.** 등급은 Great·Good·Normal·Bad·Worst 라벨, 배수는 ▲(2배 이상)·없음(0.5~2배)·▼(0.5배 미만) 기호, 경쟁도는 미터 칸 수(1·2·3)와 '경쟁 낮음/보통/높음' 글자를 언제나 함께 쓴다.
- **글자·테두리·기호에만.** 면 채움은 Great 작은 배지 하나(positive 면 + 검정 글자 12.93)뿐이다.
- **흰색은 좋음이 아니다.** 흰색은 선택·현재 위치 뜻이라 평가에 쓰지 않는다.
- **등급 기준**(조회수 ÷ 채널 평균, 지금 `VideoCard` 기준값 그대로): Great 5배 이상 · Good 2배 이상 · Normal 0.5배 이상 · Bad 0.1배 이상 · Worst 0.1배 미만.
- **알고리즘 점수**(높을수록 좋음): 70 이상 `positive` · 50~69 `fg-2` · 30~49 `fg-3` · 30 미만 `fg-4`. 흰색 쓰지 않음.
- **경쟁도**: 낮음 0~35 `competition-low` · 보통 36~65 `competition-mid` · 높음 66~100 `competition-high`. 원형 링·색 면 배경 대신 막대 미터(6.14).
- **남은 횟수**: 평소 `fg-2` 1px `line` 배지 → 5회 이하 `caution` → 0회 `negative`. 흰색 아님. 자리는 네비 한 곳.
- **상승·하락**: `positive` + ▲ / `negative` + ▼.
- **차트**: 주 계열 `chart-1` 2px, 비교 `chart-2` 점선, 배경 막대 `chart-3`, 눈금 `chart-grid`. 선 아래 칠하기 없음. 평가가 있는 값(점수·등급)만 기능 색.
- **히트맵**: 양(평가 없음)은 `heat-1`~`heat-5` 무채색. 1·2단계 흰 글자, 3단계부터 `accent-ink`.
- **파생 지표(YouTube 정책)**: 알고리즘 확률·경쟁도·조회수 합계는 위치·문구·노출 조건을 바꾸지 않고 스타일만 이 규칙으로 바꾼다.

### 3.2 외부 브랜드 색

| 브랜드 | 쓰는 곳 | 규칙 |
|---|---|---|
| 유튜브 `youtube` `#ff0000` | 유튜브 로고, 유튜브로 나가는 ↗ | ↗ 는 평소 `fg-3`, `a:hover`·`a:focus-visible` 때만 빨강(6.4 `.ext`). 오류·할인·쇼츠 배지에 쓰지 않는다. 빨간 면에 흰 작은 글자 금지(4.0:1) |
| 카카오 `kakao` `#fee500` | 상담 플로팅 버튼, 카카오 로그인·공유·문의 버튼 | 면 `bg-kakao` + 글자 `text-kakao-ink`, hover `bg-kakao-hover`, 말풍선 `text-kakao-icon`(`fill="currentColor"`). 노란 면은 카카오 버튼에만 |
| 구글 | 로그인 'Google로 계속하기' | 구글 가이드대로 흰 면(`bg-accent text-accent-ink hover:bg-accent-hover`, 값은 `#fff`) + 4색 G 로고. 로고 SVG 의 `#4285F4` `#34A853` `#FBBC05` `#EA4335` 는 브랜드 자산이라 하드코딩 예외. 이 화면의 흰 면은 구글 버튼이 차지하므로 다른 흰 버튼을 두지 않는다 |
| 네이버 | 네이버 로그인·네이버페이 버튼이 생길 때만 | `#03C75A` 면 + 흰 글자(네이버 가이드). 쓸 때 `--color-naver` 토큰을 추가한다. 관리자 유입 통계의 '네이버' 범주는 3.3 |

### 3.3 관리자 화면 예외

- 관리자 화면(`src/app/admin/**`, `src/app/insights/admin/**`, `src/app/community/admin/**`, 그리고 관리자 미리보기 전용 부품 `src/app/insights/_components/PostRenderer.tsx`)은 **구 테마 그대로** 둔다. 범주 구분용 색(플랜·유입 소스별 색 + 범례)뿐 아니라 그 화면의 흰·검정·neutral·채도 색 클래스 전부가 예외다(ux-rules 832행 "관리자 화면만 예외"). 기본 팔레트를 비운 뒤에도 깨지지 않도록 C18b 에서 이 화면이 쓰는 색을 `initial` 뒤에 값 그대로 다시 선언했다(9.4). 이 화면에서 새 색 단계를 쓰면 9.4 블록에 더한다.
- 관리자 로고(`admin/page.tsx` 의 'teal lab')는 **바꾸지 않는다**(관리자 구 테마 유지 원칙). 6.1 의 `Logo` 교체 대상은 사용자 화면 4곳뿐이다.
- `src/app/tmklab-site/`(tmklab.com 별도 브랜드, middleware rewrite)는 **이 디자인 시스템 범위 밖**이다. Tailwind 색 클래스가 아니라 자체 `<style>`(`--teal` 등 자체 CSS 변수)으로 그려서 기본 팔레트를 비워도 영향이 없다(2026-10-08 확인: 색 클래스 0). 허용 목록에 넣고, 9.3 단계 3b 캡처 비교에만 포함한다. 정리 여부는 결정 14.
- 쿨그레이 안전망(`globals.css` 의 gray·slate·zinc → 무채색 재정의)은 관리자 화면 때문에 전환 뒤에도 남긴다(9장).
- 관리자 화면의 상승·하락(`MenuTrafficDashboard.tsx` 125행 `#00E5A0`/`#E5484D`)은 범주색이 아니라 평가라 `positive`/`negative` 로 옮긴다.

### 3.4 소유자 예외 (직접 요청한 것은 기본 유지)

로드맵 v2 원칙 "소유자가 직접 만든 것은 기본 유지"와 `DECISIONS.md` 의 기본 동작(답이 없으면 유지)에 따라 아래는 확정 팔레트 밖이어도 **바꾸지 않는다**. 이 결정들은 에메랄드 시절에 정리됐고, M 확정(2026-10-07) 때 다시 묻지 않았다. 바꾸려면 소유자에게 먼저 묻는다(질문할 때 선택지 A 는 이제 '에메랄드'가 아니라 '흰 글자·실버').

| 예외 | 위치 | 근거 | 규칙 |
|---|---|---|---|
| 커뮤니티 사이드바 노란 강조 "유튜브 인큐베이팅 지원하세요!" | `community/_components/CommunitySidebar.tsx` 125행 `text-yellow-400` | 8/30 소유자 요청(bdb074a), 결정 E 기본 B | 색 유지. 전환 때 `text-owner-yellow` 로 이름만 바꾼다(값 `#facc15` 그대로, 검정 위 13.71) |
| 커뮤니티 빨간 원형 N 배지(새 글) | 같은 파일 `NewBadge` 31~39행 `bg-[#E5484D]`, `CategoryChips.tsx` 46행 | 8/30 소유자 요청(6df0c2d '카페 원본 스타일'), 결정 E 기본 B | 모양·색 유지(원형 배지 금지의 유일한 예외). **접근성 보정만**: 지금 8px 흰 글자(빨강 위 3.91:1)를 12px 이상으로, 또는 글자를 `aria-hidden` 하고 `sr-only` "새 글". 색은 `bg-owner-red` |
| `/studio` 빨간 강조 `#E5484D` (10곳, '70만+' 등) | `studio/page.tsx` | 8/14 소유자 직접 적용(67c2c4e·d18a88c), 결정 7 기본 B | 유지, `text-owner-red` 로 이름만. M 에서 빨강은 유튜브 몫이라 섞일 위험이 있다(notes.md 위험 5). /studio 를 F 언어로 옮기는 항목에서 소유자에게 한 번 더 묻는다 |
| `/studio` '이번달 신규 대행 마감임박' 빨간 글자 | `studio/page.tsx` 945행 | 결정 6 기본 B | 문구·색 유지(위와 같은 `owner-red`) |
| 요금제 Pro 카드의 흰 "추천" 배지 | `pricing/_components/PricingCards.tsx` | 결정 G 기본 B | 유지. M 에서는 흰 면 배지가 원래 규칙(6.12 solid)이라 충돌 없음. 테두리·면만 레시피로 |
| 컨설팅 '20명 · 3개월 대기' 문구 | 컨설팅 상세 | 결정 6 | 문구 유지(색 규칙과 무관) |

예외 색은 위 표의 자리에서만 쓴다. 새 화면에 `owner-red`·`owner-yellow` 를 쓰지 않는다.

---

## 4. 타이포그래피

### 4.1 글꼴: Pretendard Variable 자체 호스팅

- 파일: `public/fonts/pretendard/` = `pretendardvariable-dynamic-subset.css` + `woff2-dynamic-subset/` 92개(합계 약 2.8MB, 디스크 3.1MB) + `LICENSE.txt`(SIL OFL 1.1). pretendard@1.3.9, `font-weight: 45 920`, `font-display: swap`, `unicode-range` 로 나뉘어 방문자는 페이지에 필요한 조각만 받는다. 소유자 승인 2026-10-07, 커밋 a3ed70b.
- **연결 상태(2026-10-08): 아직 연결 안 됨.** `src/app/layout.tsx` 가 `next/font/google` 의 `Inter` 를 불러 `<body className={inter.className}>` 로 덮고 있어, `--font-sans` 의 Pretendard 가 쓰이지 않는다(한글은 OS 글꼴로 보임).
- 연결 방법(구현 항목에서):
  1. `layout.tsx` `<head>` 에 `<link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css" />`.
  2. `Inter` import 와 `inter.className` 을 지운다. body 는 Tailwind 기본(`html` 의 `--font-sans`)을 따른다.
  3. 레이아웃 이동 확인: 1440·390 캡처 전후 비교, 네비 높이·버튼 줄바꿈.
- 모노 글꼴 쓰지 않는다(`--font-mono` 는 코드 표시용으로만 남김). 로고 B 도 사이트 글꼴(인라인 `fontFamily: "sans-serif"` 금지).

### 4.2 크기 단계 (토큰 하나가 크기·행간·자간·굵기를 함께 정한다)

| 토큰 | 크기 | 행간 | 자간 | 굵기 | 쓰는 곳 |
|---|---|---|---|---|---|
| `text-display` | 60px | 1.15 | −0.03em | 800 | 1280 이상 첫 화면 제목 |
| `text-h1` | 48px | 1.2 | −0.025em | 800 | 섹션 제목(데스크톱), 첫 화면 제목 1024 |
| `text-h2` | 36px | 1.25 | −0.02em | 800 | 첫 화면 제목 모바일 |
| `text-h3` | 28px | 1.3 | −0.02em | 800 | 섹션 제목 모바일 |
| `text-title` (신규) | 24px | 1.3 | −0.02em | 800 | 카드 제목 |
| `text-h4` | 20px | 1.4 | −0.01em | 700 | 가격·앱 결과 제목·작은 지표 |
| `text-lead` | 18px | 1.7 | −0.005em | | 리드 문장·모바일 메뉴 행 |
| `text-body` | 16px | 1.75 | | | 본문 |
| `text-ui` (신규) | 15px | 1.6 | | | 버튼·카드 설명 |
| `text-body-sm` | 14px | 1.7 | | | 표·보조 본문·네비 |
| `text-caption` | 13px | 1.5 | | 500 | 캡션·라벨·메타 |
| `text-micro` | 12px | 1.5 | | 500 | 배지·표 머리·법적 고지. **최소 글자** |
| `text-label-en` (유지, 섹션 머리에는 쓰지 않음) | 14px | 1 | 0.25em | 900 | 기존 화면의 영문 라벨 자리만 |

지금 `globals.css` 와 다른 점: 제목 단계 굵기 **900 → 800**(900 은 −0.025em 자간에서 획이 뭉친다, rationale 9-1), `text-title`·`text-ui` 추가.

**섹션 머리 영문 라벨은 `text-label-en` 을 쓰지 않는다.** 시안(`home.html` `.sec-head__label`)은 14px/20px → md 16px/24px, 900, 0.25em 이라 14px·행간 1 고정 토큰과 다르다. `section-header.tsx` 는 6.4 의 클래스(`text-sm font-black leading-5 tracking-[0.25em] text-silver md:text-base md:leading-6`)를 그대로 쓴다(C01).

특수 숫자(토큰 밖 임의값 허용, 이 표의 값만):

| 자리 | 크기 (모바일 / sm / lg / xl) | 굵기·행간·자간 |
|---|---|---|
| 첫 화면 제목 | `text-h2` / `sm:text-[44px]` / `lg:text-h1` / `xl:text-display` | 800 |
| 실적 열 숫자(70만+ 등) | 22 / 30 / 32 / 40px | 800 · 1 · −0.03em |
| 채널 구독자 | 28 / 28 / 36px | 800 · 1 · −0.03em |
| 큰 지표(7억+) | 44 / 48 / 48 / 56px | 800 · 1 · −0.035em |
| 마지막 CTA 제목 | `text-h3` / `sm:text-[40px]` / `lg:text-h1` / `xl:text-[56px]` | 800 · 1.15~1.2 |
| 앱 결과 표 조회수(정렬 기준) | 홈 16 · 앱 18px | 800 · −0.01em |

### 4.3 굵기

| 굵기 | 클래스 | 쓰는 곳 |
|---|---|---|
| 900 | `font-black` | 로고 B, 섹션 영문 라벨만 |
| 800 | `font-extrabold` (제목 토큰 기본) | 제목, 큰 숫자, 가격 |
| 700 | `font-bold` | 주 버튼, 카드 소제목, 기능 색 라벨 |
| 600 | `font-semibold` | 보조 버튼, 현재 위치, 링크 글자 |
| 500 | `font-medium` | 네비 평소, 칩, 캡션·배지 |
| 400 | (기본) | 본문 |

### 4.4 한글 줄바꿈·숫자

- `html { word-break: keep-all; overflow-wrap: break-word; }` (이미 적용). 사용자 글·긴 URL 은 `wrap-anywhere`.
- 제목 `text-wrap-style: balance`, 문단 `pretty` (이미 적용, 축약형 `text-wrap` 대신 롱핸드).
- 붙어 다녀야 하는 어절·항목은 `whitespace-nowrap` 스팬으로 묶는다(예: 사업자 정보 항목, '매주 1:1 미팅').
- 가운뎃점 나열은 앞뒤에 U+2060(WORD JOINER)을 넣어 `·` 에서 줄이 갈리지 않게 한다(`조회수⁠·⁠구독자`). 시안 HTML 이 이 방식이다.
- 숫자는 `tnum`(`font-variant-numeric: tabular-nums`, Tailwind `tabular-nums`)으로 자리를 맞춘다. 표·실적·가격·남은 횟수.
- 두 톤 제목은 두 가지만: ① 첫 화면 = 문장 `silver` + 핵심어 `accent`. ② 두 줄 섹션 제목 = 앞줄 `fg-3` + 뒷줄 `fg`. 한 제목에 세 톤 금지.

---

## 5. 간격 · 반경 · 테두리 · 그림자 · 폭 · 겹침

### 5.1 간격 (Tailwind 4px 단위)

| 자리 | 값 |
|---|---|
| 좌우 거터 | 24px(`px-6`) 모바일 · 32px(`lg:px-8`) 1024 이상 |
| 구역 세로 | `py-16 md:py-24` (64/96px), 구역 사이 `border-b border-line` |
| 첫 화면 | `pt-8 sm:pt-12 lg:pt-14`, `pb-16 lg:pb-24`. 제목 → 설명 12~20px, 검색창 위 24~32px, 미리보기 위 28~40px, 3단계 위 40~48px |
| 섹션 머리 → 제목 | `mb-10 md:mb-12` (40/48px) |
| 제목 → 본문 묶음 | `mt-12 md:mt-16` |
| 카드 안쪽 | `p-5 sm:p-6 lg:p-8` (20/24/32px) |
| 카드 사이 | `gap-4 lg:gap-6` (16/24px), 12열 그리드 간격 24px |
| 푸터 아래 | 모바일 `pb-28`(카카오 버튼 자리) |

### 5.2 반경

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `rounded-control` | 8px | 버튼·입력·칩·세그먼트·썸네일 |
| `rounded-card` | 12px | 검색창·앱 카드·드롭다운·토스트 |
| `rounded-panel` | 16px | 마케팅 카드·미리보기 패널·사진·대화상자 |
| `rounded-md` (6px) | | 태그·세그먼트 항목·썸네일 길이 표시 |
| `rounded` (4px) | | Pro 태그·체크박스 |
| `rounded-full` | | 아바타·카카오 플로팅 버튼·소유자 예외 N 배지만 |

### 5.3 테두리

- 기본 1px. 체크박스 1.5px. 현재 탭 밑줄·선택 행 왼쪽 막대 2px(`accent`). 포커스 링 2px.
- Tailwind v4 의 `border` 는 색을 안 주면 `currentColor`(흰색)다. **`border` 에는 언제나 선 토큰을 함께 쓴다**(9장의 위험과 연결).
- 세로 구분선: `h-4 w-px bg-line`.

### 5.4 그림자

**쓰지 않는다.** `shadow-*`, `drop-shadow-*`, 글로우, 블러 금지. 깊이는 면 밝기 단계로. 예외는 선택 행의 `inset 2px 0 0 accent`(그림자 문법으로 그리는 막대일 뿐 그림자가 아님).

### 5.5 폭

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--container-wide` (신규) | 80rem (1280px) | 홈·앱 기본(`mx-auto max-w-wide px-6 lg:px-8`) |
| `--container-page` | 75rem (1200px) | 기존 마케팅 페이지(전환하며 wide 로 맞출지 페이지별 판단) |
| `--container-reading` | 42rem (672px) | 약관·글 본문·폼·안내 |
| `--breakpoint-nav` | 80rem | 한 줄 메뉴 시작점(`nav:` / `max-nav:` 변형) |

지금 `Container` 의 거터는 `px-4 md:px-6` 이고 F 는 `px-6 lg:px-8` 이다. R04 `container.tsx` 를 F 값으로 바꾼다.

### 5.6 겹침(z-index), 움직임

- 겹침 단계는 `globals.css` 주석 그대로: z-10 표 머리 · z-30 페이지 안 sticky·하단 바 · z-40 카카오 버튼 · z-50 전역 네비 · z-70 토스트 · z-80 진행 막대. 모달은 `showModal()` top layer.
- 전환은 `transition-colors duration-150 ease-out` 하나. 카드 hover 는 선 색만(들림·확대 없음). 화살표만 `group-hover:translate-x-0.5`.
- `/studio` 의 `.channel-card:hover`(들림·확대·그림자), `.feat-img` 확대는 F 언어로 옮길 때 지운다.
- `prefers-reduced-motion` 전역 규칙 유지.

---

## 6. 컴포넌트 레시피

R04 공용 부품(`src/components/ui/*`)은 모양을 TS 문자열 상수로 내보낸다. 아래 클래스로 그 상수를 바꾸면 전 화면이 따라온다. 시안 HTML 의 `.btn` `.chip` 같은 CSS 클래스는 이 문자열과 같은 값이다(`@layer components` 로 둬도 된다. 그때는 유틸리티가 이긴다는 점에 주의).

### 6.0 R04 부품과 새 레시피의 차이 (요약)

| 부품 파일 | 지금 | 바꿀 것 |
|---|---|---|
| `logo.tsx` | 검정 상자 + `border-neutral-700` + 흰 B, lab `neutral-400`, 32/28px | 실버 판 `bg-logo-plate text-accent-ink`, lab `text-silver`, 36/32px (6.1) |
| `button.ts` | primary 흰, secondary `bg-neutral-900`, danger 빨강 | secondary 면 `bg-surface`, danger `negative` 테두리, 토큰 이름으로 (6.5) |
| `card.ts` | `rounded-card border-neutral-800 bg-neutral-900`, hover 면 `surface-raised` | `rounded-panel border-line bg-surface`, hover 는 선만 `line-hover`, 추천 카드 `bg-surface-2 border-line-hover` (6.7) |
| `chip.ts` | 알약 `rounded-full h-8`, 선택 `neutral-800` | `rounded-control h-10 sm:h-9`, 선택 `bg-surface-3` (6.6) |
| `chip.ts` SEGMENT | 알약 | `rounded-control`, 항목 `rounded-md` (6.6) |
| `badge.ts` | 알약 `rounded-full`, warn/danger/success 테두리 | 태그 `rounded-md border-line-strong`, 기능 톤은 6.12 (solid 흰 배지는 유지) |
| `tabs.ts` | 현재 탭 흰 글자 + 에메랄드 밑줄 | `accent` 토큰이라 값 교체로 흰 밑줄. 현재 글자 `text-accent` (6.3) |
| `section-header.tsx` | 라벨 `text-white`, 캡션·리드 `neutral-400`, 제목 900 | 라벨 `text-sm font-black leading-5 tracking-[0.25em] text-silver md:text-base md:leading-6`(`text-label-en` 토큰 쓰지 않음, 4.2), 캡션 `text-xs text-fg-3 md:text-sm`, 리드 `text-fg-3`, 제목 800(토큰) (6.4) |
| `field.tsx` | `border-neutral-700 bg-neutral-900`, 오류 `red-400`, placeholder `neutral-500` | `border-line-strong bg-surface`, 오류 `negative`, placeholder `fg-3` (6.9) |
| `dialog.tsx` / `dialog-classes.ts` | `border-neutral-800 bg-neutral-900` | 값 같음, 이름만 `border-line bg-surface-2`, 설명 `text-fg-3` (6.11) |
| `container.tsx` | `max-w-page px-4 md:px-6` | 홈·앱 `max-w-wide px-6 lg:px-8` (5.5) |
| `bottom-cta-bar.tsx` | | `data-bottom-bar` 규칙 유지, 면·선 토큰으로 |
| `icons.tsx` | 맨 SVG 한 가족 | 그대로 |
| `table.ts` (신규, C01) | 없음(화면마다 표를 따로 그림) | `TABLE`·`TH`·`TH_SORT`·`TD`·`NUM`·`ROW`·`ROW_SELECTED` 상수, 6.10 앱 표 값 |
| `list-panel.ts` (신규, C01) | 없음 | `LIST_PANEL`·`LIST_PANEL_HEAD`·`LIST_PANEL_ITEM` 상수, 6.27 |
| `globals.css` components 레이어 (C01) | `.chk`·`.ext`·`content-auto` 없음(grep 0) | 시안 `app.html` 의 `.chk`(6.10)·`.ext`(6.15) 값 그대로, `@utility content-auto { content-visibility: auto; contain-intrinsic-size: auto 96px; }`(시안에는 없음. ux-rules H32·critique 의 결과 행 렌더 지연, 96px 은 앱 표 행 높이 기준) |

### 6.1 로고 (실버 판 B)

```html
<!-- 헤더: 판 36px · B 22px · 워드마크 17px -->
<a href="/" class="inline-flex h-11 shrink-0 items-center rounded-md" aria-label="bibl lab 홈">
  <span class="inline-flex items-center gap-2.5">
    <span aria-hidden="true" class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-logo-plate text-[22px] font-black leading-none text-accent-ink">B</span>
    <span class="text-[17px] font-bold tracking-tight">bibl<span class="text-silver"> lab</span></span>
  </span>
</a>

<!-- 푸터: 판 32px · B 19px · 워드마크 14px -->
<span class="inline-flex items-center gap-2">
  <span aria-hidden="true" class="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-logo-plate text-[19px] font-black leading-none text-accent-ink">B</span>
  <span class="text-body-sm font-bold tracking-tight">bibl<span class="text-silver"> lab</span></span>
</span>
```

- 비율: B 글자는 판 높이의 약 61%, 반경은 판의 22%. 최소 20px. 판은 단색(그라데이션·광택·그림자·테두리 없음).
- 흰 바탕(문서·인쇄·흰 OG 이미지): 판 `bg-paper-ink` + B `text-paper`, 'bibl' `text-paper-ink`, ' lab' `text-paper-muted`. 실버는 흰 위에서 1.71:1 이라 글자로 못 쓴다.
- 지금 로고가 따로 그려진 곳은 5곳이다. 이 중 **사용자 화면 4곳**을 `Logo` 부품 하나로 바꾼다: `layout.tsx` 헤더(302~309행)·푸터(404~411행)(C02), `mypage/page.tsx`(C17), `sign-in/_components/SignInForm.tsx`(C06). 나머지 1곳 `admin/page.tsx`(teal lab)는 관리자 구 테마 유지 원칙(3.3)에 따라 **그대로 둔다**.
- `/maintenance`·404·`error.tsx` 는 `Logo` 를 쓰지 않는다. 이 화면들의 로고는 `layout.tsx` 헤더에서 오므로 C02 뒤에 실버 판이 된다.

### 6.2 전역 네비

```html
<header class="sticky top-0 z-50 border-b border-line bg-canvas">
  <div class="mx-auto flex h-14 max-w-wide items-center gap-6 px-6 lg:px-8 nav:h-16">
    <!-- 로고 -->
    <nav aria-label="주 메뉴" class="hidden min-w-0 flex-1 items-center nav:flex">
      <ul class="flex items-center" aria-label="비블과 함께"> … </ul>
      <span aria-hidden="true" class="mx-3 h-4 w-px bg-line"></span>
      <ul class="flex items-center" aria-label="직접 하기"> … </ul>
    </nav>
    <div class="ml-auto flex items-center gap-1.5">
      <a class="hidden h-9 items-center rounded-control px-3 text-body-sm font-medium text-fg-2 transition-colors hover:text-fg nav:inline-flex">로그인</a>
      <a class="(보조 버튼) h-11 px-4 text-body-sm nav:h-9">시작하기</a>
      <!-- 1280 미만: 메뉴 버튼 size-11 -->
    </div>
  </div>
</header>
```

- 네비 링크: `inline-flex h-9 items-center rounded-control px-3 text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-accent`
- 홈의 사람 서비스(컨설팅·대행·인큐베이팅) 강조: `font-semibold text-fg` (지금 에메랄드 글자 대신. 에메랄드 → 흰 600)
- 홈 순서: 로고 │ 비블과 함께 3개(흰 600) │ 직접 하기 3개(fg-3 500) │ 로그인(고스트) + 시작하기(**보조** 버튼, 첫 화면의 흰 면은 검색창 '분석 시작' 하나).
- 앱형 순서: 로고 │ 유튜브 트렌드 서치 · 커뮤니티&자료 · 요금제 │ 비블과 함께 ▾(드롭다운) │ 남은 횟수 배지 · 아바타. 모두 `fg-3`, 현재 위치만 `accent` 600. **흰 막대는 도구 탭에만**(전역 네비에 밑줄 없음).
- **경로 → 네비 형태**(SiteNav 가 `usePathname` 으로 고른다. 로그인 여부는 오른쪽 구성만 바꾼다):

| 경로 | 네비 |
|---|---|
| `/search` `/channels/**` `/my-channel` `/saved` `/trend-search/**` `/threads/**` `/mypage` | 앱형 |
| `/` `/pricing` `/about` `/incubating` `/studio/**`(컨설팅·강의·강의실 포함) `/community/**`(글·글쓰기·랭킹·소개) `/tools/calculator` `/terms` `/privacy` `/refund` `/payment/**` | 홈형 |
| `/sign-in` `/sign-up` `/sso-callback` | 홈형(오른쪽 '로그인'·'시작하기' 숨김, 로고·메뉴만) |
| `/maintenance` | 홈형 그대로(점검 중에는 다른 경로가 모두 `/maintenance` 로 가므로 메뉴를 눌러도 같은 화면. 숨기지 않는 이유: 루트 레이아웃 공용, 경로 분기 최소화) |
| 404 · `error.tsx` | 홈형 |
| `/admin/**` `/insights/admin/**` `/community/admin/**` | 홈형(관리자 화면 자체는 구 테마, 네비만 공용) |
| `/tmklab-site` | 지금 동작 그대로(별도 브랜드, 이 시스템 범위 밖. 루트 레이아웃 헤더가 지금 보이면 보이는 대로, 바꾸지 않는다) |

- **홈형 오른쪽 구성(로그인 여부별)**: 로그아웃 = 로그인(고스트) + 시작하기(보조). 로그인 = 남은 횟수 배지 + 아바타(앱형과 같은 `NavUser`), '로그인'·'시작하기' 숨김. 1280 미만 로그아웃 = 로고 · 시작하기 · 메뉴 버튼, 로그인 = 로고 · 아바타 · 메뉴 버튼. 인증 확인은 클라이언트 잎에서만(루트 레이아웃 인증 호출 금지), 확인 전에는 같은 폭 자리 표시.
- 1280 미만: 높이 56px, 로고 · (위 오른쪽 구성) · 메뉴 버튼(`size-11`). 메뉴는 전체 높이 시트 `fixed inset-x-0 bottom-0 top-14 overflow-y-auto border-t border-line bg-canvas`, 안쪽 `mx-auto max-w-wide px-6 pb-28 pt-2 lg:px-8`, 묶음 제목 `text-caption text-fg-3`, 행 `flex h-14 items-center justify-between text-lead font-semibold` + 장식 화살표 `text-fg-4`, 행 구분 `divide-y divide-line-soft`.
  - **홈형 시트**(`home.html`): 비블과 함께 → 직접 하기 순서, 아래 흰 '무료로 검색 시작하기'(주 버튼 `h-12 w-full`) + 로그인(보조). 로그인 상태면 아래 버튼 둘 대신 '마이페이지' 행.
  - **앱형 시트**(`app.html`): **직접 하기 → 비블과 함께** 순서(도구 먼저), 비블과 함께 묶음 끝에 '카카오톡 문의' 행(`https://pf.kakao.com/_beBNn/chat`, 새 창, 선택 모드에서 떠 있는 카카오 버튼이 숨기 때문), **아래 버튼 없음**.
- 메뉴 시트·드롭다운은 구현 때 클라이언트 컴포넌트로: 바깥 누르기·Esc 닫기·포커스 가두기(시안의 `<details>` 는 이것이 없다).
- 건너뛰기 링크: `sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink`.

### 6.3 도구 탭 (앱 셸 둘째 줄)

`inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 border-transparent text-body-sm font-medium text-fg-3 transition-colors hover:text-fg md:h-12 aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent`

- 탭 줄: `TAB_BAR`(`border-b border-line`) + `TAB_LIST`(`-mb-px flex gap-5 overflow-x-auto`) 구조 그대로.
- 잠긴 탭: 라벨 `text-fg-3` + Pro 태그(6.12). 자물쇠 아이콘 없음.
- **탭 목록(결정 18)**: 시안은 영상 찾기 · 채널 찾기 · 채널 분석(`/my-channel`) · 수집한 영상(Pro) 4개다. 그런데 `/my-channel` 은 로그인·횟수 제한 없이 YouTube 쿼터를 쓰는 경로이고, 지금 사이트 안 진입 링크는 트렌드 서치 허브 한 곳뿐이다. 모든 앱 화면에 탭으로 두면 노출이 크게 늘어난다.
  - A 탭 유지: `/my-channel` 에 서버 측 제한(로그인·횟수)을 **먼저** 넣은 뒤 탭 4개.
  - B (답 전 기본): **탭 3개 = 영상 찾기 · 채널 찾기 · 수집한 영상(Pro)**. '채널 분석'은 탭에서 빼고 지금처럼 허브 카드로만 들어간다. `/my-channel` 화면에는 도구 탭을 두지 않고 h1 '내 채널 분석'만.
  - 이 문단, 7.2 2행, 로드맵 C12 ToolTabs·C15 risks 는 같은 결정을 따른다.

### 6.4 섹션 헤더 · 두 톤 제목

```html
<div class="mb-10 flex items-center justify-between gap-4 border-b border-line pb-4 md:mb-12">
  <span class="text-xs text-fg-3 md:text-sm">비블랩 서비스 5가지</span>
  <span lang="en" aria-hidden="true" class="shrink-0 text-sm font-black leading-5 tracking-[0.25em] text-silver md:text-base md:leading-6">SERVICES</span>
</div>
<h2 class="text-h3 md:text-h1">
  <span class="block text-fg-3">비블과 함께하거나, 직접 하거나</span>
  <span class="block">필요한 만큼 고르세요</span>
</h2>
```

- 첫 화면 제목: `<h1 class="text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display"><span class="block">키워드 하나로</span><span class="block"><span class="text-accent">유튜브 트렌드</span>를 파악하세요</span></h1>`
- 새 화면마다 실버 라벨 섹션 머리를 하나 이상 둔다(실버가 비블을 알리는 반복 장치).

### 6.5 버튼

공통: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40`

| 종류 | 클래스 | 쓰는 곳 |
|---|---|---|
| 주(흰 면) | `bg-accent font-bold text-accent-ink hover:bg-accent-hover active:bg-accent-active` | 분석 시작 · 검색 · 채널 대행 문의하기 · 메뉴 '무료로 검색 시작하기'. **한 화면(한 폴드)에 하나** |
| 보조 | `border border-line-strong bg-surface font-semibold text-fg hover:border-line-hover hover:bg-surface-2` | 네비 '시작하기', 결과 더 보기, 앱 동작 |
| 고스트 | `font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg` | 공유, 선택 해제, 로그인 글자 |
| 위험 | `border border-negative/40 font-semibold text-negative hover:border-negative hover:bg-surface-2` | 삭제·해지. 빨간 면 금지 |
| 잠김 | 보조 + 라벨 `text-fg-3` + Pro 태그 | 요금제가 필요한 동작. 누르면 그 자리에서 안내 |
| 카카오 | `bg-kakao font-bold text-kakao-ink hover:bg-kakao-hover` | 카카오 로그인·문의·공유 |
| 글자 링크 | `inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2` + `<span aria-hidden="true">→</span>` | 카드·CTA 아래 보조 행동 |

크기: sm `h-9 px-3.5 text-body-sm`(36px, 데스크톱 네비·카드 안) · md `h-11 px-5 text-ui`(44px, 기본·모바일) · lg `h-12 px-6 text-ui`(48px) · CTA `h-14 px-7 text-body`(56px). 검색창 안 버튼은 `h-full px-5 text-ui`. 모바일 CTA 도 내용 폭(오른쪽 76px 는 카카오 버튼 자리).

### 6.6 칩 · 세그먼트

- 칩(예시 키워드·필터): `inline-flex h-10 shrink-0 items-center rounded-control border border-line px-3 text-caption font-medium text-fg-2 transition-colors hover:border-line-hover hover:text-fg sm:h-9 sm:px-2.5 pointer-coarse:h-11 aria-pressed:border-line-hover aria-pressed:bg-surface-3 aria-pressed:text-fg aria-[current=page]:border-line-hover aria-[current=page]:bg-surface-3 aria-[current=page]:text-fg`
- 칩 줄(모바일 한 줄 가로 스크롤): `-mx-6 flex items-center gap-1.5 overflow-x-auto px-6 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0`, 앞에 `text-caption text-fg-3` '예시'.
- 세그먼트 틀: `inline-flex rounded-control border border-line p-1`
- 세그먼트 항목: `inline-flex h-10 items-center justify-center rounded-md px-3 text-caption font-medium text-fg-3 transition-colors hover:text-fg md:h-8 pointer-coarse:h-11 aria-[current=true]:bg-surface-3 aria-[current=true]:font-semibold aria-[current=true]:text-fg aria-checked:bg-surface-3 aria-checked:font-semibold aria-checked:text-fg aria-selected:bg-surface-3 aria-selected:font-semibold aria-selected:text-fg`
- 선택 상태는 색 클래스를 갈아 끼우지 않고 ARIA 속성으로 표시한다(R04 방식 유지).

### 6.7 카드

| 종류 | 클래스 |
|---|---|
| 마케팅 카드 | `relative flex flex-col overflow-hidden rounded-panel border border-line bg-surface transition-colors duration-150 hover:border-line-hover` |
| 앱 카드·안내 카드 | `rounded-card border border-line bg-surface p-5 md:p-6` (누를 수 없으면 hover 없음) |
| 추천 카드(화면에 하나, 요금제 추천 플랜) | `rounded-panel border border-line-hover bg-surface-2` + 흰 주 버튼 |
| 미리보기 패널 | `overflow-hidden rounded-panel border border-line bg-surface`, 안쪽 `aria-hidden pointer-events-none select-none`, 바깥 `figcaption` 에 날짜·출처·링크 |

- 카드 전체가 링크: 제목 안 `<a>` 에 `after:absolute after:inset-0 focus-visible:outline-none`, 카드에 `group has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent` (포커스 링을 카드 둘레에. check-theme 의 `outline-none` WARN 은 이 경우 예외로 보고).
- 그림자·들림·확대 없음. hover 는 선 색만, 안쪽 화살표만 `group-hover:translate-x-0.5`.

### 6.8 서비스 사진 카드

```html
<article class="(마케팅 카드) group lg:col-span-7">
  <div class="aspect-[16/10] overflow-hidden bg-surface-2 lg:aspect-auto lg:h-[340px]">
    <img src="…" width="1160" height="725" alt="(사진 설명)" class="size-full object-cover object-[60%_53%]" loading="lazy" decoding="async">
  </div>
  <div class="flex flex-1 flex-col p-5 sm:p-6 lg:p-8">
    <h4 class="text-title"><a href="/studio" class="(카드 링크)">유튜브 채널 대행</a></h4>
    <p class="mt-2.5 text-ui text-fg-2 lg:text-body">설명</p>
    <div class="mt-auto pt-6 lg:pt-8">
      <div class="border-t border-line pt-4">
        <p class="tnum text-h4 font-extrabold">월 350만원</p>
        <p class="mt-1 text-caption text-fg-3"><span class="whitespace-nowrap">부가세 별도</span> · <span class="whitespace-nowrap">롱폼 4개 + 쇼츠 4개</span></p>
      </div>
      <p aria-hidden="true" class="mt-4 inline-flex items-center gap-1.5 text-ui font-semibold">채널 대행 문의하기 <span class="transition-transform group-hover:translate-x-0.5">→</span></p>
    </div>
  </div>
</article>
```

- 같은 줄 카드는 사진 높이를 맞춘다(데스크톱 340px). 가로 띠 카드(인큐베이팅)는 `lg:grid lg:grid-cols-12 lg:items-center lg:px-8 lg:py-7`.
- 사진은 **무채색 보정판**만: 실버 플레이 버튼은 `silver-play-button-neutral.jpg`(원본 `public/studio/silver-play-button.jpg` 는 B−R +4.6 청색기), 대행 사진은 마이크 초록 불빛을 지운 `svc-studio-neutral.jpg`. 따뜻한 쪽(B−R −4) 사진은 그대로.
- 사진 위 글자는 단색 막 `bg-canvas/70`~`/80`. 그라데이션 막 금지.
- 첫 화면에 인물 사진 없음(소유자 요청). 비블 사진은 서비스 카드·마지막 CTA 48px 아바타에만.

### 6.9 입력 · 검색창 · 선택 상자

- 한 줄 입력(R04 `INPUT`): `h-11 w-full rounded-control border border-line-strong bg-surface px-3.5 text-base text-fg placeholder:text-fg-3 transition-colors duration-150 hover:border-line-hover focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-solid focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-negative md:text-ui`
- 여러 줄: 위와 같고 `min-h-28 py-2.5`.
- 라벨 `mb-2 block text-body-sm font-medium text-fg-2` · 도움말 `mt-1.5 text-micro text-fg-3` · 오류 `mt-1.5 text-micro text-negative`(`role="alert"`, 문장 앞 기호).
- 검색창(홈 첫 화면): `flex h-14 items-center gap-2 rounded-card border border-line-strong bg-surface p-1 pl-4 transition-colors focus-within:border-accent` + 아이콘 `size-5 shrink-0 text-fg-3` + 입력 `h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-3` + 주 버튼. 보이지 않는 `<label class="sr-only">`.
- 검색창(앱, `app.html` 326행): 틀 `flex h-[50px] items-center gap-2 rounded-card border border-line-strong bg-surface p-0.5 pl-4 transition-colors focus-within:border-accent sm:h-14 sm:p-1 lg:pl-5`(모바일 50px · sm 이상 56px), 입력 `h-full min-w-0 flex-1 bg-transparent text-body font-medium text-fg outline-none placeholder:text-fg-3 lg:text-[17px]`, 국가 버튼 `hidden h-full items-center gap-1 rounded-control px-3 text-body-sm font-medium text-fg-2 hover:bg-surface-2 hover:text-fg sm:inline-flex`, 검색 버튼 주 버튼 `h-full px-5 text-ui lg:px-7`. 아래 안내 `mt-1.5 text-caption text-fg-3 sm:mt-2`.
- 홈 검색창·예시 칩은 기존 `trySearch(키워드)` 를 그대로 부른다(로그인 게이트·확인창·반복 검색 누적 `count` 정책 보존). `action="/search"` 로 바로 보내지 않는다.
- 선택 상자(정렬): `h-11 appearance-none rounded-control border border-line bg-surface pl-3 pr-9 text-body-sm text-fg max-md:text-base`, 펼침 화살표는 감싼 label 의 `::after` 마스크에 `bg-fg-3`(data URI 안에 hex 두지 않음, 시안 `.select-wrap`).
- 모바일 폭에서 입력 글자 16px(iOS 확대 방지, `globals.css` 규칙 유지).

### 6.10 체크박스 · 표 · 목록

- 체크박스 `.chk`(components 레이어 CSS, 시안 app.html 그대로): 18px, `appearance:none`, 테두리 1.5px `line-control`(검정 위 4.89 · 선택 행 위 4.18), hover `fg-2`, 선택·부분 선택 = `accent` 면 + `accent-ink` 체크. 누름 영역은 감싼 label 로 40~44px.
- `.chk`·`.ext`(6.15)·`@utility content-auto` 는 **C01 이 `globals.css` 에 정의**한다(지금 0곳). 이후 항목은 정의된 것을 쓰기만 한다.
- 표 클래스는 **C01 이 `src/components/ui/table.ts` 공용 상수로** 만든다(`TABLE`·`TH`·`TH_SORT`·`TD`·`NUM`·`ROW`·`ROW_SELECTED`). 앱 결과 표(C14)·요금제 비교표(C04)·브레이크아웃(C05)·랭킹(C10)이 모두 이 상수를 쓴다. 아래 두 줄의 값은 시안 실측이다.

| | 홈 미리보기 (`home.html` 363~381행) | 앱 표 (`app.html` `.th`·`.td`, 413행) |
|---|---|---|
| 열 | **영상 · 채널(1280 이상) · 조회수 · 구독자 · 게시일**. 체크 열·알고리즘 확률(옵트인) 열 없음 | 체크 · 영상 · 채널(1280 이상) · 조회수 · 구독자 · 게시일 (+ 옵트인 '알고리즘 확률' 열은 지금 위치 그대로) |
| 머리 칸 | `border-y border-line py-2.5 font-medium text-micro text-fg-3` | `sticky top-14 nav:top-16 z-10 border-y border-line bg-canvas py-0.5 font-medium text-micro text-fg-3` + 정렬 버튼 `inline-flex h-10 items-center gap-1 rounded-md px-2 -mx-2 hover:text-fg pointer-coarse:h-11` |
| 칸 | `border-b border-line-soft py-3 align-middle` | `border-b border-line-soft py-2.5 align-middle` |
| 썸네일 | `relative w-32 shrink-0 overflow-hidden rounded-md bg-surface-2` | `relative w-32 shrink-0 overflow-hidden rounded-control bg-surface-2 xl:w-36` |
| 길이 표시 | `absolute bottom-1 right-1 rounded bg-canvas/80 px-1 py-0.5 text-micro font-semibold tnum` | `absolute bottom-1.5 right-1.5 rounded bg-canvas/80 px-1.5 py-0.5 text-micro font-semibold tnum` |
| 정렬 기준 숫자 | `tnum text-right text-base font-extrabold` | `tnum text-right text-[18px] font-extrabold tracking-[-0.02em]` |

- 공통: 정렬 중인 열 머리 `font-semibold text-accent` + 화살표(`조회수 ↓`) + `aria-sort`. 영상 제목 `line-clamp-2 text-ui font-medium leading-[1.5] text-fg-1`, 채널 `text-body-sm text-fg-2`(1280 미만은 제목 아래 `text-caption text-fg-3` 한 줄 + 20px 아바타), 보조 숫자 `tnum text-right text-body-sm text-fg-2`, 날짜 `text-right text-body-sm text-fg-3`.
- 행 hover: `hover:bg-surface-2/55`. 선택 행: `bg-surface-2` + 첫 칸 `shadow-[inset_2px_0_0_var(--color-accent)]`.
- 앱 표의 영상 칸은 `relative` 이고 제목이 `<h3><button class="open-btn … after:absolute after:inset-0">` 라서 썸네일까지 누르면 영상 정보가 열린다(포커스 링은 `::after` 둘레). 체크 칸은 `label.size-11` 안 `.chk`.
- **1024 미만 목록(앱, `app.html` 584행)**: 행 `-mx-6 flex pl-[11px] pr-6`, 구분 `divide-y divide-line-soft`.
  - **왼쪽 `w-11` 띠만 선택**: `<label class="flex w-11 shrink-0 cursor-pointer justify-center pt-[19px]"><input class="chk" aria-label="{제목} 선택"></label>`.
  - **나머지는 영상 정보 열기**: `relative flex min-w-0 flex-1 gap-3 py-4` 안에 썸네일(`w-28 md:w-44 rounded-control`)과 제목 `<h3 class="text-ui font-medium text-fg-1 md:text-body"><button class="open-btn line-clamp-2 … after:absolute after:inset-0">`. 행 전체를 label 로 만들지 않는다(누르면 선택만 바뀌고 영상이 안 열린다).
  - 메타 순서: 첫 줄 채널 `mt-1 truncate text-micro text-fg-3`, 둘째 줄 `조회수회 · 구독자 N · 게시일`(`tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 text-micro text-fg-3`, 조회수만 `text-body-sm font-extrabold tracking-[-0.02em] text-fg`).
  - 목록 위 한 줄(`-mx-6 flex items-center justify-between gap-3 border-b border-line pl-[11px] pr-6 lg:hidden`): 왼쪽 '전체 선택'(`label h-11` + `w-11` 띠 안 `.chk`), 오른쪽 **정렬 선택 상자**(6.9 `.select`, 칩 아님).
- 쇼츠·롱폼 배지는 무채색 태그(빨강·파랑 금지).

### 6.11 대화상자

- 패널(R05 `dialog.tsx` 셸): `w-[calc(100%-2rem)] max-w-sm rounded-panel border border-line bg-surface-2 p-6 text-fg backdrop:bg-[rgb(0_0_0/0.8)]`. 배경 막은 리터럴 값 유지(Safari 17.3 이하는 `::backdrop` 이 테마 변수를 상속하지 않는다. 토큰 규칙의 유일한 예외).
- 제목 `text-body font-semibold text-fg` · 설명 `mt-2 text-body-sm text-fg-3` · 버튼 줄 `mt-6 flex justify-end gap-2`(보조 '취소' + 주 '확인').
- 그림자·블러 없음. 영상 재생 대화상자는 `max-w-xl`, 모바일은 전체 화면.
- 확인창이 열리면 카카오 버튼이 배경 막 아래에 있어야 한다(top layer).

### 6.12 배지 · 태그

| 종류 | 클래스 |
|---|---|
| 태그(기본) | `inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2` ('예시 화면', 쇼츠·롱폼) |
| Pro | `inline-flex items-center rounded border border-line-strong px-1 text-micro leading-[18px] text-fg-3` (잠긴 기능 표시는 이 한 모양. 라벨 `text-fg-3`(`.is-locked`) + 이 태그. **자물쇠 아이콘·흐린 미리보기·블러·원형 링을 더하지 않는다.** 'Starter' 잠금도 같은 모양에 글자만 'Starter') |
| solid(추천, 사이트에 한 곳) | `inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-micro font-bold text-accent-ink` |
| 남은 횟수 | 평소 `inline-flex h-8 items-center rounded-control border border-line px-2.5 text-caption font-medium text-fg-2 tnum`(누름 영역 44px), 5회 이하 `border-caution/55 text-caution`, 0회 `border-negative/55 text-negative`. 문구 '이번 달 38회 남음', title '이번 달 50회 중 12회 사용', 누르면 요금제 |
| 등급(공통) | `inline-flex h-[22px] items-center rounded-[5px] border border-transparent px-[7px] text-micro font-bold leading-none` |
| Great | 공통 + `bg-positive text-accent-ink` |
| Good | 공통 + `border-positive/55 text-positive` |
| Normal | 공통 + `border-line-strong text-fg-3` |
| Bad | 공통 + `border-caution/55 text-caution` |
| Worst | 공통 + `border-negative/55 text-negative` |

### 6.13 상태 메시지 · 토스트

- 상자: `flex gap-3 rounded-card border border-line bg-surface p-4`. 기호(맨 SVG `size-5`)와 제목(`text-ui font-semibold`)만 기능 색, 설명 `text-body-sm text-fg-3`.
- 성공 `text-positive` · 주의 `text-caution` · 오류 `text-negative`. 안내는 `text-fg-2` 기호(파랑 없음).
- 오류 입력칸은 테두리 `border-negative` 하나로 충분하다(면 칠하지 않음).
- **토스트**(`app.html` 743행, R05 토스트 층): `<div role="status" class="fixed inset-x-4 bottom-24 z-70 mx-auto flex max-w-md items-center gap-3 rounded-card border border-line-strong bg-surface-2 py-1.5 pl-4 pr-1.5 md:bottom-6">` + 문장 `min-w-0 flex-1 text-body-sm` + 동작(되돌리기·다시 시도) 고스트 버튼 `h-11 shrink-0 px-3 text-body-sm text-fg`. 모바일은 카카오 버튼 위(bottom-24), 768 이상 아래 가운데. 표시 5초, 동작 버튼에 포커스가 있거나 마우스가 올라가 있으면 멈춤. 실패 토스트는 문장 앞 negative 기호(맨 SVG `size-4 text-negative`)만 색, 면은 그대로. 한 번에 하나(새 토스트가 이전 것을 바꾼다). 토스트가 떠 있으면 카카오 배너(KakaoChannelBanner)는 띄우지 않는다.

### 6.14 실적 숫자 · 단계 · 미터

- 실적 열(첫 화면 오른쪽): 주체 줄이 먼저 `text-lead font-bold`('비블이 운영⁠·⁠기획한 채널') + 기준 `text-caption text-fg-3`('… 전체 채널 기준 · 2026.10'). 목록 `dl`, 칸마다 `flex flex-col-reverse gap-1`, 라벨 `dt text-caption text-fg-3`, 숫자 `dd tnum text-[22px] font-extrabold leading-none tracking-[-0.03em] sm:text-[30px] lg:text-[32px] xl:text-[40px]`, 뒤 `+` 는 `<span class="text-silver">+</span>` 같은 크기.
- 큰 지표(7억+): `tnum text-[44px] font-extrabold leading-none tracking-[-0.035em] sm:text-[48px] xl:text-[56px]`, 보이는 글자 `aria-hidden` + `sr-only` '7억 원 이상', 아래 `text-caption text-fg-3 lg:text-ui` 설명.
- 숫자는 확인된 사실만(70만+ · 1.7억회+ · 10억원+ · 대표 채널 4곳 합 63만 · 7억+). 근거 범위를 숫자 옆에 적는다(rationale 10장).
- 단계 01·02·03: `border-t border-line pt-5`, 숫자 `tnum text-body-sm font-bold text-silver`, 제목 `text-lead font-bold`, 설명 `text-ui text-fg-3`. 원형 배지 금지.
- 경쟁도 미터: 점수 `text-[26px] font-extrabold` 단계 색 + 3칸 막대(칸 `h-1.5 w-3.5 rounded-[1px] bg-surface-3`, 채운 칸 = 단계 수만큼 `bg-competition-*`, 칸 사이 3px, `aria-hidden`) + '경쟁 낮음' `font-bold` 단계 색 + 권장 문장 `text-fg-2`.

### 6.15 유튜브 외부 링크 표시 `.ext`

`<svg class="ext …">` 를 링크 글자 뒤에 둔다: `inline-block size-[0.8em] shrink-0 align-[-0.05em] text-fg-3 transition-colors`, 링크(`group`)에 `group-hover:text-youtube group-focus-visible:text-youtube`. 평소 무채색, 올리거나 포커스할 때만 빨강. **'빨간 ↗' 라고 적지 않는다**(평소에도 빨강으로 읽힌다). 로드맵·보고서에는 '↗ 는 .ext 규칙'으로 쓴다.

- 흰 면 버튼 안에서는 `.ext` 를 쓰지 않는다(흰 면 위 fg-3 대비 부족, hover 빨강은 흰 위 4.0:1). 영상 정보 대화상자의 'YouTube에서 보기'는 시안대로 **흰 주 버튼**(`btn-primary h-11 flex-1 px-5 text-ui`, 빨간 표시 없음, 대화상자 안 흰 면 하나)이고, 새 창은 `target="_blank" rel="noopener noreferrer"` + `sr-only` '(새 창)'으로 알린다.

### 6.16 푸터

- `footer.bg-canvas` > `mx-auto max-w-wide px-6 pb-28 pt-12 lg:px-8 lg:py-16`, 그리드 `grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-12 lg:gap-6`.
- 로고(6.1 푸터) + 한 줄 소개 `mt-4 max-w-xs text-body-sm text-fg-3`.
- 메뉴 묶음 3개(비블과 함께 · 직접 하기 · 정책): 제목 `text-caption font-semibold text-fg`, 링크 `inline-flex h-11 min-w-11 items-center text-body-sm text-fg-3 transition-colors hover:text-fg md:h-8 pointer-coarse:h-11`. 모바일은 두 묶음을 나란히, 정책은 한 줄.
- 사업자 정보 `address`: `mt-10 border-t border-line-soft pt-8 text-micro not-italic leading-[1.8] text-fg-3`, 첫 줄 `font-semibold text-fg-2`, 구분 `|` 는 `text-fg-4 aria-hidden`, 항목마다 `whitespace-nowrap`(모바일은 항목별 줄).
- YouTube API 고지·저작권 `mt-6 space-y-1.5 text-micro leading-[1.7] text-fg-3`, 링크 `underline decoration-fg-4 underline-offset-2 hover:text-fg`.

### 6.17 카카오 상담 플로팅 버튼

- `KakaoChatButton.tsx` 그대로: `fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-kakao text-kakao-icon transition-colors hover:bg-kakao-hover md:bottom-6 md:right-6`, 말풍선 `fill="currentColor"`. 말풍선 툴팁은 `bg-surface-2 border-line-strong text-fg`.
- 하단 고정 바가 있으면 `data-bottom-bar="md"|"nav"` 규칙으로 88px 위로(`globals.css`). 앱 선택 바가 보이는 768 미만에서는 버튼을 숨긴다(시안 app.html 규칙, 선택을 풀면 돌아옴).
- 모바일 주요 숫자·CTA 는 왼쪽 정렬로 오른쪽 76px 를 비운다.

> 6.18~6.32 는 2026-10-08 비평 반영으로 더한 레시피다. 여러 항목이 '같은 부품'으로 참조하는 6.25(선택 바·하단 바)·6.27(목록 패널)·6.28(채널 실적)·6.13(토스트)·6.19(스켈레톤)는 **C01~C03 착수 전에 확정**된 값이고, 공용 상수·부품 위치를 함께 적었다. 나머지는 쓰는 항목이 이 클래스로 만든다.

### 6.18 상태 화면 (오류 · 404 · 점검)

R04 에서 만든 틀(`not-found.tsx`·`error.tsx`·`maintenance/page.tsx`, 같은 구조)을 토큰 이름으로 옮긴 것이다. `sso-callback/error.tsx`·`payment/toss/fail`·`search/error.tsx` 도 이 틀을 쓴다.

```html
<main class="flex min-h-[60vh] items-center py-16 md:py-24">
  <div class="mx-auto w-full max-w-reading px-6 text-center lg:px-8">   <!-- Container size="reading" -->
    <div aria-hidden="true" class="tnum text-display font-black text-fg-4">404</div>   <!-- 장식 글자: 404 · 점검은 맨 SVG(size-10 text-fg-3) -->
    <h1 class="mt-4 text-h4 text-fg">페이지를 찾을 수 없어요</h1>
    <p class="mt-3 text-body-sm text-fg-3 md:text-body">설명 한두 문장</p>
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <a class="(주 버튼 md)">홈으로</a> <a class="(보조 버튼 md)">유튜브 트렌드 서치</a>
    </div>
    <p class="mt-4 text-caption text-fg-3">문의: …</p>   <!-- 필요할 때만 -->
  </div>
</main>
```

- 로고는 넣지 않는다(전역 네비 로고 하나, 6.1). 원형 아이콘 상자 금지. 오류 화면에서 원인을 알리는 기호는 `text-negative` 맨 SVG 하나 + 문장(색만으로 말하지 않음).
- 흰 면 버튼은 하나. '다시 시도'(error.tsx `reset`)가 있으면 그것이 주 버튼, '홈으로'는 보조.

### 6.19 로딩 스켈레톤

- 자리: `rounded-control bg-surface-2 animate-pulse`(`motion-reduce:animate-none`), 카드 자리 `rounded-card border border-line bg-surface p-5`. 줄 높이는 실제 글자 줄과 같게(`h-4` 제목, `h-3` 메타), 표 행은 실제 행 높이(앱 표 약 96px)와 같게.
- `animate-pulse` 는 스켈레톤에만(1.3). 스피너는 버튼 안 처리 중 표시에만(`size-4`, `aria-hidden` + 버튼 `aria-busy`).
- 화면 스켈레톤(`loading.tsx`)은 `role="status"` + `sr-only` '불러오는 중'. 레이아웃 이동 0(CLS < 0.1)이 기준.

### 6.20 빈 상태

- `flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8`(목록 자리 안). 제목 `text-ui font-semibold text-fg`, 설명 `text-body-sm text-fg-3`, 행동 보조 버튼 하나(예: /saved '영상 찾기'). 일러스트·이모지·아이콘 상자 금지. 페이지 전체가 빈 경우만 가운데 정렬(6.18 틀).

### 6.21 아코디언 · FAQ

- 목록 `divide-y divide-line border-y border-line`. 질문 `<h3><button aria-expanded aria-controls class="flex w-full items-center justify-between gap-4 py-5 text-left text-ui font-semibold text-fg transition-colors hover:text-fg-2 md:text-body">` + 펼침 기호(맨 SVG `size-5 text-fg-3`, 펼치면 `rotate-180`, `aria-hidden`).
- 답 `pb-5 text-body-sm text-fg-2 md:text-ui`, 닫힌 답도 렌더하고 `hidden`(Ctrl+F 로 찾힘). 원형 +/− 버튼·카드형 묶음 금지.

### 6.22 드롭다운 메뉴

- 틀(`app.html` 네비 '비블과 함께 ▾'): `absolute left-0 top-full z-10 mt-3 w-64 rounded-card border border-line bg-surface p-1.5`, 항목 `flex h-11 items-center rounded-md px-3 text-body-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg`, 현재 항목 `aria-current="page"` + `font-semibold text-fg`.
- 여는 버튼 `aria-expanded` + `aria-haspopup`, 바깥 누르기·Esc 닫기·닫으면 여는 버튼으로 포커스, 위아래 화살표 이동.
- 선택형 메뉴(검색 국가): 항목 `role="menuitemradio" aria-checked`, 선택된 항목 오른쪽 체크 맨 SVG `size-4 text-accent`. 국기 이모지는 예외(글자 라벨과 함께).

### 6.23 진행 · 사용량 막대

- 트랙 `h-1.5 w-full overflow-hidden rounded-full bg-surface-3`, 채움 `h-full bg-chart-1`(사용량), 소진(100%) `bg-negative`, 5회 이하 남음 `bg-caution`. 숫자는 막대 위 줄에 글자로(`tnum text-body-sm`, '38 / 50회'), `role="progressbar" aria-valuenow aria-valuemax aria-label`.
- 강의 진도도 같은 모양(채움 `bg-chart-1`, 완료여도 positive 를 쓰지 않는다. 완료는 '완료' 글자). 원형 진행 링 금지.

### 6.24 라디오 카드 (상담 폼)

- 묶음 `role="radiogroup"` + 보이는 질문(`legend` 또는 `aria-labelledby`), 카드 `role="radio" aria-checked` 또는 `label` 안 `sr-only` `input type=radio`.
- 카드 `flex min-h-11 items-center gap-3 rounded-control border border-line-strong bg-surface px-4 py-3 text-ui text-fg-2 transition-colors hover:border-line-hover`, 선택 `border-accent bg-surface-2 font-semibold text-fg`(+ 오른쪽 체크 맨 SVG `size-4`). 색 면 채움·에메랄드 테두리 금지. 키보드 화살표로 이동.

### 6.25 선택 바 · 하단 고정 바

- **선택 바(앱 결과, `app.html` 725~740행)**: 고른 영상이 있어야 하는 동작(채널 제거)만 담는다. 채널 리포트·영상 수집 Pro 는 선택과 상관없이 결과 머리에 늘 있다(7.2).
  - 768 미만: `<div data-selection-bar class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">` 안에 선택 해제(고스트 `size-11`, aria-label) · 'N개 선택'(`tnum text-body-sm font-semibold`) · 오른쪽 '채널 제거'(보조 `ml-auto h-11 px-4 text-body-sm`). 이 바가 보이면 카카오 버튼을 숨긴다(`body:has([data-selection-bar]:not([hidden])) [data-kakao-fab]{display:none}`).
  - 768 이상: 떠 있는 막대 `pointer-events-none fixed inset-x-0 bottom-6 z-30 hidden justify-center px-6 md:flex` > `pointer-events-auto flex items-center gap-1 rounded-card border border-line-strong bg-surface-2 p-1.5` 안에 선택 해제(고스트 `size-9 pointer-coarse:size-11`) · 'N개 선택'(`tnum px-1.5 text-body-sm font-semibold`) · 세로 구분(`mx-1 h-4 w-px bg-line-strong`) · '채널 제거'(보조 `h-9 px-3 text-body-sm pointer-coarse:h-11`).
  - 선택이 0개면 둘 다 `hidden`. 공용 부품 위치는 C14 가 만드는 `src/app/search/_components/SelectionBar.tsx`(/saved 도 재사용).
- **하단 CTA 바(`BottomCTABar`, R05)**: `fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas px-6 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3`, 안에 주 버튼 하나(`h-12 w-full`) 또는 주 + 보조. `data-bottom-bar="md"|"nav"` 로 카카오 버튼을 바 위로 올린다(6.17). 페이지 아래 여백 `pb-28`.

### 6.26 사이드바 내비 (커뮤니티 · 강의실 커리큘럼)

- 틀 `rounded-card border border-line bg-surface p-2`, 데스크톱 `lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:max-h-[calc(100dvh-var(--nav-h)-2rem)] lg:overflow-y-auto`.
- 묶음 제목 `px-3 pb-1 pt-3 text-caption text-fg-3`, 묶음 사이 구분 `my-2 h-px bg-line-soft`(한 겹만).
- 항목 `flex h-10 items-center justify-between gap-2 rounded-md px-3 text-body-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:h-11`, 현재 `aria-current="page"` + `bg-surface-2 font-semibold text-fg`. 강의 커리큘럼의 완료 표시는 체크 맨 SVG `text-fg-3` + sr-only '완료'.
- 소유자 예외(노란 강조·N 배지)는 3.4 자리에만.

### 6.27 목록 패널 (홈 '직접 하기' · 트렌드 서치 허브)

- **C01 이 `src/components/ui/list-panel.ts` 공용 상수(`LIST_PANEL`·`LIST_PANEL_HEAD`·`LIST_PANEL_ITEM`)로 만든다.** 홈(C03)과 허브(C05)가 같은 상수를 쓴다.
- 값(`home.html` 616~624행): 틀 `flex flex-col overflow-hidden border-b border-line bg-canvas`(카드 안 미디어 칸일 때 `lg:h-[340px]`, 카드 밖 단독이면 `rounded-panel border border-line bg-surface`), 머리 `flex h-11 shrink-0 items-center justify-between gap-4 border-b border-line-soft px-6`(오른쪽 `text-micro text-fg-3`), 목록 `divide-y divide-line-soft px-6`, 항목 `py-2.5`: 제목 `flex items-center gap-1.5 text-body-sm font-semibold leading-[1.5]`(+ 잠금이면 Pro/Starter 태그 6.12) · 설명 `mt-0.5 truncate text-caption text-fg-3`.
- 홈 카드 안 미디어 칸은 `aria-hidden pointer-events-none select-none`(장식), 허브의 단독 패널은 항목이 실제 링크(`CARD_LINK`, 항목 전체 누름 44px 이상).

### 6.28 채널 실적 부품 (홈 #channels · /studio · /incubating)

- **C03 이 `src/app/_components/home/HomeChannels.tsx` 로 만들고 C07·C09 가 그대로 가져다 쓴다**(props 로 머리 문구만 바꿈). 숫자는 6.14 '확인된 사실만'.
- 640 이상(`home.html` 731행 `ol.hidden.sm:block`): 채널마다 `grid gap-5 border-t border-line py-7 lg:grid-cols-12 lg:gap-6 lg:py-9`. 왼쪽 4칸: 채널 아이콘 `size-11 rounded-full`(채널 아이콘이라 인물 사진 규칙 밖) + 채널명 `text-lead font-extrabold` 링크(`.ext`) + 분야 `text-caption text-fg-3`, 구독자 `tnum text-[28px] font-extrabold leading-none tracking-[-0.03em] lg:text-[36px]` + '구독자' 캡션. 오른쪽 8칸: 대표 영상 썸네일 `grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-4`(셋째는 `hidden lg:block`), `rounded-lg bg-surface-2`.
- **640 미만(`home.html` 661행 `sm:hidden`)**: 채널 4곳을 `grid grid-cols-2 gap-x-4 gap-y-7 border-t border-line pt-5` 2열 격자로(아이콘 `size-8` + 채널명 `text-body-sm font-bold`, 숫자 `tnum mt-3 text-[28px] font-extrabold`, 캡션 '골프 · 구독자'), 그 아래 대표 영상 8장을 가로 스냅 목록 `-mx-6 mt-7 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1`(`aria-label="대표 영상"`), 항목 `block w-[64%] shrink-0 snap-start` + 썸네일 + 채널명 `mt-2 truncate text-caption text-fg-3`.
- 위 캡션 '대표 채널 4곳 · 공개 구독자 수 · 2026.10'(`text-caption text-fg-3`), 목록 끝 각주.

### 6.29 잠금 표시

- 잠긴 동작·탭·도구는 6.12 Pro 모양 한 가지: 라벨 `text-fg-3` + Pro/Starter 태그. 누르면 그 자리에서 안내 대화상자(6.11, 시안 `data-confirm="pro"`).
- 검색 결과의 분석 패널 잠금(Free 계정)은 흐린 미리보기 카드가 아니라 **분석 도구 줄(7.2 4-1) 안 잠금 보조 버튼 하나**: '키워드 경쟁도 · 제목 패턴 분석' + Starter 태그(시안 `app.html` 359행 주석). `filter: blur()`·`backdrop-blur-*`·원형 링·가짜 점수 금지.

### 6.30 아바타 크기

| 크기 | 클래스 | 쓰는 곳 |
|---|---|---|
| 20px | `size-5 rounded-full bg-surface-2` | 표·목록의 채널(1280 미만) |
| 32px | `size-8` | 표 채널 열(1280 이상), 모바일 채널 실적, 댓글 |
| 44px | `size-11` | 네비 아바타 누름 영역(그림 32px + 여백), 채널 실적 데스크톱, 커뮤니티 글 작성자 |
| 48px | `size-12` | 마지막 CTA 비블 사진, 앱 컨설팅 안내 카드 |

- 모두 `rounded-full object-cover`, 빈 자리 `bg-surface-3` + 첫 글자 `text-fg-2`. 테두리·그림자 없음. 장식이면 `alt=""`.

### 6.31 상단 진행 막대 (NavigationLoader)

- `fixed inset-x-0 top-0 z-80 h-0.5 pointer-events-none`, 막대 `h-full bg-accent`(흰 2px), 끝 점·글로우·그림자 없음. `prefers-reduced-motion` 이면 움직임 없이 나타났다 사라짐.
- 전체 화면 오버레이(`bg-black/60 backdrop-blur-sm`)는 쓰지 않는다(블러 금지). 꼭 필요하면 `bg-canvas/60` 단색 + `role="status"`. 지금의 `z-[9998]`·`z-[9999]` 는 5.6 단계(z-80)로.

### 6.32 뒤로가기 · 목록으로 글자 링크

- `inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg` + 앞 `<span aria-hidden="true">←</span>`. 글 상세는 위(뒤로가기)와 댓글 아래('목록으로') 같은 주소.
- 버튼 모양·원형 화살표 버튼 금지. 브라우저 뒤로가기(`history.back()`) 대신 실제 목록 주소.

---

## 7. 페이지 레이아웃

### 7.1 홈 첫 화면 구성 F (위에서 아래로)

| 순서 | 구역 | 구성 |
|---|---|---|
| 1 | 네비 | 6.2 (홈 순서) |
| 2 | 첫 화면 `#trend` | 12열. 왼쪽 8열: h1 '키워드 하나로 / **유튜브 트렌드**를 파악하세요'(실버 + 흰 핵심어) · 설명 `text-fg-2` · 검색창(흰 '분석 시작') · '가입 후 하루 2회 무료 검색 · 1분 만에 시작' · 예시 칩 6개. 오른쪽 4열(`lg:border-l lg:border-line lg:pl-8`): 주체 줄 → 70만+ · 1.7억회+ · 10억원+. 제목과 실적 열 글자 윗선을 맞춘다(±1px). **이 구역에 인물 사진·비블 아바타 0**(실적 열 주체 줄에도 아바타를 넣지 않는다, rationale 2-1). 미리보기 썸네일·채널 아이콘은 콘텐츠라 예외 |
| 3 | 결과 미리보기 | 같은 구역 안, 실제 '캠핑' 결과 5행(모바일 3행). 도구 탭 + '‘캠핑’ 결과 50개' + 길이 필터 + 표(체크·옵트인 열 없이 영상·채널(1280 이상)·조회수·구독자·게시일, 6.10 홈 미리보기 값). 아래 캡션 '2026.10.07 YouTube 공개 검색 결과' + '로그인하고 전체 결과 보기 →'. 운영 때는 날짜를 붙인 정적 스냅숏을 주기적으로 교체(YouTube 데이터 보관 규정) |
| 4 | 01·02·03 | 키워드 입력 · 실시간 분석 · 인사이트 확인(6.14) |
| 5 | 서비스 5가지 `#services` | 섹션 머리 SERVICES. 비블과 함께(컨설팅 5칸 · 대행 7칸 사진 카드 + 인큐베이팅 가로 띠) / 직접 하기(트렌드 서치 · 커뮤니티&자료, 미디어 칸 340px 목록 패널). 네비 묶음과 같은 분류 |
| 6 | 채널 실적 `#channels` | 섹션 머리 CHANNELS, '말이 아닌, / 결과로 증명합니다'. 대표 채널 4곳 + 각주(6.28 채널 실적 부품): 640 이상은 채널마다 구독자 + 대표 영상 썸네일 3장(lg 미만 2장), **640 미만은 4곳 2열 격자(28px 숫자) + 대표 영상 8장 가로 스냅 목록(`w-[64%] snap-start`, `aria-label="대표 영상"`)**. 이어서 실버 플레이 버튼 사진(5칸) + 7억+(7칸) |
| 7 | 마지막 CTA `#contact` | 48px 비블 아바타 + '지금 채널 대행을 문의해보세요 / 비블이 직접 연락드립니다' + 흰 '채널 대행 문의하기'(→ `/studio/consulting`) + 글자 링크 2개 |
| 8 | 푸터 | 6.16 |
| 고정 | 카카오 버튼 | 6.17 |

- 홈 흰 면 버튼: 첫 화면 '분석 시작', 마지막 '채널 대행 문의하기'(서로 다른 폴드).
- 홈 액센트 자리: 로고 판 · 첫 화면 핵심어 · 섹션 라벨과 01·02·03 · 실적 `+` · 실버 플레이 버튼 사진. 채도 있는 UI 색은 유튜브 ↗ hover 와 카카오 버튼뿐.
- 숫자·문구 출처와 실측 기록은 `layout-F/rationale.md` 2·10·11장.

### 7.2 앱 화면 (로그인 뒤, `app.html`)

| 순서 | 구성 |
|---|---|
| 1 | 앱 네비(도구 먼저, 현재 위치 흰 글자, 남은 횟수 배지 한 곳) |
| 2 | 도구 탭: 영상 찾기 · 채널 찾기 · 수집한 영상(Pro). 현재 탭만 흰 2px 막대. **'채널 분석'(`/my-channel`) 탭은 결정 18 답 전까지 넣지 않는다**(6.3. 시안은 4개) |
| 3 | 검색창(6.9 앱 검색창: 모바일 50px · sm 이상 56px, 지역 선택 ▾ · 흰 '검색') + '검색할 때마다 1회 차감 · 매월 1일 초기화'(실제 정책 문구 확인 후) |
| 4 | 결과 머리 한 줄(`flex flex-wrap items-center gap-x-4 gap-y-2.5`): '‘캠핑’ 결과 50개'(h1 `text-h4 font-extrabold`) · 길이 필터(세그먼트, 모바일 전체 폭) · '조회수 합계 312.6만 · 오늘 1,284건 검색됨'(`text-caption text-fg-3`, 숫자 `tnum font-semibold text-fg-1`. 조회수 합계는 유료·`ViewStatsInline`, 오늘 N건은 `TodaySearchCount` 의 지금 노출 조건 그대로) · 오른쪽 **채널 리포트 Pro · 영상 수집 Pro(1024 이상, 잠금 보조 `h-9`) · 공유(고스트)**. 채널 리포트·영상 수집은 선택과 상관없이 늘 보인다(채널 리포트는 결과 전체, 영상 수집은 고른 영상 또는 전체) |
| 4-1 | **분석 도구 줄**: `mt-4 border-y border-line` > `-mx-6 flex items-center gap-2 overflow-x-auto px-6 py-2 lg:mx-0 lg:px-0 lg:py-2.5`. 왼쪽 '‘캠핑’ 키워드 인사이트'(1280 이상 `text-caption text-fg-3`) · 상위 영상 패턴 보기 · 연관 키워드 추천 │ 경쟁도 분석 시작 · 제목 패턴 분석 ▾(모두 보조 `h-9 px-3 text-body-sm pointer-coarse:h-11`) · (1024 미만만) │ 채널 리포트 Pro · 영상 수집 Pro · 오른쪽 끝 글자 링크 '유튜브 채널 대행 문의 →'(`ml-auto … text-body-sm font-semibold text-accent hover:text-accent-hover`, 흰 600). 줄 아래 디스클레이머 '경쟁도 분석 · 사용자 자가 계산 도구 (YouTube 공식 메트릭 아님)'(`mt-1.5 text-micro text-fg-3`) **문구 그대로**. 누른 도구만 이 줄 아래에 펼친다. 옵트인 단계·확인창 그대로. Free 계정은 경쟁도·제목 패턴 자리에 잠금 버튼 하나(6.29) |
| 5 | 표(1024 이상) / 목록(1024 미만, 위에 전체 선택 + 정렬 선택 상자), 6.10 |
| 6 | 가운데 '더보기'(보조 `h-12 px-8 text-ui`) + 아래 '50개 표시 · 더보기로 최대 100개'(`tnum text-caption text-fg-3`). **숫자는 기존 `handleLoadMore`·결과 수에서 그대로 가져온다**(누적 로직 diff 0). 시안의 '10행'은 그림용이라 문구에 쓰지 않는다 |
| 7 | 안내 카드 2장(`mt-12 grid gap-3 md:grid-cols-2 md:gap-4`, 카드 `flex flex-col justify-between gap-5 rounded-card border border-line bg-surface p-5 lg:p-6`): ① 'Pro 플랜' 캡션 + '영상 수집 · CSV 내보내기 · 채널 분석 리포트'(`text-lead font-bold`) + 가격·한도 캡션 + 보조 '요금제 보기'(→ `/pricing`) ② 48px 비블 사진 + '팀비블 1:1 유튜브 컨설팅' 캡션 + '검색 결과를 어떤 영상으로 만들지 막막하다면, 비블과 1:1로 정하세요' + '월 49만원 · 매주 1:1 미팅 · VOD 100강' + 보조 '컨설팅 알아보기'(→ `/studio/class/consulting`). 문구는 시안 그대로, 가격은 요금제·컨설팅 페이지 실제 값 확인 후 |

- **선택 상태**(6.25): 선택 동작은 결과 머리에 넣지 않는다. 768 이상은 화면 아래 가운데 **떠 있는 선택 막대**('선택 해제 · 2개 선택 │ 채널 제거'), 768 미만은 하단 고정 선택 바(`data-selection-bar`, 카카오 버튼 숨김). 채널 리포트·영상 수집 Pro 는 선택과 무관하게 결과 머리(1024 이상)·분석 도구 줄(1024 미만)에 늘 있다.
- 앱 액센트 자리: 로고 · 현재 위치(네비 흰 글자, 도구 탭 흰 막대) · 정렬 열 · 선택 행(흰 체크 + 왼쪽 흰 막대) · 분석 도구 줄의 '유튜브 채널 대행 문의 →' 글자 링크(흰 600). 흰 면 버튼은 '검색' 하나(영상 정보 대화상자 안 'YouTube에서 보기'는 대화상자 안 흰 면 하나, 6.15).
- 파생 지표 요약 띠는 넣지 않는다. 옵트인 '알고리즘 확률' 열과 유료 '조회수 합계'는 위치·문구 그대로, 스타일만.
- **불변 조건**: 검색 결과 누적 로직(같은 키워드 재검색 50 → 100 → 150, `countBasedLimit`·`resultLimit`·`pagesToFetch`·`prevCount + 1`)은 화면 변경과 무관하게 손대지 않는다. 루트 레이아웃에서 인증 호출 금지(배지는 클라이언트 컴포넌트).

### 7.3 다른 페이지로 넓히기

| 페이지 | 적용 |
|---|---|
| 요금제 | 첫 화면 한 줄 + 월간/연간 세그먼트. 플랜 카드 `surface`, 추천 플랜만 추천 카드 + 흰 버튼 + 흰 '추천' 배지, 가격 40~48px 800 + 연간 실제 청구액. 비교표는 앱 표 부품 |
| 채널 대행 `/studio` | 첫 화면 실버 플레이 버튼(무채색) 또는 촬영 사진 + 두 톤 제목, 홈 채널 실적 띠 재사용, 7단계는 '01' 글자 숫자, 가격 큰 숫자 카드, 마지막 CTA 는 홈과 같은 원문. 빨간 강조는 3.4 |
| 1:1 컨설팅 | 사진 카드 히어로 + '월 49만원' 큰 숫자, 상세 이미지 문구를 HTML 섹션으로 |
| 커뮤니티 | 비회원 게이트: 손글씨 워드마크(`community-wordmark.png`) + 멤버 수 + 게시판 목록(홈 카드 부품) + 가입 버튼. 피드는 앱 목록 밀도. 노란 강조·N 배지는 3.4 |
| 브랜드 인큐베이팅 | 배너 히어로 + 역할 분담 '01~04' + 채널 실적 부품 + 오픈채팅(흰 버튼) |
| 마이페이지 | 남은 횟수 큰 숫자(네비 배지와 같은 값·문구), 플랜 카드, 결제 관리. 해지는 아래 따로 `negative` 글자 |
| 채널 찾기 · 채널 분석 | 앱 셸 그대로(네비 + 도구 탭 + 검색 + 한 줄 결과 머리 + 표/목록). 채널 찾기: 섹션 머리 CHANNELS + h1 '채널 찾기', 예시 칩은 입력창에 채우기만(자동 검색 없음), 정렬 탭 자체 가로 스크롤, md 미만 행 카드, 등급은 무채색 단계(fg~fg-4) + 글자, 표 아래 범례 한 줄. 채널 상세: 헤더 → 핵심 수치 4개 → 최근 영상 요약 → 그리드 → 소개. `/my-channel`: 도구 탭 없이 h1(결정 18 기본 B), 요일 히트맵 heat-1~5 |
| 수집한 영상 `/saved` | 앱 셸(도구 탭 현재 = 수집한 영상) + 통계 한 줄(만/억, `fg` 800 + '전체 기준' 캡션) + 앱 표/목록(6.10) + 선택 바(6.25, 같은 부품). 200개 넘으면 '최근 200개 표시 중', 빈 상태 6.20 + 보조 '영상 찾기', 50개씩 더보기(보조) |
| 트렌드 서치 허브 `/trend-search` | 두 톤 h1(silver + 흰 핵심어) + 도구 4가지를 **목록 패널(6.27, 단독 패널, 항목 = 링크)**. 잠긴 도구는 6.29(라벨 fg-3 + Pro/Starter 태그, 내용은 결정 9 기본 C 그대로). 아래 브레이크아웃 진입 글자 링크 |
| 브레이크아웃 `/trend-search/breakout` | `max-w-wide` 앱 표 부품(6.10 앱 표 값, 체크 열 없음): 영상(썸네일 · 제목 · 채널 한 줄) · 구독자 대비 조회수(배수) · 조회수 · 구독자 · 게시일(짧게). 정렬 키(배수·조회수·구독자)·배수 필터(1·3·10배)·도박성 제외는 지금 로직 그대로. 배수는 3.1 상승 규칙(2배 이상 `positive` + ▲, 흰색 금지), 1024 미만 목록. 맨 아래 API 출처 문장 유지. 비로그인 안내는 상태 메시지(6.13) |
| 스레드 `/threads` · 수집함 `/threads/saved` | 앱 셸. 스레드 탭(`ThreadsTabNav`)은 도구 탭 레시피(6.3). 상단 지표 카드 3개(앱 카드, 숫자 `tnum text-h4 font-extrabold`) → 차트(3.1 차트 규칙, `chartTheme`) → 게시물 표(앱 표 부품). 기간 버튼 줄은 갱신 중에도 남김(`aria-busy`, 이전 데이터 흐리게). 오류는 상태 메시지(negative) + 흰 '다시 시도' + 보조 '다시 연결하기'. 수집함은 앱 표 + 즐겨찾기 별(`caution`, `aria-pressed`, 44px) |
| 로그인 `/sign-in` · 가입 | `max-w-sm` 카드 하나(`rounded-panel border border-line bg-surface p-6 md:p-8`), 모바일 위 정렬(`items-start pt-8 sm:items-center`). 흰 면은 구글 버튼 하나(3.2), 카카오는 카카오 레시피. 오류는 카드 위 상태 메시지. 동의 행 `.chk` + 44px |
| 결제 `/payment/**` | `max-w-reading`, 단계 제목 + 앱 카드(6.7) 안 결제수단 라디오 카드(6.24) + 입력(6.9) + 주 버튼 '카드 등록 및 결제' 하나. 결제 실패는 상태 메시지(6.13), 실패·취소 화면은 상태 화면(6.18) |
| 소개 `/about` | 섹션 머리 ABOUT + 두 톤 h1(핵심어 accent 1곳). 기능·FAQ 는 `divide-y divide-line` 목록(6.21), CTA 는 주 + 보조. 색 소제목(틸·블루·퍼플) 없이 `fg` |
| 계산기 `/tools/calculator` | `max-w-reading`, 단계 01·02 글자 숫자(6.14), 카드 `surface`, 주 버튼 '데이터 가져오기' 하나 + 계산은 보조 하나, 결과 상자 `bg-surface-2` 단색, 고지문 `text-micro text-fg-3`. 새 진입 링크 금지(결정 14) |
| 강의실 `/studio/classroom` · 강의 상세 `/studio/class/[slug]` | 강의실: 왼쪽 커리큘럼 사이드바(6.26, sticky top `var(--nav-h)`) + 오른쪽 플레이어 + 진도 막대(6.23). 강의 상세: 본문 + 오른쪽 구매 카드(sticky top `calc(var(--nav-h)+1rem)`), 구매 = 주 버튼, 문의 = 카카오 버튼, 보조 글자 fg-3 |
| 커뮤니티 글 상세 | `mx-auto max-w-[720px]`, h1 하나, 위 뒤로가기·아래 '목록으로'(6.32, 같은 주소), 본문 이미지 `max-h-[70vh]`, 댓글 아바타 32px(6.30) + 글 작성자 '작성자' 태그 |
| 커뮤니티 글쓰기 | `max-w-[720px]`, 게시판 선택 상자(첫 옵션 '게시판을 선택하세요' disabled) + 에디터 위 상시 툴바 한 줄 + 아래 등록·취소 하단 바(6.25 `BottomCTABar` 또는 sticky + `data-bottom-bar`) |
| 커뮤니티 랭킹 | 기준 설명 한 줄 바로 아래 앱 표 부품, 상위 3위 `text-accent` 600, '좋아요 23'(fg-1), 내 줄 `bg-surface` |
| 약관·환불·개인정보 | `LegalArticle` 틀: `max-w-reading`, 본문 `text-body leading-[1.75] text-fg-2`, h1 `text-h3 md:text-h2 text-fg`, h2 `text-h4`, 목록 `list-outside pl-5`, 링크 `fg` + 밑줄, YouTube API 고지 상자 맨 위 `border-line-strong`, 표 13px 이상 + 상자 안 가로 스크롤. 문장은 바꾸지 않는다 |

---

## 8. 접근성 기준

| 항목 | 기준 | 이 시스템에서 |
|---|---|---|
| 글자 대비 | 4.5:1 이상(18.66px 굵게·24px 이상은 3:1) | 읽는 글자는 `fg-3` 이상(검정 위 6.92). `fg-4`(4.89)는 검정·surface 위 작은 글자 하한, surface-2·3 위에서는 장식만. 기능 색은 모든 면에서 4.5 이상(negative surface-2 위 5.63) |
| UI 구성요소 대비 | 3:1 이상(1.4.11) | 체크박스 `line-control` 4.89. 입력 테두리 `line-strong`(2.03)은 라벨·placeholder·면 차이로 식별되고, 포커스 때 흰 테두리 |
| 색만으로 전달 금지 | 1.4.1 | 등급 라벨, ▲▼, 미터 칸 수, '경쟁 낮음' 글자, 오류 기호 + 문장 |
| 키보드 포커스 | 2.4.7 · 2.4.11 | 전역 `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }` 흰 2px. `outline-none`/`outline-hidden` 을 섞지 않는다(카드 전체 링크만 카드 둘레로 옮김). 입력은 테두리 + 외곽선 합쳐 2px |
| 포커스 순서·건너뛰기 | 2.4.1 | '본문으로 건너뛰기' 링크, `main#main` |
| 터치 크기 | 모바일 주요 대상 44×44px, 최소 24×24 | 버튼 md `h-11`, 칩 `h-10`·`pointer-coarse:h-11`, 메뉴 버튼 `size-11`, 푸터 링크 `h-11 min-w-11`, 세그먼트·정렬·옵트인 `pointer-coarse:h-11`, 남은 횟수 배지 누름 영역 44px, 체크박스 감싼 label 40~44px |
| 현재 위치 | | 링크 `aria-current="page"`, 탭 `aria-selected`, 토글 `aria-pressed`, 정렬 `aria-sort` |
| 장식 | | 영문 라벨·장식 화살표·로고 B·구분 기호 `aria-hidden`. 큰 지표는 `sr-only` 로 읽을 문장 |
| 글자 크기 | | 최소 12px(`text-micro`). 커뮤니티 N 배지 8px 는 3.4 보정 대상 |
| 재배치 | 1.4.10 | 320px 폭에서 가로 스크롤 없음(표는 상자 안 스크롤). 시안은 320~1920 열두 폭에서 넘침 0 |
| 움직임 | 2.3.3 | `prefers-reduced-motion` 에서 전환·등장 효과 끔 |
| 글자 선택 | | `::selection` 실버 바탕 + 검정 글자(12.29) |
| 입력 | | 보이는 라벨, 도움말·오류 `aria-describedby`, 오류 `role="alert"`, 모바일 16px |
| 카카오 버튼 겹침 | | 첫 화면·맨 아래에서 버튼·입력·24px 이상 숫자 가림 0(390×844·375×667·360×780 실측) |

---

## 9. 전환 단계안: `--color-*: initial` 은 언제 켜나

### 9.1 지금 사용 횟수 (2026-10-08, `src/**/*.{ts,tsx,css}` grep, 변형 접두사 포함 클래스 등장 수)

| 기본 팔레트 클래스 | 등장 수 | 파일 수 | 비고 |
|---|---|---|---|
| `neutral-*` | **1,243** | 91 | 많은 순 `text-neutral-400` 240 · `text-neutral-500` 175 · `border-neutral-800` 136 · `bg-neutral-900` 117 · `border-neutral-700` 113 · `text-neutral-300` 90 · `bg-neutral-800` 73(+투명도 24) · `bg-neutral-700` 47 · `hover:bg-neutral-200` 43. 디렉터리별 community 194 · studio 170 · channels 78 · ux-preview 61(로컬 전용, 커밋 제외) |
| `gray/slate/zinc/stone-*` | **1,204** | 62 | 안전망으로 무채색 렌더. admin 196 · search 190 · threads 120 · insights 117 · payment 53 · studio 52 |
| `*-white` | **898** | 147 | `text-white` 636 · `bg-white/α` 90 · `border-white/α` 89 · `bg-white` 57 |
| `*-black` | **230** | 91 | `text-black` 60 · `bg-black` 60 · `bg-black/α` 35 |
| `teal-*` | 304 | 42 | |
| `red-*` | 179 | 50 | |
| `amber/yellow/orange-*` | 177 | 35 | |
| `sky/blue/indigo-*` | 75 | 15 | |
| `green-*` · `emerald-*` · `cyan-*` | 51 · 11 · 6 | 18 · 5 · 2 | |
| `purple/violet/pink/rose/fuchsia/lime-*` | 58 | 18 | 관리자 범주색 포함 |
| **합계** | **약 4,440** | | 321개 ts/tsx 파일 중 다수 |
| 참고: 에메랄드 리터럴 | 75 | 27 | 토큰과 무관하게 남는 하드코딩 |
| 참고: 그라데이션 · `animate-ping/pulse` | 33 · 2 | 8 · 2 | 금지 패턴 |

다시 세는 명령:

```sh
grep -rhoE 'neutral-[0-9]{2,3}' src --include='*.ts' --include='*.tsx' --include='*.css' | wc -l
grep -rhoE '(gray|slate|zinc|stone|teal|cyan|emerald|green|red|amber|yellow|orange|sky|blue|indigo|purple|violet|pink|rose|fuchsia|lime)-[0-9]{2,3}' src --include='*.ts' --include='*.tsx' --include='*.css' | wc -l
grep -rhoE '\b(text|bg|border(-[trblxyse])?|ring(-offset)?|inset-ring|fill|stroke|from|to|via|divide(-[xy])?|outline|decoration|placeholder|accent|caret|shadow|inset-shadow|text-shadow)-(white|black)\b' src --include='*.ts' --include='*.tsx' --include='*.css' | wc -l
```

### 9.2 왜 지금 비우면 안 되나

1. **조용히 깨진다.** Tailwind v4 는 모르는 색 클래스를 오류 없이 그냥 만들지 않는다. 빌드·타입 검사가 통과한 채 약 4,400곳의 색이 사라진다.
2. **사라진 결과가 흉하다.** 글자는 부모 색(흰색)을 물려받아 위계가 무너지고, `border border-neutral-800` 처럼 색만 빠진 테두리는 v4 기본값 `currentColor` 로 그려져 **흰 테두리가 전 화면에 생긴다**. 버튼 hover 면(`hover:bg-neutral-200`)이 없어지고 `bg-black` 면이 투명해진다.
3. **안전망도 같이 사라진다.** `globals.css` 의 gray·slate·zinc 무채색 재정의는 기본 팔레트를 덮는 방식이라, 명시적으로 다시 선언하지 않으면 관리자 화면 1,204곳이 같은 문제를 겪는다.
4. **소유자 예외가 깨진다.** `text-yellow-400`(커뮤니티 노란 강조)도 기본 팔레트라 함께 사라진다.
5. 반대로 **그래파이트 토큰은 neutral 과 같은 값**이라, 기본 팔레트를 남겨 둔 채 토큰으로 옮겨도 화면은 바뀌지 않는다. 비우지 않는 전환 기간의 비용은 '토큰 밖 색을 써도 빌드가 막지 않는다'는 것 하나이고, 이는 검사 스크립트로 막을 수 있다.

### 9.3 단계

| 단계 | 할 일 | 끝났다는 기준 |
|---|---|---|
| **0. 토큰 추가** | 2.2 블록으로 `@theme` 갱신(C01): 새 토큰 추가, `accent` 흰색, `accent-hover`, 제목 굵기 800, `text-title`·`text-ui`, `--container-wide`, `owner-red`·`owner-yellow`. `::selection` 실버. **기본 팔레트는 그대로 둔다.** Pretendard 연결(4.1) | `npx tsc --noEmit`·빌드 통과, 1440·390 캡처에서 에메랄드 자리만 흰색·실버로 바뀌고 나머지 동일 |
| **1. 공용 부품** | `src/components/ui/*`(새 `table.ts`·`list-panel.ts` 포함), `globals.css` 의 `.chk`·`.ext`·`content-auto`, 사용자 화면 로고 4곳, 전역 네비·푸터(`layout.tsx`)를 6장 레시피와 토큰 이름으로 | 부품 파일에서 기본 팔레트 클래스 0 |
| **2. 화면별 이전** | 각 화면 항목에서 2.3 기계 매핑 → 2.4·2.5 판단 매핑 → 6장 레시피. 바꾼 파일은 기본 팔레트 클래스 0 이 완료 기준 | `check-theme.mjs` 를 확장한 규칙(아래)이 바꾼 파일에서 0 |
| **3a. 잔여 0 (C18a)** 완료 | `check-theme.mjs --all` 로 src 전체 잔여를 뽑아(착수 시 파일 목록 고정) 사용자 화면을 0 으로. `InsightsList.tsx` 삭제(2.4) | 허용 목록 밖 default-palette·emerald·blur 0 |
| **3b. 비움 (C18b)** 완료 2026-10-10, 실제 목록은 9.4 | ① 허용 목록 화면이 **실제로 쓰는 색 전부**를 grep 으로 뽑는다(아래 명령). ② `--color-*: initial;` 켜기 ③ 그 바로 뒤에 ①의 색을 **값 그대로 명시 선언**한다: `--color-white`·`--color-black`, 쿨그레이 안전망(gray·slate·zinc → 무채색 값), neutral 단계, 그리고 채도 색 단계(teal·red·green·blue·yellow·orange·amber·purple·violet·pink·sky·emerald 중 쓰는 단계만). `owner-*` 는 토큰이라 영향 없음 ④ 빌드 ⑤ 캡처 전후 비교 + 계산된 색 전수 조사(`_work/colors_audit.py` 방식) | 사용자 화면: 캡처 차이 0, 토큰 밖 계산 색 0. **허용 목록 화면 `/admin`·`/admin/traffic`·`/insights/admin`·`/insights/admin/traffic`·`/community/admin`·`/tmklab-site` 의 initial 전후 캡처 차이 0**(흰 테두리·글자색 소실 0) |
| **4. 잠그기 (C18b)** 완료 2026-10-10 | 기본 팔레트 클래스 규칙을 WARN → ERROR 로, 에메랄드 리터럴 ERROR | 이후 새 코드가 토큰 밖 색을 못 씀 |

`check-theme.mjs` 규칙(단계 1 = C01 에서 WARN 으로 추가, 단계 4 = C18b 에서 ERROR 로 잠금. 아래는 잠근 뒤 값). globals.css 가 허용 목록 화면 때문에 `--color-white`·`--color-black` 을 전역으로 다시 선언하므로, 사용자 화면의 white/black 클래스를 막는 것은 이 규칙뿐이다. 그래서 `border-t-white`·`divide-x-white`·`ring-offset-black` 같은 변이형 접두어까지 잡는다(C18b 1차 수정):

```js
{ level: "ERROR", id: "default-palette", allow: true, re: /\b(?:neutral|gray|slate|zinc|stone|teal|cyan|emerald|green|red|amber|yellow|orange|sky|blue|indigo|purple|violet|pink|rose|fuchsia|lime)-(?:50|[1-9]00|950)\b|\b(?:text|bg|border(?:-[trblxyse])?|ring(?:-offset)?|inset-ring|divide(?:-[xy])?|fill|stroke|outline|decoration|placeholder|accent|caret|from|via|to|shadow|inset-shadow|text-shadow)-(?:white|black)\b/g, msg: "기본 팔레트 (DESIGN.md 2.3 대응표로 토큰에)" },
```

같은 단계에서 더할 규칙(블러). `check-theme` 는 문자열 리터럴만 보므로 `style={{ filter: "blur(6px)" }}` 의 키(`filter`·`backdropFilter`)는 못 보지만 값 문자열 `"blur(6px)"` 은 본다. 그래서 값으로 잡는다:

```js
{ level: "ERROR", id: "blur", allow: true, re: /\b(?:backdrop-)?blur(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|\[[^\]]+\]))?(?![\w-])|\bblur\(/g, msg: "블러 (클래스·인라인 filter 값, DESIGN 1.3)" },
```

**허용 목록**(단계 3 잔여 집계·C01 check-theme 허용 목록·C18b 재선언 대상에 **같은 목록**을 쓴다):
- 관리자 화면 `src/app/admin/**`·`src/app/insights/admin/**`·`src/app/community/admin/**` 와 관리자 미리보기 전용 `src/app/insights/_components/PostRenderer.tsx`(3.3, 구 테마 전체)
- `src/app/tmklab-site/**`(별도 브랜드, 범위 밖. 지금 Tailwind 색 클래스 0 이라 집계에는 안 걸리지만 목록을 맞추려고 넣는다)
- 구글 로고 SVG fill 4색, 대화상자 `backdrop:bg-[rgb(0_0_0/0.8)]`
- `src/app/ux-preview/**`(로컬 전용, git 추적 안 함)

소유자 예외는 `owner-*` 토큰으로 옮겨 두면 허용 목록이 필요 없다.

허용 목록 화면이 쓰는 색 뽑기(2026-10-08: 74개 단계 = gray 256 · slate 127 · neutral 104 · teal 90 · red 68 · purple 17 · green 17 · blue 17 · yellow 13 · orange 9 · amber 7 · violet 6 · pink 3 · sky 2 · emerald 1 곳, 그리고 `text-white` 109 · `bg-white` 74 · `border-white` 64 · `bg-black` 10 · `text-black` 10 · `border-black` 2):

```sh
A="src/app/admin src/app/insights/admin src/app/community/admin src/app/insights/_components/PostRenderer.tsx"
grep -rhoE '\b(neutral|gray|slate|zinc|stone|teal|cyan|emerald|green|red|amber|yellow|orange|sky|blue|indigo|purple|violet|pink|rose|fuchsia|lime)-(50|[1-9]00|950)\b' $A | sort -u   # 재선언할 단계
grep -rhoE '\b[a-z]+-(white|black)\b' $A | sort -u                                                                                                # white·black 사용 여부
```

`initial` 은 `--color-white`·`--color-black` 도 지운다. 위 단계 중 하나라도 빠지면 9.2 처럼 오류 없이 깨진다(흰 테두리, 글자색 소실).

**근거 요약**: 지금 비우면 약 4,400곳이 오류 없이 깨지고(흰 테두리·위계 붕괴), 비우지 않아도 그래파이트 토큰이 neutral 과 같은 값이라 전환 중 화면 차이가 없다. 그래서 '토큰 추가 → 부품 → 화면별 이전 → QA 에서 잔여 0 확인 후 비움 → 잠금' 순서가 위험이 가장 작다.

### 9.4 구현 확정값 (C18b, 2026-10-10)

**`globals.css` 구조**
1. 첫 `@theme`: 글꼴 다음, 색 선언보다 앞에 `--color-*: initial;` 한 줄. 그 뒤가 2.2 토큰(`canvas`~`owner-yellow`)이다.
2. 다음 `@theme` '허용 목록 재선언': 9.3 명령으로 뽑은 허용 목록 화면(3.3)의 색만 값 그대로 다시 선언한다.
   - ① `--color-white: #fff` · `--color-black: #000`
   - ② 쿨그레이 안전망 gray·slate·zinc 50~950 (전과 같은 무채색 oklch 값, 33개)
   - ③ neutral 200·300·400·500·600·700·800·900
   - ④ 채도 색(Tailwind v4.1.18 기본 oklch 값): teal 200·300·400·500·600·800·900·950 · red 200~950(9단계) · green 400·500·700·900 · blue 300·400·500·600·700·900·950 · yellow 400·500 · orange 300·400·700·800·900 · amber 300·400·500 · purple 300·400·500·900·950 · violet 200·400·500 · pink 500 · sky 400 · emerald 400

2026-10-10 집계(9.3 명령): 74단계 = gray 256 · slate 127 · neutral 104 · teal 90 · red 68 · purple 17 · green 17 · blue 17 · yellow 13 · orange 9 · amber 7 · violet 6 · pink 3 · sky 2 · emerald 1 곳. white·black 은 `text-white` 116 · `bg-white` 76 · `border-white` 69 · `bg-black` 13 · `text-black` 12 · `shadow-black` 4 · `from/via/to-black` 4 · `divide-white` 2 · `border-black` 2. 관리자 화면은 클래스를 문자열 조합으로 만들지 않고(`${}-500` 0건), `var(--color-…)` 직접 참조도 0건이라 이 grep 이 전부다.

**검증 결과**
- 컴파일 CSS 비교(켜기 전후, 같은 Tailwind 로 저장소 전체 스캔): 값이 바뀐 규칙 0. 사라진 규칙은 문서(`docs/`·`DESIGN.md`)에만 적힌 5개(`bg-green-600` `bg-neutral-100` `bg-neutral-950` `text-neutral-100` `text-neutral-100/200`)뿐이고 `src` 에서 쓰는 곳 0.
- 계산 스타일 비교: 공개 경로 38개 + 로그인 화면 고정 화면 24개를 1440·390 에서 모든 요소의 색·테두리·외곽선·fill·stroke·그림자를 비교해 124쌍 모두 같음. `/studio`(표시용 쿠키)도 같음.
- 허용 목록 화면: 관리자 부품을 고정 응답으로 그린 로컬 화면(대시보드 5탭·트래픽·인사이트 트래픽·게시판·등급·글 편집기·미리보기) 11상태 1440 계산 스타일 같음, 픽셀 같음(글자 경계 흐림 1건 제외). `/tmklab-site` 1440·390 픽셀 같음. 실제 관리자 화면은 로그인이 필요해 '소유자 확인 대기'(10.1).
- 사용자 화면 토큰 밖 계산 색 0(고정 화면 r04-ui 의 견본 틀 글자만 neutral, 로컬 전용). 색을 정하지 않아 currentColor 로 그려진 테두리 0. 흰 테두리 34곳은 모두 의도된 accent(현재 탭 밑줄·체크박스 선택).

**잠금**: `check-theme.mjs` 의 default-palette·blur 를 ERROR 로 올렸다(emerald 는 이미 ERROR). 허용 목록 파일은 cool-gray/teal·gradient 까지 건너뛴다(구 테마 전체 예외, 3.3). `npm run check:theme` = `--all` 이고 ERROR 0 이어야 한다. white/black 은 globals.css 가 전역으로 다시 선언해 CSS 에서 빠지지 않으므로, 규칙 접두어를 `border-t`·`border-x` 등 변이형, `divide-x/y`, `ring-offset`, `inset-ring`, `inset-shadow`, `text-shadow` 까지 넓혔다(9.3 규칙 블록, C18b 1차 수정). 임의 hex 클래스(`bg-[#…]`)는 아직 검사하지 않는다(사용자 화면 0건, 필요하면 WARN 규칙으로 더한다).

**다시 확인하는 법**(전후 비교 산출물은 커밋하지 않는다. 필요할 때 다시 만든다)
- 컴파일 CSS 비교: `git show <C18b 직전 커밋>:src/app/globals.css` 를 `src/app/` 아래 임시 파일로 두고(같은 폴더라야 `@source`·`@import` 경로가 같다), 그 파일과 지금 `globals.css` 를 저장소 안의 node 스크립트에서 `postcss([require("@tailwindcss/postcss")()])` 로 각각 컴파일해 규칙(선택자 + 선언)을 비교한다. 끝나면 임시 파일을 지운다. 2026-10-14 재실행 결과: 규칙 1993 → 1988, 사라진 규칙은 위 문서 전용 5개, 추가 0, 값이 바뀐 규칙은 `:root` 테마 변수 묶음 하나(빠진 `green-600`·`neutral-100`·`neutral-950` 변수)뿐.
- 화면: 로드된 CSS 에 규칙이 없는 색 유틸리티 클래스와, 테두리 색을 정하지 않아 `currentColor` 로 그려진 테두리를 Playwright 로 세는 검사를 공개 경로·`/studio`·고정 화면(10.1)에 돌린다. 둘 다 0 이어야 한다. 대조로 `text-rose-500` 같은 빠진 클래스를 일부러 넣어 검출되는지 먼저 본다.

**새 색이 필요할 때**: 사용자 화면은 2.1·2.2 에 토큰을 더한다(기본 팔레트 클래스는 CSS 에서 빠지고 검사도 막는다). 허용 목록 화면에서 새 단계를 쓰면 9.3 명령으로 다시 뽑아 재선언 블록에 Tailwind 기본값 그대로 더한다. 되돌릴 때는 C18b 커밋 하나만 되돌리면 비우기 이전으로 돌아간다.

---

## 10. 새 화면 점검표

- [ ] 섹션 머리(실버 영문 라벨) 하나 이상, 두 톤 제목은 4.4 의 두 가지 중 하나.
- [ ] 흰 면 버튼은 한 폴드에 하나 이하. 네비 '시작하기'는 보조.
- [ ] 쓴 색이 모두 2.1 토큰(소유자 예외는 3.4 자리만). 에메랄드·기본 팔레트 클래스 0.
- [ ] 기능 색은 앱 안에서만, 라벨·기호와 함께, 글자·테두리에만(면은 Great 배지만).
- [ ] 유튜브 빨강은 ↗ hover·로고에만. 오류는 negative.
- [ ] 금지 패턴 0: 그라데이션·글로우·블러·틸·쿨그레이·펄스·아이콘 상자·원형 숫자 배지·이모지·화면 문구 `—`·알약 CTA·그림자.
- [ ] 사진은 무채색 보정판, 사진 위 글자는 단색 막.
- [ ] 읽는 글자 `fg-3` 이상(surface-2·3 위), 최소 12px, 숫자 `tnum`.
- [ ] 포커스 링 흰 2px 가 모든 대화형 요소에 보임, 모바일 터치 44px.
- [ ] 1440·390(필요하면 320·768·1024·1280) 캡처에서 가로 넘침 0, 콘솔 오류 0, 카카오 버튼 가림 0.
- [ ] 로그인 화면은 10.1 의 고정 화면으로 검증, 소유자 크롬이 필요한 확인은 '소유자 확인 대기'로 보고.
- [ ] `node scripts/ux/check-theme.mjs` ERROR 0, `node scripts/ux/check-invariants.mjs` → INVARIANTS_OK, `npx tsc --noEmit` 오류 0.

### 10.1 로그인 화면 · 운영 데이터 화면 검증

구현 에이전트는 소유자 크롬(로그인 세션)을 쓸 수 없고, 써서도 안 된다. 그래서 로그인해야 보이는 화면은 아래 순서로 검증한다.

1. **ux-preview 고정 데이터 화면이 먼저다.** `src/app/ux-preview/<이름>/page.tsx` 는 부품에 고정 props 를 넘겨 그리는 로컬 전용 화면이다(git 추적 안 함, 서버 데이터·인증·외부 API 호출 0). **지우지 않는다**(추적되지 않아 지우면 되돌릴 수 없다). 안 쓰는 화면 정리는 소유자 승인 뒤 `src/app/ux-preview/_archive/` 로 옮기기만 한다. 로그인 화면을 바꾸는 항목은 그 화면의 고정 화면을 **changes 에서 직접 만들고** acceptance 를 그 화면 기준으로 쓴다.

| 고정 화면 | 보는 것 | 만드는 항목 |
|---|---|---|
| `/ux-preview/r04-ui` | 공용 부품 견본(버튼·카드·배지·칩·탭·입력·`.chk`·`.ext`·표·목록 패널·로고) | C01(견본 추가) |
| `/ux-preview/r05-dialog` | 대화상자 셸 | 있음 |
| `/ux-preview/r02a-empty` · `r02a-limit/[state]` | 검색 시작 화면·한도 상태 | 있음 |
| `/ux-preview/r03-tables` | 검색 결과 표·목록·선택 바·분석 도구 줄·잠금 버튼·결과 아래 카드 | 있음(C14 가 새 부품으로 갱신) |
| `/ux-preview/r14-saved/[state]` | `/saved` 목록·빈 상태·수집 실패 토스트·삭제 실패 되돌림 | C14(신규) |
| `/ux-preview/r02b-dashboard` | 내 채널 분석 히트맵·차트·범례 | 있음 |
| `/ux-preview/r10-community-sidebar` | 커뮤니티 사이드바 현재 게시판·sticky·소유자 예외 | C10(신규) |
| `/ux-preview/r11-post` · `r11-write` | 글 상세(720 폭·댓글·답글·오류) · 글쓰기(툴바·하단 바) | C11(신규) |
| `/ux-preview/r16-threads/[state]` | 스레드 지표·차트·오류·수집함 | C16(신규) |
| `/ux-preview/r01-mypage/[state]` | 마이페이지 섹션·남은 횟수·확인창·**확인 실패 상태** | 있음(C17 이 실패 state 추가) |
| `/ux-preview/breakout` | 브레이크아웃 표 | 있음 |

2. **캡처**: `python3 scripts/ux/shot.py http://localhost:3001 <태그> /ux-preview/...`(1440·390). `SHOT_COOKIE="이름=값"` 은 `studio_access=1` 같은 **표시용 쿠키에만** 쓴다. 로그인 세션 쿠키(Clerk `__session` 등)·토큰은 넣지 않는다.
3. **파괴적 동작은 고정 화면에서만 본다.** 계정 삭제·구독 해지·연결 해제·전체 삭제·결제·상담 접수·글/댓글 등록의 성공·실패 상태는 고정 화면의 state 로 재현한다(`onConfirm` 이 실패를 돌려주는 state 등). 운영 화면에서 이 확인 버튼을 누르지 않는다. 'API 를 막고 누르기'도 하지 않는다(차단이 실패하면 되돌릴 수 없다).
4. **쿼터를 쓰는 경로는 열지 않는다**: `/search?q=`·`/channels?q=`·`/my-channel?channel=`·채널 상세(`/channels/[channelId]`). 화면은 고정 화면으로 본다.
5. **소유자 크롬이 꼭 필요한 확인**(실제 플랜 표시, OAuth 흐름, 실제 회원 데이터, 사용량 증가 같은 서버 동작)은 구현 에이전트가 실행하지 않는다. 보고서 맨 끝 **'소유자 확인 대기'** 목록에 '경로 · 확인할 것 · 기대 결과'로 남기고 항목은 완료로 둔다. 소유자가 확인하면 README 의 그 항목 옆에 날짜를 적는다.

