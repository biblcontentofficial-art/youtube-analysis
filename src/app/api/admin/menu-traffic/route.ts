/**
 * GET /api/admin/menu-traffic — 메뉴별 트래픽 (운영자 전용)
 *
 * 네비 메뉴 5개를 기준으로 방문수·유입 소스·일별 추이를 묶어 돌려준다.
 * ?days=7|30|90 (기본 30)
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { MENUS, MENU_KEYS } from "@/lib/menuTraffic";

export const dynamic = "force-dynamic";

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin({ email: user.email ?? "", plan: user.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

  // 직전 동일 기간까지 함께 가져와 증감을 계산한다
  const now = Date.now();
  const startCurrent = new Date(now - days * 86400000);
  const startPrev = new Date(now - days * 2 * 86400000);

  const { data, error } = await db
    .from("page_visits")
    .select("page, source, referrer, visited_at")
    .in("page", [...MENU_KEYS])
    .gte("visited_at", startPrev.toISOString())
    .order("visited_at", { ascending: false })
    .limit(20000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const curFrom = startCurrent.getTime();

  const totals: Record<string, number> = {};
  const prevTotals: Record<string, number> = {};
  const sources: Record<string, Record<string, number>> = {};
  const daily: Record<string, Record<string, number>> = {};

  for (const key of MENU_KEYS) {
    totals[key] = 0;
    prevTotals[key] = 0;
    sources[key] = {};
    daily[key] = {};
  }

  for (const row of rows) {
    const page = String(row.page);
    if (!MENU_KEYS.includes(page)) continue;
    const at = new Date(String(row.visited_at)).getTime();

    if (at >= curFrom) {
      totals[page] += 1;
      const src = String(row.source ?? "direct");
      sources[page][src] = (sources[page][src] ?? 0) + 1;
      const d = dayKey(String(row.visited_at));
      daily[page][d] = (daily[page][d] ?? 0) + 1;
    } else {
      prevTotals[page] += 1;
    }
  }

  // 일별 추이 (차트용, 최대 30일)
  const chartDays = Math.min(days, 30);
  const dates: string[] = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    dates.push(new Date(now - i * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }));
  }
  const chart = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const key of MENU_KEYS) point[key] = daily[key][date] ?? 0;
    return point;
  });

  // 최근 유입 (메뉴 대상만)
  const recent = rows
    .filter((r) => new Date(String(r.visited_at)).getTime() >= curFrom)
    .slice(0, 30)
    .map((r) => ({
      page: String(r.page),
      source: String(r.source ?? "direct"),
      referrer: (r.referrer as string) ?? null,
      visited_at: String(r.visited_at),
    }));

  return NextResponse.json({
    days,
    menus: MENUS,
    totals,
    prevTotals,
    sources,
    chart,
    recent,
    grandTotal: Object.values(totals).reduce((a, b) => a + b, 0),
  });
}
