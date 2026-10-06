# class 영역 감사: 팀비블 1:1 컨설팅 상세 · 강의 상세 · 강의실

- 읽은 파일: `src/app/studio/class/{page.tsx, consulting/layout.tsx, consulting/page.tsx, [slug]/page.tsx, [slug]/_components/CourseEnrollButton.tsx}`, `src/app/studio/classroom/{page.tsx, [courseId]/page.tsx, [courseId]/actions.ts, [courseId]/_components/LessonPlayer.tsx}`, `src/lib/{courses.ts, auth.ts, trackVisit.ts, menuTraffic.ts}`, `src/app/_components/{TrackVisit,KakaoChatButton}.tsx`, `src/app/studio/_components/StudioGuard.tsx`, `src/app/layout.tsx`(네비·푸터), `src/app/api/{track,studio/enroll}/route.ts`, `src/app/{consulting,teambibl}/route.ts`, `src/app/{robots,sitemap}.ts`, `next.config.mjs`, `src/app/pricing/_components/FaqAccordion.tsx`
- 본 스크린샷: `shots/before/studio-class-consulting-desktop-01~14`, `studio-class-consulting-mobile-01~18`(모두), `studio-class-youtube-business-blackmap-desktop-01~02, mobile-01~03`, 원본 `public/studio/consulting/6.png, 7.png`(캡처가 잘린 하단 가격·목차 확인용)
- 읽기 전용 검증: 프로덕션 HTML(`curl https://bibllab.com/studio/class/consulting`)의 img·og 메타, `/_next/image` 7장 응답 형식·크기, `GET /studio/payment` 상태, 블랙맵 robots 메타, `sips` 원본 크기, PIL 메모리 픽셀 측정, `git log`(TrackVisit 삽입 커밋)
- 파일 생성·수정 없음(이 보고서 제외).

## 총평
컨설팅 상세(`/studio/class/consulting`)는 HTML 상단·하단 CTA 블록 사이에 1000px 폭 이미지 7장(합계 56,115px, 페이지 57,159px 의 98%)을 쌓은 구조다. 이미지 전송은 AVIF 변환과 지연 로딩으로 잘 되어 있고(7장 약 0.97MB), 블랙·화이트 톤과 이미지 속 섹션 라벨 패턴은 확정 테마와 맞는다. 그러나 구성·정원·가격·FAQ 같은 결정 정보가 전부 그림 속, 그것도 페이지 47~89% 지점에 있어 검색엔진·스크린리더에 없고 모바일에서는 카드 설명 약 9px, 수익 캡처는 판독 불가다. 데스크톱은 상단 버튼 이후 약 56,000px 동안 12px 밑줄 텍스트 외에 신청 수단이 없다. 보조 헤더의 "← 스튜디오"는 일반 방문자를 홈으로 튕기고, 모바일에서는 보조 헤더가 2줄 네비 뒤로 숨고 하단 고정 버튼은 카카오 버튼에 가린다. 강의 상세(블랙맵)와 강의실은 미완성 기능이 공개 URL 로 열려 있다: 수강 신청은 404, 영상 32개는 비어 있는데 수강생 342명·평점 4.8이 고정값으로 색인되고, 강의실은 수강권 필드를 읽지 못해 누구도 들어갈 수 없다. 공수 S 인 블랙맵 노출 정리, 모바일 겹침, 돌아가기 링크부터 처리하고, 이어서 HTML 요약 카드로 결정 정보를 앞으로 끌어오는 순서를 권한다.

완성도: 2 / 5

## 유지할 점
1. 이미지 전송 방식: next/image 가 AVIF 로 변환해 7장 합계 965KB(원본 PNG 10.3MB), 첫 장만 priority·preload·fetchpriority high, 나머지 loading="lazy" (`consulting/page.tsx:69-76`, 프로덕션 HTML·`/_next/image` 응답 확인). 이미지를 일부 HTML 로 옮겨도 남는 이미지는 이 방식 유지.
2. 모바일 하단 고정 신청 바(`consulting/page.tsx:94-103`): 화이트 버튼, `md:hidden`, 어느 위치에서도 신청 가능. 겹침만 고치고 유지.
3. 상세 이미지의 디자인 언어: 좌측 캡션 "비블의 1:1 유튜브 컨설팅" + 우측 영문 라벨(DIFFERENCE·STRATEGY·PROCESS·STRENGTH·REVIEW) + 헤어라인, 회색 리드 + 화이트 두 톤 헤드라인, 01~04 텍스트 숫자(desktop-03, -05, -06, mobile-10, -11, -16). 확정 섹션 헤더 규칙과 같으므로 HTML 전환 때 그대로 템플릿으로 쓴다.
4. 외부 결제로 넘어간다는 안내 "신청 페이지로 이동합니다"와 새 탭 + `rel="noopener noreferrer"`(`consulting/page.tsx:20-22, 62, 90`). 정직한 고지는 유지하고 대비만 올린다.
5. 강의 상세 템플릿은 이미 neutral 로 변환(neutral 35건, gray 0건)되어 있고 에메랄드는 배지·체크에만, 레드는 할인 표시에만 쓴다(`[slug]/page.tsx:60, 88, 158`). 시맨틱 색 사용은 규칙과 맞다.
6. 단축 주소 `/consulting`, `/teambibl` 이 서로 다른 키로 유입을 기록한 뒤 상세로 보내고, 옛 경로 `/studio/class/team-bibl` 은 영구 리다이렉트로 보존(`src/app/consulting/route.ts:7-13`, `src/app/teambibl/route.ts:4-10`, `next.config.mjs` redirects).
7. 데스크톱 보조 헤더의 뼈대(네비 바로 아래 sticky, 가운데 상품명, 오른쪽 신청): 데스크톱에서는 `top-14` 가 네비 57px 와 맞아 정상 동작한다(desktop-01).

## 발견 (중요도 순)

### class-01 · P1 · bug · 공수 S
**블랙맵 강의 상세: 수강 신청이 404, 영상 0개인데 BESTSELLER·342명·4.8점·할인이 고정값으로 공개·색인**
- 페이지: `/studio/class/youtube-business-blackmap` (프로덕션 200, `<meta name="robots" content="index, follow">`)
- 근거:
  - 신청 버튼 `CourseEnrollButton.tsx:42-48` → `router.push('/studio/payment?...')`. `src/app` 에 studio/payment 라우트 없음(결제 라우트는 `src/app/payment` 뿐). 프로덕션 `GET /studio/payment?courseSlug=...` → **404** 확인.
  - 영상: `courses.ts:163-236` 블랙맵 32개 강의 videoUrl 전부 `""`. 그런데 `[slug]/page.tsx:117-119, 128-130` 이 "미리보기" 배지와 "2개 강의 무료 미리보기 가능"을 보여 준다. 강의 행은 링크 없는 div 에 hover 배경만 있다(`:106-107`) → 눌러도 반응 없음.
  - 고정 수치: `courses.ts:138-147`(정가 490,000 → 297,000, BESTSELLER, enrollCount 342, rating 4.8), 렌더 `[slug]/page.tsx:59-73, 153-163`. "1년 무제한 재수강", "수료증 발급"은 `:178-183` 하드코딩, 저장소에 수료증 기능 없음(grep 결과 이 두 파일뿐).
  - 노출: `generateStaticParams`(`:12-16`)가 생성, `:31` 은 category 만 보고 `published` 는 확인하지 않음. `robots.ts:3-14` DISALLOW 에 /studio/class 없음. 내부 링크 0건(고아 페이지).
  - 화면: `studio-class-youtube-business-blackmap-desktop-01`(BESTSELLER, ★ 4.8 (342명 수강), 39% 할인, "297,000원로 수강 신청"), `-mobile-01~02`.
- 문제: 검색·공유로 들어온 사람은 할인가와 수강생 342명·평점 4.8을 보고 버튼을 눌러 404 를 만난다. 영상이 하나도 없는 상품에 확인할 수 없는 수치와 할인 표시가 붙어 있어 브랜드 신뢰를 깎는다. 버튼 문구 `${priceLabel}로`(`CourseEnrollButton.tsx:57`)는 "297,000원로"라는 조사 오류로 나온다.
- 제안 (소유자 결정 필요, 기본안은 비공개):
  1. 준비될 때까지 비공개: 상세 페이지에서 `!course.published` 면 `notFound()` 한 줄 추가, 블랙맵 `published: false`. 최소한 `generateMetadata` 에 `robots: { index: false }`.
  2. 공개를 유지해야 한다면 UI 만: 신청 버튼을 "준비 중" 비활성 표시 + 카카오 문의 텍스트 링크로, 실제 값이 아닌 평점·수강생 수·BESTSELLER·할인 표시는 렌더하지 않음, 미리보기 배지는 videoUrl 이 있는 강의에만.
  3. 버튼 문구는 "수강 신청하기"처럼 금액과 조사를 붙이지 않는 형태로.

### class-02 · P1 · content-clarity · 공수 M
**상세 본문 전체가 이미지 7장: 구성·정원·가격·FAQ 가 검색·스크린리더·모바일에서 읽히지 않는다**
- 페이지: `/studio/class/consulting`
- 근거:
  - 구조: HTML 은 상단 CTA 블록(약 330px)과 하단 CTA 블록뿐. 이미지 높이 8695+10132+7741+8637+7379+8465+5066 = 56,115px(1000px 폭, `sips`), 페이지 57,159px 의 98%(`consulting/page.tsx:14, 66-79`).
  - 대체 텍스트 "팀비블 1:1 유튜브 컨설팅 상세 1~7"(`:71`). 프로덕션 HTML 의 본문 텍스트는 h1 과 부제 한 문장(`:55-60`)뿐.
  - 결정 정보 위치: 구성 목록(매주 1회 30분 1:1 / VOD 100강 / 매월 오프라인 커뮤니티 / 24시간 핫라인 / VIP 초청)은 4.png 시작, 페이지 약 47% 지점(mobile-10 하단~mobile-11). 정원·대기("20명 제한, 평균 3개월 대기"), 결제("부가세 포함 월 49만원, 카드결제"), 가격 박스 ₩490,000/월은 6.png 끝, 약 89% 지점. 커리큘럼 목차는 그 뒤 7.png.
  - 모바일(390px, 0.39배): 이미지 본문 약 12~13px(mobile-12), 카드 설명 약 9px(mobile-14 "업종 구조 파악" 카드), 캡처 속 수치·라벨 판독 불가(mobile-05 채널 구독자 라벨·채널명, mobile-06 YouTube Studio ₩189,387,266 그래프, mobile-07 쇼핑몰·매출표). 데스크톱도 채널 그리드 캡처가 흐리다(desktop-09).
  - 이미지 속 밑줄 강조(mobile-11, -12, -16, -18 FAQ 답변)는 웹에서 링크처럼 보이지만 누를 수 없다.
- 문제: 결정에 필요한 정보(무엇을, 얼마에, 언제 시작)가 전부 그림 속 후반부에 있다. 검색엔진·스크린리더에는 상품 내용이 없고, 모바일 사용자는 핀치 줌 없이는 근거 자료(수익 캡처)를 읽지 못한다. FAQ 는 펼치거나 링크할 수 없다.
- 제안 (단계적, 문구는 이미지 속 기존 문장 재사용):
  1. 상단 CTA 블록을 요약 카드로: 6.png·4.png 의 기존 문장으로 사실 4~6줄(매주 1회, 30분간 비블 1:1 컨설팅 / 유튜브, 비즈니스 VOD 100강 / 매월 오프라인 유튜버 커뮤니티 / 20명 소수 정예, 평균 3개월 대기 / 부가세 포함 월 49만원, 카드결제) + 신청 버튼. 아래에 "구성 · 후기 · FAQ · 목차" 텍스트 점프 링크, 앵커는 이미지 경계(4.png 구성, 6.png 후기·FAQ·가격, 7.png 목차)에 둔다. 섹션은 이미지 경계와 정확히 맞는다(mobile-10 PROCESS, mobile-16 REVIEW 가 각 이미지 첫머리).
  2. 이미지마다 `<figure>` + `sr-only` 전사 텍스트, alt 는 한 줄 요약.
  3. 후속(L): FAQ·가격·목차부터 HTML 로. FAQ 는 강의 상세의 `<details>` 패턴(`[slug]/page.tsx:100-125`) 또는 `FaqAccordion` 에 items prop 을 추가해 재사용. 섹션 헤더는 이미지와 같은 캡션 + 영문 라벨(`tracking-[0.25em] font-black`) + 헤어라인.

### class-03 · P1 · mobile · 공수 S
**모바일: 하단 고정 신청 버튼을 카카오 버튼이 덮고, 보조 헤더는 2줄 네비 뒤로 숨는다**
- 페이지: `/studio/class/consulting`(모바일)
- 근거:
  - mobile-01(표시 좌표 y 약 1400~1510): 카카오 원형 버튼(`KakaoChatButton.tsx:13` fixed bottom-5 right-5 z-50, 56px)이 고정 바 화이트 버튼(`consulting/page.tsx:94-103`)의 오른쪽 끝 약 56px(버튼 폭의 15%)를 덮는다. 그 부분을 누르면 신청 대신 카카오가 열린다.
  - 보조 헤더 `sticky top-14 z-30`(`:36`). 모바일 네비는 1행 h-14 + 메뉴 2줄 행(`layout.tsx:302-303, 360-398`)으로 약 133px(mobile-01 측정), z-50. 붙는 위치 56~105px 가 통째로 네비 뒤에 가려진다. 데스크톱(네비 57px)에서만 정상.
- 문제: 모바일의 주 전환 버튼이 첫 화면부터 다른 버튼과 겹쳐 보이고 오른쪽 끝은 다른 곳으로 간다. 보조 헤더는 스크롤하면 사라져 sticky 가 의미 없다.
- 제안:
  - 겹침: 고정 바가 있는 페이지에서 카카오 버튼을 바 위로 올린다(body 의 data 속성 등으로 표시하고 KakaoChatButton 에서 `bottom-24`), 또는 고정 바에 오른쪽 여백 `pr-20` 을 줘서 버튼이 카카오 아래로 들어가지 않게. 같은 겹침이 `/studio/consulting` 폼에도 있으므로(studio 보고서) 전역에서 한 번에.
  - 보조 헤더: 모바일은 하단 고정 바가 신청을 맡으므로 `hidden md:block` 으로 숨기는 것이 가장 간단하다.

### class-04 · P1 · navigation-ia · 공수 S
**돌아가기·목록 링크가 이름과 다른 곳으로 간다(← 스튜디오는 홈으로 튕김, 강의 목록은 컨설팅 판매 페이지)**
- 페이지: `/studio/class/consulting`, `/studio/class/youtube-business-blackmap`, `/studio/classroom`
- 근거:
  - 컨설팅 보조 헤더 "← 스튜디오" → `/studio`(`consulting/page.tsx:38-40`). `/studio` 는 `StudioGuard` 가 studio_access 쿠키 없으면 `router.replace("/")`(`StudioGuard.tsx:9-16`). desktop-01, mobile-01 좌상단.
  - 강의 상세 "← 강의 목록" → `/studio/class`(`[slug]/page.tsx:50-52`) → 목록 없이 컨설팅 상세로 redirect(`class/page.tsx:4`). blackmap-desktop-01 좌상단.
  - 강의실 "← TMK STUDIO" → `/studio`(`classroom/page.tsx:32-34`), 빈 상태 "강의 보러가기" → `/studio/class` → 컨설팅 상세(`:50-55`).
- 문제: 상단 메뉴 주력 상품 페이지의 왼쪽 위 링크가 일반 방문자를 설명 없이 홈으로 보낸다. "강의 목록", "강의 보러가기"는 월 49만원 컨설팅 판매 페이지에 떨어진다.
- 제안: 컨설팅은 "← 스튜디오"를 없애고 왼쪽은 비우거나(상단 네비가 메뉴 역할) "비블랩"(→ /) 정도로. `/studio` 공개 여부가 정해지기 전에는(CONTEXT: 답 대기, 기본은 비밀 링크 유지) 공개 페이지에서 `/studio` 로 링크하지 않는다. 강의 목록 페이지가 없으므로 "← 강의 목록", "강의 보러가기"는 삭제하거나 "내 강의실"로 교체(class-01·class-06 결정과 함께).

### class-05 · P2 · conversion · 공수 S
**데스크톱 CTA 공백: 상단 버튼 다음 버튼까지 약 56,000px, 가격 박스 뒤로도 약 5,000px**
- 페이지: `/studio/class/consulting`(데스크톱)
- 근거: 상단 ApplyButton 은 y 약 285(desktop-01), 하단 ApplyButton 은 이미지 7장 뒤 y 약 56,600(`consulting/page.tsx:61, 89`). 그 사이 상시 보이는 신청 수단은 보조 헤더 오른쪽 `text-xs underline` "신청하기"(`:42-49`) 하나. 가격 박스(₩490,000/월)는 6.png 맨 끝(약 y 51,400), 그 뒤 7.png 목차 5,066px 를 지나야 버튼이 나온다. 모바일은 고정 바가 있어 괜찮지만 첫 화면에 상단 버튼과 고정 바가 동시에 보인다(mobile-01). 상·하단 부제는 같은 문장(`:58-60`, `:86-88`).
- 문제: 후반부에서 결정해도 바로 누를 버튼이 없고, 상시 링크는 12px 밑줄 글자라 눈에 띄지 않는다. 가격을 본 직후가 가장 중요한 순간인데 버튼은 화면 다섯 장 뒤에 있다.
- 제안: 보조 헤더 "신청하기"를 데스크톱에서 작은 화이트 버튼(`bg-white hover:bg-neutral-200 text-black font-bold text-xs px-3 py-1.5 rounded-lg` + ApplyButton 과 같은 화살표 SVG)으로. 6.png 와 7.png 사이(가격 바로 뒤)에 HTML CTA 블록 하나 삽입(같은 ApplyButton, 기존 문구 "1:1 팀비블과 시작하세요"). 선택: 모바일 고정 바는 상단 버튼이 화면에서 벗어난 뒤에 나타나게.

### class-06 · P2 · bug · 공수 M
**강의실이 수강권을 읽지 못한다: 등록된 수강생도 빈 강의실, 강의 페이지는 상세로 튕긴다**
- 페이지: `/studio/classroom`, `/studio/classroom/[courseId]`, `/studio/class/[slug]`
- 근거: `currentUser()` 반환값은 id·email·firstName·imageUrl·plan 뿐(`src/lib/auth.ts:21-27, 38-46`). 강의실·상세는 `(user as any).purchased_courses`, `lesson_progress` 를 읽는다(`classroom/page.tsx:21-22`, `classroom/[courseId]/page.tsx:35-41`, `[slug]/page.tsx:34-39`) → 항상 undefined → `[]`. 수강권은 `profiles.purchased_courses` 에 기록된다(`api/studio/enroll/route.ts:43-58`). `courses.ts:316` 주석 "Clerk publicMetadata" 는 Supabase 이전 때 끊긴 흔적.
  - 결과: `/studio/classroom` 은 항상 "아직 수강 중인 강의가 없습니다", `/studio/classroom/<slug>` 는 로그인해도 항상 `/studio/class/<slug>` 로 redirect(1on1-consulting 은 그 뒤 404), 상세의 "수강하기" 버튼은 나올 수 없다. LessonPlayer 는 누구도 볼 수 없다.
- 문제: 관리자가 수강권을 부여해도 수강생은 강의를 볼 수 없다. 지금은 결제 경로(class-01)도 막혀 드러나지 않을 뿐이다. 수강생이 한 명이라도 있으면 P0.
- 제안: DB 조회 로직이라 UI 범위 밖, 별도 작업으로 분리. 소유자가 (a) 강의·강의실을 당분간 닫을지(noindex·비노출, class-01 과 함께) (b) 살릴지 결정. 살린다면 profiles 의 두 필드를 읽는 서버 헬퍼를 따로 만들어 세 곳에서 사용(인증 로직 자체는 그대로).

### class-07 · P2 · bug · 공수 S
**TrackVisit 이 신청 버튼 안에 있어 컨설팅 방문이 두 번씩 기록된다**
- 페이지: `/studio/class/consulting` → 관리자 메뉴 트래픽 대시보드
- 근거: `<TrackVisit page="consulting-class" />` 가 ApplyButton 안(`consulting/page.tsx:25`), ApplyButton 은 두 번 렌더(`:61, :89`). TrackVisit 은 fetch 성공 뒤에야 sessionStorage 에 표시(`TrackVisit.tsx:19-31`)하므로 같은 커밋에서 연달아 실행되는 두 effect 가 모두 `/api/track` 을 보낸다 → 세션 첫 방문마다 page_visits 2행. 다른 메뉴 4곳은 한 번만 심었다(commit 6d0ad3b). 키는 `menuTraffic.ts:6`.
- 문제: 대시보드의 "팀비블 1:1 컨설팅" 방문 수가 다른 메뉴 대비 약 2배로 부풀어 메뉴별 비교가 틀어진다.
- 제안: TrackVisit 을 ApplyButton 에서 빼서 `<main>` 바로 아래에 한 번만(위치만 이동, 추적 로직 불변). 이미 쌓인 consulting-class 수치는 절반으로 읽어야 한다고 소유자에게 알린다.

### class-08 · P2 · performance · 공수 S
**이미지 크기 선언(1000×8000)이 실제와 달라 지연 로딩 때마다 페이지 높이가 수천 px 씩 바뀐다**
- 페이지: `/studio/class/consulting`
- 근거: 7장 모두 `width={1000} height={8000}`(`consulting/page.tsx:72-73`, 프로덕션 HTML 동일). 실제 높이 8695, 10132, 7741, 8637, 7379, 8465, 5066. 로드 전 1:8 비율로 자리를 잡았다가 로드 후 바뀌므로 장마다 +695, +2132, -259, +637, -621, +465, -2934px(데스크톱, 모바일은 0.39배). `sizes` 가 없어 srcset 이 1x/2x 밀도 방식이고 모바일 2x 기기는 w=2048 을 요청(원본이 1000px 이라 응답은 같은 파일).
- 문제: 스크롤바 길이와 위치가 로딩 중 계속 변하고, 스크롤바를 끌거나 End 키로 하단 CTA 로 가면 도착점이 밀린다. 화면 근처에서 이미지가 늦게 뜨면 아래 내용이 크게 이동한다.
- 제안: 이미지별 실제 높이 배열을 넘기거나 정적 import 로 크기를 자동으로 받는다. `sizes="(max-width: 1000px) 100vw, 1000px"` 추가. 선택: 페이지 전체 `"use client"`(`:1`)는 TrackVisit 때문이므로 TrackVisit 만 클라이언트로 두고 페이지는 서버 컴포넌트로.

### class-09 · P2 · typography · 공수 S
**첫 화면에 제목이 세 개이고, HTML h1 이 이미지 소제목보다 작다**
- 페이지: `/studio/class/consulting`
- 근거: desktop-01 한 화면에 보조 헤더 제목 "1:1 유튜브 컨설팅"(text-sm, `consulting/page.tsx:41`), h1 "팀비블 1:1 유튜브 컨설팅"(text-3xl 30px font-black, `:55`), 이미지 1 헤드라인 "유튜브를 통한 수익화 어떻게 해야 될까?"(약 80px). 이미지 본문은 데스크톱 약 32px 로 HTML 부제(text-sm 14px, `:58`)의 두 배 이상. 모바일도 h1 24px < 이미지 헤드라인 약 31px(mobile-01). 모바일 부제는 "비블이 1:1 / 로 함께합니다"로 끊긴다(mobile-01, break-keep 없음).
- 문제: 페이지의 진짜 h1 이 작은 머리말처럼 보이고 바로 아래 이미지가 다시 큰 제목으로 시작해 위계가 뒤집힌다. HTML 부분은 이미지가 쓰는 섹션 헤더 패턴을 쓰지 않아 한 페이지에 두 디자인이 섞인다.
- 제안: 보조 헤더 가운데 제목은 h1 과 중복이므로 생략(또는 스크롤 후에만 표시). 상단 블록은 class-02 의 요약 카드로 바꾸면서 이미지와 같은 패턴: 캡션 "비블의 1:1 유튜브 컨설팅" + 영문 라벨(예: TEAM BIBL, `tracking-[0.25em] font-black`) + 헤어라인, h1 font-black 두 톤. 하단 부제는 상단과 같은 문장이니 하나만 남기고, 블록에 `break-keep`.

### class-10 · P2 · theme-violation · 공수 S
**컨설팅 상세 HTML 부분의 gray 11건, 흰 그림자, 저대비 외부 이동 안내**
- 페이지: `/studio/class/consulting`
- 근거: `consulting/page.tsx` gray- 11건, neutral 0건(`:23, 36, 38, 46, 54, 58, 62, 86, 90, 94, 99` 의 border-gray-900, text-gray-400/600, hover:bg-gray-200, hover:text-gray-300). ApplyButton `shadow-lg shadow-white/10`(`:23`)은 검은 배경에서 흰 번짐(desktop-01 버튼 아래). "신청 페이지로 이동합니다" `text-xs text-gray-600`(`:62, :90`)은 검정 위 약 2.8:1.
- 문제: 쿨그레이 금지 위반(border-gray-900 은 청색기 도는 헤어라인), 글로우 계열 그림자. 외부 결제로 넘어간다는 중요한 고지가 페이지에서 가장 흐린 글자다.
- 제안: border-gray-900 → border-neutral-800, text-gray-400 → text-neutral-400, text-gray-600 → text-neutral-400(약 8.3:1, neutral-500 은 약 4.4:1 로 12px 에는 부족), hover:bg-gray-200 → hover:bg-neutral-200, hover:text-gray-300 → hover:text-neutral-300. shadow 두 클래스 삭제.

### class-11 · P2 · content-clarity · 공수 S
**공유 미리보기 이미지가 세로 8,695px 상세 이미지인데 1000×1000 으로 선언되어 있다**
- 페이지: `/studio/class/consulting`(카카오톡·SNS 공유)
- 근거: `consulting/layout.tsx:27-33, 42` og/twitter image = `/studio/consulting/1.png`, width 1000·height 1000(프로덕션 메타 동일). 실제 1000×8695, 2.7MB PNG. 사이트 기본 OG 는 1280×720(`public/og-image.png`).
- 문제: 미리보기는 가로형(약 1.91:1)이나 정사각으로 잘리는데 1:8.7 이미지는 어느 쪽이든 일부만 나온다(가운데 기준이면 desktop-04 의 말풍선 "조회수를 늘려야 한다" 부근). 선언 크기도 틀려 크롤러가 잘못 배치할 수 있다. 카카오 채널로 공유될 일이 많은 페이지다.
- 제안: 1200×630 전용 OG 이미지 한 장(이미지 1 첫머리 헤드라인 영역, 또는 검정 배경 + 흰 font-black 제목)과 실제 width/height. 당장은 사이트 기본 `og-image.png` 로 되돌리는 것만으로도 깨진 미리보기는 막는다.

### class-12 · P3 · theme-violation · 공수 M
**강의실·플레이어가 구 테마 그대로: gray 46건, teal 21건, 그라데이션, 이모지, 원형 배지, 틸 배경 버튼**
- 페이지: `/studio/classroom`, `/studio/classroom/[courseId]`
- 근거: `classroom/page.tsx` gray 13·teal 8, `LessonPlayer.tsx` gray 33·teal 13. 배경 bg-gray-950(`classroom/page.tsx:29`, `LessonPlayer.tsx:52`), 틸 배경 버튼 "강의 보러가기"(`classroom/page.tsx:52`)·"완료 표시"(`LessonPlayer.tsx:116-120`), 썸네일 자리 `bg-gradient-to-br from-gray-800 to-gray-900`(`classroom/page.tsx:69`), 이모지 📚(`:47, :70`)·🎉(`LessonPlayer.tsx:145`), 원형 체크 배지 `w-4 h-4 rounded-full`(`:177-181`), 진행 바·활성 강의 teal(`:66, 157, 171-175`).
- 문제: 확정 테마와 금지 패턴(틸·그라데이션·원형 배지·색 배경 버튼)이 한 화면에 모여 있다. 지금은 class-06 때문에 플레이어에 아무도 들어가지 못해 노출이 적다. 강의실을 살리기로 하면 P2 로 올린다.
- 제안: bg-gray-950 → bg-black, 카드 bg-neutral-900 / border-neutral-800, 텍스트 gray → 같은 단계 neutral. 진행 바 채움 #00E5A0(트랙 neutral-800). "강의 보러가기"·"완료 표시"는 화이트 버튼, 완료 상태는 에메랄드 텍스트 "완료" + 맨 체크 SVG. 원형 체크는 맨 SVG 체크로, 이모지·그라데이션 자리는 neutral-900 판 + 강의 제목 텍스트.

### class-13 · P3 · layout · 공수 M
**강의 플레이어가 전역 네비와 겹치고, 모바일에는 커리큘럼이 없다**
- 페이지: `/studio/classroom/[courseId]`
- 근거: 상단 바 `sticky top-0 z-40`(`LessonPlayer.tsx:54`) vs 전역 네비 `sticky top-0 z-50`·57px(`layout.tsx:302`) → 스크롤하면 목록 토글·진행률이 네비 뒤로 사라진다. 사이드바 `fixed top-12 bottom-0`(`:154`) → 위 9px 는 네비에, 첫 화면에서는 머리글 "커리큘럼 n/32 완료"가 상단 바 뒤에 가리고, 맨 아래에서는 푸터 오른쪽 320px 를 덮는다. 사이드바 `hidden md:flex` 인데 토글 버튼은 모바일에도 보인다(`:70-75`) → 눌러도 변화 없음. iframe 에 title 없음(`:86-91`). 빈 영상 문구가 관리자용 "관리자가 영상을 업로드하면 자동으로 표시됩니다"(`:96`).
- 문제: (class-06 해결 후) 수강생이 가장 오래 머무는 화면에서 조작 버튼이 사라지고, 모바일 수강생은 원하는 강의로 이동할 수 없다.
- 제안: 상단 바 `top-14`(네비 아래), 사이드바는 fixed 대신 sticky 컬럼 또는 top 을 네비+상단 바 높이에 맞춤. 모바일 토글은 영상 아래 커리큘럼 목록(`<details>`)을 펼치게. `iframe title={currentLesson.title}`. 빈 영상 문구는 "영상 준비 중입니다" 한 줄.

### class-14 · P3 · visual-consistency · 공수 M
**강의 상세 템플릿: 원형 배지·이모지, 비브랜드 노랑 버튼, 모바일에서 가격 카드가 맨 아래, em-dash·수치 불일치**
- 페이지: `/studio/class/[slug]`(현재 블랙맵만 해당)
- 근거: 강의 행 아이콘 `w-6 h-6 rounded-full` 원형 + 🔒(`[slug]/page.tsx:109-113`). 강사 사진 대신 "B" 원형 상자(`:137-139`, `public/studio/instructor.jpg` 가 있는데 미사용). 가격문의 버튼 `bg-yellow-500`(`CourseEnrollButton.tsx:34`, 카카오 브랜드색 #FEE500 아님, `http://` `:31`). 제목 굵기 제각각(h1 font-bold `:64`, 강의 소개 font-semibold `:78`, 커리큘럼 font-bold text-lg `:97`; 컨설팅 h1 은 font-black). 모바일은 가격·신청 카드가 커리큘럼·강사 소개 뒤 맨 아래(blackmap-mobile-02 하단). em-dash 노출("8주 완성 — …", "1주차 — …" 외 7개 주차 제목, `courses.ts:129, 161`, 메타 제목 `[slug]/page.tsx:23`). 강사 수치 24만·22만·8만·3.5만(`courses.ts:48`)이 컨설팅 이미지 25만·24만·8.5만·4.2만(desktop-02)과 다르다.
- 문제: 금지 패턴과 비브랜드 색이 남아 있고, 모바일에서는 가격과 버튼을 찾으려면 화면 두 장 넘게 내려야 한다. 같은 사람 소개 수치가 페이지마다 다르다.
- 제안: 행 아이콘은 맨 SVG(재생/자물쇠), 강사는 instructorImage 사진. 카카오 버튼 #FEE500 + https. 제목 스케일 통일(h2 text-lg font-black, 섹션 헤더 패턴). 모바일은 가격 카드를 제목 바로 아래로 올리거나 하단 고정 바. em-dash 는 쉼표·줄바꿈으로. 강사 수치는 INSTRUCTOR 한 곳에서 갱신. class-01 에서 비공개로 정하면 재공개 때 처리.

### class-15 · P3 · visual-consistency · 공수 L
**상세 이미지 속 리듬과 색: 400~600px 빈 여백, 빨강 강조·빨간 박스·사각 숫자 배지, 저해상도 캡처**
- 페이지: `/studio/class/consulting`
- 근거: 이미지에 굳은 빈 검정 구간 desktop-07(y 약 900~1320), desktop-08(y 약 200~580, 640~950), desktop-13(y 약 740~1330). 빨강 강조 "물론 성과를 보장할 수도 없죠"·"20명 소수 정예"·"이 채널에서만 7억원…"·"비블의 1:1 컨설팅은"(desktop-07, -08, -12, mobile-14), 빨간 테두리 박스·화살표·기울임 덧씌움(desktop-11, -12), 빨간 사각 숫자 배지 1·2·3(mobile-14), 목차의 빨간 [n회차] 라벨(7.png). 앞쪽 이미지(desktop-03~06)는 흑백 타이포 중심이라 중반부터 톤이 바뀐다. 채널 그리드 캡처는 업스케일된 저해상도(desktop-09, 채널명 둘 판독 불가). RECOMMEND 섹션의 반투명 회색 타원 4개(mobile-13)는 이미지 좌우 끝까지 닿아 4.png 의 7119~8476행 중 네 구간(각 약 222행)에서 가장자리 픽셀이 (18~26, 18~26, 18~26)이다(PIL 로 메모리에서 측정). 이미지가 1000px 로 가운데 놓이는 데스크톱에서는 타원이 x=220/1220 에서 잘린 세로 경계로 보인다(데스크톱 캡처 범위 밖이라 화면 확인은 못 했고 픽셀 값으로 확인).
- 문제: 사이트 액센트는 에메랄드 하나이고 레드 액센트는 시도 후 되돌렸는데, 상세 이미지에서는 레드가 주 강조색이다. 이미지 속 여백은 화면에 맞춰 줄지 않아 데스크톱에서 한 화면 가까운 빈 검정이 반복된다. 이미지라 코드로 고칠 수 없다.
- 제안: 다음 이미지 개정 때(또는 class-02 의 HTML 전환 때) 강조는 흰색 굵게 또는 에메랄드, 박스·배지는 텍스트 숫자 01~03 과 헤어라인으로. 섹션 간 여백은 한 값(예: 데스크톱 160px)으로 통일. 캡처는 원본 해상도로 다시 따거나 핵심 수치를 텍스트로.

## 참고 (이 영역 밖, 보고만)
- 프로덕션 HTML 에 `Kakao.init('')` 로 출력된다(`NEXT_PUBLIC_KAKAO_JS_KEY` 빈 값으로 빌드). 무결성 해시 문제(CONTEXT)와 별개로 카카오 SDK 초기화 키가 비어 있다. 전역 담당 확인 필요.
- 푸터 위 남색 띠가 블랙맵 화면에도 보인다(blackmap-desktop-02, mobile-03). CONTEXT 의 전역 원인과 같다.
