/** POST /api/community/visit — 오늘 방문 기록 (등업 조건 집계용, 하루 1회) */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { recordVisit } from "@/lib/communityDb";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  await recordVisit(user.id);
  return NextResponse.json({ ok: true });
}
