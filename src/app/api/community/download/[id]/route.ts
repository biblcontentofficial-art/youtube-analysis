/** GET /api/community/download/[id] — 첨부파일 다운로드 (60초 서명 URL 리다이렉트 + 다운로드수 증가) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { STORAGE_BUCKET } from "@/lib/community";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const { data: attachment } = await db
    .from("community_attachments")
    .select("id, post_id, file_name, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) return NextResponse.json({ message: "파일을 찾을 수 없습니다." }, { status: 404 });

  const { data: post } = await db
    .from("community_posts")
    .select("id, board_id, status")
    .eq("id", attachment.post_id)
    .maybeSingle();
  if (!post || post.status !== "published") {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: board } = await db
    .from("community_boards")
    .select("read_role")
    .eq("id", post.board_id)
    .maybeSingle();
  if (!board) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });

  // 회원 전용 게시판이면 로그인 필수
  if (board.read_role === "member") {
    const user = await currentUser();
    if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: signed, error } = await db.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.storage_path, 60, { download: attachment.file_name });

  if (error || !signed?.signedUrl) {
    console.error("[community:download]", error?.message ?? "no signed url");
    return NextResponse.json({ message: "다운로드 링크를 만들 수 없습니다." }, { status: 500 });
  }

  // 다운로드 카운트 증가 (실패해도 무시)
  await db
    .rpc("community_increment_download", { p_attachment_id: attachment.id })
    .then(() => {}, () => {});

  return NextResponse.redirect(signed.signedUrl, 302);
}
