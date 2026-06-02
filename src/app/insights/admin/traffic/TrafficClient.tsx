"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PostStat {
  slug: string;
  title: string;
  total: number;
  sources: Record<string, number>;
}
interface TrafficData {
  totalVisits: number;
  sourceTotals: { source: string; count: number }[];
  posts: PostStat[];
  daily: { date: string; count: number }[];
  recent: { slug: string; title: string; source: string; referrer: string | null; visited_at: string }[];
}

const SOURCE_LABEL: Record<string, string> = {
  google: "구글", naver: "네이버", youtube: "유튜브", instagram: "인스타그램",
  kakao: "카카오", facebook: "페이스북", twitter: "트위터/X", threads: "스레드",
  direct: "직접 유입", other: "기타",
};
const SOURCE_COLOR: Record<string, string> = {
  google: "bg-blue-500", naver: "bg-green-500", youtube: "bg-red-500",
  instagram: "bg-pink-500", kakao: "bg-yellow-400", facebook: "bg-blue-600",
  twitter: "bg-slate-400", threads: "bg-white", direct: "bg-slate-500", other: "bg-slate-600",
};

function srcLabel(s: string) { return SOURCE_LABEL[s] || s; }
function srcColor(s: string) { return SOURCE_COLOR[s] || "bg-slate-600"; }

export default function TrafficClient() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts/traffic")
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) setError(j.error || "불러오기 실패");
        else setData(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "오류"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 py-20 text-center">불러오는 중…</div>;
  if (error) return <div className="text-red-300 py-20 text-center">{error}</div>;
  if (!data) return null;

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.count));

  return (
    <div className="space-y-8">
      {/* 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="text-xs text-slate-500 mb-1">총 방문 (90일)</div>
          <div className="text-2xl font-bold text-white">{data.totalVisits.toLocaleString()}</div>
        </div>
        {data.sourceTotals.slice(0, 3).map((s) => (
          <div key={s.source} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${srcColor(s.source)}`} />{srcLabel(s.source)}
            </div>
            <div className="text-2xl font-bold text-white">{s.count.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* 일별 추이 */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">최근 14일 방문 추이</h3>
        <div className="flex items-end gap-1.5 h-32">
          {data.daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full bg-teal-500/70 hover:bg-teal-400 rounded-t transition relative"
                style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{d.count}</span>
              </div>
              <span className="text-[9px] text-slate-600">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 유입 소스 분포 */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">유입 소스 분포</h3>
        {data.sourceTotals.length === 0 ? (
          <p className="text-sm text-slate-500">아직 방문 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2.5">
            {data.sourceTotals.map((s) => {
              const pct = data.totalVisits > 0 ? Math.round((s.count / data.totalVisits) * 100) : 0;
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-slate-300 shrink-0">{srcLabel(s.source)}</span>
                  <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full ${srcColor(s.source)} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right text-sm text-slate-400 shrink-0">{s.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 글별 트래픽 */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">글별 방문 & 유입 소스</h3>
        {data.posts.length === 0 ? (
          <p className="text-sm text-slate-500">아직 방문 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {data.posts.map((p) => {
              const entries = Object.entries(p.sources).sort(([, a], [, b]) => b - a);
              return (
                <div key={p.slug} className="border-b border-white/[0.05] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <Link href={`/insights/${p.slug}`} className="text-sm font-semibold text-white hover:text-teal-300 truncate">
                      {p.title}
                    </Link>
                    <span className="text-sm text-slate-400 shrink-0">{p.total.toLocaleString()} 방문</span>
                  </div>
                  {/* 소스 비율 바 */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
                    {entries.map(([src, cnt]) => (
                      <div key={src} className={srcColor(src)} style={{ width: `${(cnt / p.total) * 100}%` }} title={`${srcLabel(src)} ${cnt}`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {entries.map(([src, cnt]) => (
                      <span key={src} className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${srcColor(src)}`} />{srcLabel(src)} {cnt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 최근 유입 */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">최근 유입 30건</h3>
        <div className="space-y-1.5">
          {data.recent.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-slate-500 py-1 border-b border-white/[0.03] last:border-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${srcColor(r.source)}`} />
              <span className="w-16 shrink-0">{srcLabel(r.source)}</span>
              <span className="flex-1 truncate text-slate-400">{r.title}</span>
              <span className="shrink-0">{new Date(r.visited_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
