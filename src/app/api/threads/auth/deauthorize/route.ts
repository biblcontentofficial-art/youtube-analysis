import { NextRequest, NextResponse } from "next/server";
import { deleteThreadsConnection } from "@/lib/db";

/**
 * Threads 연결 해제 콜백
 * Meta가 사용자가 앱 승인을 취소할 때 호출
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = (body as Record<string, unknown>).user_id as string | undefined;
    if (userId) {
      await deleteThreadsConnection(userId);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
