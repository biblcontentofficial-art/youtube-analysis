-- 브레이크아웃: 매일 수집하는 "구독자 대비 조회수가 잘 나온 영상" 스냅샷
-- 날짜(snapshot_date, 한국 시간) 하나에 그날 게시된 영상들이 들어간다. 같은 날 다시 수집하면 덮어쓴다.
create table if not exists public.breakout_videos (
  snapshot_date  date        not null,
  video_id       text        not null,
  title          text        not null,
  channel_id     text        not null,
  channel_title  text        not null,
  channel_thumb  text,
  thumbnail      text,
  published_at   timestamptz not null,
  duration_sec   int         not null default 0,
  view_count     bigint      not null default 0,
  subscriber_count bigint    not null default 0,
  ratio          double precision not null default 0, -- 조회수 ÷ 구독자 (정렬·필터용, 화면에 표시하지 않음)
  collected_at   timestamptz not null default now(),
  primary key (snapshot_date, video_id)
);

create index if not exists breakout_videos_date_ratio_idx on public.breakout_videos (snapshot_date, ratio desc);
create index if not exists breakout_videos_date_views_idx on public.breakout_videos (snapshot_date, view_count desc);

-- 서버(service role)만 읽고 쓴다
alter table public.breakout_videos enable row level security;
