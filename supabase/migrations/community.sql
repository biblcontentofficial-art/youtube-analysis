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

-- ── 기본 게시판 시드 (네이버 카페 businessblack 메뉴 구조 그대로) ──
-- 이름·그룹·순서·권한은 /community/admin 에서 언제든 수정 가능하다.
insert into public.community_boards (slug, name, description, group_name, sort_order, read_role, write_role, allow_files)
values
  -- 비블 | 환영합니다
  ('column',             '비블 bibl 칼럼',        '비블이 직접 쓰는 유튜브·사업 칼럼',            '비블 | 환영합니다',        10,  'all',    'staff',  false),
  ('notice',             '공지사항 (필독)',        '커뮤니티 운영 공지 · 꼭 읽어주세요',           '비블 | 환영합니다',        20,  'all',    'staff',  false),
  ('greeting',           '가입인사',              '오신 것을 환영합니다. 인사 남겨주세요',        '비블 | 환영합니다',        30,  'all',    'member', false),
  ('level-up',           '등업게시판',            '활동 등급 신청',                            '비블 | 환영합니다',        40,  'all',    'member', false),
  ('results',            '성과를 알려주세요',      '채널 성장·매출 성과를 공유해요',              '비블 | 환영합니다',        50,  'all',    'member', false),
  ('coffee-chat',        '비블 커피챗 신청',       '비블과 편하게 이야기 나눠요',                 '비블 | 환영합니다',        60,  'all',    'member', false),
  ('agency-inquiry',     '유튜브 채널 대행 문의',   '채널 운영 대행이 필요하신 분',                '비블 | 환영합니다',        70,  'all',    'member', false),
  ('consulting-inquiry', '1:1 유튜브 컨설팅 문의',  '1:1 맞춤 컨설팅 문의',                      '비블 | 환영합니다',        80,  'all',    'member', false),
  ('incubating',         '유튜브 인큐베이팅 지원하세요!', '비블과 함께할 분을 모집합니다',         '비블 | 환영합니다',        90,  'all',    'member', false),

  -- 비블 | 유튜브 무료 자료
  ('bibl-lab',           '유튜브 분석 툴 BIBL LAB', '비블랩 분석 도구 사용법',                    '비블 | 유튜브 무료 자료',  110, 'member', 'staff',  true),
  ('ai-coding',          '유튜브 AI 자동화 & 코딩', 'AI·자동화로 제작 시간 줄이기',               '비블 | 유튜브 무료 자료',  120, 'member', 'staff',  true),
  ('ebook',              '비블 유튜브 전자책',      '전자책 다운로드',                           '비블 | 유튜브 무료 자료',  130, 'member', 'staff',  true),
  ('faq-tips',           '자주 묻는 질문 & 꿀팁',   '자주 나오는 질문과 실전 꿀팁',                '비블 | 유튜브 무료 자료',  140, 'all',    'staff',  false),
  ('resources',          '유튜브&기타 자료',        '템플릿·체크리스트 등 실무 자료',              '비블 | 유튜브 무료 자료',  150, 'member', 'staff',  true),
  ('premiere-vod',       '프리미어프로VOD',        '편집 강의 VOD',                             '비블 | 유튜브 무료 자료',  160, 'member', 'staff',  true),
  ('account-security',   '유튜브 계정 해킹 대처법',  '계정 보안과 사고 대응 가이드',                '비블 | 유튜브 무료 자료',  170, 'all',    'staff',  false),

  -- 비블 | 함께 성장해요
  ('challenge',          '매일 유튜브 챌린지',      '매일 인증하며 습관 만들기',                   '비블 | 함께 성장해요',     210, 'all',    'member', false),
  ('qna',                '유튜브 고민 있어요 Q&A',  '막히는 부분을 물어보세요',                    '비블 | 함께 성장해요',     220, 'all',    'member', false),
  ('study',              '지역별 스터디모임',       '가까운 사람들끼리 모여요',                    '비블 | 함께 성장해요',     230, 'all',    'member', false),
  ('market',             '공구/판매/협업/광고',     '공동구매·협업·광고 제안',                    '비블 | 함께 성장해요',     240, 'all',    'member', false),
  ('jobs',               '구인/구직',              '편집자·PD·마케터 구인구직',                  '비블 | 함께 성장해요',     250, 'all',    'member', false),

  -- 팀비블 Team bibl 공간
  ('teambibl-apply',     '팀비블 1:1 강의 신청',    '1:1 강의 신청 접수',                        '팀비블 Team bibl 공간',   310, 'member', 'member', false),
  ('teambibl-guide',     '팀비블은 이렇게 진행됩니다', '진행 방식 안내',                          '팀비블 Team bibl 공간',   320, 'member', 'staff',  false),
  ('teambibl-notice',    '팀비블 과제공지방',       '주차별 과제 공지',                          '팀비블 Team bibl 공간',   330, 'member', 'staff',  false),
  ('teambibl-submit',    '팀비블 과제제출방',       '과제 제출',                                 '팀비블 Team bibl 공간',   340, 'member', 'member', true),
  ('teambibl-files',     '핵심자료 다운로드',       '팀비블 핵심 자료',                          '팀비블 Team bibl 공간',   350, 'member', 'staff',  true),
  ('teambibl-meeting',   '팀비블 1:1 미팅예약 (30분)', '30분 미팅 예약',                        '팀비블 Team bibl 공간',   360, 'member', 'member', false)
on conflict (slug) do nothing;
