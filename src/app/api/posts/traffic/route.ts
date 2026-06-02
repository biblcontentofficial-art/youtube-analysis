/**
 * GET /api/posts/traffic  (인사이트 에디터/어드민 전용)
 *
 * page_visits에서 page LIKE 'insight:%' 인 행을 집계해
 * 글별 조회수 + 유입 소스(구글/네이버/유튜브 등) 분포를 반환.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canEditInsights } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user || !canEditInsights({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: visits, error } = await db
    .from("page_visits")
    .select("page, source, referrer, visited_at")
    .like("page", "insight:%")
    .gte("visited_at", since)
    .order("visited_at", { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 발행 글 제목 매핑 (slug → title)
  const { data: posts } = await db
    .from("posts")
    .select("slug, title, view_count, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);

  const titleBySlug: Record<string, string> = {};
  (posts ?? []).forEach((p) => { titleBySlug[p.slug as string] = p.title as string; });

  const rows = visits ?? [];

  // 전체 소스 분포
  const sourceTotals: Record<string, number> = {};
  // 글별 { total, sources }
  const bySlug: Record<string, { total: number; sources: Record<string, number> }> = {};
  // 일별 (최근 14일)
  const daily: Record<string, number> = {};

  for (const r of rows) {
    const slug = String(r.page).replace(/^insight:/, "");
    const source = (r.source as string) || "direct";
    const day = String(r.visited_at).slice(0, 10);

    sourceTotals[source] = (sourceTotals[source] ?? 0) + 1;
    if (!bySlug[slug]) bySlug[slug] = { total: 0, sources: {} };
    bySlug[slug].total += 1;
    bySlug[slug].sources[source] = (bySlug[slug].sources[source] ?? 0) + 1;
    daily[day] = (daily[day] ?? 0) + 1;
  }

  const last14: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    last14.push({ date: d, count: daily[d] ?? 0 });
  }

  const posts_sorted = Object.entries(bySlug)
    .map(([slug, v]) => ({
      slug,
      title: titleBySlug[slug] || slug,
      total: v.total,
      sources: v.sources,
    }))
    .sort((a, b) => b.total - a.total);

  const sourceTotalsSorted = Object.entries(sourceTotals)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalVisits: rows.length,
    sourceTotals: sourceTotalsSorted,
    posts: posts_sorted,
    daily: last14,
    recent: rows.slice(0, 30).map((r) => ({
      slug: String(r.page).replace(/^insight:/, ""),
      title: titleBySlug[String(r.page).replace(/^insight:/, "")] || String(r.page).replace(/^insight:/, ""),
      source: r.source,
      referrer: r.referrer,
      visited_at: r.visited_at,
    })),
  });
}
