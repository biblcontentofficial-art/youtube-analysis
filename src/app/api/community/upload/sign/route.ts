/**
 * POST /api/community/upload/sign — 첨부파일 서명 업로드 URL 발급
 *
 * Vercel 서버리스 본문 한도(4.5MB)를 우회하기 위해 파일 자체는 서버를 거치지 않고
 * 클라이언트가 Supabase Storage 로 직접 올린다. 이 라우트는 권한·확장자·용량만 검증하고
 * 업로드 경로와 1회용 토큰을 발급한다.
 *
 * body { postId, fileName, fileSize, mimeType }
 * 201  { path, token }
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
} from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { allowed } = await checkRateLimit(getClientIp(req), "community-upload-sign", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "업로드 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const postId = String(body.postId ?? "").trim();
  if (!postId) return NextResponse.json({ message: "글 정보가 없습니다." }, { status: 400 });

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

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  if (!ext || !ALLOWED_FILE_EXT.includes(ext)) {
    return NextResponse.json({ message: `지원하지 않는 파일 형식입니다. (${ext || "확장자 없음"})` }, { status: 400 });
  }

  const safeName = fileName.replace(/[^\w.\-]/g, "_").slice(-50);
  const path = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data?.token) {
    console.error("[community:upload-sign]", error?.message ?? "no token");
    return NextResponse.json({ message: "업로드 링크를 만들 수 없습니다." }, { status: 500 });
  }

  return NextResponse.json({ path: data.path ?? path, token: data.token }, { status: 201 });
}
