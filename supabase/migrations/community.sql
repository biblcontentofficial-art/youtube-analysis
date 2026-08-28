-- ═══════════════════════════════════════════════════════════════
-- 비블 커뮤니티 (자체 카페) 스키마
-- 게시판 · 게시글 · 댓글 · 좋아요 · 첨부파일(자료실)
-- 권한은 애플리케이션 코드에서 검사한다 (서비스 롤 키 사용, RLS는 anon 차단용)
-- ═══════════════════════════════════════════════════════════════

-- ── 게시판 ──────────────────────────────────────────────────────
create table if not exists public.community_boards (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  group_name  text not null default '커뮤니티',   -- 사이드바 그룹 (공지 / 자료실 / 소통 …)
  sort_order  int  not null default 0,
  read_role   text not null default 'all',        -- all | member
  write_role  text not null default 'member',     -- member | staff
  allow_files boolean not null default false,     -- 자료실(첨부 허용) 여부
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists community_boards_sort_idx on public.community_boards (group_name, sort_order);

-- ── 게시글 ──────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references public.community_boards(id) on delete cascade,
  author_id     uuid,                              -- auth.users.id
  author_name   text not null default '비블 회원',
  title         text not null,
  content       text not null default '',
  is_notice     boolean not null default false,    -- 상단 고정 공지
  status        text not null default 'published', -- published | deleted
  view_count    int not null default 0,
  like_count    int not null default 0,
  comment_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists community_posts_board_idx   on public.community_posts (board_id, created_at desc);
create index if not exists community_posts_author_idx  on public.community_posts (author_id);
create index if not exists community_posts_status_idx  on public.community_posts (status);
-- 게시판별 글 개수 집계(community_board_counts)용 복합 인덱스
create index if not exists community_posts_status_board_idx on public.community_posts (status, board_id);

-- ── 댓글 ────────────────────────────────────────────────────────
create table if not exists public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  parent_id   uuid references public.community_comments(id) on delete cascade, -- 대댓글
  author_id   uuid,
  author_name text not null default '비블 회원',
  content     text not null,
  status      text not null default 'published',  -- published | deleted
  created_at  timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

-- ── 좋아요 ──────────────────────────────────────────────────────
create table if not exists public.community_post_likes (
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── 첨부파일 (자료실 다운로드) ──────────────────────────────────
create table if not exists public.community_attachments (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.community_posts(id) on delete cascade,
  file_name      text not null,
  file_size      bigint not null default 0,
  mime_type      text,
  storage_path   text not null,                    -- community-files 버킷 내 경로
  download_count int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists community_attachments_post_idx on public.community_attachments (post_id);

-- ── updated_at 자동 갱신 ────────────────────────────────────────
create or replace function public.community_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists community_boards_updated_at on public.community_boards;
create trigger community_boards_updated_at before update on public.community_boards
  for each row execute function public.community_set_updated_at();

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at before update on public.community_posts
  for each row execute function public.community_set_updated_at();

-- ── 카운터 원자적 증가 (조회수·다운로드수 경쟁 조건 방지) ──────
create or replace function public.community_increment_view(p_post_id uuid)
returns void language sql as $$
  update public.community_posts set view_count = view_count + 1 where id = p_post_id;
$$;

create or replace function public.community_increment_download(p_attachment_id uuid)
returns void language sql as $$
  update public.community_attachments set download_count = download_count + 1 where id = p_attachment_id;
$$;

-- ── 게시판별 글 개수 집계 (홈 카드) ─────────────────────────────
-- 행을 끌어와 애플리케이션에서 세면 글이 늘어날수록 숫자가 굳으므로 DB에서 집계한다.
create or replace function public.community_board_counts()
returns table (board_id uuid, cnt bigint) language sql stable as $$
  select p.board_id, count(*)::bigint
    from public.community_posts p
   where p.status = 'published'
   group by p.board_id;
$$;

-- ── 멤버 포인트 랭킹 (좋아요 받은 수 = 점수) ────────────────────
-- p_since 가 null 이면 전체 기간. 레벨 산정은 전체 기간 점수 기준.
create or replace function public.community_member_ranking(p_since timestamptz default null)
returns table (author_id uuid, author_name text, points bigint) language sql stable as $$
  select p.author_id, max(p.author_name), count(*)::bigint
    from public.community_post_likes l
    join public.community_posts p on p.id = l.post_id
   where p.author_id is not null
     and p.status = 'published'
     and (p_since is null or l.created_at >= p_since)
   group by p.author_id
   order by count(*) desc;
$$;

-- 댓글 수 동기화 (댓글 추가·삭제 시 게시글 카운터 갱신)
create or replace function public.community_sync_comment_count()
returns trigger language plpgsql as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.community_posts
     set comment_count = (
       select count(*) from public.community_comments
        where post_id = target and status = 'published'
     )
   where id = target;
  return null;
end $$;

drop trigger if exists community_comments_count on public.community_comments;
create trigger community_comments_count
  after insert or update or delete on public.community_comments
  for each row execute function public.community_sync_comment_count();

-- 좋아요 수 동기화
create or replace function public.community_sync_like_count()
returns trigger language plpgsql as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.community_posts
     set like_count = (select count(*) from public.community_post_likes where post_id = target)
   where id = target;
  return null;
end $$;

drop trigger if exists community_likes_count on public.community_post_likes;
create trigger community_likes_count
  after insert or delete on public.community_post_likes
  for each row execute function public.community_sync_like_count();

-- ── RLS: anon 키 차단 (서버는 서비스 롤로 우회) ─────────────────
alter table public.community_boards      enable row level security;
alter table public.community_posts       enable row level security;
alter table public.community_comments    enable row level security;
alter table public.community_post_likes  enable row level security;
alter table public.community_attachments enable row level security;

-- ── 첨부파일 저장소 (비공개 버킷 + 서명 URL로만 다운로드) ───────
insert into storage.buckets (id, name, public)
values ('community-files', 'community-files', false)
on conflict (id) do nothing;

-- ── 기본 카테고리 시드 (Skool형 통합 피드 · 레퍼런스: geekus.kr) ──
-- 게시판 = 피드의 카테고리 칩. 이름·순서·권한은 /community/admin 에서 수정 가능.
-- 커뮤니티 전체가 비블랩 로그인 회원 전용이므로 read_role 은 'all' 로 둔다.
insert into public.community_boards (slug, name, description, group_name, sort_order, read_role, write_role, allow_files)
values
  ('notice',   '공지사항',    '비블 커뮤니티 운영 공지',                 '카테고리', 10, 'all', 'staff',  false),
  ('greeting', '자기소개',    '처음 오셨다면 인사 남겨주세요',            '카테고리', 20, 'all', 'member', false),
  ('column',   '비블 칼럼',   '비블이 직접 쓰는 유튜브·사업 칼럼',        '카테고리', 30, 'all', 'staff',  false),
  ('resource', '유튜브 자료', '템플릿·체크리스트·전자책 다운로드',        '카테고리', 40, 'all', 'staff',  true),
  ('free',     '자유 게시판', '유튜브·사업 이야기를 자유롭게',            '카테고리', 50, 'all', 'member', false),
  ('qna',      '질문답변',    '막히는 부분을 물어보세요',                '카테고리', 60, 'all', 'member', false),
  ('review',   '성과 후기',   '채널 성장·매출 성과를 공유해요',           '카테고리', 70, 'all', 'member', false)
on conflict (slug) do nothing;
