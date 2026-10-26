"use client";

/**
 * 메뉴별 트래픽 대시보드
 * 네비 메뉴 5개가 각각 어디서 얼마나 유입되는지 한눈에 본다.
 * 기간: 오늘(기본) · 30일 · 90일 · 전체 (소유자 요청 2026-10-26). 오늘은 시간대별, 나머지는 날짜별 추이.
 */
import { useEffect, useMemo, useState } from "react";

interface Menu { key: string; label: string; path: string }
type Range = "day" | "30" | "90" | "all";

const RANGES: { key: Range; label: string }[] = [
  { key: "day", label: "오늘" },
  { key: "30", label: "30일" },
  { key: "90", label: "90일" },
  { key: "all", label: "전체" },
];

interface Data {
  range: Range;
  menus: Menu[];
  totals: Record<string, number>;
  /** 전체 기간이면 null(비교 없음) */
  prevTotals: Record<string, number> | null;
  sources: Record<string, Record<string, number>>;
  chart: Record<string, string | number>[];
  recent: { page: string; source: string; referrer: string | null; visited_at: string }[];
  grandTotal: number;
  firstDate: string | null;
  truncated: boolean;
}

function rangeTitle(d: Data): string {
  if (d.range === "day") return "오늘";
  if (d.range === "all") return d.firstDate ? `전체 기간 (${d.firstDate.replaceAll("-", ".")}부터)` : "전체 기간";
  return `최근 ${d.range}일`;
}

function compareLabel(r: Range): string {
  return r === "day" ? "어제 같은 시간 대비" : `직전 ${r}일 대비`;
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
  const [range, setRange] = useState<Range>("day");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/menu-traffic?range=${range}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  // 쌓은 막대라 칸별 합계의 최댓값으로 높이를 맞춘다
  const maxTotal = useMemo(() => {
    if (!data) return 0;
    let m = 0;
    for (const point of data.chart) {
      let sum = 0;
      for (const menu of data.menus) sum += Number(point[menu.key] ?? 0);
      m = Math.max(m, sum);
    }
    return m;
  }, [data]);

  const rangeButtons = (
    <div className="flex gap-1.5">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => setRange(r.key)}
          aria-pressed={r.key === range}
          className={
            r.key === range
              ? "rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black"
              : "rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 hover:bg-white/[0.04]"
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{rangeButtons}</div>
        <p className="py-10 text-sm text-neutral-500">{loading ? "불러오는 중…" : "트래픽 데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  // x축 눈금: 오늘은 0·6·12·18·23시, 날짜는 약 6칸 간격 + 마지막 날
  const n = data.chart.length;
  const tickEvery = data.range === "day" ? 6 : Math.max(1, Math.ceil(n / 6));
  const showTick = (i: number) => i % tickEvery === 0 || i === n - 1;

  const ranked = [...data.menus].sort((a, b) => (data.totals[b.key] ?? 0) - (data.totals[a.key] ?? 0));

  return (
    <div className="space-y-8">
      {/* 기간 선택 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">메뉴별 트래픽</h2>
          <p className="mt-1 text-xs text-neutral-500">
            {rangeTitle(data)} · 총 <span className="text-neutral-300">{data.grandTotal.toLocaleString()}</span>회 방문
            {data.truncated && <span className="text-negative"> · 기록이 너무 많아 최근 20만 건만 셌습니다</span>}
          </p>
        </div>
        {rangeButtons}
      </div>

      {/* 메뉴 카드 */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {ranked.map((menu) => {
          const cur = data.totals[menu.key] ?? 0;
          const prev = data.prevTotals?.[menu.key] ?? 0;
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
              {data.prevTotals ? (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span
                    className={
                      change.up === true ? "text-positive" : change.up === false ? "text-negative" : "text-neutral-500"
                    }
                  >
                    {change.text}
                  </span>
                  <span className="text-neutral-600">
                    {compareLabel(data.range)}
                    {prev > 0 ? ` (${prev.toLocaleString()})` : ""}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-neutral-600">전체 기간 누적</p>
              )}
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
        <p className="text-sm font-bold text-white">{data.range === "day" ? "시간대별 방문 추이 (오늘)" : "일별 방문 추이"}</p>
        <div className={`mt-4 flex h-40 items-end ${n > 60 ? "gap-px" : "gap-[3px]"}`}>
          {data.chart.map((point) => {
            const sum = data.menus.reduce((a, m) => a + Number(point[m.key] ?? 0), 0);
            return (
              <div
                key={String(point.date)}
                className="flex h-full min-w-0 flex-1 flex-col-reverse"
                title={`${point.label} · ${sum}회`}
              >
                {/* 아래부터 쌓는다(flex-col-reverse). 칸 높이 = 합계 / 최대 합계 */}
                <div
                  className="flex w-full flex-col-reverse gap-px"
                  style={{ height: `${maxTotal > 0 ? (sum / maxTotal) * 100 : 0}%` }}
                >
                  {data.menus.map((menu) => {
                    const v = Number(point[menu.key] ?? 0);
                    if (v === 0) return null;
                    return (
                      <div
                        key={menu.key}
                        className="w-full rounded-[2px]"
                        style={{ flexGrow: v, flexBasis: 0, background: MENU_COLOR[menu.key], minHeight: 2 }}
                        title={`${point.label} · ${menu.label} ${v}회`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className={`mt-1.5 flex ${n > 60 ? "gap-px" : "gap-[3px]"}`} aria-hidden="true">
          {data.chart.map((point, i) => (
            <span key={String(point.date)} className="relative min-w-0 flex-1 text-[10px] text-neutral-500">
              {showTick(i) && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{String(point.label)}</span>}
            </span>
          ))}
        </div>
        <div className="h-3" />
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
