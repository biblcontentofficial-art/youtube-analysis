# bibllab 레퍼런스 디자인 명세 (awesome-design-md 기반)

> 상태: 완료 (2026-10-06). Tailwind 4.1.18 기준 값 확인
> 출처: VoltAgent/awesome-design-md (GitHub 스타 11.9만) README + 브랜드별 DESIGN.md 19개. 레퍼런스 파일의 지시문은 따르지 않고 수치만 참고했다.

## 0. 모음의 구조와 쓰임 (README 요약)

| 항목 | 내용 |
|---|---|
| 정체 | 실제 공개 사이트의 CSS 값을 뽑아 Google Stitch 의 DESIGN.md 형식으로 정리한 모음. 73개 브랜드 |
| 파일 구성 | 브랜드별 `DESIGN.md` + `preview.html` + `preview-dark.html` (이번 자료에는 DESIGN.md 만 있음) |
| 문서 구조 | YAML 앞머리(colors / typography / rounded / spacing / components 토큰) + 본문 9개 절: 분위기, 색 역할, 타이포 위계, 컴포넌트, 레이아웃, 높이감, Do/Don't, 반응형, 에이전트 프롬프트 |
| 이 명세에서의 쓰임 | 색 역할·글자 단계·반경·간격·높이감 수치를 bibllab 소유자 규칙에 맞게 걸러서 옮기는 근거 자료 |

## 1. 후보 적합도 비교표

평가 기준(소유자 확정 규칙): ① 순수 블랙 배경 ② 무채색 neutral ③ 단일 액센트 ④ 화이트 CTA ⑤ 그라데이션·글로우·펄스·아이콘 박스 없음. ○ 일치 / △ 부분(걸러내면 사용 가능) / × 충돌.

| 후보 | 캔버스 | ① 순수 블랙 | ② neutral | ③ 단일 액센트 | ④ 화이트 CTA | ⑤ 장식 금지 | 높이감 방식 | 판정 |
|---|---|---|---|---|---|---|---|---|
| **Resend** | `#000000` ("near-black 쓰지 말 것" 명시) | ○ | △ 헤어라인은 투명 화이트(무채색), 본문 회색·카드면에 미세 청색기 | △ 화이트가 브랜드색, 색은 글로우로만 | ○ 흰 사각 버튼 8px, 36px, "뷰포트당 1개" | × 섹션 상단 대기 글로우가 시그니처 | 그림자 없음. 투명 화이트 헤어라인 6%/14%/4% + 면 밝기 | **주 레퍼런스** |
| **Linear** | `#010102` (`#000` 금지 명시) | × | × 본문·헤어라인 청색기(`#d0d6e0`, `#8a8f98`, `#23252a`) | ○ 라벤더 1색, 쓰임 자리 4곳으로 한정 | △ 주 CTA는 라벤더 채움, 흰 반전 버튼은 보조 | ○ "그라데이션·스포트라이트 카드 없음" 명시 | 면 4단 사다리 + 헤어라인 3단, 포커스 링 2px 액센트 50% | **보조 1** (규율·포커스·타입 단계) |
| **Raycast** | `#07080a` | △ | △ 대부분 무채색(`#0d0d0d`, `#121212`, `#9c9c9d`), 일부 청색기(`#242728`) | △ 크롬엔 색 없음, 색은 일러스트 안에만 | ○ 흰 버튼 8px, 36px, "폴드당 1개" | × 히어로 빨간 사선 그라데이션, 키캡 그라데이션, 앱 아이콘 타일 | 그림자 없음. 면 사다리 + 헤어라인 | **보조 2** (도구 화면 부품) |
| x.ai | `#0a0a0a` | △ | △ 본문 `#dadbdf`·`#7d8187` 청색기 | △ 장식색 거의 미사용 | △ 흰 채움은 1곳뿐, 나머지 아웃라인 알약 | ○ | 헤어라인만 | 탈락: 전 위계 굵기 400 고정(소유자 font-black 헤드라인과 정면 충돌), 모든 버튼 9999px 알약 |
| Framer (추가 검토) | `#090909` | △ | ○ `#141414`/`#1c1c1c`/`#262626`/`#999999` 순수 무채색 | ○ 블루 1색(링크) | ○ 흰 알약 | × 그라데이션 스포트라이트 카드가 시그니처 | 면 사다리 + 파란 포커스 그림자 | 탈락: 시그니처가 금지 요소, 110px·-5.5px 포스터 자간은 한글 부적합. 무채색 값 참고만 |
| Spotify | `#121212` | △ | ○ `#181818`/`#1f1f1f`/`#b3b3b3` | △ 그린을 재생·CTA 채움에 사용 | × 그린/다크 알약, 대문자 버튼 | ○ | 무거운 그림자 0.3~0.5 | 탈락: 색 채움 CTA, 전부 알약, 순수 블랙 위에서 그림자 무의미 |
| Warp | `#2b2622` 갈색 차콜 | × | × 모든 회색에 웜톤(정체성) | ○ 색 없음 | ○ 오프화이트 버튼 3px | ○ | 헤어라인만 | 탈락: 웜톤이 정체성("순수 블랙은 브랜드 파괴" 명시) |
| Vercel | `#fafafa` 라이트 | × | ○ | × 메시 그라데이션이 장식 체계 전부 | × 검정 알약(반전) | × | 3중 적층 그림자 | 탈락: 라이트 + 메시 그라데이션. 헤어라인·음수 자간 규율만 참고 |
| Supabase | `#ffffff` 라이트(이 파일 기준) | × | ○ | ○ 에메랄드 1색, 희소 사용 | × 그린 채움 CTA(검정 글자) | ○ | 헤어라인 + 옅은 그림자 | 탈락: 라이트, 색 채움 CTA. "에메랄드는 뷰포트당 1번" 희소성 원칙만 참고 |
| Cursor | `#f7f7f4` 크림 | × | × 웜그레이 | ○ 오렌지 1색 | × 오렌지 채움 | ○ | 헤어라인만 | 탈락: 라이트·웜톤·색 CTA |
| Superhuman | 남색 + 흰 본문 + 딥틸 띠 | × | × | × 남색·바이올렛·틸 | × | × 바이올렛 대기 그라데이션 | 그림자 | 탈락: 틸·남색·그라데이션 모두 금지 항목 |

나머지 8개(stripe, notion, apple, mintlify, cal, sentry, posthog, claude)는 라이트 캔버스 또는 남색·보라·크림·코랄 계열이라 비교 대상에서 제외했다(앞머리 색 토큰만 확인).

### 선정 결과
- **주 레퍼런스: Resend.** 소유자 규칙 중 가장 고유한 두 가지(`#000000` 순수 블랙, 흰 버튼이 화면의 가장 밝은 점)를 원문이 그대로 규칙으로 갖고 있다. 깊이를 그림자 대신 투명 화이트 헤어라인으로 만드는데, 순수 블랙 위 투명 화이트는 구조상 무채색이다. 충돌 요소(섹션 글로우, 세리프 디스플레이, 다색 액센트)는 장식 층이라 떼어내도 체계가 유지된다.
- **보조 1: Linear.** 단일 액센트를 "쓰는 자리"로 한정하는 규율(브랜드 마크·포커스 링·링크 강조), 면 4단 사다리, 헤어라인 3단, 포커스 링 수치. 청색기·라벤더 CTA·`#010102` 는 채택하지 않는다.
- **보조 2: Raycast.** 어두운 도구 화면 부품: 44px 검색창, 면 한 단 올리는 필터 칩, 추천 요금제를 색 대신 면 밝기로 구분, 카드 안 여백 16~24px. 그라데이션·앱 아이콘 타일은 채택하지 않는다.

## 2. 레퍼런스에서 옮길 규칙 (수치)

### 2.1 색 역할 체계 (Resend 골격 + Linear 액센트 규율, 청색기 제거)

| 역할 | Resend 원값 | Linear / Raycast 원값 | bibllab 값 | Tailwind | 검정 위 대비 |
|---|---|---|---|---|---|
| 캔버스 | `#000000` | `#010102` / `#07080a` | `#000000` | `bg-black` | |
| 오목면 | surface-deep `#06060a` (코드창) | Raycast surface `#0d0d0d` | `#0a0a0a` | `bg-neutral-950` | |
| 카드면 | surface-card `#0a0a0c` | surface-1 `#0f1011` / `#0d0d0d` | `#171717` (오너 확정) | `bg-neutral-900` | |
| 들린 면 | surface-elevated `#101012` (추천 요금제·고스트 버튼) | surface-2 `#141516` (추천·hover) | `#1f1f1f` (흰색 12% 합성값) | `bg-[#1f1f1f]` | |
| 선택 면 | | Raycast pill-tab-active, Linear surface-3 `#18191a` | `#262626` | `bg-neutral-800` | |
| 헤어라인 약 | hairline 6% (`#0f0f0f`), divider 4% | Raycast 8% | `#171717` | `border-neutral-900` | |
| 헤어라인 | hairline-strong 14% (`#242424`) | `#23252a` / `#242728` | `#262626` (오너 확정) | `border-neutral-800` | |
| 헤어라인 강 | | hairline-strong `#34343a` / 16% | `#404040` | `border-neutral-700` | |
| 글자 1 | ink `#fcfdff` | `#f7f8f8` / `#f4f4f6` | `#ffffff` | `text-white` | 21:1 |
| 글자 2 (본문) | body 86% (≈`#d9d9db`) | Raycast body `#cdcdcd` | `#d4d4d4` | `text-neutral-300` | 14.2:1 |
| 글자 3 (보조) | mute `#a1a4a5` | `#8a8f98` / `#9c9c9d` | `#a1a1a1` (v4 oklch 70.8%) | `text-neutral-400` | 8.1:1 (neutral-900 위 6.9) |
| 글자 4 (비활성) | ash `#888e90`, stone `#464a4d` | `#62666d` / `#6a6b6c` | `#737373` | `text-neutral-500` | 4.43:1, 읽는 글자 금지 |
| 주 CTA | primary `#fcfdff`, 눌림 `#f1f7fe` | Raycast `#ffffff`, 눌림 `#e8e8e8` | `#ffffff` / hover `#e5e5e5` / active `#d4d4d4` | `bg-white hover:bg-neutral-200 active:bg-neutral-300` | 검정 글자 21:1 |
| 액센트 | (없음, 흰색이 브랜드) | Linear `#5e6ad2`, hover `#828fff` | `#00E5A0`, hover `#66FFCC` | `text-[#00E5A0]` | 12.7:1 |
| 포커스 | 입력 테두리 → ink | Linear 2px 액센트 50% | `#00E5A0` 2px | `outline-[#00E5A0]` | 12.7:1 (3:1 기준 충족) |
| 시맨틱 | 점·글로우로만 | Linear success `#27a644` | 보존: amber-400 경고·별점, red-400 에러·할인, green-400 성공, 카카오 `#FEE500`, 유튜브 `#FF0000` | | amber 12.6, red 7.6, green 12.1 |

청색기 측정(B-R 값): Linear ink-muted +16, subtle +14 / Resend ash +8, mute +4 / Raycast hairline +4 / Framer `#262626`·`#999999` 0. bibllab 값은 모두 0(neutral).

**액센트 자리 (Linear "액센트는 4곳에만" 규율을 옮김)**

| Linear 원칙 | bibllab 적용 |
|---|---|
| 브랜드 마크·주 CTA·포커스 링·링크 강조에만 | 포커스 링, 강조 링크(네비 핵심 서비스 2개 포함), 헤드라인 핵심어(섹션당 1곳), 수치 강조(절약액·할인율). 주 CTA 는 흰색, 로고는 흰색 유지 |
| 섹션 배경·카드 채움으로 쓰지 않음 | 글자색과 포커스 외곽선으로만. 배경 채움·색 테두리·아이콘 박스·그림자 금지 |
| Supabase "뷰포트당 1번" | 네비 2곳을 빼고 본문에서 화면당 2곳 이하. 체크 표시·글머리 같은 반복 표식에는 쓰지 않음 (카드마다 같은 자리 1번은 허용) |

### 2.2 글자 단계 원값 (크기 / 굵기 / 행간 / 자간)

| 단계 | Resend | Linear | Raycast |
|---|---|---|---|
| 히어로 | 96 / 400 / 1.0 / -0.96px (-1%, 세리프) | 80 / 600 / 1.05 / -3.0px (-3.75%) | 64 / 600 / 1.1 / 0 |
| 섹션 오프너 | 76.8 / 400 / 1.0 / -0.77px | 56 / 600 / 1.10 / -1.8px (-3.2%) | 56 / 500 / 1.17 / +0.2px |
| 하위 섹션 | 56 / 400 / 1.2 / -2.8px (-5%) | 40 / 600 / 1.15 / -1.0px (-2.5%) | |
| 묶음 제목 | 24 / 500 / 1.5 / -0.4px | 28 / 600 / 1.2 / -0.6px (-2.1%) | 24 / 500 / 1.6 / +0.2px |
| 카드 제목 | 20 / 500 / 1.3 / -0.3px | 22 / 500 / 1.25 / -0.4px | 20 / 500 / 1.4, 18 / 500 / 1.4 |
| 리드 | 18 / 400 / 1.5 | 18 / 400 / 1.5 / -0.1px | 18 / 400 / 1.6 |
| 본문 | 16 / 400 / 1.5 | 16 / 400 / 1.5 / -0.05px | 16 / 400 / 1.6 |
| 보조 본문 | 14 / 400 / 1.43 | 14 / 400 / 1.5 | 14 / 400 / 1.6 |
| 캡션 | 12 / 400 / 1.5 | 12 / 400 / 1.4 | 13 / 400 / 1.4, 12 / 400 / 1.5 / +0.4px |
| 버튼 | 14 / 500 / 1.43 | 14 / 500 / 1.2 | 14 / 500 / 1.6 / +0.2px |
| 아이브로 | | 13 / 500 / 1.3 / +0.4px (+3%) | (x.ai 모노 14 / 400 / +1.4px, +10%) |

공통 규칙: 클수록 음수 자간을 키우고 본문은 0 근처, 양수 자간은 아이브로·라벨에만, 행간은 제목 1.0~1.2·본문 1.5~1.6, 캡션 하한 12px. bibllab 은 굵기를 오너 규칙(헤드라인 900)대로 두고 자간·행간만 한글 기준으로 다시 잡는다(4.2).

### 2.3 간격 체계

| 항목 | Resend | Linear | Raycast | 수렴값 |
|---|---|---|---|---|
| 기본 단위 | 4 | 4 | 8 (2·4·12 보조) | 4px |
| 섹션 세로 | 96 (히어로·마감 128) | 96 | 96 → 64 (태블릿) → 48 (모바일) | 96 / 64 / 48 |
| 카드 안 여백 | 32 | 24 (후기 32, CTA 배너 48) | 24 (스토어 카드 16) | 24~32 |
| 카드 그리드 간격 | | | 16 | 16~24 (Vercel gap 24) |
| 카드 안 제목→본문 | | | | 8 (Vercel), CTA 앞은 더 넓게 |
| 버튼 여백 | 8×16 | 8×14 | 8×16 | 세로 8, 가로 14~16 |
| 입력 여백 | 10×14 | 8×12 | 8×12, 검색창 10×16 | 10×14 |
| 컨테이너 | 1200 | 1280 | 1240, 거터 24 (초광폭 48) | 1200~1280 |

### 2.4 모서리 반경

| 용도 | Resend | Linear | Raycast | 수렴값 |
|---|---|---|---|---|
| 인라인 태그·키캡 | 4 | 4 (배지), 6 (태그) | 4 | 4 |
| 버튼·입력 | 8 | 8 | 8 | **8** |
| 카드·요금제 | 12 | 12 | 10 | **12** |
| 큰 패널·스크린샷 | 16 | 16 (24 드묾) | 16 | **16** |
| 칩·탭·아바타 | full | full | full | full |

세 곳 모두 CTA 를 알약(9999px)으로 만들지 않는다(Linear "Don't pill-round CTAs").

### 2.5 테두리와 헤어라인

| 단계 | Resend | Linear | Raycast |
|---|---|---|---|
| 약 | 4% (`#0a0a0a`) 푸터 열 사이 | | 8% (이미지 위) |
| 기본 | 6% (`#0f0f0f`) 행 사이 | `#23252a` 카드·구분선 | `#242728` 모든 카드 |
| 강 | 14% (`#242424`) 카드·코드창·입력 구조선 | `#34343a` 입력 포커스, `#3e3e44` 중첩면 | 16% 비교표 행 |

모두 1px. 2px 는 포커스 링(Linear)뿐.

### 2.6 높이감 (그림자 대신)

| 레벨 | Resend | Linear | Raycast | bibllab |
|---|---|---|---|---|
| 0 평면 | 캔버스 | 캔버스 | 캔버스 | `bg-black` |
| 1 카드 | surface-card + 14% 선 | surface-1 + hairline | surface + hairline | neutral-900 + neutral-800 선 |
| 2 들림 | surface-elevated + 14% 선 | surface-2 + hairline-strong | surface-elevated | `#1f1f1f` + neutral-700 (추천은 neutral-600) |
| 3 오목·선택 | surface-deep (코드창) | surface-3 (드롭다운) | surface-card (선택 행) | neutral-950 (카드 안 입력), neutral-800 (선택 탭) |
| 포커스 | 테두리 → ink | 2px 액센트 50% | 테두리 → 16% | 2px `#00E5A0` 외곽선 |

세 곳 모두 드롭 섀도를 쓰지 않는다(Resend "the dark canvas absorbs shadow").

### 2.7 컴포넌트 원값

| 컴포넌트 | 옮길 수치 (출처) |
|---|---|
| 주 버튼 | 흰 면 + 검정 글자, 높이 36, 반경 8, 여백 8×16, 14px/500, 눌림 `#e8e8e8` (Raycast). 흰 면은 뷰포트당 1개 (Resend), 폴드당 1개 (Raycast) |
| 보조 버튼 | 들린 면 `#101012` + 14% 선, 높이 36 (Resend ghost) / surface-1 + hairline (Linear secondary) |
| 고스트 | 투명 + 흰 글자, 같은 높이·반경 (Raycast secondary, Linear tertiary) |
| 링크 | 본문 링크는 흰색, 밑줄은 포커스 때 (Raycast). 액센트는 링크 강조에만 (Linear) |
| 입력 | 높이 40, 여백 10×14, 반경 8, 카드면 + 14% 선, 포커스 때 테두리 밝게 (Resend). 검색창 높이 44, 여백 10×16 (Raycast) |
| 카드 | 반경 12, 여백 24 (Linear·Raycast)~32 (Resend), 1px 선. 3열 → 2열 (1024) → 1열 (768) |
| 요금제 | 추천은 색 대신 면 한 단 밝게 (세 곳 공통). 가격 56px (Resend·Raycast), 요금명 24px, 체크는 `✓` 글리프 |
| 배지 | 12px, 알약, 여백 4×10, 들린 면 + 본문색 (Resend) / 2×8 (Linear) |
| 탭·칩 | 기본 투명, 선택 시 면 한 단 (Raycast 4×10, Linear 6×14) |
| 네비 | 높이 56 (Linear·Raycast)~64 (Resend), 캔버스 배경, 아래 1px 선, 링크 14px/500, 오른쪽에 로그인 링크 + 흰 버튼 |
| 히어로 | 세로 96, 디스플레이 헤드라인 1개, 흰 CTA 1개, 히어로 안에는 장식 없음 (Resend) |
| 섹션 리듬 | 섹션 간 96, 장식 구분선 없음 (Raycast), 면 전환으로 구분 (Linear) |
| 푸터 | 캔버스 배경, 위 1px 선, 여백 64 × 32~48, 열 제목 14px/500 흰색 + 링크 14px 본문색 (Raycast) |
| 모션 | 세 문서 모두 모션 토큰 없음. Raycast 는 hover 도 정의하지 않고 Resend 는 눌림만 정의 → 상태 변화는 색·면 단계로만 |

### 2.8 채택하지 않음 (소유자 규칙과 충돌)

| 출처 | 요소 | 충돌 규칙 | 대체 |
|---|---|---|---|
| Resend | 섹션 상단 대기 글로우 (accent-*-glow 방사형) | 그라데이션·글로우 금지 | 없음. 면·선만 |
| Resend | Domaine Display 세리프 96px, ss01/ss04/ss11 | 한글 미지원, font-black 체계 | Pretendard 900 |
| Resend | 다색 액센트 (오렌지·옐로·블루·그린·레드), 링크 블루 `#3b9eff` | 단일 액센트 | 에메랄드 1색, 링크는 흰색 |
| Resend | 코드창 신호등 3색 점, 초록 상태 점 | 장식 점 (펄스 도트 계열) | 텍스트 배지 |
| Resend | ink `#fcfdff`, 면 `#0a0a0c`·`#101012`·`#06060a`, 눌림 `#f1f7fe` | 청색기 | neutral 값 |
| Linear | 캔버스 `#010102`, "`#000` 쓰지 말 것" | 순수 블랙 | `#000000` |
| Linear | 라벤더 `#5e6ad2` 채움 주 CTA | 화이트 CTA, 색 배경 버튼 금지 | 흰 버튼 |
| Linear | 청색기 글자·선 (`#d0d6e0`, `#8a8f98`, `#62666d`, `#23252a`, `#34343a`) | 쿨그레이 금지 | neutral-300/400/500, neutral-800/700 |
| Linear | 들린 패널 위쪽 흰 가장자리 하이라이트 | 글로우 계열 | 1px 선 |
| Raycast | 히어로 빨간 사선 그라데이션 띠, 푸터 위 반복 띠, 키캡 그라데이션 | 그라데이션 금지 | 없음 / 단색 neutral-800 키캡 |
| Raycast | 앱 아이콘 타일 48·64px | 아이콘 박스 금지 | 맨 SVG 24px |
| Raycast | 카테고리 색 (노랑·빨강·초록·파랑) + 15% 배경 배지 | 단일 액센트 | neutral 배지, 시맨틱은 보존 목록만 |
| Raycast | Inter ss03, 양수 자간 +0.2px | 한글에 효과 없음 | Pretendard, 4.2 자간 |
| 공통 | 알약 CTA (x.ai·Framer·Vercel·Spotify) | 레퍼런스 3곳 모두 8px | 8px |
| 공통 | 영문 기준 음수 자간 (-3~-5%)·행간 1.0 그대로 적용 | 한글 뭉침 | 4.2 보정표 |
| 공통 | 대문자 + 넓은 자간 버튼 (Spotify), 무거운·적층 그림자 (Spotify·Vercel) | 한글 불가 / 순수 블랙 위 무의미 | 일반 표기 / 면 단계 |

## 3. 현재 코드·화면과 레퍼런스의 차이

근거: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/pricing/_components/PricingCards.tsx`, `src/app/trend-search/page.tsx` + 캡처 `home-desktop-01.png`, `pricing-desktop-01.png`, `trend-search-desktop-01.png`. 대비는 WCAG 상대휘도로 계산.

| # | 항목 | 현재 (근거) | 레퍼런스 | 차이와 조치 |
|---|---|---|---|---|
| 1 | 캔버스 | `globals.css:26-27` 의 레이어 밖(unlayered) `body { background: var(--background) }` 가 `layout.tsx:283` 의 `bg-neutral-950`(utilities 층)을 이김 → `#0b0f17` 남색. `trend-search-desktop-01.png` y≈982~1046 에 남색 띠. 푸터 `bg-neutral-950` (`layout.tsx:400`) | 캔버스 `#000` 하나가 푸터까지 (세 곳 모두 푸터 = 캔버스) | body·푸터를 `#000` 로, 푸터 `mt-16` 제거 |
| 2 | 전역 토큰 | `globals.css:3-24` `--card #0f1623`(남색), `--muted #97a3b6`(청색기 B-R +31), `--ring` 인디고 `rgba(99,102,241,.55)`, 다크 모드에서만 `#0a0a0a`. `.card` 클래스가 남색 면 사용 (`:43-46`), `.bg-dashboard` 방사형 점 격자 (사용처 0) | 무채색 역할 토큰 | 4.1 토큰으로 교체, 죽은 클래스 정리 |
| 3 | 글꼴 | `layout.tsx:12,283` next/font Inter 클래스가 body 의 Pretendard 지정(`globals.css:29`)보다 우선 → 한글은 OS 글꼴로 대체. `tailwind.config.js` 의 `fontFamily` 는 Tailwind v4 가 읽지 않음(`@config` 없음). `@theme inline { --font-sans: var(--font-sans) }` 자기참조 | 한 글꼴 가족이 모든 역할 (Raycast Inter 단일, Linear 단일 목소리) | Pretendard Variable 하나로 (라틴 글자가 Inter 기반이라 Inter 불필요) |
| 4 | 한글 줄바꿈 | `break-keep`·`text-balance` 0건. 캡처에서 단어 중간 끊김: 홈 기능 "보여/드립니다", "발견합니/다", "활용하세/요", 3단계 "수집·분석합/니다", 허브 "한눈/에", "관/리에" | (영문 문서라 규정 없음) | 전역 keep-all, 제목 balance (4.2) |
| 5 | 제목 단계 | h1 이 페이지마다 다름: 홈 48/60px `leading-tight`(1.25) (`page.tsx:145`), 허브 30/48px (`trend-search:90`), 요금제 36/48px 이고 굵기 `font-extrabold` (`pricing/page.tsx:33`). h2: 홈 24/30px (`page.tsx:244,255`), studio 30/48px | 고정 사다리 (Linear 80/56/40/28/22) | 4.1 글자 토큰. 페이지 h1·섹션 h2 = 28→48px, 굵기 900 통일 |
| 6 | 자간 | `tracking-tight`(-0.025em) 48건이 크기와 무관하게 적용. 한글 라벨에 `uppercase tracking-wider` (`PricingCards.tsx:219,231`) | 클수록 음수, 본문 0, 양수는 아이브로만 | 4.2 크기별 자간. 한글에 uppercase·양수 자간 금지 |
| 7 | 최소 글자 크기 | `text-[10px]` 배지 (`trend-search:105`, `PricingCards:241`), `text-[11px]` 라벨 (`PricingCards:219,231`), 네비 플랜 배지 9px (`layout.tsx:522`) | 캡션 하한 12px (세 곳 공통) | 한글 하한 12px |
| 8 | 글자 대비 | neutral-500 설명: 검정 위 4.43:1 (`page.tsx:278,288`, `LandingStats.tsx:64,110`), neutral-900 위 3.78:1 (`PricingCards:194,204,214`). neutral-600: 2.69:1 (`page.tsx:109,182`), 푸터 neutral-600/700: 2.53/1.91:1 (`layout.tsx:415,419,436`), 제외 기능 neutral-600/700: 2.29/1.73:1 (`PricingCards:234-235`) | 보조 글자 mute `#a1a4a5` ≈ v4 neutral-400 `#a1a1a1` (8.1:1) | 읽는 글자 최저 neutral-400. neutral-500 은 비활성·placeholder 전용 |
| 9 | 반경 | 같은 역할이 제각각: 흰 CTA `rounded-xl` 12px (`page.tsx:114,173,263`), 카드·검색창·모달 `rounded-2xl` 16px (`page.tsx:96,157`, `trend-search:100`, `PricingCards:183`), 칩·토글 full. 전체 rounded-xl 270건, 2xl 123건, lg 161건 | 버튼·입력 8 / 카드 12 / 패널 16 | 역할별 3단 고정 (4.1) |
| 10 | 높이감 | `shadow-2xl` 23건 (홈 검색창 `page.tsx:157`, 모달 `:96`), `.channel-card:hover` 그림자 + 흰 링 + 들림 (`globals.css:137`), `backdrop-blur` 22건 | 어두운 면에서 그림자 없음, 면 단계 + 선 | 그림자 제거. 모달은 neutral-900 + neutral-800 선 + 검정 80% 막 |
| 11 | 카드 상호작용 | 홈 FeatureCard·StepCard 는 클릭 불가인데 hover 배경·선 반응, `-m-4` 음수 여백 (`page.tsx:275,285`). 허브 카드는 링크이고 hover 선만 밝아짐 (`trend-search:100`, 레퍼런스와 일치) | hover 는 상호작용 요소에만 | 정적 카드의 hover 제거 |
| 12 | 추천 요금제 | `border-2` + 카드마다 선 색 4종 (neutral-800, neutral-600, white/60, neutral-500) + 위에 걸친 흰 배지 (`PricingCards:32,55,79,104,183,187`). 가격 24px (`:203`) | 추천은 면 한 단 밝게 + 같은 1px 선. 가격 56px | 선 1px·neutral-800 통일, 추천만 `#1f1f1f` + neutral-600, 가격 36px `tabular-nums`, "추천"은 카드 안 액센트 글자 |
| 13 | 버튼 체계 | 흰 CTA 높이 제각각 (`py-2.5`, `py-3`), 보조 버튼 3종 (neutral-800+선700, neutral-700 채움, neutral-800+선600: `PricingCards:46,70,117`) | 주·보조·고스트 3단, 높이 고정 36 | 4.4 레시피 3단, 높이 44 (sm 36, lg 48) |
| 14 | 액센트 사용 | 홈 핵심어, 네비 2곳, 요금제 배지·절약 문구, 체크 표시 카드당 4~8개 (`PricingCards:223,235`). `/studio` 에 테마 기록상 되돌린 레드 `#E5484D` 10곳 잔존 (`studio/page.tsx:287,441,509,524,547,652,741,762,876,951`, 헤드라인 숫자·배지·강조 문구) | 정해진 자리에만 (Linear 4곳, Supabase 뷰포트당 1번) | 2.1 액센트 자리 적용, 체크 표시는 neutral-300. 레드 잔존은 소유자 확인 필요 |
| 15 | 포커스 | `focus-visible` 0건, `outline-none` 68건. Tailwind v4 의 `outline-none` 은 `outline-style: none` 이라 강제 색상 모드에서도 사라짐. 홈 검색 입력 `focus:outline-none` (`page.tsx:168`) | 2px 액센트 포커스 링 (Linear) | 4.4 포커스 레시피로 치환 |
| 16 | 네비 | 풀폭 `w-full px-3` (`layout.tsx:303`) 이라 본문 컨테이너와 좌우선 불일치. 탭 3개는 아이콘 + 흰 6% 알약, 요금제는 아이콘 + 회색, 서비스 2개는 에메랄드 글자 (`:317-343, 484`) → 위계 4종. `<a>` 라 이동마다 전체 새로고침 | 컨테이너 정렬 텍스트 링크, 오른쪽 흰 CTA 1개, 아래 1px 선 | 1200 컨테이너 정렬, 아이콘·알약 제거, 현재 페이지 = 흰 글자, `<Link>` |
| 17 | 푸터 | `bg-neutral-950`, `py-10`, 글자 neutral-600/700 (`layout.tsx:400-446`) | 캔버스 배경, 여백 64, 열 제목 흰색 + 링크 본문색 | 4.4 푸터 레시피 |
| 18 | 섹션 리듬 | 홈 섹션 `py-16`(64) 고정, 컨테이너 폭 672·768·1024·896px 혼재, 통계 띠 `border-y` + 다음 섹션 `border-t` 겹침 (home-10). 허브 `py-16 md:py-24`, studio `py-20` | 섹션 96 (모바일 48~64), 컨테이너 하나 | `py-16 md:py-24`, 컨테이너 1200 하나, 선 겹침 금지 |
| 19 | 섹션 헤더 | 확정 패턴이 studio·허브에만 있음. 캡션 neutral-500 (4.43:1), 허브 h1 은 한 톤 (`trend-search:86-90`). 홈에는 없음 | 대응 요소: Linear 아이브로 13px/+0.4px, x.ai 모노 +1.4px | 패턴 유지, 캡션 neutral-400, 두 톤 헤드라인 |
| 20 | 모션 | `[data-animate]` 0.7s·32~40px 이동 (`globals.css:88-104`), 카드 hover 들림·확대 1.02 (`:137`), 이미지 확대 (`:155`), 밑줄 1s (`:110`), 통계 카운트업 2s (`LandingStats.tsx:6`), `prefers-reduced-motion` 대응 없음 | 모션 정의 없음 (정적) | 4.3 모션 규칙 |
| 21 | 금지 요소 잔존 | `animate-pulse` 앰버 점 (`search/page.tsx:232`, 펄스 도트), 그라데이션 17건 (로그인 후 화면 `KeywordInsights.tsx` 8건 등) | | 정적 표시로 교체, 앱 내부 변환 때 정리 |
| 22 | 칩·토글 | 인기 키워드 칩 높이 약 28px `text-xs` (`page.tsx:187`), 요금 토글 선택 neutral-700 (`PricingCards:141,151`) | 칩 기본 투명, 선택 시 면 한 단 (Raycast) | 칩 32px·13px, 토글 선택 neutral-800 |

이미 레퍼런스와 맞는 것 (유지): 맨 SVG 아이콘 (허브·홈 기능), `01` 텍스트 숫자 (홈 3단계), 흰 CTA 색 (`bg-white hover:bg-neutral-200 text-black font-bold`), 카드 `bg-neutral-900`/`border-neutral-800`, 네비 높이 56px·아래 1px 선, 허브 카드 여백 24/32px, 요금 토글의 "선택 = 면 밝기" 방식.

## 4. bibllab 명세 제안

### 4.1 Tailwind v4 `@theme` 변수

**색 역할** (값은 Tailwind 4.1 neutral 과 같음. 기존 클래스로 써도 결과 동일)

| 변수 | 값 | 생기는 클래스 | 같은 값의 기존 클래스 | 쓰임 |
|---|---|---|---|---|
| `--color-canvas` | `#000000` | `bg-canvas` | `bg-black` | 페이지·네비·푸터 배경 |
| `--color-surface-sunken` | `#0a0a0a` | `bg-surface-sunken` | `bg-neutral-950` | 카드 안 입력, 표 머리, 토글 틀 |
| `--color-surface` | `#171717` | `bg-surface` | `bg-neutral-900` | 카드, 검정 위 입력 |
| `--color-surface-raised` | `#1f1f1f` | `bg-surface-raised` | `bg-[#1f1f1f]` | 추천 요금제, 링크 카드 hover |
| `--color-surface-selected` | `#262626` | `bg-surface-selected` | `bg-neutral-800` | 선택된 탭·칩, 보조 버튼 hover |
| `--color-line-faint` | `#171717` | `border-line-faint` | `border-neutral-900` | 검정 위 내부 구분선, 푸터 하단선 |
| `--color-line` | `#262626` | `border-line` | `border-neutral-800` | 카드·네비·푸터·섹션 경계 |
| `--color-line-strong` | `#404040` | `border-line-strong` | `border-neutral-700` | 입력 기본선, 보조 버튼, 링크 카드 hover |
| `--color-fg` | `#ffffff` | `text-fg` | `text-white` | 제목, 주요 값 |
| `--color-fg-muted` | `#d4d4d4` | `text-fg-muted` | `text-neutral-300` | 본문, 리드 |
| `--color-fg-subtle` | `#a1a1a1` | `text-fg-subtle` | `text-neutral-400` | 보조 글자, 캡션, 푸터, 두 톤 헤드라인 리드 |
| `--color-fg-disabled` | `#737373` | `text-fg-disabled` | `text-neutral-500` | 비활성·placeholder 전용 |
| `--color-cta` / `-hover` / `-active` | `#ffffff` / `#e5e5e5` / `#d4d4d4` | `bg-cta` 등 | `bg-white` / `bg-neutral-200` / `bg-neutral-300` | 주 버튼 |
| `--color-on-cta` | `#000000` | `text-on-cta` | `text-black` | 주 버튼 글자 |
| `--color-accent` / `-hover` | `#00e5a0` / `#66ffcc` | `text-accent`, `outline-accent` | `text-[#00E5A0]` | 2.1 액센트 자리만 |
| `--color-kakao`, `--color-youtube` | `#fee500`, `#ff0000` | `bg-kakao`, `text-youtube` | | 브랜드 표식 |

시맨틱(보존, 기존 클래스 그대로): 경고·별점 `text-amber-400`, 에러·할인 `text-red-400` (채움이 필요하면 `bg-red-500`), 성공 `text-green-400`. 채움 배경 없이 글자색·옅은 선(`/30`)으로.

**글자 단계** (Pretendard Variable, 4.2 보정 반영. `text-*` 하나가 크기·행간·자간·굵기를 함께 지정)

| 토큰 | 크기 | 굵기 | 행간 | 자간 | 쓰임 | 모바일 |
|---|---|---|---|---|---|---|
| `text-display` | 60px | 900 | 1.15 | -0.03em | 홈 히어로 h1 (페이지당 1개) | `text-h2` (36px) |
| `text-h1` | 48px | 900 | 1.2 | -0.025em | 페이지 h1, 섹션 h2 | `text-h3` (28px) |
| `text-h2` | 36px | 900 | 1.25 | -0.02em | 하위 섹션, 가격 (굵기 800) | `text-h3` |
| `text-h3` | 28px | 900 | 1.3 | -0.02em | 모바일 h1·h2, 마감 CTA 제목, 통계 숫자 | |
| `text-h4` | 20px | 700 | 1.4 | -0.01em | 카드 제목, 요금명 | `text-lg` (18px) |
| `text-lead` | 18px | 400 | 1.7 | -0.005em | 리드 문단 | `text-body` |
| `text-body` | 16px | 400 | 1.75 | 0 | 본문 | |
| `text-body-sm` | 14px | 400 | 1.7 | 0 | 카드 설명, 표, 푸터 링크 | |
| `text-caption` | 13px | 500 | 1.5 | 0 | 메타, 칩 | |
| `text-micro` | 12px | 500 | 1.5 | 0 | 배지, 법적 고지 (하한) | |
| `text-label-en` | 14px (md 16px) | 900 | 1 | 0.25em | 영문 대문자 섹션 라벨 (오너 패턴) | |

**반경**

| 변수 | 값 | 생기는 클래스 | 같은 값 | 쓰임 |
|---|---|---|---|---|
| `--radius-control` | 8px | `rounded-control` | `rounded-lg` | 버튼, 입력, 셀렉트, 네비 링크 |
| `--radius-card` | 12px | `rounded-card` | `rounded-xl` | 카드, 요금제, 히어로 검색창, 드롭다운 |
| `--radius-panel` | 16px | `rounded-panel` | `rounded-2xl` | 모달, 미디어 프레임, 큰 배너 |
| (기본) | 4px / 9999px | | `rounded` / `rounded-full` | 키캡·인라인 코드 / 칩·배지·토글·아바타 |

중첩 규칙: 바깥 반경 ≈ 안쪽 반경 + 안쪽 여백 (검색창 12 ≈ 버튼 8 + 여백 6).

**간격·컨테이너** (기본 4px 단위는 Tailwind 기본값 그대로. 새 토큰은 컨테이너 2개만)

| 용도 | 값 | 클래스 | 근거 |
|---|---|---|---|
| 페이지 컨테이너 | 1200px + 거터 16/24 | `mx-auto max-w-page px-4 md:px-6` (`--container-page: 75rem`) | Resend 1200, Raycast 1240 + 24, Vercel 거터 24/16. 네비·섹션·푸터 공통 |
| 글 폭 | 672px | `max-w-reading` (`--container-reading: 42rem`) 또는 `max-w-2xl` | 16px 한글 약 42자. `max-w-prose` 는 Tailwind 기본(65ch)이 우선이라 이름을 피함 |
| 섹션 세로 | 64 → 96 | `py-16 md:py-24` | Linear·Resend 96, Raycast 태블릿 64 |
| 히어로 | 위 80 아래 64 → 위 128 아래 96 | `pt-20 pb-16 md:pt-32 md:pb-24` | Resend 히어로 띠 128 |
| 섹션 헤더 → 헤드라인 | 40 → 48 | `mb-10 md:mb-12` | 오너 패턴 `mb-12` |
| 헤드라인 → 설명 | 16 | `mt-4` | Vercel 8 (한글 행간 고려 16) |
| 설명 → 본문·CTA | 40 → 56 / 32 | `mt-10 md:mt-14` / `mt-8` | Vercel "CTA 앞은 더 넓게" |
| 카드 그리드 | 16 → 24 | `gap-4 md:gap-6` | Raycast 16, Vercel 24 |
| 카드 안 여백 | 24 → 32 | `p-6 md:p-8` | Linear·Raycast 24, Resend 32 |
| 카드 안 제목 → 설명 | 8 | `mt-2` | Vercel 8 |
| 버튼 높이 / 가로 여백 | sm 36 / 14, md 44 / 20, lg 48 / 24 | `h-9 px-3.5`, `h-11 px-5`, `h-12 px-6` | 레퍼런스 36, 한글 15px·터치 44 로 상향 |
| 입력 높이 / 가로 여백 | 44 / 14 | `h-11 px-3.5` | Resend 40·14, Raycast 검색 44 |
| 네비 높이 | 56 | `h-14` | Linear·Raycast 56 |
| 터치 타깃 하한 | 버튼 44, 칩·푸터 링크 32 | `h-11`, `h-8` | WCAG 2.5.8 (24) 이상 |

**globals.css 교체안**

```css
@import "tailwindcss";

@theme {
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;

  --color-canvas: #000000;
  --color-surface-sunken: #0a0a0a;
  --color-surface: #171717;
  --color-surface-raised: #1f1f1f;
  --color-surface-selected: #262626;
  --color-line-faint: #171717;
  --color-line: #262626;
  --color-line-strong: #404040;
  --color-fg: #ffffff;
  --color-fg-muted: #d4d4d4;
  --color-fg-subtle: #a1a1a1;
  --color-fg-disabled: #737373;
  --color-cta: #ffffff;
  --color-cta-hover: #e5e5e5;
  --color-cta-active: #d4d4d4;
  --color-on-cta: #000000;
  --color-accent: #00e5a0;
  --color-accent-hover: #66ffcc;
  --color-kakao: #fee500;
  --color-youtube: #ff0000;

  --text-display: 3.75rem;   --text-display--line-height: 1.15; --text-display--letter-spacing: -0.03em;  --text-display--font-weight: 900;
  --text-h1: 3rem;           --text-h1--line-height: 1.2;       --text-h1--letter-spacing: -0.025em;      --text-h1--font-weight: 900;
  --text-h2: 2.25rem;        --text-h2--line-height: 1.25;      --text-h2--letter-spacing: -0.02em;       --text-h2--font-weight: 900;
  --text-h3: 1.75rem;        --text-h3--line-height: 1.3;       --text-h3--letter-spacing: -0.02em;       --text-h3--font-weight: 900;
  --text-h4: 1.25rem;        --text-h4--line-height: 1.4;       --text-h4--letter-spacing: -0.01em;       --text-h4--font-weight: 700;
  --text-lead: 1.125rem;     --text-lead--line-height: 1.7;     --text-lead--letter-spacing: -0.005em;
  --text-body: 1rem;         --text-body--line-height: 1.75;
  --text-body-sm: 0.875rem;  --text-body-sm--line-height: 1.7;
  --text-caption: 0.8125rem; --text-caption--line-height: 1.5;  --text-caption--font-weight: 500;
  --text-micro: 0.75rem;     --text-micro--line-height: 1.5;    --text-micro--font-weight: 500;
  --text-label-en: 0.875rem; --text-label-en--line-height: 1;   --text-label-en--letter-spacing: 0.25em;  --text-label-en--font-weight: 900;

  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
  --radius-panel: 1rem;

  --container-page: 75rem;
  --container-reading: 42rem;
}

/* 선택(권장): 남은 쿨그레이 gray 1,297건 · slate 143건을 한 번에 무채색으로.
   teal 은 재매핑하지 않는다(teal 채움 버튼이 에메랄드 채움 버튼이 되어 "색 배경 버튼 금지"에 걸림). */
@theme {
  --color-gray-50: oklch(98.5% 0 0);  --color-gray-100: oklch(97% 0 0);  --color-gray-200: oklch(92.2% 0 0);
  --color-gray-300: oklch(87% 0 0);   --color-gray-400: oklch(70.8% 0 0); --color-gray-500: oklch(55.6% 0 0);
  --color-gray-600: oklch(43.9% 0 0); --color-gray-700: oklch(37.1% 0 0); --color-gray-800: oklch(26.9% 0 0);
  --color-gray-900: oklch(20.5% 0 0); --color-gray-950: oklch(14.5% 0 0);
  /* --color-slate-50 ~ 950 도 같은 11개 값 */
}

@layer base {
  html {
    background-color: var(--color-canvas);
    color: var(--color-fg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  h1, h2, h3 { text-wrap: balance; }
  p, li, dd, figcaption { text-wrap: pretty; }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  ::selection { background-color: var(--color-accent); color: #000; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  [data-animate] { opacity: 1 !important; transform: none !important; }
}
```

검증: 위 블록을 프로젝트의 Tailwind 4.1.18 로 스크래치패드에서 컴파일해 `text-display`(크기·행간·자간·굵기 4속성), `rounded-card`, `max-w-page`, `max-w-reading`, `bg-gray-900`→`oklch(20.5% 0 0)`, `html` 글꼴 = `--font-sans`, `aria-pressed:`·`aria-selected:`·`aria-[current=page]:` 가 의도대로 생성되는 것을 확인했다. `font-extrabold`·`leading-*`·`tracking-*` 를 같이 쓰면 토큰 값을 덮어쓴다.

함께 지울 것: `:root` 의 `--background`·`--card`·`--muted`·`--ring`, `prefers-color-scheme` 덮어쓰기, 레이어 밖 `body {}` 규칙(남색 띠 원인), `@theme inline` 자기참조, `.card`, `.bg-dashboard`(사용처 0). `layout.tsx`: `Inter` import·`inter.className` 제거, body `bg-black text-white`, 푸터 `mt-16` 제거.

**Pretendard 로드** (v1.3.9, 가족 이름 "Pretendard Variable", 굵기 축 45~920 이라 900 사용 가능, 라틴 글자는 Inter 기반)

| 방법 | 장점 | 단점 | 판정 |
|---|---|---|---|
| 동적 서브셋 자체 호스팅: `dist/web/variable/` 의 서브셋 CSS + woff2 폴더를 `public/fonts/pretendard/` 에 두고 layout `<head>` 에 `<link rel="stylesheet">` | 화면에 쓰인 글자 묶음만 받음 (unicode-range), 외부 도메인·npm 의존 없음 | 파일 복사 1회 | **권장** |
| jsDelivr `pretendardvariable-dynamic-subset.min.css` 링크 + preconnect | 한 줄 | 외부 CDN 의존 | 대안 |
| `next/font/local` 가변 woff2 1개 | next/font 통합 | 약 2MB 단일 파일 선로드, LCP 손해 | 비권장 |

### 4.2 한글 타이포 보정

| 규칙 | 값 | 이유 |
|---|---|---|
| 줄바꿈 | 전역 `word-break: keep-all` + `overflow-wrap: break-word` (개별은 `break-keep wrap-break-word`) | 어절 단위로 끊고, 긴 URL·이메일만 강제로 끊음 |
| 제목 | h1~h3 `text-wrap: balance` (`text-balance`) | 마지막 줄 한두 글자 방지 ("파/악하세요") |
| 문단 | p·li `text-wrap: pretty` (`text-pretty`) | 마지막 줄 고아 글자 방지. 미지원 브라우저는 영향 없음 |
| 숨김 br | `<br className="hidden sm:block" />` 앞에 `{" "}` | 모바일에서 두 문장이 붙는 문제 방지 (home-01) |
| 자간 | 48px 이상 -0.03~-0.025em · 28~40px -0.02em · 20~24px -0.01em · 18px -0.005em · 16px 이하 0 | Linear 의 비슷한 크기 값 (80px -3.75%, 56px -3.2%, 40px -2.5%) 의 약 80%, Resend·Vercel (-5%) 의 절반 수준. 네모꼴 한글을 영문만큼 조이면 900 굵기에서 획이 붙음. 크기와 무관한 `tracking-tight` 일괄 적용 금지 |
| 양수 자간 | 영문 대문자 라벨에만 0.25em. 한글에 `uppercase`·`tracking-wide*` 금지 | Linear +3%, x.ai +10% 는 라틴 전용. 한글에는 대문자가 없음 |
| 행간 | 디스플레이 1.15 · h1 1.2 · h2 1.25 · h3 1.3 · 카드 제목 1.4 · 리드 1.7 · 본문 1.75 · 보조 1.7 · 캡션 1.5 | 레퍼런스 (제목 1.0~1.1, 본문 1.5~1.6) 보다 0.1~0.25 넓게. 한글은 글자 높이가 꽉 차서 행이 붙어 보임 |
| 글 폭 | 문단 최대 672px (16px 한글 약 42자) | 한 줄 35~45자 |
| 최소 크기 | 12px | 레퍼런스 캡션 하한 12px. 한글은 획이 많아 10~11px 에서 판독 저하 |
| 숫자 | 가격·통계·남은 횟수 `tabular-nums` | 자릿수 정렬, 카운트업 때 흔들림 방지 |
| 굵기 | 제목 900 (오너), 카드 제목 700, 주 버튼 700, 보조 버튼 600, 본문 400, 본문 강조 600 | 레퍼런스 상한 600 은 라틴 전용 글꼴 기준. 오너 규칙 우선 |

### 4.3 모션

| 규칙 | 값 |
|---|---|
| 상태 전환 | `transition-colors duration-150 ease-out` (색·배경·선만) |
| 금지 | hover 들림(translate)·확대(scale)·그림자, 장식 펄스, 반짝임, 글로우. `.channel-card`·`.review-card`·`.feat-img` hover 정리 |
| 허용 | 로딩 중 스켈레톤 `animate-pulse`, 스피너, 아코디언 열림 200ms |
| 스크롤 등장 | 쓰려면 200~300ms, 이동 8~12px, 한 번만 (현재 700ms, 32~40px) |
| 카운트업 | 1초 이하, reduced-motion 이면 최종값 바로 표시 (현재 2초) |
| reduced-motion | 4.1 의 전역 미디어 쿼리 |

### 4.4 컴포넌트 레시피 (Tailwind 클래스)

토큰을 넣기 전에도 바로 쓸 수 있게 기존 클래스로 적었다. 토큰 도입 후 `[#00E5A0]` → `accent`, `[#1f1f1f]` → `surface-raised`, `max-w-[75rem]` → `max-w-page` 로 바꾼다. `{F}` 는 포커스 조각.

| 부품 | 클래스 |
|---|---|
| **포커스 링** `{F}` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5A0]` (전역 기본값은 4.1 base 규칙. `focus:outline-none` 이 남아 있으면 기본값까지 지워지므로 68건을 이 조각으로 바꾼다. ring(그림자) 대신 outline 을 쓰는 이유: 강제 색상 모드에서 남고 둥근 모서리를 따라감) |
| 포커스 (입력) | `focus-visible:border-[#00E5A0] focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-[#00E5A0]` (선 1 + 외곽선 1 = 2px) |
| 포커스 (감싼 입력) | 바깥: `focus-within:border-[#00E5A0] focus-within:outline-1 focus-within:outline-[#00E5A0]`, 안쪽 input 만 `outline-none` |
| **주 버튼 (화이트)** md | `inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[15px] font-bold text-black transition-colors duration-150 hover:bg-neutral-200 active:bg-neutral-300 disabled:pointer-events-none disabled:bg-neutral-800 disabled:text-neutral-500 {F}` |
| 주 버튼 sm / lg | sm: `h-9 px-3.5 text-sm` (네비·카드 안) / lg: `h-12 px-6 text-base` (히어로·요금제), 전체 폭은 `w-full` |
| **보조 버튼** | `inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:border-neutral-600 hover:bg-neutral-800 disabled:pointer-events-none disabled:text-neutral-500 {F}` |
| **고스트 버튼** | `inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium text-neutral-300 transition-colors duration-150 hover:bg-neutral-900 hover:text-white disabled:pointer-events-none disabled:text-neutral-500 {F}` (네비 "로그인"은 `h-9 px-3 text-sm`) |
| **링크 (본문)** | `rounded-sm font-medium text-white underline decoration-neutral-600 underline-offset-4 transition-colors hover:decoration-white {F}` |
| 링크 (강조, 액센트 자리) | `rounded-sm font-semibold text-[#00E5A0] transition-colors hover:text-[#66FFCC] {F}` |
| 링크 (보조·푸터) | `rounded-sm text-neutral-400 transition-colors hover:text-white {F}` |
| 링크 (카드 하단) | `inline-flex items-center gap-1 text-sm font-semibold text-white` + `<span aria-hidden="true">→</span>` |
| **입력** | `h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 text-[15px] text-white placeholder:text-neutral-500 transition-colors duration-150 hover:border-neutral-600 focus-visible:border-[#00E5A0] focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-[#00E5A0] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-400` |
| 입력 주변 | 카드 안에서는 `bg-neutral-950`. 라벨 `mb-2 block text-sm font-medium text-neutral-300`, 도움말 `mt-1.5 text-xs text-neutral-400`, 오류 `mt-1.5 text-xs text-red-400`, textarea 는 `h-11` 대신 `min-h-28 py-2.5` |
| 히어로 검색창 | 폼 `flex h-14 w-full items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 p-1.5 pl-4 transition-colors focus-within:border-[#00E5A0] focus-within:outline-1 focus-within:outline-[#00E5A0] md:h-16` · 아이콘 `size-5 shrink-0 text-neutral-400` · input `h-full min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-neutral-500 outline-none` · 버튼은 주 버튼 md (`md:h-12`). 그림자 없음 |
| **카드 (정적)** | `rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:p-8` (hover 없음) |
| 카드 (링크) | `group block rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition-colors duration-150 hover:border-neutral-700 hover:bg-[#1f1f1f] md:p-8 {F}` |
| 카드 안쪽 | 맨 SVG `size-6 text-white` → 제목 `mt-5 text-lg font-bold tracking-[-0.01em] text-white md:text-xl` → 설명 `mt-2 text-sm leading-[1.7] text-neutral-400 md:text-[15px]` → 하단 링크 `mt-6` |
| 요금제 카드 | 기본은 카드 (정적), 추천만 `border-neutral-600 bg-[#1f1f1f]` + 이름 옆 `text-xs font-bold text-[#00E5A0]` "추천". 선 굵기 1px 통일 |
| 요금제 안쪽 | 대상 `text-sm text-neutral-400` · 이름 `text-xl font-bold text-white` · 가격 `text-[28px] font-extrabold tabular-nums tracking-[-0.02em] text-white md:text-4xl` + `/ 월` `text-sm text-neutral-400` · 원가 `text-sm text-neutral-400 line-through decoration-neutral-600` · 소제목 `text-xs font-semibold text-neutral-400` (uppercase·자간 없음) · 포함 `text-sm text-neutral-300` + `✓` neutral-300 · 제외 `text-sm text-neutral-400 line-through decoration-neutral-600` + `✕` neutral-500 + `<span class="sr-only">미포함</span>` |
| **배지 (기본)** | `inline-flex h-6 items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 text-xs font-medium text-neutral-300` |
| 배지 (액센트, 섹션당 1) | `inline-flex h-6 items-center rounded-full border border-neutral-700 px-2.5 text-xs font-semibold text-[#00E5A0]` |
| 배지 (시맨틱) | 기본 배지에서 배경 빼고 `border-amber-400/30 text-amber-400` · `border-red-400/30 text-red-400` · `border-green-400/30 text-green-400` |
| 배지 (히어로 위) | `inline-flex h-8 items-center rounded-full border border-neutral-800 px-3.5 text-sm text-neutral-300` |
| 칩 (필터·인기 키워드) | `inline-flex h-8 items-center rounded-full border border-neutral-800 px-3 text-[13px] text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white aria-pressed:border-neutral-600 aria-pressed:bg-neutral-800 aria-pressed:text-white {F}` (필터 칩만 `aria-pressed`, 누르면 바로 검색하는 인기 키워드 칩은 상태 없음) |
| 세그먼트 토글 | 틀 `inline-flex rounded-full border border-neutral-800 bg-neutral-950 p-1` · 항목 `h-10 rounded-full px-6 text-sm font-semibold text-neutral-400 transition-colors hover:text-white aria-selected:bg-neutral-800 aria-selected:text-white {F}` |
| 모달 | 막 `fixed inset-0 bg-black/80` (블러 없음) · 상자 `rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8` (그림자 없음) |

**섹션 헤더** (오너 패턴에 수치만 보강)

```html
<section class="border-t border-neutral-800">
  <div class="mx-auto max-w-[75rem] px-4 py-16 md:px-6 md:py-24">
    <div class="mb-10 flex items-center justify-between gap-4 border-b border-neutral-800 pb-4 md:mb-12">
      <span class="text-xs text-neutral-400 md:text-sm">{캡션}</span>
      <span lang="en" class="text-sm font-black tracking-[0.25em] text-white md:text-base">{LABEL}</span>
    </div>
    <h2 class="text-[28px] font-black leading-[1.3] tracking-[-0.02em] text-balance md:text-5xl md:leading-[1.2] md:tracking-[-0.025em]">
      <span class="text-neutral-400">{리드}</span><br />{본문}
    </h2>
    <p class="mt-4 max-w-2xl text-base leading-[1.75] text-neutral-300 md:text-lg md:leading-[1.7]">{설명}</p>
    <!-- 본문: mt-10 md:mt-14 -->
  </div>
</section>
```

토큰 도입 후 h2 는 `text-h3 md:text-h1`. 캡션 neutral-500 → neutral-400 (4.43 → 8.1:1). 헤드라인 강조는 리드 회색 + 본문 흰색이 기본, 액센트 핵심어는 1곳까지. 섹션 위 선과 헤더 선 사이에는 위 여백 64~96 이 들어가 겹치지 않는다.

**네비 바**

```html
<nav class="sticky top-0 z-50 border-b border-neutral-800 bg-black">
  <div class="mx-auto flex h-14 max-w-[75rem] items-center gap-6 px-4 md:px-6">
    <Link href="/" class="flex shrink-0 items-center gap-2 rounded-md {F}">{로고}</Link>
    <ul class="hidden flex-1 items-center justify-center gap-1 lg:flex">
      <li><Link class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-neutral-400 transition-colors hover:text-white aria-[current=page]:text-white {F}">브랜드 인큐베이팅</Link></li>
      <!-- 커뮤니티&자료 · 유튜브 트렌드 서치 · 요금제 : 같은 클래스 -->
      <li aria-hidden="true" class="mx-2 h-4 w-px bg-neutral-800"></li>
      <li><Link class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-[#00E5A0] transition-colors hover:text-[#66FFCC] {F}">팀비블 1:1 유튜브 컨설팅</Link></li>
      <!-- 유튜브 채널 대행 문의 : 같은 클래스 -->
    </ul>
    <div class="ml-auto flex shrink-0 items-center gap-2">{사용량 배지(기본)} {로그인(고스트 sm)} {시작하기(주 버튼 sm)}</div>
  </div>
  <!-- lg 미만: 지금처럼 줄바꿈 칩 행(전부 노출) 유지, 칩 레시피 적용 -->
</nav>
```

메뉴 앞 아이콘과 흰 6% 알약 배경은 뺀다(레퍼런스 네비는 모두 텍스트). 단 `layout.tsx:316` 주석상 소유자가 의도한 강조("화이트 필 강조")라 적용 전 확인한다. 현재 페이지 표시는 `usePathname` 을 쓰는 작은 클라이언트 컴포넌트로 하고 루트 레이아웃에서 `auth()`·`cookies()` 는 부르지 않는다. `<a>` 는 `next/link`. 1152px(1200 - 거터) 안에 메뉴 6개 + 오른쪽 묶음이 들어가는지 실측 후 데스크톱 메뉴 시작점을 `md` 에서 `lg` 로 옮길지 정한다.

**푸터**

```html
<footer class="border-t border-neutral-800 bg-black">
  <div class="mx-auto max-w-[75rem] px-4 py-12 md:px-6 md:py-16">
    <div class="grid gap-10 md:grid-cols-[1fr_2fr_auto]">
      <div>
        <Link href="/" class="inline-flex items-center gap-2 rounded-md {F}">{로고}</Link>
        <p class="mt-3 max-w-xs text-sm leading-[1.7] text-neutral-400">{소개}</p>
      </div>
      <address class="space-y-1 text-xs not-italic leading-[1.7] text-neutral-400">
        <p class="font-medium text-neutral-300">{상호 | 대표}</p> {사업자 정보 줄}
      </address>
      <nav aria-label="정책 및 문의">
        <ul class="flex flex-col">
          <li><a class="inline-flex h-8 items-center rounded-sm text-sm text-neutral-400 transition-colors hover:text-white {F}">개인정보처리방침</a></li>
        </ul>
      </nav>
    </div>
    <div class="mt-10 space-y-2 border-t border-neutral-900 pt-6 text-xs leading-[1.7] text-neutral-400">{YouTube 고지} {저작권}</div>
  </div>
</footer>
```

푸터 위 `mt-16` 삭제(남색 틈 원인). 글자 neutral-600/700 → neutral-400 (2.5/1.9 → 8.1:1), 크기 12px 유지.

**히어로** (홈): `section px-4 pt-20 pb-16 md:px-6 md:pt-32 md:pb-24` > `div mx-auto max-w-3xl text-center` > 배지 (히어로 위) → h1 `mt-6 text-[36px] font-black leading-[1.25] tracking-[-0.02em] text-balance md:text-6xl md:leading-[1.15] md:tracking-[-0.03em]` (토큰: `text-h2 md:text-display`, 핵심어만 `text-[#00E5A0]`) → 리드 `mt-5 text-base leading-[1.75] text-neutral-300 md:text-lg` → 검색창 `mt-10` → 칩 행 `mt-5`. 흰 면은 검색 버튼 1개 (네비 "시작하기" 별도).

### 4.5 적용 순서

1. `globals.css` 를 4.1 안으로 교체: 남색 띠, 한글 줄바꿈, 포커스, 글꼴 변수, 모션 감소가 전 페이지에서 한 번에 바뀐다.
2. `layout.tsx`: Pretendard 링크 추가, Inter 제거, 네비·푸터 레시피 적용 (정적 렌더 유지, 인증 호출 없음).
3. 공용 부품(버튼·입력·카드·배지·섹션 헤더)을 만들고 홈 → 요금제 → 트렌드 서치 순으로 적용. 검색 횟수 누적 로직(`saveToHistory` → `/search?q=…&count=N`)은 마크업만 손댄다.
4. (선택) gray·slate 재매핑. teal 은 로그인 후 화면을 변환할 때 컴포넌트별로 neutral·흰 버튼으로 바꾼다. 차트·경쟁도 색은 유지.
