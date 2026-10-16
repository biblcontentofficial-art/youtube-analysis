-- ═══════════════════════════════════════════════════════════════
-- 트렌드 서치 신기능(A1~C8) 통합 마이그레이션
-- 설계 문서: docs/trend-dev/spec.md, docs/trend-dev/roadmap.json
--
-- 원칙
--  - 여러 번 실행해도 같은 결과(if not exists / create or replace).
--  - 모든 새 테이블은 RLS 켜고 정책 없음 = 서버(service role)만 읽고 쓴다(breakout_videos 와 같은 방식).
--  - 기존 breakout_videos 는 구조를 건드리지 않는다(칼럼·인덱스 추가 없음).
--    예외 하나: trend_purge_expired(p_purge_breakout => true) 가 30일 지난 breakout_videos 행을 지운다
--    (YouTube API Services 정책: API 로 받은 통계·메타데이터는 30일 안에 갱신하거나 삭제). 켤지는 소유자 결정.
--  - 함수(RPC)는 anon·authenticated 실행 권한을 빼고 service_role 만 실행한다.
--  - user_id 는 기존 search_history·saved_videos 와 같은 text.
--  - 적용은 소유자가 Supabase SQL Editor 에서 직접 한다.
--
-- 보관 기한(30일, purge 단계가 매일 실행)
--  - breakout_views: measured_at 30일 지나면 삭제 / notifications·ai_generations: created_at 30일 / trend_briefings·
--    user_trend_matches·breakout_terms: snapshot_date 가 오늘-30 보다 이전이면 삭제
--  - user_channels: refreshed_at 30일 지나면 제목·썸네일·구독자 수·최근 제목을 비움(channel_id·topic_terms 만 남김, 다시 분석 안내)
--  - watch_channels: meta_at 30일 지나면 채널 이름·썸네일을 비움(channel_id 만 남김)
--
-- 집계 대상 행(모든 RPC·서버 코드 공통)
--  breakout_videos 중 kind is null 이고, '분류 칼럼이 생기기 전 수집 행'(kind·category_id·outlier 가 모두 null,
--  2026-10-07 의 221행, collected_at 2026-10-08 07시 UTC)이 아닌 행.
--  그 221행은 뉴스·홈쇼핑 판정을 받지 않아(채널명으로만 봐도 약 50개가 뉴스) 집계에서 뺀다.
--  SQL 조건: bv.kind is null and not (bv.category_id is null and bv.outlier is null)
--
-- 2026-10-16 가로 롱폼 전용: trend_longform_only.sql 이 이 파일의 trend_rising_window · trend_recurring_channels ·
--  trend_growth 를 같은 인자로 덮어쓴다(video_format 으로 쇼츠·세로·라이브 제외). 이 파일을 다시 실행했다면
--  trend_longform_only.sql 도 바로 이어서 다시 실행한다(아래 세 함수의 길이 조건은 예전 판정이다).
-- ═══════════════════════════════════════════════════════════════


-- ── 0. cron 단계 기록 (T1) ─────────────────────────────────────
-- /api/cron/trend 의 각 단계(terms·views_d1·track·notify·brief)가 날짜별로 한 줄씩 남긴다.
-- 같은 날짜·단계를 다시 돌리면 덮어쓴다(attempts 증가). 단계끼리는 이 표의 상태만 보고, 서로 막지 않는다.
-- 따라잡기: step=data 는 최근 3일 중 breakout_videos 집계 대상 행이 있는데 이 표에 ok 가 없는 (job_date, step) 을 모두 처리한다.
-- running 인데 started_at 이 2분 넘게 지난 행은 함수가 강제 종료된 것으로 보고 failed(stale) 로 다룬다(다시 처리 대상).
-- track·purge 는 job_date = 실행한 날(한국 날짜), 나머지는 처리 대상 snapshot_date.
create table if not exists public.trend_jobs (
  job_date    date        not null,              -- 처리 대상 snapshot_date(한국 날짜)
  step        text        not null,              -- terms | views_d1 | track | notify | brief | purge
  status      text        not null default 'running',
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  attempts    int         not null default 1,
  detail      jsonb,                             -- 처리 건수, 사용 unit, 토큰 수 등
  error       text,
  primary key (job_date, step),
  constraint trend_jobs_status_chk check (status in ('running','ok','skipped','failed'))
);
create index if not exists trend_jobs_started_idx on public.trend_jobs (started_at desc);
alter table public.trend_jobs enable row level security;


-- ── 1. A1 급상승 키워드: 날짜별 단어 집계 (T2) ──────────────────
-- 그날 breakout_videos 집계 대상 행(맨 위 '집계 대상 행')의 제목을 토큰화해 저장한다. API 비용 0.
-- 쓰기는 replace_breakout_terms(날짜, 길이, 행 jsonb) 한 번으로(삭제+삽입이 한 트랜잭션). 30일 지나면 purge 가 지운다.
-- format 은 duration_sec 180초 이하 = shorts, 그 밖 = long (src/lib/breakout.ts SHORTS_MAX_SEC 와 같은 기준).
create table if not exists public.breakout_terms (
  snapshot_date    date   not null,
  format           text   not null,              -- long | shorts
  term             text   not null,              -- 정규화된 단어(소문자). 해시태그는 '#' 없이
  term_type        text   not null,              -- word | tag
  channel_count    int    not null default 0,    -- 그날 이 단어를 쓴 서로 다른 채널 수
  video_count      int    not null default 0,
  channel_ids      text[] not null default '{}', -- 기간 합산 때 서로 다른 채널 수를 다시 세기 위해 보관
  sample_video_ids text[] not null default '{}', -- 대표 영상 최대 3개(조회수 순)
  created_at       timestamptz not null default now(),
  primary key (snapshot_date, format, term, term_type),
  constraint breakout_terms_format_chk check (format in ('long','shorts')),
  constraint breakout_terms_type_chk   check (term_type in ('word','tag'))
);
create index if not exists breakout_terms_format_date_idx on public.breakout_terms (format, snapshot_date);
create index if not exists breakout_terms_term_idx        on public.breakout_terms (term);
alter table public.breakout_terms enable row level security;


-- ── 2. A3 조회수 추적 기록 (T5) ────────────────────────────────
-- snapshot_date = breakout_videos.snapshot_date(영상의 게시 날짜, 한국). 잰 날짜가 아니다. 잰 시각은 measured_at.
-- day_offset 1 = 수집 때 잰 값(breakout_videos 에서 복사, measured_at = 그 행의 collected_at). 다음 날 한국 18시 전에
--               수집된 행만 복사한다(재수집으로 부푼 값·늦게 잰 값 제외).
-- day_offset 3 / 7 = 게시일 3일 뒤·7일 뒤 아침에 videos.list(statistics)로 다시 잰 값
-- 행이 없음 = 아직 안 잼(측정 전). 행은 있는데 view_count 가 null = 쟀는데 응답에서 빠짐(비공개·삭제).
-- 보관: measured_at 30일 지나면 purge 가 삭제(YouTube API 통계 30일 규칙).
create table if not exists public.breakout_views (
  video_id      text        not null,
  day_offset    smallint    not null,
  snapshot_date date        not null,
  view_count    bigint,
  like_count    bigint,
  comment_count bigint,
  measured_at   timestamptz not null default now(),
  primary key (video_id, day_offset),
  constraint breakout_views_offset_chk check (day_offset in (1,3,7))
);
create index if not exists breakout_views_date_idx on public.breakout_views (snapshot_date, day_offset);
alter table public.breakout_views enable row level security;


-- ── 3. B4 오늘의 트렌드 브리핑 (T6) ────────────────────────────
-- 생성에 성공한 날만 행이 있다(실패는 trend_jobs 에 남김). 발송(메일·카카오)은 나중에 이 표만 읽으면 되게 구조화한다.
-- 발송 기능을 붙이기 전에는 소유자 검토 단계가 먼저다(제3자 제목이 프롬프트에 들어가므로). 30일 지나면 purge 가 지운다.
create table if not exists public.trend_briefings (
  snapshot_date date        primary key,
  bullets       jsonb       not null,            -- [{ "label": "포맷|제목|썸네일|주제", "text": "..." }] 3~5개
  long_note     text,                            -- 롱폼 한 줄
  shorts_note   text,                            -- 쇼츠 한 줄
  body          jsonb,                           -- 모델 출력 원본(JSON)
  model         text        not null,
  input_stats   jsonb,                           -- 입력 영상 수, 썸네일 수, 상위 단어 등
  usage         jsonb,                           -- input_tokens / output_tokens
  version       int         not null default 1,  -- 프롬프트 판 번호
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.trend_briefings enable row level security;


-- ── 4. B5·B6·C8 AI 생성 기록 (T0, T7, T8, T10) ─────────────────
-- 사용자 재열람(대화상자를 닫았다 열면 최근 결과), 남용 확인, 비용 집계용. 횟수 제한 자체는 Redis 가 맡는다.
-- input 에는 사용자 입력과 video_id·query 만 넣고 조회수·구독자 수 같은 통계는 넣지 않는다. created_at 30일 지나면 purge 가 삭제.
create table if not exists public.ai_generations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    text        not null,
  feature    text        not null,               -- remix(B5) | thumbs(B6) | trendfit(C8)
  ref_id     text,                               -- video_id 또는 키워드
  input      jsonb,
  output     jsonb,
  model      text,
  usage      jsonb,
  status     text        not null default 'ok',  -- ok | error | refused
  created_at timestamptz not null default now(),
  constraint ai_generations_feature_chk check (feature in ('remix','thumbs','trendfit')),
  constraint ai_generations_status_chk  check (status in ('ok','error','refused'))
);
create index if not exists ai_generations_user_idx    on public.ai_generations (user_id, created_at desc);
create index if not exists ai_generations_feature_idx on public.ai_generations (feature, created_at desc);
alter table public.ai_generations enable row level security;


-- ── 5. C7 관심 키워드·채널 + 사이트 알림 (T9) ──────────────────
create table if not exists public.watch_keywords (
  user_id    text        not null,
  term       text        not null,               -- 사용자가 입력한 그대로(화면 표시용)
  term_norm  text        not null,               -- 소문자 + 공백 제거(매칭용)
  created_at timestamptz not null default now(),
  primary key (user_id, term_norm)
);
create index if not exists watch_keywords_norm_idx on public.watch_keywords (term_norm);
alter table public.watch_keywords enable row level security;

-- 채널 이름·썸네일은 표시용 캐시. meta_at 30일 지나면 purge 가 비운다. 화면은 최근 breakout_videos 값 → 이 칼럼 → '채널 열기' 순으로 쓴다.
create table if not exists public.watch_channels (
  user_id       text        not null,
  channel_id    text        not null,
  channel_title text,
  channel_thumb text,
  meta_at       timestamptz not null default now(),   -- channel_title·channel_thumb 를 받은 시각
  created_at    timestamptz not null default now(),
  primary key (user_id, channel_id)
);
alter table public.watch_channels add column if not exists meta_at timestamptz not null default now();
create index if not exists watch_channels_channel_idx on public.watch_channels (channel_id);
alter table public.watch_channels enable row level security;

-- 제목·썸네일·조회수를 담으므로 created_at 30일 지나면 purge 단계가 지운다(notify 단계와 따로, 매일 실행).
create table if not exists public.notifications (
  id            bigint      generated always as identity primary key,
  user_id       text        not null,
  kind          text        not null,            -- keyword | channel
  term          text,                            -- kind=keyword 일 때 걸린 관심 키워드
  channel_id    text,
  video_id      text        not null,
  snapshot_date date        not null,
  title         text,
  thumbnail     text,
  channel_title text,
  view_count    bigint,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  constraint notifications_kind_chk check (kind in ('keyword','channel')),
  constraint notifications_once_uq unique (user_id, video_id, kind)
);
create index if not exists notifications_user_idx   on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;


-- ── 6. C8 내 채널 저장 + 하루 한 번 매칭 결과 (T10) ─────────────
-- refreshed_at 30일 지나면 purge 가 channel_title·channel_thumb·subscriber_count·recent_titles 를 비운다.
-- 비워진 행은 화면에서 '30일이 지나 다시 분석이 필요해요' + 다시 분석 버튼(7일 제한은 이미 지났으므로 바로 가능).
create table if not exists public.user_channels (
  user_id          text        primary key,
  channel_id       text        not null,
  channel_title    text,
  channel_thumb    text,
  subscriber_count bigint,
  topic_terms      text[]      not null default '{}', -- 채널 키워드 + 최근 영상 제목에서 A1 토크나이저로 뽑은 단어
  recent_titles    jsonb,                             -- 최근 30편 [{ "title", "publishedAt", "viewCount" }]
  refreshed_at     timestamptz not null default now(), -- 7일에 한 번만 다시 분석(YouTube 쿼터)
  created_at       timestamptz not null default now()
);
alter table public.user_channels enable row level security;

create table if not exists public.user_trend_matches (
  user_id       text        not null,
  snapshot_date date        not null,            -- A1 비교 기준 끝 날짜(getTrendFit 의 end). 재등록하면 그 사용자 행 전부 삭제
  items         jsonb       not null,            -- [{ "term", "reason", "covered": false }]
  method        text        not null default 'ai', -- ai | overlap(키 없음·실패 시 단어 겹침만)
  model         text,
  created_at    timestamptz not null default now(),
  primary key (user_id, snapshot_date)
);
alter table public.user_trend_matches enable row level security;


-- ═══════════════════════════════════════════════════════════════
-- RPC: PostgREST 기본 응답 상한(1,000행)을 피하려고 집계는 DB 안에서 한다.
-- 서버 코드는 getSupabase().rpc('함수명', {...}) 로 부른다.
-- ═══════════════════════════════════════════════════════════════

-- 인자 목록이 바뀐 함수의 옛 판을 지운다(처음 적용이면 아무 일 없음).
drop function if exists public.trend_rising_terms(date, text, text, int, int, int);

-- A1 기간 통계: 단어가 하나도 기준을 넘지 않아도(0행) 수집 일수를 알 수 있게 따로 돌려준다.
-- rising.ts 는 이 통계로 먼저 상태(empty·sparse·top·rising)를 가르고, 그다음 trend_rising_terms 를 부른다.
-- recent = p_end-6 ~ p_end, prior = p_end-13 ~ p_end-7. 집계 대상 행만 센다.
create or replace function public.trend_rising_window(
  p_end        date,
  p_format     text default 'long',
  p_shorts_max int  default 180
)
returns table (
  recent_days  int,
  prior_days   int,
  recent_total int,
  prior_total  int,
  hist_days    int     -- p_end-29 ~ p_end 의 수집 일수(상시어 판정용)
)
language sql
stable
set search_path = public
as $$
  select
    count(distinct bv.snapshot_date) filter (where bv.snapshot_date >  p_end - 7)::int,
    count(distinct bv.snapshot_date) filter (where bv.snapshot_date <= p_end - 7 and bv.snapshot_date > p_end - 14)::int,
    count(distinct bv.channel_id)    filter (where bv.snapshot_date >  p_end - 7)::int,
    count(distinct bv.channel_id)    filter (where bv.snapshot_date <= p_end - 7 and bv.snapshot_date > p_end - 14)::int,
    count(distinct bv.snapshot_date)::int
  from breakout_videos bv
  where bv.kind is null
    and not (bv.category_id is null and bv.outlier is null)
    and bv.snapshot_date >  p_end - 30
    and bv.snapshot_date <= p_end
    and (case when p_format = 'shorts' then bv.duration_sec <= p_shorts_max
              else bv.duration_sec > p_shorts_max end);
$$;


-- A1: 최근 7일(p_end-6 ~ p_end) vs 이전 7일(p_end-13 ~ p_end-7) 단어별 서로 다른 채널 수.
-- 정렬값 score 는 '채널 비율'의 평활 배수: ((최근+1)/최근 전체 채널) / ((이전+1)/이전 전체 채널).
-- 화면에는 score 를 보이지 않고 원본 횟수(이전 N곳 → 최근 M곳)와 수집 일수를 보인다.
-- p_mode = 'rising'(증가율 순) | 'top'(비교 데이터가 부족할 때)
-- top 모드는 '상시어'를 뺀다: 최근 30일 수집 일수(hist_days)가 p_min_hist_days 이상일 때, 그중 p_max_day_ratio 이상의
-- 날짜에 나온 단어(한국·역대급·이제 같은 일반어)는 제외하고, 남은 단어를 최근 채널 수 순으로 보인다.
-- 0행이어도 정상이다(기간 통계는 trend_rising_window 가 준다).
create or replace function public.trend_rising_terms(
  p_end            date,
  p_format         text             default 'long',
  p_mode           text             default 'rising',
  p_min_recent     int              default 3,
  p_limit          int              default 50,
  p_shorts_max     int              default 180,
  p_max_day_ratio  double precision default 0.6,
  p_min_hist_days  int              default 6
)
returns table (
  term             text,
  term_type        text,
  recent_channels  int,
  prior_channels   int,
  term_days        int,
  recent_total     int,
  prior_total      int,
  recent_days      int,
  prior_days       int,
  hist_days        int,
  score            double precision,
  sample_video_ids text[]
)
language sql
stable
set search_path = public
as $$
  with win as (
    select * from public.trend_rising_window(p_end, p_format, p_shorts_max)
  ),
  t as (
    select bt.term, bt.term_type, bt.snapshot_date, c.channel_id
    from breakout_terms bt
    cross join lateral unnest(bt.channel_ids) as c(channel_id)
    where bt.format = p_format
      and bt.snapshot_date >  p_end - 14
      and bt.snapshot_date <= p_end
  ),
  agg as (
    select
      t.term,
      t.term_type,
      count(distinct t.channel_id) filter (where t.snapshot_date >  p_end - 7)::int as recent_channels,
      count(distinct t.channel_id) filter (where t.snapshot_date <= p_end - 7)::int as prior_channels
    from t
    group by t.term, t.term_type
  ),
  hist as (
    select bt.term, bt.term_type, count(distinct bt.snapshot_date)::int as term_days
    from breakout_terms bt
    where bt.format = p_format
      and bt.snapshot_date >  p_end - 30
      and bt.snapshot_date <= p_end
    group by bt.term, bt.term_type
  )
  select
    a.term,
    a.term_type,
    a.recent_channels,
    a.prior_channels,
    coalesce(h.term_days, 0),
    w.recent_total,
    w.prior_total,
    w.recent_days,
    w.prior_days,
    w.hist_days,
    ((a.recent_channels + 1)::double precision / greatest(w.recent_total, 1))
      / ((a.prior_channels + 1)::double precision / greatest(w.prior_total, 1)) as score,
    (select bt2.sample_video_ids
       from breakout_terms bt2
      where bt2.term = a.term and bt2.term_type = a.term_type and bt2.format = p_format
        and bt2.snapshot_date > p_end - 7 and bt2.snapshot_date <= p_end
      order by bt2.snapshot_date desc
      limit 1) as sample_video_ids
  from agg a
  cross join win w
  left join hist h on h.term = a.term and h.term_type = a.term_type
  where a.recent_channels >= p_min_recent
    and not (p_mode = 'top'
             and w.hist_days >= p_min_hist_days
             and coalesce(h.term_days, 0)::double precision / greatest(w.hist_days, 1) >= p_max_day_ratio)
  order by
    case when p_mode = 'top' then a.recent_channels::double precision
         else ((a.recent_channels + 1)::double precision / greatest(w.recent_total, 1))
              / ((a.prior_channels + 1)::double precision / greatest(w.prior_total, 1)) end desc,
    a.recent_channels desc,
    a.term
  limit greatest(p_limit, 1);
$$;


-- A1 쓰기: 한 날짜·한 길이의 단어 집계를 통째로 바꾼다. 삭제와 삽입이 한 트랜잭션이라 중간에 끊겨도 반쪽 집계가 남지 않는다.
-- p_rows = [{ "term", "term_type", "channel_count", "video_count", "channel_ids": [...], "sample_video_ids": [...] }]
-- terms.ts 는 long·shorts 를 따로 두 번 부른다(요청 본문 크기를 줄이려고). 반환값 = 넣은 행 수.
create or replace function public.replace_breakout_terms(
  p_date   date,
  p_format text,
  p_rows   jsonb
)
returns int
language plpgsql
set search_path = public
as $$
declare
  n int;
begin
  if p_format not in ('long','shorts') then
    raise exception 'bad format %', p_format;
  end if;
  delete from breakout_terms where snapshot_date = p_date and format = p_format;
  insert into breakout_terms (snapshot_date, format, term, term_type, channel_count, video_count, channel_ids, sample_video_ids)
  select p_date, p_format, r.term, r.term_type,
         coalesce(r.channel_count, 0), coalesce(r.video_count, 0),
         coalesce(r.channel_ids, '{}'), coalesce(r.sample_video_ids, '{}')
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb))
       as r(term text, term_type text, channel_count int, video_count int, channel_ids text[], sample_video_ids text[]);
  get diagnostics n = row_count;
  return n;
end;
$$;


-- A2: 최근 p_days 일 브레이크아웃에 여러 날 오른 작은 채널.
-- 집계 대상 행만, 구독자는 가장 최근 날짜 값.
create or replace function public.trend_recurring_channels(
  p_end        date,
  p_days       int    default 14,
  p_max_subs   bigint default 100000,
  p_min_days   int    default 2,
  p_format     text   default 'all',
  p_limit      int    default 50,
  p_shorts_max int    default 180
)
returns table (
  channel_id       text,
  channel_title    text,
  channel_thumb    text,
  subscriber_count bigint,
  days             int,
  videos           int,
  last_date        date,
  best_outlier     double precision,
  latest_video_id  text,
  latest_title     text,
  latest_thumbnail text,
  latest_views     bigint
)
language sql
stable
set search_path = public
as $$
  with src as (
    select bv.*
    from breakout_videos bv
    where bv.kind is null
      and not (bv.category_id is null and bv.outlier is null)
      and bv.snapshot_date >  p_end - p_days
      and bv.snapshot_date <= p_end
      and (p_format = 'all'
           or (p_format = 'shorts' and bv.duration_sec <= p_shorts_max)
           or (p_format = 'long'   and bv.duration_sec >  p_shorts_max))
  ),
  agg as (
    select r.channel_id,
           count(distinct r.snapshot_date)::int as days,
           count(*)::int                        as videos,
           max(r.snapshot_date)                 as last_date,
           max(r.outlier)                       as best_outlier
    from src r
    group by r.channel_id
  ),
  latest as (
    select distinct on (r.channel_id)
           r.channel_id, r.channel_title, r.channel_thumb, r.subscriber_count,
           r.video_id, r.title, r.thumbnail, r.view_count
    from src r
    order by r.channel_id, r.snapshot_date desc, r.view_count desc
  )
  select a.channel_id, l.channel_title, l.channel_thumb, l.subscriber_count,
         a.days, a.videos, a.last_date, a.best_outlier,
         l.video_id, l.title, l.thumbnail, l.view_count
  from agg a
  join latest l on l.channel_id = a.channel_id
  where a.days >= p_min_days
    and l.subscriber_count < p_max_subs
  order by a.days desc, a.videos desc, a.last_date desc, l.subscriber_count asc
  limit greatest(p_limit, 1);
$$;


-- A3: 한 게시 날짜의 영상별 1·3·7일 조회수(가로로 펼친 값). 집계 대상 행만.
-- m1/m3/m7(측정 시각)이 null 이면 그 시점은 아직 안 잼(측정 전), m 은 있는데 v 가 null 이면 응답에서 빠진 영상(비공개·삭제).
-- classifyFlow 는 v 와 m 을 함께 받는다(rules.ts).
create or replace function public.trend_growth(
  p_date       date,
  p_format     text default 'long',
  p_shorts_max int  default 180
)
returns table (
  video_id         text,
  title            text,
  channel_id       text,
  channel_title    text,
  thumbnail        text,
  duration_sec     int,
  subscriber_count bigint,
  published_at     timestamptz,
  v1               bigint,
  v3               bigint,
  v7               bigint,
  m1               timestamptz,
  m3               timestamptz,
  m7               timestamptz
)
language sql
stable
set search_path = public
as $$
  select bv.video_id, bv.title, bv.channel_id, bv.channel_title, bv.thumbnail,
         bv.duration_sec, bv.subscriber_count, bv.published_at,
         max(w.view_count)  filter (where w.day_offset = 1) as v1,
         max(w.view_count)  filter (where w.day_offset = 3) as v3,
         max(w.view_count)  filter (where w.day_offset = 7) as v7,
         max(w.measured_at) filter (where w.day_offset = 1) as m1,
         max(w.measured_at) filter (where w.day_offset = 3) as m3,
         max(w.measured_at) filter (where w.day_offset = 7) as m7
  from breakout_videos bv
  left join breakout_views w on w.video_id = bv.video_id
  where bv.snapshot_date = p_date
    and bv.kind is null
    and not (bv.category_id is null and bv.outlier is null)
    and (p_format = 'all'
         or (p_format = 'shorts' and bv.duration_sec <= p_shorts_max)
         or (p_format = 'long'   and bv.duration_sec >  p_shorts_max))
  group by bv.video_id, bv.title, bv.channel_id, bv.channel_title, bv.thumbnail,
           bv.duration_sec, bv.subscriber_count, bv.published_at;
$$;


-- A3: 추적 값이 있는 게시 날짜 목록(날짜 칩용). p_since(보통 오늘-30) 이후 날짜만, 최근 p_limit 개.
-- 날짜 칩 규칙: has_d7 이면 라벨만, has_d3 만 있으면 '· 3일까지', 둘 다 없으면 '· 다음 날만'.
-- 기본 선택 날짜: has_d7 인 가장 최근 날짜, 없으면 가장 최근 날짜.
drop function if exists public.trend_growth_dates(int);
create or replace function public.trend_growth_dates(
  p_since date,
  p_limit int default 30
)
returns table (snapshot_date date, has_d3 boolean, has_d7 boolean)
language sql
stable
set search_path = public
as $$
  select w.snapshot_date,
         bool_or(w.day_offset = 3) as has_d3,
         bool_or(w.day_offset = 7) as has_d7
  from breakout_views w
  where w.snapshot_date >= p_since
  group by w.snapshot_date
  order by w.snapshot_date desc
  limit greatest(p_limit, 1);
$$;


-- C7: 사용자별 안 읽은 알림 수(탭 숫자용). 다섯 탭 page 모두 1회씩 부른다.
create or replace function public.notification_unread_count(p_user_id text)
returns int
language sql
stable
set search_path = public
as $$
  select count(*)::int from notifications where user_id = p_user_id and read_at is null;
$$;


-- 보관 기한 정리(purge 단계, 입력 유무와 상관없이 매일 실행). 지운·비운 행 수를 jsonb 로 돌려준다.
-- p_today = 한국 날짜 오늘. p_purge_breakout 이 true 일 때만 breakout_videos 도 지운다(기존 영상 탭의 30일 전 날짜가
-- 사라지므로 소유자 승인 뒤 켬, 환경 변수 TREND_PURGE_BREAKOUT=1).
create or replace function public.trend_purge_expired(
  p_today          date,
  p_purge_breakout boolean default false
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  cutoff_ts   timestamptz := now() - interval '30 days';
  cutoff_date date        := p_today - 30;
  n           int;
  res         jsonb       := '{}'::jsonb;
begin
  delete from breakout_views where measured_at < cutoff_ts;
  get diagnostics n = row_count; res := res || jsonb_build_object('breakout_views', n);

  delete from notifications where created_at < cutoff_ts;
  get diagnostics n = row_count; res := res || jsonb_build_object('notifications', n);

  delete from ai_generations where created_at < cutoff_ts;
  get diagnostics n = row_count; res := res || jsonb_build_object('ai_generations', n);

  delete from trend_briefings where snapshot_date < cutoff_date;
  get diagnostics n = row_count; res := res || jsonb_build_object('trend_briefings', n);

  delete from user_trend_matches where snapshot_date < cutoff_date;
  get diagnostics n = row_count; res := res || jsonb_build_object('user_trend_matches', n);

  delete from breakout_terms where snapshot_date < cutoff_date;
  get diagnostics n = row_count; res := res || jsonb_build_object('breakout_terms', n);

  update user_channels
     set channel_title = null, channel_thumb = null, subscriber_count = null, recent_titles = null
   where refreshed_at < cutoff_ts
     and (channel_title is not null or channel_thumb is not null or subscriber_count is not null or recent_titles is not null);
  get diagnostics n = row_count; res := res || jsonb_build_object('user_channels_cleared', n);

  update watch_channels
     set channel_title = null, channel_thumb = null
   where meta_at < cutoff_ts
     and (channel_title is not null or channel_thumb is not null);
  get diagnostics n = row_count; res := res || jsonb_build_object('watch_channels_cleared', n);

  if p_purge_breakout then
    delete from breakout_videos where snapshot_date < cutoff_date;
    get diagnostics n = row_count; res := res || jsonb_build_object('breakout_videos', n);
  end if;

  delete from trend_jobs where job_date < p_today - 90;
  get diagnostics n = row_count; res := res || jsonb_build_object('trend_jobs', n);

  return res;
end;
$$;


-- ── 함수 실행 권한: 서버(service role)만 ────────────────────────
revoke all on function public.trend_rising_window(date, text, int)                                from public, anon, authenticated;
revoke all on function public.trend_rising_terms(date, text, text, int, int, int, double precision, int) from public, anon, authenticated;
revoke all on function public.replace_breakout_terms(date, text, jsonb)                           from public, anon, authenticated;
revoke all on function public.trend_recurring_channels(date, int, bigint, int, text, int, int)   from public, anon, authenticated;
revoke all on function public.trend_growth(date, text, int)                                      from public, anon, authenticated;
revoke all on function public.trend_growth_dates(date, int)                                      from public, anon, authenticated;
revoke all on function public.notification_unread_count(text)                                    from public, anon, authenticated;
revoke all on function public.trend_purge_expired(date, boolean)                                 from public, anon, authenticated;

grant execute on function public.trend_rising_window(date, text, int)                                to service_role;
grant execute on function public.trend_rising_terms(date, text, text, int, int, int, double precision, int) to service_role;
grant execute on function public.replace_breakout_terms(date, text, jsonb)                           to service_role;
grant execute on function public.trend_recurring_channels(date, int, bigint, int, text, int, int)   to service_role;
grant execute on function public.trend_growth(date, text, int)                                      to service_role;
grant execute on function public.trend_growth_dates(date, int)                                      to service_role;
grant execute on function public.notification_unread_count(text)                                    to service_role;
grant execute on function public.trend_purge_expired(date, boolean)                                 to service_role;
