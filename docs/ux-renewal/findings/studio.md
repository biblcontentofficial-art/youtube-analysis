# studio 영역 감사: 채널 대행(/studio)과 상담 신청(/studio/consulting)

- 영역키: `studio` · 감사일 2026-10-04 · 읽기 전용(저장소 수정 없음)
- 경로 기준: `/Users/taemin/Downloads/youtube-analysis` (아래 파일 경로는 모두 이 저장소 기준)
- 읽은 파일: `src/app/studio/page.tsx`(983줄), `src/app/studio/studio-content.json`, `src/app/studio/_components/{StudioGuard,StatsCounter,VideoMarquee,DevEditor}.tsx`, `src/app/studio/consulting/{layout,page}.tsx`
- 함께 확인한 연관 파일: `src/app/layout.tsx`(네비), `src/app/globals.css`(스크롤 애니메이션), `src/app/_components/{AnimationObserver,TrackVisit,KakaoChatButton}.tsx`, `src/app/api/studio/contact/route.ts`, `src/app/api/track/route.ts`, `src/app/tmkstudio/route.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.mjs`
- 본 스크린샷: `shots/before-studio/studio-desktop-01~10`, `studio-mobile-01~17`, `shots/before/studio-consulting-desktop-01`, `studio-consulting-mobile-01~02`, `shots/before/studio-desktop-01`(쿠키 없이 접속한 결과)
- 추가 검증(읽기 전용): 프로덕션 HTML(`curl https://bibllab.com/studio`, `/studio/consulting`), 마퀴 썸네일 24개의 HTTP 상태와 YouTube oEmbed, 이미지 실제 크기(sips, curl), WCAG 대비 계산, `git log`

## 총평

디자인 뼈대는 이미 확정 규칙에 가깝다. 블랙·neutral 카드, 섹션 라벨 패턴, 화이트 CTA, 실제 채널과 실측 데이터 중심의 증거 구성이 일관되고, 설득 순서(문제 → 증거 → 과정 → 차별점 → 후기 → 소개 → 가격 → FAQ → CTA)도 갖춰져 있다.

가장 큰 문제는 디자인이 아니라 동작이다. 네비와 검색에서 들어온 일반 방문자는 `StudioGuard` 때문에 이 페이지를 보지 못하고 홈으로 튕긴다. 증거 섹션의 마퀴 썸네일 4장 중 1장은 삭제된 영상이고, 상담 폼에는 부가세 표기가 서로 다르게 적혀 있으며, 방문 추적은 방문 1회당 11건으로 기록된다.

규칙 면에서는 되돌리기로 한 레드 액센트가 10곳 남아 네비·폼의 에메랄드와 충돌한다. 전환 면에서는 가격 섹션을 포함해 페이지 대부분(모바일 기준 화면 약 18장 분량)에 CTA 가 없고, 모바일에서 비교표의 TMK 열과 최종 CTA 헤드라인이 깨진다.

재설계가 필요한 상태는 아니다. 버그 수정 → 모바일 마감 → CTA 배치와 가격 카드 → 폼 신뢰 요소 → 성능 순으로 손보면 된다.

**현재 완성도: 3 / 5**

## 유지할 점 (과한 재설계 방지)

1. **섹션 헤더 패턴**: 좌측 캡션 + 우측 영문 라벨(`tracking-[0.25em] font-black`) + 헤어라인, 회색 리드 + 화이트 두 톤 헤드라인. 11개 섹션에 일관 적용(`page.tsx:253-261`). 확정 규칙 그대로다.
2. **화이트 주 CTA + neutral 보조 버튼**, 색 배경 버튼 없음. CTA 문구도 "채널 대행 문의하기"로 통일돼 있다(`page.tsx:307-318, 398-403, 967-972`).
3. **카드 체계**: `bg-neutral-900` / `border-neutral-800`, 과정 7단계와 차별점 4개가 원형 배지 없이 `01` 텍스트 숫자로 표현돼 있다(`page.tsx:590-605, 624-626`).
4. **증거의 구체성**: 실제 채널 6개 카드(배너·아바타·구독자 수·유튜브 링크), 출처를 밝힌 90일 실측 지표("YouTube 스튜디오 기준", `page.tsx:484-512`), 실버 버튼 사진. 구성과 수치는 그대로 둔다.
5. **비교표와 "기존 대행사의 3가지 구조적 문제" 서사**: 차별점이 가장 분명한 구간이다. 문장은 유지하고 모바일 표현만 고친다.
6. **FAQ 가 네이티브 `<details>/<summary>`**: JS 없이 키보드로 열리고, 내용은 `studio-content.json` 으로 분리돼 있다. "보장은 드리지 않습니다" 같은 솔직한 답변 톤도 유지.
7. **가격 공개**: 단일 패키지 금액과 부가세 별도 표기가 가격 카드와 FAQ 에서 일치한다(`page.tsx:891-895`, `studio-content.json:81`).
8. **상담 폼의 3단계 구조**: 진행 바 + `1 / 3` 표시, 에메랄드는 진행 바·필수 표시·선택 점에만 절제해서 사용, 제출 중 버튼 잠금, 완료 화면의 이름 호명과 응답 기한 안내, 카카오 후속 채널(`consulting/page.tsx:236-254, 195-231`).
9. **`force-static` 정적 페이지** + JSON-LD + 메타데이터(`page.tsx:10, 21-125`). 서버 인증을 붙이지 않는다.

## 발견 요약

| id | 심각도 | 분류 | 제목 | 공수 |
|---|---|---|---|---|
| studio-01 | P0 | bug | 네비·검색 방문자가 /studio 를 못 보고 홈으로 튕김 | S |
| studio-02 | P1 | bug | 마퀴 썸네일 24개 중 6개가 삭제된 영상 | S |
| studio-03 | P1 | bug | 상담 폼의 "(부가세 포함)" 라벨이 가격표와 반대 | S |
| studio-04 | P1 | bug | 방문 추적이 방문 1회당 11건 기록 | S |
| studio-05 | P1 | theme-violation | 레드 액센트 10곳, 에메랄드 0곳 | S |
| studio-06 | P1 | conversion | 본문 대부분과 가격 섹션에 CTA 없음, 모바일 고정 CTA 없음 | M |
| studio-07 | P1 | conversion | 가격 카드가 비어 보이고 조건·버튼이 없음 | M |
| studio-08 | P1 | mobile | 모바일 비교표에서 TMK STUDIO 열이 잘림 | S |
| studio-09 | P1 | mobile | 모바일 최종 CTA·헤드라인 단어 중간 끊김, 통계 2+1 줄바꿈 | S |
| studio-10 | P1 | conversion | "채널 URL만" 약속과 폼의 실제 부담이 다름, 개인정보 안내 없음 | M |
| studio-11 | P1 | interaction-feedback | 폼 검증·오류 안내·시맨틱 부족 | M |
| studio-12 | P1 | performance | 첫 화면이 JS 실행 전까지 비어 있음 | M |
| studio-13 | P2 | performance | 영상 임베드·이미지·마퀴의 상시 비용 | M |
| studio-14 | P2 | theme-violation | 금지 패턴 잔재(그라데이션·틸·원형 배지·em-dash·상시 마감임박) | S |
| studio-15 | P2 | visual-consistency | 정렬 축·컨테이너 폭·대비 불일치 | M |

## 발견 상세

### studio-01 · P0 · bug · 네비·검색 방문자가 /studio 를 못 보고 홈으로 튕김

- **페이지**: /studio, 전역 네비, /studio/consulting, /community/about
- **근거**
  - `src/app/studio/_components/StudioGuard.tsx:9-16`: `studio_access` 쿠키가 없으면 `router.replace("/")`. `src/app/studio/page.tsx:271` 에서 렌더.
  - 쿠키는 `src/app/tmkstudio/route.ts:11` 에서만 심는다.
  - 그런데 `src/app/layout.tsx:343`(데스크톱), `:388`(모바일) 네비 "유튜브 채널 대행 문의"가 `/studio` 로 연결된다.
  - `src/app/sitemap.ts:9-15`: `/studio` 가 "주력", priority 1.0. `page.tsx:44-46, 70-72`: canonical + `index: true`. `src/app/robots.ts:13`: `/tmkstudio` 를 막으면서 주석에 "index /studio instead".
  - 그 밖의 진입 링크: `consulting/page.tsx:224, 237`, `src/app/community/about/page.tsx:97`, `src/lib/community.ts:166`.
  - `shots/before/manifest.json`: `/studio` 의 `final_url` 이 데스크톱·모바일 모두 `https://bibllab.com/`. `shots/before/studio-desktop-01.png` 는 홈 화면이다.
  - 쿠키 없이 받은 프로덕션 HTML 에는 본문 전체가 들어 있다(정적 페이지, 가드는 클라이언트 전용).
- **문제**: 사이트가 "주력"으로 밀고 있는 세일즈 페이지에 일반 방문자가 도달할 수 없다. 메뉴를 눌러도, 구글에서 들어와도, 문의 폼의 "채널 대행 페이지" 링크를 눌러도 잠깐 검은 화면이 보인 뒤 설명 없이 홈(키워드 분석 도구)으로 이동한다. 검색 엔진도 JS 리다이렉트로 해석해 색인에서 빠질 수 있다. 가드는 2026-04-04 에 비공개 운영용으로 넣은 것이고(`git 8e6db8d`), 이후 페이지를 공개 메뉴·사이트맵으로 올리면서 남았다.
- **제안**: 소유자 결정이 필요하다.
  - 권장안 A(공개): `page.tsx:271` 의 `<StudioGuard />` 렌더와 `:5` import 를 제거한다. `/tmkstudio` 는 유입 추적용 리다이렉트로 그대로 동작한다.
  - 대안 B(비공개 유지): 네비·커뮤니티·폼의 링크를 가드가 없는 `/studio/consulting` 으로 돌리고 `/studio` 는 noindex + 사이트맵 제외. 다만 이 경우 세일즈 페이지를 볼 방법이 비밀 링크뿐이다.
- **공수**: S

### studio-02 · P1 · bug · 마퀴 썸네일 24개 중 6개가 삭제된 영상

- **페이지**: /studio (CONTENTS 섹션)
- **근거**
  - `src/app/studio/_components/VideoMarquee.tsx:8, 12, 15, 19, 23, 27` 의 ID 6개(`l0IYxd-7mss`, `iIKbXHA3nJU`, `ZZ4_kNOd5Bg`, `76mUJQrKsSY`, `Y2s_QBuaZFk`, `D_dsbn0qFM4`)가 `i.ytimg.com/vi/<id>/hqdefault.jpg` 에서 404(1,097바이트 회색 플레이스홀더), YouTube oEmbed 도 404. 나머지 18개는 200 (2026-10-04 확인).
  - `shots/before-studio/studio-desktop-04.png`, `studio-mobile-06.png` 에 회색 "…" 카드가 보인다.
- **문제**: 6개 모두 "세계유명 골프정보" 영상이고 이 채널 7개 중 6개다. `VideoMarquee.tsx:97` 에서 3배로 복제하므로 72장 중 18장이 깨진 카드다. 클릭하면 재생할 수 없는 영상으로 간다. YouTube 는 404 응답에도 이미지 본문을 주기 때문에 `onError` 폴백(`:52-57`)이 작동하지 않는다. "실제 채널을 운영한 경험으로 증명합니다"라는 섹션에서 대표 채널 영상이 깨져 보인다.
- **제안**
  1. 6개 ID 를 같은 채널의 현재 공개 영상으로 교체하거나 삭제(목록은 소유자 확인).
  2. 방어 처리: `<img onLoad>` 에서 `naturalWidth <= 120`(YouTube 플레이스홀더는 120×90)이면 그 카드를 숨긴다.
  3. 로딩 중 배경색은 neutral-900 으로(studio-14 와 함께).
- **공수**: S

### studio-03 · P1 · bug · 상담 폼의 "(부가세 포함)" 라벨이 가격표와 반대

- **페이지**: /studio/consulting (3단계)
- **근거**: `src/app/studio/consulting/page.tsx:361` "(부가세 포함)" ↔ 같은 파일 `:20-22` 선택지 "부가세 별도", `src/app/studio/page.tsx:891` "부가세(VAT) 별도", `studio-content.json:81` "부가세 별도". `git 1710084`(8/20)에서 "포함"으로 넣었고 `2eb599e`(9/3)에서 별도로 되돌릴 때 이 라벨만 빠졌다.
- **문제**: 같은 질문 안에서 제목은 "부가세 포함", 선택지는 "부가세 별도"다. 월 350만원이 385만원인지 아닌지 문의 단계에서 혼선이 생긴다.
- **제안**: `:361` 의 괄호 문구를 "(부가세 별도)"로 고치거나, 선택지 설명에 이미 있으므로 삭제.
- **공수**: S

### studio-04 · P1 · bug · 방문 추적이 방문 1회당 11건 기록

- **페이지**: /studio
- **근거**
  - `page.tsx:253-261`: `SectionLabel` 안에 `<TrackVisit page="studio" />`. `SectionLabel` 은 11곳에서 렌더된다(`:352, 413, 436, 521, 545, 615, 650, 727, 758, 871, 915`).
  - `src/app/_components/TrackVisit.tsx:14` 에서 sessionStorage 를 확인하지만 기록은 응답 성공 뒤(`:24-27`)라 동시에 뜬 11개 effect 가 모두 통과한다.
  - 다른 메뉴는 한 번만 심는다: `incubating/page.tsx:46`, `trend-search/page.tsx:83`, `studio/class/consulting/page.tsx:25`, `community/layout.tsx:62`.
- **문제**: 세션 첫 방문마다 `/api/track` POST 가 11번 나가고 `page_visits` 에 `studio` 행이 11개 쌓인다. 메뉴 트래픽 대시보드(`src/lib/menuTraffic.ts:7`)에서 채널 대행만 약 11배로 보인다. 쿠키가 없어 홈으로 튕기는 방문자도 마운트 시점에 11건이 기록된다. 첫 로드에 불필요한 요청 11개와 서버 함수 호출 11회가 붙는다.
- **제안**: `TrackVisit` 를 `SectionLabel` 에서 빼고 `StudioPage` 루트(`page.tsx:272` 의 `AnimationObserver` 옆)에 1회만 렌더. 추적 로직은 바꾸지 않는다. 지금까지 쌓인 `studio` 수치는 11로 나눠 읽어야 한다는 점을 운영 메모로 남긴다.
- **공수**: S

### studio-05 · P1 · theme-violation · 레드 액센트 10곳, 에메랄드 0곳

- **페이지**: /studio
- **근거**
  - `page.tsx:287, 441, 509, 524, 547, 652, 741, 762, 876, 951` 에 `text-[#E5484D]` 10곳. 같은 파일에 `#00E5A0` 는 0건.
  - 앞뒤 화면은 에메랄드: 네비 `layout.tsx:343`, 폼 `consulting/page.tsx:83-85, 249, 258`.
  - `shots/before-studio/studio-desktop-04.png`(헤드라인), `studio-desktop-08.png`(후기 배지 5개와 직함), `studio-desktop-09.png`(가격 부제).
  - `git 67c2c4e`(8/14 오전)에 레드 도입. 같은 날 16:17 의 에메랄드 스윕 `c026103` 은 `studio/page.tsx` 를 포함하지 않았다.
- **문제**: 확정 규칙은 "액센트는 #00E5A0 하나, 레드 액센트는 시도 후 되돌림"인데 주력 세일즈 페이지에만 레드가 남아 있다. 동선에서 액센트가 에메랄드(네비) → 레드(/studio) → 에메랄드(폼)로 바뀐다. 한 화면에 강조가 많아(후기 배지 5개 전부 레드 등) 위계도 흐려진다.
- **제안**
  - 헤드라인의 색 강조(`:524, 547, 652`)는 규칙대로 회색 리드 + 화이트 두 톤만 쓰고 색을 뺀다.
  - 핵심 수치 2~3곳에만 `#00E5A0`: 히어로 "70만+"(`:287`), "연 매출 7억+"(`:509`), 가격 부제(`:876`) 중에서 고른다.
  - 후기 결과 배지(`:741`)는 화이트 텍스트 + neutral 보더, 직함(`:762`)은 neutral-400, 포트폴리오 "70만+"(`:441`)는 화이트 bold.
  - `:951` "마감임박"은 studio-14 참고.
  - 8/14 오전에 이 페이지에 레드를 일부러 넣었던 이력이 있으므로 적용 전 소유자 확인 1회를 권한다.
- **공수**: S

### studio-06 · P1 · conversion · 본문 대부분과 가격 섹션에 CTA 없음, 모바일 고정 CTA 없음

- **페이지**: /studio
- **근거**
  - CTA 위치: `page.tsx:307-312`(히어로), `:398-403`(PROBLEM 아래), `:947-972`(최종). 포트폴리오·마퀴·과정·차별점·비교표·후기·소개·가격·FAQ 에는 문의 버튼이 없다.
  - 데스크톱: PROBLEM CTA(y≈1,730px, `studio-desktop-02.png`) → 최종 CTA(y≈14,400px, `studio-desktop-10.png`), 약 12,700px. 모바일: y≈2,450px(`studio-mobile-03.png`) → y≈17,700px(`studio-mobile-17.png`), 전체 18,550px 중 약 15,000px.
  - `page.tsx`, `consulting/page.tsx` 에 `fixed`/`sticky` 요소 0건. 떠 있는 것은 전역 카카오 버튼뿐(`src/app/_components/KakaoChatButton.tsx:13`).
  - CTA 4개가 모두 `<a href>` 라 클릭 시 전체 새로고침(`page.tsx:307, 398, 947, 967`).
- **문제**: 가장 설득력 있는 구간(실측 데이터, 비교표, 후기, 가격)을 읽은 직후에 누를 버튼이 없다. 모바일에서는 화면 약 18장을 CTA 없이 내려가야 한다. 화면에 항상 떠 있는 유일한 행동 수단이 카카오톡이라 문의 폼 대신 채팅으로 빠진다.
- **제안**
  1. 모바일 전용 하단 고정 바: `fixed bottom-0 inset-x-0 md:hidden`, `bg-black border-t border-neutral-800`, 화이트 버튼 "채널 대행 문의하기" 하나, safe-area 패딩. 히어로 CTA 가 화면에서 사라지면 나타나고 최종 CTA 섹션이 보이면 숨긴다(IntersectionObserver 를 쓰는 작은 클라이언트 컴포넌트, `src/app/studio/_components/`).
  2. 카카오 버튼(56px, 우하단)과 겹치지 않게 바 오른쪽에 `pr-20` 여백을 둔다. 전역 컴포넌트는 건드리지 않는다.
  3. 비교표 아래와 가격 카드 안(studio-07)에 화이트 CTA 추가. 90일 성과 카드 아래에는 텍스트 링크형 보조 CTA.
  4. CTA 를 `next/link` 로 바꿔 폼을 프리패치.
- **공수**: M

### studio-07 · P1 · conversion · 가격 카드가 비어 보이고 조건·버튼이 없음

- **페이지**: /studio (PRICE 섹션)
- **근거**
  - `page.tsx:869-908`. 카드는 `mx-auto max-w-2xl`(`:879`), `min-h-[260px]`(`:882`), 내용은 패키지명 + 한 줄(`:885-888`) + 가격(`:890-896`)뿐이고 버튼이 없다.
  - 각주 "가격은 변동될 수 있으니 꼭 참고해주세요"(`:904-906`)는 `text-xs text-neutral-600`.
  - `shots/before-studio/studio-desktop-09.png`, `studio-mobile-15.png`.
  - `git e88509e`(9/3)에서 카드 3개를 단일 패키지로 줄이면서 카드 틀만 남았다.
- **문제**: 헤드라인은 "명확한 가격으로 안내합니다"인데 카드 안이 비어 있다. 월 발행량(롱폼 4 + 쇼츠 4)은 카드 밖 부제에 있고, 계약 단위·촬영 방식·출장비·소유권은 FAQ 를 열어야 보인다. 헤드라인은 왼쪽, 카드는 가운데, 각주는 다시 왼쪽이라 정렬 축이 세 번 바뀐다. 가격을 확인한 직후 누를 버튼이 없다. "가격은 변동될 수 있으니" 각주는 "명확한 가격" 약속과 어긋나고 대비도 2.69:1 이다.
- **제안**: 컨테이너 폭을 다 쓰는 카드 하나로 재구성(`md:grid-cols-[1fr_auto]`). 새 사실을 만들지 않고 이미 있는 문장만 옮긴다.
  - 왼쪽: 패키지명, "월 롱폼 4개 + 쇼츠(롱폼 리프레이밍) 4개", 포함 항목 6개(기획, 촬영, 편집, 업로드, 채널관리, 비블 디렉팅)를 맨 SVG 체크 목록으로, FAQ 에 있는 조건 3줄(계약 단위 6개월, 월 1회 촬영으로 4건 제작, 서울·경기 출장비 없음).
  - 오른쪽: "부가세(VAT) 별도" + ₩3,500,000/월 + 화이트 CTA "채널 대행 문의하기" + "야외·해외 촬영: 가격 협의".
  - 각주는 "채널 상황에 따라 구성을 조정해 제안드립니다"만 남기고 neutral-400 으로.
- **공수**: M

### studio-08 · P1 · mobile · 모바일 비교표에서 TMK STUDIO 열이 잘림

- **페이지**: /studio (DIFFERENCE 섹션)
- **근거**: `page.tsx:692-718`. `min-w-[640px]`(`:693`), 첫 열 `w-40`(`:696`). `shots/before-studio/studio-mobile-11.png`, `studio-mobile-12.png` 에서 세 번째 열이 "TMK ST", "총 70만 구", "비블 직접", "트래픽 →"로 잘려 보인다. 가로로 밀 수 있다는 표시가 없다.
- **문제**: 비교표에서 가장 중요한 우리 쪽 열이 모바일 첫 화면에 보이지 않는다. 보이는 것은 "항목"과 "일반 대행사" 열뿐이다.
- **제안**: `md` 미만에서는 표 대신 항목별 스택으로 그린다. 항목명(neutral-500 캡션) 아래 "일반 대행사"(neutral-500) / "TMK STUDIO"(화이트, font-medium) 두 줄. `md` 이상은 현재 표 유지. 같은 배열(`:702-709`)을 두 가지 마크업으로 렌더하면 된다. 표를 유지한다면 최소한 TMK 열을 두 번째로 옮기고 `min-w` 를 줄인다.
- **공수**: S

### studio-09 · P1 · mobile · 모바일 최종 CTA·헤드라인 단어 중간 끊김, 통계 2+1 줄바꿈

- **페이지**: /studio
- **근거**
  - `shots/before-studio/studio-mobile-16.png`: 최종 CTA 헤드라인이 "문의해/보세요.", "연락드립니/다."로 끊기고, 알약 링크가 "마감/임박 | 남기기/→" 두 줄로 접힌다. `studio-mobile-17.png`: "제안해드/립니다."
  - `studio-mobile-06.png`: CONTENTS 헤드라인 "경험으/로 증명합니다."
  - `studio-mobile-02.png`: 통계가 2개 + 1개로 떨어지고 헤어라인이 앞 두 칸 아래에만 그려진다.
  - `studio-mobile-01.png`: 히어로 버튼 2개가 폭이 다른 채 세로로 쌓인다.
  - 코드: `page.tsx:945`(`p-10`), `:947-954`(알약), `:957-964`, `:522-527`, `:306-319`, `StatsCounter.tsx:61`(`min-w-[160px]`), `:78`(`flex-wrap` + `divide-y`).
- **문제**: 모바일의 마지막 전환 블록에서 헤드라인이 음절 하나("다.")만 남기고 끊기고 알약이 깨져 보인다. 히어로 바로 아래 핵심 수치 3개도 정렬이 무너진다. 한글 단어 중간 줄바꿈은 전역 문제지만 이 페이지에서는 전환 지점에 걸려 있다.
- **제안**
  1. 이 페이지 h1·h2·리드 문단에 `break-keep` + `text-balance`.
  2. 최종 CTA 카드 `p-6 md:p-16`, 헤드라인 `text-2xl md:text-5xl`.
  3. 알약은 모바일에서 문구 하나만 남기거나 세로 스택(studio-14 에서 삭제하면 자동 해결).
  4. `StatsCounter` 는 모바일에서 `grid grid-cols-3` + 숫자 `text-2xl`(`min-w` 제거) 또는 세로 스택 + 전체 폭 구분선. `md` 이상은 현재 유지.
  5. 히어로 버튼은 모바일에서 `w-full text-center`.
- **공수**: S

### studio-10 · P1 · conversion · "채널 URL만" 약속과 폼의 실제 부담이 다름, 개인정보 안내 없음

- **페이지**: /studio, /studio/consulting
- **근거**
  - 약속: `page.tsx:321-323` "채널 URL만 보내주시면 됩니다", `:975-977` "채널 URL 하나면 OK", `consulting/layout.tsx:6` "채널 URL만 보내주시면 무료로 진단".
  - 실제: `consulting/page.tsx:149-161` 3단계에 필수 10개(유입 경로, 서비스, 성함, 연락처, 목적, 패키지, 현황, 고민, 지역, 운영 기간). 채널 URL 은 선택 항목이다(`:329-334`).
  - 서비스 선택지가 하나뿐인데 필수(`:9-11, 304-318`). `shots/before/studio-consulting-desktop-01.png` 에서 "다음"이 흐리게 잠겨 있다.
  - 같은 질문이 헤더와 라벨에 두 번(`:263-266`, `:289-291`).
  - 용어: 랜딩 CTA 는 "채널 대행 문의", 폼은 "상담 신청하기"(`:460`), "완전 무료"(`:466`), "상담 신청이 완료됐습니다!"(`:203`).
  - 개인정보 수집 안내·동의 문구 없음(파일 내 `개인정보|동의|privacy` 0건).
- **문제**: 버튼 아래 약속과 실제 폼이 달라 첫 화면에서 기대가 깨진다. 1단계에서 선택지가 하나뿐인 필수 질문을 눌러야 넘어가는데 왜 잠겨 있는지 표시가 없다. 첫 질문이 방문자에게 이득이 없는 유입 경로 조사다. 이름·전화번호·이메일을 받으면서 수집 목적과 처리방침 안내가 없다. "문의", "상담", "무료"가 섞여 유료 상품인 팀비블 1:1 컨설팅과도 헷갈린다.
- **제안**
  1. CTA 아래 문구를 사실대로: 예) "문의 양식 3단계 · 영업일 1~2일 내 연락"(폼 하단에 이미 있는 사실).
  2. 서비스 선택지가 1개일 때는 기본 선택해 두거나 질문을 숨긴다(전송 값은 동일).
  3. 유입 경로 질문을 마지막 단계 끝으로 옮긴다(필수 여부는 소유자 결정).
  4. 1단계 헤더의 중복 질문 문장 삭제.
  5. 폼 용어를 "문의"로 통일: "문의 보내기", "문의가 접수됐습니다".
  6. 마지막 단계 제출 버튼 위에 한 줄 고지와 `/privacy` 링크: "문의를 보내면 연락을 위한 개인정보(성함, 연락처, 이메일) 수집·이용에 동의하게 됩니다."
  - 8/15 에 질문지 4항목을 일부러 필수로 만든 이력(`git 34a46b6`)이 있으므로 필수 항목 수는 줄이지 않는다.
- **공수**: M

### studio-11 · P1 · interaction-feedback · 폼 검증·오류 안내·시맨틱 부족

- **페이지**: /studio/consulting
- **근거** (`src/app/studio/consulting/page.tsx`)
  - `<form>` 없음, 버튼 `onClick` 만 있음(`:442-462`). Enter 로 진행할 수 없고 브라우저 기본 검증과 자동완성이 작동하지 않는다.
  - `TextInput`(`:96-116`)과 textarea(`:381-431`)의 `label` 에 `htmlFor` 없음. input 에 `id`·`name`·`autoComplete`·`inputMode` 없음.
  - `RadioCard`(`:68-94`)는 `button` 인데 `role`·`aria-checked` 없음.
  - `canNext`(`:149-161`)는 값 유무만 본다. 전화번호·이메일 형식을 보지 않고 공백만 넣어도 통과한다. 잠긴 버튼은 `opacity-40` 뿐이고 이유를 알려 주지 않는다(`:453-454`).
  - 서버는 성함 50자, 연락처 30자, 메시지 2,000자 초과를 400 으로 거절하고(`src/app/api/studio/contact/route.ts:42-44`) 시간당 5회 제한이 있다(`:19-25`). 입력에는 `maxLength` 가 없고 모든 실패가 같은 문구다(`:185-188`).
  - 단계 전환과 완료 시 스크롤·포커스 이동이 없다(`:164-167, 195`).
  - 완료 화면: 체크 아이콘이 원형 테두리 안에 있고(`:198-202`), 카카오 링크가 `http://`(`:211`).
  - `shots/before/studio-consulting-mobile-01.png`: 카카오 플로팅 버튼이 "다음" 버튼 오른쪽 끝을 덮는다.
- **문제**: 연락처가 유일한 필수 연락 수단인데 오타를 거르지 못해 연락할 수 없는 문의가 생길 수 있다. 고민을 길게 쓴 사람은 2,000자 제한에 걸려도 "잠시 후 다시 시도"만 보고 같은 실패를 반복한다. 모바일에서 3단계 하단의 제출 버튼을 누르면 스크롤 위치가 유지돼 완료 문구 대신 화면 아래쪽이 보일 수 있다(코드상 판단, 실기기 확인 필요). 자동완성이 안 돼 모바일 입력 부담이 크다. 스크린리더는 라벨과 선택 상태를 읽지 못한다.
- **제안** (UI 계층만, API 변경 없음)
  1. 전체를 `<form onSubmit>` 으로 감싸고 "다음/신청"을 submit 버튼으로.
  2. `label htmlFor` + input `id`·`name`·`autoComplete`(name, tel, email, url)·`inputMode`.
  3. 선택 카드 그룹에 `role="radiogroup"`, 각 카드에 `role="radio"` + `aria-checked`. 선택 상태는 보더를 화이트로 올려 구분을 키운다.
  4. 버튼은 항상 누를 수 있게 두고, 눌렀을 때 비었거나 형식이 틀린 필드 아래에 한 줄 오류(레드, `aria-describedby`)를 띄우고 첫 오류로 포커스. 전화번호는 숫자 9자리 이상, 이메일은 입력했을 때만 형식 확인.
  5. 서버 제한에 맞춘 `maxLength`: 성함 50, 연락처 30, 텍스트 4항목은 합쳐 2,000자 안에 들도록(예: 현황 300, 고민 1,200, 지역 50, 기간 50). 고민 칸에 글자 수 표시.
  6. 응답 `status` 로 문구 구분: 429 는 "문의가 많아 잠시 뒤에 다시 보내 주세요", 400 은 입력 확인 안내.
  7. 단계 전환·완료 시 맨 위로 스크롤하고 제목으로 포커스. 오류 문구에 `role="alert"`.
  8. 완료 화면: 원형 테두리를 빼고 맨 체크 SVG, 카카오 링크 `https`, PROCESS 01 문장(기획 미팅)을 "다음 단계"로 한 줄 안내.
  9. 폼 화면에서 카카오 플로팅 버튼이 주 버튼을 덮는 문제는 전역 컴포넌트 담당 영역에 전달.
- **공수**: M

### studio-12 · P1 · performance · 첫 화면이 JS 실행 전까지 비어 있음

- **페이지**: /studio, /studio/consulting
- **근거**
  - `src/app/globals.css:88-102`: `[data-animate]{opacity:0}` 을 JS(`src/app/_components/AnimationObserver.tsx:13-16`)가 `in-view` 로 풀어 준다. 히어로의 배지·h1·설명·CTA·보조 문구가 전부 `data-animate` + 지연 60~500ms(`page.tsx:283-323`).
  - 프로덕션 HTML: 히어로 이미지가 `loading="lazy" sizes="100vw"`, srcset 3840w 까지(`page.tsx:329-334` 에 `priority`·`sizes` 없음). 표시 칸은 데스크톱 600px.
  - 프로덕션 HTML: 통계가 "0만+ / 0.0억회+ / 0억원+"(`StatsCounter.tsx:19, 41-42` 초기값 0).
  - `/studio/consulting` 프로덕션 HTML 에는 `BAILOUT_TO_CLIENT_SIDE_RENDERING` 과 빈 `<div class="min-h-screen bg-black">` 만 있다(`consulting/page.tsx:119-125, 133` 의 `useSearchParams`).
  - `globals.css` 에 `prefers-reduced-motion` 0건.
  - `.highlight-draw.in-view`(`globals.css:121`)는 해당 span(`page.tsx:298`)에 `in-view` 가 붙지 않아 동작하지 않는다.
  - `data-animate="left|right"` 는 `translateX(±40px)`(`globals.css:94-95`)인데 차별점·소개 섹션(`page.tsx:624-634, 839`)에는 overflow 처리가 없다.
  - 이 애니메이션 체계는 `/studio` 한 곳에서만 쓴다(`data-animate` 50건).
- **문제**: 정적 페이지인데 첫 화면의 글과 CTA 가 하이드레이션과 지연이 끝날 때까지 보이지 않는다. 느린 모바일에서는 수 초간 검은 화면이다. JS 가 실패하면 본문 전체가 투명한 채 남는다. 히어로 이미지는 지연 로딩이고 600px 칸에 1920w 이상 후보를 받는다. 하이드레이션 전과 크롤러·미리보기에는 핵심 수치가 0 으로 나온다. 문의 폼은 JS 로드 전까지 빈 검은 화면이다. 모션 줄이기 설정을 따르지 않는다. 모바일에서 `translateX(40px)` 요소가 화면 밖으로 24px 나가 초기 가로 스크롤이 생길 수 있다(코드상 판단, 실기기 확인 필요).
- **제안**
  1. 숨김 상태를 JS 준비 뒤에만 적용: `.anim-ready [data-animate]:not(.in-view)` 로 바꾸고, `AnimationObserver` 가 첫 화면 요소에 `in-view` 를 먼저 붙인 뒤 `html` 에 `anim-ready` 를 추가. 첫 화면은 HTML 그대로 바로 보이고 스크롤 아래만 애니메이션된다. 히어로의 `data-delay` 는 제거.
  2. 히어로 `Image` 에 `priority` + `sizes="(min-width: 768px) 50vw, 100vw"`. alt 는 "히어로 이미지" 대신 내용 설명으로.
  3. `StatsCounter` 초기 렌더를 최종값으로(SSR 에 70만+ 출력). 카운트업은 뷰 진입 시 JS 에서만 재생.
  4. `@media (prefers-reduced-motion: reduce)` 에서 `data-animate` 전환, 카운트업, 마퀴 자동 이동을 끈다.
  5. left/right 변형은 up 으로 통일하거나 해당 섹션에 `overflow-x-clip`.
  6. consulting: `useSearchParams` 를 읽는 부분만 작은 자식 컴포넌트로 분리해 `Suspense`(fallback null)로 감싼다. 폼 본체가 정적으로 프리렌더되고 프리필 동작은 같다.
  7. `highlight-draw` 는 삭제하거나 `data-animate` 와 같은 요소에 붙여 살린다(소유자 선택).
- **공수**: M

### studio-13 · P2 · performance · 영상 임베드·이미지·마퀴의 상시 비용

- **페이지**: /studio
- **근거**
  - `page.tsx:417-427`: YouTube iframe 이 `autoplay=1&mute=1&loop=1` 로 즉시 로드(`loading` 속성 없음, 프로덕션 HTML 확인). `shots/before-studio/studio-desktop-02.png`, `studio-mobile-03.png` 에서 포스터 없이 빈 검은 박스.
  - `page.tsx:635`: 차별점 이미지 4장 `unoptimized`. 실제 크기 2000×1333 446KB, 2000×1333 175KB, 1600×1067 183KB, 1600×1140 212KB(합 약 1.0MB).
  - `page.tsx:456, 843`: 채널 배너 `unoptimized`, URL 이 `w1280` 고정. 실측 38KB, 397KB(영어 키위새), 54KB, 30KB, 58KB, 33KB. 아바타는 `s240` 을 64px 로 표시(`:465, 847`).
  - `next.config.mjs` 는 이미 avif/webp 와 `yt3.googleusercontent.com` 을 허용한다.
  - `VideoMarquee.tsx:104-136`: rAF 루프 2개가 화면 밖에서도 계속 돌고 매 프레임 `track.scrollWidth` 를 읽는다(`:114`). `:97` 에서 3배 복제해 img 72개, 링크 72개.
  - 정지는 마우스 호버뿐(`:153-156`)인데 모바일에도 "마우스를 올리면 멈춥니다"가 나온다(`page.tsx:533-535`, `studio-mobile-06.png`).
  - OG 이미지 선언은 1200×630(`page.tsx:53-60`), 실제 파일은 1920×1440.
- **문제**: 세 번째 섹션의 영상 플레이어가 첫 로드와 경쟁한다. 본문 이미지 약 1.6MB 가 리사이즈·포맷 변환 없이 내려온다. 마퀴는 페이지가 열려 있는 내내 메인 스레드에서 레이아웃 읽기와 transform 쓰기를 반복한다. 터치·키보드 사용자는 멈출 방법이 없고 Tab 으로 중복 링크 72개를 지나야 한다.
- **제안**
  1. iframe 에 `loading="lazy"`(자동재생 유지). 또는 썸네일 포스터 + 클릭 시 재생.
  2. `unoptimized` 제거 + `sizes` 지정: 차별점 `(min-width: 768px) 50vw, 100vw`, 배너 `(min-width: 640px) 50vw, 100vw`. Vercel 이미지 최적화 사용량이 걱정되면 로컬 4장을 1200px WebP 로 미리 줄여 교체하고 배너 URL 의 `w1280` 을 `w800` 으로.
  3. 마퀴: IntersectionObserver 로 보일 때만 rAF 실행, `scrollWidth` 는 마운트·리사이즈 때만 측정, 복제본 2벌은 `aria-hidden` + `tabIndex={-1}`, 포커스·터치 시 정지. 안내 문구는 `md` 이상에서만.
  4. 차별점 스톡 사진(기계 설계 도면 사진 등, `studio-desktop-05.png`)은 교체할 때 실제 촬영·편집·분석 화면으로(자산은 소유자 제공).
  5. OG 이미지는 1200×630 으로 따로 제작.
- **공수**: M

### studio-14 · P2 · theme-violation · 금지 패턴 잔재

- **페이지**: /studio, /studio/consulting
- **근거**
  - 그라데이션: `page.tsx:636` `bg-gradient-to-r from-black/60 via-transparent to-transparent`.
  - 틸·컬러 면: `VideoMarquee.tsx:7-30` 의 `#134e4a`(teal-900), `#164e63`(cyan-900), `#14532d`, `#1e3a5f` 를 카드 배경(`:44`)과 채널 배지(`:73`)에 사용. `studio-mobile-06.png` 에 틸 카드가 보인다.
  - 원형 아이콘 배지: `VideoMarquee.tsx:63` `w-12 h-12 bg-red-600 rounded-full shadow-2xl`, `consulting/page.tsx:198-202` 원형 테두리 안 체크.
  - em-dash: 화면 노출 문구 `page.tsx:510, 668`, `consulting/page.tsx:259`. 메타 `page.tsx:58, 87`.
  - 상시 긴급 문구: `page.tsx:951` "이번달 신규 대행 마감임박"이 고정 텍스트(`studio-desktop-10.png`).
  - 이모지: `consulting/page.tsx:263`.
  - 미사용 코드: `page.tsx:137, 148, 159, 170, 181, 192` 의 `color: "from-…-900/80"`, `:199-250` 의 `FEATURES`·`REVIEWS`·`FAQS`. 화면은 `studio-content.json` 을 쓰고, 옛 FAQ 에는 "최소 3개월" 등 지금과 다른 내용이 남아 있다.
- **문제**: 소유자가 반복해서 제거한 패턴이 이 영역에 남아 있다. "마감임박"은 날짜와 무관하게 항상 표시돼 과장 금지 원칙과 어긋나고, 같은 블록에 CTA 가 두 개가 된다. 미사용 상수는 잘못된 쪽을 고치게 만드는 함정이다.
- **제안**: 그라데이션 오버레이는 삭제하거나 단색 `bg-black/20`. 마퀴 폴백 배경은 neutral-900, 채널 배지는 `bg-black/60` + 화이트 텍스트, 호버 재생 표시는 맨 SVG 삼각형. 완료 화면은 맨 체크 SVG. em-dash 는 쉼표·줄바꿈·가운뎃점으로. "마감임박" 알약은 실제 마감 기준이 없으면 삭제하고 CTA 를 버튼 하나로(사실이면 소유자가 수치 제공). 이모지 삭제. 미사용 상수와 `color` 필드 삭제.
- **공수**: S

### studio-15 · P2 · visual-consistency · 정렬 축·컨테이너 폭·대비 불일치

- **페이지**: /studio, /studio/consulting
- **근거**
  - `page.tsx:412`: INTERVIEW 만 `max-w-screen-lg` 라 섹션 라벨과 헤어라인이 x=224 에서 시작한다. 다른 섹션은 x=96(`studio-desktop-02.png`).
  - `:553`, `:919`: 과정·FAQ 목록이 `max-w-3xl` 왼쪽 정렬이라 1440 폭에서 오른쪽 약 40%가 빈다(`studio-desktop-05.png`, `studio-desktop-10.png`).
  - `:613-616`: STRENGTH 만 헤드라인 없이 라벨 뒤 바로 본문(`studio-desktop-05.png`).
  - "문제 01~03" 배지 카드가 PROBLEM(`:385-390`, 배지가 제목 오른쪽)과 DIFFERENCE(`:682-685`, 배지가 제목 위)에서 다르게 배치되고 같은 번호가 두 번 나온다.
  - `:731`: 후기 5개를 3열에 놓아 한 칸이 빈다(`studio-desktop-08.png`).
  - `:458-460`: 결과 배지가 배너 그림 위에 겹친다(`studio-desktop-03.png`, `studio-mobile-04.png` 의 스윔클래스·영어 키위새).
  - 대비: `text-neutral-600` on black 2.69:1(`page.tsx:321, 533, 904, 975`, `consulting/page.tsx:221, 240, 361, 465`). `text-neutral-500` on neutral-900 3.78:1(`page.tsx:470, 474, 488, 491, 504, 746`). 기준은 4.5:1.
  - `#process` 에 `scroll-mt` 없음. 모바일 네비가 2줄(약 121px)이라 히어로의 "어떻게 진행되나요?"로 이동하면 섹션 라벨이 네비에 가린다.
  - "₩" 는 Inter latin 서브셋(`layout.tsx:12`)에 없어 OS 글꼴로 대체돼 숫자와 굵기가 다르다(`studio-desktop-09.png`).
- **문제**: 섹션마다 왼쪽 기준선과 채움 정도가 달라 긴 페이지가 덜 정돈돼 보인다. CTA 보조 문구와 폼 안내처럼 읽혀야 하는 작은 글씨가 가장 흐리다.
- **제안**
  - 섹션 라벨은 항상 `max-w-screen-xl` 에 두고 영상만 안쪽에서 `max-w-screen-lg`.
  - PROCESS 와 FAQ 는 데스크톱에서 2단: 왼쪽에 헤드라인과 리드 문장(`md:sticky top-24`), 오른쪽에 목록. 빈 오른쪽을 채우고 스크롤도 줄어든다.
  - STRENGTH 에도 두 톤 헤드라인을 넣는다(문구는 소유자 제공 또는 차별점 4개 제목을 그대로 쓰는 형태).
  - 두 "문제" 카드의 배지 위치를 하나로 맞추고 DIFFERENCE 쪽 라벨은 "01" 텍스트 숫자만 쓴다.
  - 후기는 `lg` 에서 첫 줄 3 + 둘째 줄 2 를 채우는 6분할 그리드로.
  - 포트폴리오 결과 배지는 배너 밖 본문 줄로 옮긴다(예: 구독자 수 옆 또는 카테고리 칩 자리).
  - 작은 글씨는 `text-neutral-400` 이상으로. `#process` 에 `scroll-mt-32`.
  - 가격은 "월 350만원" 한글 표기 또는 "3,500,000원"으로 바꿔 ₩ 대체 글꼴 문제를 피한다(전역 글꼴 교체가 되면 불필요).
- **공수**: M

## 권장 진행 순서

1. **버그(각 S)**: studio-01 → studio-03 → studio-04 → studio-02
2. **규칙·모바일 마감(S)**: studio-05, studio-14, studio-08, studio-09
3. **전환(M)**: studio-07 → studio-06 → studio-10 → studio-11
4. **성능(M)**: studio-12 → studio-13
5. **정리(M)**: studio-15

## 범위 밖 참고 (다른 영역 담당에게 전달)

- 푸터 위 남색 띠가 이 영역에서도 보인다: `shots/before-studio/studio-desktop-10.png`, `studio-mobile-17.png`, `shots/before/studio-consulting-desktop-01.png`.
- 카카오 플로팅 버튼이 폼의 주 버튼과 겹친다: `shots/before/studio-consulting-mobile-01.png`. 전역 컴포넌트(`src/app/_components/KakaoChatButton.tsx`) 쪽에서 폼 화면 예외를 검토.
- `src/app/api/studio/contact/route.ts:47-62`: DB 저장이 실패해도 로그만 남기고 `ok` 를 돌려준다. 메일·슬랙 환경변수가 없으면 문의가 유실돼도 사용자에게는 완료로 보인다. UI 범위 밖이라 발견 목록에는 넣지 않았다. 별도 확인을 권한다.
- `src/app/studio/_components/DevEditor.tsx` 는 개발 환경 전용(`page.tsx:13-17`)이라 감사에서 제외했다. gray·teal 클래스를 쓰지만 방문자에게 노출되지 않는다.
