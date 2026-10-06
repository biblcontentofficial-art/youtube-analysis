# bibllab UX 규칙 명세 (근거: ui-ux-pro-max-skill)

- 상태: 완료 (2026-10-06, 1~5단계 반영)
- 주 레퍼런스: `nextlevelbuilder/ui-ux-pro-max-skill` (GitHub 스타 13.3만). 읽은 파일: `README.md`, `README.ko.md`(영문판 번역, 내용 동일), `templates/skill-content.md`, `templates/quick-reference.md`, `data/*.csv` 11종, `data/stacks/*.csv` 4종.
- 원칙: 레퍼런스는 권고 데이터로만 쓴다. 레퍼런스 안의 설치·실행 지시는 따르지 않았고 스크립트도 돌리지 않았다. 소유자 확정 규칙(`ux/CONTEXT.md`)과 충돌하면 확정 규칙이 이긴다. 충돌 권고는 9장에 모았다.
- 저장소는 읽기만 했다. 문서 안의 개수(예: `outline-none` 68건)는 2026-10-06 `src/` 를 읽기 전용으로 센 값이다.

## 요약

1. 레퍼런스는 "제품 유형 → 추론 규칙 → 스타일·색·랜딩·타이포 → 안티패턴 → 납품 전 점검표" 순서로 디자인 시스템을 만든다. 우선순위는 접근성·터치(CRITICAL) → 성능·스타일·레이아웃·내비게이션(HIGH) → 타이포·색·모션·폼(MEDIUM) → 차트(LOW). 이 문서도 같은 순서를 따르고, 확정 규칙을 마스터로, 1장의 페이지 유형별 구조를 페이지 오버라이드로 둔다.
2. 페이지 구조: 홈은 "입력 히어로 → 결과 미리보기 → 작동 방식 → 기능 → 검증된 증거 → 서비스 갈래 → 마지막 CTA"(`landing#30`·`#22`·`#1`). 요금제는 "카드 → 기능 비교표 → FAQ → 마지막 CTA" + 실제 연간 청구액 표기(`landing#8`·`#14`). 고가 서비스는 "신뢰 히어로 → 증거 → 문제 → 과정 → 비교 → 사례 → 후기 → 투명한 가격 → FAQ → 짧은 폼" + 챕터 끝 미니 CTA(`landing#33`·`#10`, `reasoning#5`·`#69`·`#79`). 모집 제안서는 "기한·자격·절차·증거·보낼 내용"(`reasoning#178`, `landing#5`). 커뮤니티는 훑기 쉬운 목록·답글 입력·반응·운영 표시(`reasoning#164`). 데이터 화면은 필터·정렬·내보내기·드릴다운(`reasoning#7`).
3. 가장 큰 효과를 내는 전역 수정은 `globals.css` 한 곳에 모인다: 순수 블랙 배경 변수, 레이어 밖 `:focus-visible` 윤곽(현재 `outline-none` 68건, `focus-visible` 0건), reduced-motion 규칙(현재 0건), 한국어 `keep-all` 줄바꿈(현재 0건), 버튼 커서 복구(Tailwind v4), 의미 색 토큰, 고정 헤더만큼의 `scroll-padding`.
4. 대비: 검정·카드 위의 일반 글자는 `neutral-400` 이상이어야 한다. `neutral-500` 은 4.44/3.79, `neutral-600` 은 2.69/2.30 으로 미달이다(현재 각각 133건, 29건). 입력 경계는 `neutral-500`(3:1 충족).
5. 모션은 Subtle 단계만, 한 화면 1~2개, 레이아웃 속성 대신 transform·opacity·색 전환만. `[data-animate]` 는 JS 없이도 보이게 하고 reduced-motion 에서 최종 상태를 보여 준다. 마퀴는 일시정지 버튼.
6. 스타일은 Minimalism & Swiss, Dark Mode(OLED), Accessible & Ethical, Flat, Data-Dense Dashboard 에서 맞는 항목만 가져오고, 글래스·오로라·그라데이션·글로우·펄스·네온·다색 팔레트·제품 유형별 추천 스타일은 채택하지 않는다.
7. 차트는 에메랄드 주 계열 + neutral 비교 계열(선 모양으로 구분) + 의미색(부호·화살표 병기). 기능색은 "뜻이 있고, 글자로도 전하고, 대비를 만족할 때"만 유지하며 틸은 에메랄드, 노랑은 앰버로 옮긴다.
8. 데이터셋의 Next.js 규칙은 16.2, Tailwind 규칙은 4.3 기준이다. 저장소(Next 14.2.35, React 18.2, Tailwind 4.1.18)에 없는 기능과 의존성 추가가 필요한 shadcn 설치 규칙은 쓰지 않는다.

## 0. 레퍼런스 구조와 읽는 법

### 0.1 데이터 구조

| 도메인 | 파일 | 규모 | 한 행에 들어 있는 것 |
|---|---|---|---|
| 제품 유형 | `products.csv` | 192행 | 제품 유형, 1·2순위 스타일, 랜딩 패턴, 대시보드 스타일, 색 초점, 핵심 고려 사항 |
| 추론 규칙 | `ui-reasoning.csv` | 192행 (제품 유형과 1:1) | 권장 패턴, 스타일 우선순위, 색·타이포 무드, 핵심 효과, 결정 규칙(JSON: `must_have`, `if_…`), 안티패턴, 심각도 |
| 랜딩 패턴 | `landing.csv` | 34행 | 섹션 순서, 주 CTA 위치, 색 전략, 권장 효과, 전환 최적화, Pattern ID, 별칭 |
| 스타일 | `styles.csv` | 88행 (검색 가능 79, active 50) | 스타일 키워드, 효과, 적합·부적합 용도, 라이트/다크 적합, 성능, 접근성, 구현 체크리스트, 상태(active·supplemental·deprecated) |
| 색 | `colors.csv` | 192행 (제품 유형과 1:1) | Primary·On Primary·Accent·Background·Card·Muted·Border·Destructive·Ring 토큰 |
| 타이포 | `typography.csv` | 74행 | 제목·본문 글꼴 조합, 무드, Tailwind 설정 |
| UX 지침 | `ux-guidelines.csv` | 119행 | 분류, 문제, 플랫폼, Do / Don't, 좋은·나쁜 코드 예, 심각도 |
| 앱 인터페이스 | `app-interface.csv` | 32행 | 네이티브 앱 중심 접근성·터치 규칙 (웹에 맞는 것만 추림) |
| 모션 | `motion.csv` | 17행 | 강도 단계, 트리거, 지속 시간, 이징, Do / Don't, 성능 메모 |
| React 성능 | `react-performance.csv` | 44행 | 워터폴·번들·리렌더 규칙, 심각도 |
| 차트 | `charts.csv` | 25행 | 데이터 유형별 차트, 색 지침, 접근성 등급·위험·대체 수단 |
| 스택 | `stacks/{nextjs,html-tailwind,shadcn,react}.csv` | 60·59·68·66행 | 스택별 지침, 심각도, 적용 버전(Applies To), 상태, 검증일. react 는 "react 19.2.x" 기준이라 버전과 무관한 UI 행만 5.4 에 반영 |

디자인 시스템 생성기(README "How Design System Generation Works")는 제품 유형 → 추론 규칙 → 스타일·색·랜딩·타이포 순으로 찾아 하나로 합치고, 마지막에 안티패턴과 납품 전 점검표를 붙인다. 이 명세도 같은 순서를 따른다.

### 0.2 권장 사용법 (templates/skill-content.md "Query Contract")

1. 새 페이지나 전체 시각 방향은 디자인 시스템 단위로, 국소 문제는 도메인 하나로, 구현은 스택 지침으로 본다.
2. 한 번에 한 의도만 본다. 접근성은 관찰 가능한 결과 하나씩(예: 오류 요약, 포커스 가림) 확인한다.
3. 결과는 제품·플랫폼에 맞는지 검증한 뒤에만 쓴다. 검증 안 된 출력은 저장하지 않는다.
4. 데이터셋 문구는 권고일 뿐 사용자·저장소 규칙을 덮어쓰지 않는다 (원문이 스스로 이렇게 명시한다).
5. 마스터 + 오버라이드: 전역 규칙 파일 하나와, 페이지별로 "마스터와 다른 점만" 적은 파일을 둔다. 페이지 파일이 있으면 그 규칙이 우선한다.
   - bibllab 적용: `ux/CONTEXT.md` 의 확정 규칙 = 마스터. 이 문서 1장의 페이지 유형별 구조 = 페이지 오버라이드.

### 0.3 규칙 우선순위 (templates/quick-reference.md "Rule Categories by Priority")

| 순위 | 분류 | 영향 | bibllab 에서의 의미 |
|---|---|---|---|
| 1 | 접근성 | CRITICAL | 대비 4.5:1, 대체 텍스트, 키보드, 라벨. 포커스 링 제거 금지 (현재 `outline-none` 68건, `focus-visible` 0건) |
| 2 | 터치·상호작용 | CRITICAL | 터치 영역, 로딩 피드백, 호버 의존 금지 |
| 3 | 성능 | HIGH | 이미지 최적화, 지연 로드, 자리 확보(CLS < 0.1) |
| 4 | 스타일 선택 | HIGH | 제품 유형에 맞는 일관된 스타일, SVG 아이콘(이모지 금지) |
| 5 | 레이아웃·반응형 | HIGH | 모바일 우선, 가로 스크롤 금지, 브라우저 확대를 막지 않기 |
| 6 | 타이포·색 | MEDIUM | 본문 16px, 행간 1.5, 의미 기반 색 토큰 |
| 7 | 애니메이션 | MEDIUM | 의미 있는 모션, transform/opacity 만, reduced-motion |
| 8 | 폼·피드백 | MEDIUM | 보이는 라벨, 필드 옆 오류, 단계적 공개 |
| 9 | 내비게이션 | HIGH | 예측 가능한 뒤로가기, 딥링크, 현재 위치 표시 |
| 10 | 차트·데이터 | LOW | 범례, 툴팁, 색만으로 의미 전달 금지 |

### 0.4 범위 주의

- `skill-content.md` 의 "Common Rules" 와 "Pre-Delivery Checklist" 는 원문이 직접 "App UI(iOS/Android/React Native/Flutter) 범위"라고 적어 두었다. 웹은 Quick Reference §1~§3(CRITICAL + HIGH)을 최종 점검으로 쓰라고 한다.
- 세이프 에어리어, 햅틱, 하단 탭 바, Dynamic Type 은 네이티브 앱 전용이다. bibllab 웹에는 대응하는 웹 기준(브라우저 확대 200%, 웹 포인터 타깃 24×24 CSS px, 터치 기준 44px)으로 바꿔 적용한다.

### 0.5 근거 표기법

`파일#행번호 식별자` 형식. 행번호는 각 CSV 의 `No` 열이다.
- `landing#1 hero-features-cta`, `reasoning#164 Forum / Discussion Board`, `products#7 Analytics Dashboard`
- `ux#N 문제명`(ux-guidelines), `app#N`(app-interface), `motion#N`, `react#N`(react-performance), `rstack#N`(stacks/react), `next#N`(stacks/nextjs), `tw#N`(stacks/html-tailwind), `shadcn#N`, `styles#N 스타일ID`, `type#N`, `colors#N`, `charts#N`
- `QR §n 규칙키`(quick-reference.md), `SC`(skill-content.md), `README`

## 1. 페이지 유형별 권장 구조

공통 해석 원칙
- 데이터셋의 "섹션 순서·CTA 위치·전환 요소"만 가져온다. 같은 행의 색 전략·효과(글로우, 그라데이션, 패럴랙스, 펄스, 글래스)는 9장 기준으로 걸러 낸다.
- 숫자·후기·활동량은 "현재값이고, 검증됐고, 날짜가 있을 때만" 보여 준다. 이 조건은 `landing#12`, `landing#20`, `landing#23`, `landing#24`, `landing#34` 의 전환 최적화 열에 반복해서 나온다. 고정 숫자("10,000+")나 상시 "마감 임박"은 이 조건을 어긴다.
- 스크롤 연출이 있는 패턴은 모두 "연출 없이도 이야기가 읽히고, reduced-motion 에서는 최종 상태를 정적으로 보여 줄 것"을 전제로 한다(`landing#10`, `landing#27`, `landing#28`, `landing#32`). 현재 `globals.css` 의 `[data-animate] { opacity: 0 }` 은 JS 실행 전과 reduced-motion 에서 내용을 숨기므로 이 전제와 맞지 않는다.

### (가) SaaS 도구 랜딩: 홈 `/`, 트렌드 서치 `/trend-search`

근거
- `reasoning#1 SaaS (General)`: 권장 패턴 Hero + Features + CTA, 효과 "Subtle hover (200-250ms) + Smooth transitions", 결정 규칙 `if_ux_focused → minimalism-and-swiss-style`, 안티패턴 "Excessive animation".
- `landing#1 hero-features-cta`: Hero > 가치 제안 > 핵심 기능 3~5개 > CTA 섹션 > 푸터. 주 CTA 는 Hero + 하단.
- `products#2 Micro SaaS`: 랜딩 "Minimal & Direct + Demo", "Keep simple, show product quickly. Speed is key."
- `landing#22 marketplace-directory`: "Search is the primary CTA. Reduce friction with useful suggestions."
- `landing#30 ai-driven-dynamic-landing`: 입력창 Hero > 결과 미리보기 > 작동 방식 > 가치 제안. "Immediate value demonstration. 'Show, don't tell'. Low friction start."
- `landing#31 feature-rich-showcase`: 기능 카드 4~6개, "One key message per card. Strong CTA repetition."

홈 `/` 권장 순서

| 순서 | 섹션 | 이유 (근거) | 현재 |
|---|---|---|---|
| 1 | Hero: 헤드라인 + 서브카피 + 키워드 검색창(주 CTA) + 예시 키워드 칩 | 검색이 곧 주 행동이고, 예시 칩이 "유용한 제안"으로 마찰을 줄인다 (`landing#22`, `landing#30`) | 있음. 유지 (home 보고서 "유지할 점 1") |
| 2 | 결과 미리보기: 실제 검색 결과 화면 한 장(정적 캡처 또는 샘플 표) | 가입 전에 무엇을 얻는지 보여 준다 (`landing#30` "Generated Result Preview", `landing#3` 중앙 목업, `products#2` "show product quickly") | 없음 (추가) |
| 3 | 작동 방식 3단계 | 시작 비용이 낮다는 것을 보여 준다 (`landing#30` "How it Works") | "3단계로 바로 시작" 있음. 순서만 앞으로 |
| 4 | 핵심 기능 3~5개 (카드당 메시지 하나) | `landing#1` 3~5개, `landing#31` "One key message per card" | 있음 |
| 5 | 증거: 검증 가능한 수치(날짜·출처 표기) 또는 실제 채널 사례 | 사회적 증거는 CTA 앞에 둔다 (`landing#2` "Social proof before CTA"). 수치는 검증·날짜 조건 (`landing#12/#20/#23`) | "소셜 프루프" 카운트업 있음. 고정값이면 날짜·출처를 붙이거나 정성 증거로 교체 |
| 6 | 서비스 갈래 안내: 컨설팅·대행·커뮤니티·인큐베이팅으로 가는 카드 | 데이터셋 규칙이 아니라 bibllab 보정. 상단 메뉴 5개 중 4개가 본문에 없다는 home 보고서 발견을 반영 | 없음 |
| 7 | 마지막 CTA: 검색 다시 시작 또는 요금제 | Hero + 하단 반복 (`landing#1`, `landing#31` "Strong CTA repetition") | "요금제 CTA" 있음 |

트렌드 서치 `/trend-search` 권장 순서
1. 제목 + 한 줄 설명 + (가능하면) 바로 쓰는 검색창: 허브에서도 주 행동은 검색 (`landing#22`).
2. 도구 카드 그리드: 카드 전체가 링크, 플랜 잠금은 테두리 배지 + 텍스트로 (색만으로 표시 금지, `QR §1 color-not-only`).
3. 플랜 안내 한 줄과 요금제 링크: 잠금의 이유를 숨기지 않는다 (`QR §9 empty-nav-state` "explain why instead of silently hiding").

유형 안티패턴: 과한 애니메이션(`reasoning#1`), 꾸밈 위주 디자인·필터 없음(`reasoning#7`), 느린 성능·복잡한 온보딩(`reasoning#16`).

### (나) 요금제 `/pricing`

근거
- `landing#8 pricing-page-cta`: Hero > 가격 카드 > 기능 비교표 > FAQ > 마지막 CTA. 카드마다 CTA + 네비의 고정 CTA. "Highlight the plan that matches the intended audience and show actual annual savings transparently. Use FAQs to address concerns."
- `landing#14 pricing-focused-landing`: Hero(가치 제안) > 카드 3단 > 기능 비교 > FAQ > 마지막 CTA. "Show actual monthly and annual totals and savings transparently."
- `reasoning#71 Membership/Community`: `must_have: member-benefits, pricing-tiers`, 안티패턴 "Hidden benefits".

권장 순서

| 순서 | 섹션 | 이유 (근거) | 현재 |
|---|---|---|---|
| 1 | 헤더: 한 줄 가치 제안 + 월간/연간 토글 | `landing#14` Hero(가치 제안) | 있음 |
| 2 | 가격 카드: 추천 플랜 강조, 카드마다 CTA, 연간 선택 시 "실제 청구액(연 ₩180,000 일시 결제)"과 절약액을 카드 안에 | `landing#8`, `landing#14` "actual monthly and annual totals" | 카드 있음. 연간 실제 청구액이 카드에 없음 (pricing-03) |
| 3 | 기능 비교표: 플랜별 한도·기능을 한 표로 | `landing#8`, `landing#14` 모두 카드 다음에 비교표 | 없음 (추가) |
| 4 | FAQ: 환불·해지·한도 소진 시 동작 등 반론 처리 | `landing#8` "Use FAQs to address concerns" | 있음 (7문항) |
| 5 | 마지막 CTA: 무료로 시작 또는 추천 플랜 | `landing#8`, `landing#14` 모두 Final CTA | 없음 (추가) |

전환 요소: 추천 플랜 1개만 강조(`QR §4 primary-action` 화면당 주 CTA 하나), 실제 총액·절약액 표기, 해지·환불 조건을 카드 근처에.
색 전략 열의 "Free 회색, Starter 파랑, Pro 초록/금색"은 채택하지 않는다 (9장). 추천 플랜은 현재처럼 화이트 테두리 + 화이트 배지 + 화이트 CTA, 명도로만 구분한다.

### (다) 고가 서비스 세일즈: `/studio`(채널 대행 월 350만), `/studio/class/consulting`(1:1 컨설팅 월 49만)

근거
- `reasoning#5 B2B Service`(키워드에 consulting·advisory·roi 포함): 패턴 "Feature-Rich Showcase + Trust", 스타일 "Accessible & Ethical + Minimalism & Swiss Style", `must_have: case-studies, roi-messaging`, 안티패턴 "Hidden credentials + AI purple/pink gradients". `products#5` "Credibility essential. Clear ROI messaging."
- `reasoning#69 Marketing Agency`: `must_have: portfolio, results-metrics`, 안티패턴 "Hidden work". 스타일(Brutalism + Motion-Driven)은 채택하지 않음.
- `reasoning#79 Coding Bootcamp`(고가 교육 프로그램의 가장 가까운 유형): 스타일 "Dark Mode (OLED) + Minimalism & Swiss Style", `must_have: curriculum, career-outcomes`, 안티패턴 "Hidden results". `products#79` "Curriculum. Projects. Career outcomes. Alumni. Pricing. Application."
- `landing#33 trust-authority-conversion`: Hero(신뢰) > 증거(로고·인증·수치) > 해법 개요 > 명확한 CTA 경로. 주 CTA 는 문의/견적, "Accent for CTA only", "Case studies. Transparent pricing. Low-friction form."
- `landing#10 scroll-triggered-storytelling`: 도입 > 문제 > 과정 > 해법 > 마지막 CTA, "End of each chapter (mini) + Final climax CTA".
- `landing#2 hero-testimonials-cta`: "Social proof before CTA. Use a concise set of verified testimonials with photo, name, and role."
- `landing#13 comparison-table-focus`: 비교표 다음에 CTA, "Be factual."
- `landing#7 lead-magnet-form`: "Ask only for information necessary".

채널 대행 `/studio` 권장 순서 (studio 보고서가 확인한 현재 설득 순서 "문제 → 증거 → 과정 → 차별점 → 후기 → 소개 → 가격 → FAQ → CTA"를 유지하고 CTA 와 증거 위치만 보정)

| 순서 | 섹션 | 이유 (근거) | 챕터 끝 미니 CTA |
|---|---|---|---|
| 1 | Hero: 누구를 위한 무엇인지 + 주 CTA "채널 대행 문의하기" + 보조 "과정 보기" | `landing#33` Hero, 주 CTA 는 문의 | 주 CTA |
| 2 | 증거 띠: 출처·기간을 밝힌 실측 지표 + 실제 채널 | `landing#33` "Proof (stats)", `reasoning#69` results-metrics, 검증·날짜 조건 | 없음 |
| 3 | 문제: 기존 대행사의 구조적 문제 | `landing#10` Chapter 1 (problem) | 있음 |
| 4 | 과정 7단계 | `landing#33` 해법 개요, `landing#10` journey | 있음 |
| 5 | 비교표 | `landing#13` 비교 다음 CTA, 사실만 | 있음 (표 바로 아래) |
| 6 | 포트폴리오: 실제 채널 카드와 전후 지표 | `reasoning#5` case-studies, `reasoning#69` portfolio | 없음 |
| 7 | 후기: 사진·이름·역할이 있는 검증된 후기, 짧게 | `landing#2` | 있음 (후기 직후, `landing#2` "CTA after social proof") |
| 8 | 가격: 금액·부가세·포함 범위·조건 + CTA | `landing#33` "Transparent pricing", `landing#14` 총액 투명성 | 있음 (현재 가격 카드에 CTA 가 없다, studio-07) |
| 9 | FAQ | 반론 처리 (`landing#8`) | 없음 |
| 10 | 마지막 CTA + 짧은 문의 폼 | `landing#33` "Low-friction form", `landing#7` 필요한 정보만 | 주 CTA |

- 모바일: 하단 고정 CTA 1개 (`landing#1` "Hero (sticky)", `landing#14` "Sticky CTA"). `/studio/class/consulting` 은 이미 있음, `/studio` 는 없음(studio-06).
- 마퀴·로고 띠·후기 캐러셀: 일시정지 버튼, 포커스·호버·reduced-motion 에서 정지, 화면 밖에서 정지 (`landing#2`, `landing#25`, `landing#33`).

1:1 컨설팅 `/studio/class/consulting` 권장 순서 (현재는 Hero + 상세 이미지 7장 + 하단 CTA + 모바일 고정 CTA)

| 순서 | 섹션 | 이유 (근거) |
|---|---|---|
| 1 | Hero: 대상, 형식(1:1·기간), 월 금액, 주 CTA "1:1 팀비블 신청하기"(외부 결제로 이동한다는 안내 포함) | `landing#33` Hero + 투명한 가격 |
| 2 | 결과: 수강생 채널의 전후 지표(출처·기간) | `reasoning#79` career-outcomes, 안티패턴 "Hidden results" |
| 3 | 진행 방식(커리큘럼): 주차별 또는 단계별 | `reasoning#79` curriculum |
| 4 | 후기: 사진·이름·채널명 | `landing#2` |
| 5 | 가격·포함 범위·환불 조건 + CTA | `landing#33`, `landing#14` |
| 6 | FAQ + 마지막 CTA | `landing#8` |

- 상세 이미지 7장에 담긴 문구는 대체 텍스트가 "상세 1~7"뿐이라 화면 낭독기·검색·번역·확대에서 내용이 사라진다 (3장 접근성 `alt-text`). 최소한 이미지마다 핵심 문구를 요약한 대체 텍스트를 넣고, 장기적으로 가격·구성·환불 조건은 HTML 텍스트로 옮긴다.

### (라) 모집 제안서: 브랜드 인큐베이팅 `/incubating`

근거 (데이터셋에 "모집 제안서" 유형은 없어 지원·선발형 행을 조합)
- `reasoning#178 Grant / Funding Portal`: `must_have: opportunity-cards, eligibility-checker, deadline-countdown, application-wizard, status-tracker`, 안티패턴 "No deadlines + no eligibility clarity + buried docs", 이유 "deadline visibility, eligibility clarity, and a strong evidence trail". `products#178` "Document checklist. Review status tracker."
- `reasoning#47 Job Board/Recruitment`: 안티패턴 "Outdated forms".
- `reasoning#79 Coding Bootcamp`: curriculum, career-outcomes, application.
- `landing#5 funnel-3-step-conversion`: Hero > 1단계(문제) > 2단계(해법) > 3단계(행동) > CTA, "Progressive disclosure. Show only essential info per step. Use progress indicators. Multiple CTAs."
- `landing#24 webinar-registration`: "State the event time and timezone in text. Claim limited seats ... only when current capacity ... is verified".
- `landing#7 lead-magnet-form`: 필요한 정보만 요청.

권장 순서 (본문은 커뮤니티 글을 그대로 렌더하므로, 2~6은 글 내용 구성 가이드이고 1·7·모바일 CTA 는 페이지 틀에서 처리)

| 순서 | 섹션 | 이유 (근거) |
|---|---|---|
| 1 | Hero: 모집 분야(영어·수학) + 한 줄 제안 + 주 CTA "오픈채팅으로 지원하기" + 모집 기한이 있으면 날짜를 텍스트로 | `reasoning#178` 기한 가시성, `landing#24` 시간은 텍스트로. 현재 CTA 는 맨 아래에만 있음 |
| 2 | 지원 자격: 누구를 찾는지 | `reasoning#178` eligibility clarity |
| 3 | 역할 분담: 레이블이 하는 일(기획·제작·마케팅·상품화) / 선생님이 하는 일 | `landing#5` 2단계(해법) |
| 4 | 진행 절차: 지원 → 미팅 → 계약 → 런칭, 단계 표시 | `landing#5` 진행 표시, `reasoning#178` application-wizard·status-tracker |
| 5 | 증거: 비블 채널 실적, 진행 사례 | `reasoning#178` evidence trail, `reasoning#79` outcomes |
| 6 | 지원 방법: 보낼 내용 목록(분야, 커리어, 운영 채널, 학원, 소개) | `products#178` Document checklist, `landing#7` 필요한 정보만 |
| 7 | 마지막 CTA: 오픈채팅(주) + 메일(보조) | `landing#5` Multiple CTAs |

- 모바일 하단 고정 CTA 를 둔다 (컨설팅 페이지와 같은 방식).
- 상시 "마감 임박" 같은 근거 없는 긴급성 표현은 쓰지 않는다 (`landing#12` "without fabricated scarcity").

### (마) 회원 커뮤니티: 피드 `/community`, 글 상세 `/community/[board]/[id]`, 글쓰기 `/community/write`

근거
- `reasoning#164 Forum / Discussion Board`: 스타일 "Dark Mode (OLED) + Flat Design", 색 "Dark neutral + topic accent colors + unread indicator + reputation badge", 타이포 "Readable + Community-first", 효과 "Thread expand/collapse + Reply composer cues", `must_have: thread-list, reply-composer, vote-signals, moderation-tools, user-badges`, `if_content_focused: prioritize-clarity`, 안티패턴 "No moderation cues + cluttered threads + hidden post state", 이유 "scan-friendly threads, reputation cues, and visible moderation states".
- `products#164`: 랜딩 패턴 "Feed + Thread View", "Thread list with pagination. Rich text editor. Quote/mention system. Upvote/downvote. User badges. Moderation tools."
- `reasoning#184 Q&A Community Platform`: `must_have: tag-filter, bookmark-save`, 안티패턴 "poor vote clarity".
- `reasoning#71 Membership/Community`: 안티패턴 "Hidden benefits + No community proof".
- `landing#20 community-forum-landing`: 가치 제안 Hero > 인기 주제 > 활동 회원 > 가입 CTA. 회원 수·활동량은 현재값·검증·날짜 조건.

비회원 게이트(`src/app/community/_components/CommunityGate.tsx`)
- 커뮤니티 레이아웃이 비로그인 방문자에게 모든 하위 경로(소개 `/community/about` 포함) 대신 이 게이트만 그린다(`community/layout.tsx:44-53`). 따라서 비회원이 보는 커뮤니티 랜딩은 게이트 하나다. 회원 전용·noindex 는 불변 조건이므로 게이트 안에서만 구성한다.
1. 커뮤니티가 주는 것(가치 제안) → 2. 게시판 이름 목록(현재 `categories` 로 전달됨, 글 제목·내용은 노출 금지) → 3. 회원 혜택·등업 조건 → 4. 가입·로그인 CTA. (`landing#20`, `reasoning#71` "Hidden benefits" 방지)
- 회원 수·활동량을 보여 주려면 현재값·날짜를 함께 (`landing#20`).

피드 `/community`
1. 배너는 첫 화면을 다 차지하지 않게 낮추고, 글 상세·글쓰기·랭킹에서는 빼거나 한 줄로 줄인다 (`QR §5 content-priority` "Show core content first on mobile").
2. 게시판 탭 / 카테고리 칩 + 정렬: `reasoning#184` tag-filter.
3. 검색 (현재 서버 GET 폼, 유지).
4. 글 목록: 제목, 게시판, 작성자와 등급 배지, 댓글·좋아요 수, 시간, 첨부 표시, 공지·고정 표시. 한 줄에서 훑어볼 수 있게 (`reasoning#164` scan-friendly, "hidden post state" 방지).
5. 페이지네이션 (`products#164`).

글 상세
1. 목록으로 돌아가기 (이전 스크롤·필터 유지, `QR §9 state-preservation`).
2. 헤더: 제목, 게시판, 작성자·배지, 시간.
3. 본문: 읽기 폭 `max-w-prose`(65ch, 한글 약 36자)~`max-w-2xl`, 행간 1.5~1.75 (`QR §6 line-length`, `line-height`. 65~75자는 라틴 기준이라 6.2 에서 한글로 환산).
4. 첨부: 이미지는 높이 상한 + 눌러서 원본 보기. 세로로 긴 휴대폰 캡처가 화면 2장을 넘지 않게 (CONTEXT 확인 사실).
5. 반응(좋아요): `reasoning#164` vote-signals.
6. 댓글 + 댓글 입력기: `reasoning#164` reply-composer.
7. 운영자에게만 보이는 관리 상태(숨김·신고 등)는 숨기지 말고 표시: `reasoning#164` moderation cues.

글쓰기
1. 게시판 선택 → 제목 → 본문 → 첨부 → 등록. 라벨은 보이게 (`QR §8 input-labels`).
2. 작성 중 내용 자동 보관, 이탈 시 확인 (`QR §8 form-autosave`, `sheet-dismiss-confirm`).
3. 등록 중 버튼 잠금 + 완료·실패 피드백 (`QR §2 loading-buttons`, `QR §8 submit-feedback`).

### (바) 로그인 후 데이터 도구: `/search`, `/channels`, `/channels/[channelId]`, `/my-channel`, `/saved`, `/threads`

근거
- `reasoning#7 Analytics Dashboard`: 패턴 "Data-Dense + Drill-Down", 효과 "Hover tooltips + Chart zoom + Filter animations", `must_have: data-export`, `if_large_dataset: virtualize-lists`, 안티패턴 "Ornate design + No filtering". `products#7` "Clarity > aesthetics. Color-coded data priority.", 2순위 스타일 "Minimalism & Swiss Style, Dark Mode (OLED)", 대시보드 "Drill-Down Analytics + Comparative".
- `reasoning#16 Productivity Tool`: 효과 "Quick actions (150ms)", `must_have: keyboard-shortcuts`, 안티패턴 "Complex onboarding + Slow performance".
- 참고: `landing#25` 의 별칭에 "Data-Dense + Drill-Down"이 들어 있지만 이는 엔터프라이즈 랜딩 패턴이라 앱 내부 화면에는 맞지 않는다. 앱 화면은 `reasoning#7` 과 `QR §10` 을 따른다.

검색 결과 `/search` 권장 배치
1. 상단 검색 바: 현재 검색어 유지, 재검색 (검색 누적 로직은 그대로).
2. 요약: 결과 수 등 핵심 수치 몇 개 (`tabular-nums`, `QR §6 number-tabular`).
3. 필터·정렬 바 (`reasoning#7` "No filtering" 안티패턴).
4. 결과 표: 정렬 가능한 열에 `aria-sort` (`QR §10 sortable-table`). 모바일은 카드형으로 바꾼다 (`QR §10 responsive-chart` 의 단순화 원칙).
5. 더 보기·페이지네이션. 행이 많으면 가상화 (`reasoning#7` virtualize-lists, `QR §3 virtualize-lists` 50개 이상).
6. 내보내기(CSV): `reasoning#7` must_have data-export. 현재 기능에 없으면 후보로만 적는다 (기능 추가는 소유자 판단).
7. 검색어 없이 들어온 경우: "결과 없음"이 아니라 검색 시작 안내 빈 상태 (`QR §8 empty-states`).

채널 분석 `/channels/[channelId]` 권장 배치
1. 채널 헤더(아바타, 이름, 구독자) → 2. 핵심 지표 카드 → 3. 추이 차트(선) → 4. 영상 목록 표 → 5. 비교.
- 영상 → 상세로 들어가는 드릴다운은 돌아가는 경로를 유지 (`QR §10 drill-down-consistency`).
- 차트 규칙은 7장.

### (사) 로그인·마이페이지: `/sign-in`, `/sign-up`, `/mypage`

데이터셋에 맞는 제품 유형 행은 없다. `QR §1`, `QR §8`, `QR §9` 의 규칙으로 구성한다.

로그인·가입
1. 현재 로그인은 카카오·구글 OAuth 두 가지다(`sign-in/_components/SignInForm.tsx`). 기억력 시험 없는 인증 경로라 `QR §1 accessible-authentication` 을 충족하므로 구조를 유지하고, 버튼은 공식 브랜드 자산·브랜드색(카카오 `#FEE500` + 검정 글자)을 쓴다(`SC` "Correct Brand Logos").
2. 이메일·인증번호 입력을 나중에 추가할 경우에만: `type`·`autocomplete` 지정, 붙여넣기 허용, 비밀번호 보기 토글 (`QR §8 input-type-keyboard`, `autofill-support`, `password-toggle`, `ux#107`).
3. 로그인 실패·취소는 화면 안에 원인과 다시 시도 경로를 보여 준다(`QR §8 error-clarity`, `error-recovery`).
4. 로그인 후에는 원래 하려던 일로 돌려보낸다 (선택한 플랜, 입력한 키워드). pricing-02, home 보고서의 키워드 유실 발견과 같은 원칙 (`QR §9 back-stack-integrity` "Never ... unexpectedly jump to home").

마이페이지
1. 현재 플랜·남은 사용량·다음 결제일 → 2. 결제·구독 관리 → 3. 계정 정보 → 4. 로그아웃·탈퇴(따로 떨어뜨림).
- 탈퇴·구독 해지 같은 파괴적 동작은 일반 메뉴와 공간·시각적으로 분리하고 확인을 받는다 (`QR §9 destructive-nav-separation`, `QR §8 confirmation-dialogs`). 위험 색은 레드(보존하는 시맨틱 색).

## 2. UX 규칙 점검표

- 범위: `ux-guidelines.csv` 119행 중 Platform 이 Web·All 인 109행에서 bibllab 에 해당하는 것, `app-interface.csv`(전부 iOS/Android/RN 행) 중 웹 대응이 있는 것. 모바일 전용(Pull to Refresh, Haptic 등)과 VisionOS 행은 제외했다.
- 심각도는 데이터셋 표기를 그대로 쓴다. 네이티브 행을 웹에 옮긴 경우와 bibllab 사정으로 조정한 경우에는 "(보정)"을 붙였다.
- "적용 위치"의 숫자는 2026-10-06 기준 `src/` 전체(.tsx/.ts/.css)를 읽기 전용으로 센 값이다.

### 2.1 Critical

| ID | 규칙 | 근거 | 심각도 | bibllab 적용 위치 (현재) |
|---|---|---|---|---|
| C01 | 좁은 폭, 200% 확대, 사용자 자간·행간 변경에서도 글자가 잘리지 않고 다시 흐른다. 고정 높이·고정 폭 상자에 글자를 가두지 않는다. | `ux#112` Text Reflow and Spacing, README "Resilient Text and Compact UI" | Critical | 한국어 줄바꿈 규칙이 전역에 없다(`break-keep`·`keep-all` 0건). 모바일 홈 헤드라인이 "파 / 악하세요"로 끊김(`src/app/page.tsx:145`). 요금제 h1, studio 최종 CTA 도 같은 문제 |
| C02 | 제목·버튼·오류·안전 문구·구별용 이름(영상 제목, 채널명)은 잘라서 뜻을 잃게 하지 않는다. 잘라야 하면 전체를 보는 경로(펼치기, 상세 링크)를 둔다. hover 전용 `title` 은 경로로 인정하지 않는다. | `ux#113` Essential Text Truncation, `ux#84`, `ux#116` | Critical | 영상·채널 카드(`src/components/VideoCard.tsx`, `src/app/search/_components/*`), 피드 카드(`community/_components/FeedCard.tsx`), 네비 잠금 안내(`layout.tsx` NavTab 의 `title`). 네이티브 `title=` 툴팁 50건/28파일 |
| C03 | 누르는 칩·토글·필터는 `<button>`(이동이면 링크)이고 이름, 선택 상태(`aria-pressed`·`aria-selected`·`aria-current`), 키보드 조작, 보이는 포커스를 갖는다. 클릭 가능한 div, hover 에서만 드러나는 동작 금지. | `ux#117` Compact Control Semantics, `ux#114` | Critical | 홈 예시 키워드 칩, `community/_components/CategoryChips.tsx`·`CommunityTabs.tsx`, 검색 필터 탭, 기간 버튼, 요금제 월간/연간 토글(pricing-12). 상태 속성 사용 1건뿐 |
| C04 | 인증은 기억력 시험에만 기대지 않는다. 비밀번호 관리자와 붙여넣기를 막지 않고 OAuth 같은 대체 경로를 둔다. | `ux#107` Accessible Authentication (Minimum), `app#32` | Critical | `/sign-in`·`/sign-up` 은 카카오·구글 OAuth 만 써서 현재 충족(`sign-in/_components/SignInForm.tsx`). 이메일·인증번호 입력을 추가하면 `autocomplete`(email, current-password, one-time-code)와 붙여넣기 허용이 필수. `autoComplete` 사용 1건 |
| C05 | 운영체제의 동작 줄이기(reduced-motion) 설정을 존중한다. 움직임을 끄거나 줄이고 최종 상태를 바로 보여 준다. | `app#24`(Critical), `ux#9`, `ux#99`, `tw#42`, `QR §1 reduced-motion` | Critical (보정: 네이티브 행을 웹에 적용) | `prefers-reduced-motion`·`motion-reduce` 0건. `globals.css:88` `[data-animate]{opacity:0}`(59건/3파일), `.highlight-draw`, 통계 카운트업, studio 마퀴 |
| C06 | 아이콘만 있는 버튼은 접근 가능한 이름(`aria-label` 또는 `sr-only` 글자)을 갖는다. | `app#1`(Critical), `ux#40`, `tw#36`, `tw#40` | Critical (보정: 웹 적용) | `<button>` 210개 중 `aria-label` 15건, `sr-only` 0건. 닫기 `✕` 12건(`VideoModal.tsx`, `SearchResultList.tsx`, `PricingCards.tsx` 등) |
| C07 | 뒤로가기와 로그인 복귀는 예측 가능해야 한다. 이동 기록을 몰래 지우거나 홈으로 튕기지 않고, 로그인 뒤에는 하던 일(선택한 플랜, 입력한 키워드)로 돌아간다. | `app#9` Back Behavior(Critical), `ux#4`, `QR §9 back-stack-integrity` | Critical (보정: 웹 적용) | `StudioGuard` 의 `/studio` → `/` 이동(공개 여부는 소유자 답변 대기, 답이 없으면 현상 유지), pricing-02(로그인 뒤 `/search` 로 떨어짐), 홈 로그인 모달의 키워드 유실 |

### 2.2 High

| ID | 규칙 | 근거 | 심각도 | bibllab 적용 위치 (현재) |
|---|---|---|---|---|
| H01 | 모든 조작 요소에 보이는 키보드 포커스. `outline-none` 은 대체 포커스 표시 없이 쓰지 않는다. | `ux#28`, `tw#26`, `tw#41`, `QR §1 focus-states` | High | `outline-none` 68건/25파일, `focus-visible:` 0건, `focus:ring` 2건. 전역 1회 정의로 해결(5.2) |
| H02 | 마우스 없이 모든 동작이 되고 탭 순서가 보이는 순서와 같다. 모달은 안에 포커스를 가두고, 닫으면 연 버튼으로 돌려준다. | `ux#41`, `shadcn#53`, `QR §1 keyboard-nav` | High | 홈 로그인 모달(`page.tsx:89`), `search/_components/LimitModal.tsx`, `VideoModal.tsx`, `_components/ConfirmDialog.tsx`, 경쟁도 확인 모달(`KeywordCompetition.tsx:126`) |
| H03 | 고정 헤더, 하단 고정 CTA, 카카오 플로팅 버튼이 키보드 포커스를 가리지 않는다. | `ux#100` Focus Not Obscured (Minimum), `ux#2` | High | 네비 `sticky top-0 h-14`(모바일은 메뉴 행이 한 줄 더), 컨설팅 `sticky top-14` 보조 바, 모바일 하단 고정 CTA, `_components/KakaoChatButton.tsx`. `scroll-padding`·`scroll-mt` 0건 |
| H04 | 일반 글자 대비 4.5:1 이상. 검정·`neutral-900` 위의 본문·보조 글자는 `neutral-400` 이상. | `ux#36`, `ux#76`, `QR §1 color-contrast` | High | `text-neutral-500` 133건(검정 위 4.44, 카드 위 3.79로 미달), `text-neutral-600` 29건(2.69), `text-gray-500/600` 368건(구 테마). 대비표는 3.1 |
| H05 | 색만으로 정보를 전하지 않는다. 상태·등급·잠금은 글자나 아이콘을 함께 쓴다. | `ux#37`, `QR §1 color-not-only`, `QR §6 color-not-decorative-only` | High | 경쟁도 낮음/보통/높음(글자 있음, 유지), 플랜 잠금 배지, 검색 화면 앰버 점(`search/page.tsx:232`), 성장 등급 색 |
| H06 | 뜻이 있는 이미지는 내용을 전하는 대체 텍스트, 장식 이미지는 `alt=""`. | `ux#38`, `QR §1 alt-text` | High | 컨설팅 상세 이미지 7장이 `alt="팀비블 1:1 유튜브 컨설팅 상세 n"`(가격·구성 문구가 이미지 안에만 있음, `studio/class/consulting/page.tsx`), `<img>` 51건/21파일 점검 |
| H07 | 입력에는 보이는 라벨. 플레이스홀더로 라벨을 대신하지 않는다(단일 검색창은 `aria-label` + 버튼 글자 허용). | `ux#43`, `ux#54`, `shadcn#54`, `QR §8 input-labels` | High | `<label>` 34건 중 `htmlFor` 연결 4건(감싸기 방식인지 화면별 확인). studio 문의 폼, 커뮤니티 글쓰기, 결제 카드 폼 |
| H08 | 오류는 해당 필드 바로 아래에 원인과 고치는 법으로 쓰고 `aria-describedby` 로 잇고 `aria-invalid` 를 단다. 테두리 색만 바꾸지 않는다. | `ux#55`, `ux#33`, `app#15`, `QR §8 error-placement`·`error-clarity` | High | `aria-describedby`·`aria-invalid` 0건. studio 3단계 폼(studio-11), 글쓰기, 결제 |
| H09 | 제출 실패 시 폼 위에 오류 요약을 두고 포커스를 옮기며, 각 항목을 해당 필드로 잇는다. 필드 옆 오류는 그대로 둔다. | `ux#109` Focusable Error Summary, `QR §8 focus-management`·`error-summary` | High | studio 상담 폼, 결제 정보 입력 |
| H10 | 오류·상태 변화는 화면 낭독기에 알린다(`role="alert"` 또는 `aria-live`). | `ux#44`, `app#4`, `QR §8 aria-live-errors` | High | `aria-live` 0건, `role=alert/status` 1건. 결제 실패 안내(pricing-01), 폼 오류, 검색 오류 |
| H11 | 비동기 버튼은 처리 중 잠그고 `aria-busy` 와 진행 표시를 한다(중복 제출 방지). | `ux#32`, `tw#35`, `QR §2 loading-buttons` | High | 검색 실행, 결제, 글·댓글 등록, 좋아요, 문의 제출(studio 폼은 이미 잠금, 유지) |
| H12 | 제출 뒤 로딩 → 성공/실패를 보여 준다. 조용한 실패 금지. | `ux#61`, `ux#33` | High | `/threads` 의 영어 원문 오류("Failed to fetch Threads profile"), `/pricing?error=` 무시(pricing-01) |
| H13 | 되돌릴 수 없는 동작(삭제, 구독 해지, 탈퇴)은 확인을 받는다. 위험 동작은 레드로, 일반 동작과 떨어뜨린다. | `ux#35`, `shadcn#42`·`#43`, `QR §8 confirmation-dialogs`, `QR §9 destructive-nav-separation` | High | 저장 목록 삭제(`saved/_components/SavedVideoList.tsx`), 글·댓글 삭제, 마이페이지 구독 해지. 기존 `ConfirmDialog.tsx` 재사용 |
| H14 | 이미지·배지·검증 문구가 늦게 들어와도 주변이 밀리지 않게 자리를 잡는다(CLS < 0.1). | `ux#19`, `tw#14`, `next#18`, `next#40`, `QR §3 image-dimension`·`content-jumping` | High | 썸네일 `<img>` 51건의 크기 지정 여부, 배지 삽입부. 숫자 `tabular-nums` 38건은 유지 |
| H15 | 이미지는 맞는 크기·포맷으로. 로컬 대형 이미지는 `next/image`(크기, `sizes`), 첫 화면 밖은 지연 로드. | `ux#46`, `ux#47`, `next#17`, `next#21`, `QR §3 image-optimization`·`lazy-load-below-fold` | High | 컨설팅 PNG 7장(`width=1000 height=8000`), studio 이미지. YouTube 썸네일은 `next.config.mjs:44-48` 에 원격 허용·AVIF/WebP 설정이 이미 있다. 썸네일을 `next/image` 로 바꿀지(Vercel 이미지 최적화 사용량 발생)와 `<img width height loading="lazy" decoding="async">` 유지 중 선택은 비용 판단이 필요 |
| H16 | 웹 포인터 타깃은 24×24 CSS px 이상(WCAG 2.2 AA), 모바일 주요 버튼은 44px 이상, 인접 타깃 간격 8px. | `ux#104` Target Size (Minimum), `ux#66`, `tw#34`, `ux#23`, `app#6` | High | 모바일 메뉴 행(`text-xs py-1.5`, 높이 약 28px), 커뮤니티 페이지네이션, 칩, 아이콘 버튼, FAQ 토글 |
| H17 | 모바일 본문 16px 이상, 어떤 글자도 12px 미만 금지, 입력창 16px(iOS 자동 확대 방지). | `ux#67`, `QR §5 readable-font-size`, `QR` 안티패턴 "Text < 12px body" | High | `text-[10px]`·`text-[11px]` 129건/41파일. 홈 입력창 16px 는 유지 |
| H18 | 가로 스크롤 금지. 넓은 표는 가로 스크롤 상자나 카드형으로. | `ux#69`, `ux#71`, `QR §5 horizontal-scroll` | High | studio 비교표 모바일 TMK 열 잘림(studio-08), 표 16개/14파일 |
| H19 | URL·ID·사용자 글은 `overflow-wrap:anywhere` + flex 자식 `min-w-0` 로 넘치지 않게. 일반 문장에 `break-all` 금지. | `ux#111`, `tw#58` | High | 커뮤니티 글·댓글, 채널명, 검색어 표시. `break-words` 류 8건 |
| H20 | 칩 묶음은 줄바꿈하거나 누를 수 있는 `+n` 으로 접는다. 한 줄에 몰아 자르거나 숨기지 않는다. | `ux#115`, `tw#59`, `QR §5 chip-collection-reflow` | High | 커뮤니티 모바일 카테고리 칩, 홈 예시 키워드, 검색 필터 |
| H21 | 배지·칩 글자는 한 줄로 두고, 불가피하게 줄이면 전체 값을 키보드·터치로도 볼 수 있게. | `ux#116`, `QR §5 compact-label-overflow` | High | 잠금 배지, "추천" 배지, 게시판 배지 |
| H22 | 배지 숫자가 바뀌면 맥락 있는 한 문장으로 한 번 알린다(예: "남은 검색 3회"). 숫자만 읽히게 하지 않는다. | `ux#118`, `QR §1 contextual-live-badge-updates` | High | `_components/SearchUsageBadge.tsx`(검색 뒤 사용량 갱신). 표시만 다루고 차감 로직은 건드리지 않는다 |
| H23 | 빠르게 연속 조작해 애니메이션이 끊겨도 최종 상태는 정확해야 한다. 상태의 정확성을 `transitionend` 에 맡기지 않는다. | `ux#119`, `QR §7 cancellable-state-transitions` | High | 월간/연간 토글, 탭, 좋아요 토글 |
| H24 | 저절로 움직이는 콘텐츠(마퀴, 캐러셀)는 일시정지 버튼을 두고 포커스·호버·reduced-motion·화면 밖에서 멈춘다. | `ux#108`, `motion#17`, `landing#2`·`#25`·`#33` | High | studio `_components/VideoMarquee.tsx`, 후기 슬라이드 |
| H25 | 한 화면에서 움직이는 요소는 1~2개. | `ux#7`, `QR §7 excessive-motion` | High | studio 페이지의 `data-animate` 다수 |
| H26 | 비동기 작업은 기다림에 맞는 로딩 표시(스켈레톤 우선). 거의 즉시 끝나는 작업에 깜빡이는 로더 금지. 레이아웃·포커스 유지, `aria-busy`. | `ux#10`, `ux#78`, `motion#16`, `app#13`, `QR §3 progressive-loading` | High | `/search`(`SearchSkeleton.tsx` 있음), 채널 분석, 커뮤니티 피드. `loading.tsx` 0개 |
| H27 | 중요한 동작·정보를 hover 에만 맡기지 않는다. | `ux#11`, `QR §2 hover-vs-tap` | High | 네비 잠금 안내 `title`, 데이터 화면 지표 설명 툴팁 |
| H28 | z-index 는 정한 단계만 쓴다. | `ux#15`, `tw#5`, `tw#6`, `QR §5 z-index-management` | High | 임의값 `z-[n]` 16건/12파일. 단계표는 5.6 |
| H29 | 앵커 이동은 부드럽게 하되 reduced-motion 에서는 즉시. 고정 헤더 높이만큼 여백을 둔다. | `ux#1`(High), `ux#2` | High | studio `#process` 등 앵커 |
| H30 | AI 가 만든 결과는 AI 결과라고 표시한다. | `ux#92` | High | `search/_components/VideoModal.tsx:363` 에 "외부 AI가 생성한 참고용 정보" 안내가 있다. 유지하고 결과 영역 옆에도 짧게 표시 |
| H31 | 뷰포트는 `width=device-width, initial-scale=1`. 확대 금지 설정 금지. | `ux#68`, `QR §5 viewport-meta` | High | Next 기본값 사용 중(충족). `maximum-scale`·`user-scalable=no` 를 넣지 않는다 |
| H32 | 50개가 넘는 목록은 가상화하거나 화면 밖 렌더링을 미룬다. | `app#20`, `react#26`, `QR §3 virtualize-lists`, `reasoning#7 if_large_dataset` | High | 검색 결과 목록, 커뮤니티 피드, 저장 목록. 의존성 없이 `content-visibility:auto`(`tw#47` 의 `@utility content-auto`)부터 |

### 2.3 Medium

| ID | 규칙 | 근거 | 심각도 | bibllab 적용 위치 (현재) |
|---|---|---|---|---|
| M01 | 네비에 현재 위치를 표시하고 `aria-current="page"`. | `ux#3`, `QR §9 nav-state-active` | Medium | `layout.tsx` NavTab 에 활성 표시 없음(`aria-current` 1건). 경로 판별은 작은 클라이언트 컴포넌트(`usePathname`)로 떼어 내고, 루트 레이아웃은 정적으로 둔다(불변 조건 2) |
| M02 | 화면 상태를 URL 에 반영해 공유·뒤로가기가 되게. 돌아오면 스크롤·필터·입력이 복원된다. | `ux#5`, `app#12`, `QR §9 deep-linking`·`state-preservation` | Medium | 검색 필터·정렬, 채널 탭. 커뮤니티 정렬·검색은 이미 GET(유지) |
| M03 | 본문 바로가기 링크, `<main>` 랜드마크, `<nav aria-label>`. | `ux#45`, `ux#42` | Medium | 루트 레이아웃에 건너뛰기 링크·`<main>` 없음(`layout.tsx:302-397`), `{children}` 을 감싸는 요소 없음 |
| M04 | 제목 단계를 건너뛰지 않고 한 페이지에 h1 하나. | `ux#39`, `QR §1 heading-hierarchy` | Medium | 커뮤니티 레이아웃 h1(`community/layout.tsx:79`)과 글 상세 h1(`[board]/[id]/page.tsx:184`)·글쓰기 h1(`write/page.tsx:27`)이 겹친다 |
| M05 | 누를 수 있는 요소는 커서가 바뀌고 작은 시각 변화가 있다. Tailwind v4 는 버튼 기본 커서가 화살표이므로 전역에서 `cursor:pointer` 를 되살린다. | `ux#29`, README 점검표 "cursor-pointer on all clickable elements", `styles#8` | Medium | `<button>` 210개 대비 `cursor-pointer` 31건 |
| M06 | 눌림(active) 피드백. 터치 기기에서는 hover 대신 active 로. | `ux#30`, `QR §2 press-feedback` | Medium | 화이트 CTA 에 `active:bg-neutral-300` 같은 눌림 상태 |
| M07 | 비활성은 `disabled` 속성 + 흐림 + 커서 변경. | `ux#31`, `tw#28`, `QR §8 disabled-states` | Medium | 잠긴 기능 버튼, 제출 중 버튼 |
| M08 | 완료를 짧게 확인시킨다. 토스트는 3~5초 뒤 닫히고, 포커스를 뺏지 않고 `aria-live="polite"`. | `ux#34`, `ux#82`, `ux#83`, `app#14`, `QR §8 toast-accessibility` | Medium | 저장·복사·공유 완료 |
| M09 | 빈 상태는 이유와 다음 행동을 보여 준다. | `ux#79`, `ux#90`, `QR §8 empty-states` | Medium | `/search` 를 검색어 없이 열면 "검색 결과가 없어요"(CONTEXT 확인 사실), 저장 목록 빈 상태 |
| M10 | 오류에는 복구 경로(다시 시도, 다시 연결, 문의)를 붙인다. | `ux#80`, `QR §8 error-recovery` | Medium | `/threads` 영어 원문 오류, `app/error.tsx`·`search/error.tsx` 문구 |
| M11 | 여러 단계 흐름은 진행 표시와 뒤로가기. | `ux#81`, `QR §8 multi-step-progress` | Medium | studio 상담 폼 `1 / 3`(있음, 유지) |
| M12 | 필수 표시, 입력 유형(`type`·`inputmode`), 자동완성, 비밀번호 보기 토글. | `ux#57`·`#58`·`#59`·`#60`·`#63` | Medium | 문의 폼 연락처(`type="tel"`), 이메일 |
| M13 | 대부분의 필드는 입력을 마친 뒤(blur) 검증한다. 글자마다 검증하지 않는다. | `ux#56`, `app#16` | Medium | studio 폼 |
| M14 | 입력창은 입력창처럼 보인다. 경계선은 인접 색과 3:1 이상(검정·카드 위에서 `neutral-500`). | `ux#62`, `SC` "control boundaries need at least 3:1" | Medium (보정: WCAG 1.4.11 은 AA 요건) | 입력 테두리 `neutral-700`/`800` 은 검정 대비 2.02/1.39 |
| M15 | 같은 흐름에서 이미 받은 정보를 다시 묻지 않는다. | `ux#106` Redundant Entry | Medium | 로그인 사용자의 이메일·이름을 문의·결제 화면에 미리 채움 |
| M16 | 도움 수단(카카오 상담, 문의)은 페이지마다 같은 자리. | `ux#105` Consistent Help | Medium | `KakaoChatButton` 위치는 유지, 폼 주 버튼·하단 고정 CTA 와 겹치는 화면에서만 숨기거나 위로 |
| M17 | 고정 요소를 여러 개 겹쳐 쌓지 않는다. | `ux#17`, `ux#16` | Medium | 카카오 버튼이 상담 폼 주 버튼과 겹침(studio 보고서), 모바일 하단 CTA 와 공존 |
| M18 | 모바일 전체 높이에는 `100vh` 대신 `dvh`. | `ux#20`, `QR §5 viewport-units` | Medium | `h-screen`/`100vh` 50건(대부분 `min-h-screen`). 전체 높이 레이아웃·모달부터 `min-h-dvh` |
| M19 | 읽는 글은 한 줄 65~75자(라틴 기준, 한글은 약 36~45자. 6.2), 행간 1.5~1.75. | `ux#21`, `ux#72`, `ux#73`, `tw#17` | Medium | 커뮤니티 글 본문, 약관류. incubating 본문(`max-w-3xl`, `leading-[1.85]`)은 충족 |
| M20 | 글자 크기는 정한 단계만, 제목과 본문은 크기·굵기 차이가 분명하게. | `ux#74`, `ux#77`, `tw#18`, `QR §6 font-scale` | Medium | 임의 `text-[Npx]` 다수. 단계표는 6.2 |
| M21 | 글꼴을 받는 동안 글자가 사라지거나 레이아웃이 밀리지 않게(`display: swap`, 대체 글꼴 보정). | `ux#50`, `ux#75`, `next#22`, `QR §3 font-loading` | Medium | Pretendard 를 가리키지만 로드 코드가 없음(6.2) |
| M22 | 서드파티 스크립트는 비동기·지연 로드, 쓰는 화면에서만. | `ux#51`, `react#8`, `QR §3 third-party-scripts` | Medium | 카카오 SDK 를 모든 페이지에서 불러오고 integrity 값 오류로 차단됨(CONTEXT 검증 사실). 공유 버튼이 있는 화면에서만 `lazyOnload` 로 |
| M23 | 경로·기능 단위로 코드를 나누고 무거운 컴포넌트는 동적 import. | `ux#48`, `ux#52`, `react#7`, `react#9`, `next#39` | Medium | recharts 차트, `VideoModal`, 결제 SDK |
| M24 | 자동 재생 영상 지양, 눌러서 재생, 일시정지·자막, 화면 밖에서 정지. | `ux#96` | Medium | studio 영상 임베드(studio-13) |
| M25 | 무거운 자산을 줄인다. | `ux#97` | Medium | 컨설팅 상세 PNG 7장 |
| M26 | 제목 `text-balance` 는 점진적 보정으로만 쓰고, 문장 중간 `<br>` 이나 일괄 줄바꿈 금지 공백으로 줄을 고정하지 않는다. | `ux#110`, `tw#57`, `QR §6 heading-line-balance` | Medium | 요금제 서브카피의 `<br />`(`pricing/page.tsx`). 두 톤 헤드라인은 `block` span 두 개로 |
| M27 | 무한 반복 애니메이션은 로딩 표시에만. | `ux#12`, `app#25` | Medium | 검색 화면 앰버 펄스 점(`search/page.tsx:232`, 소유자 금지 패턴과도 겹침). 스켈레톤의 `animate-pulse` 는 허용 |
| M28 | 애니메이션은 transform·opacity 만. `transition-all` 대신 바뀌는 속성만 지정. | `ux#13`, `QR §7 transform-performance` | Medium | `transition-all` 30건, `.highlight-draw::after` 의 width 애니메이션(`globals.css:119`) |
| M29 | 고빈도 이벤트(스크롤, 리사이즈, 입력)는 debounce·throttle. | `app#22`, `QR §3 debounce-throttle` | Medium | 검색 입력 제안, 스크롤 연동 UI |
| M30 | 검색 자동완성·최근 검색 제안. | `ux#89`, `QR §9 search-accessible` | Medium | 후보(기능 추가는 소유자 판단, 검색 누적 로직 불변) |

### 2.4 Low

| ID | 규칙 | 근거 | 심각도 | bibllab 적용 위치 |
|---|---|---|---|---|
| L01 | 3단계 이상 깊이에는 브레드크럼. | `ux#6`, `QR §9 breadcrumb-web` | Low | 커뮤니티 > 게시판 > 글, 채널 > 영상 드릴다운 |
| L02 | 날짜는 한국어 상대 표기(3일 전) 또는 지역 형식. | `ux#85` | Low | 커뮤니티 피드·댓글 |
| L03 | 큰 수는 읽기 쉽게(1.2만, 3.4억 또는 천 단위 쉼표). | `ux#86`, `QR §10 number-formatting` | Low | 조회수·구독자(`Intl.NumberFormat('ko-KR', { notation: 'compact' })`) |
| L04 | 실제와 비슷한 예시 데이터. | `ux#87` | Low | 홈 결과 미리보기 샘플 |
| L05 | 여러 항목을 한 번에 처리. | `ux#91` | Low | 저장 목록(후보) |
| L06 | 이징: 들어올 때 감속, 나갈 때 가속, 일정한 진행은 linear. | `ux#14`, `app#23` | Low | 모션 토큰(4장) |

### 2.5 app-interface.csv 에서 웹으로 옮긴 행

`app-interface.csv` 32행은 모두 iOS/Android/React Native 행이다. 웹 대응이 분명한 것만 위 표에 합쳤다.

| 행 | 원래 규칙 | 웹 대응 | 반영 ID |
|---|---|---|---|
| `app#1` | Icon Button Labels (Critical) | `aria-label` / `sr-only` | C06 |
| `app#2` | Form Control Labels (Critical) | 보이는 `<label>` + 연결 | H07 |
| `app#3` | Role & Traits (High) | 네이티브 요소·ARIA 역할 | C03 |
| `app#4` | Dynamic Updates (Medium) | `aria-live` | H10, H22 |
| `app#5` | Decorative Icons (Medium) | 장식 SVG `aria-hidden="true"` | 6.4, 3.2 "이미지" |
| `app#6` | Touch Target Size (Critical) | 웹은 24 CSS px(AA), 터치 44px 권장을 따로 판단 | H16 |
| `app#9` | Back Behavior (Critical) | 브라우저 뒤로가기·로그인 복귀 | C07 |
| `app#11` | Modal Escape (High) | 닫기 버튼 + Esc | H02 |
| `app#12` | Preserve Screen State (Medium) | URL 상태·스크롤 복원 | M02 |
| `app#13` | Loading Indicators (High) | 스켈레톤·`aria-busy` | H26 |
| `app#15` | Error Feedback (High) | 테두리 색만 바꾸지 않기 | H08 |
| `app#20` | Virtualize Long Lists (High) | 가상화·`content-visibility` | H32 |
| `app#22` | Debounce High-Freq Events (Medium) | debounce/throttle | M29 |
| `app#24` | Respect Reduced Motion (Critical) | `prefers-reduced-motion` | C05 |
| `app#25` | Limited Continuous Motion (Medium) | 무한 반복은 로딩에만 | M27 |
| `app#30` | No Gesture-Only Actions (Critical) | 스와이프 전용 금지, 보이는 버튼 | H24 |
| `app#32` | Authentication Reuse (Critical) | 비밀번호 관리자·붙여넣기 | C04 |

옮기지 않은 행: `app#10`(하단 탭 바), `app#17`·`#18`(네이티브 키보드), `app#26`·`#27`(Dynamic Type, 웹은 C01 의 확대·재배치로 대체), `app#28`(세이프 에어리어, 단 하단 고정 CTA 를 `viewport-fit=cover` 와 함께 쓰게 되면 `env(safe-area-inset-bottom)` 여백 필요), `app#29`(라이트/다크 두 테마 전제), `app#31`(RN 드래그).

## 3. 접근성 점검표

목표 수준은 WCAG 2.2 AA. 데이터셋이 WCAG 2.2 를 직접 인용한 행(`ux#100`·`#103`~`#107`)은 기준 번호를 함께 적었다. "확인 방법"은 구현 후 사람이 하는 점검이다.

### 3.1 대비 (WCAG 1.4.3, 1.4.11)

| 조합 | 검정 위 | `neutral-900` 카드 위 | 판정 |
|---|---|---|---|
| white | 21.00 | 17.91 | 모든 글자 |
| `neutral-300` | 14.17 | 12.09 | 본문 |
| `neutral-400` | 8.10 | 6.91 | 보조 글자 최소값 |
| `neutral-500` | 4.44 | 3.79 | 큰 글자·비활성·플레이스홀더만. 입력 경계(3:1)로는 충분 |
| `neutral-600` | 2.69 | 2.30 | 글자 금지 |
| `neutral-700` | 2.02 | 1.72 | 글자 금지 |
| `#00E5A0` | 12.72 | 10.85 | 강조 글자·표시 |
| `red-400` / `red-500` | 7.26 / 5.50 | 6.19 / 4.69 | 오류 글자는 `red-400` 권장 |
| `amber-400` | 12.23 | 10.43 | 경고 |
| `green-400` | 11.83 | 10.09 | 성공 |
| `#FF0000` | 5.25 | 4.48 | 유튜브 브랜드(로고·표시) |
| 흰 글자 on `#FF0000` | 4.00 | | 작은 글자 미달. 18.66px 이상 굵은 글자만 |
| 검정 글자 on `#00E5A0` | 12.72 | | 액센트 배경 위 글자 |
| 흰 글자 on `#00E5A0` | 1.65 | | 금지 |
| 검정 글자 on 흰 CTA / hover `neutral-200` | 21.00 / 16.68 | | 화이트 CTA |
| 테두리 `neutral-800` / `neutral-700` | 1.39 / 2.02 | 1.19 / 1.72 | 장식 테두리만. 입력 경계는 `neutral-500` |

### 3.2 점검 항목

| 영역 | 확인할 것 | 기준 | 관련 ID | 확인 방법 |
|---|---|---|---|---|
| 대비 | 일반 크기 글자는 `neutral-400` 이상, `neutral-500` 은 24px 이상(또는 19px 굵게)·비활성·플레이스홀더에만 | 1.4.3 | H04 | 바꾼 파일에서 `text-neutral-500`·`600` 의 글자 크기 확인 |
| 대비 | 입력·체크박스·토글 경계, 뜻이 있는 아이콘, 차트 표시는 3:1 | 1.4.11 | M14, 7.2 | 3.1 표 |
| 색 | 색만으로 상태·등급·오류를 전하지 않는다 | 1.4.1 | H05, 7.3 | 흑백 화면(DevTools 색각 에뮬레이션)에서 뜻이 남는지 |
| 키보드 | Tab 만으로 모든 링크·버튼·입력·칩·토글·모달 조작, 갇힘 없음 | 2.1.1, 2.1.2 | H02, C03 | 페이지마다 Tab 순회 |
| 포커스 | 포커스가 항상 보인다(흰 2px 윤곽 + 2px 간격) | 2.4.7 | H01 | Tab 순회 |
| 포커스 | 고정 네비·하단 CTA·카카오 버튼이 포커스를 완전히 가리지 않는다 | 2.4.11 (`ux#100`) | H03 | 긴 페이지에서 Tab 으로 아래로 이동 |
| 포커스 순서 | 보이는 순서와 같다. 모달을 닫으면 연 버튼으로 돌아간다 | 2.4.3 | H02 | 모달 열고 닫기 |
| 구조 | 건너뛰기 링크("본문 바로가기") → `<main id>` | 2.4.1 (`ux#45`) | M03 | 첫 Tab 에 건너뛰기 링크 |
| 구조 | 랜드마크: `<nav aria-label="주 메뉴">`, `<main>`, `<footer>` | 1.3.1 | M03 | 낭독기 랜드마크 목록 |
| 구조 | 페이지당 h1 하나, 단계 건너뛰기 없음 | 1.3.1, 2.4.6 | M04 | 제목 목록(커뮤니티 h1 중복 해소) |
| 구조 | `lang="ko"`(현재 충족). 반복 장식인 영문 라벨은 `aria-hidden` | 3.1.1 | 6.2 | `layout.tsx:276` |
| 구조 | 페이지 제목(`<title>`)이 페이지마다 다르다(현재 대부분 충족) | 2.4.2 | N09 | 탭 제목 |
| 이름·역할·상태 | 아이콘 버튼 이름, 칩·토글의 `aria-pressed`/`aria-selected`, 아코디언 `aria-expanded`, 현재 메뉴 `aria-current` | 4.1.2 | C03, C06, M01, 5.7 | 낭독기로 컨트롤 읽기 |
| 이름·역할·상태 | 보이는 글자가 접근 가능한 이름에 들어 있다(예: 버튼 "신청하기"에 다른 `aria-label` 을 덮어쓰지 않음) | 2.5.3 | C06 | 코드 확인 |
| 링크 | 링크 글자만으로 목적지를 알 수 있다("자세히" 대신 "요금제 자세히 보기"), 새 창은 알린다 | 2.4.4 | N01 | 외부 결제 링크(Latpeed)에 "새 창" 안내 |
| 폼 | 보이는 라벨 + 연결, 필수 표시, 도움말 | 3.3.2, 1.3.1 | H07, M12 | 폼마다 |
| 폼 | 오류: 필드 아래 원인 + 해결법, `aria-invalid`, `aria-describedby`, 제출 실패 시 요약으로 포커스 | 3.3.1, 3.3.3 | H08, H09 | 빈 칸으로 제출해 보기 |
| 폼 | 같은 흐름에서 이미 받은 정보를 다시 묻지 않는다 | 3.3.7 (`ux#106`) | M15 | 로그인 상태로 문의 폼 |
| 인증 | 기억력 시험만으로 인증하지 않는다(현재 OAuth 로 충족). 붙여넣기·자동완성 허용 | 3.3.8 (`ux#107`) | C04 | 로그인 화면 |
| 상태 알림 | 검색 사용량 변화, 저장 완료, 오류를 이동 없이 알린다(`role="status"`·`aria-live="polite"`, 오류는 `role="alert"`) | 4.1.3 | H10, H22, M08 | 낭독기 켜고 동작 |
| 이미지 | 뜻이 있는 이미지 대체 텍스트, 장식은 `alt=""`, 장식 SVG `aria-hidden`. 글자가 든 이미지는 내용을 대체 텍스트나 본문으로 | 1.1.1 | H06, 6.4 | 컨설팅 상세 이미지 7장 |
| 움직임 | 5초 넘게 저절로 움직이는 것(마퀴)은 멈춤 수단 | 2.2.2 | H24 | 마퀴에 일시정지 버튼 |
| 움직임 | 동작 줄이기 설정에서 움직임 제거, 최종 상태 표시 | 2.3.3(AAA, 목표), `ux#9`·`#99` | C05, 4.4 | DevTools 렌더링 탭에서 `prefers-reduced-motion: reduce` |
| 드래그 | 드래그 전용 조작이 생기면 버튼 대체 | 2.5.7 (`ux#103`) | 7.4 | 해당 기능 추가 시 |
| 타깃 | 포인터 타깃 24×24 CSS px 이상(인접 간격 예외 포함), 모바일 주요 버튼 44px | 2.5.8 (`ux#104`) | H16 | 모바일 메뉴 행, 페이지네이션, 칩 |
| 재배치 | 폭 320 CSS px 에서 가로 스크롤 없이 읽힌다(표는 예외로 상자 안 스크롤) | 1.4.10 | C01, H18 | 320px 폭 |
| 확대 | 200% 확대에서 글자가 잘리거나 겹치지 않는다 | 1.4.4 | C01 | 브라우저 확대 |
| 글자 간격 | 행간 1.5배·문단 간격 2배·자간 0.12em·단어 간격 0.16em 을 강제해도 잘리지 않는다 | 1.4.12 (`ux#112`) | C01 | 북마클릿 또는 DevTools 로 스타일 주입 |
| hover·focus 내용 | 툴팁은 포커스로도 열리고, Esc 로 닫히고, 포인터를 올려도 사라지지 않는다 | 1.4.13 | C02, H27, 5.7 | 지표 설명 툴팁 |
| 도움 일관성 | 카카오 상담·문의는 페이지마다 같은 자리 | 3.2.6 (`ux#105`) | M16 | 페이지 이동하며 확인 |
| 표 | `thead`·`th scope`, 정렬 열은 `aria-sort` | 1.3.1 | 5.7, 7.4 | 표 16개 |
| 차트 | 한 줄 요약 + 표 대체 + 키보드로 값 확인 | 1.1.1, 2.1.1 | 7.4 | 차트마다 |
| 모달 | 제목·설명 연결, 포커스 가둠, Esc 와 닫기 버튼, 배경 대비 확인 | 4.1.2, 2.1.2 | H02, 5.7 | 모달마다 |

## 4. 모션 규칙

근거: `motion.csv` 17행(강도 단계 Subtle/Standard/Complex), `ux#7`·`#8`·`#9`·`#12`·`#13`·`#14`·`#99`·`#108`·`#119`, `QR §7`, `tw#1~#4`·`#42`, 소유자 금지 패턴(펄스 도트, 글로우).

### 4.1 원칙

1. 모든 움직임은 원인과 결과를 보여 줄 때만 쓴다(`QR §7 motion-meaning`). 꾸밈용 움직임은 넣지 않는다.
2. 기본 강도는 Subtle. Standard 는 마케팅 페이지의 섹션 등장에 한해 섹션당 한 번. Complex(고정 스크롤, 글자 분해, 자석 커서, 3D)는 쓰지 않는다.
3. 한 화면에서 움직이는 요소는 1~2개(`ux#7`).
4. 레이아웃을 바꾸는 속성(width·height·top·left·margin)은 움직이지 않는다. 위치·크기 변화는 transform, 나타남·사라짐은 opacity, 상태 표시는 색 전환으로 한다(`ux#13`, `motion#1` Perf). `transition-all` 대신 `transition-colors`·`transition-opacity`·`transition-transform`.
5. 애니메이션이 진행 중이어도 입력을 막지 않고, 새 조작이 들어오면 즉시 끊고 최종 상태를 직접 설정한다(`QR §7 no-blocking-animation`·`interruptible`, `ux#119`).
6. reduced-motion 에서는 움직임 없이 최종 상태를 바로 보여 준다(`motion.csv` 모든 행의 Framework Notes, `ux#99`).

### 4.2 모션 토큰

| 용도 | 지속 시간 | 이징 | 움직이는 속성 | 근거 |
|---|---|---|---|---|
| 버튼·링크 색 변화 | 150ms (`duration-150`) | ease-out | color, background-color, border-color | `motion#1`(150-200ms), `styles#12`(150-200ms), `tw#3` |
| 카드 hover | 200ms | ease-out | border-color. 이동을 쓰면 위로 2px 이하 | `motion#1` "Keep displacement under 2px", `reasoning#1` "Subtle hover (200-250ms)" |
| 눌림(active) | 즉시 | 없음 | background-color | `QR §3 tap-feedback-speed`(100ms 안) |
| 스크롤 등장 | 300~400ms, 이동 8~16px | ease-out | opacity, transform | `motion#4` |
| 목록 순차 등장 | 항목당 30~50ms, 최대 8개 | ease-out | opacity, transform | `motion#5`, `motion#7`, `QR §7 stagger-sequence` |
| 모달 열기 / 닫기 | 200ms / 150ms(열기의 60~70%) | ease-out / ease-in | opacity, scale 0.98→1 | `QR §7 modal-motion`·`exit-faster-than-enter`, `app#23` |
| 스켈레톤 | 정적 또는 1.2~1.6초 반복, 화면 밖·숨긴 탭에서 정지 | sine in-out | background-position 또는 opacity | `motion#15` |
| 로더(스피너) | 300ms 미만 작업에는 띄우지 않음 | linear(회전) | rotate | `motion#16`, `ux#14` |
| 숫자 카운트업 | 1회만 | ease-out | 텍스트 | reduced-motion 이면 최종값 즉시 |

### 4.3 쓰지 않는 움직임

| 움직임 | 근거 행 | 이유 |
|---|---|---|
| 패럴랙스, 스크롤 고정·스크럽 | `motion#6`, `motion#13`, `motion#14`, `styles#49`, `ux#99` | 멀미 유발, 모바일 성능. 소유자 톤과도 맞지 않음 |
| 글자 분해(SplitText), 키네틱 타이포 | `motion#9`, `styles#48` | 한국어 헤드라인에서 줄바꿈이 깨지고 DOM 이 늘어남 |
| 자석 커서, 3D 기울이기 | `motion#3`, `landing#28` | 꾸밈용 |
| hover 확대(scale 1.02) + 크게 뜨기 + 큰 그림자 | `motion#2`, `styles#39`, `landing#1`·`#14`·`#31` | 현재 `.channel-card:hover`(`globals.css:137-139`, 위로 6px + 1.02배 + 그림자)도 2px 이하 이동·테두리 변화로 줄인다 |
| CTA 펄스·글로우, 펄스 점, 장식 무한 반복 | `landing#1`·`#3`·`#15`·`#32`, `ux#12`, `app#25` | 소유자 금지 패턴. 검색 화면 앰버 펄스 점(`search/page.tsx:232`) 제거 |
| 타이핑 효과, 반짝이는 생성 로더, 모핑 | `landing#30`, `styles#43` | "AI스러운" 연출 |
| 페이지 전환 오버레이·공유 요소 전환 | `motion#10~#12` | 이동을 늦춤. 네비는 `next/link` 의 즉시 전환이 우선 |
| 데이터 화면의 튀어 오르는(back.out) 등장 | `motion#8` "Don't use back.out on dense data tables" | 정보 화면에서 엉성해 보임 |
| 700ms 이상 걸리는 UI 전환 | `tw#3` "duration-1000 or longer" 금지 | 현재 `[data-animate]` 0.7초, `.highlight-draw` 1초 |

### 4.4 reduced-motion 전역 규칙 (한 번만 넣는다)

```css
/* globals.css: 레이어 밖에 둔다 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  [data-animate] { opacity: 1 !important; transform: none !important; }
}
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }   /* ux#1 은 reduced-motion 이 아닐 때만 */
}
```

- JS 로 움직이는 것(카운트업, 마퀴 타이머, Recharts 등장 애니메이션)은 CSS 로 꺼지지 않는다. `matchMedia('(prefers-reduced-motion: reduce)')` 를 읽어 최종 상태를 바로 그린다(`motion.csv` Framework Notes, `QR §10 animation-optional`). Recharts 는 `isAnimationActive` 를 끈다.
- `tw#1` 은 "Tailwind 기본 animate 유틸리티가 reduced-motion 을 존중한다"고 적었지만 Tailwind 의 `animate-*` 는 미디어쿼리를 스스로 붙이지 않는다. `motion-reduce:animate-none` 을 직접 붙이거나 위 전역 규칙에 맡긴다(`tw#2`, `tw#42`).

### 4.5 스크롤 등장(`data-animate`) 고치는 원칙

현재 `globals.css:88` 이 `[data-animate]` 를 처음부터 `opacity:0` 으로 숨기고 `AnimationObserver.tsx` 가 JS 로 드러낸다. JS 가 늦거나 실패하면 내용이 보이지 않고(studio-12 "첫 화면이 JS 실행 전까지 비어 있음"), reduced-motion 에서도 숨김이 유지된다.

1. JS 없이도 보인다: 숨김 규칙은 JS 가 준비됐다는 표시가 붙은 뒤에만 작동하게 한다(예: `AnimationObserver` 가 마운트되며 `<html data-motion="ready">` 를 달고, CSS 는 `html[data-motion="ready"] [data-animate]:not(.in-view)` 에만 숨김 적용). 표시를 달기 전에 이미 화면 안에 있는 요소는 먼저 `in-view` 처리해 깜빡임을 막는다. 근거: `motion#4` "Don't reveal below-the-fold content ... as invisible-by-default without a no-JS fallback".
2. 첫 화면 안의 요소에는 `data-animate` 를 쓰지 않는다.
3. 이동 거리 32~40px → 8~16px, 시간 0.7초 → 0.3~0.4초(`motion#4`).
4. 섹션당 한 번, 묶음은 최대 8개 순차(`motion#5`).
5. reduced-motion 에서는 4.4 규칙으로 최종 상태.

### 4.6 컴포넌트별 모션

| 컴포넌트 | 규칙 |
|---|---|
| 화이트 CTA | `transition-colors duration-150 hover:bg-neutral-200 active:bg-neutral-300`. 확대·펄스·글로우 없음 |
| 카드 링크 | `transition-colors duration-200 hover:border-neutral-600`. 이동을 쓰면 `hover:-translate-y-0.5 motion-reduce:transform-none` |
| 모달 | 배경 `bg-black/70` + 내용 fade·scale(0.98→1) 200ms, 닫힘 150ms. 블러는 배경을 닫을 수 있다는 신호일 때만(`QR §4 blur-purpose`) |
| 탭·토글 | 상태는 즉시 바꾸고 표시만 150ms 이동. 연속 클릭 시 이전 전환을 취소(`ux#119`) |
| 마퀴(studio `VideoMarquee`) | 일시정지/재생 버튼, 호버·포커스 시 `animation-play-state: paused`, 화면 밖·숨긴 탭에서 정지, reduced-motion 이면 정적 그리드(`motion#17`, `ux#108`) |
| 통계 카운트업(`LandingStats`, studio `StatsCounter`) | 1회 실행, reduced-motion 이면 최종값. 폭이 흔들리지 않게 `tabular-nums`(현재 적용, 유지) |
| 강조 밑줄(`.highlight-draw`) | `width` 1초 대신 `transform: scaleX()` 300ms(`ux#13`) |
| 스켈레톤 | 실제 내용과 같은 크기(`shadcn#41`), 내용이 오면 즉시 교체 |
| 차트 | 등장 애니메이션은 reduced-motion 에서 끄고, 데이터는 처음부터 읽혀야 한다(`QR §10 animation-optional`) |

## 5. Next.js · Tailwind 구현 규칙

### 5.1 버전 범위

| 항목 | 저장소 실제 버전 | 데이터셋 기준 | 처리 |
|---|---|---|---|
| Next.js | 14.2.35 (App Router) | `stacks/nextjs.csv` 는 "nextjs 16.2" 기준(59행 active) | 버전과 무관한 UI 규칙만 쓴다. Cache Components·`use cache`·`cacheLife`·`updateTag`·`revalidateTag(tag,"max")`·`proxy.ts` 는 14.2 에 없다(9장) |
| React | 18.2.0 | `react-performance.csv` 는 React/Next 일반, `stacks/react.csv` 는 "react 19.2.x" 기준 | `Activity`(`react#30`), `useEffectEvent`(`react#43`·`rstack#56`), `after()`(`react#15`), Actions·React Compiler(`rstack#54`~`#66`)는 이 버전에 없다 |
| Tailwind CSS | 4.1.18 (`@import "tailwindcss"`) | `stacks/html-tailwind.csv` 는 "html-tailwind 4.3" 기준 | 4.1 에 있는 기능만. `@container-size`(`tw#48` 의 4.3 기능)는 쓰지 않는다. `wrap-anywhere`·`text-balance`·`break-keep`·`motion-reduce`·`size-*`·`@utility` 는 4.1 에 있다 |
| shadcn/ui | 설치 안 됨 | `stacks/shadcn.csv` 는 CLI v4 기준 | 설치하지 않고 관례만 따른다(5.7). 의존성은 꼭 필요할 때만(불변 조건 6) |

README 도 "웹 스택 검색은 버전을 구분하며 세대를 섞지 않는다"고 적었다. 같은 원칙으로 16.2 전용 규칙은 14.2 에 섞지 않는다.

### 5.2 전역 CSS 에서 한 번에 고칠 것 (`src/app/globals.css`)

Tailwind v4 는 유틸리티를 `@layer utilities` 에 넣는다. 레이어 밖에 쓴 CSS 는 선택자 우선순위와 상관없이 레이어 안의 유틸리티를 이긴다. 현재 `body { background: var(--background) }`(`globals.css:26-27`, 값 `#0b0f17`)가 `<body className="bg-neutral-950">`(`layout.tsx:283`)를 이겨 푸터 위 남색 띠가 생기는 것도 이 때문이다(CONTEXT 확인 사실). 아래 규칙은 이 특성을 알고 배치한다.

| 규칙 | 근거 | 해결하는 문제 |
|---|---|---|
| `:root` 의 `--background` 를 `#000000` 으로(다크 선호 미디어쿼리 안의 `#0a0a0a` 도), `--ring` 을 흰색으로 | 확정 규칙(순수 블랙), `colors#53`(Ring #FFFFFF) | 남색 띠, 인디고 링 |
| `@theme` 에 의미 토큰 등록: `--color-accent: #00E5A0`, `--color-accent-hover: #66FFCC` 등(6.3 표) | `tw#22`, `tw#51`, `shadcn#4`·`#5`, `QR §6 color-semantic` | `text-[#00E5A0]` 같은 임의값 반복 |
| `@layer base` 에 `html { color-scheme: dark; scroll-padding-top: <고정 헤더 실제 높이>; }`. 데스크톱 네비는 `h-14`(3.5rem), 모바일은 메뉴 행이 더해지고 컨설팅은 `h-12` 보조 바가 더해지므로 화면별로 잰 값을 쓴다. 하단 고정 CTA 가 있는 화면은 `scroll-padding-bottom` 도 | `styles#7` "color-scheme: dark", `ux#100`, `ux#2` | 고정 헤더가 앵커·포커스를 가림 |
| `@layer base` 에 `body { word-break: keep-all; overflow-wrap: break-word; }` | `ux#112`, `ux#110`, `ux#111` (데이터셋에 한국어 전용 행은 없어 원칙을 한국어에 적용) | 모바일 헤드라인 단어 중간 끊김 |
| `@layer base` 에 `button:not(:disabled), [role="button"]:not([aria-disabled="true"]), summary { cursor: pointer; }` | README 점검표 "cursor-pointer", `ux#29` | Tailwind v4 의 버튼 기본 커서(화살표) |
| 레이어 밖에 `:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }` (밝은 배경 위 요소는 `outline-color: #000`) | `ux#28`, `QR §1 focus-states`(2-4px), `colors#53` Ring | `outline-none` 68건이 포커스를 지움. 레이어 밖 규칙이라 v4 의 `outline-none`(`outline-style:none`) 유틸리티를 이긴다. 이후 컴포넌트별로 `outline-none` 을 정리 |
| 4.4 의 reduced-motion 규칙 | `ux#9`, `ux#99`, `tw#42` | 동작 줄이기 무시 |
| `@utility content-auto { content-visibility: auto; contain-intrinsic-size: auto 500px; }` | `tw#47`, `react#26` | 긴 목록 렌더 비용 |
| `.sr-only` 는 Tailwind 기본 제공. 숨김 라벨·건너뛰기 링크에 사용 | `tw#40` | 아이콘 버튼 이름, 건너뛰기 링크 |

### 5.3 Next.js 규칙 (14.2 에 맞는 것만)

| ID | 규칙 | 근거 | 심각도 | 적용 위치 |
|---|---|---|---|---|
| N01 | 내부 이동은 `next/link`. 외부 링크·`mailto:`·파일 다운로드만 `<a>`. | `next#42` | High | 루트 레이아웃 네비·로고·푸터의 내부 `<a>`(내부 `<a href="/…">` 35건/14파일). 메뉴 이동마다 전체 새로고침이 사라진다. `Link` 는 서버 컴포넌트에서 쓸 수 있어 레이아웃 정적성에 영향 없음 |
| N02 | 라우트 단위 로딩 UI 는 `loading.tsx`(내용과 같은 모양의 스켈레톤). | `next#5`, `shadcn#40`·`#41` | Medium | `loading.tsx` 0개. `/search`, `/channels/[channelId]`, `/community` 부터 |
| N03 | 라우트 단위 오류는 `error.tsx` + 다시 시도(`reset`), 한국어 문구와 다음 행동. | `next#6`, `ux#80` | High | 현재 `app/error.tsx`, `search/error.tsx`, `sso-callback/error.tsx` 만 있음. `/threads`, `/channels`, `/community` 에 추가 |
| N04 | 기본은 서버 컴포넌트, `'use client'` 는 상호작용 잎에만. 페이지 전체를 클라이언트로 만들지 않는다. | `next#7`, `next#8`, `next#9` | High | `studio/class/consulting/page.tsx` 는 상태·이벤트 훅이 없는데 페이지 전체가 `'use client'` 다. 안에서 쓰는 `TrackVisit` 은 이미 자체 `'use client'` 컴포넌트이므로 페이지는 서버 컴포넌트로 둘 수 있다 |
| N05 | 느린 데이터는 Suspense 로 흘려보내 껍데기를 먼저 보여 준다. | `next#10`, `react#5` | Medium | 채널 분석, 내 채널. 데이터 조회 로직 자체는 바꾸지 않는다(불변 조건 4) |
| N06 | 렌더 전략 유지: 정적 페이지는 정적으로, `/incubating` 은 `revalidate = 60` + `unstable_cache`. 루트 레이아웃에서 `auth()`·`cookies()`·`currentUser()` 금지. | `next#11`, 불변 조건 2 | High | 모든 마케팅 페이지. 빌드 출력의 ○(정적)·●(ISR) 표시로 확인 |
| N07 | 이미지는 `width`·`height` 또는 `fill` 로 자리를 잡고, 첫 화면 LCP 이미지만 `priority`. | `next#17`~`#21` | High | 컨설팅 1번 이미지 `priority`(유지), 나머지는 지연 로드. 썸네일 처리 방식은 H15 의 비용 판단 |
| N08 | 글꼴은 `next/font` 로 자체 호스팅하고 루트 레이아웃 `body` 에 적용. 가변 글꼴 한 파일. | `next#22`, `next#23`, `next#24` | Medium | 현재 `Inter`(latin)만 로드(`layout.tsx:12`), `body` 에 `inter.className` 을 붙여 한글은 OS 기본 글꼴로 나온다. 6.2 의 글꼴 계획 |
| N09 | 페이지별 메타데이터와 OG 이미지. | `next#25`~`#27` | Medium | 메타데이터는 대부분 있음. 마케팅 페이지별 OG 이미지 점검 |
| N10 | 탭·페이지네이션 이동은 `scroll={false}`, 우선순위 낮은 링크는 `prefetch={false}`. | `next#43`, `next#44` | Low | 커뮤니티 페이지네이션·탭, 채널 탭 |
| N11 | 무거운 클라이언트 컴포넌트는 `next/dynamic`. | `next#39`, `react#7` | Medium | recharts 차트(`threads/_components/ProfileViewsChart.tsx`, `components/VideoCard.tsx`), `VideoModal`, 결제 SDK |
| N12 | 사용자 입력을 그대로 HTML 로 넣지 않는다. 렌더 전 정제 여부를 확인한다. | `next#50` | High | `dangerouslySetInnerHTML` 9건/8파일(커뮤니티 `PostContent` 등). 확인만 하고, 정제 로직이 없으면 오케스트레이터에 보고 |
| N13 | 내용이 늦게 와도 자리를 미리 잡는다. | `next#40` | High | H14 와 같음 |

### 5.4 React 규칙 (18.2 에 맞고 UI 계층에 해당하는 것)

| ID | 규칙 | 근거 | 적용 위치 |
|---|---|---|---|
| R01 | 분석·로깅 같은 서드파티는 하이드레이션 뒤에. | `react#8` (Medium) | 카카오 SDK, 방문 추적 |
| R02 | 기능을 켰을 때만 큰 모듈을 불러온다. hover·focus 같은 의도 신호에서 미리 불러온다. | `react#9` (High), `react#10` (Medium) | 영상 상세 모달, AI 분석, 결제 위젯 |
| R03 | 서버에서 클라이언트로 넘기는 데이터는 쓰는 필드만. | `react#13` (High) | 검색 결과·채널 데이터를 클라이언트 컴포넌트에 넘기는 곳 |
| R04 | 급하지 않은 상태 변경(필터·정렬 결과 다시 그리기)은 `startTransition`. | `react#24` (Medium) | 검색 결과 정렬·필터. 검색 실행·누적 로직은 그대로 |
| R05 | 긴 목록은 `content-visibility:auto`. | `react#26` (High) | H32 |
| R06 | 0 이 될 수 있는 숫자로 `&&` 조건 렌더를 하지 않는다(화면에 "0" 이 찍힘). | `react#29` (Low) | 개수·카운트 표시부 전반 |
| R07 | SVG 를 직접 움직이지 말고 감싼 div 를 움직인다. | `react#25` (Low) | 아이콘 회전·이동 |

UI 계층이 아니라 쓰지 않는 행: `react#1~#4`·`#11`·`#12`·`#14`·`#16`(데이터 조회·API 로직, 불변 조건 4), `react#15`(Next 15 `after()`), `react#30`(React 19 `Activity`), `react#43`(React 19.2 `useEffectEvent`).

`stacks/react.csv`(Applies To "react 19.2.x") 에서 React 18.2 에도 그대로 맞는 UI 행

| ID | 규칙 | 근거 | 적용 위치 |
|---|---|---|---|
| R08 | 클릭 동작은 `<button>`, 이동은 `<nav>`·링크. `div onClick` 금지 | `rstack#43` (High) | C03 과 같음 |
| R09 | 모달은 포커스를 가두고 닫으면 돌려준다 | `rstack#44` (High) | H02 와 같음 |
| R10 | 바뀌는 내용은 `aria-live` 로 알린다 | `rstack#45` (Medium) | H10, H22 |
| R11 | 라벨은 `htmlFor` 로 입력 `id` 와 연결 | `rstack#46` (High) | H07(현재 `htmlFor` 4건) |
| R12 | 폼은 `onSubmit` + `preventDefault` 로 처리(Enter 제출이 되게). 버튼 `onClick` 에만 의존하지 않는다 | `rstack#27` (Medium) | studio 문의 폼, 글쓰기, 검색창(누적 로직 호출 순서는 그대로) |
| R13 | 검색·필터 입력은 `useDeferredValue` 또는 debounce(React 18 에 있음) | `rstack#28` (Medium) | 목록 안 필터 입력 |
| R14 | 목록 key 는 안정적인 ID. 배열 인덱스 금지 | `rstack#10` (High) | 검색 결과, 피드, 댓글 |
| R15 | 구역별 오류 경계, 비동기 오류는 처리하거나 알린다(조용히 삼키지 않기) | `rstack#39`·`#40` (High) | N03, H12 |

React 19 전용이라 쓰지 않는 `stacks/react.csv` 행: React Compiler(`rstack#54`·`#55`·`#61`), `useEffectEvent`(`#56`), Actions·`useActionState`·`useFormStatus`·`useOptimistic`·`use()`(`#57`·`#62`~`#66`), ref 를 prop 으로(`#58`·`#59`), React 19.2.1 RSC 고정(`#60`, 이 저장소는 React 18.2 라 그대로 적용되지 않고 보안 판단은 UI 범위 밖).

### 5.5 Tailwind 규칙 (4.1)

| ID | 규칙 | 근거 | 적용 위치 |
|---|---|---|---|
| T01 | 포커스는 `focus-visible:` 로(마우스 클릭엔 안 보이고 키보드엔 보이게). | `tw#26`, `tw#41` | 5.2 전역 규칙 + 컴포넌트 정리 |
| T02 | 움직임에 `motion-reduce:` 변형. | `tw#2`, `tw#42` | 4.4 |
| T03 | 전환 시간은 `duration-150`~`300`. | `tw#3` | 4.2 |
| T04 | z-index 는 단계 토큰만(5.6). | `tw#5`, `tw#6` | 임의값 16건 |
| T05 | 본문 폭은 하나의 기준 컨테이너(`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`)를 네비·본문·푸터가 같이 쓴다. | `tw#8`, `tw#9`, `QR §5 container-width` | 네비는 `w-full px-3`(`layout.tsx:303`), 본문은 가운데 정렬 컨테이너라 좌우 기준선이 어긋남(CONTEXT 확인 사실) |
| T06 | 이미지 상자는 `aspect-video` 등으로 비율 고정, `object-cover`. | `tw#12`, `tw#13`, `tw#14` | 썸네일, 채널 배너 |
| T07 | 반응형 이미지 배치는 모바일 우선(`w-full md:…`). | `tw#15`, `tw#30` | 커뮤니티 첨부 이미지(세로로 긴 캡처는 높이 상한 + 원본 보기) |
| T08 | 본문 행간 `leading-relaxed` 이상, 글자 크기는 단계 유틸리티만. | `tw#17`, `tw#18` | 6.2 |
| T09 | 의미 토큰을 `@theme` 에 등록해 `bg-accent` 처럼 쓴다. 컴포넌트에 팔레트 값을 반복하지 않는다. | `tw#22`, `tw#51` | 5.2 |
| T10 | 비활성: `disabled:opacity-50 disabled:cursor-not-allowed`. | `tw#28` | M07 |
| T11 | 플레이스홀더는 `placeholder:text-neutral-500`. 라벨 대신 쓰지 않는다. | `tw#29`, `ux#54` | 모든 입력 |
| T12 | 경계 구간 바로 아래·위·안에서 모두 확인(320/375/414/768/1024/1440). | `tw#31`, `ux#65`, README "Responsive: 375px, 768px, 1024px, 1440px" | 8장 |
| T13 | 버튼 크기는 정해진 두세 가지로. 모바일 주요 버튼 `min-h-11`. | `tw#33`, `tw#34` | 5.6 버튼 변형 |
| T14 | 처리 중 버튼은 `disabled` + `aria-busy="true"`. | `tw#35` | H11 |
| T15 | 아이콘 버튼 `aria-label`, 숨김 글자 `sr-only`. | `tw#36`, `tw#40` | C06 |
| T16 | SVG 에 `width`·`height` 속성을 직접 준다(CSS 로드 전 자리 확보). | `tw#55` | 인라인 SVG 아이콘 전반 |
| T17 | 클래스 이름은 완성된 토큰으로. `bg-${color}-500` 처럼 조립하지 않는다. | `tw#56` | 현재 조립 사례 0건(유지). 변형 맵(5.6)도 완성 토큰으로 |
| T18 | 짧은 여러 줄 제목은 `text-balance` + 읽기 폭 제한, `<br>` 금지. | `tw#57` | M26 |
| T19 | 예측 못 하는 글(URL, 사용자 글)은 `wrap-anywhere`, 그 flex 부모는 `min-w-0`. | `tw#58` | H19 |
| T20 | 칩 묶음 `flex flex-wrap gap-2`, 칩 하나는 `whitespace-nowrap min-w-0 truncate` + 닫기 아이콘 `shrink-0`. | `tw#59` | H20, H21 |
| T21 | 부모·형제 상태 스타일은 `group-*`·`peer-*` 로(JS 없이). | `tw#49` | 카드 hover 안의 화살표 등 |
| T22 | 정사각형은 `size-*`, flex 고정은 `shrink-0`. | `tw#53`, `tw#54` | 아이콘 |

쓰지 않는 Tailwind 행은 9장(`tw#1` 설명 오류, `tw#16`·`#46` 플러그인 추가, `tw#21` 라이트/다크 전환, `tw#37`·`#38` 그림자 카드, `tw#48` 4.3 기능, `tw#52` 그라데이션).

### 5.6 토큰

z-index 단계 (`ux#15`, `tw#5`, `QR §5 z-index-management` 의 예시 단계를 bibllab 의 현재 값에 맞춤)

| 단계 | 값 | 쓰는 곳 |
|---|---|---|
| 기본 | `z-0` | 일반 콘텐츠 |
| 띄움 | `z-10` | 표의 고정 머리줄, 카드 안 겹침 |
| 페이지 고정 | `z-30` | 컨설팅 보조 바(`sticky top-14`), 모바일 하단 고정 CTA |
| 떠 있는 도움 | `z-40` | 카카오 상담 버튼 |
| 전역 네비 | `z-50` | `layout.tsx:302`(현재 값 유지) |
| 모달 + 배경 | `z-60` | 모든 모달·시트(현재 `z-[60]` 을 토큰으로) |
| 토스트 | `z-70` | 알림 |

Tailwind v4 는 `z-60`·`z-70` 같은 정수 값을 대괄호 없이 받는다.

버튼 변형 (하나의 출처에서 관리: `shadcn#7`·`#57`·`#58` 관례, `tw#33`·`#56`, 확정 규칙 "주요 CTA 는 화이트, 색 배경 버튼 금지")

| 변형 | 클래스 (완성 토큰) | 용도 |
|---|---|---|
| primary | `bg-white text-black font-bold hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed` | 화면당 하나의 주 행동(`QR §4 primary-action`) |
| secondary | `border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800` | 보조 행동 |
| ghost | `text-neutral-300 hover:text-white hover:bg-neutral-900` | 툴바·목록 안 행동 |
| link | `text-neutral-300 underline-offset-4 hover:text-white hover:underline` | 문장 안 이동 |
| danger | `border border-red-500/40 text-red-400 hover:bg-red-500/10` | 삭제·해지(확인 대화상자와 함께) |
| brand | 카카오 `bg-[#FEE500] text-black`(16.42:1). 유튜브 `#FF0000` 배경에 흰 글자는 4.0:1 이라 작은 글자 기준 미달 → 유튜브 빨강은 로고·아이콘에 쓰고 버튼은 secondary + 빨간 로고, 또는 18.66px 이상 굵은 글자 | 브랜드 버튼만 예외(보존 색) |

크기: `sm` = `h-9 px-3 text-sm`(데스크톱 보조), `md` = `h-11 px-5 text-sm`(기본, 모바일 44px), `lg` = `h-12 px-6 text-base`(히어로 CTA).

기타 토큰
- 아이콘 크기 16·20·24px, 선 굵기 2 하나로(`SC` "Consistent Icon Sizing", "Stroke Consistency"). 현재 인라인 SVG 의 선 굵기가 1.8·2·2.4 로 섞여 있다.
- 간격은 4/8 단위(`QR §5 spacing-scale`, `tw#23`), 섹션 간격은 단계로(`SC` "Section spacing hierarchy").
- 모서리: 버튼 `rounded-xl`, 카드 `rounded-2xl`(현재 관례 유지). `styles#1` 의 0px 모서리는 채택하지 않는다(9장).

### 5.7 shadcn/ui 관례 (설치 없이 따른다)

| 관례 | 근거 | bibllab 적용 |
|---|---|---|
| 표면 색과 그 위 글자 색을 짝으로 정의 | `shadcn#4`, `shadcn#5` | 6.3 토큰 표의 `surface`/`fg` 짝 |
| 버튼 변형을 한 곳에서 관리 | `shadcn#7`, `#57`, `#58` | 5.6 버튼 변형 (cva 없이 완성 토큰 맵) |
| 대화상자에 제목·설명(`aria-labelledby`·`aria-describedby`), 포커스 가둠·복귀, Esc 닫기 | `shadcn#13`, `shadcn#53` | 모든 모달(H02) |
| 파괴적 동작 확인은 취소/확인 두 버튼의 표준 형태 | `shadcn#42`, `shadcn#43` | `ConfirmDialog.tsx` |
| 표는 `thead`/`tbody`/`th scope` 구조 | `shadcn#24`, `shadcn#25` | 표 16개 |
| 탭은 탭 역할(`role="tablist"`) 또는, 이동이면 링크 + `aria-current` | `shadcn#27` | `CommunityTabs.tsx`, 채널 탭 |
| 아코디언은 네이티브 `<details>/<summary>` 또는 `button[aria-expanded][aria-controls]` | `shadcn#29`, `#30` | 요금제 `FaqAccordion.tsx`(pricing-12). studio FAQ 는 이미 `<details>`(유지) |
| 토스트는 성공·오류 의미별로 | `shadcn#33` | M08 |
| 설명 툴팁은 `title` 속성 대신 포커스로도 열리는 요소 | `shadcn#38` + `ux#116` | 지표 설명, 잠금 안내 |
| 스켈레톤은 실제 내용 크기 | `shadcn#40`, `#41` | N02 |
| 차트 색은 한 설정 파일에서 | `shadcn#48` | 7장 차트 색 맵 |
| 라벨은 컨트롤과 연결 | `shadcn#54` | H07 |
| 이동은 링크, 동작은 버튼. `button` + `router.push` 로 이동하거나 `href` 없는 `<a>` 로 동작하지 않는다 | `shadcn#67` | CTA 전반 |

## 6. 스타일·타이포·색 권고 (확정 규칙과 대조)

확정 규칙(순수 블랙, neutral, 에메랄드 단일 액센트, 화이트 CTA, 그라데이션·글로우·펄스 금지)에 맞는 권고만 채택했다. 같은 행 안에서도 맞지 않는 항목은 버렸고, 버린 것은 9장에 모았다.

### 6.1 스타일 대조표 (`styles.csv`)

| 스타일 (행, 상태) | 채택 범위 | 가져오는 것 | 버리는 것 |
|---|---|---|---|
| Minimalism & Swiss Style (`styles#1`, active) | 전 페이지 기본 | 흑백 단색 체계, `--accent-color: single primary only`, `--shadow: none`, "No unnecessary decorations", 200-250ms 은은한 hover, 분명한 글자 위계, 빠른 로딩. 적합 용도에 SaaS·대시보드·전문 도구 | `--border-radius: 0px`, 베이지·토프 같은 따뜻한 중간색 |
| Dark Mode (OLED) (`styles#7`, active) | 배경 체계 | `#000000` 배경, `color-scheme: dark`, 보이는 포커스, 높은 가독성. 체크리스트의 "Text contrast 7:1+" 는 본문 목표로 | "Minimal glow (text-shadow)", 여러 개의 네온 액센트, Midnight Blue `#0A0E27`, 다크 그레이 `#121212` 배경 대안 |
| Accessible & Ethical (`styles#8`, active) | 접근성 기준 | 보이는 포커스 링, 건너뛰기 링크, ARIA 라벨, reduced-motion, 44px 터치, `cursor: pointer`, 시맨틱 HTML. "Do Not Use For: None" | 포커스 링 3-4px 는 2px + 2px 간격으로 조정(`QR §1 focus-states` 2-4px 안) |
| Flat Design (`styles#12`, active) | 부분 | 그라데이션·그림자 없음, 색·투명도만 바꾸는 hover, 150-200ms, 단순화한 SVG 아이콘, 선 1-2px | 밝은 원색 4-6개, 높은 채도, 아이콘 위주 레이아웃 |
| Swiss Modernism 2.0 (`styles#50`, supplemental) | 부분 | `#000/#FFF` + "single vibrant accent only", "no gradients", 8px 기본 단위 | 엄격한 12단 비대칭 그리드 강제 |
| Exaggerated Minimalism (`styles#47`, active) | 마케팅 헤드라인만 | 굵기 900, 흑백 + 단일 액센트, 장식 없음, 큰 여백. 소유자의 font-black 두 톤 헤드라인과 같은 방향 | `letter-spacing: -0.05em`(한글엔 과함, -0.02em 이내), `clamp(…12rem)` 초대형, 그리고 원문이 "Do Not Use For: dashboards, forms, data-heavy" 로 막은 앱 화면 |
| Data-Dense Dashboard (`styles#28`, active) | (바) 데이터 화면 | 정렬 가능한 표, 동작하는 필터, 데이터 로딩 상태, 내보내기, 고정 머리줄, 표 `overflow:auto`, 행 높이 약 36px, 성공·경고·경보 의미색 | 밝은 회색 기본면 `#F5F5F5`, 차트 클릭 확대 |
| Drill-Down Analytics (`styles#32`, supplemental) | 채널 → 영상 | 브레드크럼, 쉬운 뒤로가기, 맥락 유지, 딥링크, `details/summary` 펼침 | 단계별 색 구분 |
| Comparative Analysis Dashboard (`styles#33`, supplemental) | 기간·채널 비교 | 증감 화살표 + 부호 있는 숫자, 상승 그린·하락 레드(의미색), 기준선 표시, 모바일에서 세로로 쌓기 | 파랑·주황·보라 비교색(에메랄드 대 neutral 로) |
| Micro-interactions (`styles#16`, active) | 부분 | 성공·오류 상태를 분명히, hover 효과는 `@media (hover: hover)` 안에서만(Tailwind v4 의 `hover:` 가 이미 그렇게 동작), 눌림은 `:active` | 햅틱, 제스처 |
| Minimalist Monochrome (`styles#70`, Mobile, supplemental) | 부분 | 그림자 없음, 헤어라인 구분선, 글자 위계 | 세리프 3종 조합, 전 요소 0px 모서리, 종이 노이즈, 즉시 반전, 4px 검정 구분선(라이트 전제) |
| Editorial Grid / Magazine (`styles#66`, active) | 커뮤니티 글 상세, 인사이트 칼럼 | 긴 글 가독성, `figure/figcaption`, 인용 블록 | 세리프 본문, 드롭캡, 패럴랙스 이미지, 페이지 넘김 |

충돌해서 채택하지 않는 스타일: Glassmorphism(`#3`), Liquid Glass(`#14`), Aurora UI(`#10`), Gradient Mesh(`#65`), Cyberpunk UI(`#41`), AI-Native UI(`#43`), Motion-Driven(`#15`), Vibrant & Block-based(`#6`), Soft UI Evolution(`#19`), Claymorphism(`#9`), Neumorphism(`#2`), Bento Box Grid 의 효과(`#39`), Parallax Storytelling(`#49`), Kinetic Typography(`#48`), Interactive Cursor(`#62`), 3D & Hyperrealism(`#5`), Brutalism(`#4`). 이유는 9장.

### 6.2 타이포그래피 (`typography.csv`, `QR §6`)

글꼴
- 현재: CSS·Tailwind 설정은 Pretendard 를 가리키지만 로드하는 코드가 없고(CONTEXT), 루트 레이아웃은 `next/font` 로 Inter(latin)만 받아 `body` 에 `inter.className` 을 붙인다(`layout.tsx:12`, `:283`). 클래스 선택자가 `body` 선택자를 이기므로 Inter 가 적용되고, 한글 글리프는 Inter 에 없어 OS 기본 글꼴로 나온다.
- 데이터셋의 한국어 조합은 `type#23` Korean Modern(Noto Sans KR 단일 가족, 굵기 변화) 하나뿐이다. 데이터셋은 Google Fonts 만 다뤄 Pretendard 는 목록에 없다.
- 권장: Pretendard Variable 을 `next/font/local` 로 자체 호스팅해 `body` 와 `@theme` 의 `--font-sans` 에 적용한다(`next#22`·`#23`·`#24`, `ux#50`·`#75`).
  - 이유: 기존 CSS 의도와 같고, Pretendard 의 라틴 글자는 Inter 에서 왔으므로 지금의 영문·숫자 인상이 유지된다. 단일 가변 파일이라 `next#24` 와도 맞는다.
  - `display: "swap"`, 대체 글꼴 `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`. Inter 로드는 빼서 바이트를 줄인다.
  - 글꼴 파일은 npm 의존성이 아니라 저장소 자산으로 둔다(불변 조건 6).
- 대안: 로컬 파일을 두지 않기로 하면 `type#23` 의 Noto Sans KR 을 `next/font/google` 로(굵기 400·500·700·900, CJK 라 `preload: false`).
- 숫자: 표 열·가격·카운터는 `tabular-nums`(`QR §6 number-tabular`). Pretendard 는 고정폭 숫자를 지원한다.

크기·굵기 단계 (`QR §6 font-scale` 12·14·16·18·24·32 를 기준으로 확정 헤드라인 패턴을 얹음)

| 역할 | 크기 | 굵기 | 행간 | Tailwind |
|---|---|---|---|---|
| 캡션·메타 (최소) | 12px | 500 | 1.5 | `text-xs` |
| 영문 섹션 라벨 | 12px, 대문자 | 900 | 1 | `text-xs tracking-[0.25em] font-black` (확정 패턴, 12px 미만 금지) |
| 보조 본문·표 셀 | 14px | 400·500 | 1.5 | `text-sm` |
| 본문 | 16px (모바일 필수) | 400 | 1.6~1.75 | `text-base leading-relaxed` |
| 리드 | 18px | 400 | 1.6 | `text-lg` |
| 소제목 | 20~24px | 700 | 1.4 | `text-xl` / `text-2xl font-bold` |
| 섹션 헤드라인 | 30~36px | 900 | 1.25 | `text-3xl md:text-4xl font-black` |
| 히어로 | 36px(모바일)~60px | 900 | 1.15~1.2 | `text-4xl md:text-6xl font-black` |

- 굵기 위계: 제목 700~900, 본문 400, 라벨 500(`QR §6 weight-hierarchy`).
- 자간: 본문은 기본값(`QR §6 letter-spacing` "avoid tight tracking on body text"). 헤드라인은 `tracking-tight`(-0.025em)까지.
- 한국어 줄바꿈: `word-break: keep-all` + `overflow-wrap: break-word`(5.2), 사용자 글은 `wrap-anywhere`(H19), 제목은 `text-balance`(M26), 문장 중간 `<br>` 금지.
- 읽기 폭: 데이터셋의 65~75자는 라틴 기준이다(`ux#73`). `max-w-prose`(65ch)는 한글 약 36자에 해당하고, 모바일은 `QR §5 line-length-control` 의 35~60자 범위 안에 든다.
- 영문 섹션 라벨(예: "PROCESS")이 왼쪽 한국어 캡션을 반복하는 장식이면 `aria-hidden="true"` 로 화면 낭독에서 뺀다(`SC` "Contextual Semantics").

### 6.3 색 토큰 (`colors.csv` + 확정 규칙)

데이터셋에서 가장 가까운 팔레트는 `colors#53` Photography Studio("Pure black + white contrast": Background `#000000`, Foreground `#FAFAFA`, Accent `#F8FAFC`, Ring `#FFFFFF`)와 `colors#79` Coding Bootcamp(초록 액센트 위 글자를 어두운 색으로: On Accent `#0F172A`)다. 다크 팔레트 대부분(`colors#6`·`#24`·`#79`·`#81`·`#163`·`#188`)이 포커스 링을 흰색으로 둔다. 다만 이들의 배경 `#020617`·`#0F172A`, 보조 글자 `#94A3B8`, 테두리 `#334155`·`#3F3F46` 은 청색기 있는 slate·zinc 라 neutral 로 바꾼다.

| 토큰 | 값 | 용도 | 대비 (검정 위 / `neutral-900` 위) |
|---|---|---|---|
| `bg` | `#000000` (`bg-black`) | 페이지 배경 | 기준 |
| `surface` | `neutral-900` | 카드 | 기준 |
| `surface-hover` | `neutral-800` | 카드·행 hover, 눌림 | |
| `border` | `neutral-800` | 카드·구분선(장식) | 1.39 / 1.19. 장식 전용, 입력 경계로 쓰지 않음 |
| `border-control` | `neutral-500` | 입력·체크박스·토글 경계 | 4.44 / 3.19 (비텍스트 3:1 충족) |
| `fg` | `white` | 제목, 주요 글자 | 21.00 / 17.91 |
| `fg-body` | `neutral-300` | 긴 본문(눈부심을 줄이고 싶을 때) | 14.17 / 12.09 |
| `fg-muted` | `neutral-400` | 보조 글자, 메타 | 8.10 / 6.91 |
| `fg-subtle` | `neutral-500` | 큰 글자(24px 이상 또는 19px 굵게), 비활성, 플레이스홀더 | 4.44 / 3.79. 일반 크기 정보 글자에는 쓰지 않음 |
| 금지 | `neutral-600`·`700` 글자 | | 2.69 / 2.02 |
| `accent` | `#00E5A0` | 강조 한 곳, 진행 바, 선택 점, 차트 주 계열 | 12.72 / 10.85 |
| `accent-hover` | `#66FFCC` | 액센트 링크 hover | 16.74 / 14.28 |
| `on-accent` | `#000000` | 액센트 배경 위 글자 | 12.72. 흰 글자는 1.65 라 금지 |
| `ring` | `#FFFFFF` (밝은 면 위에선 `#000000`) | 포커스 | 21.00 |
| `danger` | `red-400`(글자), `red-500`(표시) | 오류, 할인 | 7.26·5.50 / 6.19·4.69 |
| `warning` | `amber-400` | 경고, 임박 | 12.23 / 10.43 |
| `success` | `green-400` | 성공 | 11.83 / 10.09 |
| `star` | `amber-400` | 별점 | 12.23 |
| 브랜드 | 카카오 `#FEE500`(검정 글자 16.42), 유튜브 `#FF0000`(검정 위 5.25, 그 위 흰 글자는 4.00), 구글, 네이버 | 브랜드 버튼·로고 | |

- 에메랄드 액센트와 성공 그린은 둘 다 초록 계열이다. 성공은 항상 아이콘·글자("완료")를 함께 쓰고, 한 요소 안에서 둘을 나란히 쓰지 않는다.
- channels 보고서 부록 A 는 회색 정보 글자를 "`neutral-500` 이상(대비 3.78 이상)"으로 바꾸자고 했다. 3.78 은 큰 글자 기준(3:1)만 넘으므로, 일반 크기 정보 글자는 이 문서 기준인 `neutral-400` 을 따른다.
- 대비 값은 설치된 Tailwind 4.1 의 OKLCH 값(`node_modules/tailwindcss/theme.css`)을 sRGB 로 바꿔 WCAG 공식으로 계산했다. channels 보고서 부록 B 의 값(neutral-500 on black 4.43, on neutral-900 3.78, black on #00E5A0 12.72)과 일치한다.

### 6.4 아이콘

| 규칙 | 근거 | 적용 위치 |
|---|---|---|
| 아이콘으로 이모지를 쓰지 않는다. SVG 만 | README 납품 전 점검표 "No emojis as icons", `SC` "No Emoji as Structural Icons", `QR §4 no-emoji-icons` | 화면 코드(.tsx, API 라우트·lib 제외)에 이모지·기호 129건/34파일(`📊🔥🚀📈💡📥🔖🎉` 등이 검색·채널·저장·계산기·마이페이지·`VideoModal` 에). `✓`·`✕`·`★` 글자 기호도 SVG 로. API 라우트의 메일 본문 등은 화면 아이콘이 아니라 대상 밖 |
| 한 가족·한 선 굵기·정해진 크기(16·20·24) | `SC` "Consistent Icon Sizing", "Stroke Consistency", "Filled vs Outline Discipline", `QR §4 icon-style-consistent` | 인라인 SVG 선 굵기 1.8·2·2.4 혼재 → 2 |
| 장식 아이콘은 `aria-hidden="true"`, 뜻이 있는 단독 아이콘은 대체 텍스트 | `SC` "Contextual Semantics", `QR §1 icon-context`, `app#5` | `aria-hidden` 15건/7파일 |
| 아이콘 박스·원형 숫자 배지 없이 맨 SVG, 순서는 `01` 텍스트 숫자 | 확정 규칙 | 전 페이지 |
| 브랜드 로고는 공식 자산, 비율·여백 유지 | `SC` "Correct Brand Logos" | 카카오·구글 로그인 버튼, 유튜브 링크 |
| 뜻이 있는 아이콘·컨트롤 경계는 인접 색과 3:1 | `SC` "Icon Contrast" | 잠금 아이콘(`neutral-500` 이상) |
| 아이콘 라이브러리를 새로 들이지 않는다 | 불변 조건 6 (`SC` 는 Phosphor 를 기본으로 권하지만 채택하지 않음) | 현재 인라인 SVG(24 viewBox, 선 아이콘) 유지 |

## 7. 데이터 화면 차트 규칙

근거: `charts.csv` 25행, `QR §10 Charts & Data`, `reasoning#7`, `styles#28`·`#32`·`#33`, channels 보고서 부록 A(구 테마 → 확정 테마 색 매핑). 현재 차트는 recharts 3.6(`threads/_components/ProfileViewsChart.tsx`, `components/VideoCard.tsx:86-116`), 직접 그린 SVG(`components/Sparkline.tsx`), 칸 격자(`my-channel/_components/ChannelDashboard.tsx:205-225`), 원형 게이지(`search/_components/KeywordCompetition.tsx`)다.

### 7.1 차트 종류 선택

| 데이터 | bibllab 화면 | 차트 | 근거 | 조건 |
|---|---|---|---|---|
| 시간에 따른 추이(조회수, 구독자, 프로필 조회) | 채널 분석, 내 채널, `ProfileViewsChart`, 영상 카드 추세 | 선 | `charts#1` | 점이 4개 미만이면 숫자 카드로. 계열은 6개 이하. 1000점 이상이면 줄이거나 묶기 |
| 항목 비교·순위(영상별 조회수, 채널 비교) | 검색 결과, 채널 상세 | 막대, 값 내림차순 | `charts#2` | 20개 미만 세로, 20~50개 가로, 50개 초과는 페이지 나눈 표. 15개 초과면 표가 낫다 |
| 부분 대 전체(유입 경로 등) | 관리자 트래픽 | 100% 막대, 또는 5조각 이하 도넛 | `charts#3`(risk:high), `QR §10 no-pie-overuse` | 조각마다 % 라벨, 표 대체 필수 |
| 강도(요일별 업로드 성과) | 내 채널 `ChannelDashboard` | 막대 또는 숫자 칸 | `charts#5` "When NOT to Use: Fewer than 20 cells (use bar)" | 요일 7칸은 히트맵 기준(20칸 이상)에 못 미친다. 칸 형식을 유지하면 숫자가 주, 색은 보조(현재 칸 안에 숫자 표시, 유지) |
| 목표 대비 성과(경쟁도 점수 0~100, 3단계) | 검색 `KeywordCompetition` | 게이지 또는 불릿 | `charts#8`, `charts#18` | 숫자와 단계 글자("낮음/보통/높음")를 옆에, 구간 라벨, 색은 보조 |
| 작은 추세(스파크라인) | `Sparkline`, `VideoCard` 추세 | 스파크라인 | `charts#1`, `QR §10 direct-labeling` | 숫자 값을 옆에 쓰고, 그래프는 `aria-hidden` 장식이거나 요약 라벨을 가진다 |
| 등급(Good/Normal/Bad, 성장 등급) | `components/PerformanceBadge.tsx` 등 | 배지(글자 + 색) | `ux#114`, H05 | 글자 필수(현재 있음), 12px 이상(현재 `text-[10px]`) |

### 7.2 색

| 역할 | 값 | 근거 | 현재 → 변경 |
|---|---|---|---|
| 주 계열 | `#00E5A0` (검정 위 12.72) | 확정 액센트. `QR §10 contrast-data`(표시 3:1) 충족 | `ProfileViewsChart` `#14b8a6`(틸), `VideoCard`·`Sparkline` `#60a5fa`(파랑) → 에메랄드 |
| 비교 계열 1 | `neutral-400` `#a1a1a1` 실선 또는 파선 | `charts#1` "distinct line styles", 3:1 충족 | |
| 비교 계열 2 | `neutral-500` `#737373` 점선 | 검정 위 4.44, 카드 위 3.79 로 3:1 충족 | |
| 막대 기본 / 강조 | `neutral-500` / `#00E5A0` | `charts#2` 의 "막대마다 다른 색" 대신 한 색 + 강조 하나 | `neutral-600` 막대는 검정 대비 2.69 라 금지 |
| 격자선 | `neutral-800` `#262626` | `QR §10 gridline-subtle`(데이터와 경쟁하지 않게) | `#1f2937`(slate) → neutral |
| 축선 | `neutral-700` `#404040` | channels 부록 A | `#374151` → neutral |
| 눈금·축 글자 | `neutral-400` `#a1a1a1` | 작은 글자 4.5:1(`QR §10 contrast-data` "data text labels ≥4.5:1") | `#6b7280` 계열 → `neutral-400`. channels 부록 A 의 `#737373` 은 4.44 라 작은 눈금 글자에는 부족 |
| 툴팁 | 배경 `#171717`, 테두리 `#404040`, 글자 흰색·`neutral-300`, 숫자 `tabular-nums` | channels 부록 A | `rgba(15,22,35,0.95)`(남색), `#111827` → neutral |
| 영역 채움 | 주 계열 단색 10~20% 투명도 | `charts#1` "Fill: 20% opacity" 를 단색으로 | SVG `linearGradient` 채움 금지(확정 규칙) |
| 순차 척도(강도) | 에메랄드 불투명도 4~5단계(예: 0.15·0.3·0.5·0.75·1) + 숫자 범례 | `charts#5` "Always include numeric color legend", channels 부록 A | `rgba(20,184,166,α)`(틸) → `rgba(0,229,160,α)` |
| 칸 안 글자 | `neutral-900` 카드 위: 불투명도 0.5 이하 흰색, 0.55 이상 검정. 검정 배경 위: 0.55 이하 흰색, 0.6 이상 검정 | 계산값: 카드 위 α0.5 흰 글자 5.06, α0.55 검정 4.73 / 검정 위 α0.55 흰 글자 5.09, α0.6 검정 4.77 | 현재는 강도 0.5 초과일 때 흰 글자, 이하일 때 `#9ca3af` → 회색 글자는 α0.3 에서 4.29 로 미달하므로 낮은 칸도 흰색 |
| 상승·좋음 / 하락·나쁨 / 경고 | `green-400` `#05df72` / `red-400` `#ff6467` / `amber-400` `#ffb900` | 보존 의미색, `styles#33` | 부호(+/−)와 SVG 화살표를 반드시 함께 |
| 경쟁도 3단계 | 낮음 `#00E5A0` / 보통 `amber-400` / 높음 `red-400` | channels 부록 A "틸·노랑 등급 → 척도 유지, 색만 에메랄드·앰버" | `KeywordCompetition.tsx:53-67` 의 teal·yellow → 에메랄드·앰버, 레드 유지. 단계 글자·추천 문구는 그대로 |
| 범주색(운영자 화면) | 플랜·유입 소스별 기존 색 + 범례 | channels 부록 A "범주 구분용은 그대로" | 관리자 화면만 예외 |

- 색 값은 한 파일(예: `src/lib/chartTheme.ts`)에 모으고 컴포넌트에 직접 쓰지 않는다(`shadcn#48`, `QR §6 color-semantic`). recharts 는 `stroke`·`fill` 을 SVG 속성으로 넣으므로 CSS 변수 대신 위 hex 값을 쓴다. hex 는 설치된 Tailwind 4.1 의 OKLCH 값을 변환한 것이다.

### 7.3 기능색을 유지하는 조건

차트·경쟁도처럼 기능적 의미가 있는 색은 유지한다(CONTEXT). 아래 조건을 모두 만족할 때만 "기능색"으로 인정한다.

1. 색이 데이터의 뜻(좋음/나쁨, 상승/하락, 단계, 범주)을 나타낸다. 꾸밈용 색은 해당하지 않는다.
2. 같은 뜻을 글자·숫자·부호·아이콘·모양 중 하나 이상으로도 전한다(`ux#37`, `charts.csv` 모든 행의 Accessibility Notes "Do not rely on color alone").
3. 표시(선·막대·칸)는 배경과 3:1, 글자 라벨은 4.5:1 이상(`QR §10 contrast-data`).
4. 빨강·초록 쌍만으로 대비하지 않는다(색각 이상). 부호와 화살표를 함께 쓴다(`QR §10 color-guidance`, `charts#13` "signed values and directional icons").
5. 금지된 색이면 같은 뜻의 허용 색으로 옮긴다: 틸 → 에메랄드, 노랑 → 앰버, slate·gray → neutral.
6. 사이트 전체에서 같은 뜻에는 같은 색(`QR §4 consistency`). 예: "높음·하락·오류 = 레드".

### 7.4 접근성·상호작용

| 규칙 | 근거 | 적용 |
|---|---|---|
| 범례는 차트 가까이, 계열이 적으면 선 끝에 직접 라벨 | `QR §10 legend-visible`, `direct-labeling` | `ProfileViewsChart`, 채널 추이 |
| 툴팁은 hover·탭·키보드 포커스로 같은 정보 | `QR §10 tooltip-on-interact`, `tooltip-keyboard`, `charts#1` A11y Fallback "focus reveals hover values" | recharts 3 의 키보드 탐색(`accessibilityLayer`)이 켜져 있는지 확인 |
| 한 줄 요약(예: "최근 30일 프로필 조회 12% 증가")을 `aria-label` 이나 차트 아래 문장으로 | `QR §10 screen-reader-summary` | 모든 차트 |
| 표 대체(같은 데이터를 표로 보기) | `QR §10 data-table`, `charts.csv` A11y Fallback 열 | 채널 추이, 비교 막대 |
| 축에 단위와 기간 단위(일·주·월) 표시, 모바일에서는 눈금을 줄인다 | `QR §10 axis-labels`, `time-scale-clarity`, `axis-readability`, `responsive-chart` | 모든 축 |
| 숫자는 `ko-KR` 형식, 큰 수는 만·억 | `QR §10 number-formatting`, `ux#86` | 툴팁·축. `VideoCard` 툴팁의 영어 라벨 "Day n" 은 "n일차" 처럼 한국어로 |
| 빈 데이터·로딩·오류 상태를 따로 그린다(빈 축만 띄우지 않기) | `QR §10 empty-data-state`, `loading-chart`, `error-state-chart` | 데이터 없는 채널, API 실패 |
| 등장 애니메이션은 reduced-motion 에서 끈다 | `QR §10 animation-optional` | recharts `isAnimationActive` |
| 데이터가 많으면 묶거나 표본으로, 상세는 드릴다운 | `QR §10 large-dataset`, `charts#1` 임계값 | 장기 추이 |
| 차트 하나에 정보를 몰지 않는다 | `QR §10 data-density` | 채널 대시보드 |
| 정렬 가능한 표는 `aria-sort` 로 현재 정렬을 알린다 | `QR §10 sortable-table`, `charts#2` A11y Fallback | `aria-sort` 0건, 표 16개 |
| 누를 수 있는 점·막대는 터치 영역을 넓힌다 | `QR §10 touch-target-chart` | 모바일 차트 |
| 드릴다운은 돌아가는 경로(브레드크럼)를 유지 | `QR §10 drill-down-consistency`, `styles#32` | 채널 → 영상 |
| 데이터 화면은 내보내기(CSV)를 제공한다 | `QR §10 export-option`, `reasoning#7` must_have | 이미 있는 CSV 버튼은 테두리 보조 버튼으로(channels 부록 A) |
| 그라데이션·그림자로 데이터를 가리지 않는다 | `QR §10 trend-emphasis` | 전 차트 |

### 7.5 설정 예

```ts
// src/lib/chartTheme.ts (예시. 값은 Tailwind 4.1 의 OKLCH 를 변환)
export const chartTheme = {
  primary: "#00E5A0",     // 주 계열
  compare: "#a1a1a1",     // neutral-400, 비교 계열 1 (strokeDasharray "6 4")
  compare2: "#737373",    // neutral-500, 비교 계열 2 (strokeDasharray "2 4")
  bar: "#737373",         // 막대 기본
  grid: "#262626",        // neutral-800
  axis: "#404040",        // neutral-700
  tick: "#a1a1a1",        // neutral-400 (작은 글자 4.5:1)
  tooltipBg: "#171717",   // neutral-900
  tooltipBorder: "#404040",
  up: "#05df72",          // green-400 + "+" 부호 + 위 화살표
  down: "#ff6467",        // red-400 + "−" 부호 + 아래 화살표
  warn: "#ffb900",        // amber-400
} as const;
```

## 8. 납품 전 점검표

구성: README 의 디자인 시스템 출력 점검표 8항목 + `skill-content.md` Pre-Delivery Checklist 중 웹에 해당하는 항목 + `QR §1~§3`(CRITICAL·HIGH) 최종 점검 + 소유자 확정 규칙 + 불변 조건. 원문은 skill-content 점검표가 "App UI 범위"라고 밝혔으므로 세이프 에어리어·Dynamic Type·44pt/48dp 항목은 웹 기준(확대·재배치, 24px/44px)으로 바꿨다. 각 작업 묶음을 끝낼 때마다 바꾼 화면에 대해 돌린다.

### 8.1 README 점검표 (bibllab 기준으로 옮김)

- [ ] 아이콘에 이모지가 없다. SVG 만 쓴다. (현재 화면 코드에 이모지·기호 129건/34파일)
- [ ] 누를 수 있는 모든 요소에서 커서가 손가락으로 바뀐다(전역 `cursor:pointer` 규칙, 5.2).
- [ ] 상호작용 시간은 4.2 토큰(150·200·300ms)을 쓰고 reduced-motion 을 따른다. `transition-all` 을 새로 쓰지 않는다.
- [ ] 글자 대비: 원문은 "라이트 모드 4.5:1"이지만 bibllab 은 다크 단일 테마다. 다크에서 일반 글자 4.5:1, 큰 글자·비텍스트 3:1(3.1 표).
- [ ] 키보드 포커스가 보인다(Tab 순회).
- [ ] `prefers-reduced-motion` 을 존중한다(DevTools 에뮬레이션으로 확인).
- [ ] 글자·칩·배지가 잘리거나 깨지지 않고 다시 흐른다(320px, 200% 확대, 한국어 어절 단위 줄바꿈).
- [ ] 반응형: 375·768·1024·1440px 에 더해 320·414px(`ux#65`).

### 8.2 시각 품질·상호작용 (skill-content 점검표 중 웹 해당)

- [ ] 한 아이콘 가족, 같은 선 굵기, 같은 크기 단계(6.4).
- [ ] 브랜드 로고는 공식 자산과 비율·여백 그대로(카카오·구글·유튜브).
- [ ] 눌림·hover 상태가 레이아웃 크기를 바꾸지 않는다(흔들림 없음).
- [ ] 의미 토큰을 쓰고 화면마다 임의 hex 를 새로 박지 않는다(`[#00E5A0]` 대신 `accent`).
- [ ] 비활성 상태가 분명하고 실제로 눌리지 않는다(`disabled`).
- [ ] 포커스 순서가 보이는 순서와 같고, 컨트롤 이름이 무슨 일을 하는지 말해 준다.
- [ ] 고정 바가 스크롤 콘텐츠와 포커스를 가리지 않는다.
- [ ] 간격은 4/8 단위, 섹션 간격은 단계로.
- [ ] 긴 글은 읽기 폭 안에(한글 약 36~45자).
- [ ] 모달 배경(스크림)은 실제 배경 위에서 앞 내용이 읽히는지 측정했다.

### 8.3 접근성 (skill-content 점검표 + QR §1)

- [ ] 글자 옆 장식 아이콘은 `aria-hidden="true"`.
- [ ] 같은 뜻의 글자가 없는 이미지·아이콘에 대체 텍스트.
- [ ] 아이콘 컨트롤에 이름, 해당하면 선택·눌림·펼침 상태.
- [ ] 폼 필드에 라벨·도움말·분명한 오류.
- [ ] 색이 유일한 표시가 아니다.
- [ ] 동작 줄이기와 글자 확대에서 레이아웃이 깨지지 않는다.
- [ ] 고정 UI·오버레이가 키보드 포커스를 가리지 않는다.
- [ ] 드래그·스와이프 전용 조작에는 버튼·키보드 대체가 있다.
- [ ] 인증은 비밀번호 관리자와 붙여넣기를 허용하고 기억력 시험이 아닌 경로가 있다(현재 OAuth).
- [ ] 자동으로 움직이는 콘텐츠는 일시정지·멈춤이 있고 포커스·reduced-motion 에서 멈춘다.
- [ ] 제출에 실패한 폼은 필드 오류를 유지하고, 오류가 여럿이면 연결된 오류 요약으로 포커스를 옮긴다.
- [ ] 역할·상태(선택, 비활성, 펼침)가 낭독기에 제대로 읽힌다.
- [ ] 건너뛰기 링크, h1 하나, 제목 순서.

### 8.4 성능 (QR §3)

- [ ] 이미지에 크기 또는 비율 상자가 있어 CLS < 0.1.
- [ ] 첫 화면 밖 이미지는 지연 로드, LCP 이미지만 `priority`.
- [ ] 글꼴은 `next/font` 자체 호스팅 + `display: swap`.
- [ ] 서드파티 스크립트는 쓰는 화면에서만 지연 로드(카카오 SDK).
- [ ] 비동기 내용이 들어올 자리를 미리 잡았다(스켈레톤 크기 = 실제 크기).
- [ ] 50개 넘는 목록은 `content-visibility` 또는 가상화.

### 8.5 소유자 확정 규칙 (바꾼 파일 기준)

- [ ] 배경 `bg-black`, 카드 `bg-neutral-900` + `border-neutral-800`.
- [ ] `gray-`·`slate-`·`zinc-`·`teal-` 클래스 0건.
- [ ] 그라데이션(`bg-gradient`·`bg-linear`·`bg-radial`·`from-`), 글로우(`shadow-[0_0`), 펄스 점(스켈레톤 외 `animate-pulse`·`animate-ping`) 0건.
- [ ] 아이콘 박스·원형 숫자 배지 0건. 순서 표시는 `01` 텍스트 숫자.
- [ ] 액센트는 `#00E5A0` 한 가지, 한 화면에서 강조는 한 곳. 블루·레드 액센트 없음.
- [ ] 주요 CTA 는 화이트 버튼(`bg-white hover:bg-neutral-200 text-black font-bold`), 색 배경 버튼 없음(브랜드 버튼 예외).
- [ ] 보존 색 유지: 앰버 경고, 레드 에러·할인, 그린 성공, 별점 앰버, 카카오·구글·네이버·유튜브 브랜드색.
- [ ] 섹션 헤더 패턴(좌 캡션 + 우 영문 라벨 `tracking-[0.25em] font-black` + 헤어라인, 두 톤 font-black 헤드라인) 유지.
- [ ] 기존 문장 유지. 새 문구는 담백한 사실 서술, em-dash(—) 0건, 과장·AI스러운 비유 없음.

확인 명령 예(저장소 루트, zsh 에서 글롭이 풀리지 않게 따옴표 유지):

```bash
grep -rEn --include='*.tsx' --include='*.css' '(gray|slate|zinc|teal)-[0-9]' <바꾼 경로>
grep -rEn --include='*.tsx' 'bg-gradient|bg-linear|bg-radial|shadow-\[0_0|animate-ping' <바꾼 경로>
grep -rn --include='*.tsx' '—' <바꾼 경로>
python3 -c "import re,pathlib;rx=re.compile('[\U0001F300-\U0001FAFF☀-➿]');print(sum(len(rx.findall(p.read_text())) for p in pathlib.Path('src').rglob('*.tsx') if '/api/' not in str(p)))"   # 화면 코드 이모지 수, 기준값 129
```

### 8.6 불변 조건

- [ ] 검색 결과 수 누적 로직(`saveToHistory` → `/search?q=…&count=N`)의 로직·파라미터·호출 순서가 바뀌지 않았다. `git diff` 에서 해당 줄은 마크업·스타일 변경뿐이다.
- [ ] `src/app/layout.tsx` 에 `auth(`·`cookies(`·`currentUser(` 호출이 없다(`grep -nE '(auth|cookies|currentUser)\(' src/app/layout.tsx | grep -vE '^[0-9]+:\s*//'` 결과 없음. 현재는 97행의 경고 주석만 걸린다). 현재 경로 표시 등은 클라이언트 잎 컴포넌트로.
- [ ] `next build` 출력에서 정적(○)·ISR(●) 페이지가 그대로다. `/incubating` 의 `revalidate = 60` 과 `unstable_cache` 유지.
- [ ] 커뮤니티 레이아웃 게이트, `canReadBoard`, noindex 유지.
- [ ] 결제·인증·검색 API·DB 접근 로직 diff 없음.
- [ ] `package.json` 의존성 변화 없음(글꼴 파일은 자산으로).
- [ ] 커밋·push 하지 않았다(오케스트레이터 몫).

### 8.7 페이지 유형별 확인

| 유형 | 확인할 것 |
|---|---|
| (가) 홈·트렌드 서치 | 모바일 첫 화면에 헤드라인·검색창이 다 보이고 헤드라인이 어절 단위로 끊긴다. 수치에는 날짜·출처가 있거나 정성 증거로 바뀌었다. 잠금 표시는 글자와 함께 |
| (나) 요금제 | 연간 선택 시 카드 안에 실제 청구액과 절약액. 기능 비교표와 마지막 CTA. 토글·FAQ 에 상태 속성 |
| (다) 세일즈 | 챕터 끝 미니 CTA, 모바일 하단 고정 CTA 1개, 가격·포함 범위·부가세 표기 일치, 마퀴 일시정지, 비교표 모바일 가로 스크롤 상자, 컨설팅 이미지의 대체 텍스트 |
| (라) 모집 | 첫 화면에 지원 CTA, 지원 자격·절차·보낼 내용 목록, 근거 없는 긴급성 없음, 모바일 하단 CTA |
| (마) 커뮤니티 | 배너가 첫 화면을 다 차지하지 않고 상세·글쓰기·랭킹에서는 줄어든다. h1 하나. 첨부 이미지 높이 상한. 글쓰기 자동 보관·이탈 확인. 게이트·noindex 유지 |
| (바) 데이터 도구 | 기능색 + 글자·부호 병기, 정렬 표 `aria-sort`, 검색어 없을 때 시작 안내 빈 상태, 한국어 오류 + 다시 시도, 차트 요약·표 대체 |
| (사) 로그인·마이페이지 | OAuth 경로 유지, 로그인 뒤 원래 하던 일로 복귀, 파괴적 동작은 분리·확인 |

## 9. 채택하지 않는 권고와 이유

### 9.1 소유자 확정 규칙과 충돌

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 1 | 글래스모피즘·Liquid Glass(반투명 + 배경 블러 카드), "데이터가 많으면 글래스" | `styles#3`, `styles#14`, `reasoning#1` Style_Priority "Glassmorphism + Flat Design"·결정 규칙 `if_data_heavy: glassmorphism`, `products#1`·`#33` | 소유자가 "AI스럽다"며 지운 계열. 원문도 저대비·접근성 중요 화면엔 쓰지 말라고 한다. 블러는 모달 배경처럼 "뒤를 닫을 수 있다"는 신호에만(`QR §4 blur-purpose`). 현재 `backdrop-blur` 22건/19파일 중 고정 바·모달 배경이 아닌 장식은 제거 대상 |
| 2 | 그라데이션 전반: 오로라·메시 배경, 그라데이션 글자, AI 보라/분홍 그라데이션, 히트맵·성과 차트의 색 그라데이션 | `styles#10`, `styles#65`, `type#60` Notes(gradient text), `reasoning#7` "Cool→Hot gradients", `charts#4`·`#5`·`#7`·`#8`·`#12`, `landing#1` 등 | 소유자 금지 패턴. 차트의 순차 척도는 에메랄드 불투명도 단계로 대신한다(7장). 현재 그라데이션 클래스 17건/9파일 제거 대상 |
| 3 | 글로우·네온: 글자 그림자 발광, CTA hover 글로우, 네온 글로우, CRT 주사선, 글리치 | `styles#7` "Minimal glow", `styles#41`, `reasoning#10` "CRT scanlines + Neon glow + Glitch effects", `landing#1` "CTA glow on hover" | 소유자 금지(글로우 섀도) |
| 4 | 펄스: CTA 펄스, 재생 버튼 펄스, 다운로드 버튼 펄스, 상태 펄스, 점 3개 타이핑 표시 | `landing#3`, `#15`, `#32`, `#34`, `styles#43` | 소유자 금지(펄스 도트), `ux#12` 장식 무한 반복 금지 |
| 5 | 제품 유형별 다색 팔레트: SaaS 파랑+주황, Micro SaaS 인디고+에메랄드, 분석 파랑+앰버, 크리에이터 분홍+주황, 에이전시 분홍+시안, 멤버십 보라+초록, 포럼 회색+파랑, Q&A 파랑+앰버 | `colors#1`, `#2`, `#7`, `#20`, `#69`, `#71`, `#164`, `#184` | 액센트는 에메랄드 하나. 블루·레드 액센트는 시도 후 되돌렸다 |
| 6 | 원색 4~6개 팔레트, 여러 개의 네온 액센트, 고채도 블록 | `styles#6`, `styles#12` 색 항목, `styles#7` "Vibrant neon accents" | 같은 이유 |
| 7 | 요금 플랜별 색(Free 회색, Starter 파랑, Pro 초록/금색), 인기 플랜 브랜드색 배경 | `landing#8`, `landing#14` | 추천 플랜은 화이트 테두리 + 화이트 배지 + 화이트 CTA 의 명도 강조로 이미 구분(pricing 보고서 "유지할 점 2") |
| 8 | 색 배경 CTA(브랜드색·원색·에메랄드 채운 버튼) | `landing#2`·`#4`·`#7`·`#23` 색 전략, `colors#2` "emerald CTA" | 확정 규칙: 주요 CTA 는 화이트 버튼, 색 배경 버튼 금지 |
| 9 | 청색기 있는 회색 값: slate 보조 글자 `#94A3B8`, 배경 `#020617`·`#0F172A`, zinc 테두리 `#3F3F46`, Midnight Blue, 격자선 `gray-200` | `colors.csv` 다크 팔레트, `styles#7`, `QR §10 gridline-subtle` | 쿨그레이 금지 → neutral 로 치환 |
| 10 | 틸 색 | `colors#16`·`#43`, `styles#3` 보조색 `#20B2AA` | 소유자 금지. 경쟁도 "낮음"처럼 기능을 가진 틸은 에메랄드로(channels 보고서 부록 A) |
| 11 | 아이콘 위주 레이아웃, 브랜드색 카테고리 아이콘, 단계 숫자 애니메이션 | `styles#12` "Icon-heavy layout", `landing#5`, `landing#15`·`#16`·`#22` | 확정 규칙: 아이콘 박스·원형 숫자 배지 금지, 맨 SVG + `01` 텍스트 숫자 |
| 12 | 단계별 빨강·주황·초록, 비교표 우리 행 연노랑 강조, 전후 비교의 흐림 대 원색 | `landing#5`, `landing#6`, `landing#21` | 다색 금지. 비교표 강조는 화이트 테두리·굵기로 |
| 13 | "기본 다크 모드"를 안티패턴으로 보는 권고, 교육 앱의 "Dark modes" 안티패턴, README 예시의 "AVOID … Dark mode" | `reasoning#1` Anti_Patterns, `reasoning#9`, README 디자인 시스템 예시 | 소유자가 다크 단일 테마로 확정. 대신 다크 대비 기준을 엄격히 적용(3.1) |
| 14 | 라이트/다크 두 테마 전제 규칙 | `tw#21`, `shadcn#6`, `SC` "Light/Dark Mode Contrast", `app#29` | 단일 다크 테마라 해당 없음. 대비 점검은 다크에서 독립적으로 한다 |
| 15 | 제품 유형이 추천한 스타일 자체: Micro SaaS "Motion-Driven + Vibrant & Block-based"와 안티패턴 "Static design + No video", 크리에이터 "Vibrant & Block-based + Bento"·"Engagement counter animations", 온라인 강의 "Claymorphism + Vibrant"·"No gamification", 에이전시 "Brutalism + Motion-Driven"·안티패턴 "Corporate minimalism", 멤버십 "Vibrant + Soft UI", 럭셔리 "Liquid Glass + Black + Gold", 부트캠프 2순위 "Cyberpunk UI" | `reasoning#2`, `#20`, `#43`, `#10`, `#69`, `#71`, `products#33`, `products#79` | 소유자 톤(블랙·neutral·에메랄드, 미니멀)과 상충. 같은 행의 `must_have` 제약(사례, 포트폴리오, 결과 지표, 커리큘럼, 가격 투명성)은 1장에서 채택 |
| 16 | 벤토 그리드의 hover 확대 1.02·기울기·카드 안 영상 | `styles#39`, `landing#28` | 격자 배치는 쓸 수 있으나 효과는 4.3 기준으로 불채택 |
| 17 | 0px 모서리 | `styles#1`, `styles#70` | 현재 `rounded-xl`(버튼)·`rounded-2xl`(카드) 관례 유지 |
| 18 | 세리프 본문, 드롭캡, 다른 글꼴 조합(Fira, JetBrains Mono, Atkinson, Space Grotesk 등) | `styles#66`, `styles#70`, `type#1`·`#4`·`#9`·`#42`·`#48`·`#59` | 한글 글리프가 없거나 톤이 다름. Pretendard 단일 가족(6.2) |
| 19 | 큰 음수 자간(-0.05em, -1.5) | `styles#47`, `type#60` | 한글은 -0.02em 이내 |
| 20 | Google Fonts `@import` 방식 | `typography.csv` CSS Import 열 | `next#22` 가 외부 글꼴 링크를 막고 `next/font` 자체 호스팅을 권한다 |
| 21 | Phosphor 아이콘을 기본 라이브러리로 | `SC` Icons & Visual Elements | 의존성 추가 없이 현재 인라인 SVG 유지 |

### 9.2 모션·연출

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 22 | 패럴랙스, 스크롤 고정·스크럽, 가로 스크롤 여정, 3D·WebGL 체험 | `landing#9`·`#10`·`#17`·`#27`·`#29`, `styles#49`, `motion#6`·`#13`·`#14` | 4.3. 이야기 순서(`landing#10` 의 챕터 구조)만 채택 |
| 23 | 히어로 배경 영상 자동 재생, "히어로에 영상 추가" 결정 규칙 | `landing#9`, `reasoning#2` `if_video_ready: add-hero-video` | `ux#96`, 성능, 소유자 톤 |
| 24 | 상시 카운트다운·긴급성 티커·한정 좌석·긴급 색 | `landing#12`·`#18`·`#24`, `reasoning#173`·`#178` `add-urgency-colors` | 검증된 기한이 있을 때 텍스트로만 쓴다. 상시 "마감 임박"은 금지(studio-14) |
| 25 | 개인화·생성형 랜딩의 타이핑·반짝임·모핑 효과 | `landing#11`, `landing#30` | `landing#30` 의 구조(입력 히어로 → 결과 미리보기)만 채택 |
| 26 | 회원 아바타 애니메이션, 실시간 활동 피드, 가입 축하 연출, 별 채우기 애니메이션 | `landing#19`·`#20`·`#15` | 꾸밈용. 실시간 표시는 실제 실시간 소스가 있을 때만(`landing#20`) |
| 27 | 게이미피케이션, 수료증 공개 연출, 진행 바 애니메이션 | `reasoning#43`, `reasoning#9` | bibllab 제품 성격과 다름 |
| 28 | 앱 중심 모션: 스프링 물리, 누를 때 0.95~1.05 확대, 공유 요소 전환, 방향성 화면 전환 | `QR §7 spring-physics`·`scale-feedback`·`shared-element-transition`·`navigation-direction` | 웹 마케팅·도구 화면에는 4.2 토큰으로 충분 |

### 9.3 정직성·사업 판단

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 29 | 보장 제안("Guarantee offer") | `landing#21` | studio FAQ 의 "보장은 드리지 않습니다" 같은 솔직한 톤을 유지(studio 보고서 "유지할 점 6"). 보장은 사업 결정이라 UI 규칙에 넣지 않는다 |
| 30 | 필터·내보내기 같은 새 기능 | `reasoning#7` `must_have: data-export`, `ux#89`, `ux#91` | 기능 추가는 소유자 판단. 이 문서에서는 후보로만 적었다(1장, 2장) |

### 9.4 버전·환경 불일치

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 31 | Cache Components·`use cache`·`cacheLife`·`cacheTag`·`updateTag`·`revalidateTag(tag,"max")`, `proxy.ts`, Next 16 설정 이름 | `next#13`, `#16`, `#32`~`#34`, `#45`, `#53`~`#60` | Next 14.2.35 에는 없다. 14.2 에서는 `middleware.ts` 가 현행이다 |
| 32 | `@container-size` | `tw#48` 의 4.3 기능 | Tailwind 4.1.18 |
| 33 | `Activity`, `useEffectEvent`, `after()`, React Compiler, Actions(`useActionState`·`useFormStatus`·`useOptimistic`·`use()`), ref 를 prop 으로 | `react#30`, `react#43`, `react#15`, `rstack#54`~`#66` | React 18.2 / Next 14.2 |
| 34 | 데이터 조회·API·서버 액션 로직 규칙 | `react#1`~`#4`·`#11`·`#12`·`#14`·`#16`, `next#12`·`#15`·`#28`~`#31`·`#35`~`#37`·`#52` | 불변 조건 4(결제·인증·검색 API·DB 접근 로직은 수정 대상 아님) |
| 35 | 네이티브 앱 전용: 하단 탭 바, 네이티브 키보드, Dynamic Type, 세이프 에어리어, RN 드래그, 햅틱, 당겨서 새로고침, VisionOS | `app#10`·`#17`·`#18`·`#26`~`#28`·`#31`, `ux#22`~`#27`, `ux#94`·`#95`, `QR §2 haptic-feedback` | 웹이라 해당 없음. 웹 대응은 2.5 |

### 9.5 의존성 추가가 필요한 것

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 36 | shadcn CLI 설치·레지스트리·프리셋 | `shadcn#1`~`#3`, `#61`~`#66` | 불변 조건 6. 관례만 채택(5.7) |
| 37 | React Hook Form·TanStack Form·Zod, Sonner, TanStack DataTable, Sidebar, shadcn Chart 래퍼, 블록, Radix/Base UI 합성 | `shadcn#16`~`#19`·`#60`, `#31`, `#26`, `#44`~`#46`, `#47`·`#49`, `#50`·`#51`, `#59`·`#68` | 같은 이유. 차트는 이미 설치된 recharts 에 색 설정 관례만 적용 |
| 38 | 네이티브 `<select>` 대신 커스텀 Select | `shadcn#20` "Don't: Native select element" | 네이티브 `<select>` 는 의존성 없이 모바일·키보드 접근성이 좋다. 유지 |
| 39 | `@tailwindcss/typography`(prose) 플러그인 | `tw#16`, `tw#46` | 의존성 추가. 커뮤니티 본문은 `PostContent` 의 기존 클래스로 다듬는다(필요하면 소유자 판단) |

### 9.6 데이터셋 문구 자체의 문제

| # | 권고 | 출처 | 이유 |
|---|---|---|---|
| 40 | "Tailwind 기본 animate 유틸리티는 reduced-motion 을 존중한다" | `tw#1` | 사실과 다르다. `animate-*` 는 미디어쿼리를 스스로 붙이지 않는다. `motion-reduce:` 를 직접 쓴다(4.4) |
| 41 | 그림자 카드·`hover:shadow-lg` | `tw#37`, `tw#38` | 검정 배경에서 그림자는 거의 보이지 않고 소유자 톤과 다르다. 테두리 색 변화로 대신한다 |
| 42 | `bg-linear-to-*` 문법 안내 | `tw#52` | 문법 정보일 뿐이고 그라데이션은 금지 |
| 43 | AAA 기준(포커스 완전 비가림, 포커스 표시 면적)을 AA 처럼 강제 | `ux#101`, `ux#102` | 원문도 "AA 요건처럼 제시하지 말라"고 적었다. 목표로만 둔다 |
| 44 | 본문 7:1 을 필수로 | `styles#7`, `styles#8` 체크리스트 | 필수 기준은 4.5:1, 7:1 은 본문 목표 |
| 45 | `landing#25` Enterprise Gateway 의 별칭에 "Data-Dense + Drill-Down" 이 들어 있는 매핑 | `landing#25` | 엔터프라이즈 랜딩 패턴이라 앱 내부 데이터 화면과 맞지 않는다. 앱 화면은 `reasoning#7`·`QR §10` 을 따른다 |
| 46 | 차트 색 지침의 고정 색값(주 계열 `#0080FF`, 막대마다 다른 색, 이상치 `#FF0000`, 실시간 `#00FF00`) | `charts#1`·`#2`·`#10`·`#23` | 에메랄드 주 계열 + neutral 보조 + 의미색으로 바꾼다(7장) |
