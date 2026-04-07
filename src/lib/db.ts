/**
 * DB 작업 모음 (Supabase PostgreSQL)
 *
 * 테이블 구조:
 *   subscriptions  - 구독 현황 (플랜, 빌링키, 다음 결제일 등)
 *   payments       - 결제 이력 (금액, 주문번호, 토스 응답 등)
 */

import { getSupabase } from "./supabase";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  billing_key: string | null;
  customer_key: string | null;
  status: SubscriptionStatus;
  started_at: string;
  next_billing_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  order_id: string;
  payment_key: string | null;
  status: "success" | "failed" | "cancelled";
  paid_at: string;
  raw: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────
// 구독 (subscriptions)
// ─────────────────────────────────────────────────────────────

/** 구독 생성 또는 업데이트 (결제 성공 시 호출) */
export async function upsertSubscription(params: {
  userId: string;
  plan: string;
  billingKey: string;
  customerKey: string;
}) {
  const db = getSupabase();
  if (!db) return; // DB 없으면 스킵 (서비스 계속 동작)

  const nextBillingAt = new Date();
  nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: params.userId,
      plan: params.plan,
      billing_key: params.billingKey,
      customer_key: params.customerKey,
      status: "active",
      next_billing_at: nextBillingAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) console.error("upsertSubscription error:", error);
}

/** 구독 취소 */
export async function cancelSubscription(userId: string) {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) console.error("cancelSubscription error:", error);
}

/** 유저 구독 정보 조회 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Subscription;
}

// ─────────────────────────────────────────────────────────────
// 결제 이력 (payments)
// ─────────────────────────────────────────────────────────────

/** 결제 이력 저장 */
export async function insertPayment(params: {
  userId: string;
  plan: string;
  amount: number;
  orderId: string;
  paymentKey?: string;
  status: "success" | "failed";
  raw?: Record<string, unknown>;
}) {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db.from("payments").insert({
    user_id: params.userId,
    plan: params.plan,
    amount: params.amount,
    order_id: params.orderId,
    payment_key: params.paymentKey ?? null,
    status: params.status,
    raw: params.raw ?? null,
    paid_at: new Date().toISOString(),
  });

  if (error) console.error("insertPayment error:", error);
}

/** 결제 상태 업데이트 (환불 처리 시 사용) */
export async function updatePaymentStatus(
  paymentKey: string,
  status: "success" | "failed" | "cancelled",
  cancelRaw?: Record<string, unknown>
) {
  const db = getSupabase();
  if (!db) return;

  const updateData: Record<string, unknown> = { status };
  if (cancelRaw) updateData.raw = cancelRaw;

  const { error } = await db
    .from("payments")
    .update(updateData)
    .eq("payment_key", paymentKey);

  if (error) console.error("updatePaymentStatus error:", error);
}

/** 유저 결제 이력 전체 조회 (최신순) */
export async function getPayments(userId: string): Promise<Payment[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("paid_at", { ascending: false });

  if (error) return [];
  return data as Payment[];
}

/** 관리자용: 전체 결제 이력 (최신 100건) */
export async function getAllPayments(): Promise<Payment[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("payments")
    .select("*")
    .order("paid_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data as Payment[];
}

/** 관리자용: 전체 구독 현황 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("subscriptions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return [];
  return data as Subscription[];
}

// ─────────────────────────────────────────────────────────────
// 검색 기록 (search_history)
// ─────────────────────────────────────────────────────────────

export interface SearchHistoryItem {
  term: string;
  count: number;
  searched_at: string;
}

/** 검색어 저장 또는 카운트 증가 */
export async function upsertSearchHistory(userId: string, term: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { data: existing } = await db
    .from("search_history")
    .select("count")
    .eq("user_id", userId)
    .eq("term", term)
    .single();

  if (existing) {
    await db
      .from("search_history")
      .update({ count: existing.count + 1, searched_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("term", term);
  } else {
    await db.from("search_history").insert({
      user_id: userId,
      term,
      count: 1,
      searched_at: new Date().toISOString(),
    });
  }
}

/** 검색 기록 조회 (최신순, 날짜 필터 옵션) */
export async function getSearchHistory(
  userId: string,
  limit = 30,
  historyDays?: number
): Promise<SearchHistoryItem[]> {
  const db = getSupabase();
  if (!db) return [];

  let query = db
    .from("search_history")
    .select("term, count, searched_at")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(limit);

  // historyDays가 지정된 경우 날짜 필터 적용 (9999 이상은 무제한)
  if (historyDays && historyDays < 9999) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - historyDays);
    query = query.gte("searched_at", cutoff.toISOString());
  }

  const { data, error } = await query;
  if (error) return [];
  return data as SearchHistoryItem[];
}

/** 단일 검색어 삭제 */
export async function deleteSearchHistoryItem(userId: string, term: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("search_history").delete().eq("user_id", userId).eq("term", term);
}

/** 전체 검색 기록 삭제 */
export async function clearSearchHistory(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("search_history").delete().eq("user_id", userId);
}

// ─────────────────────────────────────────────────────────────
// 수집한 영상 (saved_videos)
// ─────────────────────────────────────────────────────────────

export interface SavedVideo {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  thumbnail: string | null;
  channel_id: string | null;
  channel_title: string | null;
  channel_thumbnail: string | null;
  subscriber_count: string | null;
  view_count: number;
  published_at: string | null;
  score: string | null;
  performance_ratio: string | null;
  query: string | null;
  saved_at: string;
}

export interface SaveVideoParams {
  userId: string;
  videoId: string;
  title: string;
  thumbnail?: string;
  channelId?: string;
  channelTitle?: string;
  channelThumbnail?: string;
  subscriberCount?: string;
  viewCount?: number;
  publishedAt?: string;
  score?: string;
  performanceRatio?: string;
  query?: string;
}

/** 영상 저장 (이미 있으면 saved_at 갱신) */
export async function upsertSavedVideo(params: SaveVideoParams): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db.from("saved_videos").upsert(
    {
      user_id: params.userId,
      video_id: params.videoId,
      title: params.title,
      thumbnail: params.thumbnail ?? null,
      channel_id: params.channelId ?? null,
      channel_title: params.channelTitle ?? null,
      channel_thumbnail: params.channelThumbnail ?? null,
      subscriber_count: params.subscriberCount ?? null,
      view_count: params.viewCount ?? 0,
      published_at: params.publishedAt ?? null,
      score: params.score ?? null,
      performance_ratio: params.performanceRatio ?? null,
      query: params.query ?? null,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" }
  );
  if (error) console.error("upsertSavedVideo error:", error);
}

/** 수집한 영상 목록 조회 (최신순) */
export async function getSavedVideos(userId: string, limit = 200): Promise<SavedVideo[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("saved_videos")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as SavedVideo[];
}

/** 단일 영상 삭제 */
export async function deleteSavedVideo(userId: string, videoId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("saved_videos").delete().eq("user_id", userId).eq("video_id", videoId);
}

/** 전체 수집 영상 삭제 */
export async function clearSavedVideos(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("saved_videos").delete().eq("user_id", userId);
}

// ─────────────────────────────────────────────────────────────
// 스레드 Meta 계정 연결 (threads_connections)
// ─────────────────────────────────────────────────────────────

export interface ThreadsConnection {
  user_id: string;
  access_token: string;
  threads_user_id: string;
  username: string;
  connected_at: string;
  updated_at: string;
}

/** 스레드 계정 연결 저장 (최초 연결 or 재연결) */
export async function upsertThreadsConnection(params: {
  userId: string;
  accessToken: string;
  threadsUserId: string;
  username: string;
}): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db.from("threads_connections").upsert(
    {
      user_id: params.userId,
      access_token: params.accessToken,
      threads_user_id: params.threadsUserId,
      username: params.username,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) console.error("upsertThreadsConnection error:", error);
}

/** 연결된 스레드 계정 정보 조회 */
export async function getThreadsConnection(userId: string): Promise<ThreadsConnection | null> {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from("threads_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as ThreadsConnection;
}

/** 스레드 계정 연결 해제 */
export async function deleteThreadsConnection(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("threads_connections").delete().eq("user_id", userId);
}

// ─────────────────────────────────────────────────────────────
// 스레드 게시물 수집 (saved_threads)
// ─────────────────────────────────────────────────────────────

export interface SavedThread {
  user_id: string;
  post_id: string;
  text: string | null;
  media_type: string | null;
  permalink: string | null;
  username: string | null;
  followers_count: number;
  like_count: number;
  repost_count: number;
  replies_count: number;
  viral_score: number;
  published_at: string | null;
  query: string | null;
  memo: string | null;
  is_favorite: boolean;
  saved_at: string;
}

export interface SaveThreadParams {
  userId: string;
  postId: string;
  text?: string;
  mediaType?: string;
  permalink?: string;
  username?: string;
  followersCount?: number;
  likeCount?: number;
  repostCount?: number;
  repliesCount?: number;
  viralScore?: number;
  publishedAt?: string;
  query?: string;
}

/** 스레드 게시물 저장 (이미 있으면 saved_at 갱신) */
export async function upsertSavedThread(params: SaveThreadParams): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db.from("saved_threads").upsert(
    {
      user_id: params.userId,
      post_id: params.postId,
      text: params.text ?? null,
      media_type: params.mediaType ?? null,
      permalink: params.permalink ?? null,
      username: params.username ?? null,
      followers_count: params.followersCount ?? 0,
      like_count: params.likeCount ?? 0,
      repost_count: params.repostCount ?? 0,
      replies_count: params.repliesCount ?? 0,
      viral_score: params.viralScore ?? 0,
      published_at: params.publishedAt ?? null,
      query: params.query ?? null,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "user_id,post_id" }
  );
  if (error) console.error("upsertSavedThread error:", error);
}

/** 수집한 스레드 목록 (최신순) */
export async function getSavedThreads(userId: string, limit = 200): Promise<SavedThread[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("saved_threads")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as SavedThread[];
}

/** 단일 수집 삭제 */
export async function deleteSavedThread(userId: string, postId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("saved_threads").delete().eq("user_id", userId).eq("post_id", postId);
}

/** 전체 수집 삭제 */
export async function clearSavedThreads(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  await db.from("saved_threads").delete().eq("user_id", userId);
}

/** 메모·즐겨찾기 업데이트 */
export async function updateSavedThread(
  userId: string,
  postId: string,
  updates: { memo?: string; is_favorite?: boolean }
): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db
    .from("saved_threads")
    .update(updates)
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (error) console.error("updateSavedThread error:", error);
}
