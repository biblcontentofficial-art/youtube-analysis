/**
 * POST /api/community/upload/inline — 본문 삽입용 사진·영상 서명 업로드 URL 발급
 *
 * 첨부파일(upload/sign)과 달리 글이 만들어지기 전에도 쓸 수 있어야 하므로 postId 를 받지 않는다.
 * 사진·영상 전용이며, 업로드된 파일은 /api/community/image 로만 열람할 수 있다(회원 전용).
 *
 * body { fileName, fileSize }
 * 201  { path, token }
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { MAX_FILE_BYTES, STORAGE_BUCKET, fileExtOf, formatFileSize, mediaKind } from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** 사진 상한. 영상은 첨부파일과 같은 MAX_FILE_BYTES 까지 (파일이 서버를 거치지 않으므로 Vercel 본문 한도와 무관) */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

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
  // 확장자로 종류를 먼저 가른다 (svg 는 허용 목록에 없어 저장형 XSS 가 막힌다)
  const kind = mediaKind(fileName);
  if (kind === "file") {
    return NextResponse.json(
      { message: "사진(png, jpg, gif, webp)이나 영상(mp4, mov, webm)만 넣을 수 있습니다." },
      { status: 400 }
    );
  }
  const limit = kind === "video" ? MAX_FILE_BYTES : MAX_IMAGE_BYTES;
  if (fileSize > limit) {
    return NextResponse.json(
      {
        message: `${kind === "video" ? "영상" : "사진"}이 너무 큽니다. (${formatFileSize(fileSize)} / 최대 ${formatFileSize(limit)})`,
      },
      { status: 400 }
    );
  }
  const ext = fileExtOf(fileName);

  const safeName = fileName.replace(/[^\w.\-]/g, "_").slice(-40);
  const path = `inline/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error("[community:inline-upload-sign]", error?.message ?? "no token");
    return NextResponse.json({ message: "업로드 링크를 만들 수 없습니다." }, { status: 500 });
  }

  return NextResponse.json({ path: data.path ?? path, token: data.token }, { status: 201 });
}
