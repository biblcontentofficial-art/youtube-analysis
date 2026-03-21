/**
 * 어드민 이메일 검사 — 환경변수 ADMIN_EMAILS (콤마 구분)
 * fallback: bibl.content.official@gmail.com
 */
export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS;
  if (env) return env.split(",").map((e) => e.trim()).filter(Boolean);
  return ["bibl.content.official@gmail.com"];
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email);
}
