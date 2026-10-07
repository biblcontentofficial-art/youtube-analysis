# UX/UI 리뉴얼 작업 폴더

요청(2026-10-04): GitHub 최다 스타 홈페이지 디자인 레퍼런스(`VoltAgent/awesome-design-md`·`nextlevelbuilder/ui-ux-pro-max-skill`·`shadcn-ui/ui`)를 활용해 bibllab.com UX/UI 개선. 전체 목록화 후 순서대로 하나씩.

## 파일

- `ROADMAP.md` 로드맵 v2(실행 순서) + v1 원문
- `roadmap-v2.json` 항목별 실행 명세(구현자는 이것을 기준으로, `amendments_v2` 우선)
- `DECISIONS.md` 소유자 결정 대기 목록과 기본 동작
- `critique.md` 로드맵 비판 검토 원문
- `spec/reference-design.md` awesome-design-md 기반 디자인 명세(Resend 주, Linear·Raycast 보조)
- `spec/ux-rules.md` ui-ux-pro-max 기반 UX 규칙
- `findings/*.md` 영역별 감사 보고서 12개(스크린샷 경로는 당시 세션 임시 폴더라 없음)

## 검사 도구 (`scripts/ux/`)

```bash
node scripts/ux/check-invariants.mjs      # 검색 누적 로직 불변 확인 (INVARIANTS_OK)
node scripts/ux/check-theme.mjs           # ux-baseline 이후 바뀐 파일의 테마 규칙 (THEME_OK)
scripts/ux/buildcheck.sh                  # 분리 폴더 빌드 + 렌더 방식 비교 (BUILD_OK)
python3 scripts/ux/shot.py http://localhost:3001 <태그> /경로 ...   # 1440·390 캡처
```

## 진행 현황

체크는 해당 항목 커밋에 포함한다. `git log --oneline --grep '^UX'` 로도 확인.

- [x] R00 기준 태그·검사 도구·문서 이전
- [x] R01 전역·공개 페이지 즉시 수정 (태블릿 네비 겹침·카카오 SDK·/incubating 메타·부가세 라벨·방문 중복·결제 주기·해지 표시)
- [x] R02a 검색 시작 화면·홈 키워드 전달·한도 모달 안내·가입 경로 복구
- [x] R02b 채널 찾기 재차감·돌아가기·잔여 표시·내 채널 업로드 시간
- [x] R03 디자인 토큰·글꼴·한글 타이포·포커스·모션 기반 (globals.css·루트 레이아웃)
- [x] R04 공용 부품(버튼·카드·배지·칩·탭·입력·컨테이너·섹션 헤더·아이콘·로고) + 오류·404·점검 화면 시범 적용
- [x] R05 대화상자 셸·레이어 체계·하단 고정 바·카카오 버튼 겹침
- [ ] R06a 전역 네비 (현재 위치·next/link·컨테이너 정렬·건너뛰기 링크·로더 예외·시작점 실측)
- [ ] R06b 푸터·공유 이미지(OG)·JSON-LD·manifest·아이콘
- [ ] R06c 모바일·태블릿 2행 메뉴와 --nav-h
- [ ] R07 홈 (입력 히어로·섹션 헤더·서비스 갈래·서버 컴포넌트 분리)
- [ ] R09 요금제 (실제 청구액·현재 플랜·결제 실패 안내·비교표·FAQ 시맨틱)
- [ ] R10 로그인·결제 화면 (실패 안내·인앱 경고·대비·결제 화면 테마)
- [ ] R08 트렌드 서치 허브·소개·약관류·계산기 (정적 공개 페이지 테마 정리)
- [ ] R13 본문 렌더러·브랜드 인큐베이팅 (이미지 높이 상한·문단·지원 CTA·공유 메타)
- [ ] R12a 1:1 컨설팅 상세: 요약 카드·가격 직후 CTA·이미지 크기·정적화
- [ ] R12b 상담 신청 폼 (/studio/consulting): 라벨·검증·오류 안내·정적화
- [ ] R11a 채널 대행 /studio: 금지 패턴·모바일 깨짐·첫 화면·성능
- [ ] R11b 채널 대행 /studio: 전환 CTA·가격 카드·섹션 정렬
- [ ] R14 커뮤니티 틀·탐색·비회원 게이트·랭킹 (현재 게시판 표시·사이드바·팔레트·h1)
- [ ] R15 글 상세·피드 카드·댓글·글쓰기 (읽기 폭·썸네일·답글·툴바·터치 기기)
- [ ] R16 검색 화면 틀·검색창·한도 모달·도구 탭
- [ ] R17 검색 분석 패널 (인사이트·경쟁도·제목 패턴 접기, 기능색만 유지)
- [ ] R18 검색 결과 표·영상 모달·수집한 영상 (/saved)
- [ ] R19 채널 찾기·채널 상세·내 채널 분석 (테마·기능색 범례·모바일 넘침·원문 오류)
- [ ] R20 스레드 (한국어 오류·다시 연결·테마·수집함 즐겨찾기)
- [ ] R21 마이페이지 (섹션 구조·테마·계정 관리 분리·초대 안내)
- [ ] R22 접근성 잔여·전체 QA·문서화 (점검 스크립트·DESIGN.md)
- [ ] R23 홈 결과 미리보기 (home-04)

## 이어받는 법

1. `git log --oneline --grep '^UX' | head` 와 위 체크 목록으로 끝난 항목 확인
2. `DECISIONS.md` 에서 답이 온 결정 반영
3. 다음 미완 항목을 `roadmap-v2.json` 기준으로 구현 → 검사 4종 → 로컬 커밋(push 는 소유자가 '배포해줘' 할 때만)
