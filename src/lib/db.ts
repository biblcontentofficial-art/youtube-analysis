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

/** 검색 기록 조회 (최신순) */
export async function getSearchHistory(userId: string, limit = 30): Promise<SearchHistoryItem[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from("search_history")
    .select("term, count, searched_at")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(limit);

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
