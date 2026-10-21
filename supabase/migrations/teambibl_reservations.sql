-- ═══════════════════════════════════════════════════════════════
-- 팀비블 사전예약 명단 (소유자 요청 2026-10-21: 4기 마감, 5기 사전예약)
-- /api/studio/teambibl-reserve 가 메일 발송과 함께 여기에 한 줄씩 저장한다(best-effort).
-- 이 테이블이 없어도 접수·메일은 그대로 동작한다. 명단을 DB 로도 남기고 싶을 때만 적용.
--
-- 적용: 소유자가 Supabase SQL Editor 에서 직접 실행한다. 여러 번 실행해도 같은 결과.
-- 읽기·쓰기는 서버(service role)만. anon·authenticated 정책은 만들지 않는다(RLS 켜고 정책 없음 = 막힘).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.teambibl_reservations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  cohort          int  not null default 5,
  name            text not null,
  phone           text not null,
  age             text not null,
  topic           text not null,
  status          text not null,   -- 운영 중 | 준비 중
  youtube_url     text,
  privacy_consent text not null
);

create index if not exists teambibl_reservations_cohort_created_idx
  on public.teambibl_reservations (cohort, created_at desc);

alter table public.teambibl_reservations enable row level security;

-- 확인(읽기만)
-- select created_at, name, phone, age, topic, status, youtube_url from public.teambibl_reservations order by created_at desc;
