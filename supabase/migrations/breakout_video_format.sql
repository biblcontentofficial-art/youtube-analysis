-- 브레이크아웃: 영상 형태(가로 롱폼만 보이기 위해). 2026-10-16 소유자 결정: 숏폼·세로·라이브 제외
-- long(가로·3분 초과·라이브 아님) | shorts(3분 이하) | vertical(3분 넘는 세로) | live(라이브·다시보기)
alter table public.breakout_videos add column if not exists video_format text;
create index if not exists breakout_videos_date_format_idx on public.breakout_videos (snapshot_date, video_format);
