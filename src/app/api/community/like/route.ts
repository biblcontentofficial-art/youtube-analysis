/** POST /api/community/like — 글 좋아요 토글 (like_count는 DB 트리거가 갱신) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getPost } from "@/lib/communityDb";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-like", 200, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const postId = String(body.postId ?? "").trim();
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

  const post = await getPost(postId);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  // 자기 글에 자기가 누르는 좋아요는 막는다 (활동 점수 우회 차단)
  if (post.author_id && post.author_id === user.id) {
    return NextResponse.json({ message: "자기 글에는 좋아요를 누를 수 없습니다." }, { status: 400 });
  }

  const { data: existing } = await db
    .from("community_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;

  if (existing) {
    const { error } = await db
      .from("community_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      console.error("[community:like-remove]", error.message);
      return NextResponse.json({ message: "좋아요 처리에 실패했습니다." }, { status: 500 });
    }
    liked = false;
  } else {
    const { error } = await db
      .from("community_post_likes")
      .insert({ post_id: postId, user_id: user.id });
    if (error) {
      console.error("[community:like-add]", error.message);
      return NextResponse.json({ message: "좋아요 처리에 실패했습니다." }, { status: 500 });
    }
    liked = true;
  }

  // 트리거가 갱신한 like_count 를 다시 읽어 반환
  const { data: fresh } = await db
    .from("community_posts")
    .select("like_count")
    .eq("id", postId)
    .maybeSingle();

  return NextResponse.json({ liked, likeCount: fresh?.like_count ?? 0 });
}
