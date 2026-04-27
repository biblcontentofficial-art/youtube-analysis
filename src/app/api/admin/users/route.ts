import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  plan: string;
  createdAt: number;
  lastActiveAt: number | null;
  migrated?: boolean; // true = Production Clerk 가입 완료, false = 아직 Dev 상태
  avatarUrl: string | null;
};

export async function GET() {
  // Check if the requesting user is an admin
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email ?? "";
  if (!isAdmin({ email, plan: user.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getSupabase();
    if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { data: profiles, error: dbError } = await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (dbError) {
      console.error("Profiles query error:", dbError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Supabase Auth에서 사용자 메타데이터(프로필 사진) 가져오기
    const avatarMap: Record<string, string | null> = {};
    try {
      const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        for (const au of authData.users) {
          const meta = au.user_metadata as Record<string, unknown> | undefined;
          avatarMap[au.id] = (meta?.avatar_url as string) ?? (meta?.picture as string) ?? (meta?.profile_image as string) ?? null;
        }
      }
    } catch (e) {
      console.error("Failed to fetch auth users for avatars:", e);
    }

    const users: AdminUser[] = (profiles ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      email: (p.email as string) ?? "",
      firstName: (p.first_name as string | null) ?? null,
      lastName: (p.last_name as string | null) ?? null,
      plan: (p.plan as string) ?? "free",
      createdAt: p.created_at ? new Date(p.created_at as string).getTime() : 0,
      lastActiveAt: p.last_sign_in_at ? new Date(p.last_sign_in_at as string).getTime() : null,
      migrated: true,
      avatarUrl: avatarMap[p.id as string] ?? null,
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
