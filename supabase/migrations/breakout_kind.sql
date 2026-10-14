-- 브레이크아웃: 뉴스·정치 / 홈쇼핑 / 이슈 채널 표시(화면의 '제외' 필터용)
alter table public.breakout_videos add column if not exists category_id text;
alter table public.breakout_videos add column if not exists kind text; -- news | shopping | issue | null(일반)
create index if not exists breakout_videos_date_kind_idx on public.breakout_videos (snapshot_date, kind);
