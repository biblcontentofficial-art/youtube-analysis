/**
 * 브레이크아웃 수집 Cron
 * GET /api/cron/breakout            → 어제(한국 시간) 게시 영상 수집
 * GET /api/cron/breakout?date=YYYY-MM-DD  → 그 날짜 다시 수집(덮어씀)
 * Vercel Cron 이 Authorization: Bearer <CRON_SECRET> 로 호출한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/authUtils";
import { collectBreakout, kstToday } from "@/lib/breakout";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifyBearerToken(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("date");
  const date = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : kstToday(-1);
  try {
    const result = await collectBreakout(date);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron:breakout]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
