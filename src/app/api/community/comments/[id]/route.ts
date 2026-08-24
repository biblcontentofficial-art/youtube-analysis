/** DELETE /api/community/comments/[id] — 댓글 소프트 삭제 (작성자 본인 또는 운영진) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canModerateCommunity } from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-comment-delete", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const { data: comment } = await db
    .from("community_comments")
    .select("id, author_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!comment || comment.status !== "published") {
    return NextResponse.json({ message: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  const isOwner = !!comment.author_id && comment.author_id === user.id;
  if (!isOwner && !canModerateCommunity(viewer)) {
    return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
  }

  const { error } = await db.from("community_comments").update({ status: "deleted" }).eq("id", id);
  if (error) {
    console.error("[community:comment-delete]", error.message);
    return NextResponse.json({ message: "댓글 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
