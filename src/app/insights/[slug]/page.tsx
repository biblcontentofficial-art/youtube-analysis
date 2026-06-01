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
import { getSupabase } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { canEditInsights } from "@/lib/adminAuth";
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

  // 조회수 증가 (best-effort)
  const db = getSupabase();
  if (db && post.status === "published") {
    db.from("posts").update({ view_count: (post.view_count ?? 0) + 1 }).eq("id", post.id).then(() => {});
  }

  const desc = post.description || summarize(post.content, 200);
  const readingMin = readingTimeMinutes(post.content);

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
    <main className="min-h-screen bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* 상단 메타 + 어드민 액션 */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
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
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-200 border border-teal-400/30">
              {post.category}
            </span>
          )}
          {post.tags?.map((t) => (
            <span key={t} className="text-xs font-semibold text-teal-300/90">#{t}</span>
          ))}
        </div>

        {/* 타이틀 */}
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-[1.15]">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="mt-4 text-lg md:text-xl text-slate-400 leading-relaxed">{post.subtitle}</p>
        )}

        {/* 작성자/날짜 */}
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 border-b border-white/[0.06] pb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-black text-sm font-bold">
            {post.author_name.charAt(0)}
          </div>
          <div>
            <div className="text-slate-200 font-semibold">{post.author_name}</div>
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

        {/* 푸터 CTA */}
        <div className="mt-16 pt-10 border-t border-white/[0.06]">
          <div className="rounded-2xl bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.05] border border-teal-400/20 p-6 md:p-8">
            <p className="text-sm font-semibold text-teal-300 mb-2">bibl lab</p>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              유튜브 채널 운영, 비블이 함께 합니다
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              기획부터 촬영·편집·업로드까지. 비블이 직접 운영해서 검증한 전략으로 채널을 통째로 맡아드립니다.
            </p>
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black text-base font-bold transition shadow-lg shadow-teal-900/30"
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
