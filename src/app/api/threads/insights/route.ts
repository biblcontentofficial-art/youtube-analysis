/**
 * GET /api/threads/insights?period=7
 * 내 계정 인사이트 — 대시보드 데이터 전체
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
  const period = Number(searchParams.get("period") ?? 7);

  const now = Math.floor(Date.now() / 1000);
  const since = now - period * 86400;

  try {
    // 병렬 실행
    const [profile, insights, posts] = await Promise.all([
      getThreadsProfile(connection.access_token),
      getMyProfileInsights(connection.access_token, since, now),
      getMyPostsWithInsights(connection.access_token, 50),
    ]);

    // 기간 내 게시물 필터
    const periodStart = new Date(since * 1000);
    const periodPosts = posts.filter(
      (p) => new Date(p.timestamp) >= periodStart
    );

    // 기간 내 합산 (summary 카드용)
    const totalLikes = periodPosts.reduce((s, p) => s + p.likes, 0);
    const totalReplies = periodPosts.reduce((s, p) => s + p.replies, 0);
    const totalReposts = periodPosts.reduce((s, p) => s + p.reposts, 0);
    const totalQuotes = periodPosts.reduce((s, p) => s + p.quotes, 0);

    // 인기 콘텐츠 TOP 3 (전체 게시물 중 engagement 높은 순)
    const topPosts = [...posts]
      .sort((a, b) => {
        const engA = a.likes + a.replies + a.reposts + a.quotes;
        const engB = b.likes + b.replies + b.reposts + b.quotes;
        return engB - engA;
      })
      .slice(0, 3);

    // 게시 연속 기록 (posting streak)
    const postDates = new Set(
      posts.map((p) => p.timestamp.split("T")[0])
    );
    // 오늘부터 역순으로 연속 게시일 계산
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (postDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // 오늘 안 올렸으면 어제부터 체크
        break;
      }
    }

    // 최근 30일 게시 히트맵 데이터
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        date: dateStr,
        count: posts.filter((p) => p.timestamp.startsWith(dateStr)).length,
      };
    });

    // 콘텐츠 아이디어 (인기 게시물 기반 제안)
    const topTopics = topPosts
      .filter((p) => p.text.length > 10)
      .map((p) => {
        const text = p.text.slice(0, 60).replace(/\n/g, " ");
        return {
          topic: text,
          engagement: p.likes + p.replies + p.reposts,
          type: p.media_type,
        };
      });

    // 평균 통계
    const n = posts.length || 1;

    return NextResponse.json({
      profile: {
        ...profile,
        followers_count: insights.followers_count || profile.followers_count,
      },
      summary: {
        views: insights.views,
        likes: totalLikes,
        replies: totalReplies,
        reposts: totalReposts,
        quotes: totalQuotes,
        followers_count: insights.followers_count || profile.followers_count,
      },
      daily_views: insights.daily_views,
      posts,
      period_posts_count: periodPosts.length,
      // 대시보드 카드 데이터
      dashboard: {
        streak,
        last30,
        topPosts,
        topTopics,
      },
      averages: {
        total_posts: posts.length,
        avg_views: Math.round(posts.reduce((s, p) => s + p.views, 0) / n),
        avg_likes: Math.round(posts.reduce((s, p) => s + p.likes, 0) / n),
        avg_replies: Math.round(posts.reduce((s, p) => s + p.replies, 0) / n),
        avg_reposts: Math.round(posts.reduce((s, p) => s + p.reposts, 0) / n),
        avg_quotes: Math.round(posts.reduce((s, p) => s + p.quotes, 0) * 10 / n) / 10,
        avg_engagement_rate: Math.round(posts.reduce((s, p) => s + p.engagement_rate, 0) * 10 / n) / 10,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Threads insights]", message);

    if (message.includes("190") || message.includes("invalid_token")) {
      return NextResponse.json(
        { error: "TOKEN_EXPIRED", message: "Meta 연결이 만료됐어요. 다시 연결해주세요." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
