/**
 * 서버사이드 검색 기록 API (Starter 이상)
 * GET  /api/search-history         — 최근 검색어 목록
 * POST /api/search-history         — 검색어 저장
 * DELETE /api/search-history       — 전체 삭제 (body: {} 또는 body: { term })
 */

import { auth, getUserPlan } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getSearchHistory,
  upsertSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
} from "@/lib/db";
import { PLANS, PlanKey } from "@/lib/stripe";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });

  const plan = (await getUserPlan(userId)) as PlanKey;
  const planData = PLANS[plan] ?? PLANS.free;
  if (!planData.canServerHistory) return NextResponse.json({ items: [] });

  const historyDays = planData.historyDays;
  const limit = historyDays >= 9999 ? 100 : 30;
  const items = await getSearchHistory(userId, limit, historyDays);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const plan = (await getUserPlan(userId)) as PlanKey;
  const planData = PLANS[plan] ?? PLANS.free;
  if (!planData.canServerHistory) return NextResponse.json({ ok: false }, { status: 403 });

  const { term } = await req.json().catch(() => ({ term: "" }));
  if (!term) return NextResponse.json({ ok: false }, { status: 400 });

  await upsertSearchHistory(userId, term);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const plan = (await getUserPlan(userId)) as PlanKey;
  const planData = PLANS[plan] ?? PLANS.free;
  if (!planData.canServerHistory) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body.term) {
    await deleteSearchHistoryItem(userId, body.term);
  } else {
    await clearSearchHistory(userId);
  }
  return NextResponse.json({ ok: true });
}
