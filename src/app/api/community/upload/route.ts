/** POST /api/community/upload — 글 첨부파일 업로드 (비공개 버킷 community-files, 확장자·용량 검증) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getPost } from "@/lib/communityDb";
import {
  canManagePost,
  ALLOWED_FILE_EXT,
  MAX_FILE_BYTES,
  STORAGE_BUCKET,
  formatFileSize,
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-upload", 40, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const postId = String(form?.get("postId") ?? "").trim();

  if (!file) return NextResponse.json({ message: "파일이 없습니다." }, { status: 400 });
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

  const post = await getPost(postId);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canManagePost(post, viewer)) {
    return NextResponse.json({ message: "첨부 권한이 없습니다." }, { status: 403 });
  }

  const { data: boardRow } = await db
    .from("community_boards")
    .select("allow_files")
    .eq("id", post.board_id)
    .maybeSingle();
  if (!boardRow) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });
  if (!boardRow.allow_files) {
    return NextResponse.json({ message: "이 게시판은 파일 첨부를 지원하지 않습니다." }, { status: 403 });
  }

  const originalName = file.name || "file";
  const ext = originalName.includes(".") ? originalName.split(".").pop()!.toLowerCase() : "";
  if (!ext || !ALLOWED_FILE_EXT.includes(ext)) {
    return NextResponse.json({ message: `지원하지 않는 파일 형식입니다. (${ext || "확장자 없음"})` }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { message: `파일 크기가 너무 큽니다. (${formatFileSize(file.size)} / 최대 ${formatFileSize(MAX_FILE_BYTES)})` },
      { status: 400 }
    );
  }

  const safeName = originalName.replace(/[^\w.\-]/g, "_").slice(-50);
  const path = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await db.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) {
    console.error("[community:upload]", upErr.message);
    return NextResponse.json({ message: "업로드에 실패했습니다." }, { status: 500 });
  }

  const { data, error } = await db
    .from("community_attachments")
    .insert({
      post_id: postId,
      file_name: originalName,
      file_size: file.size,
      mime_type: file.type || null,
      storage_path: path,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[community:upload-record]", error.message);
    // 레코드 저장 실패 시 업로드된 파일 정리 (실패해도 무시)
    await db.storage.from(STORAGE_BUCKET).remove([path]).then(() => {}, () => {});
    return NextResponse.json({ message: "첨부 정보 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.id, fileName: originalName, fileSize: file.size },
    { status: 201 }
  );
}
