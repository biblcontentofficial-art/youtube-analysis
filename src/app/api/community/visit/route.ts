/**
 * POST /api/community/visit — 오늘 방문 기록 (하루 1회)
 * 기록 직후 활동 점수·등급을 다시 계산해 저장한다.
 * (커뮤니티를 열기만 해도 갱신되므로, 글을 안 써도 배지가 최신 상태로 유지된다)
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getViewerMembership, recordVisit } from "@/lib/communityDb";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  await recordVisit(user.id);
  const membership = await getViewerMembership({
    id: user.id,
    email: user.email,
    plan: user.plan,
  });
  return NextResponse.json({ ok: true, grade: membership.grade, points: membership.points });
}
