import { NextRequest, NextResponse } from "next/server";
import { deleteThreadsConnection } from "@/lib/db";

/**
 * Threads 데이터 삭제 콜백
 * Meta가 사용자 데이터 삭제를 요청할 때 호출
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
