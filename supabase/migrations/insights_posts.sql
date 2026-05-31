-- ─────────────────────────────────────────────────────────────────────
-- insights / 비즈니스 칼럼 (뉴스레터 형태) 게시물 테이블
-- ─────────────────────────────────────────────────────────────────────
-- 작성/수정/삭제: 서버(service_role key)만 — RLS 우회됨
-- 공개 readers: status='published' 만 읽기 가능
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- 1) posts 테이블
create table if not exists public.posts (
  id            uuid          primary key default gen_random_uuid(),
  slug          text          not null unique,
  title         text          not null,
  subtitle      text,
  cover_image   text,
  -- 블록 기반 컨텐츠 (JSON 배열) — 노션 스타일
  content       jsonb         not null default '[]'::jsonb,
  -- SEO
  description   text,
  tags          text[]        default '{}',
  -- 발행 상태
  status        text          not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  -- 통계
  view_count    integer       not null default 0,
  -- 작성자
  author_id     uuid,
  author_name   text          default '비블',
  -- 타임스탬프
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc nulls last);
create index if not exists posts_slug_idx on public.posts (slug);

-- 2) updated_at 자동 갱신 트리거
create or replace function public.posts_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at_trg on public.posts;
create trigger posts_updated_at_trg
  before update on public.posts
  for each row execute function public.posts_set_updated_at();

-- 3) RLS: 공개 사용자는 발행글만 읽기 (쓰기는 service_role 서버가 RLS 우회)
alter table public.posts enable row level security;
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts
  for select using (status = 'published');

-- 4) Storage bucket: post-media (이미지/영상 업로드, 공개)
insert into storage.buckets (id, name, public)
  values ('post-media', 'post-media', true)
  on conflict (id) do nothing;

-- 5) Storage: 공개 읽기 정책
drop policy if exists "public read post-media" on storage.objects;
create policy "public read post-media" on storage.objects
  for select using (bucket_id = 'post-media');
