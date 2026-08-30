-- ═══════════════════════════════════════════════════════════════
-- 커뮤니티 회원 등급제 (4단계)
-- 1 새싹(가입인사만) · 2 크리에이터(자동 등업) · 3 팀비블(수동 부여) · 4 운영진(코드 판정)
-- 자동 등업 조건: 게시글 1 · 댓글 4 · 방문 4일 · 좋아요 10회
-- ═══════════════════════════════════════════════════════════════

-- 회원 등급 (행이 없으면 새싹 1단계)
create table if not exists public.community_member_grades (
  user_id    uuid primary key,
  grade      int  not null default 1,     -- 1 새싹 | 2 크리에이터 | 3 팀비블
  granted_by text,                        -- 'auto' 또는 부여한 운영진 이메일
  updated_at timestamptz not null default now()
);

-- 방문 기록 (하루 1행, 등업 조건 "방문 N일" 집계용)
create table if not exists public.community_visits (
  user_id    uuid not null,
  visit_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, visit_date)
);

alter table public.community_member_grades enable row level security;
alter table public.community_visits        enable row level security;

-- 게시판 쓰기 권한을 등급제에 맞게 조정
-- 가입인사·등업게시판: 새싹부터 (첫 게시글을 쓰고 등업 문의를 남길 곳)
update public.community_boards set write_role = 'all' where slug in ('greeting', 'levelup');
-- 팀비블 공간의 회원 작성 게시판: 팀비블(3단계)부터
update public.community_boards set write_role = 'teambibl'
 where slug in ('teambibl-class', 'teambibl-submit', 'teambibl-meeting');
