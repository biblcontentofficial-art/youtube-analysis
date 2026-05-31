"use client";

/**
 * 메일리 스타일 인사이트 목록 (클라이언트)
 * - 태그 필터 칩 + 검색 + 카드 리스트
 */

import { useMemo, useState } from "react";
import Link from "next/link";

export interface PostSummary {
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

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function InsightsList({ posts, admin }: { posts: PostSummary[]; admin: boolean }) {
  const [activeTag, setActiveTag] = useState<string>("전체");
  const [search, setSearch] = useState("");

  // 태그 빈도 집계 → 상위 태그를 필터 칩으로
  const topTags = useMemo(() => {
    const count: Record<string, number> = {};
    posts.forEach((p) => p.tags?.forEach((t) => { count[t] = (count[t] ?? 0) + 1; }));
    return Object.entries(count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([t]) => t);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeTag !== "전체" && !(p.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.subtitle ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, activeTag, search]);

  return (
    <div>
      {/* 필터 + 검색 */}
      <div className="flex flex-col gap-3 mb-6">
        {(topTags.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {["전체", ...topTags].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  activeTag === t
                    ? "bg-teal-500/15 text-teal-200 border-teal-400/40"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.20] hover:text-white"
                }`}
              >
                {t === "전체" ? t : `#${t}`}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="인사이트 찾아보기"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/40"
          />
        </div>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500">
            {posts.length === 0 ? "아직 발행된 글이 없습니다." : "조건에 맞는 글이 없습니다."}
          </p>
          {admin && posts.length === 0 && (
            <Link href="/insights/admin" className="mt-4 inline-block text-teal-400 hover:text-teal-300 text-sm font-semibold">
              첫 글 작성하기 →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, idx) => (
            <article key={p.id}>
              <Link
                href={`/insights/${p.slug}`}
                className="group block rounded-2xl border border-white/[0.07] hover:border-white/[0.16] bg-white/[0.015] hover:bg-white/[0.03] transition overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {p.cover_image && (
                    <div className="sm:w-60 sm:shrink-0 aspect-[16/9] sm:aspect-auto overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                        loading={idx < 3 ? "eager" : "lazy"}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {p.status === "draft" && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          DRAFT
                        </span>
                      )}
                      {p.tags?.slice(0, 1).map((t) => (
                        <span key={t} className="text-[12px] font-semibold text-teal-300/90">{t}</span>
                      ))}
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white tracking-tight group-hover:text-teal-200 transition leading-snug">
                      {p.title}
                    </h2>
                    {(p.description || p.subtitle) && (
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description || p.subtitle}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2.5 text-xs text-slate-500">
                      <span>{formatDate(p.published_at || p.created_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        조회 {(p.view_count || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
