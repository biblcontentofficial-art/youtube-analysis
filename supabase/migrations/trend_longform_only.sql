-- ═══════════════════════════════════════════════════════════════
-- 브레이크아웃 모든 탭 = 가로 롱폼 전용 (소유자 결정 2026-10-16)
-- 급상승 키워드 · 지금 크는 채널 · 성장 추적의 집계 RPC 가 쇼츠·세로·라이브를 빼고 가로 롱폼만 센다.
--
-- 바꾸는 함수(인자·반환 타입은 trend_dev.sql 과 똑같다. 서버 코드 호출은 그대로 동작한다)
--  - trend_rising_window(date, text, int)                         A1 기간 통계(trend_rising_terms 가 안에서 부른다)
--  - trend_recurring_channels(date, int, bigint, int, text, int, int)  A2 지금 크는 채널
--  - trend_growth(date, text, int)                                A3 성장 추적
--  trend_rising_terms 는 breakout_terms(terms 단계가 가로 롱폼만 써 둔다)만 읽으므로 바꾸지 않는다.
--
-- 영상 형태 판정(src/lib/trend/rules.ts isLongFormRow 와 같은 조건)
--  coalesce(bv.video_format, case when bv.duration_sec > p_shorts_max then 'long' else 'shorts' end)
--  video_format(long | shorts | vertical | live, breakout_video_format.sql)이 있으면 그 값, 없으면(칼럼 추가 전 수집분) 길이로만.
--  예전 판정(duration_sec > 180 이면 long)은 3분 넘는 세로 영상·라이브 다시보기를 롱폼으로 셌다.
--
-- p_format 값
--  - 'long'  : 가로 롱폼만(서버 코드는 이제 언제나 'long' 을 넘긴다)
--  - 'all'   : 'long' 과 같다(가로 롱폼만). 예전 기본값이라 남겨 둔다
--  - 'shorts': video_format 이 shorts(3분 이하)인 행만. 새 화면은 부르지 않는다.
--              이 SQL 을 먼저 적용하고 배포가 늦어져도 예전 화면의 쇼츠 칩이 오류 없이 보이게 남겨 둔다
--
-- 집계 대상 행의 나머지 조건은 그대로: kind is null 이고 분류 칼럼이 생기기 전 수집 행이 아닌 행
--  SQL 조건: bv.kind is null and not (bv.category_id is null and bv.outlier is null)
--
-- 적용: 소유자가 Supabase SQL Editor 에서 직접 실행한다. 여러 번 실행해도 같은 결과(create or replace).
-- 선행: trend_dev.sql, breakout_video_format.sql(video_format 칼럼)
-- ═══════════════════════════════════════════════════════════════


-- A1 기간 통계: recent = p_end-6 ~ p_end, prior = p_end-13 ~ p_end-7, hist = p_end-29 ~ p_end. 집계 대상 가로 롱폼 행만 센다.
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
    and coalesce(bv.video_format, case when bv.duration_sec > p_shorts_max then 'long' else 'shorts' end)
        = (case when p_format = 'shorts' then 'shorts' else 'long' end);
$$;


-- A2: 최근 p_days 일 브레이크아웃에 여러 날 오른 작은 채널. 집계 대상 가로 롱폼 행만, 구독자는 가장 최근 날짜 값.
-- p_format 'all' 도 가로 롱폼만 센다(쇼츠·세로·라이브가 등장 일수·영상 수를 부풀리지 않게).
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
      and coalesce(bv.video_format, case when bv.duration_sec > p_shorts_max then 'long' else 'shorts' end)
          = (case when p_format = 'shorts' then 'shorts' else 'long' end)
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


-- A3: 한 게시 날짜의 영상별 1·3·7일 조회수(가로로 펼친 값). 집계 대상 가로 롱폼 행만.
-- m1/m3/m7(측정 시각)이 null 이면 그 시점은 아직 안 잼(측정 전), m 은 있는데 v 가 null 이면 응답에서 빠진 영상(비공개·삭제).
-- track 단계도 이제 가로 롱폼만 다시 재므로(쿼터 절약), 쇼츠·세로·라이브를 보이면 '측정 전'만 남는다. 그래서 여기서도 뺀다.
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
    and coalesce(bv.video_format, case when bv.duration_sec > p_shorts_max then 'long' else 'shorts' end)
        = (case when p_format = 'shorts' then 'shorts' else 'long' end)
  group by bv.video_id, bv.title, bv.channel_id, bv.channel_title, bv.thumbnail,
           bv.duration_sec, bv.subscriber_count, bv.published_at;
$$;


-- ── 권한: anon·authenticated 실행 권한을 빼고 service_role 만 (trend_dev.sql 과 같은 방식) ──
-- create or replace 는 기존 권한을 유지하지만, 처음 만드는 경우까지 같은 결과가 되도록 다시 건다.
revoke all on function public.trend_rising_window(date, text, int)                              from public, anon, authenticated;
revoke all on function public.trend_recurring_channels(date, int, bigint, int, text, int, int) from public, anon, authenticated;
revoke all on function public.trend_growth(date, text, int)                                    from public, anon, authenticated;

grant execute on function public.trend_rising_window(date, text, int)                              to service_role;
grant execute on function public.trend_recurring_channels(date, int, bigint, int, text, int, int) to service_role;
grant execute on function public.trend_growth(date, text, int)                                    to service_role;


-- ── 적용 뒤 확인(읽기만) ──────────────────────────────────────────
-- select * from public.trend_rising_window(current_date - 1, 'long', 180);
-- select count(*) from public.trend_recurring_channels(current_date - 1, 14, 100000, 2, 'long', 50, 180);
-- select count(*) from public.trend_growth(current_date - 3, 'long', 180);
