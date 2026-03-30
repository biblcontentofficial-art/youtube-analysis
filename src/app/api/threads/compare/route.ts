/**
 * GET /api/threads/compare?q=keyword
 * 유튜브 + 스레드 동시 검색 → 비교 데이터 반환
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getThreadsConnection } from "@/lib/db";
import { searchThreads } from "@/lib/threads";
import { searchVideos } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "키워드를 입력해주세요" }, { status: 400 });
  }

  const connection = await getThreadsConnection(userId);

  // 병렬 실행: 유튜브 + 스레드
  const [youtubeResult, threadsResult] = await Promise.allSettled([
    searchVideos(q).catch(() => null),
    connection
      ? searchThreads(q, connection.access_token).catch(() => null)
      : Promise.resolve(null),
  ]);

  // 유튜브 결과 요약
  const ytData = youtubeResult.status === "fulfilled" ? youtubeResult.value : null;
  const ytItems = (ytData as Record<string, unknown>)?.items as Array<Record<string, unknown>> ?? [];
  const ytViews = ytItems.map((v) => Number((v as Record<string, unknown>).viewCount ?? 0));
  const ytAvgViews = ytViews.length > 0 ? Math.round(ytViews.reduce((a, b) => a + b, 0) / ytViews.length) : 0;

  // 스레드 결과 요약
  const thData = threadsResult.status === "fulfilled" ? threadsResult.value : null;
  const thPosts = thData?.posts ?? [];
  const thEngagements = thPosts.map((p) => p.like_count + p.repost_count + p.replies_count);
  const thAvgEng = thEngagements.length > 0 ? Math.round(thEngagements.reduce((a, b) => a + b, 0) / thEngagements.length) : 0;
  const thAvgViral = thPosts.length > 0 ? Math.round(thPosts.reduce((s, p) => s + p.viralScore, 0) / thPosts.length) : 0;

  return NextResponse.json({
    keyword: q,
    youtube: {
      available: ytItems.length > 0,
      count: ytItems.length,
      avgViews: ytAvgViews,
      maxViews: ytViews.length > 0 ? Math.max(...ytViews) : 0,
    },
    threads: {
      available: thPosts.length > 0,
      connected: !!connection,
      count: thPosts.length,
      avgEngagement: thAvgEng,
      avgViralScore: thAvgViral,
      maxEngagement: thEngagements.length > 0 ? Math.max(...thEngagements) : 0,
    },
  });
}
