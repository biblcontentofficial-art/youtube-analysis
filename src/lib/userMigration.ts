import { getSupabase } from "./supabase";

const MIGRATION_TABLES = [
  "subscriptions",
  "payments",
  "search_history",
  "saved_videos",
  "threads_connections",
  "saved_threads",
] as const;

/** Supabase의 모든 테이블에서 old_user_id → new_user_id 업데이트 */
export async function migrateUserData(oldUserId: string, newUserId: string): Promise<{ table: string; error?: string }[]> {
  const db = getSupabase();
  if (!db) return [];

  const results = [];
  for (const table of MIGRATION_TABLES) {
    const { error } = await db
      .from(table)
      .update({ user_id: newUserId })
      .eq("user_id", oldUserId);
    results.push({ table, error: error?.message });
    if (error) console.error(`[Migration] ${table} error:`, error.message);
    else console.log(`[Migration] ${table}: ${oldUserId} → ${newUserId} OK`);
  }
  return results;
}

/** email로 old_user_id 조회 (미이전 유저만) */
export async function getOldUserIdByEmail(email: string): Promise<string | null> {
  const db = getSupabase();
  if (!db) return null;

  const { data } = await db
    .from("user_email_map")
    .select("old_user_id")
    .eq("email", email)
    .is("migrated_at", null)
    .maybeSingle();

  return data?.old_user_id ?? null;
}

/** 마이그레이션 완료 처리 */
export async function markUserMigrated(email: string, newUserId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db
    .from("user_email_map")
    .update({ new_user_id: newUserId, migrated_at: new Date().toISOString() })
    .eq("email", email);
}
