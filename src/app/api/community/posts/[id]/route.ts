/** PATCH·DELETE /api/community/posts/[id] — 글 수정 / 소프트 삭제 (작성자 본인 또는 운영진) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getPost } from "@/lib/communityDb";
import {
  canManagePost,
  canModerateCommunity,
  MAX_TITLE_LEN,
  MAX_CONTENT_LEN,
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-post-edit", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const post = await getPost(id);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canManagePost(post, viewer)) {
    return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
    if (title.length > MAX_TITLE_LEN) {
      return NextResponse.json({ message: `제목은 ${MAX_TITLE_LEN}자 이내로 입력해주세요.` }, { status: 400 });
    }
    patch.title = title;
  }

  if (body.content !== undefined) {
    const content = String(body.content ?? "").trim();
    if (!content) return NextResponse.json({ message: "내용을 입력해주세요." }, { status: 400 });
    if (content.length > MAX_CONTENT_LEN) {
      return NextResponse.json({ message: `내용은 ${MAX_CONTENT_LEN}자 이내로 입력해주세요.` }, { status: 400 });
    }
    patch.content = content;
  }

  // 공지 고정 전환은 운영진만 (일반 회원이 보내면 무시)
  if (body.isNotice !== undefined && canModerateCommunity(viewer)) {
    patch.is_notice = body.isNotice === true;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await db.from("community_posts").update(patch).eq("id", id);
  if (error) {
    console.error("[community:post-update]", error.message);
    return NextResponse.json({ message: "글 수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-post-delete", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const post = await getPost(id);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canManagePost(post, viewer)) {
    return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
  }

  const { error } = await db.from("community_posts").update({ status: "deleted" }).eq("id", id);
  if (error) {
    console.error("[community:post-delete]", error.message);
    return NextResponse.json({ message: "글 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
