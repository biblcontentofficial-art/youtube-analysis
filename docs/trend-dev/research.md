# 트렌드 서치 신기능 조사 (A1~C8)

조사일 2026-10-15. 코드는 읽기만 했고, 운영 DB 는 `breakout_videos` 를 SELECT 로만 읽었다(쓰기 없음). `/search?q=`·`/channels?q=`·`/my-channel?channel=` 는 열지 않았다.

---

## 0. 한눈에

| 항목 | 결론 |
|---|---|
| 데이터 | `breakout_videos` 1,429행, 날짜 3개뿐(10-07 630 · 10-13 437 · 10-14 362). 10-08~10-12 비어 있음. cron 은 매일 정상 동작 중(10-14분이 10-14 21:00 UTC = 10-15 06:00 KST 수집) |
| A1 7일 vs 7일 | 연속 14일이 필요하다. 지금 흐름이면 **10-13~10-26 이 채워지는 10-27 아침**에 처음 가능. 그 전에는 빈 상태(또는 '최근 많이 나온 단어')로 |
| A2 | 바로 가능(API 비용 0). 뉴스·홈쇼핑·이슈 제외 + 구독자 10만 미만 + 2일 이상 등장 = 지금 20개 채널 |
| A3 | 새 기록 테이블이 필요하다. 기존 행은 같은 날짜를 다시 수집하면 `view_count` 가 덮어써진다 |
| AI 키 | `.env.local` 에 `ANTHROPIC_API_KEY`·`OPENAI_API_KEY` **둘 다 없음**. 운영 Vercel 은 확인 불가 |
| AI 패턴 | 전부 `fetch` 직접 호출, 모델 `claude-3-5-haiku-20241022`·`claude-3-5-sonnet-20241022`(구식). SDK 미설치. **AI 호출에 사용량 제한이 하나도 없다**(로그인만 확인) |
| 횟수 제한 저장 | Upstash Redis + Lua 원자 증가(`searchLimit.ts`). 같은 모양으로 `ai:*` 키를 만들면 일관적. 일 단위 키가 UTC 날짜라 **한국 09:00 리셋**(마이페이지 문구와 일치) |
| 내 채널 | 저장하는 곳이 **없다**. `/my-channel` 은 URL 파라미터로 매번 새로 분석(YouTube search.list 100 unit). C8 은 저장 칸부터 필요 |
| 알림 | 사이트 알림 시스템 **없음**. 커뮤니티 빨간 N 배지는 소유자 예외라 새 화면에 재사용 금지. 네비 남은 횟수 배지(`SearchUsageBadge`) 패턴을 따라 만들면 된다 |
| 진입점 | B5 = 영상 정보 대화상자 '사용자 도구' 칸. B6 = 검색 결과 '분석 도구 줄' 의 제목 패턴 분석 옆. 둘 다 불변 조건 함수와 겹치지 않음 |

---

## 1. 브레이크아웃 현재 구조

### 1.1 수집 (`src/lib/breakout.ts`)

- `collectBreakout(date)` `breakout.ts:129-198`
  - 후보: `search.list`(order=viewCount, regionCode=KR, 길이 short·medium·long × 최대 4쪽) `:97-112`, `:134` → 최대 12회 × 100 unit = **약 1,200 unit/일**
  - `videos.list chart=mostPopular` 카테고리 12개 `:127`, `:135-139` (그날 게시분만 남김)
  - 상세 `videos.list` 50개 묶음 `:143-146`, 채널 `channels.list` 50개 묶음 `:150-157`
  - 거르기: 조회수 1,000 미만·`- Topic`·도박 단어·한글 없음 제외 `:114-125`, 구독자 숨김 채널 제외 `:154`
  - 저장 값: ratio(조회수÷구독자), channel_avg_views(누적÷영상 수), outlier(조회수÷채널 평균), kind `:159-184`
  - `upsert onConflict snapshot_date,video_id` 500개 묶음 `:191-196` → **같은 날짜 재수집 시 조회수 덮어씀**
- 채널 종류 판정 `classifyChannel` `:40-48` (news: 카테고리 25 또는 이름 정규식, shopping, issue)
- 키 순환 `yt()` `:52-75` (`YOUTUBE_API_KEY`, `_2`~`_10`, `_PAID_1`~`_10`, 쿼터 403 만 다음 키)
- 날짜 도우미 `kstDayRange` `:78-82`, `kstToday(offset)` `:85-87`
- 조회 `getBreakout` `:206-231` (날짜 하나, 최대 600행, 칼럼 없는 DB 폴백 포함), `getBreakoutDates` `:234-246` (최근 35일을 날짜마다 count 쿼리, 최대 35회 왕복)

### 1.2 cron

- `src/app/api/cron/breakout/route.ts:11` `maxDuration = 60`, `:15` `CRON_SECRET` Bearer 확인, `:18-19` `?date=YYYY-MM-DD` 재수집, 기본은 `kstToday(-1)`
- `vercel.json` `functions["src/app/api/**"].maxDuration = 60`, `regions ["icn1"]`
- crons 2개: `/api/cron/billing` `0 16 * * *`(01:00 KST), `/api/cron/breakout` `0 21 * * *`(06:00 KST)
- 수집 소요 시간은 기록이 없어 모른다. A3·B4·C7 을 같은 함수에 붙이면 60초 한도가 걱정이므로 **별도 cron 경로**를 권한다(Vercel 플랜의 cron 개수 한도는 소유자 확인 필요).

### 1.3 테이블 (`supabase/migrations/`)

- `breakout_videos.sql`: PK `(snapshot_date, video_id)`, 인덱스 `(snapshot_date, ratio desc)`·`(snapshot_date, view_count desc)`, **RLS 켜짐 + 정책 없음 = service role 만** 읽고 씀
- `breakout_outlier.sql`: `channel_avg_views`, `outlier` + 인덱스
- `breakout_kind.sql`: `category_id`, `kind` + 인덱스 `(snapshot_date, kind)`
- 새 테이블도 같은 방식(RLS on, 정책 없음, 서버 `getSupabase()` service role 만)이 일관적이다(`src/lib/supabase.ts`).

### 1.4 화면 (`src/app/trend-search/**`)

- 허브 `trend-search/page.tsx`: 플랜 확인 `:38-49`, 도구 목록 `TOOLS` `:51-80`(LIST_PANEL, 잠금은 PLAN_TAG), 브레이크아웃 글자 링크 `:129-135`. 새 기능은 이 목록 패널에 항목을 더하는 자리.
- 브레이크아웃 `breakout/page.tsx`: 로그인 확인 `:26-45`, `breakout-view.tsx`: 날짜 칩 `:102-108`, 정렬·길이·기준 칩 `:111-124`, 빈 상태 `:126-131`(DESIGN 6.20), 1024 이상 표 `:135-186`, 1024 미만 목록 `:189-215`, 파생값 안내 `:218`
- 파생값 안내 문구 원형(`:218`): "평균 대비 … 는 이 공개 값을 단순 계산한 참고값으로, YouTube 공식 지표나 bibl lab 의 평가가 아닙니다." 검색 결과 쪽도 같은 문장 `SearchResultList.tsx` 파생값 안내 단락. A1·A3 화면은 이 문장을 그대로 따라 쓰면 된다.
- 로컬 미리보기 `src/app/ux-preview/breakout/page.tsx` 가 `BreakoutView` 를 그대로 재사용(새 화면도 같은 방식으로 미리보기 가능).

### 1.5 실제 데이터 (읽기 조회 결과)

| snapshot_date | 행 | kind 있음 | 쇼츠(≤180초) | 수집 시각(UTC) |
|---|---|---|---|---|
| 2026-10-07 | 630 | 86 | 231 | 10-08 07시, 10-14 13시(재수집) |
| 2026-10-13 | 437 | 158 | 122 | 10-14 14시 |
| 2026-10-14 | 362 | 136 | 102 | 10-14 21시(정기 cron) |

- 채널 863개, 2일 이상 등장 201개(대부분 뉴스, kind=news). kind 없음 + 구독자 10만 미만 + 2일 이상 = 20개(아워무비 8.2천·3일, 먹기전에 6.2만·3일·5편 등).
- 같은 날 2편 이상 오른 채널 67개. 같은 영상이 여러 날짜에 있는 경우 0(게시일 기준 저장이라 당연).
- 제목에 `#` 해시태그가 있는 행 201/1429(14%). 해시태그는 출연자·프로그램명 나열이 많다(`#슬기로운의사생활 #조정석 …`).
- 주의: **10-07 은 일주일 뒤 재수집돼 조회수가 부풀어 있고**, 10-13 도 하루 늦게 수집됐다. 날짜 간 조회수 비교는 수집 시점이 달라 공정하지 않다(A1 은 조회수가 아니라 등장 빈도를 쓰는 이유).
- 함정: Supabase 기본 응답 상한 1,000행. 14일치(약 5,000행)를 한 번에 `select` 하면 잘린다(조사 중 실제로 10-14 가 1행만 잡혔다). `range()` 페이지 반복이나 집계 테이블·RPC 가 필요하다.

---

## 2. A1 한국어 토큰화 판단 (형태소 분석기 없이)

### 2.1 그대로 단어 수를 세면

공백 분리 상위어: `10`, `이유`, `2026`, `10월`, `live`, `jtbc`, `진짜`, `vs`, `속보`, `채널a`, `ep`, `#shorts` … → 날짜·숫자·방송 형식어·언론사명이 위를 덮는다.

### 2.2 규칙 시제품 (스크래치 스크립트로 확인)

1. kind(news·shopping·issue) 행 제외 → 언론사·정치어가 대부분 빠진다.
2. 해시태그 `#[\p{L}\p{N}_]+` 는 따로 뽑아 소문자화(`#shorts`·`#쇼츠` 는 불용).
3. 본문은 `[^\p{L}\p{N}\s]` 를 공백으로 → 공백 분리 → 소문자.
4. 버림: 순수 숫자, `\d+(년|월|일|시|분|회|화|차|강|위|만|억|개|가지|탄)`, `19xx/20xx` 시작, 자모만(`ㅋㅋ`·`ㄷㄷ`·`ㅠㅠ`), 2글자 미만.
5. 한글 3글자 이상이면 끝 조사 하나 떼기: `에서는|으로는|에게서|이라는|에서|으로|까지|부터|한테|에게|처럼|보다|이랑|이다|은|는|이|가|을|를|의|에|로|와|과|도|만|랑` (2글자 단어는 '한국'·'일본'이 깨지므로 떼지 않음).
6. 불용어: `live, 라이브, ep, vs, feat, mv, official, full, 풀버전, 다시보기, 하이라이트, 모음, 진짜, 너무, 이렇게, 지금, 없는, 있는, 하는, 결국, 드디어, 정말, 완전, 가장, 처음, 오늘, 이유, 방법, 순간, 근황, 공개, 영상, 방송, 채널, 실시간, 스트림` 등.
7. **세는 단위는 영상이 아니라 '서로 다른 채널 수'**(한 채널이 같은 단어로 여러 편 올리는 것을 1로).

결과(10-13·10-14 vs 10-07, 채널 3곳 이상, `(최근+1)/(이전+1)`): `1차전 0→5, 란커배 0→4, 빌런 0→4, lg 0→4, 맨유 0→4, 와일드카드 0→4, 코스피 0→3, 추영우 0→3, 김소현 0→3, cxmt 0→3 …` → 주제어가 잘 올라온다. 남는 잡음은 `오랜만·요즘·갔더니·빠진·화요일·떴다·실제` 같은 용언·부사형.

### 2.3 권장 규칙(추가)

- 용언형 끝 거르기: `(는|던|한|된|했|하|다|요|니|까|게|지|고|서|면)$` 로 끝나는 한글 토큰은 2차 불용 후보(단, 고유명사 오탐이 생기면 허용 목록).
- 요일·시간어(`월요일`~`일요일`, `오늘`, `어제`, `요즘`) 불용.
- 최소 지지도: 최근 7일 서로 다른 채널 3곳 이상(데이터 하루 220~540행 기준).
- 증가율은 `(최근+1)/(이전+1)` 같은 평활값으로 정렬하되 **화면에는 원본 횟수 '이전 N곳 → 최근 M곳'** 을 보이고, 배수 표시는 참고값 안내와 함께.
- 바이그램(연속 두 단어)은 선택. '라스 김원효' 처럼 해시태그 쪽이 이미 고유명사를 잘 잡는다.
- 데이터가 적을 때(연속 14일 미만): 증가율 대신 "최근 N일 많이 나온 단어"(채널 수 순)만 보여 주고 "비교할 이전 기간 데이터가 아직 부족합니다(N/14일)" 빈 상태 문구. 날짜 빈칸(10-08~10-12)은 '없는 날'로 표시하고 0으로 채우지 않는다.

### 2.4 저장 제안(SQL 파일만, 적용은 소유자)

`breakout_terms(snapshot_date date, term text, term_type text /* word|tag */, channel_count int, video_count int, sample_video_ids text[], primary key(snapshot_date, term, term_type))`. 수집 직후 같은 cron(또는 별도 cron)에서 그날 행만 토큰화해 넣는다(API 비용 0). 14일 비교는 이 작은 테이블 집계로 끝나 1,000행 상한 문제도 피한다. 과거 날짜는 테이블에서 다시 계산 가능(재수집 불필요).

참고: 기존 단순 토큰화 `src/app/search/_components/KeywordInsights.tsx:36-85`(불용어 적고 조사 처리 없음), 제목 유형 정규식 `TitlePatternAnalysis.tsx:17-66`(숫자형·질문형·하우투·자극·비교·리뷰). 새 토크나이저는 `src/lib/` 에 공용으로 두고 A1·C7·C8 이 같이 쓰는 것이 맞다.

### 2.5 비어 있는 날 메우기

`/api/cron/breakout?date=2026-10-08` 처럼 재수집은 가능하지만 날짜당 약 1,300 unit 이상, `mostPopular` 은 지금 시점 인기만 주므로 과거 날짜에선 거의 0, 조회수도 늦게 재서 부풀어 있다. A1 은 빈도 기준이라 영향이 작지만 '같은 조건' 이 아니다. 메울지 말지는 소유자 결정.

---

## 3. A2 재등장 채널

- 데이터만으로 가능: 최근 14/30일 `breakout_videos` 에서 `kind is null` 행을 채널별로 묶어 서로 다른 snapshot_date 수 ≥ 2, 구독자 상한(예: 10만) 으로 거른다. 표시 값은 원본만(등장 일수·편수·구독자·최근 영상 제목/썸네일).
- 지금 데이터로 20개. 날짜가 쌓이면 늘어난다.
- 1,000행 상한 때문에 SQL 뷰 또는 RPC(`group by channel_id`) 권장. 예: `create view breakout_channel_recurrence as select channel_id, max(channel_title), count(distinct snapshot_date) days, count(*) videos, max(subscriber_count) subs, max(snapshot_date) last_date from breakout_videos where kind is null group by channel_id` 에 날짜 조건을 RPC 인자로.
- 구독자는 수집 시점 값(날짜마다 다를 수 있음) → 최신 날짜 값을 쓴다.

---

## 4. A3 조회수 추적

- 기존 행은 수집 시점(게시 후 약 6~30시간) 한 번 잰 값이고, 같은 날짜를 다시 수집하면 덮어써진다(`breakout.ts:193-196`). 성장 곡선은 **별도 기록 테이블**이 필요하다.
- 제안: `breakout_views(video_id text, snapshot_date date, day_offset int /* 1|3|7 */, view_count bigint, measured_at timestamptz, primary key(video_id, day_offset))`. 첫 수집값을 day 1 로 복사해 두면 재수집 덮어쓰기와 무관해진다.
- 측정: 매일 `snapshot_date = 오늘-3`, `오늘-7` 의 video_id 를 모아 `videos.list part=statistics` 50개 묶음. 하루 약 400 × 2 = 800개 → 16회 ≈ **16 unit/일**. 함수 시간도 짧다.
- 시점 정의 주의: 'n일째' 는 게시 시각 기준이 아니라 수집 날짜 기준(게시 0~24시 분포)이라 ±1일 오차. 화면에 "게시일 다음 날·3일 뒤·7일 뒤 아침에 잰 값" 으로 정직하게 쓴다.
- 구분 지표(진짜 터짐 vs 반짝)는 파생값 → 화면에 원본 조회수 3개를 먼저 보이고, 증가 배수는 참고값 안내와 함께.
- 붙일 곳: 기존 cron 뒤에 순차 실행은 60초 위험. `/api/cron/breakout-track` 별도 경로 + `vercel.json` crons 추가(예: `30 21 * * *`), 또는 같은 경로에 `?step=track` 분기. 비공개 영상·삭제 영상은 응답에서 빠지므로 null 처리.

---

## 5. B4·B5·B6 Claude 호출

### 5.1 기존 AI 호출 패턴

| 파일 | 공급자 순서 | 모델 | 제한 |
|---|---|---|---|
| `src/app/api/keyword-insight/route.ts` | 사용자 선택, 기본 openai `:38` | openai `gpt-4o-mini` `:66`, anthropic `claude-3-5-haiku-20241022` `:89`, gemini `gemini-1.5-flash` `:105`, grok `grok-2-latest` `:129` | 로그인만 `:28-31` |
| `src/app/api/ai-analyze/route.ts` | OPENAI 먼저 `:55-88`, 그다음 ANTHROPIC `:90-120`, 둘 다 없으면 503 + ChatGPT 새 탭 안내 `:122-129` | `gpt-4o-mini` `:66`, `claude-3-5-haiku-20241022` `:102` | 로그인만 `:19-22` |
| `src/app/api/posts/from-youtube/route.ts` | 기본 anthropic `:82` | `claude-3-5-sonnet-20241022` `:187`, `gpt-4o` `:203` | 관리자 화면용 |
| `src/app/api/posts/from-text/route.ts` | 기본 anthropic `:50` | `claude-3-5-sonnet-20241022` `:152`, `gpt-4o` `:168` | 관리자 화면용 |

- 키 이름: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`. 호출은 전부 `fetch("https://api.anthropic.com/v1/messages")` + `anthropic-version: 2023-06-01` 직접 호출. `package.json` 에 `@anthropic-ai/sdk` 없음.
- `.env.local` 키 이름 확인 결과: ANTHROPIC·OPENAI·GEMINI·GROK 키 **모두 없음**(값은 보지 않음). 로컬에서는 B4·B5·B6 을 실제 호출로 시험할 수 없다. 운영 Vercel 에 있는지는 확인 불가 → 소유자 확인 필요.
- 화면 안내 원형: `VideoModal.tsx:421`(사용자 도구 설명), `:483` "※ 외부 AI 서비스(OpenAI/Anthropic)가 생성한 텍스트입니다. bibl lab이 제공하는 메트릭이나 평가가 아니며, YouTube의 공식 정보도 아닙니다." → B4·B5·B6 은 이 문장을 그대로(공급자 이름만 맞게) 쓴다.
- 기존 키워드 진단 system 프롬프트에 "YouTube 공식 메트릭처럼 들리는 표현 금지" `keyword-insight/route.ts:55-56` 가 있다. 새 프롬프트에도 넣는다.

### 5.2 모델 (2026-10 기준, claude-api 스킬 표)

- `claude-3-5-*` 는 구식 ID. 새 코드는 공식 SDK `@anthropic-ai/sdk` + 현재 ID 를 쓴다. 날짜 접미사 없이 표의 ID 그대로.
- 기본 권장 `claude-opus-5-5`($4/$20 per 1M, 이미지 입력 가능, effort 기본 medium). 저비용이 필요하면 `claude-sonnet-5-5`($2/$10) 또는 `claude-haiku-5-5`($0.10/$0.50, 10만 토큰 이하) 중에서 **소유자가 고른다**.
- B6 이미지 입력: 썸네일 URL(`https://i.ytimg.com/vi/{id}/mqdefault.jpg`)을 `image` 블록 `source.type: "url"` 로 그대로 넣을 수 있다. 썸네일 12~20장 기준.
- B4 매일 요약은 cron 에서 한 번 → 비용 작다. 지연 무관하면 Batches(50% 할인)도 가능하나 cron 안에서 기다리기 어려워 일반 호출이 단순.

### 5.3 B4 저장 구조

`trend_briefings(snapshot_date date primary key, bullets jsonb /* 3~5줄 배열 */, body text, model text, input_stats jsonb, created_at timestamptz)`. 입력: 그날 kind 없는 상위 50개(제목·길이·조회수·구독자) + A1 상위어. 발송(메일·카카오)은 나중에 이 테이블만 읽으면 되게 `bullets` 를 구조화해 둔다. 생성 실패 시 행 없음 → 화면은 "오늘 브리핑을 준비하지 못했습니다" 빈 상태.

### 5.4 B5 진입점

- 검색 결과: 영상 정보 대화상자 `VideoModal.tsx:416-` '사용자 도구' 칸(이미 "AI에게 이 영상이 잘 된 이유 묻기" `:429-438` 와 안내 문구가 있음). 버튼 하나 더 + 내 채널 주제 입력칸. 불변 조건 밖.
- 브레이크아웃: 표 행 `breakout-view.tsx:152-184` 는 서버 컴포넌트·링크뿐이라 버튼을 넣으려면 클라이언트 잎이 필요. 1024 미만 목록 `:189-215` 도 같이.
- 결과 보관(선택): `ai_generations(id, user_id, feature, video_id, input jsonb, output text, model, created_at)` 를 두면 마이페이지 재열람·남용 확인에 쓸 수 있다.

### 5.5 B6 진입점

- 검색 결과 '분석 도구 줄' `SearchResultList.tsx:469-521`: '제목 패턴 분석' 버튼 `:493-496` 뒤에 '썸네일 비교' 보조 버튼(`TOOL_BUTTON` `:366`, 잠금은 `LOCKED_BUTTON` `:368` + `PLAN_TAG`). 펼침 상태 타입 `tool` `:225` 에 `"thumbs"` 추가, 패널은 `:522-534` 의 펼침 영역에. `toggleTool`·`closeTool` `:348-349` 재사용.
- 썸네일 격자 자체(이미지 모음)는 AI 없이 바로 보여 주고, '공통점 정리' 만 AI 버튼(사용자가 눌러야 실행, 횟수 차감).

### 5.6 불변 조건과의 관계

`scripts/ux/check-invariants.mjs:31-54` TARGETS: SearchBar 기록·실행 함수들, `search/page.tsx` 의 `if (query)`·`filterBase`, `SearchResultList` 의 `handleLoadMore`(`:140`)·`dedup`(`:59`)·`key={video.videoId}` 개수, 홈 `saveToHistory`·`trySearch`, `RecentSearches` 의 `fromHistory=1`. 위 진입점(분석 도구 줄 버튼, `tool` 상태 타입, 패널, VideoModal)은 모두 이 밖이다. 단 `key={video.videoId}` 는 **개수**를 해시하므로 썸네일 격자에서 같은 속성 `key={video.videoId}` 를 새로 쓰면 개수가 바뀌어 검사가 실패한다 → 격자는 다른 컴포넌트 파일에 두거나 `key={v.videoId}` 처럼 다른 식을 쓴다. 작업 뒤 `node scripts/ux/check-invariants.mjs` 필수.

---

## 6. 인증·플랜·횟수 제한

- `src/lib/auth.ts`: `auth()` `:10-18`(Supabase `getUser`), `currentUser` `:29-50`(React `cache()`, plan 포함), `getUserPlan(userId)` `:53-67`(`profiles.plan`, 실패 시 "free"). `profiles` 생성 SQL 은 저장소에 없고 `marketing_consent.sql` 의 alter 만 있다.
- `src/lib/stripe.ts`: `PlanConfig` `:12-31`, `PlanKey = free|starter|pro|business|admin|team` `:33`, `PLANS` `:35-152`. 플랜별 한도·권한은 전부 이 객체 필드(`dailySearchLimit`, `monthlySearchLimit`, `channelSearchMonthlyLimit`, `resultLimit`, `canCollect` …). business 이름은 "Team bibl", team 은 "팀비블"(Starter 와 같은 한도).
- `src/lib/searchLimit.ts`:
  - 키 `search:d:{userId}:{YYYY-MM-DD}` `:39-41`, `search:m:{userId}:{YYYY-MM}` `:43-47` (날짜는 `toISOString()` = **UTC**, 즉 한국 09:00 리셋. 마이페이지 문구 "매일 09:00 (KST) 리셋" 과 일치)
  - Redis Lua 원자 체크+증가 `atomicIncrIfUnder` `:75-92`, TTL 자정(UTC)까지 `:124-130`
  - Redis 없으면 메모리 Map 폴백 `:37`, `:105-122`
  - `getUserPlan()`(인자 없음, currentUser 사용) `:138-146` — `auth.ts` 의 `getUserPlan(userId)` 와 이름이 같고 시그니처가 다르다(혼동 주의)
  - 사용량 조회 `getSearchUsage` `:177-211`, 차감 `_incrementSearchCountCore` `:218-317`, 전역 일별 카운터 `:214-216`, `incrementSearchCount` `:319-337`
  - Free 추천 보너스 `ref:bonus:{userId}` `:193-196`
- 채널 검색 `src/lib/channelLimit.ts` 도 같은 구조(`chsearch:d:`/`chsearch:m:`, 같은 Lua). IP 제한 `src/lib/rateLimit.ts:28-49`(`rl:{key}:{ip}`).
- **일관적인 방법**: `PlanConfig` 에 `dailyAiLimit: { remix: number|null; thumbs: number|null }`(또는 기능별 필드 2개) 추가 → `src/lib/aiLimit.ts` 를 `channelLimit.ts` 복제 구조로 만들고 키 `ai:{feature}:d:{userId}:{UTC날짜}`, `atomicIncrIfUnder` 재사용. 사용량 조회 GET(`/api/usage` 처럼) + 마이페이지 '검색 사용량' 칸 `MyPageView.tsx:251-275` 의 `UsageMeter` 에 한 줄 추가. 숫자는 소유자 결정.
- 차감 시점: AI 호출 **성공 후** 차감할지(실패 시 무료) 먼저 차감 후 실패 시 되돌릴지 결정 필요. 검색은 먼저 차감 방식.
- 덧붙임: 기존 `keyword-insight`·`ai-analyze` 에는 제한이 없어 키가 운영에 있으면 비용 노출 위험. 같은 `aiLimit` 을 붙일지 소유자 결정.

---

## 7. 내 채널 (C8 데이터)

- `src/app/my-channel/page.tsx:35-48`: `?channel=` 값을 받아 그때그때 `analyzeChannel` 실행, **저장 없음**. 서버 쪽 플랜·로그인 확인도 없다(허브 `trend-search/page.tsx:66-72` 에서만 Starter 잠금 표시). 분석 1회에 `search.list`(100 unit) + `channels.list` + `videos.list`.
- `src/app/my-channel/actions.ts:3-33` `ChannelAnalysis`: `channel.keywords`(채널 설정 키워드, 최대 20) + `recentVideos`(최근 30편 제목·조회수·게시일) → C8 이 쓸 원료로 충분.
- DB: `supabase/schema.sql` 에 subscriptions·payments·search_history(`:60-64`)·saved_videos(`:75-89`)·threads 계열만. 내 채널 칸 없음.
- 제안: `user_channels(user_id text primary key, channel_id text, channel_title text, topic_terms text[], recent_titles jsonb, refreshed_at timestamptz)` (또는 `profiles` 에 칼럼 추가). 마이페이지에서 등록 → 서버에서 `analyzeChannel` 1회 → A1 과 같은 토크나이저로 `topic_terms` 저장 → C8 은 `A1 상승어 ∩ 주제 인접어 − 이미 다룬 단어`. 주제 인접 판정은 단어 겹침만으로는 약하므로 Claude 로 '내 주제와 관련 있는 상승어 고르기' 를 하는 편이 현실적(이 경우 외부 AI 안내 필요).
- DESIGN 7.2 "'채널 분석'(`/my-channel`) 탭은 결정 18 답 전까지 넣지 않는다" (`DESIGN.md` 7.2 표 2행) → C8 화면 위치를 정할 때 함께 결정.

---

## 8. 알림 (C7)

- 사이트 알림 테이블·API·UI **없음**(`grep notification|unread` 결과 없음).
- 커뮤니티 '새 글' 배지: `community/_components/SidebarBoardLink.tsx` 의 `NewBadge`(CommunitySidebar 가 재수출 `:17-19`), 최근 3일 새 글 게시판 `recentBoardIds`. DESIGN 3.4 소유자 예외(빨간 원형)이며 "예외 색은 위 표의 자리에서만 쓴다. 새 화면에 owner-red 를 쓰지 않는다" → **재사용 불가**.
- 재사용할 패턴: 네비 `SiteNav.tsx:161` `{user && <SearchUsageBadge />}` — 클라이언트 잎이 `/api/usage` 를 GET(`SearchUsageBadge.tsx:27-60`), 루트 레이아웃 인증 호출 금지 규칙(`SiteNav.tsx:15`, 성능 메모) 준수. 알림 수도 같은 방식으로 `/api/notifications/unread-count` 를 읽는 잎을 만들면 된다. 모양은 DESIGN 6.12 '남은 횟수' 상자(무채색 테두리 + 숫자) 계열.
- 제안 테이블: `watch_keywords(user_id, term, created_at, pk(user_id, term))`, `watch_channels(user_id, channel_id, channel_title, created_at, pk(user_id, channel_id))`, `notifications(id bigserial, user_id, kind /* keyword|channel */, term, channel_id, video_id, snapshot_date, read_at, created_at, unique(user_id, video_id, kind))`.
- 생성: 브레이크아웃 수집 뒤(별도 cron 단계) 그날 행에서 등록 채널 `channel_id in (…)`, 등록 키워드는 A1 토크나이저 결과 또는 제목 포함 검사 + 기준(예: outlier ≥ 2 또는 ratio ≥ 1) → insert on conflict do nothing. API 비용 0.
- 플랜별 등록 개수 한도는 `PlanConfig` 필드로.

---

## 9. DESIGN.md 앱 화면 레시피 · `src/components/ui/*`

| 필요 | 근거 | 공용 상수 |
|---|---|---|
| 금지 패턴(그라데이션·글로우·아이콘 상자·이모지·알약·`—`·색 면) | `DESIGN.md` 1.3 | 검사 `check-theme` |
| 버튼(주 흰 면 한 화면 하나, 보조, 고스트, 잠김) | 6.5 | `src/components/ui/button.ts` `buttonClass`, `cx` |
| 칩·세그먼트(선택은 aria-pressed / aria-current) | 6.6 | `chip.ts` `CHIP`, `SEGMENT`, `SEGMENT_ITEM` |
| 카드(앱 카드 `rounded-card border bg-surface p-5`) | 6.7 | `card.ts` `CARD`, `CARD_LINK`, `cardClass` |
| 입력·선택 상자 | 6.9 | `field.tsx` `INPUT`, `TEXTAREA`, `Field`, `Label`, `Hint`, `ErrorText` |
| 표·목록(1024 이상 표 / 미만 목록, 정렬 열 흰색) | 6.10 | `table.ts` `TABLE`, `TH`, `TH_SORT`, `TH_SORT_ACTIVE`, `TD`, `NUM`, `ROW`, `ROW_SELECTED` |
| 대화상자 | 6.11 | `dialog.tsx` `Dialog`, `dialog-classes.ts`, 확인창 `useConfirm`(`app/_components/ConfirmDialog.tsx`) |
| 배지·태그·잠금(Pro/Starter 태그 한 모양) | 6.12, 6.29 | `badge.ts` `badgeClass` |
| 상태 메시지·토스트 | 6.13 | `SelectionBar.tsx` 의 `ActionToast` |
| 빈 상태 | 6.20 | (클래스 문자열, 브레이크아웃 `:126-131` 참고) |
| 사용량 막대 | 6.23 | 마이페이지 `UsageMeter` |
| 탭(밑줄, aria-current/aria-selected) | 6.3 | `tabs.ts` `TAB_BAR`, `TAB_LIST`, `TAB` |
| 목록 패널(허브) | 6.27 | `list-panel.ts` `LIST_PANEL*` |
| 섹션 머리 | 6.4 | `section-header.tsx` `SectionHeader` |
| 아이콘(맨 SVG) | 1.3 | `icons.tsx`(InfoIcon, WarningIcon, ChevronDownIcon, KakaoIcon 등) |
| 앱 화면 순서·분석 도구 줄·디스클레이머 문구 | 7.2 | — |

색 규칙: 흰색 = 지금·핵심·행동만, 좋음 표시에 흰색 금지, 기능 색(positive/caution/negative)은 기호·글자만(DESIGN 1.2, 3.1). A1 상승 표시는 `▲` + positive 글자 정도가 상한.

---

## 10. 소유자 결정이 필요한 것

1. 운영 Vercel 에 `ANTHROPIC_API_KEY` 가 있는지, 쓸 모델(`claude-opus-5-5` 기본 / sonnet-5-5 / haiku-5-5).
2. B5·B6(그리고 기존 AI 두 경로)의 플랜별 하루 횟수, 실패 시 차감 여부.
3. 10-08~10-12 빈 날짜를 재수집으로 메울지(약 1,300 unit/일, 조회수 시점 불일치).
4. A2 '작은 채널' 구독자 상한(10만?), A1 최소 채널 수(3곳?).
5. Vercel cron 개수 한도(현재 2개) 안에서 별도 cron 을 늘릴 수 있는지, 아니면 한 경로에서 단계 분기할지.
6. C8 화면 위치(결정 18 '채널 분석' 탭 문제와 연결), 내 채널 저장을 `profiles` 칼럼으로 할지 새 테이블로 할지.
7. SQL 마이그레이션 적용은 소유자 몫(`supabase/migrations/` 에 파일만 둔다).
