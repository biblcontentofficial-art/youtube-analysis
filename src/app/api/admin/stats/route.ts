import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/adminAuth";

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  starter: 49000,
  pro: 199000,
  business: 490000,
};

function dateStringDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    // ── 1. Clerk 사용자 전체 조회 ──────────────────────────────────
    const allUsers: Record<string, unknown>[] = [];
    let offset = 0;
    while (true) {
      const res = await fetch(
        `https://api.clerk.com/v1/users?limit=100&offset=${offset}&order_by=-created_at`,
        { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
      );
      if (!res.ok) break;
      const page = await res.json();
      if (!Array.isArray(page) || page.length === 0) break;
      allUsers.push(...page);
      if (page.length < 100 || allUsers.length >= 500) break;
      offset += 100;
    }

    // ── 2. 사용자 통계 계산 ────────────────────────────────────────
    const now = Date.now();
    const DAY = 86400000;
    const WEEK = 7 * DAY;

    const newToday = allUsers.filter((u) => (u.created_at as number) > now - DAY).length;
    const newThisWeek = allUsers.filter((u) => (u.created_at as number) > now - WEEK).length;
    const activeToday = allUsers.filter((u) => {
      const last = u.last_active_at as number | null;
      return last && last > now - DAY;
    }).length;
    const activeThisWeek = allUsers.filter((u) => {
      const last = u.last_active_at as number | null;
      return last && last > now - WEEK;
    }).length;

    const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, business: 0 };
    let mrr = 0;
    const userPlanMap: Record<string, string> = {};
    for (const u of allUsers) {
      const meta = (u.public_metadata as Record<string, unknown>) ?? {};
      const plan = (meta.plan as string) ?? "free";
      planCounts[plan] = (planCounts[plan] ?? 0) + 1;
      mrr += PLAN_PRICE[plan] ?? 0;
      userPlanMap[u.id as string] = plan;
    }

    // ── 3. Redis 검색량 통계 ───────────────────────────────────────
    const today = dateStringDaysAgo(0);
    const yesterday = dateStringDaysAgo(1);
    let todaySearches = 0;
    let yesterdaySearches = 0;
    let searchesByPlan: Record<string, number> = { free: 0, starter: 0, pro: 0, business: 0 };
    let searchActiveUsersToday = 0;
    let redisCommandsToday = 0;
    const dailySearches: { date: string; count: number }[] = [];
    let usageMap: Record<string, number> = {};

    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        const userIds = allUsers.map((u) => u.id as string);

        if (userIds.length > 0) {
          // 오늘 검색량
          const todayKeys = userIds.map((id) => `search:${id}:${today}`);
          const todayCounts = await redis.mget<number[]>(...todayKeys);
          for (let i = 0; i < todayCounts.length; i++) {
            const c = todayCounts[i] ?? 0;
            usageMap[userIds[i]] = c;
            if (c > 0) {
              todaySearches += c;
              searchActiveUsersToday++;
              const plan = userPlanMap[userIds[i]] ?? "free";
              searchesByPlan[plan] = (searchesByPlan[plan] ?? 0) + c;
            }
          }

          // 어제 검색량
          const yKeys = userIds.map((id) => `search:${id}:${yesterday}`);
          const yCounts = await redis.mget<number[]>(...yKeys);
          yesterdaySearches = yCounts.reduce((s, c) => s + (c ?? 0), 0);

          // 최근 7일 일별 통계
          for (let d = 6; d >= 0; d--) {
            const dateStr = dateStringDaysAgo(d);
            if (d === 0) {
              dailySearches.push({ date: dateStr, count: todaySearches });
            } else if (d === 1) {
              dailySearches.push({ date: dateStr, count: yesterdaySearches });
            } else {
              const dKeys = userIds.map((id) => `search:${id}:${dateStr}`);
              const dCounts = await redis.mget<number[]>(...dKeys);
              const total = dCounts.reduce((s, c) => s + (c ?? 0), 0);
              dailySearches.push({ date: dateStr, count: total });
            }
          }
        }

        redisCommandsToday = (todaySearches + yesterdaySearches) * 4; // 검색당 ~4 ops 추정
      }
    } catch (e) {
      console.error("Redis stats error:", e);
    }

    // ── 4. YouTube API 쿼터 계산 ───────────────────────────────────
    const UNITS_PER_SEARCH = 105; // search(100) + videos(1) + channels(4)
    const FREE_QUOTA_PER_KEY = 10000;
    // 실제 env에서 키 수 동적 계산
    let FREE_KEY_COUNT = process.env.YOUTUBE_API_KEY ? 1 : 0;
    for (let i = 2; i <= 10; i++) { if (process.env[`YOUTUBE_API_KEY_${i}`]) FREE_KEY_COUNT++; }
    let PAID_KEY_COUNT = 0;
    for (let i = 1; i <= 10; i++) { if (process.env[`YOUTUBE_API_KEY_PAID_${i}`]) PAID_KEY_COUNT++; }
    const totalFreeQuota = FREE_KEY_COUNT * FREE_QUOTA_PER_KEY; // 90,000
    const totalPaidQuota = PAID_KEY_COUNT * FREE_QUOTA_PER_KEY; // 10,000
    const estimatedUnitsToday = todaySearches * UNITS_PER_SEARCH;
    const quotaUsedPct = Math.min(100, Math.round((estimatedUnitsToday / totalFreeQuota) * 100));
    const capacitySearches = Math.floor(totalFreeQuota / UNITS_PER_SEARCH);
    const overageUnits = Math.max(0, estimatedUnitsToday - totalFreeQuota);
    // YouTube API 초과 요금: $5/1,000 units ≈ 7,000원/1,000 units (1USD≈1400원)
    const overageCostKRW = Math.round((overageUnits / 1000) * 5 * 1400);

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
