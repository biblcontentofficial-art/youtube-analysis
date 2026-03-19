/**
 * Upstash Redis 캐시 래퍼
 * 환경변수가 없으면 no-op으로 동작 (캐시 미스로 처리)
 */

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

const CACHE_TTL = 60 * 60 * 6; // 6시간

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = await getRedis();
  if (!r) return null;
  try {
    return await r.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  const r = await getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: CACHE_TTL });
  } catch {
    // 캐시 실패해도 서비스 계속
  }
}

export function searchCacheKey(query: string, filter: string, pageToken?: string): string {
  return `yt:v2:${query.toLowerCase().trim()}:${filter || "all"}:${pageToken || "first"}`;
}
