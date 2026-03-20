/**
 * POST /api/admin/users/:id/reset-usage
 * 특정 유저의 오늘 검색 횟수를 Redis에서 0으로 초기화
 */

import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["bibl.content.official@gmail.com"];

function todayKey(userId: string) {
  return `search:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await currentUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = admin.emailAddresses?.[0]?.emailAddress ?? "";
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const key = todayKey(userId);
      await redis.set(key, 0);
      // TTL 재설정 (자정까지)
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCDate(midnight.getUTCDate() + 1);
      midnight.setUTCHours(0, 0, 0, 0);
      const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttl);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset usage error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
