import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET: 내 추천 코드 + 추천 현황 조회
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = getRedis();

  // 기존 추천 코드 조회 or 생성
  let code = await r.get<string>(`ref:code:${userId}`);
  if (!code) {
    code = generateCode();
    // 코드 → 유저 매핑
    await r.set(`ref:code:${userId}`, code);
    await r.set(`ref:user:${code}`, userId);
  }

  // 추천 수 조회
  const count = await r.get<number>(`ref:count:${userId}`) ?? 0;
  // 보너스 크레딧 조회
  const bonus = await r.get<number>(`ref:bonus:${userId}`) ?? 0;

  return NextResponse.json({ code, count, bonus });
}

// POST: 추천 코드로 가입 처리 (auth callback 후 호출)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { referralCode } = await request.json();
  if (!referralCode) return NextResponse.json({ error: "no_code" }, { status: 400 });

  const r = getRedis();

  // 이미 추천 적용된 유저인지 확인
  const alreadyReferred = await r.get<string>(`ref:applied:${userId}`);
  if (alreadyReferred) return NextResponse.json({ error: "already_referred" }, { status: 400 });

  // 추천 코드로 추천인 찾기
  const referrerId = await r.get<string>(`ref:user:${referralCode.toUpperCase()}`);
  if (!referrerId) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  // 자기 자신 추천 방지
  if (referrerId === userId) return NextResponse.json({ error: "self_referral" }, { status: 400 });

  // 추천 적용
  await r.set(`ref:applied:${userId}`, referrerId);
  await r.incr(`ref:count:${referrerId}`);

  // 보너스 크레딧: 추천인 +3회, 피추천인 +3회 (무료 유저 일일 검색 보너스)
  await r.incrby(`ref:bonus:${referrerId}`, 3);
  await r.incrby(`ref:bonus:${userId}`, 3);

  // profiles에 referred_by 저장 (Supabase)
  const db = getSupabase();
  if (db) {
    // referred_by 컬럼이 없으면 무시됨 (graceful)
    try {
      await db.from("profiles").update({ referred_by: referrerId }).eq("id", userId);
    } catch { /* column might not exist yet */ }
  }

  return NextResponse.json({ success: true, bonus: 3 });
}
