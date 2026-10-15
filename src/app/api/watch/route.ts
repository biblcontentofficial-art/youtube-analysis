/**
 * 관심 키워드·채널(C7, roadmap T9). 데이터: src/lib/trend/watch.ts, 테이블 watch_keywords · watch_channels.
 *
 * GET                                                  → { watch }
 * POST   { type:'keyword', term }                      → { ok, watch }
 * POST   { type:'channel', channelId, title?, thumb? } → { ok, watch }   channelId 는 ^UC[\w-]{22}$ 만
 * DELETE { type:'keyword'|'channel', key }             → { ok, watch }   key = term_norm 또는 channelId
 *
 * 한도(키워드+채널 합계 ≥ PLANS[plan].watchLimit) 409 { error:'limit', limit, planName }, 형식 오류 400 { error:'invalid' },
 * DB 오류 500 { error:'db' }, 비로그인 401. plan 은 getUserPlan(userId)(profiles)로만 정한다(요청 값은 쓰지 않는다).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { addChannel, addKeyword, listWatch, removeChannel, removeKeyword, type WatchResult } from "@/lib/trend/watch";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function respond(r: WatchResult) {
  if (r.ok) return json({ ok: true, watch: r.watch });
  if (r.error === "limit") return json({ error: "limit", limit: r.limit, planName: r.planName }, 409);
  if (r.error === "invalid") return json({ error: "invalid" }, 400);
  return json({ error: "db" }, 500);
}

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function GET() {
  const { userId } = await auth();
  if (!userId) return json({ error: "unauthorized" }, 401);
  const watch = await listWatch(userId, await getUserPlan(userId));
  return watch ? json({ watch }) : json({ error: "db" }, 500);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return json({ error: "unauthorized" }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: "invalid" }, 400);
  const plan = await getUserPlan(userId);
  if (body.type === "keyword") return respond(await addKeyword(userId, str(body.term), plan));
  if (body.type === "channel") {
    return respond(
      await addChannel(userId, { channelId: str(body.channelId), title: str(body.title) || null, thumb: str(body.thumb) || null }, plan),
    );
  }
  return json({ error: "invalid" }, 400);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return json({ error: "unauthorized" }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: "invalid" }, 400);
  const plan = await getUserPlan(userId);
  if (body.type === "keyword") return respond(await removeKeyword(userId, str(body.key), plan));
  if (body.type === "channel") return respond(await removeChannel(userId, str(body.key), plan));
  return json({ error: "invalid" }, 400);
}
