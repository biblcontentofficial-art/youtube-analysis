/**
 * 트렌드 서치 AI 하루 횟수 카운터(예약 방식, fail-closed, 전체 하루 예산).
 * 근거: docs/trend-dev/spec.md 5.1·5.2 · roadmap T0
 *
 *   const r = await reserveAi("remix", userId, plan);     // 1. 자리 잡기(2분 뒤 저절로 사라짐)
 *   if (!r.ok) → 429(limit) / 503(global_limit·limit_unavailable)
 *   const result = await callClaudeJson(...);              // 2. 호출
 *   const { charged } = await settleAi(r, result);         // 3. 차감 결정(aiOutcome.ts)
 *
 * 키(UTC 날짜 = 한국 09:00 리셋, 기존 검색 한도와 같음)
 *   사용   ai:{feature}:d:{userId}:{YYYY-MM-DD}
 *   예약   ai:{feature}:r:{userId}:{YYYY-MM-DD}   sorted set, 점수 = 만료 시각(ms)
 *   전체   ai:global:d:{YYYY-MM-DD}               AI_GLOBAL_DAILY_CALLS(기본 500)
 *   환불   ai:refund:d:{userId}:{YYYY-MM-DD}      시간 초과 무료 처리 하루 2회
 *   C8     ai:trendfit:d:{userId}:{YYYY-MM-DD}
 *
 * - channelLimit.ts 의 Lua 는 참고만 했다. searchLimit.ts 는 import 도 수정도 하지 않는다(검색 누적 불변 조건 보호).
 * - 운영(VERCEL_ENV=production 또는 NODE_ENV=production)에서 Redis 환경 변수가 없거나 Lua 가 예외를 내면
 *   reserveAi 는 { ok:false, reason:"limit_unavailable" }. 메모리 Map 폴백은 Redis 환경 변수가 없는 개발 환경에서만 쓴다
 *   (서버리스 인스턴스마다 0부터 다시 세어 비용 상한이 깨지므로).
 * - 주의: 로컬 .env.local 의 Upstash 는 운영 Redis 다. 로컬 개발 서버에서 로그인한 채 AI 경로를 부르면
 *   운영 Redis 에 ai:* 키가 써진다. 시험은 createAiLimiter + createMemoryAiStore 로만 한다.
 * - 차감(commitAi)·사용량 조회(getAiUsage)는 저장소 실패 시 fail-open 이다(로그만 남기고 차감 없음·used 0).
 *   비용 상한은 예약 단계(reserveAi, fail-closed)에서 지킨다.
 * - limit 0(Free)은 저장소를 건드리지 않고 { ok:false, reason:"limit", limit:0 }. 화면은 요금제 안내로 돌린다.
 * - 전체 하루 예산은 확정(commit)된 호출 수로 센다. 살아 있는 예약은 사용자별로만 센다(한도 근처에서 몇 건 넘칠 수 있음).
 */
import { PLANS, type PlanKey } from "./stripe";

export type AiFeature = "remix" | "thumbs" | "insight" | "analyze" | "trendfit";

export type AiReservation = { ok: true; reservationId: string; used: number; limit: number };
export type AiReserveResult =
  | AiReservation
  | { ok: false; reason: "limit" | "global_limit" | "limit_unavailable"; used?: number; limit?: number };

export type AiUsage = { used: number; limit: number };

const RESERVATION_TTL_MS = 120_000;
const TIMEOUT_REFUNDS_PER_DAY = 2;

// ─── 날짜·키 ────────────────────────────────────────────────────────────

export function utcDate(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** 다음 UTC 자정까지 남은 초(최소 1) */
export function secondsUntilUtcMidnight(now: number): number {
  const d = new Date(now);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(Math.ceil((midnight - now) / 1000), 1);
}

const usedKey = (f: AiFeature, u: string, date: string) => `ai:${f}:d:${u}:${date}`;
const reserveKey = (f: AiFeature, u: string, date: string) => `ai:${f}:r:${u}:${date}`;
const globalKey = (date: string) => `ai:global:d:${date}`;
const refundKey = (u: string, date: string) => `ai:refund:d:${u}:${date}`;
const trendfitKey = (u: string, date: string) => `ai:trendfit:d:${u}:${date}`;

const FEATURES: readonly AiFeature[] = ["remix", "thumbs", "insight", "analyze", "trendfit"];

/** 예약 id = feature|userId|date|임의값. commit·release 가 키를 다시 찾는 데 쓴다 */
function encodeReservation(f: AiFeature, u: string, date: string): string {
  const rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${f}|${u}|${date}|${rand}`;
}

export function decodeReservation(id: string): { feature: AiFeature; userId: string; date: string } | null {
  const [feature, userId, date] = id.split("|");
  if (!feature || !userId || !date || !FEATURES.includes(feature as AiFeature)) return null;
  return { feature: feature as AiFeature, userId, date };
}

// ─── 플랜 한도 ──────────────────────────────────────────────────────────

/** plan 은 서버에서 getUserPlan(userId)(auth.ts)로 받은 값. 모르는 값이면 free */
export function aiLimitFor(feature: AiFeature, plan: string): number {
  // 'constructor' 같은 프로토타입 키를 플랜으로 보지 않도록 자기 속성만 확인한다
  const known = Object.prototype.hasOwnProperty.call(PLANS, plan);
  const cfg = PLANS[(known ? plan : "free") as PlanKey];
  if (feature === "trendfit" && !cfg.canTrendFit) return 0;
  return cfg.dailyAiLimit;
}

export function globalDailyLimit(): number {
  const n = Number(process.env.AI_GLOBAL_DAILY_CALLS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 500;
}

// ─── 저장소 ─────────────────────────────────────────────────────────────

export interface AiStore {
  /** 만료 예약 정리 후 used + 예약 < limit 이고 전체 < globalLimit 이면 예약 추가 */
  reserve(a: {
    rKey: string; uKey: string; gKey: string; member: string;
    now: number; expiresAt: number; limit: number; globalLimit: number; ttl: number;
  }): Promise<{ ok: boolean; reason: "ok" | "limit" | "global_limit"; used: number }>;
  /** 예약 삭제 + used +1 + 전체 +1 */
  commit(a: { rKey: string; uKey: string; gKey: string; member: string; ttl: number }): Promise<number>;
  /** 예약만 삭제 */
  release(a: { rKey: string; member: string }): Promise<void>;
  /** 값이 max 미만이면 +1 하고 true */
  incrIfUnder(a: { key: string; max: number; ttl: number }): Promise<boolean>;
  /** 없을 때만 1 저장하고 true */
  setOnce(a: { key: string; ttl: number }): Promise<boolean>;
  get(key: string): Promise<number>;
}

/** 개발·시험용 메모리 저장소(운영에서는 쓰지 않는다) */
export function createMemoryAiStore(): AiStore {
  const counters = new Map<string, number>();
  const zsets = new Map<string, Map<string, number>>();
  const zset = (k: string) => {
    let z = zsets.get(k);
    if (!z) { z = new Map(); zsets.set(k, z); }
    return z;
  };
  return {
    async reserve({ rKey, uKey, gKey, member, now, expiresAt, limit, globalLimit }) {
      const z = zset(rKey);
      z.forEach((exp, m) => { if (exp <= now) z.delete(m); });
      const used = counters.get(uKey) ?? 0;
      if (used + z.size >= limit) return { ok: false, reason: "limit", used };
      if ((counters.get(gKey) ?? 0) >= globalLimit) return { ok: false, reason: "global_limit", used };
      z.set(member, expiresAt);
      return { ok: true, reason: "ok", used };
    },
    async commit({ rKey, uKey, gKey, member }) {
      zset(rKey).delete(member);
      const used = (counters.get(uKey) ?? 0) + 1;
      counters.set(uKey, used);
      counters.set(gKey, (counters.get(gKey) ?? 0) + 1);
      return used;
    },
    async release({ rKey, member }) {
      zset(rKey).delete(member);
    },
    async incrIfUnder({ key, max }) {
      const v = counters.get(key) ?? 0;
      if (v >= max) return false;
      counters.set(key, v + 1);
      return true;
    },
    async setOnce({ key }) {
      if (counters.has(key)) return false;
      counters.set(key, 1);
      return true;
    },
    async get(key) {
      return counters.get(key) ?? 0;
    },
  };
}

type RedisLike = {
  eval: (script: string, keys: string[], args: string[]) => Promise<unknown>;
  zrem: (key: string, member: string) => Promise<unknown>;
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: string, opts: { nx: true; ex: number }) => Promise<unknown>;
};

const RESERVE_LUA = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local used = tonumber(redis.call('GET', KEYS[2])) or 0
local pending = redis.call('ZCARD', KEYS[1])
if used + pending >= tonumber(ARGV[3]) then return {0, 1, used} end
local g = tonumber(redis.call('GET', KEYS[3])) or 0
if g >= tonumber(ARGV[4]) then return {0, 2, used} end
redis.call('ZADD', KEYS[1], ARGV[2], ARGV[5])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[6]))
return {1, 0, used}`;

const COMMIT_LUA = `
redis.call('ZREM', KEYS[1], ARGV[1])
local used = redis.call('INCR', KEYS[2])
if redis.call('TTL', KEYS[2]) < 0 then redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2])) end
redis.call('INCR', KEYS[3])
if redis.call('TTL', KEYS[3]) < 0 then redis.call('EXPIRE', KEYS[3], tonumber(ARGV[2])) end
return used`;

const INCR_IF_UNDER_LUA = `
local v = tonumber(redis.call('GET', KEYS[1])) or 0
if v >= tonumber(ARGV[1]) then return 0 end
redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2])) end
return 1`;

export function createRedisAiStore(r: RedisLike): AiStore {
  return {
    async reserve({ rKey, uKey, gKey, member, now, expiresAt, limit, globalLimit, ttl }) {
      const res = (await r.eval(RESERVE_LUA, [rKey, uKey, gKey], [
        String(now), String(expiresAt), String(limit), String(globalLimit), member, String(ttl),
      ])) as unknown[];
      const ok = Number(res[0]) === 1;
      const code = Number(res[1]);
      return { ok, reason: ok ? "ok" : code === 2 ? "global_limit" : "limit", used: Number(res[2]) || 0 };
    },
    async commit({ rKey, uKey, gKey, member, ttl }) {
      return Number(await r.eval(COMMIT_LUA, [rKey, uKey, gKey], [member, String(ttl)])) || 0;
    },
    async release({ rKey, member }) {
      await r.zrem(rKey, member);
    },
    async incrIfUnder({ key, max, ttl }) {
      return Number(await r.eval(INCR_IF_UNDER_LUA, [key], [String(max), String(ttl)])) === 1;
    },
    async setOnce({ key, ttl }) {
      return (await r.set(key, "1", { nx: true, ex: ttl })) === "OK";
    },
    async get(key) {
      return Number(await r.get<number | string>(key)) || 0;
    },
  };
}

// ─── 저장소 고르기 ───────────────────────────────────────────────────────

function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function hasRedisEnv(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisStore: AiStore | null = null;
let memoryStore: AiStore | null = null;

async function resolveStore(): Promise<AiStore | null> {
  if (hasRedisEnv()) {
    if (!redisStore) {
      const { Redis } = await import("@upstash/redis");
      const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
      redisStore = createRedisAiStore(r as unknown as RedisLike);
    }
    return redisStore;
  }
  if (isProduction()) return null; // fail-closed
  if (!memoryStore) memoryStore = createMemoryAiStore();
  return memoryStore;
}

/** 한도 저장소를 쓸 수 있는지(GET /api/ai/usage 의 available). 운영에서 Redis 환경 변수가 없으면 false */
export function aiLimitStoreAvailable(): boolean {
  return hasRedisEnv() || !isProduction();
}

// ─── 카운터 ─────────────────────────────────────────────────────────────

export type AiLimiter = {
  reserveAi(feature: AiFeature, userId: string, plan: string): Promise<AiReserveResult>;
  commitAi(reservationId: string): Promise<void>;
  releaseAi(reservationId: string): Promise<void>;
  /** 시간 초과: 오늘 무료 처리 2회 미만이면 +1 하고 true(release), 아니면 false(commit) */
  timeoutRelease(userId: string): Promise<boolean>;
  /** C8: 오늘 처음이면 true */
  trendfitOnce(userId: string): Promise<boolean>;
  getAiUsage(userId: string, plan: string, features?: AiFeature[]): Promise<Record<string, AiUsage>>;
};

export function createAiLimiter(opts: {
  getStore: () => Promise<AiStore | null>;
  now?: () => number;
  globalLimit?: () => number;
}): AiLimiter {
  const now = opts.now ?? (() => Date.now());
  const gLimit = opts.globalLimit ?? globalDailyLimit;

  return {
    async reserveAi(feature, userId, plan) {
      const limit = aiLimitFor(feature, plan);
      if (limit <= 0) return { ok: false, reason: "limit", used: 0, limit };
      let store: AiStore | null;
      try { store = await opts.getStore(); } catch { store = null; }
      if (!store) return { ok: false, reason: "limit_unavailable" };
      const t = now();
      const date = utcDate(t);
      const member = encodeReservation(feature, userId, date);
      try {
        const res = await store.reserve({
          rKey: reserveKey(feature, userId, date),
          uKey: usedKey(feature, userId, date),
          gKey: globalKey(date),
          member,
          now: t,
          expiresAt: t + RESERVATION_TTL_MS,
          limit,
          globalLimit: gLimit(),
          ttl: secondsUntilUtcMidnight(t) + 300,
        });
        if (!res.ok) return { ok: false, reason: res.reason === "global_limit" ? "global_limit" : "limit", used: res.used, limit };
        return { ok: true, reservationId: member, used: res.used, limit };
      } catch (e) {
        console.error("[aiLimit] reserve error:", e);
        return { ok: false, reason: "limit_unavailable" };
      }
    },

    // 저장소가 없거나 예외가 나면 로그만 남긴다(차감 fail-open). 예약 단계가 fail-closed 라 상한은 유지된다
    async commitAi(reservationId) {
      const r = decodeReservation(reservationId);
      if (!r) return;
      try {
        const store = await opts.getStore();
        if (!store) return;
        await store.commit({
          rKey: reserveKey(r.feature, r.userId, r.date),
          uKey: usedKey(r.feature, r.userId, r.date),
          gKey: globalKey(r.date),
          member: reservationId,
          ttl: secondsUntilUtcMidnight(now()) + 300,
        });
      } catch (e) {
        console.error("[aiLimit] commit error:", e);
      }
    },

    async releaseAi(reservationId) {
      const r = decodeReservation(reservationId);
      if (!r) return;
      try {
        const store = await opts.getStore();
        if (!store) return;
        await store.release({ rKey: reserveKey(r.feature, r.userId, r.date), member: reservationId });
      } catch (e) {
        console.error("[aiLimit] release error:", e);
      }
    },

    async timeoutRelease(userId) {
      try {
        const store = await opts.getStore();
        if (!store) return false;
        const t = now();
        return await store.incrIfUnder({ key: refundKey(userId, utcDate(t)), max: TIMEOUT_REFUNDS_PER_DAY, ttl: secondsUntilUtcMidnight(t) + 300 });
      } catch (e) {
        console.error("[aiLimit] timeoutRelease error:", e);
        return false;
      }
    },

    async trendfitOnce(userId) {
      try {
        const store = await opts.getStore();
        if (!store) return false;
        const t = now();
        return await store.setOnce({ key: trendfitKey(userId, utcDate(t)), ttl: secondsUntilUtcMidnight(t) + 300 });
      } catch (e) {
        console.error("[aiLimit] trendfitOnce error:", e);
        return false;
      }
    },

    // 화면 표시용. 저장소 실패 시 used 0 으로 돌려준다(fail-open). 실제 차단은 reserveAi 가 한다
    async getAiUsage(userId, plan, features = ["remix", "thumbs"]) {
      const out: Record<string, AiUsage> = {};
      let store: AiStore | null = null;
      try { store = await opts.getStore(); } catch {}
      const date = utcDate(now());
      for (const f of features) {
        let used = 0;
        if (store) {
          try { used = await store.get(usedKey(f, userId, date)); } catch (e) { console.error("[aiLimit] usage error:", e); }
        }
        out[f] = { used, limit: aiLimitFor(f, plan) };
      }
      return out;
    },
  };
}

const defaultLimiter = createAiLimiter({ getStore: resolveStore });

export const reserveAi = defaultLimiter.reserveAi;
export const commitAi = defaultLimiter.commitAi;
export const releaseAi = defaultLimiter.releaseAi;
export const timeoutRelease = defaultLimiter.timeoutRelease;
export const trendfitOnce = defaultLimiter.trendfitOnce;
export const getAiUsage = defaultLimiter.getAiUsage;
export { defaultLimiter as aiLimiter };
