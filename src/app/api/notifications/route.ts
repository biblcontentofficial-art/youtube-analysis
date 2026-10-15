/**
 * 관심 목록 알림(C7, roadmap T9). GET → { notifications }: 최근 30일, 최대 200개, 본인 것만(user_id = 로그인 사용자).
 * 비로그인 401, DB 오류 500. 데이터: src/lib/trend/watch.ts listNotifications.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listNotifications } from "@/lib/trend/watch";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const notifications = await listNotifications(userId);
  if (!notifications) return NextResponse.json({ error: "db" }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ notifications }, { headers: NO_STORE });
}
