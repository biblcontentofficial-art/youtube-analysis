/**
 * POST /api/posts/upload  — multipart/form-data 'file'
 * 어드민만 사용. Supabase Storage 'post-media' 버킷에 저장하고 public URL 반환.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canEditInsights } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 30 * 1024 * 1024; // 30MB
const ALLOWED = [
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
];

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !canEditInsights({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "Storage 미연결" }, { status: 500 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ message: "파일이 없습니다." }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: `파일 크기 30MB 초과 (${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ message: `지원하지 않는 형식: ${file.type}` }, { status: 400 });
  }

  // 파일명: YYYY/MM/timestamp-rand-원본명
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safeName = (file.name || "file").replace(/[^\w.\-]/g, "_").slice(-50);
  const path = `${yyyy}/${mm}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("post-media").upload(path, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[posts:upload]", error);
    return NextResponse.json({ message: "업로드 실패: " + error.message }, { status: 500 });
  }

  const { data: pub } = db.storage.from("post-media").getPublicUrl(path);
  const kind = file.type.startsWith("video/") ? "video" : "image";
  return NextResponse.json({ url: pub.publicUrl, kind, contentType: file.type, size: file.size });
}
