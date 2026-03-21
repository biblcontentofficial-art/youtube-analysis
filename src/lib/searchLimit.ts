/**
 * 검색 횟수 제한 관리
 * - 로그인: Clerk userId + Redis/Memory
 * - 비로그인: 쿠키 기반 (브라우저별 추적)
 *
 * 플랜별 추적 방식:
 * - free: 일별 (search:d:{userId}:{YYYY-MM-DD})
 * - starter: 월별 + 일별 (search:m:{userId}:{YYYY-MM} + search:d:{userId}:{YYYY-MM-DD})
 * - pro: 월별 (search:m:{userId}:{YYYY-MM})
 * - business/admin: 월별 (무제한, 통계용)
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { PLANS, PlanKey } from "./stripe";

const COOKIE_NAME = "bibl_search_count";
const COOKIE_DATE = "bibl_search_date";

let redis: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (redis) return redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const memoryStore = new Map<string, number>();

function dailyKey(userId: string) {
  return `search:d:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function monthlyKey(userId: string) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `search:m:${userId}:${ym}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function pruneMemoryStore() {
  const today = todayString();
  for (const key of memoryStore.keys()) {
    if (key.startsWith("search:d:") && !key.endsWith(`:${today}`)) {
      memoryStore.delete(key);
    }
  }
}

async function getCount(key: string, r: typeof redis): Promise<number> {
  if (r) {
    try {
      return (await r.get<number>(key)) ?? 0;
    } catch {
      return memoryStore.get(key) ?? 0;
    }
  }
  return memoryStore.get(key) ?? 0;
}

async function incrWithTtl(key: string, ttlSeconds: number, r: typeof redis): Promise<number> {
  if (r) {
    try {
      const val = await r.incr(key);
      if (val === 1) await r.expire(key, ttlSeconds);
      return val;
    } catch {
      pruneMemoryStore();
      const val = (memoryStore.get(key) ?? 0) + 1;
      memoryStore.set(key, val);
      return val;
    }
  }
  pruneMemoryStore();
  const val = (memoryStore.get(key) ?? 0) + 1;
  memoryStore.set(key, val);
  return val;
}

function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return Math.max(Math.floor((midnight.getTime() - now.getTime()) / 1000), 1);
}

function secondsUntilNextMonth(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.max(Math.floor((next.getTime() - now.getTime()) / 1000) + 86400, 1);
}

export async function getUserPlan(): Promise<PlanKey> {
  try {
    const user = await currentUser();
    const plan = (user?.publicMetadata?.plan as PlanKey) ?? "free";
    return plan in PLANS ? plan : "free";
  } catch {
    return "free";
  }
}

async function getServerUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

function getCookieCount(): number {
  try {
    const jar = cookies();
    const date = jar.get(COOKIE_DATE)?.value;
    const count = jar.get(COOKIE_NAME)?.value;
    if (date !== todayString()) return 0;
    return parseInt(count || "0");
  } catch {
    return 0;
  }
}

export type UsageResult = {
  used: number;
  limit: number;
  plan: PlanKey;
  isMonthly: boolean;
  unlimited: boolean;
};

export async function getSearchUsage(): Promise<UsageResult> {
  const userId = await getServerUserId();

  if (!userId) {
    const used = getCookieCount();
    return { used, limit: PLANS.free.dailySearchLimit!, plan: "free", isMonthly: false, unlimited: false };
  }

  const plan = await getUserPlan();
  const planData = PLANS[plan];
  const r = await getRedis();

  // Free: 일별 추적
  if (plan === "free") {
    const key = dailyKey(userId);
    const used = await getCount(key, r);
    return { used, limit: planData.dailySearchLimit!, plan, isMonthly: false, unlimited: false };
  }

  // Business/Admin: 무제한 (통계용 월별 카운트)
  if (planData.monthlySearchLimit === null && planData.dailySearchLimit === null) {
    const key = monthlyKey(userId);
    const used = await getCount(key, r);
    return { used, limit: 9999, plan, isMonthly: true, unlimited: true };
  }

  // Starter/Pro: 월별 추적 (+ Starter는 일별도 체크)
  const mKey = monthlyKey(userId);
  const used = await getCount(mKey, r);
  return { used, limit: planData.monthlySearchLimit!, plan, isMonthly: true, unlimited: false };
}

export async function incrementSearchCount(): Promise<{ ok: boolean; used: number; limit: number }> {
  const userId = await getServerUserId();

  if (!userId) {
    // 비로그인: 쿠키 기반 Free 한도
    const limit = PLANS.free.dailySearchLimit!;
    const current = getCookieCount();
    if (current >= limit) return { ok: false, used: current, limit };

    const newCount = current + 1;
    try {
      const jar = cookies();
      jar.set(COOKIE_NAME, String(newCount), { path: "/", maxAge: 86400 });
      jar.set(COOKIE_DATE, todayString(), { path: "/", maxAge: 86400 });
    } catch {}
    return { ok: true, used: newCount, limit };
  }

  const plan = await getUserPlan();
  const planData = PLANS[plan];
  const r = await getRedis();

  // Free: 일별 제한
  if (plan === "free") {
    const key = dailyKey(userId);
    const limit = planData.dailySearchLimit!;
    const current = await getCount(key, r);
    if (current >= limit) return { ok: false, used: current, limit };
    const used = await incrWithTtl(key, secondsUntilMidnight(), r);
    return { ok: used <= limit, used, limit };
  }

  // Business/Admin: 무제한 (카운트만 기록)
  if (planData.monthlySearchLimit === null && planData.dailySearchLimit === null) {
    const key = monthlyKey(userId);
    await incrWithTtl(key, secondsUntilNextMonth(), r);
    return { ok: true, used: 0, limit: 9999 };
  }

  // Starter: 일별 상한 먼저 체크
  if (planData.dailySearchLimit !== null) {
    const dKey = dailyKey(userId);
    const dailyUsed = await getCount(dKey, r);
    if (dailyUsed >= planData.dailySearchLimit) {
      return { ok: false, used: dailyUsed, limit: planData.dailySearchLimit };
    }
  }

  // Starter/Pro: 월별 상한 체크 후 증가
  const mKey = monthlyKey(userId);
  const monthlyLimit = planData.monthlySearchLimit!;
  const monthlyUsed = await getCount(mKey, r);
  if (monthlyUsed >= monthlyLimit) {
    return { ok: false, used: monthlyUsed, limit: monthlyLimit };
  }

  const newMonthly = await incrWithTtl(mKey, secondsUntilNextMonth(), r);

  // Starter: 일별 카운트도 증가
  if (planData.dailySearchLimit !== null) {
    const dKey = dailyKey(userId);
    await incrWithTtl(dKey, secondsUntilMidnight(), r);
  }

  return { ok: newMonthly <= monthlyLimit, used: newMonthly, limit: monthlyLimit };
}
