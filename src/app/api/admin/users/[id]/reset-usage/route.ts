/**
 * POST /api/admin/users/:id/reset-usage
 * 특정 유저의 검색 횟수를 Redis에서 초기화
 * - Free 플랜: 일별 키 (search:d:{userId}:{YYYY-MM-DD})
 * - 유료 플랜: 월별 키 (search:m:{userId}:{YYYY-MM})
 */

import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/adminAuth";

const MONTHLY_PLANS = ["starter", "pro", "business", "admin", "team"];

function dailyKey(userId: string) {
  return `search:d:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function monthlyKey(userId: string) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `search:m:${userId}:${ym}`;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await currentUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = admin.email ?? "";
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  // 요청 body에서 플랜 정보 받기 (없으면 두 키 모두 초기화)
  let plan = "free";
  try {
    const body = await req.json().catch(() => ({}));
    plan = body.plan ?? "free";
  } catch {}

  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCDate(midnight.getUTCDate() + 1);
      midnight.setUTCHours(0, 0, 0, 0);
      const dailyTtl = Math.floor((midnight.getTime() - now.getTime()) / 1000);

      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const monthlyTtl = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);

      if (MONTHLY_PLANS.includes(plan)) {
        // 유료 플랜: 월별 키 초기화
        const key = monthlyKey(userId);
        await redis.set(key, 0);
        await redis.expire(key, monthlyTtl);
      } else {
        // Free: 일별 키 초기화
        const key = dailyKey(userId);
        await redis.set(key, 0);
        await redis.expire(key, dailyTtl);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset usage error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
