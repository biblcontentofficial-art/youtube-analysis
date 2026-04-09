/**
 * GET /api/threads/auth
 * Meta OAuth 시작 — threads.net/oauth/authorize 로 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOAuthUrl } from "@/lib/threads";

function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (origin) {
    try { return new URL(origin).origin; } catch {}
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/sign-in`);
  }

  // 환경변수 미설정 시 안내 페이지로 리다이렉트
  if (!process.env.THREADS_APP_ID || !process.env.THREADS_APP_SECRET) {
    return NextResponse.redirect(`${baseUrl}/threads?error=not_configured`);
  }

  // state에 userId 포함 → 콜백에서 검증
  const state = Buffer.from(JSON.stringify({ userId, t: Date.now() })).toString("base64url");
  const url = getOAuthUrl(state);

  return NextResponse.redirect(url);
}
