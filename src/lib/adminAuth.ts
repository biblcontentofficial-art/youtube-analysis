/**
 * 어드민 권한 검사
 *
 * 다음 중 하나에 해당하면 어드민 권한을 가진다:
 * 1) ADMIN_EMAILS 환경변수에 등록된 이메일
 * 2) 사용자 plan === "admin"
 *
 * fallback admin email: bibl.content.official@gmail.com
 */
export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS;
  if (env) return env.split(",").map((e) => e.trim()).filter(Boolean);
  return ["bibl.content.official@gmail.com"];
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email);
}

export function isAdminPlan(plan: string | null | undefined): boolean {
  return plan === "admin";
}

/** 이메일 또는 plan === "admin" 인 사용자에게 권한 부여 */
export function isAdmin(params: { email?: string | null; plan?: string | null }): boolean {
  if (params.email && isAdminEmail(params.email)) return true;
  if (params.plan && isAdminPlan(params.plan)) return true;
  return false;
}

/**
 * 인사이트(비블의 인사이트) 글쓰기 전용 에디터 이메일.
 * INSIGHT_EDITORS 환경변수에 쉼표로 나열된 이메일.
 * 이 권한은 /insights 글쓰기만 허용하며 /admin(결제·회원관리)에는 접근하지 못한다.
 */
export function getInsightEditorEmails(): string[] {
  const env = process.env.INSIGHT_EDITORS;
  if (!env) return [];
  return env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * 인사이트 글을 작성/수정/삭제할 수 있는 권한.
 * - 전체 관리자(isAdmin)는 당연히 가능
 * - INSIGHT_EDITORS에 등록된 이메일도 가능 (단, 글쓰기 권한만)
 */
export function canEditInsights(params: { email?: string | null; plan?: string | null }): boolean {
  if (isAdmin(params)) return true;
  if (params.email && getInsightEditorEmails().includes(params.email.toLowerCase())) return true;
  return false;
}
