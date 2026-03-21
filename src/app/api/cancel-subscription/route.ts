import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cancelSubscription } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // DB에서 구독 취소 처리
  await cancelSubscription(userId);

  // Clerk 플랜을 free로 다운그레이드
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { publicMetadata: { plan: "free" } });
  } catch (e) {
    console.error("[cancel-subscription] Clerk 업데이트 실패:", e);
  }

  return NextResponse.json({ ok: true });
}
