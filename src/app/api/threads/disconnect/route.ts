/**
 * DELETE /api/threads/disconnect
 * Meta 계정 연결 해제
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteThreadsConnection } from "@/lib/db";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  await deleteThreadsConnection(userId);
  return NextResponse.json({ ok: true });
}
