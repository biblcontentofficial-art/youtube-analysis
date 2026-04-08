import { currentUser } from "@clerk/nextjs/server";
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

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    // ── 1. Clerk Production 유저 가져오기 ────────────────────────
    const allClerkUsers: Record<string, unknown>[] = [];
    let offset = 0;
    const pageLimit = 100;

    while (true) {
      const response = await fetch(
        `https://api.clerk.com/v1/users?limit=${pageLimit}&offset=${offset}&order_by=-created_at`,
        {
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Clerk API error:", text);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
      }

      const page = await response.json();
      if (!Array.isArray(page) || page.length === 0) break;
      allClerkUsers.push(...page);
      if (page.length < pageLimit || allClerkUsers.length >= 500) break;
      offset += pageLimit;
    }

    const migratedEmails = new Set<string>();

    const clerkUsers: AdminUser[] = allClerkUsers.map((u: Record<string, unknown>) => {
      const emailAddresses = u.email_addresses as Array<{ email_address: string }> | undefined;
      const publicMetadata = (u.public_metadata as Record<string, unknown>) ?? {};
      const userEmail = emailAddresses?.[0]?.email_address ?? "";
      migratedEmails.add(userEmail.toLowerCase());
      return {
        id: u.id as string,
        email: userEmail,
        firstName: (u.first_name as string | null) ?? null,
        lastName: (u.last_name as string | null) ?? null,
        plan: (publicMetadata.plan as string) ?? "free",
        createdAt: u.created_at as number,
        lastActiveAt: (u.last_active_at as number | null) ?? null,
        migrated: true,
      };
    });

    // ── 2. 아직 마이그레이션 안 된 Dev 유저 가져오기 (Supabase) ──
    const pendingUsers: AdminUser[] = [];
    const db = getSupabase();

    if (db) {
      // user_email_map에서 미완료(migrated=false) 유저 목록 가져오기
      const { data: pendingMap } = await db
        .from("user_email_map")
        .select("email, old_user_id, migrated_at")
        .is("migrated_at", null);

      if (pendingMap && pendingMap.length > 0) {
        const oldUserIds = pendingMap.map((r: { old_user_id: string }) => r.old_user_id);

        // subscriptions 테이블에서 플랜 정보 조회
        const { data: subs } = await db
          .from("subscriptions")
          .select("user_id, plan, started_at")
          .in("user_id", oldUserIds);

        const subsByUserId = new Map(
          (subs ?? []).map((s: { user_id: string; plan: string; started_at: string }) => [
            s.user_id,
            s,
          ])
        );

        for (const row of pendingMap as { email: string; old_user_id: string }[]) {
          // Production에 이미 가입한 이메일은 건너뜀 (중복 방지)
          if (migratedEmails.has(row.email.toLowerCase())) continue;

          const sub = subsByUserId.get(row.old_user_id) as
            | { plan: string; started_at: string }
            | undefined;

          pendingUsers.push({
            id: row.old_user_id,
            email: row.email,
            firstName: null,
            lastName: null,
            plan: sub?.plan ?? "free",
            createdAt: sub?.started_at ? new Date(sub.started_at).getTime() : 0,
            lastActiveAt: null,
            migrated: false,
          });
        }
      }
    }

    // ── 3. 합쳐서 반환 (Production 유저 먼저, 그 다음 미마이그레이션 유저) ──
    const users = [...clerkUsers, ...pendingUsers];
    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
