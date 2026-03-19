/**
 * 검색 횟수 제한 관리
 * - 로그인: Clerk userId + Redis/Memory
 * - 비로그인: 쿠키 기반 (브라우저별 추적)
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

function todayKey(userId: string) {
  return `search:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
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

export async function getSearchUsage(): Promise<{ used: number; limit: number; plan: PlanKey }> {
  const userId = await getServerUserId();

  if (!userId) {
    const used = getCookieCount();
    return { used, limit: PLANS.free.searchLimit, plan: "free" };
  }

  const plan = await getUserPlan();
  const limit = PLANS[plan].searchLimit;
  const key = todayKey(userId);
  const r = await getRedis();

  let used = 0;
  if (r) {
    used = (await r.get<number>(key)) ?? 0;
  } else {
    used = memoryStore.get(key) ?? 0;
  }

  return { used, limit, plan };
}

export async function incrementSearchCount(): Promise<{ ok: boolean; used: number; limit: number }> {
  const userId = await getServerUserId();

  if (!userId) {
    // 비로그인: 쿠키 기반 Free 한도
    const limit = PLANS.free.searchLimit;
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
  const limit = PLANS[plan].searchLimit;
  const key = todayKey(userId);
  const r = await getRedis();

  let used: number;
  if (r) {
    used = await r.incr(key);
    if (used === 1) {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCDate(midnight.getUTCDate() + 1);
      midnight.setUTCHours(0, 0, 0, 0);
      const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      await r.expire(key, ttl);
    }
  } else {
    used = (memoryStore.get(key) ?? 0) + 1;
    memoryStore.set(key, used);
  }

  return { ok: used <= limit, used, limit };
}
