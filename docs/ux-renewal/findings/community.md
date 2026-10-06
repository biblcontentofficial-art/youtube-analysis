# community 영역 감사 보고서 (브랜드 인큐베이팅 · 커뮤니티 전체)

- 대상 파일: `src/app/incubating/page.tsx`, `src/app/community/` 전체(layout, page, _components, [board], [board]/[id] 와 하위 컴포넌트, write, ranking, about, admin 은 훑기만), `src/lib/community.ts`(타입·헬퍼)
- 대상 화면: `shots/before/incubating-desktop-01~07`, `incubating-mobile-01, 04, 07, 08`, `community-desktop-01`, `community-mobile-01~02` · `shots/before-auth/community-feed-top / feed-scrolled / post-detail / post-detail-bottom / write / write-bottom-footer / ranking / about.jpg`
- 방법: 코드 읽기 + 스크린샷 육안 확인 + 공개 페이지 `/incubating` 의 HTML 메타 확인(2026-10-06 curl GET, 읽기 전용). 저장소 파일은 수정하지 않았다. 로그인 모바일 캡처는 없어서 모바일 로그인 화면은 코드로 판단했다.
- 현재 완성도: 3 / 5

## 총평

커뮤니티는 확정 테마(블랙, neutral 카드, 에메랄드 한 색, 화이트 CTA)를 거의 그대로 지키고, 피드 카드, 탭, 서버 렌더 검색, 좋아요 롤백, 첨부 업로드 재시도 같은 기본기도 탄탄하다. 문제는 화면 틀에 몰려 있다. 장식 배너와 중복 헤더가 글 상세·글쓰기·랭킹의 첫 화면을 차지하고, 데스크톱에서는 지금 어느 게시판인지 표시가 없으며, 모바일에서는 22개 칩 한 줄 말고는 게시판을 옮길 수단이 없다. 글 상세는 본문 폭 약 960px, 줄마다 생기는 빈 줄, 높이 제한 없는 세로 이미지 때문에 읽기 품질이 떨어지고, 글쓰기는 사진 삽입 버튼이 숨어 있어 사용자가 첨부 상자로 우회한다. /incubating 은 본문 폭과 CTA 위계가 좋지만 첫 화면이 사진뿐이고 CTA 가 9,085px 페이지 끝에만 있으며, 검색·공유 메타가 깨져 있어(제목 중복, 설명이 이미지 경로로 시작, 공유 카드가 분석 도구 소개) 유입 단계에서 손해를 본다. 대부분 마크업·스타일 수준의 S~M 공수로 고칠 수 있다.

## 유지할 점

1. 확정 테마 준수. 커뮤니티 폴더 전체에서 gray·slate·teal·그라데이션·글로우·펄스가 0건이고 neutral 카드, 화이트 주 CTA, 에메랄드 한 색만 쓴다. 레드는 에러에만 쓴다(`LikeButton.tsx:143`, `PostForm.tsx:467`, `BlockEditor.tsx:419`). 예외는 community-14 의 두 곳뿐이다.
2. 피드 카드 구조. 카드 전체가 링크이고 호버 때 테두리만 밝아지며, 제목·미리보기 2줄 clamp, 아바타 + 등급 배지를 쓴다. (`src/app/community/_components/FeedCard.tsx:77-110`)
3. 검색. 자바스크립트 없이 동작하는 GET 폼, 검색어 강조·건수·검색 해제 줄, cat·sort 를 보존하는 링크, 공지 상단 고정과 본문 중복 제거. (`src/app/community/page.tsx:58-80, 91-100, 142-172`)
4. 상단 탭. 에메랄드 밑줄 하나와 `aria-current`, 글 상세·글쓰기에서도 커뮤니티 탭이 활성으로 유지된다. (`src/app/community/_components/CommunityTabs.tsx:25-33, 47-67`)
5. 글 상세 상단 구성. 게시판 이름 뒤로가기, 작성자·시각·조회 한 줄 메타, 권한자에게만 보이는 수정·삭제. (`src/app/community/[board]/[id]/page.tsx:159-207`)
6. 상호작용 안전장치. 좋아요 낙관적 업데이트와 실패 롤백·사유 안내, 삭제는 공용 ConfirmDialog, 댓글 글자 수 표시. (`LikeButton.tsx:77-108`, `CommentSection.tsx:108-112, 203-205`)
7. 글쓰기 실패 복구. 글이 만들어진 뒤 첨부가 실패하면 글을 다시 만들지 않고 실패한 첨부만 재시도하며, 진행 상태와 "저장된 글 보기"를 보여 준다. 게시판 설명도 폼에 노출한다. (`PostForm.tsx:143-210, 249-288, 342-344, 465-475`)
8. /incubating 의 읽기 폭(max-w-3xl, 본문 736px)과 화이트 주 CTA·보조 버튼 위계, 커뮤니티 글 하나로 두 화면을 갱신하는 구조와 ISR(revalidate 60, unstable_cache). 비회원 게이트의 원칙(제목·내용 미노출, 무료·소셜 가입 안내). 랭킹의 원형 배지 없는 텍스트 순위 숫자. (`src/app/incubating/page.tsx:15-29, 47, 83-96`, `CommunityGate.tsx:23-50`, `ranking/page.tsx:160-166`)

## 발견 목록 (중요한 순서)

### community-01 · P1 · layout · 공수 S
**본문·첨부 이미지와 영상에 높이 제한이 없어 세로 사진·휴대폰 캡처가 화면 한두 장을 덮는다**

- 페이지: `/community/[board]/[id]`, `/incubating`, `/community/write`
- 파일: `src/app/community/_components/PostContent.tsx`, `src/app/community/[board]/[id]/_components/AttachmentList.tsx`, `src/app/community/write/_components/BlockEditor.tsx`
- 근거: `PostContent.tsx:96-103`(img `my-6 w-full`), `:82-89`(video `w-full`) · `AttachmentList.tsx:26-32, 35-40` · `BlockEditor.tsx:284, 303-309` · `community-post-detail.jpg`, `community-post-detail-bottom.jpg`(IMG_6167.jpeg 휴대폰 캡처가 본문 폭 전체로 커져 캡처 속 글자가 본문 글자보다 2배 이상 크고, 한 장이 화면 두 장을 넘는다) · `incubating-desktop-01~05.png`(736x981, 736x1072 세로 사진 5장이 원본 높이로 그려져 사진 사이 글이 1~2문단씩 끊긴다)
- 문제: 세로 이미지는 폭에 비례해 높이가 커진다. 데스크톱 글 상세 본문 폭(약 964px)에서 1170x2532 휴대폰 캡처는 약 2,080px, 9:16 쇼츠 영상은 약 1,710px 높이가 된다. 읽는 흐름이 끊기고 이미지 속 글자가 지나치게 커진다. 에디터 미리보기도 같은 구조라 글을 쓰는 중에도 화면이 밀린다.
- 제안: 공용 렌더러에서 img 에 `mx-auto block h-auto w-auto max-w-full max-h-[70vh] rounded-2xl border border-neutral-800`, video 에 `mx-auto block w-auto max-w-full max-h-[70vh] bg-black` 를 준다(비율 유지, 가로 이미지는 지금처럼 폭을 채운다). 이미지는 `<a href={src} target="_blank" rel="noopener noreferrer">` 로 감싸 원본 보기를 제공한다(첨부는 기존 "원본 저장" 유지). 에디터 미리보기는 `max-h-80 w-auto`. /incubating 처럼 분위기 사진이 많은 공개 페이지는 PostContent 에 이미지 클래스 prop 을 열어 `aspect-[4/3] w-full object-cover` 로 잘라 보여 주는 선택지도 있다.

### community-02 · P1 · layout · 공수 M
**장식 배너와 중복 헤더가 글 상세·글쓰기·랭킹·소개의 첫 화면을 차지한다**

- 페이지: `/community`, `/community/[board]/[id]`, `/community/write`, `/community/ranking`, `/community/about`
- 파일: `src/app/community/layout.tsx`, `src/app/community/_components/CommunitySidebar.tsx`
- 근거: `layout.tsx:63-73`(배너가 레이아웃에 있어 모든 하위 화면에 렌더), `:76-83`(h1 "비블 커뮤니티" + 부제 + 새 포스트) · `CommunitySidebar.tsx:48-71`(같은 제목·부제·새 포스트를 다시 보여 줌) · `community-ranking.jpg`, `community-about.jpg`, `community-feed-top.jpg`(1080px 폭에서 배너 약 326px, 본문 시작 y≈540) · `community-post-detail.jpg`, `community-write.jpg`(본문을 보려고 스크롤한 상태라 탭이 잘려 있다)
- 문제: 1440px 폭에서 배너는 1248x393px 이고 네비·헤더·탭을 더하면 본문은 약 630px 아래에서 시작한다. 노트북(보이는 높이 약 800px)에서 글 상세는 뒤로가기와 제목까지만 보이고 본문은 첫 화면 밖이다. 글쓰기는 게시판 선택 칸까지만 보인다. "비블 커뮤니티 / 유튜브로 사업을 키우는 사람들의 공간 / 새 포스트"가 헤더와 사이드바 카드에 두 번 나온다. 레이아웃 h1 과 페이지 h1(글 제목, "글쓰기")이 겹쳐 한 화면에 h1 이 두 개다. 1080px 원본 배너가 1248px 로 늘어나 흐릿하다.
- 제안: 배너는 피드 첫 화면(`/community`, 1페이지)에서만 보이게 한다(작은 클라이언트 래퍼에서 usePathname 으로 판정하거나 route group 으로 분리). 하위 화면에서는 배너를 빼거나 `h-16 object-cover` 수준의 띠로 줄인다. 사이드바 정보 카드는 "멤버 1,409 · 글 132"와 오픈채팅 버튼만 남기고 제목·부제·새 포스트를 뺀다(헤더에 이미 있다). 하위 화면의 레이아웃 제목은 h1 대신 작은 텍스트로 둔다.

### community-03 · P1 · typography · 공수 S
**글 상세 본문 폭이 약 960px 로 넓고, 줄마다 빈 줄이 들어가 글이 듬성듬성하다**

- 페이지: `/community/[board]/[id]` (공용 렌더러를 쓰는 `/incubating` 포함)
- 파일: `src/app/community/[board]/[id]/page.tsx`, `src/app/community/_components/PostContent.tsx`, `src/app/community/write/_components/BlockEditor.tsx`
- 근거: `[id]/page.tsx:155-236`(폭 제한 없음. `layout.tsx:91-100` 의 main flex-1 = 1280-32-256-28 ≈ 964px) · `PostContent.tsx:63-71`(텍스트를 `whitespace-pre-wrap` p 하나로 그려 빈 줄이 leading-[1.85] 한 줄 높이로 남는다) · `BlockEditor.tsx:112`(Enter 로 만든 블록마다 `\n\n` 으로 이어 붙인다) · `community-post-detail.jpg`(짧은 문장 5줄이 줄마다 한 줄씩 비어 보인다) · `incubating-desktop-03.png`("검증해 / 왔습니다", "카테고 / 리로", "몫입니 / 다" 단어 중간 줄바꿈) · `community-post-detail-bottom.jpg`(댓글 아래에 목록으로 돌아가는 링크가 없다)
- 문제: 한 줄 60자 안팎이 되는 폭은 한국어 본문에 길다(권장 35~45자, 680~720px). 에디터에서 Enter 는 줄바꿈처럼 보이지만 결과물에서는 문단 사이 빈 줄(약 30px)이 돼, 짧은 문장을 줄마다 쓰는 커뮤니티 글이 모두 이중 간격으로 보인다. 본문에 break-keep 이 없어 데스크톱에서도 단어가 갈린다.
- 제안: 글 상세 전체(헤더·본문·첨부·좋아요·댓글)를 `mx-auto max-w-[720px]` 로 감싼다. PostContent 의 flush 에서 텍스트 덩어리를 빈 줄 기준으로 나눠 문단마다 `<p>` 를 만들고 `space-y-4`(16px) 간격을 준다. 저장 형식은 그대로 두고 렌더만 바꾸므로 기존 글도 함께 정리된다. article 에 `break-keep` 을 준다(링크는 이미 `break-all`). 댓글 아래에 상단 뒤로가기와 같은 주소로 "목록으로" 텍스트 링크를 하나 더 둔다.

### community-04 · P1 · interaction-feedback · 공수 M
**블록 에디터의 "+" 가 숨어 있어 글 중간에 사진·영상을 넣는 방법이 안 보인다 (터치 기기에서는 아예 보이지 않는다)**

- 페이지: `/community/write`
- 파일: `src/app/community/write/_components/BlockEditor.tsx`, `src/app/community/write/_components/PostForm.tsx`
- 근거: `BlockEditor.tsx:369`(`opacity-0 group-hover:opacity-100 focus-within:opacity-100`. focus-within 은 버튼 자신의 래퍼라 textarea 에 커서가 있어도 보이지 않는다. 설치된 Tailwind 4.1.18 은 hover 변형을 `@media (hover: hover)` 안에서만 만든다(`node_modules/tailwindcss/dist/lib.js`) → 터치 기기에서는 탭해도 opacity-0 그대로), `:356`(placeholder "왼쪽 + 로 사진·영상을 넣습니다"), `:228, 239`(유튜브·링크 입력은 브라우저 `prompt()`) · `PostForm.tsx:407-462`(별도 "파일 첨부" 상자, 사진·영상도 받는다) · `community-write.jpg`(본문 칸이 한 줄 입력창 높이이고 "+" 가 보이지 않는다) · `community-post-detail-bottom.jpg`(사진이 본문 중간이 아니라 글 끝에 "IMG_6167.jpeg · 146KB · 원본 저장" 캡션과 함께 붙어 있다)
- 문제: 터치 기기에는 hover 가 없어 "+" 가 끝까지 투명하다. 안내 문구는 보이지 않는 버튼을 가리킨다. 사용자는 눈에 보이는 "파일 선택"으로 사진을 올리고, 사진은 글 끝에 파일명과 함께 붙는다. 본문 칸이 한 줄 높이라 제목 칸과 구분이 약하다. `prompt()` 창은 다크 테마와 어긋나고 인앱 브라우저마다 모양이 다르다.
- 제안: 에디터 상자 아래(또는 위)에 항상 보이는 툴바 한 줄을 둔다: 사진·동영상 / 유튜브 / 링크 / 소제목 / 인용구 / 구분선(기존 BTN 스타일, 기존 핸들러 재사용, 마지막으로 포커스한 블록 뒤에 삽입). 블록 옆 "+" 는 데스크톱 보조 수단으로 남긴다. 본문 상자에 `min-h-[240px]`. placeholder 는 실제 동작대로 "Enter 는 문단 나누기, Shift+Enter 는 줄바꿈" 으로 고친다. 첨부 상자 제목을 "자료 파일 첨부"로 바꾸고 "글 중간에 사진을 넣으려면 위 툴바의 사진·동영상을 쓰세요" 한 줄을 더한다. 유튜브·링크는 툴바 아래 인라인 입력 줄(텍스트 필드 + 추가 버튼)로 받는다.

### community-05 · P1 · mobile · 공수 M
**모바일 게시판 탐색이 피드 상단 칩 한 줄뿐이고, 하위 화면에서는 게시판 이동과 오픈채팅 안내가 사라진다**

- 페이지: `/community`(모바일), `/community/[board]/[id]`, `/community/write`, `/community/ranking`
- 파일: `src/app/community/layout.tsx`, `src/app/community/page.tsx`, `src/app/community/_components/CategoryChips.tsx`, `src/app/community/_components/CommunitySidebar.tsx`
- 근거: `layout.tsx:92`(사이드바 `hidden lg:block`) · `page.tsx:112-121`(칩은 피드 페이지에만 있고 정렬 토글과 한 줄을 나눈다) · `CategoryChips.tsx:35-48`(그룹 없이 22개 칩 가로 스크롤, 스크롤바 숨김) · `CommunitySidebar.tsx:61-69`(오픈채팅 링크·참여코드는 사이드바에만 있다. grep 결과 로그인 사용자용 다른 노출 없음) · 로그인 모바일 캡처 없음(`before-auth/INDEX.md`), 코드로 판단
- 문제: 390px 폭에서 칩 영역은 약 280px 이라 "전체글"과 "유튜브 인큐베이팅 지원하세요!" 두 개만 보이고 나머지 20개는 옆으로 밀어야 나온다. 그룹(환영합니다·무료 자료·함께 성장해요·팀비블)이 사라져 원하는 게시판을 찾기 어렵다. 뒤쪽 칩을 누르면 페이지가 새로 그려지며 칩 줄이 처음으로 돌아가 활성 칩이 화면 밖에 있고, 피드에는 게시판 제목도 없다(community-06). 글 상세·글쓰기·랭킹에는 칩조차 없다. 멤버 수와 오픈채팅 참여코드는 모바일에서 볼 방법이 없다.
- 제안: lg 미만에서는 칩 줄 대신 "게시판: {현재 게시판}" 버튼 하나를 두고, 누르면 사이드바와 같은 groupBoards 순서의 그룹 목록(글 수·새 글 표시 포함)을 펼친다(`<details>` 또는 하단 시트). 이 버튼을 레이아웃의 탭 아래에 두면 모든 하위 화면에서 쓸 수 있다. 칩을 유지한다면 활성 칩을 `scrollIntoView({ inline: "center" })` 로 보이게 하고 그룹 순서를 지킨다. 오픈채팅 버튼(참여코드 표기)을 모바일 헤더의 보조 버튼이나 소개 탭에 노출한다.

### community-06 · P1 · navigation-ia · 공수 M
**데스크톱에서 지금 보고 있는 게시판이 어디에도 표시되지 않고, 긴 사이드바는 스크롤하면 사라진다**

- 페이지: `/community?cat=*`, `/community?sort=popular`
- 파일: `src/app/community/_components/CommunitySidebar.tsx`, `src/app/community/layout.tsx`, `src/app/community/page.tsx`
- 근거: `CommunitySidebar.tsx:24-25`(항목 스타일이 한 가지뿐), `:84-137`(활성 판정·aria-current 없음. 레이아웃은 searchParams 를 받지 못한다) · `page.tsx:110-140`(activeBoard 를 제목으로 그리지 않는다. 활성 표시가 있는 칩은 `lg:hidden`, 113행) · `community-feed-top.jpg`(전체글보기 상태인데 사이드바 어느 항목도 강조되지 않고, "최신 인기" 토글과 검색창이 두 줄로 떨어져 있다) · `community-feed-scrolled.jpg`(사이드바가 끝난 뒤 왼쪽 열이 비어 있다) · `src/app/community` 아래 `loading.tsx` 없음(find 결과)
- 문제: 사이드바에서 "매일 유튜브 챌린지"를 눌러도 화면 위쪽은 그대로이고 카드 메타의 작은 회색 글씨에만 게시판 이름이 나온다. 게시판 설명(board.description)도 피드에 없다. 사이드바는 22개 게시판과 즐겨찾기 2개, 그룹마다 굵은 소제목과 위아래 구분선 두 줄이 있어 메뉴 카드만 1,000px 이 넘고 고정되지 않는다. force-dynamic 서버 렌더를 기다리는 동안 아무 표시가 없어 클릭이 먹었는지 알 수 없다.
- 제안: 피드 상단에 툴바 한 줄을 만든다. 왼쪽은 현재 게시판 이름(h2, font-bold, 없으면 "전체글") + 글 수 + 설명 한 줄, 오른쪽은 검색창과 최신·인기 토글. 사이드바 링크를 작은 클라이언트 컴포넌트로 빼서 useSearchParams 로 활성 항목에 `bg-white/[0.06] font-semibold text-white` + `aria-current="page"` 를 준다. 메뉴 카드에 `lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto` 를 주고 그룹 소제목 아래 구분선은 하나만 남긴다(일부 회원만 쓰는 팀비블 그룹은 `<details>` 로 접는 선택지). `src/app/community/loading.tsx` 에 neutral-900 카드 3~4개짜리 스켈레톤을 둔다.

### community-07 · P1 · bug · 공수 S
**/incubating 의 검색·공유 메타가 깨져 있다 (제목 중복, 설명이 이미지 경로로 시작, 공유 카드가 분석 도구 소개)**

- 페이지: `/incubating`
- 파일: `src/app/incubating/page.tsx`, `src/lib/community.ts`
- 근거: `incubating/page.tsx:34`(title 에 " | 비블랩 (bibl lab)" 를 직접 붙임) + `src/app/layout.tsx:16-18`(template "%s | 비블랩 (bibl lab)") → 실제 `<title>브랜드 인큐베이팅 | 비블랩 (bibl lab) | 비블랩 (bibl lab)</title>`(manifest.json 도 같다) · `:35-36`(`excerpt(post.content, 160)`) → 실제 `<meta name="description" content="/community-images/pin-incubating-1.jpg 영어·수학 교육 쪽에…">` · openGraph 미지정 → 실제 og:title "비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구", og:description "…키워드 트렌드 분석, 채널 찾기, 영상 수집…", og:url "https://bibllab.com"(2026-10-06 curl 확인)
- 문제: 브라우저 탭과 검색 결과 제목에 사이트 이름이 두 번 나오고, 검색 결과 설명은 이미지 파일 경로로 시작한다. 카카오톡·SNS 로 인큐베이팅 링크를 보내면 미리보기 카드에 "유튜브 키워드·채널 분석 도구"가 뜨고 주소도 홈으로 표시돼, 선생님 대상 모집 링크가 전혀 다른 서비스처럼 보인다.
- 제안: `title: "브랜드 인큐베이팅"` 으로 줄인다. description 은 이미지·영상·유튜브 줄과 `## `·`> `·`---` 표시를 뺀 뒤 요약한다(community-10 의 표시용 정리 함수를 같이 쓴다). `openGraph: { title: "유튜브 브랜드 인큐베이팅 지원하세요", description, url: "/incubating", images: ["/community-images/pin-incubating-1.jpg"] }` 와 같은 값의 twitter 메타를 지정한다(1200x630 전용 이미지를 두면 더 좋다). revalidate·unstable_cache 구조는 그대로 둔다.

### community-08 · P1 · conversion · 공수 S
**/incubating 첫 화면이 사진뿐이고, 지원 CTA 는 9,085px 페이지 끝에만 있으며 바로 위 본문과 같은 문단을 반복한다**

- 페이지: `/incubating`
- 파일: `src/app/incubating/page.tsx`
- 근거: `incubating-desktop-01.png`(첫 화면 = 태그·제목·세로 사진, 본문 첫 문장은 y≈1270) · `incubating-mobile-01.png`(모바일도 첫 화면이 사진) · `manifest.json`(데스크톱 높이 9,085px, 모바일 7,992px) · `page.tsx:74-104`(CTA 카드는 본문 뒤 한 곳) · `incubating-desktop-06.png`, `incubating-mobile-07.png`(본문 "지원 방법" 문단·오픈채팅 주소·메일 바로 아래 CTA 카드가 같은 문단을 다시 보여 준다) · `page.tsx:91-96`(메일 주소 자체가 버튼 라벨), `:97-102`("비블 커뮤니티" 버튼은 비회원에게 회원 전용 게이트로 이어진다)
- 문제: 상단 메뉴 첫 항목인데 첫 화면에서 무엇을 모집하는지(채널 기획·제작을 맡고 수익을 나누는 구조)가 보이지 않는다. 지원하려면 세로 사진 5장을 지나 끝까지 내려가야 한다. 끝에서는 같은 안내가 두 번 연달아 나오고, 버튼 세 개 중 하나는 지원과 무관한 커뮤니티 이동이라 선택이 흐려진다.
- 제안: h1 아래에 화이트 버튼 "지원하기"(`href="#apply"`) 하나를 두고, 원글에서 첫 이미지를 두 번째 문단 뒤로 옮기도록 소유자에게 안내한다(본문은 커뮤니티 글이므로 글 수정으로 해결). CTA 카드에 `id="apply"` 와 `scroll-mt-20` 을 주고, 카드 안 설명 문단은 본문 "지원 방법"과 겹치므로 뺀다(문장 삭제만). 메일 버튼은 "메일로 지원하기"로 하고 주소는 버튼 아래 작은 텍스트로 둔다. "비블 커뮤니티"는 카드 밖 텍스트 링크로 내린다. 모바일은 하단 고정 바(검정 배경 + 화이트 "오픈채팅으로 지원하기")를 두는 선택지도 있다.

### community-09 · P1 · navigation-ia · 공수 S
**커뮤니티 안의 "/studio" 링크 두 곳이 회원을 홈으로 튕기고, "브랜드 인큐베이팅" 탭은 커뮤니티 틀 밖으로 나간다**

- 페이지: `/community`(사이드바·모바일 칩), `/community/about`, 커뮤니티 탭 전체
- 파일: `src/lib/community.ts`, `src/app/community/about/page.tsx`, `src/app/community/_components/CommunityTabs.tsx`, `src/app/community/_components/CategoryChips.tsx`, `src/app/community/_components/CommunitySidebar.tsx`
- 근거: `community.ts:165-168`(`agency: "/studio"` 오버라이드) → `CommunitySidebar.tsx:107-116`, `CategoryChips.tsx:42` · `about/page.tsx:96-101`("유튜브 채널 대행 문의" → /studio) · `src/app/studio/_components/StudioGuard.tsx:9-16`(studio_access 쿠키가 없으면 `router.replace("/")`) · `community-feed-top.jpg`(사이드바 "유튜브 채널 대행 문의"), `community-about.jpg`(하단 CTA) · `CommunityTabs.tsx:40`(탭 "브랜드 인큐베이팅" → /incubating, 커뮤니티 레이아웃 밖) · studio 보고서와 같은 근본 원인
- 문제: 회원이 사이드바나 소개 탭에서 대행 문의를 누르면 설명 없이 홈으로 이동한다. 인큐베이팅 탭을 누르면 탭·사이드바·배너가 모두 사라진 다른 화면으로 바뀌어 같은 줄의 다른 탭과 동작이 다르다. 인큐베이팅 진입점이 커뮤니티 안에만 3개(탭, 사이드바 노란 메뉴 = 게시판, 전역 네비)이고 목적지가 둘로 갈린다.
- 제안: /studio 공개 여부 결정(studio 보고서)을 따른다. 결정 전까지는 대행 문의 링크를 가드가 없는 문의 경로(studio 보고서 대안 B 의 `/studio/consulting`)로 돌리거나 숨긴다. 인큐베이팅 탭은 전역 네비에 이미 있으므로 탭에서 빼고, 커뮤니티 안의 진입은 사이드바 게시판 하나로 정리한다. 탭을 남긴다면 맨 끝에 두고 바깥 페이지로 간다는 표시(↗)를 붙인다.

### community-10 · P2 · bug · 공수 S
**피드 카드 미리보기에 본문 표기(이미지 경로·##·>·---)가 그대로 나오고, 카드 메타·반응 줄이 훑어보기에 비효율적이다**

- 페이지: `/community`
- 파일: `src/app/community/_components/FeedCard.tsx`, `src/lib/community.ts`
- 근거: `FeedCard.tsx:106-110`(`excerpt(post.content, 140)`), `community.ts:404-407`(excerpt 는 공백만 접는다), `src/lib/communityDb.ts:466` listFeed `select("*, …")`(본문 전체 사용) · 같은 함수로 만든 /incubating 메타 설명이 "/community-images/pin-incubating-1.jpg 영어·수학…"으로 시작(curl 확인) → 같은 글의 피드 카드도 이미지 경로로 시작한다 · `FeedCard.tsx:93-97` + `community-feed-top.jpg`("비블 bibl 비블 bibl 칼럼 · 2일 전"처럼 작성자와 게시판 이름이 같은 회색 줄에 붙는다) · `FeedCard.tsx:113-126`(대부분 0 인 반응 수가 카드마다 한 줄을 쓴다. `community-feed-scrolled.jpg`)
- 문제: 에디터로 사진을 넣은 글은 미리보기 140자의 절반 이상이 `/api/community/image?p=…` 같은 경로가 된다. 운영 글이 대부분이라 작성자 칸은 거의 같은 값이고, 게시판 이름은 시간과 같은 색이라 구분되지 않는다. 카드 높이 약 150~170px 중 반응 줄이 약 28px 를 차지해 한 화면에 들어오는 카드 수가 줄어든다.
- 제안: 카드 표시용 정리 함수를 둔다. 이미지·영상·유튜브 한 줄은 빼고 `## `·`> ` 접두어와 `---` 줄을 지운 뒤 excerpt 한다(검색·저장 로직은 그대로). 본문에 이미지가 있으면 첫 이미지를 카드 오른쪽 72px 정사각 썸네일(`object-cover rounded-lg border border-neutral-800`)로 보여 준다. 메타 줄은 "작성자 · 시간"과 게시판 이름(`text-neutral-400`)을 분리하고, 반응 수는 메타 줄 오른쪽 끝으로 올려 카드당 한 줄을 줄인다(0 표시는 유지).

### community-11 · P2 · layout · 공수 M
**글쓰기: 게시판이 목록 첫 항목으로 자동 선택되고, 배너·사이드바가 그대로 있어 실수로 이동하면 작성 내용을 잃는다**

- 페이지: `/community/write`
- 파일: `src/app/community/write/page.tsx`, `src/app/community/write/_components/PostForm.tsx`, `src/app/community/layout.tsx`
- 근거: `write/page.tsx:119-120`(`|| writable[0].slug`) · `community-write.jpg`(운영자 기준 기본값이 "유튜브 인큐베이팅 지원하세요!") · `PostForm.tsx:219`(빈 게시판 검증 문구는 이미 있다) · `layout.tsx:91-101`(글쓰기도 배너·사이드바 링크 24개·새 포스트 버튼과 함께 렌더) · `PostForm.tsx:478-492`(등록 버튼은 긴 본문 맨 아래), `:413`(확장자 28개를 그대로 나열. `community-write.jpg`), `:309-314`(상단 "커뮤니티" 링크가 화살표 없이 라벨처럼 보인다)
- 문제: 게시판을 확인하지 않고 쓰면 엉뚱한 게시판에 글이 올라간다. 작성 중 바로 옆 사이드바 링크를 누르면 확인 없이 내용이 사라진다. 긴 글은 등록 버튼을 찾으려고 끝까지 내려가야 한다.
- 제안: `?board=` 가 없으면 빈 값으로 시작하고 select 첫 줄에 "게시판을 선택하세요"(disabled) 옵션을 둔다. 글쓰기 화면에서는 배너·사이드바·헤더의 새 포스트 버튼을 숨기고 폼을 `mx-auto max-w-[720px]` 로 가운데 정렬한다(집중 모드). 등록·취소 줄은 `sticky bottom-0 border-t border-neutral-800 bg-black/95 py-3` 로 고정한다. 확장자 목록은 "문서·이미지·영상·압축 파일, 파일당 최대 50MB"로 줄이고 전체 목록은 `<details>` 로 접는다. 상단 "커뮤니티" 링크에 글 상세와 같은 왼쪽 화살표를 붙인다.

### community-12 · P2 · interaction-feedback · 공수 S
**댓글: 오류가 회색 글씨로 묻히고, 답글 입력창 위치·포커스와 버튼 터치 영역이 불편하다**

- 페이지: `/community/[board]/[id]`
- 파일: `src/app/community/[board]/[id]/_components/CommentSection.tsx`, `src/app/community/[board]/[id]/_components/PostActions.tsx`
- 근거: `CommentSection.tsx:228`(`text-xs text-neutral-400` 오류, role 없음), `PostActions.tsx:69`(같음) vs `LikeButton.tsx:143`(`text-red-400`, `role="status"`) · `CommentSection.tsx:152-175`(답글·삭제 버튼이 text-xs 에 패딩 없음, 높이 약 16px, 간격 8px) · `:241-283`(답글 입력이 기존 답글 목록 위에 열리고 autoFocus 없음) · `:178-180`(댓글 속 주소는 링크가 안 된다. 본문은 PostContent linkify 로 링크된다) · `:137-151`(글쓴이 댓글 구분 없음) · `community-post-detail-bottom.jpg`
- 문제: 등록 실패 문구가 도움말과 같은 색이라 실패를 알아채기 어렵다. 답글을 누르면 입력창이 기존 답글들 위에 생기고 커서는 들어가지 않는다. 휴대폰에서 답글과 삭제가 작은 글자로 붙어 있어 잘못 누르기 쉽다.
- 제안: 오류는 `text-red-400` + `role="alert"` 로 LikeButton 과 맞춘다. 답글 입력을 대댓글 목록 아래로 옮기고 textarea 에 `autoFocus`. 답글·삭제 버튼에 `rounded-lg px-2 py-1.5 -my-1.5 hover:bg-white/[0.04]` 로 터치 영역을 키우고 간격을 넓힌다. 글 작성자 id 를 넘겨 해당 댓글 이름 옆에 `rounded border border-neutral-700 px-1.5 text-[10px] text-neutral-400` "작성자" 라벨을 붙인다. 댓글 본문에 PostContent 의 linkify 를 재사용한다.

### community-13 · P2 · conversion · 공수 S
**비회원 게이트: 누를 수 없는 카테고리 칩 22개가 화면을 채우고, 사회적 증거와 오픈채팅 참여코드가 빠져 있다**

- 페이지: `/community` 와 모든 하위 경로(비로그인)
- 파일: `src/app/community/_components/CommunityGate.tsx`, `src/app/community/layout.tsx`
- 근거: `CommunityGate.tsx:62-76`(게시판 이름 22개를 테두리 있는 알약 모양 span 으로 나열) · `community-desktop-01.png`(6줄), `community-mobile-01~02.png`(모바일 약 480px, 화면 반 장 이상) · `layout.tsx:34-53`(멤버·글 수 조회를 이미 시작하지만 게이트 분기에서 버린다. 사이드바 기준 멤버 1,409·글 132) · `CommunityGate.tsx:84`(참여코드 230000 이 `title` 툴팁에만 있어 터치 기기에서 보이지 않는다) · `community-mobile-01.png`(h1 "있습니 / 다", 본문 "끝 / 납니다" 단어 중간 줄바꿈) · 두 버튼 모두 `/sign-in?next=` 로 가지만 로그인 화면이 next 를 읽지 않는다(auth-01)
- 문제: 칩은 버튼처럼 생겼지만 눌러도 반응이 없다. 내부용 게시판(과제제출방, 미팅예약)까지 나와 길이만 늘고 설득력은 약하다. 이미 1,400명이 넘는 멤버가 있다는 사실이 가입 판단의 가장 강한 근거인데 보이지 않는다. 모바일 방문자는 오픈채팅에 들어가도 참여코드를 모른다.
- 제안: 칩 목록을 그룹 4줄의 텍스트 목록으로 바꾼다(그룹명 font-bold + 대표 게시판 2~3개 `text-neutral-400`, 테두리·알약 제거). CTA 위에 "멤버 1,409명 · 글 132개" 한 줄을 둔다(레이아웃에서 이미 조회한 stats 를 props 로 전달, 새 조회 없음). 오픈채팅 문장 끝에 "(참여코드 230000)"을 텍스트로 보인다. h1·본문에 `break-keep`. 로그인 후 복귀는 auth-01 수정에 맡긴다.

### community-14 · P2 · theme-violation · 공수 S
**사이드바의 노란 강조 메뉴와 빨간 원형 "N" 배지가 확정 팔레트와 금지 패턴을 벗어난다**

- 페이지: `/community` 전체(데스크톱 사이드바, 모바일 칩)
- 파일: `src/app/community/_components/CommunitySidebar.tsx`, `src/app/community/_components/CategoryChips.tsx`
- 근거: `CommunitySidebar.tsx:28, 122-126`(`font-bold text-yellow-400`), `:31-40`(`rounded-full bg-[#E5484D]` 14px 원 안의 "N") · `CategoryChips.tsx:46`(모바일 칩에도 같은 배지) · `community-feed-top.jpg`("유튜브 인큐베이팅 지원하세요!" 노란색, "비블 bibl 칼럼"·"유튜브 AI 자동화 & 깃허브" 옆 빨간 원) · 커뮤니티 폴더의 다른 색 이탈 0건(grep)
- 문제: 액센트는 에메랄드 하나, 레드는 에러·할인 전용인데 강조와 새 글 표시에 노랑·빨강이 쓰였다. 원 안에 글자를 넣은 배지는 소유자가 반복해서 제거해 온 원형 배지 패턴이다.
- 제안: 강조 메뉴는 `font-bold text-[#00E5A0]`(또는 `text-white`). 새 글 표시는 원을 없애고 `ml-1.5 text-[10px] font-black text-[#00E5A0]` 의 "N" 텍스트로 바꾸고, 스크린리더용으로 `sr-only` "새 글"을 둔다.

### community-15 · P2 · content-clarity · 공수 S
**랭킹: 운영 계정 두 개가 같은 이름으로 1·2위를 차지하고, 순위 숫자에 단위가 없어 내 점수와 맞지 않아 보인다**

- 페이지: `/community/ranking`
- 파일: `src/app/community/ranking/page.tsx`, `src/lib/community.ts`
- 근거: `community-ranking.jpg`(1위 "비블 bibl 운영자 +23", 2위 "비블 bibl 운영자 +11", 내 카드 "내 활동 점수 0점 · 운영자") · `community.ts:371-374`(BRAND_AUTHOR_EMAILS 두 계정이 모두 "비블 bibl"로 표시) · `ranking/page.tsx:88-91`(기준 설명은 제목 아래 작은 회색 한 줄), `:176-178`(`+{points}` 를 에메랄드로, 단위 없음), `:94-121`(내 카드는 활동 점수), `:188-191`(규칙 "내 글이 받은 좋아요 +3점")
- 문제: 같은 이름이 두 줄 연속 나와 중복 오류처럼 보이고, 회원 순위표 맨 위를 운영진이 차지한다. "+23"은 점수처럼 보이지만 실제로는 기간 내 받은 좋아요 수라서, 바로 위 "내 활동 점수 0점"과 아래 "좋아요 +3점" 규칙과 맞지 않아 보인다.
- 제안: 숫자를 "좋아요 23"으로 표기하고 `+` 를 뺀다(색은 neutral-200, 상위 3위만 에메랄드 유지). 운영자(gradeMap 값 6)는 렌더 단계에서 순위에서 빼거나 표 위 "운영진" 줄로 따로 묶는다(이미 받아 온 gradeMap 사용, 조회 변경 없음, 소유자 결정 필요). 순위표에 내가 있으면 내 줄을 `bg-white/[0.03]` 로 강조한다. "아래 순위는…" 설명은 표 바로 위로 옮긴다.
