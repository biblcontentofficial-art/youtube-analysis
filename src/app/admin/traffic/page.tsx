"use client";

import { useEffect, useState } from "react";

interface TrafficData {
  totalByPage: Record<string, number>;
  sourceByPage: Record<string, Record<string, number>>;
  dailyChart: { date: string; tmkstudio: number; teambibl: number }[];
  recent: { page: string; source: string; referrer: string | null; visited_at: string }[];
  total: number;
}

const PAGE_LABELS: Record<string, string> = {
  tmkstudio: "TMK STUDIO (/tmkstudio)",
  teambibl: "팀비블 (/teambibl)",
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-gray-500",
  google: "bg-blue-500",
  instagram: "bg-pink-500",
  kakao: "bg-yellow-400",
  naver: "bg-green-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-700",
  twitter: "bg-sky-400",
  threads: "bg-purple-500",
  other: "bg-gray-400",
};

function SourceBar({ sources }: { sources: Record<string, number> }) {
  const total = Object.values(sources).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-gray-500 text-sm">데이터 없음</p>;

  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      {sorted.map(([source, count]) => (
        <div key={source} className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${SOURCE_COLORS[source] ?? "bg-gray-400"}`} />
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-0.5">
              <span className="text-gray-300 capitalize">{source}</span>
              <span className="text-gray-400">{count}회 ({Math.round((count / total) * 100)}%)</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${SOURCE_COLORS[source] ?? "bg-gray-400"}`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: TrafficData["dailyChart"] }) {
  const max = Math.max(...data.flatMap((d) => [d.tmkstudio, d.teambibl]), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 h-32 min-w-max px-1">
        {data.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-0.5 w-12">
            <div className="flex items-end gap-0.5 h-24 w-full">
              <div
                className="flex-1 bg-teal-500/70 rounded-t transition-all"
                style={{ height: `${(d.tmkstudio / max) * 100}%`, minHeight: d.tmkstudio > 0 ? "4px" : "0" }}
                title={`tmkstudio: ${d.tmkstudio}`}
              />
              <div
                className="flex-1 bg-purple-500/70 rounded-t transition-all"
                style={{ height: `${(d.teambibl / max) * 100}%`, minHeight: d.teambibl > 0 ? "4px" : "0" }}
                title={`teambibl: ${d.teambibl}`}
              />
            </div>
            <span className="text-[9px] text-gray-600 whitespace-nowrap">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500/70 inline-block" />tmkstudio</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500/70 inline-block" />teambibl</span>
      </div>
    </div>
  );
}

export default function TrafficDashboard() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/traffic")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const pages = ["tmkstudio", "teambibl"];

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* 헤더 */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold">트래픽 대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">최근 30일 · 총 {data.total}건</p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pages.map((page) => (
            <div key={page} className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs text-gray-500 mb-1">{page === "tmkstudio" ? "TMK STUDIO" : "팀비블"}</p>
              <p className="text-3xl font-black text-white">{data.totalByPage[page] ?? 0}</p>
              <p className="text-xs text-gray-600 mt-1">방문</p>
            </div>
          ))}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <p className="text-xs text-gray-500 mb-1">오늘</p>
            <p className="text-3xl font-black text-teal-400">
              {(data.dailyChart.at(-1)?.tmkstudio ?? 0) + (data.dailyChart.at(-1)?.teambibl ?? 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">총 방문</p>
          </div>
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <p className="text-xs text-gray-500 mb-1">어제</p>
            <p className="text-3xl font-black text-gray-300">
              {(data.dailyChart.at(-2)?.tmkstudio ?? 0) + (data.dailyChart.at(-2)?.teambibl ?? 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">총 방문</p>
          </div>
        </div>

        {/* 일별 차트 */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold mb-5">최근 14일 방문 추이</h2>
          <DailyChart data={data.dailyChart} />
        </div>

        {/* 트래픽 소스 (페이지별) */}
        <div className="grid md:grid-cols-2 gap-5">
          {pages.map((page) => (
            <div key={page} className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
              <h2 className="text-base font-semibold mb-1">{PAGE_LABELS[page]}</h2>
              <p className="text-xs text-gray-500 mb-5">총 {data.totalByPage[page] ?? 0}회 방문</p>
              <SourceBar sources={data.sourceByPage[page] ?? {}} />
            </div>
          ))}
        </div>

        {/* 최근 방문 목록 */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-base font-semibold">최근 방문 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-6 py-3">페이지</th>
                  <th className="text-left px-6 py-3">소스</th>
                  <th className="text-left px-6 py-3">레퍼러</th>
                  <th className="text-left px-6 py-3">시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.recent.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.page === "tmkstudio" ? "bg-teal-950 text-teal-400" : "bg-purple-950 text-purple-400"}`}>
                        {r.page}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_COLORS[r.source] ?? "bg-gray-400"}`} />
                        {r.source}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {r.referrer ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.visited_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">아직 방문 데이터가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
