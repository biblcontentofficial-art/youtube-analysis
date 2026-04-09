/**
 * Supabase Auth 헬퍼
 * Clerk의 auth(), currentUser(), clerkClient().users.updateUser() 를 대체
 */
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";

// ─── 서버 컴포넌트 / API 라우트에서 사용자 ID 가져오기 ───────────────
export async function auth(): Promise<{ userId: string | null }> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return { userId: user?.id ?? null };
  } catch {
    return { userId: null };
  }
}

// ─── 현재 로그인 사용자 전체 정보 ───────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  imageUrl: string | null;
  plan: string;
}

export async function currentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // profiles 테이블에서 plan 조회
    const plan = await getUserPlan(user.id);

    return {
      id: user.id,
      email: user.email ?? "",
      firstName: user.user_metadata?.full_name?.split(" ")[0] ??
                 user.user_metadata?.name?.split(" ")[0] ?? null,
      imageUrl: user.user_metadata?.avatar_url ??
                user.user_metadata?.picture ?? null,
      plan,
    };
  } catch {
    return null;
  }
}

// ─── 사용자 플랜 조회 ─────────────────────────────────────────────
export async function getUserPlan(userId: string): Promise<string> {
  const db = getSupabase();
  if (!db) return "free";

  try {
    const { data } = await db
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();
    return data?.plan ?? "free";
  } catch {
    return "free";
  }
}

// ─── 사용자 플랜 업데이트 (결제 후 호출) ──────────────────────────
export async function updateUserPlan(userId: string, plan: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db
    .from("profiles")
    .upsert(
      { id: userId, plan, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
}

// ─── 사용자 삭제 ─────────────────────────────────────────────────
export async function deleteAuthUser(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  // Supabase Admin API로 auth 유저 삭제
  await db.auth.admin.deleteUser(userId);
}

// ─── 이메일로 기존 유저 데이터 마이그레이션 ───────────────────────
export async function migrateExistingUser(newUserId: string, email: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  // profiles에 이미 존재하면 스킵
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .eq("id", newUserId)
    .single();
  if (existing) return;

  // 이메일로 기존 subscriptions 데이터 찾기 (Clerk user_id로 저장된)
  // user_email_map 테이블에서 old_user_id 조회
  const { data: mapping } = await db
    .from("user_email_map")
    .select("old_user_id")
    .eq("email", email)
    .single();

  const oldUserId = mapping?.old_user_id;
  let plan = "free";

  if (oldUserId) {
    // 기존 subscription에서 plan 가져오기
    const { data: sub } = await db
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", oldUserId)
      .eq("status", "active")
      .single();

    if (sub?.plan) {
      plan = sub.plan;
    }

    // 모든 테이블의 user_id를 새 ID로 업데이트
    const tables = [
      "subscriptions",
      "payments",
      "search_history",
      "saved_videos",
      "threads_connections",
      "saved_threads",
    ];

    for (const table of tables) {
      await db.from(table).update({ user_id: newUserId }).eq("user_id", oldUserId);
    }

    // 매핑 테이블 업데이트
    await db
      .from("user_email_map")
      .update({ new_user_id: newUserId, migrated_at: new Date().toISOString() })
      .eq("email", email);
  }

  // profiles 생성
  await db.from("profiles").upsert({
    id: newUserId,
    email,
    plan,
    clerk_user_id: oldUserId ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
}
