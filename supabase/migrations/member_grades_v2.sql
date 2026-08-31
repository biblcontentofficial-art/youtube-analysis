-- ═══════════════════════════════════════════════════════════════
-- 회원 등급 v2: 활동 5단계 + 팀비블 멤버십 분리
-- 1 새싹 · 2 브론즈(30점) · 3 실버(150점) · 4 골드(500점) · 5 다이아(1500점) · 운영자(코드 판정)
-- 점수: 글 +5(하루 3편) · 댓글 +1(하루 5개) · 받은 좋아요 +3 · 출석 +1 · 7일 연속 +10
-- ═══════════════════════════════════════════════════════════════

alter table public.community_member_grades
  add column if not exists points      int     not null default 0,
  add column if not exists is_teambibl boolean not null default false;

-- v1 데이터 이전 (최초 1회만 동작 — points 컬럼이 아직 0인 행이 v1 잔재다)
-- v2 적용 후 실버(grade 3)가 팀비블로 오염되지 않도록 points = 0 조건을 함께 건다.
update public.community_member_grades
   set is_teambibl = true
 where grade = 3 and points = 0 and granted_by is distinct from 'auto';
update public.community_member_grades
   set grade = 1
 where grade between 2 and 3 and points = 0;

comment on column public.community_member_grades.grade       is '활동 등급 1 새싹~5 다이아 (점수로 자동 승급)';
comment on column public.community_member_grades.points      is '누적 활동 점수 (본인 방문 시 재계산)';
comment on column public.community_member_grades.is_teambibl is '팀비블 수강생 여부 (등급과 별개, 운영자 수동 지정)';
