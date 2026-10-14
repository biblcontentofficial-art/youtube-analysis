-- 브레이크아웃: 채널 평균 대비 조회수 배수(아웃라이어)
-- channel_avg_views = 채널 누적 조회수 ÷ 영상 수, outlier = 조회수 ÷ channel_avg_views
alter table public.breakout_videos add column if not exists channel_avg_views double precision;
alter table public.breakout_videos add column if not exists outlier double precision;
create index if not exists breakout_videos_date_outlier_idx on public.breakout_videos (snapshot_date, outlier desc nulls last);
