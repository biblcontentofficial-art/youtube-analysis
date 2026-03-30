/**
 * 스레드 검색 횟수 제한 (searchLimit.ts 패턴 동일)
 *
 * Redis 키 prefix: threads:d / threads:m (search:d / search:m 과 충돌 없음)
 *
 * 플랜별 한도:
 *   free     : 2회/일
 *   starter  : 30회/월
 *   pro      : 200회/월
 *   business : 무제한
 *   admin    : 무제한
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "./stripe";

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
  return `threads:d:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function monthlyKey(userId: string) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `threads:m:${userId}:${ym}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function pruneMemoryStore() {
  const today = todayString();
  const now = new Date();
  const currentYM = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  for (const key of memoryStore.keys()) {
    if (key.startsWith("threads:d:") && !key.endsWith(`:${today}`)) {
      memoryStore.delete(key);
    }
    if (key.startsWith("threads:m:") && !key.includes(`:${currentYM}`)) {
      memoryStore.delete(key);
    }
  }
}

async function atomicIncrIfUnder(
  key: string,
  limit: number,
  ttlSeconds: number,
  r: NonNullable<typeof redis>
): Promise<{ ok: boolean; used: number }> {
  const script = `
local cur = tonumber(redis.call('GET', KEYS[1])) or 0
if cur >= tonumber(ARGV[1]) then return {0, cur} end
local nv = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) == -1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
end
return {1, nv}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await r.eval(script, [key], [String(limit), String(ttlSeconds)]) as any;
  return { ok: Number(res[0]) === 1, used: Number(res[1]) };
}

async function getCount(key: string, r: typeof redis): Promise<number> {
  if (r) {
    try { return (await r.get<number>(key)) ?? 0; } catch { /* fallthrough */ }
  }
  return memoryStore.get(key) ?? 0;
}

async function incrWithTtl(key: string, ttlSeconds: number, r: typeof redis): Promise<number> {
  if (r) {
    try {
      const val = await r.incr(key);
      if (val === 1) await r.expire(key, ttlSeconds);
      return val;
    } catch { /* fallthrough */ }
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
  return Math.max(Math.floor((next.getTime() - now.getTime()) / 1000), 1);
}

// 플랜별 스레드 검색 한도 (stripe.ts의 threadsMonthlyLimit 대응)
function getThreadsLimit(plan: PlanKey): {
  daily: number | null;   // null = 일 한도 없음
  monthly: number | null; // null = 무제한
} {
  switch (plan) {
    case "free":     return { daily: 2,   monthly: null };
    case "starter":  return { daily: null, monthly: 30   };
    case "pro":      return { daily: null, monthly: 200  };
    case "business": return { daily: null, monthly: null };
    case "admin":    return { daily: null, monthly: null };
  }
}

async function getUserPlan(): Promise<PlanKey> {
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

export type ThreadsUsageResult = {
  used: number;
  limit: number;
  plan: PlanKey;
  isMonthly: boolean;
  unlimited: boolean;
};

export async function getThreadsUsage(): Promise<ThreadsUsageResult> {
  const userId = await getServerUserId();
  if (!userId) {
    return { used: 0, limit: 2, plan: "free", isMonthly: false, unlimited: false };
  }

  const plan = await getUserPlan();
  const limits = getThreadsLimit(plan);
  const r = await getRedis();

  if (limits.monthly === null && limits.daily === null) {
    const key = monthlyKey(userId);
    const used = await getCount(key, r);
    return { used, limit: 9999, plan, isMonthly: true, unlimited: true };
  }

  if (limits.daily !== null) {
    const key = dailyKey(userId);
    const used = await getCount(key, r);
    return { used, limit: limits.daily, plan, isMonthly: false, unlimited: false };
  }

  const key = monthlyKey(userId);
  const used = await getCount(key, r);
  return { used, limit: limits.monthly!, plan, isMonthly: true, unlimited: false };
}

export async function incrementThreadsCount(): Promise<{ ok: boolean; used: number; limit: number }> {
  const userId = await getServerUserId();
  if (!userId) {
    return { ok: false, used: 0, limit: 2 }; // 미로그인은 검색 불가
  }

  const plan = await getUserPlan();
  const limits = getThreadsLimit(plan);
  const r = await getRedis();

  // 무제한 (business/admin)
  if (limits.monthly === null && limits.daily === null) {
    const key = monthlyKey(userId);
    await incrWithTtl(key, secondsUntilNextMonth(), r);
    return { ok: true, used: 0, limit: 9999 };
  }

  // 일별 한도 (free)
  if (limits.daily !== null) {
    const key = dailyKey(userId);
    const limit = limits.daily;

    if (r) {
      try {
        const result = await atomicIncrIfUnder(key, limit, secondsUntilMidnight(), r);
        return { ok: result.ok, used: result.used, limit };
      } catch { /* fallthrough */ }
    }
    pruneMemoryStore();
    const current = memoryStore.get(key) ?? 0;
    if (current >= limit) return { ok: false, used: current, limit };
    const used = current + 1;
    memoryStore.set(key, used);
    return { ok: true, used, limit };
  }

  // 월별 한도 (starter/pro)
  const key = monthlyKey(userId);
  const limit = limits.monthly!;

  if (r) {
    try {
      const result = await atomicIncrIfUnder(key, limit, secondsUntilNextMonth(), r);
      return { ok: result.ok, used: result.used, limit };
    } catch { /* fallthrough */ }
  }

  pruneMemoryStore();
  const current = memoryStore.get(key) ?? 0;
  if (current >= limit) return { ok: false, used: current, limit };
  const used = current + 1;
  memoryStore.set(key, used);
  return { ok: true, used, limit };
}
