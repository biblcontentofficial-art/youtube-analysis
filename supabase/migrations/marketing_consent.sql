-- 마케팅 정보 수신 동의 (가입/로그인 시 선택 동의 수집)
-- marketing_consent_at IS NULL = 아직 의사표시를 받은 적 없음
alter table public.profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;

comment on column public.profiles.marketing_consent is '마케팅 정보 수신 동의 여부 (선택 동의)';
comment on column public.profiles.marketing_consent_at is '동의/거부 의사표시 시각 (null이면 미확인)';
