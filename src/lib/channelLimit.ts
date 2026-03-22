/**
 * 채널 검색 횟수 제한 (월별)
 * Redis 키: chsearch:m:{userId}:{YYYY-MM}
 * 비로그인: 쿠키 기반 (월별 리셋)
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { PLANS, PlanKey } from "./stripe";

const COOKIE_COUNT = "bibl_ch_count";
const COOKIE_MONTH = "bibl_ch_month";

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

function monthKey(userId: string): string {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `chsearch:m:${userId}:${ym}`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function secondsUntilNextMonth(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.max(Math.floor((next.getTime() - now.getTime()) / 1000), 1);
}

/**
 * Redis Lua 스크립트로 원자적 체크 + 증가
 * current >= limit → { ok: false, used: current }
 * current <  limit → { ok: true,  used: newval  }
 */
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

function getCookieCount(): number {
  try {
    const jar = cookies();
    const month = jar.get(COOKIE_MONTH)?.value;
    const count = jar.get(COOKIE_COUNT)?.value;
    if (month !== currentMonth()) return 0;
    return parseInt(count || "0");
  } catch { return 0; }
}

export type ChannelUsageResult = {
  used: number;
  limit: number;
  plan: PlanKey;
  unlimited: boolean;
};

export async function getChannelUsage(): Promise<ChannelUsageResult> {
  let userId: string | null = null;
  try { const a = await auth(); userId = a.userId; } catch {}

  if (!userId) {
    const used = getCookieCount();
    return { used, limit: PLANS.free.channelSearchMonthlyLimit!, plan: "free", unlimited: false };
  }

  let plan: PlanKey = "free";
  try {
    const user = await currentUser();
    const p = user?.publicMetadata?.plan as PlanKey;
    plan = p in PLANS ? p : "free";
  } catch {}

  const planData = PLANS[plan];
  const limit = planData.channelSearchMonthlyLimit;

  if (limit === null) {
    const used = await getCount(monthKey(userId));
    return { used, limit: 9999, plan, unlimited: true };
  }

  const used = await getCount(monthKey(userId));
  return { used, limit, plan, unlimited: false };
}

export async function incrementChannelCount(): Promise<{ ok: boolean; used: number; limit: number }> {
  let userId: string | null = null;
  try { const a = await auth(); userId = a.userId; } catch {}

  if (!userId) {
    const limit = PLANS.free.channelSearchMonthlyLimit!;
    const current = getCookieCount();
    if (current >= limit) return { ok: false, used: current, limit };
    const newCount = current + 1;
    try {
      const jar = cookies();
      jar.set(COOKIE_COUNT, String(newCount), { path: "/", maxAge: 60 * 60 * 24 * 32 });
      jar.set(COOKIE_MONTH, currentMonth(), { path: "/", maxAge: 60 * 60 * 24 * 32 });
    } catch {}
    return { ok: true, used: newCount, limit };
  }

  let plan: PlanKey = "free";
  try {
    const user = await currentUser();
    const p = user?.publicMetadata?.plan as PlanKey;
    plan = p in PLANS ? p : "free";
  } catch {}

  const planData = PLANS[plan];
  const limit = planData.channelSearchMonthlyLimit;

  // 무제한
  if (limit === null) {
    const key = monthKey(userId);
    const r = await getRedis();
    if (r) {
      try { await r.incr(key); } catch {}
    } else {
      mem.set(key, (mem.get(key) ?? 0) + 1);
    }
    return { ok: true, used: 0, limit: 9999 };
  }

  const key = monthKey(userId);
  const r = await getRedis();

  // ── 원자적 체크+증가 (Redis Lua) ───────────────────────────────────────
  if (r) {
    try {
      const result = await atomicIncrIfUnder(key, limit, secondsUntilNextMonth(), r);
      return { ok: result.ok, used: result.used, limit };
    } catch (e) {
      console.error("[channelLimit] atomicIncrIfUnder error:", e);
    }
  }

  // ── 폴백: 비원자적 방식 (Redis 없음 or Lua 실패) ───────────────────────
  const current = await getCount(key);
  if (current >= limit) return { ok: false, used: current, limit };
  const used = (mem.get(key) ?? 0) + 1;
  mem.set(key, used);
  return { ok: true, used, limit };
}
