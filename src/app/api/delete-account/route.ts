import { NextResponse } from "next/server";
import { auth, deleteAuthUser } from "@/lib/auth";
import { cancelSubscription, clearSearchHistory, clearSavedVideos } from "@/lib/db";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 사용자 데이터 정리
  await Promise.allSettled([
    cancelSubscription(userId),
    clearSearchHistory(userId),
    clearSavedVideos(userId),
  ]);

  // Auth에서 유저 삭제
  try {
    await deleteAuthUser(userId);
  } catch (e) {
    console.error("[delete-account] 유저 삭제 실패:", e);
    return NextResponse.json({ error: "계정 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
