import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cancelSubscription, clearSearchHistory, clearSavedVideos } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // DB에서 구독 취소 처리
  await cancelSubscription(userId);

  // 구독 해지 즉시 데이터 삭제
  try {
    await Promise.all([
      clearSearchHistory(userId),   // 검색 기록 전체 삭제
      clearSavedVideos(userId),     // 수집한 영상 전체 삭제
    ]);
  } catch (e) {
    console.error("[cancel-subscription] 데이터 삭제 실패:", e);
  }

  // Clerk 플랜을 free로 다운그레이드
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, { publicMetadata: { plan: "free" } });
  } catch (e) {
    console.error("[cancel-subscription] Clerk 업데이트 실패:", e);
  }

  return NextResponse.json({ ok: true });
}
