/**
 * /insights — 비블의 인사이트 목록 (메일리 스타일 뉴스레터)
 *
 * SEO: Article/ItemList schema, Open Graph, ISR-like (revalidate)
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";
import InsightsList, { type PostSummary } from "./_components/InsightsList";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비블의 인사이트 — 유튜브·1인 비즈니스 칼럼 | bibl lab",
  description:
    "유튜브 채널 운영, 콘텐츠 기획, 1인 기업·프리랜서를 위한 실전 인사이트. 비블이 직접 운영하며 검증한 전략과 사례를 정기적으로 공유합니다.",
  alternates: { canonical: "https://bibllab.com/insights" },
  openGraph: {
    title: "비블의 인사이트 — 유튜브·1인 비즈니스 칼럼",
    description: "유튜브·콘텐츠·1인 비즈니스 실전 칼럼. 비블이 직접 운영하며 검증한 전략과 사례.",
    url: "https://bibllab.com/insights",
    type: "website",
    siteName: "bibl lab",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "비블의 인사이트",
    description: "유튜브·1인 비즈니스 실전 칼럼",
  },
  keywords: ["비블", "bibl lab", "유튜브 컨설팅", "1인 기업", "프리랜서", "콘텐츠 마케팅", "유튜브 운영", "비즈니스 칼럼"],
};

async function fetchPosts(includeDrafts: boolean): Promise<PostSummary[]> {
  const db = getSupabase();
  if (!db) return [];

  let q = db
    .from("posts")
    .select("id, slug, title, subtitle, cover_image, description, category, tags, status, published_at, view_count, author_name, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (!includeDrafts) q = q.eq("status", "published");

  const { data } = await q;
  return (data ?? []) as PostSummary[];
}

export default async function InsightsPage() {
  const user = await currentUser();
  const admin = isAdmin({ email: user?.email, plan: user?.plan });
  const posts = await fetchPosts(admin);

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts
      .filter((p) => p.status === "published")
      .slice(0, 30)
      .map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://bibllab.com/insights/${p.slug}`,
        name: p.title,
      })),
  };

  return (
    <main className="min-h-screen bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        {/* ─── 프로필 헤더 (메일리 스타일) ─── */}
        <header className="pb-8 border-b border-white/[0.07]">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full overflow-hidden border border-white/[0.10] shadow-lg shadow-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/studio/instructor.jpg" alt="비블" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">비블의 인사이트</h1>
              <p className="mt-1 text-sm text-slate-400">bibl.content.official@gmail.com</p>
            </div>
            {admin && (
              <Link
                href="/insights/admin"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold transition shadow-lg shadow-teal-900/30"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                새 글 작성
              </Link>
            )}
          </div>

          <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
            퀄리티 있는 유튜브·비즈니스·마케팅·브랜딩 이야기를 전합니다.
          </p>

          {/* 통계 */}
          <div className="mt-6 flex items-center gap-8">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">인사이트</div>
              <div className="text-xl font-bold text-white">{publishedCount}</div>
            </div>
            {totalViews > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">총 조회수</div>
                <div className="text-xl font-bold text-white">{totalViews.toLocaleString()}</div>
              </div>
            )}
          </div>

          {admin && (
            <Link
              href="/insights/admin"
              className="sm:hidden mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              새 글 작성
            </Link>
          )}
        </header>

        {/* ─── 목록 ─── */}
        <section className="mt-8">
          <InsightsList posts={posts} admin={admin} />
        </section>

        {/* ─── 하단 내부링크 CTA (SEO: /studio 토픽 권위 강화) ─── */}
        <section className="mt-14">
          <div className="rounded-2xl bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.05] border border-teal-400/20 p-6 md:p-8">
            <p className="text-sm font-semibold text-teal-300 mb-2">유튜브 채널 대행</p>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              채널 운영이 막막하다면, 비블랩의 올인원 유튜브 채널 대행
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              인사이트에서 다루는 전략을, 비블이 직접 당신의 채널에 적용합니다.
              기획·촬영·편집·업로드·운영까지 전 과정을 대행하는 <strong className="text-slate-200">유튜브 채널 대행</strong> 서비스로
              시행착오 없이 채널을 성장시키세요.
            </p>
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black text-base font-bold transition shadow-lg shadow-teal-900/30"
            >
              올인원 유튜브 채널 대행 알아보기
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
