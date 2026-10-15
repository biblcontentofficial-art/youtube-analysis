/**
 * 관심 목록 알림 읽음 처리(C7, roadmap T9). POST → { ok, updated }: 본인 안 읽은 알림 전부 read_at = now().
 * 관심 목록 탭을 열면 화면이 한 번 부른다. 비로그인 401, DB 오류 500.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/trend/watch";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const updated = await markNotificationsRead(userId);
  if (updated == null) return NextResponse.json({ error: "db" }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ ok: true, updated }, { headers: NO_STORE });
}
