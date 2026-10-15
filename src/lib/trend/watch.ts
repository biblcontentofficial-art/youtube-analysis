/**
 * C7 관심 목록·사이트 알림 데이터(서버 전용, roadmap T9). 테이블은 supabase/migrations/trend_dev.sql 의
 * watch_keywords · watch_channels · notifications, RPC notification_unread_count.
 *
 *   listWatch(userId)                      관심 키워드·채널 + 사용 수·한도(플랜). DB 오류면 null
 *   addKeyword(userId, term, plan)         정규화(notify-match.ts normalizeWatch) 뒤 등록. 이미 있으면 그대로 ok
 *   addChannel(userId, { channelId, title, thumb }, plan)   UC + 22자만. 이미 있으면 이름·썸네일만 새로(meta_at = now)
 *   removeKeyword(userId, key) / removeChannel(userId, channelId)
 *   getWatchedChannelIds(userId)           영상 탭·지금 크는 채널 탭의 '등록됨' 표시용(오류면 빈 배열)
 *   listNotifications(userId)              최근 30일 알림(최대 200, 본인 것만). DB 오류면 null
 *   markNotificationsRead(userId)          본인 안 읽은 알림 전부 read_at = now()
 *   getUnreadCount(userId)                 RPC notification_unread_count(탭 숫자, 오류면 0)
 *
 * - 한도: 키워드+채널 합계가 PLANS[plan].watchLimit 이상이면 { error:'limit', limit, planName }. 이미 등록된 것을 다시 넣는 건 한도와 무관.
 * - plan 은 호출하는 쪽이 getUserPlan(userId)(auth.ts, profiles)로만 정해 넘긴다. 알 수 없는 값은 free.
 * - 채널 이름·썸네일: 최근 30일 breakout_videos 값 → watch_channels 캐시(meta_at 30일 뒤 purge 가 비움) → null(화면은 '채널 열기').
 * - 모든 쿼리에 user_id = 본인 조건을 건다(service role 이라 RLS 가 막아 주지 않는다).
 */
import { getSupabase } from "@/lib/supabase";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { kstToday } from "@/lib/breakout";
import { CHANNEL_ID_RE, displayWatch, normalizeText, normalizeWatch } from "./notify-match";

export type WatchKeyword = { term: string; termNorm: string };
export type WatchChannel = { channelId: string; title: string | null; thumb: string | null };

export type WatchList = {
  keywords: WatchKeyword[];
  channels: WatchChannel[];
  used: number;
  limit: number;
  plan: PlanKey;
  planName: string;
  /** Pro 미만이면 한도 문구 옆에 '요금제 보기 →' */
  showPricing: boolean;
};

export type WatchError =
  | { ok: false; error: "limit"; limit: number; planName: string }
  | { ok: false; error: "invalid" }
  | { ok: false; error: "db" };
export type WatchResult = { ok: true; watch: WatchList } | WatchError;

export type NotificationItem = {
  id: number;
  kind: "keyword" | "channel";
  term: string | null;
  channelId: string | null;
  videoId: string;
  snapshotDate: string;
  title: string | null;
  thumbnail: string | null;
  channelTitle: string | null;
  viewCount: number | null;
  read: boolean;
};

/** 알림 목록 보관·표시 기간(purge 와 같은 30일)과 최대 개수 */
export const NOTIFICATION_DAYS = 30;
export const NOTIFICATION_LIMIT = 200;
/** 채널 이름을 찾는 breakout_videos 기간 */
const CHANNEL_META_DAYS = 30;

const PRICING_PLANS: readonly PlanKey[] = ["free", "starter", "team"];

/** 알 수 없는 plan 값은 free */
export function planKeyOf(plan: string | null | undefined): PlanKey {
  return plan && plan in PLANS ? (plan as PlanKey) : "free";
}

function planInfo(plan: string) {
  const key = planKeyOf(plan);
  const cfg = PLANS[key];
  return { plan: key, planName: cfg.name, limit: cfg.watchLimit, showPricing: PRICING_PLANS.includes(key) };
}

type KeywordRow = { term: string; term_norm: string; created_at: string };
type ChannelRow = { channel_id: string; channel_title: string | null; channel_thumb: string | null; created_at: string };

async function readRaw(userId: string): Promise<{ keywords: KeywordRow[]; channels: ChannelRow[] } | null> {
  const db = getSupabase();
  if (!db) return null;
  const [k, c] = await Promise.all([
    db.from("watch_keywords").select("term,term_norm,created_at").eq("user_id", userId).order("created_at"),
    db.from("watch_channels").select("channel_id,channel_title,channel_thumb,created_at").eq("user_id", userId).order("created_at"),
  ]);
  if (k.error || c.error) {
    console.error("[trend/watch] read error:", k.error?.message ?? c.error?.message);
    return null;
  }
  return { keywords: (k.data ?? []) as KeywordRow[], channels: (c.data ?? []) as ChannelRow[] };
}

/** 최근 30일 breakout_videos 의 채널 이름·썸네일(가장 최근 수집 값). 실패해도 목록은 보이게 빈 지도 */
async function recentChannelMeta(ids: string[]): Promise<Map<string, { title: string; thumb: string | null }>> {
  const out = new Map<string, { title: string; thumb: string | null }>();
  const db = getSupabase();
  if (!db || !ids.length) return out;
  const { data, error } = await db
    .from("breakout_videos")
    .select("channel_id,channel_title,channel_thumb,snapshot_date")
    .in("channel_id", ids)
    .gte("snapshot_date", kstToday(-CHANNEL_META_DAYS))
    .order("snapshot_date", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[trend/watch] channel meta error:", error.message);
    return out;
  }
  for (const r of (data ?? []) as { channel_id: string; channel_title: string | null; channel_thumb: string | null }[]) {
    if (out.has(r.channel_id) || !r.channel_title?.trim()) continue;
    out.set(r.channel_id, { title: r.channel_title.trim(), thumb: r.channel_thumb ?? null });
  }
  return out;
}

export async function listWatch(userId: string, plan: string): Promise<WatchList | null> {
  const raw = await readRaw(userId);
  if (!raw) return null;
  const meta = await recentChannelMeta(raw.channels.map((c) => c.channel_id));
  const info = planInfo(plan);
  const channels: WatchChannel[] = raw.channels.map((c) => {
    const m = meta.get(c.channel_id);
    return {
      channelId: c.channel_id,
      title: m?.title ?? (c.channel_title?.trim() || null),
      thumb: m ? m.thumb : c.channel_thumb ?? null,
    };
  });
  const keywords = raw.keywords.map((k) => ({ term: k.term, termNorm: k.term_norm }));
  return { keywords, channels, used: keywords.length + channels.length, ...info };
}

function limitError(plan: string): WatchError {
  const info = planInfo(plan);
  return { ok: false, error: "limit", limit: info.limit, planName: info.planName };
}

async function afterWrite(userId: string, plan: string): Promise<WatchResult> {
  const watch = await listWatch(userId, plan);
  return watch ? { ok: true, watch } : { ok: false, error: "db" };
}

export async function addKeyword(userId: string, term: string, plan: string): Promise<WatchResult> {
  const norm = typeof term === "string" ? normalizeWatch(term) : null;
  if (!norm) return { ok: false, error: "invalid" };
  const db = getSupabase();
  const raw = await readRaw(userId);
  if (!db || !raw) return { ok: false, error: "db" };
  if (raw.keywords.some((k) => k.term_norm === norm)) return afterWrite(userId, plan);
  if (raw.keywords.length + raw.channels.length >= planInfo(plan).limit) return limitError(plan);

  const { error } = await db
    .from("watch_keywords")
    .upsert({ user_id: userId, term: displayWatch(term), term_norm: norm }, { onConflict: "user_id,term_norm", ignoreDuplicates: true });
  if (error) {
    console.error("[trend/watch] add keyword error:", error.message);
    return { ok: false, error: "db" };
  }
  return afterWrite(userId, plan);
}

export async function addChannel(userId: string, ch: { channelId: string; title?: string | null; thumb?: string | null }, plan: string): Promise<WatchResult> {
  if (typeof ch?.channelId !== "string" || !CHANNEL_ID_RE.test(ch.channelId)) return { ok: false, error: "invalid" };
  const db = getSupabase();
  const raw = await readRaw(userId);
  if (!db || !raw) return { ok: false, error: "db" };
  const exists = raw.channels.some((c) => c.channel_id === ch.channelId);
  if (!exists && raw.keywords.length + raw.channels.length >= planInfo(plan).limit) return limitError(plan);

  const title = typeof ch.title === "string" ? ch.title.trim().slice(0, 200) || null : null;
  const thumb = typeof ch.thumb === "string" && /^https:\/\//.test(ch.thumb) ? ch.thumb.slice(0, 500) : null;
  const { error } = await db
    .from("watch_channels")
    .upsert({ user_id: userId, channel_id: ch.channelId, channel_title: title, channel_thumb: thumb, meta_at: new Date().toISOString() }, { onConflict: "user_id,channel_id" });
  if (error) {
    console.error("[trend/watch] add channel error:", error.message);
    return { ok: false, error: "db" };
  }
  return afterWrite(userId, plan);
}

export async function removeKeyword(userId: string, key: string, plan: string): Promise<WatchResult> {
  if (typeof key !== "string" || !key.trim()) return { ok: false, error: "invalid" };
  const db = getSupabase();
  if (!db) return { ok: false, error: "db" };
  // key 는 term_norm. 화면 표기를 넘겨도 같은 정규화로 찾는다
  const { error } = await db.from("watch_keywords").delete().eq("user_id", userId).eq("term_norm", normalizeText(key));
  if (error) {
    console.error("[trend/watch] remove keyword error:", error.message);
    return { ok: false, error: "db" };
  }
  return afterWrite(userId, plan);
}

export async function removeChannel(userId: string, channelId: string, plan: string): Promise<WatchResult> {
  if (typeof channelId !== "string" || !CHANNEL_ID_RE.test(channelId)) return { ok: false, error: "invalid" };
  const db = getSupabase();
  if (!db) return { ok: false, error: "db" };
  const { error } = await db.from("watch_channels").delete().eq("user_id", userId).eq("channel_id", channelId);
  if (error) {
    console.error("[trend/watch] remove channel error:", error.message);
    return { ok: false, error: "db" };
  }
  return afterWrite(userId, plan);
}

/** 관심 채널 id 목록('등록됨' 표시). 오류면 빈 배열(버튼은 '관심 등록'으로 보이고, 눌러도 서버가 중복을 막는다) */
export async function getWatchedChannelIds(userId: string): Promise<string[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from("watch_channels").select("channel_id").eq("user_id", userId).limit(500);
  if (error) {
    console.error("[trend/watch] watched ids error:", error.message);
    return [];
  }
  return ((data ?? []) as { channel_id: string }[]).map((r) => r.channel_id);
}

type NotificationRow = {
  id: number;
  kind: "keyword" | "channel";
  term: string | null;
  channel_id: string | null;
  video_id: string;
  snapshot_date: string;
  title: string | null;
  thumbnail: string | null;
  channel_title: string | null;
  view_count: number | string | null;
  read_at: string | null;
};

/** 최근 30일 알림(새 게시 날짜 먼저, 같은 날짜는 조회수 많은 순). 본인 것만 */
export async function listNotifications(userId: string): Promise<NotificationItem[] | null> {
  const db = getSupabase();
  if (!db) return null;
  const since = new Date(Date.now() - NOTIFICATION_DAYS * 86400_000).toISOString();
  const { data, error } = await db
    .from("notifications")
    .select("id,kind,term,channel_id,video_id,snapshot_date,title,thumbnail,channel_title,view_count,read_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("snapshot_date", { ascending: false })
    .order("view_count", { ascending: false, nullsFirst: false })
    .order("id")
    .limit(NOTIFICATION_LIMIT);
  if (error) {
    console.error("[trend/watch] notifications error:", error.message);
    return null;
  }
  return ((data ?? []) as NotificationRow[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    term: r.term,
    channelId: r.channel_id,
    videoId: r.video_id,
    snapshotDate: String(r.snapshot_date).slice(0, 10),
    title: r.title,
    thumbnail: r.thumbnail,
    channelTitle: r.channel_title,
    viewCount: r.view_count == null ? null : Number(r.view_count),
    read: r.read_at != null,
  }));
}

/** 본인 안 읽은 알림 전부 읽음 처리. 처리한 수, 실패면 null */
export async function markNotificationsRead(userId: string): Promise<number | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .select("id");
  if (error) {
    console.error("[trend/watch] mark read error:", error.message);
    return null;
  }
  return data?.length ?? 0;
}

/** 안 읽은 알림 수(브레이크아웃 탭 '관심 목록' 숫자). 오류·DB 없음이면 0(숫자를 숨긴다) */
export async function getUnreadCount(userId: string): Promise<number> {
  const db = getSupabase();
  if (!db) return 0;
  const { data, error } = await db.rpc("notification_unread_count", { p_user_id: userId });
  if (error) {
    console.error("[trend/watch] unread count error:", error.message);
    return 0;
  }
  const n = Number(Array.isArray(data) ? data[0] : data);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
