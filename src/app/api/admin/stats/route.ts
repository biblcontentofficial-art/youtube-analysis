import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/adminAuth";

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  starter: 49000,
  pro: 199000,
  business: 490000,
  team: 0,   // 매출 집계 제외
  admin: 0,  // 매출 집계 제외
};

// 월별로 추적하는 플랜 (searchLimit.ts와 동일)
const MONTHLY_PLANS = new Set(["starter", "pro", "business", "admin", "team"]);

function dateStringDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.email ?? "";
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // ── 1. Supabase profiles에서 사용자 전체 조회 ─────────────────
    const { getSupabase } = await import("@/lib/supabase");
    const db = getSupabase();
    if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { data: profileRows } = await db
      .from("profiles")
      .select("id, email, plan, created_at, last_sign_in_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const allUsers = (profileRows ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      created_at: p.created_at ? new Date(p.created_at as string).getTime() : 0,
      last_active_at: p.last_sign_in_at ? new Date(p.last_sign_in_at as string).getTime() : null,
      plan: (p.plan as string) ?? "free",
    }));

    // ── 2. 사용자 통계 계산 ────────────────────────────────────────
    const now = Date.now();
    const DAY = 86400000;
    const WEEK = 7 * DAY;

    const newToday = allUsers.filter((u) => u.created_at > now - DAY).length;
    const newThisWeek = allUsers.filter((u) => u.created_at > now - WEEK).length;
    const activeToday = allUsers.filter((u) => {
      return u.last_active_at && u.last_active_at > now - DAY;
    }).length;
    const activeThisWeek = allUsers.filter((u) => {
      return u.last_active_at && u.last_active_at > now - WEEK;
    }).length;

    const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, business: 0, team: 0, admin: 0 };
    let mrr = 0;
    const userPlanMap: Record<string, string> = {};
    for (const u of allUsers) {
      const plan = u.plan;
      planCounts[plan] = (planCounts[plan] ?? 0) + 1;
      mrr += PLAN_PRICE[plan] ?? 0;
      userPlanMap[u.id] = plan;
    }

    // ── 3. Redis 검색량 통계 ───────────────────────────────────────
    const today = dateStringDaysAgo(0);
    const yesterday = dateStringDaysAgo(1);
    const ym = currentYearMonth();

    let todaySearches = 0;
    let yesterdaySearches = 0;
    let searchesByPlan: Record<string, number> = { free: 0, starter: 0, pro: 0, business: 0, team: 0, admin: 0 };
    let searchActiveUsersToday = 0;
    let redisCommandsToday = 0;
    const dailySearches: { date: string; count: number }[] = [];
    // usageMap: Free → 오늘 일별, 유료 → 이번달 월별
    let usageMap: Record<string, number> = {};

    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        const userIds = allUsers.map((u) => u.id);
        const freeIds = userIds.filter((id) => !MONTHLY_PLANS.has(userPlanMap[id] ?? "free"));
        const paidIds = userIds.filter((id) => MONTHLY_PLANS.has(userPlanMap[id] ?? "free"));

        // ── 글로벌 일별 카운터 (실제 YouTube API 사용량) ──────────────────
        // searchLimit.ts의 incrementSearchCount()가 성공 시 search:global:d:{date}에 기록
        const globalKey = `search:global:d:${today}`;
        const globalYesterday = `search:global:d:${yesterday}`;
        const [globalTodayCount, globalYesterdayCount] = await Promise.all([
          redis.get<number>(globalKey).catch(() => null),
          redis.get<number>(globalYesterday).catch(() => null),
        ]);
        todaySearches = globalTodayCount ?? 0;
        yesterdaySearches = globalYesterdayCount ?? 0;

        // ── Free 유저: 일별 키 → 사용자별 usageMap ──────────────────────────
        if (freeIds.length > 0) {
          const todayKeys = freeIds.map((id) => `search:d:${id}:${today}`);
          const todayCounts = await redis.mget<number[]>(...todayKeys);
          for (let i = 0; i < freeIds.length; i++) {
            const c = todayCounts[i] ?? 0;
            usageMap[freeIds[i]] = c;
            if (c > 0) {
              searchActiveUsersToday++;
              searchesByPlan["free"] = (searchesByPlan["free"] ?? 0) + c;
            }
          }
        }

        // ── 유료 유저: 월별 키 → 사용자별 usageMap ─────────────────────────
        if (paidIds.length > 0) {
          const monthlyKeys = paidIds.map((id) => `search:m:${id}:${ym}`);
          const monthlyCounts = await redis.mget<number[]>(...monthlyKeys);
          for (let i = 0; i < paidIds.length; i++) {
            const c = monthlyCounts[i] ?? 0;
            usageMap[paidIds[i]] = c;
            if (c > 0) {
              searchActiveUsersToday++;
              const plan = userPlanMap[paidIds[i]] ?? "free";
              searchesByPlan[plan] = (searchesByPlan[plan] ?? 0) + c;
            }
          }
        }

        // ── 최근 7일 일별 통계 (글로벌 카운터 우선, 없으면 per-user 합산) ──
        for (let d = 6; d >= 0; d--) {
          const dateStr = dateStringDaysAgo(d);
          if (d === 0) {
            dailySearches.push({ date: dateStr, count: todaySearches });
          } else if (d === 1) {
            dailySearches.push({ date: dateStr, count: yesterdaySearches });
          } else {
            const gKey = `search:global:d:${dateStr}`;
            const gCount = await redis.get<number>(gKey).catch(() => null);
            if (gCount !== null) {
              dailySearches.push({ date: dateStr, count: gCount ?? 0 });
            } else {
              // 글로벌 키 없으면 per-user daily 합산 (레거시)
              const allDayKeys = userIds.map((id) => `search:d:${id}:${dateStr}`);
              const dayCounts = await redis.mget<number[]>(...allDayKeys);
              const total = dayCounts.reduce((s, c) => s + (c ?? 0), 0);
              dailySearches.push({ date: dateStr, count: total });
            }
          }
        }

        redisCommandsToday = 0; // 아래에서 실측값으로 대체
      }
    } catch (e) {
      console.error("Redis stats error:", e);
    }

    // ── 4. 실측 metrics 읽기 (YouTube API 실제 호출 수, 캐시 히트율) ─────────
    let ytSearchCalls = 0, ytVideosCalls = 0, ytChannelsCalls = 0, ytPlaylistCalls = 0;
    let cacheHits = 0, cacheMisses = 0, cacheSets = 0;

    try {
      const { getYtApiMetrics, getCacheMetrics } = await import("@/lib/metrics");
      const [ytMetrics, cacheMetrics] = await Promise.all([
        getYtApiMetrics(today),
        getCacheMetrics(today),
      ]);
      ytSearchCalls = ytMetrics.searchCalls;
      ytVideosCalls = ytMetrics.videosCalls;
      ytChannelsCalls = ytMetrics.channelsCalls;
      ytPlaylistCalls = ytMetrics.playlistCalls;
      cacheHits = cacheMetrics.hits;
      cacheMisses = cacheMetrics.misses;
      cacheSets = cacheMetrics.sets;
    } catch (e) {
      console.error("Metrics read error:", e);
    }

    // ── 5. YouTube API 쿼터 계산 (실측 우선, 없으면 추정) ──────────────────
    const FREE_QUOTA_PER_KEY = 10000;
    let FREE_KEY_COUNT = process.env.YOUTUBE_API_KEY ? 1 : 0;
    for (let i = 2; i <= 10; i++) { if (process.env[`YOUTUBE_API_KEY_${i}`]) FREE_KEY_COUNT++; }
    let PAID_KEY_COUNT = 0;
    for (let i = 1; i <= 10; i++) { if (process.env[`YOUTUBE_API_KEY_PAID_${i}`]) PAID_KEY_COUNT++; }
    const totalFreeQuota = FREE_KEY_COUNT * FREE_QUOTA_PER_KEY;
    const totalPaidQuota = PAID_KEY_COUNT * FREE_QUOTA_PER_KEY;

    // 실측 units: search.list×100 + videos.list×1 + channels.list×1 + playlist×1
    const actualUnitsToday = ytSearchCalls * 100 + ytVideosCalls + ytChannelsCalls + ytPlaylistCalls;
    // 실측 없으면 글로벌 검색 카운터 기반 추정 (레거시 폴백)
    const UNITS_PER_SEARCH = 102;
    const estimatedUnitsToday = actualUnitsToday > 0
      ? actualUnitsToday
      : todaySearches * UNITS_PER_SEARCH;
    const isActualUnits = actualUnitsToday > 0;

    const quotaUsedPct = Math.min(100, Math.round((estimatedUnitsToday / totalFreeQuota) * 100));
    const capacitySearches = Math.floor(totalFreeQuota / UNITS_PER_SEARCH);
    const overageUnits = Math.max(0, estimatedUnitsToday - totalFreeQuota);
    const overageCostKRW = Math.round((overageUnits / 1000) * 5 * 1400);

    // 실측 Redis ops: cache 조작 + searchLimit ops (글로벌 카운터×2 + 사용자 카운터×2)
    const actualRedisOps = cacheHits + cacheMisses + cacheSets * 2 + todaySearches * 4;
    redisCommandsToday = actualRedisOps > 0 ? actualRedisOps : redisCommandsToday;

    return NextResponse.json({
      users: {
        total: allUsers.length,
        paying: allUsers.length - (planCounts.free ?? 0),
        newToday,
        newThisWeek,
        activeToday,
        activeThisWeek,
        planCounts,
        mrr,
      },
      searches: {
        today: todaySearches,
        yesterday: yesterdaySearches,
        activeUsersToday: searchActiveUsersToday,
        byPlan: searchesByPlan,
        daily: dailySearches,
        usageMap,
      },
      youtube: {
        estimatedUnitsToday,
        isActualUnits,          // true면 실측값, false면 추정값
        ytSearchCalls,
        ytVideosCalls,
        ytChannelsCalls,
        freeQuota: totalFreeQuota,
        paidQuota: totalPaidQuota,
        quotaUsedPct,
        freeKeyCount: FREE_KEY_COUNT,
        paidKeyCount: PAID_KEY_COUNT,
        unitsPerSearch: UNITS_PER_SEARCH,
        capacitySearches,
        overageCostKRW,
      },
      redis: {
        estimatedCommandsToday: redisCommandsToday,
        cacheHits,
        cacheMisses,
        cacheSets,
        cacheHitRate: (cacheHits + cacheMisses) > 0
          ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)
          : 0,
        freeLimit: 10000,
        usedPct: Math.min(100, Math.round((redisCommandsToday / 10000) * 100)),
      },
      clerk: {
        totalUsers: allUsers.length,
        freeLimit: 10000,
        usedPct: Math.min(100, Math.round((allUsers.length / 10000) * 100)),
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
