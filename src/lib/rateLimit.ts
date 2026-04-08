/**
 * IP 기반 Rate Limiting (Upstash Redis 활용)
 * Redis가 없는 환경에서는 통과 처리 (개발 환경 호환)
 */

let redis: import("@upstash/redis").Redis | null = null;

async function getRedis() {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * IP 기반 Rate Limit 체크
 * @param ip       클라이언트 IP
 * @param key      고유 식별자 (e.g. "search", "contact")
 * @param limit    허용 횟수
 * @param windowSec 시간 윈도우 (초)
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number }> {
  const r = await getRedis();
  if (!r) return { allowed: true, remaining: limit }; // Redis 없으면 통과

  const redisKey = `rl:${key}:${ip}`;
  try {
    const current = await r.incr(redisKey);
    if (current === 1) {
      await r.expire(redisKey, windowSec);
    }
    const remaining = Math.max(0, limit - current);
    return { allowed: current <= limit, remaining };
  } catch {
    // Redis 오류 시 통과 (가용성 우선)
    return { allowed: true, remaining: limit };
  }
}

/**
 * NextRequest에서 실제 클라이언트 IP 추출
 */
export function getClientIp(req: import("next/server").NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
