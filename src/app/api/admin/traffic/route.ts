import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = user.email ?? "";
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  // 최근 30일
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("page_visits")
    .select("page, source, referrer, visited_at")
    .gte("visited_at", since)
    .order("visited_at", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // 페이지별 합계
  const totalByPage: Record<string, number> = {};
  // 소스별 합계 (페이지별)
  const sourceByPage: Record<string, Record<string, number>> = {};
  // 일별 방문 (페이지별)
  const dailyByPage: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    const page = row.page as string;
    const source = row.source as string;
    const day = (row.visited_at as string).slice(0, 10);

    totalByPage[page] = (totalByPage[page] ?? 0) + 1;

    if (!sourceByPage[page]) sourceByPage[page] = {};
    sourceByPage[page][source] = (sourceByPage[page][source] ?? 0) + 1;

    if (!dailyByPage[page]) dailyByPage[page] = {};
    dailyByPage[page][day] = (dailyByPage[page][day] ?? 0) + 1;
  }

  // 일별 배열로 변환 (최근 14일)
  const last14: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    last14.push(d.toISOString().slice(0, 10));
  }

  const dailyChart = last14.map((date) => ({
    date,
    tmkstudio: dailyByPage["tmkstudio"]?.[date] ?? 0,
    teambibl: dailyByPage["teambibl"]?.[date] ?? 0,
  }));

  // 최근 20건 목록
  const recent = rows.slice(0, 20).map((r) => ({
    page: r.page,
    source: r.source,
    referrer: r.referrer,
    visited_at: r.visited_at,
  }));

  return NextResponse.json({
    totalByPage,
    sourceByPage,
    dailyChart,
    recent,
    total: rows.length,
  });
}
