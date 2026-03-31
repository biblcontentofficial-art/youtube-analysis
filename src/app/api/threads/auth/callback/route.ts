/**
 * GET /api/threads/auth/callback
 * Meta OAuth 콜백 — 코드 교환 → 토큰 저장 → /threads 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForToken, getThreadsProfile } from "@/lib/threads";
import { upsertThreadsConnection } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // 사용자가 권한 거부한 경우
  if (error) {
    return NextResponse.redirect(`${APP_URL}/threads?error=cancelled`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/threads?error=invalid_callback`);
  }

  // state 검증 (userId 일치 여부 확인)
  let stateUserId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    stateUserId = parsed.userId;
  } catch {
    return NextResponse.redirect(`${APP_URL}/threads?error=invalid_state`);
  }

  const { userId } = await auth();
  if (!userId || userId !== stateUserId) {
    return NextResponse.redirect(`${APP_URL}/threads?error=auth_mismatch`);
  }

  try {
    // 코드 → 액세스 토큰 교환
    const { access_token, user_id: threadsUserId } = await exchangeCodeForToken(code);

    // 프로필 조회 (username 가져오기) — 실패해도 연결은 저장
    let username = threadsUserId; // 폴백: user_id를 username으로 사용
    try {
      const profile = await getThreadsProfile(access_token);
      if (profile.username) username = profile.username;
    } catch (profileErr) {
      console.warn("Threads profile fetch failed, using user_id as username:", profileErr);
    }

    // Supabase 저장
    await upsertThreadsConnection({
      userId,
      accessToken: access_token,
      threadsUserId,
      username,
    });

    return NextResponse.redirect(`${APP_URL}/threads?connected=1`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Threads OAuth callback error:", msg);
    const detail = encodeURIComponent(msg.slice(0, 200));
    return NextResponse.redirect(`${APP_URL}/threads?error=token_failed&detail=${detail}`);
  }
}
