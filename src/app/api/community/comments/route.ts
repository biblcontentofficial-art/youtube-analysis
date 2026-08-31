/** POST /api/community/comments — 댓글·대댓글 작성 (로그인 필수, comment_count는 DB 트리거가 갱신) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getPost } from "@/lib/communityDb";
import {
  type Board,
  canReadBoard,
  authorNameFor,
  MAX_COMMENT_LEN,
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-comment", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "댓글 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const postId = String(body.postId ?? "").trim();
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

  // 글 존재·게시 상태 확인 (getPost는 published 만 반환)
  const post = await getPost(postId);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  // 해당 게시판 읽기 권한 확인
  const { data: boardRow } = await db
    .from("community_boards")
    .select("read_role")
    .eq("id", post.board_id)
    .maybeSingle();
  if (!boardRow) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canReadBoard(boardRow as Pick<Board, "read_role">, viewer)) {
    return NextResponse.json({ message: "댓글을 쓸 권한이 없습니다." }, { status: 403 });
  }

  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ message: "댓글 내용을 입력해주세요." }, { status: 400 });
  if (content.length > MAX_COMMENT_LEN) {
    return NextResponse.json({ message: `댓글은 ${MAX_COMMENT_LEN}자 이내로 입력해주세요.` }, { status: 400 });
  }

  // 대댓글이면 부모 댓글이 같은 글의 것인지 검증
  let parentId: string | null = null;
  if (body.parentId !== undefined && body.parentId !== null && String(body.parentId).trim()) {
    const candidate = String(body.parentId).trim();
    const { data: parent } = await db
      .from("community_comments")
      .select("id, post_id, status")
      .eq("id", candidate)
      .maybeSingle();
    if (!parent || parent.post_id !== postId || parent.status !== "published") {
      return NextResponse.json({ message: "답글을 달 댓글을 찾을 수 없습니다." }, { status: 400 });
    }
    parentId = candidate;
  }

  const { data, error } = await db
    .from("community_comments")
    .insert({
      post_id: postId,
      parent_id: parentId,
      author_id: user.id,
      author_name: authorNameFor(viewer, user.firstName),
      content,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[community:comment-create]", error.message);
    return NextResponse.json({ message: "댓글 작성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
