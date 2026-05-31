-- ─────────────────────────────────────────────────────────────────────
-- insights / 비즈니스 칼럼 (뉴스레터 형태) 게시물 테이블
-- ─────────────────────────────────────────────────────────────────────
-- 작성자: 어드민 only (RLS 없이 service_role key 사용)
-- 공개 readers: 모두 (status='published' 만 노출)
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id            uuid          primary key default gen_random_uuid(),
  slug          text          not null unique,
  title         text          not null,
  subtitle      text,
  cover_image   text,
  -- 블록 기반 컨텐츠 (JSON 배열) — 노션 스타일
  -- [{ type: "paragraph"|"heading"|"image"|"video"|"youtube"|"divider"|"quote"|"code", ...props }]
  content       jsonb         not null default '[]'::jsonb,
  -- SEO
  description   text,                          -- meta description / og:description
  tags          text[]        default '{}',
  -- 발행 상태
  status        text          not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  -- 통계
  view_count    integer       not null default 0,
  -- 작성자 (admin user id)
  author_id     uuid,
  author_name   text          default '비블',
  -- 타임스탬프
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc nulls last);

create index if not exists posts_slug_idx on public.posts (slug);

-- updated_at 자동 갱신 트리거
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

-- ─────────────────────────────────────────────────────────────────────
-- Storage bucket: post-media (이미지/영상 업로드)
-- ─────────────────────────────────────────────────────────────────────
-- NOTE: 이 부분은 Supabase Dashboard에서 수동으로도 가능
insert into storage.buckets (id, name, public)
  values ('post-media', 'post-media', true)
  on conflict (id) do nothing;
