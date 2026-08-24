/**
 * /insights/[slug] — 포스트 상세 (노션 스타일)
 *
 * SEO:
 * - Article structured data
 * - canonical, OG, Twitter
 * - description = post.description || summary(content)
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { canEditInsights } from "@/lib/adminAuth";
import { trackVisit } from "@/lib/trackVisit";
import { summarize, readingTimeMinutes, type Post } from "@/lib/posts";
import PostRenderer from "../_components/PostRenderer";

export const revalidate = 60;
export const dynamic = "force-dynamic";

async function fetchPost(rawSlug: string): Promise<Post | null> {
  const db = getSupabase();
  if (!db) return null;

  // 한글 slug는 URL 인코딩되어 들어올 수 있음 → 원본/디코딩 후보 모두 시도
  const candidates = Array.from(new Set([
    rawSlug,
    safeDecode(rawSlug),
    safeEncode(rawSlug),
  ].filter(Boolean))) as string[];

  for (const s of candidates) {
    const { data } = await db.from("posts").select("*").eq("slug", s).maybeSingle();
    if (data) return data as Post;
  }
  return null;
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}
function safeEncode(s: string): string {
  try { return encodeURIComponent(s); } catch { return s; }
}

interface RelatedPost {
  slug: string;
  title: string;
  category: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

// 관련 글: 같은 카테고리 우선 → 부족하면 최신 글로 채움 (현재 글 제외, 최대 3개)
async function fetchRelated(currentSlug: string, category: string | null): Promise<RelatedPost[]> {
  const db = getSupabase();
  if (!db) return [];
  const cols = "slug, title, category, cover_image, published_at, created_at";
  const out: RelatedPost[] = [];
  const seen = new Set<string>([currentSlug]);

  if (category) {
    const { data } = await db
      .from("posts")
      .select(cols)
      .eq("status", "published")
      .eq("category", category)
      .neq("slug", currentSlug)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(4);
    for (const p of (data ?? []) as RelatedPost[]) {
      if (!seen.has(p.slug)) { out.push(p); seen.add(p.slug); }
      if (out.length >= 3) return out;
    }
  }

  if (out.length < 3) {
    const { data } = await db
      .from("posts")
      .select(cols)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(8);
    for (const p of (data ?? []) as RelatedPost[]) {
      if (!seen.has(p.slug)) { out.push(p); seen.add(p.slug); }
      if (out.length >= 3) break;
    }
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "글을 찾을 수 없습니다 | bibl lab" };

  const desc = post.description || summarize(post.content, 160);
  const url = `https://bibllab.com/insights/${post.slug}`;
  const img = post.cover_image || "https://bibllab.com/og-image.png";

  return {
    title: `${post.title} | 비블 인사이트`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: desc,
      url,
      siteName: "bibl lab",
      type: "article",
      locale: "ko_KR",
      images: [{ url: img }],
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: desc,
      images: [img],
    },
    keywords: post.tags,
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const user = await currentUser();
  const admin = canEditInsights({ email: user?.email, plan: user?.plan });

  // draft 비공개
  if (post.status !== "published" && !admin) notFound();

  // 조회수 증가 + 트래픽 소스 기록 (best-effort, 어드민/에디터 본인 조회는 제외)
  const db = getSupabase();
  if (db && post.status === "published" && !admin) {
    db.from("posts").update({ view_count: (post.view_count ?? 0) + 1 }).eq("id", post.id).then(() => {}, () => {});
    try {
      const h = await headers();
      const referrer = h.get("referer");
      // page = "insight:<slug>" 형태로 글별 유입 소스 추적
      trackVisit(`insight:${post.slug}`, referrer);
    } catch { /* 추적 실패 무시 */ }
  }

  const desc = post.description || summarize(post.content, 200);
  const readingMin = readingTimeMinutes(post.content);
  const related = await fetchRelated(post.slug, post.category ?? null);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: desc,
    image: post.cover_image ? [post.cover_image] : ["https://bibllab.com/og-image.png"],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.author_name },
    publisher: {
      "@type": "Organization",
      name: "비블랩 (bibl lab)",
      logo: { "@type": "ImageObject", url: "https://bibllab.com/og-image.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://bibllab.com/insights/${post.slug}` },
    keywords: post.tags?.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://bibllab.com" },
      { "@type": "ListItem", position: 2, name: "비블의 인사이트", item: "https://bibllab.com/insights" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://bibllab.com/insights/${post.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* 상단 메타 + 어드민 액션 */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            인사이트 목록
          </Link>
          {admin && (
            <div className="flex items-center gap-2">
              {post.status === "draft" && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  DRAFT
                </span>
              )}
              <Link
                href={`/insights/admin/${post.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-sm text-white transition"
              >
                수정
              </Link>
            </div>
          )}
        </div>

        {/* 카테고리 + 태그 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.category && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-[#00E5A0] border border-neutral-700">
              {post.category}
            </span>
          )}
          {post.tags?.map((t) => (
            <span key={t} className="text-xs font-semibold text-[#00E5A0]">#{t}</span>
          ))}
        </div>

        {/* 타이틀 */}
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.15]">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="mt-4 text-lg md:text-xl text-neutral-400 leading-relaxed">{post.subtitle}</p>
        )}

        {/* 작성자/날짜 */}
        <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500 border-b border-white/[0.06] pb-6">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold">
            {post.author_name.charAt(0)}
          </div>
          <div>
            <div className="text-neutral-200 font-semibold">{post.author_name}</div>
            <div className="text-xs">
              {formatDate(post.published_at || post.created_at)} · {readingMin}분 분량
              {post.view_count > 0 && ` · 조회 ${post.view_count.toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* 커버 이미지 */}
        {post.cover_image && (
          <div className="mt-8 rounded-2xl overflow-hidden border border-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image} alt={post.title} className="w-full" />
          </div>
        )}

        {/* 본문 */}
        <div className="mt-10">
          <PostRenderer blocks={post.content} />
        </div>

        {/* 관련 글 (SEO 내부링크) */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-white/[0.06]">
            <h2 className="text-lg font-bold text-white tracking-tight mb-5">함께 읽으면 좋은 글</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/insights/${r.slug}`}
                  className="group block rounded-xl border border-white/[0.07] hover:border-white/[0.16] bg-white/[0.015] hover:bg-white/[0.03] overflow-hidden transition"
                >
                  {r.cover_image ? (
                    <div className="aspect-[16/9] overflow-hidden bg-neutral-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-neutral-900 flex items-center justify-center">
                      <span className="text-neutral-400/40 text-xl font-black tracking-tighter">bibl</span>
                    </div>
                  )}
                  <div className="p-4">
                    {r.category && <span className="text-[11px] font-semibold text-[#00E5A0]">{r.category}</span>}
                    <h3 className="mt-1 text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#00E5A0] transition">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 푸터 CTA */}
        <div className="mt-16 pt-10 border-t border-white/[0.06]">
          <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-6 md:p-8">
            <p className="text-sm font-semibold text-[#00E5A0] mb-2">bibl lab</p>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              유튜브 채널 운영, 비블이 함께 합니다
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              기획부터 촬영·편집·업로드까지. 비블이 직접 운영해서 검증한 전략으로 채널을 통째로 맡아드립니다.
            </p>
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-base font-bold transition"
            >
              올인원 유튜브 채널 대행 알아보기
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
