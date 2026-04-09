import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUserPlan } from "@/lib/auth";
import { cancelSubscription, getSubscription } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 현재 구독 정보 조회
  const sub = await getSubscription(userId).catch(() => null);

  // DB에서 구독 취소 처리 (status: cancelled, next_billing_at은 유지)
  // → cron job이 next_billing_at 도달 시 플랜을 free로 다운그레이드
  await cancelSubscription(userId);

  // next_billing_at이 없거나 이미 지났으면 즉시 free로 처리
  const now = new Date();
  const nextBilling = sub?.next_billing_at ? new Date(sub.next_billing_at) : null;
  const isExpiredAlready = !nextBilling || nextBilling <= now;

  if (isExpiredAlready) {
    try {
      await updateUserPlan(userId, "free");
    } catch (e) {
      console.error("[cancel-subscription] 플랜 업데이트 실패:", e);
    }
  }

  // 남은 기간(next_billing_at)을 응답에 포함 → 프론트에서 안내 문구 표시 가능
  return NextResponse.json({
    ok: true,
    activeUntil: sub?.next_billing_at ?? null,
  });
}
