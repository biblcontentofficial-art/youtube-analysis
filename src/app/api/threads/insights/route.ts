/**
 * GET /api/threads/insights?period=7
 * 내 계정 인사이트 — 프로필 조회수 + 게시물 성과
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getThreadsConnection } from "@/lib/db";
import {
  getMyProfileInsights,
  getMyPostsWithInsights,
  getThreadsProfile,
} from "@/lib/threads";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const connection = await getThreadsConnection(userId);
  if (!connection) {
    return NextResponse.json(
      { error: "META_NOT_CONNECTED", message: "Meta 계정을 먼저 연결해주세요" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const period = Number(searchParams.get("period") ?? 7); // 7, 14, 30

  const now = Math.floor(Date.now() / 1000);
  const since = now - period * 86400;

  try {
    // 병렬 실행: 프로필 + 인사이트 + 게시물
    const [profile, insights, posts] = await Promise.all([
      getThreadsProfile(connection.access_token),
      getMyProfileInsights(connection.access_token, since, now),
      getMyPostsWithInsights(connection.access_token, 50),
    ]);

    // 기간 내 게시물만 필터
    const periodStart = new Date(since * 1000);
    const periodPosts = posts.filter(
      (p) => new Date(p.timestamp) >= periodStart
    );

    // 기간 내 합산 통계
    const totalLikes = periodPosts.reduce((s, p) => s + p.likes, 0);
    const totalReplies = periodPosts.reduce((s, p) => s + p.replies, 0);
    const totalReposts = periodPosts.reduce((s, p) => s + p.reposts, 0);
    const totalQuotes = periodPosts.reduce((s, p) => s + p.quotes, 0);

    return NextResponse.json({
      profile: {
        ...profile,
        followers_count: profile.followers_count,
      },
      summary: {
        views: insights.views,
        likes: totalLikes,
        replies: totalReplies,
        reposts: totalReposts,
        quotes: totalQuotes,
        followers_count: profile.followers_count,
      },
      daily_views: insights.daily_views,
      posts, // 전체 게시물 (기간 관계없이)
      period_posts_count: periodPosts.length,
      // 평균 통계 (전체 게시물 기준)
      averages: {
        total_posts: posts.length,
        avg_views: posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.views, 0) / posts.length) : 0,
        avg_likes: posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.likes, 0) / posts.length) : 0,
        avg_replies: posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.replies, 0) / posts.length) : 0,
        avg_reposts: posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.reposts, 0) / posts.length) : 0,
        avg_quotes: posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.quotes, 0) / posts.length * 10) / 10 : 0,
        avg_engagement_rate: posts.length > 0
          ? Math.round(posts.reduce((s, p) => s + p.engagement_rate, 0) / posts.length * 10) / 10
          : 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("190") || message.includes("invalid_token")) {
      return NextResponse.json(
        { error: "TOKEN_EXPIRED", message: "Meta 연결이 만료됐어요. 다시 연결해주세요." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
