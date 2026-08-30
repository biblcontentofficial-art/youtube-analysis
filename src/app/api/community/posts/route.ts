/** POST /api/community/posts — 커뮤니티 글 작성 (게시판 쓰기 권한 검사 + 레이트리밋) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getBoard, getViewerGrade } from "@/lib/communityDb";
import {
  canWriteBoard,
  canModerateCommunity,
  displayName,
  MAX_TITLE_LEN,
  MAX_CONTENT_LEN,
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-post", 20, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "글 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const boardSlug = String(body.boardSlug ?? "").trim();
  if (!boardSlug) return NextResponse.json({ message: "게시판을 선택해주세요." }, { status: 400 });

  const board = await getBoard(boardSlug);
  if (!board) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  const grade = await getViewerGrade(viewer);
  if (!canWriteBoard(board, viewer, grade)) {
    return NextResponse.json(
      { message: "이 게시판에 글을 쓸 수 있는 등급이 아닙니다. 등업게시판 안내를 확인해 주세요." },
      { status: 403 }
    );
  }

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
  if (title.length > MAX_TITLE_LEN) {
    return NextResponse.json({ message: `제목은 ${MAX_TITLE_LEN}자 이내로 입력해주세요.` }, { status: 400 });
  }
  if (!content) return NextResponse.json({ message: "내용을 입력해주세요." }, { status: 400 });
  if (content.length > MAX_CONTENT_LEN) {
    return NextResponse.json({ message: `내용은 ${MAX_CONTENT_LEN}자 이내로 입력해주세요.` }, { status: 400 });
  }

  // 공지 고정은 운영진만 (일반 회원이 보내면 무시)
  const isNotice = body.isNotice === true && canModerateCommunity(viewer);

  const { data, error } = await db
    .from("community_posts")
    .insert({
      board_id: board.id,
      author_id: user.id,
      author_name: displayName(user.firstName, user.email),
      title,
      content,
      is_notice: isNotice,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[community:post-create]", error.message);
    return NextResponse.json({ message: "글 작성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
