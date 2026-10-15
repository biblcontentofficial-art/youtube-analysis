/**
 * C8 '내 채널에 맞는 주제' 카드 데이터. 근거: docs/trend-dev/spec.md 3.8 · 4.6 · roadmap T10
 *
 * GET → 200 TrendFitResponse(src/lib/trend/trendfit-schema.ts)
 *   { state:'locked' }                                          Starter 미만(PLANS[plan].canTrendFit 아님)
 *   { state:'unregistered' } / { state:'expired', channel }     미등록 / 30일 지나 채널 정보가 비워짐
 *   { state:'ready', channel, method:'ai'|'overlap', items, nextAt, aiReady }
 *   { state:'error' }                                           DB·A1 불러오기 실패(화면은 카드만 숨긴다)
 *   401 { error:'unauthorized' }
 *
 * 키워드 페이지(서버 렌더)는 이 경로를 기다리지 않는다. 카드 잎(TrendFitCard)이 마운트 뒤 따로 부른다.
 * plan 은 getUserPlan(userId)(auth.ts, profiles)로만 정한다. end = 마지막 수집일(getBreakoutDates(1)[0]).
 */
import { NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { getBreakoutDates, kstToday } from "@/lib/breakout";
import { getTrendFit } from "@/lib/trend/trendfit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

function canTrendFit(plan: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLANS, plan) && PLANS[plan as PlanKey].canTrendFit;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  const plan = await getUserPlan(userId);
  if (!canTrendFit(plan)) return NextResponse.json({ state: "locked" }, { headers: NO_STORE });

  try {
    const end = (await getBreakoutDates(1))[0] ?? kstToday(-1);
    const out = await getTrendFit(userId, end, { plan });
    return NextResponse.json(out, { headers: NO_STORE });
  } catch (e) {
    console.error("[trend/fit] error:", e);
    return NextResponse.json({ state: "error" }, { headers: NO_STORE });
  }
}
