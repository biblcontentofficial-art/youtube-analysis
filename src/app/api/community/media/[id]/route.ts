/**
 * GET /api/community/media/[id] — 첨부된 사진·영상을 글 안에서 바로 보여 주기 위한 서빙
 *
 * download/[id] 와 달리 Content-Disposition 을 붙이지 않고(브라우저가 <img>·<video> 로 그린다)
 * 다운로드 수도 올리지 않는다. 사진·영상이 아닌 첨부는 여기로 열 수 없다.
 * 비공개 버킷이므로 로그인 확인 후 짧은 서명 URL 로 리다이렉트한다.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { STORAGE_BUCKET, isPublicBoard, mediaKind } from "@/lib/community";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 커뮤니티는 회원 전용. 비회원은 공개 게시판(칼럼) 글의 사진·영상만 볼 수 있다(아래 게시판 확인 뒤 판단)
  const user = await currentUser();

  const db = getSupabase();
  if (!db) return new NextResponse("Storage unavailable", { status: 500 });

  const { data: attachment } = await db
    .from("community_attachments")
    .select("id, post_id, file_name, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!attachment || mediaKind(attachment.file_name) === "file") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { data: post } = await db
    .from("community_posts")
    .select("id, board_id, status")
    .eq("id", attachment.post_id)
    .maybeSingle();
  if (!post || post.status !== "published") return new NextResponse("Not Found", { status: 404 });

  // 비활성화된 게시판의 첨부는 더 이상 내려주지 않는다
  const { data: board } = await db
    .from("community_boards")
    .select("id, slug")
    .eq("id", post.board_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!board) return new NextResponse("Not Found", { status: 404 });
  if (!user && !isPublicBoard(board.slug)) return new NextResponse("Unauthorized", { status: 401 });

  // 영상은 탐색(seek)할 때마다 Range 요청이 이 주소로 다시 들어오므로 유효기간을 여유 있게 둔다
  const { data: signed, error } = await db.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.storage_path, 600);
  if (error || !signed?.signedUrl) {
    console.error("[community:media]", error?.message ?? "no signed url");
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
