/**
 * GET /api/threads/debug
 * Threads API 원본 응답 확인용 (임시 디버그)
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getThreadsConnection } from "@/lib/db";

const API = "https://graph.threads.net/v1.0";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const conn = await getThreadsConnection(userId);
  if (!conn) return NextResponse.json({ error: "not connected" }, { status: 403 });

  const token = conn.access_token;
  const results: Record<string, unknown> = {};

  // 1. 프로필
  try {
    const r = await fetch(`${API}/me?fields=id,username,name,threads_profile_picture_url,followers_count&access_token=${token}`);
    results.profile_raw = await r.json();
    results.profile_status = r.status;
  } catch (e) {
    results.profile_error = String(e);
  }

  // 2. /me/threads WITH engagement fields
  try {
    const fields = "id,text,media_type,timestamp,permalink,like_count,replies_count,repost_count,quote_count";
    const r = await fetch(`${API}/me/threads?fields=${fields}&limit=3&access_token=${token}`);
    results.posts_with_eng_raw = await r.json();
    results.posts_with_eng_status = r.status;
  } catch (e) {
    results.posts_with_eng_error = String(e);
  }

  // 3. /me/threads WITHOUT engagement (basic only)
  try {
    const r = await fetch(`${API}/me/threads?fields=id,text&limit=3&access_token=${token}`);
    results.posts_basic_raw = await r.json();
    results.posts_basic_status = r.status;
  } catch (e) {
    results.posts_basic_error = String(e);
  }

  // 4. 첫 번째 게시물의 개별 engagement 조회
  const firstPostId = (results.posts_basic_raw as { data?: { id: string }[] })?.data?.[0]?.id;
  if (firstPostId) {
    try {
      const r = await fetch(`${API}/${firstPostId}?fields=id,like_count,replies_count,repost_count,quote_count&access_token=${token}`);
      results.single_post_eng_raw = await r.json();
      results.single_post_eng_status = r.status;
    } catch (e) {
      results.single_post_eng_error = String(e);
    }

    // 5. 첫 번째 게시물 insights (views)
    try {
      const r = await fetch(`${API}/${firstPostId}/insights?metric=views&access_token=${token}`);
      results.single_post_views_raw = await r.json();
      results.single_post_views_status = r.status;
    } catch (e) {
      results.single_post_views_error = String(e);
    }
  }

  // 6. 프로필 insights (follower_count)
  try {
    const r = await fetch(`${API}/me/threads_insights?metric=follower_count&access_token=${token}`);
    results.follower_insights_raw = await r.json();
    results.follower_insights_status = r.status;
  } catch (e) {
    results.follower_insights_error = String(e);
  }

  // 7. 프로필 insights (views)
  const now = Math.floor(Date.now() / 1000);
  const since = now - 7 * 86400;
  try {
    const r = await fetch(`${API}/me/threads_insights?metric=views&period=day&since=${since}&until=${now}&access_token=${token}`);
    results.views_insights_raw = await r.json();
    results.views_insights_status = r.status;
  } catch (e) {
    results.views_insights_error = String(e);
  }

  return NextResponse.json(results);
}
