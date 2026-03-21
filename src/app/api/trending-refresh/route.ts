/**
 * POST /api/trending-refresh?category=10
 * 트렌딩 강제 새로고침 — Redis 캐시 삭제 후 횟수 차감
 */
import { NextRequest } from "next/server";
import { incrementTrendingRefresh } from "@/lib/trendingLimit";

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("category") ?? "";

  // 횟수 차감
  const result = await incrementTrendingRefresh();
  if (!result.ok) {
    return Response.json(
      {
        error: "REFRESH_LIMIT_EXCEEDED",
        message: result.limit === 0
          ? "이 플랜에서는 새로고침을 사용할 수 없습니다."
          : `오늘 새로고침 횟수(${result.limit}회)를 모두 사용했습니다. 내일 자정에 초기화됩니다.`,
        used: result.used,
        limit: result.limit,
      },
      { status: 429 },
    );
  }

  // Redis 캐시 삭제 (해당 카테고리)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import("@upstash/redis");
      const r = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const { trendingCacheKey } = await import("@/lib/cache");
      await r.del(trendingCacheKey("KR", 50, categoryId));
    }
  } catch {
    // 캐시 삭제 실패해도 계속 진행
  }

  return Response.json({
    ok: true,
    used: result.used,
    limit: result.limit,
    unlimited: result.unlimited,
    remaining: result.limit === null ? null : result.limit - result.used,
  });
}
