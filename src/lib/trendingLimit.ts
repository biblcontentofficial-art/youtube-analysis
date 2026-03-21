/**
 * 트렌딩 강제 새로고침 횟수 제한
 * - 캐시된 데이터 조회: 무제한 (비용 0)
 * - 강제 새로고침 (캐시 무시): 플랜별 일 제한
 *
 * Redis 키: trending:refresh:{userId}:{YYYY-MM-DD}
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "./stripe";

let redis: import("@upstash/redis").Redis | null = null;
const memoryStore = new Map<string, number>();

async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
  return redis;
}

function todayKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `trending:refresh:${userId}:${today}`;
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return Math.max(Math.floor((midnight.getTime() - now.getTime()) / 1000), 1);
}

async function getCount(key: string): Promise<number> {
  const r = await getRedis();
  if (r) {
    try { return (await r.get<number>(key)) ?? 0; } catch { /**/ }
  }
  return memoryStore.get(key) ?? 0;
}

async function increment(key: string): Promise<number> {
  const r = await getRedis();
  if (r) {
    try {
      const val = await r.incr(key);
      if (val === 1) await r.expire(key, secondsUntilMidnight());
      return val;
    } catch { /**/ }
  }
  const val = (memoryStore.get(key) ?? 0) + 1;
  memoryStore.set(key, val);
  return val;
}

export type TrendingRefreshResult = {
  ok: boolean;
  used: number;
  limit: number | null; // null = 무제한
  unlimited: boolean;
};

/** 강제 새로고침 가능 여부 조회 (차감 없음) */
export async function getTrendingRefreshUsage(): Promise<TrendingRefreshResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, used: 0, limit: 0, unlimited: false };

  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as PlanKey) ?? "free";
  const planData = PLANS[plan] ?? PLANS.free;
  const limit = planData.trendingRefreshLimit;

  if (limit === null) return { ok: true, used: 0, limit: null, unlimited: true };
  if (limit === 0) return { ok: false, used: 0, limit: 0, unlimited: false };

  const key = todayKey(userId);
  const used = await getCount(key);
  return { ok: used < limit, used, limit, unlimited: false };
}

/** 강제 새로고침 실행 (횟수 차감) */
export async function incrementTrendingRefresh(): Promise<TrendingRefreshResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, used: 0, limit: 0, unlimited: false };

  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as PlanKey) ?? "free";
  const planData = PLANS[plan] ?? PLANS.free;
  const limit = planData.trendingRefreshLimit;

  if (limit === null) {
    // 무제한: 통계용으로만 기록
    const key = todayKey(userId);
    const used = await increment(key);
    return { ok: true, used, limit: null, unlimited: true };
  }
  if (limit === 0) return { ok: false, used: 0, limit: 0, unlimited: false };

  const key = todayKey(userId);
  const current = await getCount(key);
  if (current >= limit) return { ok: false, used: current, limit, unlimited: false };

  const used = await increment(key);
  return { ok: used <= limit, used, limit, unlimited: false };
}
