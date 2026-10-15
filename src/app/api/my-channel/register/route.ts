/**
 * C8 내 채널 등록·다시 분석. 근거: docs/trend-dev/spec.md 3.8 · roadmap T10
 *
 * POST { input }   채널 주소·@핸들·채널 id(UC…), 200자까지
 *   200 { channel:{ id, title, thumb, subscriberCount }, topic_terms, refreshed_at }
 *   400 { error:'invalid' }   401 { error:'unauthorized' }   403 { error:'locked' }(Starter 미만)
 *   404 { error:'not_found' } 502 { error:'youtube_error' }  409 { error:'too_soon', nextAt }  500 { error:'db' }
 *
 * - plan 은 getUserPlan(userId)(profiles)로만 정한다. 본문의 다른 필드는 읽지 않는다.
 * - 성공하면 그 사용자의 user_trend_matches 를 전부 지우고 오늘 하루 1회 잠금 키도 지운다(resetTrendFit) → 카드가 다시 고른다.
 * - 등록 1회에 YouTube 약 202 unit(analyzeChannel). 7일 1회 제한과 Starter 이상 게이트로 묶는다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { MY_CHANNEL_INPUT_MAX, registerMyChannel } from "@/lib/trend/my-channel";
import { resetTrendFit } from "@/lib/trend/trendfit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function canTrendFit(plan: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLANS, plan) && PLANS[plan as PlanKey].canTrendFit;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const plan = await getUserPlan(userId);
  if (!canTrendFit(plan)) return json({ error: "locked" }, 403);

  const body = (await req.json().catch(() => null)) as { input?: unknown } | null;
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  if (!input || Array.from(input).length > MY_CHANNEL_INPUT_MAX) return json({ error: "invalid" }, 400);

  const r = await registerMyChannel(userId, input);
  if (!r.ok) {
    if (r.error === "too_soon") return json({ error: "too_soon", nextAt: r.nextAt }, 409);
    if (r.error === "not_found") return json({ error: "not_found" }, 404);
    if (r.error === "youtube_error") return json({ error: "youtube_error" }, 502);
    return json({ error: "db" }, 500);
  }

  await resetTrendFit(userId);
  return json({ channel: r.channel, topic_terms: r.topic_terms, refreshed_at: r.refreshed_at });
}
