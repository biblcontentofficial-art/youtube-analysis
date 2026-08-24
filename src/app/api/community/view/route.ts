/**
 * POST /api/community/view — 게시글 조회수 증가
 *
 * 서버 렌더에서 올리면 댓글 작성 후 router.refresh() 마다 중복 증가하므로,
 * 클라이언트 ViewTracker 가 마운트 시 1회만 호출한다.
 * 커뮤니티는 회원 전용이므로 로그인한 사용자의 조회만 집계한다.
 *
 * body { postId }
 * 200  { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { allowed } = await checkRateLimit(getClientIp(req), "community-view", 600, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  // 커뮤니티 전체가 회원 전용 — 비로그인 조회는 집계하지 않는다
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const postId = String(body.postId ?? "").trim();
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

  const { data: post } = await db
    .from("community_posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.status !== "published") {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await db.rpc("community_increment_view", { p_post_id: postId });
  if (error) {
    console.error("[community:view]", error.message);
    return NextResponse.json({ message: "조회수 반영에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
