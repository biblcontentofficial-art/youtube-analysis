/**
 * GET /api/admin/menu-traffic — 메뉴별 트래픽 (운영자 전용)
 *
 * 네비 메뉴 5개를 기준으로 방문수·유입 소스·추이를 묶어 돌려준다.
 * ?range=day|30|90|all (기본 day = 오늘 KST 0시부터. 소유자 요청 2026-10-26)
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { MENUS, MENU_KEYS } from "@/lib/menuTraffic";

export const dynamic = "force-dynamic";

type Range = "day" | "30" | "90" | "all";

const DAY = 86400000;
const KST = 9 * 3600000;
const PAGE = 1000; // Supabase(PostgREST) 한 번에 최대 1,000행. 넘으면 잘리므로 나눠 받는다
const MAX_ROWS = 200000;

/** KST 기준 날짜 키(YYYY-MM-DD) */
function dayKey(t: number): string {
  return new Date(t + KST).toISOString().slice(0, 10);
}
/** KST 기준 시(0~23) */
function hourOf(t: number): number {
  return new Date(t + KST).getUTCHours();
}
/** t 가 속한 KST 날짜의 0시(UTC ms) */
function kstMidnight(t: number): number {
  return Math.floor((t + KST) / DAY) * DAY - KST;
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin({ email: user.email ?? "", plan: user.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "day";
  const range: Range = (["day", "30", "90", "all"] as const).includes(rangeParam as Range) ? (rangeParam as Range) : "day";

  // 기간: 오늘 = KST 0시부터 지금(비교: 어제 0시 ~ 어제 같은 시각)
  //       30·90일 = 오늘 포함 KST 달력 N일(비교: 그 앞 N일) · 전체 = 처음 기록부터(비교 없음)
  const now = Date.now();
  const today0 = kstMidnight(now);
  let curFrom: number;
  let prevFrom: number | null;
  let prevTo: number | null;
  if (range === "day") {
    curFrom = today0;
    prevFrom = today0 - DAY;
    prevTo = now - DAY;
  } else if (range === "all") {
    curFrom = 0;
    prevFrom = null;
    prevTo = null;
  } else {
    const n = Number(range);
    curFrom = today0 - (n - 1) * DAY;
    prevFrom = curFrom - n * DAY;
    prevTo = curFrom;
  }

  // 1,000행씩 나눠 받는다(최신순)
  type Row = { page: string; source: string | null; referrer: string | null; visited_at: string };
  const rows: Row[] = [];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    let q = db
      .from("page_visits")
      .select("page, source, referrer, visited_at")
      .in("page", [...MENU_KEYS])
      .order("visited_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    const lower = prevFrom ?? curFrom;
    if (lower > 0) q = q.gte("visited_at", new Date(lower).toISOString());
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }

  const totals: Record<string, number> = {};
  const prevTotals: Record<string, number> = {};
  const sources: Record<string, Record<string, number>> = {};
  const buckets: Record<string, Record<string, number>> = {};

  for (const key of MENU_KEYS) {
    totals[key] = 0;
    prevTotals[key] = 0;
    sources[key] = {};
    buckets[key] = {};
  }

  let firstAt = now;
  for (const row of rows) {
    const page = String(row.page);
    if (!MENU_KEYS.includes(page)) continue;
    const at = new Date(String(row.visited_at)).getTime();

    if (at >= curFrom) {
      totals[page] += 1;
      firstAt = Math.min(firstAt, at);
      const src = String(row.source ?? "direct");
      sources[page][src] = (sources[page][src] ?? 0) + 1;
      const b = range === "day" ? String(hourOf(at)) : dayKey(at);
      buckets[page][b] = (buckets[page][b] ?? 0) + 1;
    } else if (prevFrom !== null && prevTo !== null && at >= prevFrom && at < prevTo) {
      prevTotals[page] += 1;
    }
  }

  // 추이 차트: 오늘 = 0~23시, 30·90일 = 그 기간 날짜, 전체 = 처음 기록 날짜부터 오늘까지
  const labels: { key: string; label: string }[] = [];
  if (range === "day") {
    for (let h = 0; h < 24; h++) labels.push({ key: String(h), label: `${h}시` });
  } else {
    const from = range === "all" ? kstMidnight(firstAt) : curFrom;
    for (let t = from; t <= today0; t += DAY) {
      const k = dayKey(t);
      labels.push({ key: k, label: `${Number(k.slice(5, 7))}.${Number(k.slice(8, 10))}` });
    }
  }
  const chart = labels.map(({ key, label }) => {
    const point: Record<string, string | number> = { date: key, label };
    for (const m of MENU_KEYS) point[m] = buckets[m][key] ?? 0;
    return point;
  });

  // 최근 유입 (메뉴 대상만)
  const recent = rows
    .filter((r) => new Date(String(r.visited_at)).getTime() >= curFrom)
    .slice(0, 30)
    .map((r) => ({
      page: String(r.page),
      source: String(r.source ?? "direct"),
      referrer: r.referrer ?? null,
      visited_at: String(r.visited_at),
    }));

  return NextResponse.json({
    range,
    menus: MENUS,
    totals,
    prevTotals: prevFrom === null ? null : prevTotals,
    sources,
    chart,
    recent,
    grandTotal: Object.values(totals).reduce((a, b) => a + b, 0),
    firstDate: rows.length ? dayKey(firstAt) : null,
    truncated: rows.length >= MAX_ROWS,
  });
}
