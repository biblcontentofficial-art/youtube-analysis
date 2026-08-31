"use client";

/**
 * 메뉴별 트래픽 대시보드
 * 네비 메뉴 5개가 각각 어디서 얼마나 유입되는지 한눈에 본다.
 */
import { useEffect, useMemo, useState } from "react";

interface Menu { key: string; label: string; path: string }
interface Data {
  days: number;
  menus: Menu[];
  totals: Record<string, number>;
  prevTotals: Record<string, number>;
  sources: Record<string, Record<string, number>>;
  chart: Record<string, string | number>[];
  recent: { page: string; source: string; referrer: string | null; visited_at: string }[];
  grandTotal: number;
}

/** 메뉴별 색 (차트·범례 공용) */
const MENU_COLOR: Record<string, string> = {
  incubating: "#00E5A0",
  community: "#60A5FA",
  "trend-search": "#FBBF24",
  "consulting-class": "#F472B6",
  studio: "#A78BFA",
};

const SOURCE_LABEL: Record<string, string> = {
  direct: "직접 유입",
  google: "구글",
  naver: "네이버",
  youtube: "유튜브",
  instagram: "인스타그램",
  kakao: "카카오",
  threads: "스레드",
  facebook: "페이스북",
  twitter: "X",
  other: "기타",
};

function pct(cur: number, prev: number): { text: string; up: boolean | null } {
  if (prev === 0) return { text: cur > 0 ? "신규" : "-", up: cur > 0 ? true : null };
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return { text: "0%", up: null };
  return { text: `${d > 0 ? "+" : ""}${d}%`, up: d > 0 };
}

export default function MenuTrafficDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/menu-traffic?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const maxDaily = useMemo(() => {
    if (!data) return 0;
    let m = 0;
    for (const point of data.chart) {
      for (const menu of data.menus) m = Math.max(m, Number(point[menu.key] ?? 0));
    }
    return m;
  }, [data]);

  if (loading) return <p className="py-10 text-sm text-neutral-500">불러오는 중…</p>;
  if (!data) return <p className="py-10 text-sm text-neutral-500">트래픽 데이터를 불러오지 못했습니다.</p>;

  const ranked = [...data.menus].sort((a, b) => (data.totals[b.key] ?? 0) - (data.totals[a.key] ?? 0));

  return (
    <div className="space-y-8">
      {/* 기간 선택 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">메뉴별 트래픽</h2>
          <p className="mt-1 text-xs text-neutral-500">
            최근 {data.days}일 · 총 <span className="text-neutral-300">{data.grandTotal.toLocaleString()}</span>회 방문
          </p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={
                d === days
                  ? "rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black"
                  : "rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 hover:bg-white/[0.04]"
              }
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ranked.map((menu) => {
          const cur = data.totals[menu.key] ?? 0;
          const prev = data.prevTotals[menu.key] ?? 0;
          const change = pct(cur, prev);
          const share = data.grandTotal > 0 ? Math.round((cur / data.grandTotal) * 100) : 0;
          const top = Object.entries(data.sources[menu.key] ?? {}).sort((a, b) => b[1] - a[1])[0];

          return (
            <div key={menu.key} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: MENU_COLOR[menu.key] }} />
                <p className="truncate text-xs font-semibold text-neutral-300">{menu.label}</p>
              </div>
              <p className="mt-3 text-2xl font-black tabular-nums text-white">{cur.toLocaleString()}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span
                  className={
                    change.up === true ? "text-[#00E5A0]" : change.up === false ? "text-[#E5484D]" : "text-neutral-500"
                  }
                >
                  {change.text}
                </span>
                <span className="text-neutral-600">직전 {data.days}일 대비</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full rounded-full" style={{ width: `${share}%`, background: MENU_COLOR[menu.key] }} />
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">
                전체의 {share}% · 주 유입 {top ? (SOURCE_LABEL[top[0]] ?? top[0]) : "-"}
              </p>
            </div>
          );
        })}
      </div>

      {/* 일별 추이 */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm font-bold text-white">일별 방문 추이</p>
        <div className="mt-4 flex h-40 items-end gap-[3px]">
          {data.chart.map((point) => (
            <div key={String(point.date)} className="flex h-full flex-1 flex-col justify-end gap-[2px]" title={String(point.date)}>
              {data.menus.map((menu) => {
                const v = Number(point[menu.key] ?? 0);
                if (v === 0) return null;
                return (
                  <div
                    key={menu.key}
                    className="w-full rounded-[2px]"
                    style={{
                      height: `${maxDaily > 0 ? (v / maxDaily) * 100 : 0}%`,
                      background: MENU_COLOR[menu.key],
                      minHeight: 2,
                    }}
                    title={`${menu.label} ${v}회`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.menus.map((menu) => (
            <span key={menu.key} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="h-2 w-2 rounded-full" style={{ background: MENU_COLOR[menu.key] }} />
              {menu.label}
            </span>
          ))}
        </div>
      </section>

      {/* 메뉴 × 유입 소스 */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-white">메뉴별 유입 경로</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {ranked.map((menu) => {
            const entries = Object.entries(data.sources[menu.key] ?? {}).sort((a, b) => b[1] - a[1]);
            const total = entries.reduce((a, [, v]) => a + v, 0);
            return (
              <div key={menu.key} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: MENU_COLOR[menu.key] }} />
                    {menu.label}
                  </span>
                  <span className="text-xs text-neutral-500">{total.toLocaleString()}회</span>
                </div>
                {entries.length === 0 ? (
                  <p className="mt-4 text-xs text-neutral-600">아직 유입이 없습니다.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {entries.slice(0, 6).map(([src, count]) => (
                      <li key={src}>
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-300">{SOURCE_LABEL[src] ?? src}</span>
                          <span className="text-neutral-500 tabular-nums">
                            {count}회 · {Math.round((count / total) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(count / total) * 100}%`, background: MENU_COLOR[menu.key] }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 최근 유입 */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm font-bold text-white">최근 유입</p>
        {data.recent.length === 0 ? (
          <p className="mt-3 text-xs text-neutral-600">기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {data.recent.map((r, i) => {
              const menu = data.menus.find((m) => m.key === r.page);
              return (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: MENU_COLOR[r.page] ?? "#525252" }}
                    />
                    <span className="truncate text-neutral-300">{menu?.label ?? r.page}</span>
                  </span>
                  <span className="shrink-0 text-neutral-500">
                    {SOURCE_LABEL[r.source] ?? r.source} ·{" "}
                    {new Date(r.visited_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
