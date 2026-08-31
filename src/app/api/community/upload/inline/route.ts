/**
 * POST /api/community/upload/inline — 본문 삽입용 이미지 서명 업로드 URL 발급
 *
 * 첨부파일(upload/sign)과 달리 글이 만들어지기 전에도 쓸 수 있어야 하므로 postId 를 받지 않는다.
 * 이미지 전용이며, 업로드된 파일은 /api/community/image 로만 열람할 수 있다(회원 전용).
 *
 * body { fileName, fileSize }
 * 201  { path, token }
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { STORAGE_BUCKET, formatFileSize } from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** 본문 이미지 허용 확장자 (svg 제외 — 저장형 XSS 방지) */
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp"];
const MAX_INLINE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-inline-upload", 120, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const fileName = String(body.fileName ?? "").trim();
  const fileSize = Number(body.fileSize);

  if (!fileName) return NextResponse.json({ message: "파일 이름이 없습니다." }, { status: 400 });
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ message: "파일 크기가 올바르지 않습니다." }, { status: 400 });
  }
  if (fileSize > MAX_INLINE_BYTES) {
    return NextResponse.json(
      { message: `이미지가 너무 큽니다. (${formatFileSize(fileSize)} / 최대 ${formatFileSize(MAX_INLINE_BYTES)})` },
      { status: 400 }
    );
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  if (!ext || !IMAGE_EXT.includes(ext)) {
    return NextResponse.json({ message: "이미지 파일만 넣을 수 있습니다. (png, jpg, gif, webp)" }, { status: 400 });
  }

  const safeName = fileName.replace(/[^\w.\-]/g, "_").slice(-40);
  const path = `inline/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error("[community:inline-upload-sign]", error?.message ?? "no token");
    return NextResponse.json({ message: "업로드 링크를 만들 수 없습니다." }, { status: 500 });
  }

  return NextResponse.json({ path: data.path ?? path, token: data.token }, { status: 201 });
}
