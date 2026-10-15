# 트렌드 서치 신기능 (A·B·C) 진행 현황

설계: roadmap.json · spec.md · research.md · supabase/migrations/trend_dev.sql(2026-10-15 운영 DB 적용 완료)

소유자 결정(2026-10-15): AI 하루 횟수 Free 0 · Starter 5 · 팀비블 5 · Pro 20 · Team bibl 50 · Admin 200 / 주 모델 claude-sonnet-5-5, 가벼운 작업 claude-haiku-4-5-20251001 / 관심 등록 Free 3 · Starter·팀비블 10 · Pro 30 · Team bibl·Admin 100 / A1 최소 채널 3곳(쇼츠 2곳) · A2 구독자 10만 미만·2일 이상 / 키는 ANTHROPIC_API_KEY / breakout_videos 30일 정리 켬 / 브리핑 처음부터 켬 / 네비 알림 숫자 없음 / T11(내 채널 분석 로그인 필수)은 보류 / AI 기능은 처음에 "준비 중": AI_FEATURES_ENABLED=1 일 때만 켜짐(키가 있어도 기본 꺼짐)

- [x] T0 공통 기반
- [x] T0b 기존 AI 경로 보호
- [x] T1 탭 구조·cron 단계 디스패처
- [x] T2 A1 데이터(토크나이저·terms 단계)
- [x] T7 B5 이 영상처럼 만들기
- [x] T8 B6 썸네일 비교 보드
- [x] T1.5 정보 구조 시안 3개 → 2026-10-15 소유자 안 A(브레이크아웃 탭 5개) 확정
- [x] T3 A1 화면 (T1.5 선택 후)
- [x] T4 A2 화면 (T1.5 선택 후)
- [x] T5 A3 조회수 추적 (T1.5 선택 후)
- [x] T6 B4 브리핑 (T1.5 선택 후)
- [x] T9 C7 관심 목록·알림 (T1.5 선택 후)
- [x] T10 C8 내 채널 vs 트렌드 (T1.5 선택 후)

## 배포 전 확인

- T3(급상승 키워드 탭)이 사용자에게 보이기 전에 breakout_terms 백필을 끝낸다(소유자 승인 후): `/api/cron/trend?step=terms&date=2026-10-07` … `2026-10-14` 를 날짜마다 한 번씩, 10-14 도 다시(src/lib/trend/terms.ts 머리 주석). 2026-10-15 기준 운영 breakout_terms 는 10-14 하루치뿐이라, 백필 전에는 탭 기준 줄(breakout_videos 기준 '수집된 날 7일')과 단어 수(하루치)가 어긋난다. 백필 경로(T1·T2)는 2026-10-15 기준 아직 push 전이라, 같은 push 직후 바로 돌리거나 push 전에 BreakoutTabs 의 keywords 를 ready:false 로 두고 백필 뒤에 켠다.
- 남은 판단(다음 항목): 매일 06:00 수집부터 07:05 terms 단계까지 약 1시간은 기준 날짜가 오늘인데 오늘 단어 행이 없어 하루가 빠진 숫자가 보인다. 기준 날짜를 breakout_terms 마지막 날짜로 잡거나 terms 단계 완료(trend_jobs)로 하루 당기는 방법이 있다.
- scripts/ux/routes.baseline.txt 가 오래됐다(/trend-search/breakout·/opengraph-image 차이는 T3 와 무관). 커밋 단계에서 `scripts/ux/buildcheck.sh --write-baseline` 여부를 정한다.
