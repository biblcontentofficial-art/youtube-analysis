/**
 * 채널 검색 횟수 제한
 * - Free: 일별 (chsearch:d:{userId}:{YYYY-MM-DD})
 * - 그 외: 월별 (chsearch:m:{userId}:{YYYY-MM})
 * - 비로그인: 쿠키 기반
 */

import { auth, currentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { PLANS, PlanKey } from "./stripe";

const COOKIE_COUNT = "bibl_ch_count";
const COOKIE_PERIOD = "bibl_ch_period"; // YYYY-MM or YYYY-MM-DD

let redis: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
  return redis;
}

const mem = new Map<string, number>();

function dailyKey(userId: string): string {
  return `chsearch:d:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function monthKey(userId: string): string {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `chsearch:m:${userId}:${ym}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
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

async function getCount(key: string): Promise<number> {
  const r = await getRedis();
  if (r) {
    try { return (await r.get<number>(key)) ?? 0; }
    catch (e) { console.error("[channelLimit] Redis getCount error:", e); }
  }
  return mem.get(key) ?? 0;
}

// 비로그인 쿠키 — Free 일별
function getCookieCount(isDaily: boolean): number {
  try {
    const jar = cookies();
    const period = jar.get(COOKIE_PERIOD)?.value;
    const count = jar.get(COOKIE_COUNT)?.value;
    const expected = isDaily ? todayString() : currentMonth();
    if (period !== expected) return 0;
    return parseInt(count || "0");
  } catch { return 0; }
}

export type ChannelUsageResult = {
  used: number;
  limit: number;
  plan: PlanKey;
  unlimited: boolean;
  isDaily: boolean;
};

export async function getChannelUsage(): Promise<ChannelUsageResult> {
  let userId: string | null = null;
  try { const a = await auth(); userId = a.userId; } catch {}

  let plan: PlanKey = "free";
  if (userId) {
    try {
      const user = await currentUser();
      const p = user?.plan as PlanKey;
      plan = p in PLANS ? p : "free";
    } catch {}
  }

  const planData = PLANS[plan];

  // Free: 일별 채널 검색 한도
  if (plan === "free" && planData.dailyChannelSearchLimit !== null) {
    const limit = planData.dailyChannelSearchLimit;
    if (!userId) {
      const used = getCookieCount(true);
      return { used, limit, plan, unlimited: false, isDaily: true };
    }
    const used = await getCount(dailyKey(userId));
    return { used, limit, plan, unlimited: false, isDaily: true };
  }

  // 무제한
  if (planData.channelSearchMonthlyLimit === null) {
    const used = userId ? await getCount(monthKey(userId)) : 0;
    return { used, limit: 9999, plan, unlimited: true, isDaily: false };
  }

  // 월별 한도
  const limit = planData.channelSearchMonthlyLimit;
  if (!userId) {
    const used = getCookieCount(false);
    return { used, limit, plan, unlimited: false, isDaily: false };
  }
  const used = await getCount(monthKey(userId));
  return { used, limit, plan, unlimited: false, isDaily: false };
}

export async function incrementChannelCount(): Promise<{ ok: boolean; used: number; limit: number }> {
  let userId: string | null = null;
  try { const a = await auth(); userId = a.userId; } catch {}

  let plan: PlanKey = "free";
  if (userId) {
    try {
      const user = await currentUser();
      const p = user?.plan as PlanKey;
      plan = p in PLANS ? p : "free";
    } catch {}
  }

  const planData = PLANS[plan];

  // ── Free: 일별 채널 검색 한도 ─────────────────────────────────────────────
  if (plan === "free" && planData.dailyChannelSearchLimit !== null) {
    const limit = planData.dailyChannelSearchLimit;

    if (!userId) {
      const current = getCookieCount(true);
      if (current >= limit) return { ok: false, used: current, limit };
      const newCount = current + 1;
      try {
        const jar = cookies();
        jar.set(COOKIE_COUNT, String(newCount), { path: "/", maxAge: 86400 });
        jar.set(COOKIE_PERIOD, todayString(), { path: "/", maxAge: 86400 });
      } catch {}
      return { ok: true, used: newCount, limit };
    }

    const key = dailyKey(userId);
    const r = await getRedis();
    if (r) {
      try {
        const result = await atomicIncrIfUnder(key, limit, secondsUntilMidnight(), r);
        return { ok: result.ok, used: result.used, limit };
      } catch (e) { console.error("[channelLimit] daily atomicIncrIfUnder error:", e); }
    }
    // 폴백
    const current = await getCount(key);
    if (current >= limit) return { ok: false, used: current, limit };
    const used = (mem.get(key) ?? 0) + 1;
    mem.set(key, used);
    return { ok: true, used, limit };
  }

  // ── 무제한 (카운트만 기록) ────────────────────────────────────────────────
  if (planData.channelSearchMonthlyLimit === null) {
    if (userId) {
      const key = monthKey(userId);
      const r = await getRedis();
      if (r) { try { await r.incr(key); } catch {} }
      else { mem.set(key, (mem.get(key) ?? 0) + 1); }
    }
    return { ok: true, used: 0, limit: 9999 };
  }

  // ── 월별 한도 ─────────────────────────────────────────────────────────────
  const limit = planData.channelSearchMonthlyLimit;

  if (!userId) {
    const current = getCookieCount(false);
    if (current >= limit) return { ok: false, used: current, limit };
    const newCount = current + 1;
    try {
      const jar = cookies();
      jar.set(COOKIE_COUNT, String(newCount), { path: "/", maxAge: 60 * 60 * 24 * 32 });
      jar.set(COOKIE_PERIOD, currentMonth(), { path: "/", maxAge: 60 * 60 * 24 * 32 });
    } catch {}
    return { ok: true, used: newCount, limit };
  }

  const key = monthKey(userId);
  const r = await getRedis();

  if (r) {
    try {
      const result = await atomicIncrIfUnder(key, limit, secondsUntilNextMonth(), r);
      return { ok: result.ok, used: result.used, limit };
    } catch (e) { console.error("[channelLimit] monthly atomicIncrIfUnder error:", e); }
  }

  // 폴백
  const current = await getCount(key);
  if (current >= limit) return { ok: false, used: current, limit };
  const used = (mem.get(key) ?? 0) + 1;
  mem.set(key, used);
  return { ok: true, used, limit };
}
