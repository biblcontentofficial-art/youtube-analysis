/**
 * 안 읽은 알림 수(C7, roadmap T9). GET → { count }: RPC notification_unread_count(p_user_id = 로그인 사용자).
 * 비로그인 401. 오류면 0(탭 숫자를 숨긴다).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/trend/watch";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  return NextResponse.json({ count: await getUnreadCount(userId) }, { headers: NO_STORE });
}
