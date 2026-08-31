/**
 * GET /api/community/image?p=<storage path> — 본문 이미지 서빙 (회원 전용)
 *
 * 비공개 버킷이라 직접 접근할 수 없으므로, 로그인 확인 후 짧은 서명 URL로 리다이렉트한다.
 * 커뮤니티가 회원 전용이므로 이미지도 같은 기준으로 막힌다.
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { STORAGE_BUCKET } from "@/lib/community";

export const runtime = "nodejs";

/** inline/{uuid}/{파일명} 형태만 허용한다 */
const PATH_RE = /^inline\/[0-9a-f-]{36}\/[\w.\-]+$/i;

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const path = req.nextUrl.searchParams.get("p") ?? "";
  if (!PATH_RE.test(path)) return new NextResponse("Bad Request", { status: 400 });

  const db = getSupabase();
  if (!db) return new NextResponse("Storage unavailable", { status: 500 });

  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return new NextResponse("Not Found", { status: 404 });

  return NextResponse.redirect(data.signedUrl, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
