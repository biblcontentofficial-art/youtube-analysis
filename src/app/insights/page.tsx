/**
 * /insights — 비블 인사이트 목록 (메일리/뉴스레터 스타일)
 *
 * SEO 목표:
 * - 검색엔진 노출 (Google/Naver)
 * - Article schema, Open Graph
 * - 정적 생성 + ISR (60초 revalidate)
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";

export const revalidate = 60;
export const dynamic = "force-dynamic"; // 어드민 여부 분기 때문

export const metadata: Metadata = {
  title: "비블 인사이트 — 유튜브·1인 비즈니스 칼럼 | bibl lab",
  description:
    "유튜브 채널 운영, 콘텐츠 기획, 1인 기업·프리랜서를 위한 실전 인사이트. 비블이 직접 운영하며 검증한 전략과 사례를 정기적으로 공유합니다.",
  alternates: { canonical: "https://bibllab.com/insights" },
  openGraph: {
    title: "비블 인사이트 — 유튜브·1인 비즈니스 칼럼",
    description: "유튜브·콘텐츠·1인 비즈니스 실전 칼럼. 비블이 직접 운영하며 검증한 전략과 사례.",
    url: "https://bibllab.com/insights",
    type: "website",
    siteName: "bibl lab",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "비블 인사이트",
    description: "유튜브·1인 비즈니스 실전 칼럼",
  },
  keywords: ["비블", "bibl lab", "유튜브 컨설팅", "1인 기업", "프리랜서", "콘텐츠 마케팅", "유튜브 운영", "비즈니스 칼럼"],
};

interface PostSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  description: string | null;
  tags: string[];
  status: string;
  published_at: string | null;
  view_count: number;
  author_name: string;
  created_at: string;
}

async function fetchPosts(includeDrafts: boolean): Promise<PostSummary[]> {
  const db = getSupabase();
  if (!db) return [];

  let q = db
    .from("posts")
    .select("id, slug, title, subtitle, cover_image, description, tags, status, published_at, view_count, author_name, created_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (!includeDrafts) q = q.eq("status", "published");

  const { data } = await q;
  return (data ?? []) as PostSummary[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function InsightsPage() {
  const user = await currentUser();
  const admin = isAdmin({ email: user?.email, plan: user?.plan });
  const posts = await fetchPosts(admin);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts
      .filter((p) => p.status === "published")
      .slice(0, 20)
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

      {/* 헤더 */}
      <section className="relative border-b border-white/[0.06] bg-gradient-to-b from-slate-900/40 via-gray-950 to-gray-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/3 w-96 h-96 rounded-full bg-teal-500/[0.06] blur-3xl" />
          <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-violet-500/[0.05] blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-teal-300">bibl insights</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            유튜브와 1인 비즈니스,
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              실전 인사이트
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl leading-relaxed">
            비블이 직접 운영하며 검증한 유튜브·콘텐츠·비즈니스 전략을 칼럼으로 정리합니다.
            매주 한 편, 군더더기 없이.
          </p>
          {admin && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/insights/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold transition shadow-lg shadow-teal-900/30"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                새 글 작성
              </Link>
              <span className="text-xs text-slate-500">관리자 모드 — 임시저장 포함 {posts.length}편</span>
            </div>
          )}
        </div>
      </section>

      {/* 목록 */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500">아직 발행된 글이 없습니다.</p>
            {admin && (
              <Link href="/insights/admin" className="mt-4 inline-block text-teal-400 hover:text-teal-300 text-sm font-semibold">
                첫 글 작성하기 →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p, idx) => (
              <article key={p.id} className="group">
                <Link
                  href={`/insights/${p.slug}`}
                  className="block py-7 border-b border-white/[0.06] hover:border-white/[0.15] transition"
                >
                  <div className="flex gap-6">
                    {p.cover_image && (
                      <div className="hidden sm:block shrink-0 w-44 h-28 rounded-xl overflow-hidden border border-white/[0.06] bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                          loading={idx < 3 ? "eager" : "lazy"}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {p.status === "draft" && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                            DRAFT
                          </span>
                        )}
                        {p.tags?.slice(0, 3).map((t) => (
                          <span key={t} className="text-[11px] text-teal-300/80">#{t}</span>
                        ))}
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-teal-200 transition leading-snug">
                        {p.title}
                      </h2>
                      {p.subtitle && (
                        <p className="mt-1.5 text-base text-slate-400 line-clamp-1">{p.subtitle}</p>
                      )}
                      {p.description && (
                        <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-400">{p.author_name}</span>
                        <span>·</span>
                        <span>{formatDate(p.published_at || p.created_at)}</span>
                        {p.view_count > 0 && (
                          <>
                            <span>·</span>
                            <span>조회 {p.view_count.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
