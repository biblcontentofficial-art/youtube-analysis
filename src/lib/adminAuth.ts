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
