import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/adminAuth";
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
};

export async function GET() {
  // Check if the requesting user is an admin
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email ?? "";
  if (!isAdminEmail(email)) {
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

    const users: AdminUser[] = (profiles ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      email: (p.email as string) ?? "",
      firstName: (p.first_name as string | null) ?? null,
      lastName: (p.last_name as string | null) ?? null,
      plan: (p.plan as string) ?? "free",
      createdAt: p.created_at ? new Date(p.created_at as string).getTime() : 0,
      lastActiveAt: p.last_sign_in_at ? new Date(p.last_sign_in_at as string).getTime() : null,
      migrated: true,
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
