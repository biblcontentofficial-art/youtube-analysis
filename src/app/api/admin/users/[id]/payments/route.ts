/**
 * GET /api/admin/users/:id/payments
 * 특정 유저의 결제 이력 조회 (관리자 전용)
 */

import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { getPayments } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await currentUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = admin.email ?? "";
  if (!isAdmin({ email, plan: admin.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const payments = await getPayments(userId);
  return NextResponse.json({ payments });
}
