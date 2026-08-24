/**
 * POST /api/community/upload/confirm — 직접 업로드된 첨부파일을 DB에 기록
 *
 * 클라이언트가 uploadToSignedUrl 로 Storage 업로드를 끝낸 뒤 호출한다.
 * path 는 반드시 `${postId}/` 로 시작해야 한다(다른 글의 경로에 첨부를 붙이는 조작 차단).
 * mimeType 은 클라이언트 값을 신뢰하지 않고 확장자로 서버가 결정한다.
 *
 * body { postId, path, fileName, fileSize, mimeType }
 * 201  { id, fileName, fileSize }
 */

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
  safeMimeForExt,
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-upload-confirm", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const postId = String(body.postId ?? "").trim();
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

  const path = String(body.path ?? "").trim();
  if (!path) return NextResponse.json({ message: "업로드 경로가 없습니다." }, { status: 400 });

  const fileName = String(body.fileName ?? "").trim();
  if (!fileName) return NextResponse.json({ message: "파일 이름이 없습니다." }, { status: 400 });

  const fileSize = Number(body.fileSize);
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ message: "파일 크기가 올바르지 않습니다." }, { status: 400 });
  }
  if (fileSize > MAX_FILE_BYTES) {
    return NextResponse.json(
      { message: `파일 크기가 너무 큽니다. (${formatFileSize(fileSize)} / 최대 ${formatFileSize(MAX_FILE_BYTES)})` },
      { status: 400 }
    );
  }

  // 경로 조작 차단: 반드시 이 글의 폴더 안이어야 하고 상위 경로 참조가 없어야 한다
  if (!path.startsWith(`${postId}/`) || path.includes("..")) {
    return NextResponse.json({ message: "업로드 경로가 올바르지 않습니다." }, { status: 400 });
  }

  const post = await getPost(postId);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canManagePost(post, viewer)) {
    return NextResponse.json({ message: "첨부 권한이 없습니다." }, { status: 403 });
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  if (!ext || !ALLOWED_FILE_EXT.includes(ext)) {
    return NextResponse.json({ message: `지원하지 않는 파일 형식입니다. (${ext || "확장자 없음"})` }, { status: 400 });
  }

  const { data, error } = await db
    .from("community_attachments")
    .insert({
      post_id: postId,
      file_name: fileName.slice(0, 200),
      file_size: Math.trunc(fileSize),
      // 클라이언트가 보낸 mimeType 은 신뢰하지 않는다 (확장자 기준 서버 판정값 저장)
      mime_type: safeMimeForExt(ext),
      storage_path: path,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[community:upload-confirm]", error.message);
    // 레코드 저장 실패 시 업로드된 파일 정리 (실패해도 무시)
    await db.storage.from(STORAGE_BUCKET).remove([path]).then(() => {}, () => {});
    return NextResponse.json({ message: "첨부 정보 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.id, fileName, fileSize: Math.trunc(fileSize) },
    { status: 201 }
  );
}
