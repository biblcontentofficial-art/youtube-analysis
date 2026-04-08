import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DEV_SECRET = process.env.CLERK_DEV_SECRET_KEY;
  if (!DEV_SECRET) {
    return NextResponse.json({ error: "CLERK_DEV_SECRET_KEY not set" }, { status: 500 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 500 });

  // Dev 인스턴스에서 유저 목록 가져오기 (최대 500명)
  const response = await fetch("https://api.clerk.com/v1/users?limit=500&order_by=-created_at", {
    headers: { Authorization: `Bearer ${DEV_SECRET}` },
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: "Clerk API failed", detail: text }, { status: 500 });
  }

  const users: Array<{
    id: string;
    email_addresses: Array<{ email_address: string }>;
  }> = await response.json();

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    const email = user.email_addresses?.[0]?.email_address;
    if (!email) { skipped++; continue; }

    const { error } = await db
      .from("user_email_map")
      .upsert({ email, old_user_id: user.id }, { onConflict: "email", ignoreDuplicates: false });

    if (error) {
      errors.push(`${email}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return NextResponse.json({
    success: true,
    total: users.length,
    inserted,
    skipped,
    errors: errors.slice(0, 10),
  });
}
