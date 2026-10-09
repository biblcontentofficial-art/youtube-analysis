"use client";

/**
 * 프로필 조회 변화 선 차트. 색은 chartTheme(주 계열 chart-1 흰 2px, 눈금선 chart-grid, 툴팁 surface-2). 선 아래 칠하기 없음.
 * 근거: DESIGN.md 3.1 차트 규칙 · lib/chartTheme.ts
 */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_LINE_PRIMARY,
  CHART_TICK,
  CHART_TOOLTIP,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_LABEL,
} from "@/lib/chartTheme";
import { formatCompactKo } from "@/lib/format";

interface Props {
  data: { date: string; value: number }[];
}

const APP_CARD = "rounded-card border border-line bg-surface p-5 md:p-6";

export default function ProfileViewsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className={`${APP_CARD} text-center text-body-sm text-fg-3`}>
        조회수 데이터가 없습니다
      </div>
    );
  }

  // 날짜 포맷: "3/25"
  const formatted = data.map((d) => {
    const dt = new Date(d.date);
    return {
      ...d,
      label: `${dt.getMonth() + 1}/${dt.getDate()}`,
    };
  });

  return (
    <section aria-labelledby="threads-views-chart" className={APP_CARD}>
      <h2 id="threads-views-chart" className="mb-4 text-ui font-semibold text-fg">프로필 조회 변화</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="label" tick={CHART_TICK} axisLine={CHART_AXIS} tickLine={false} minTickGap={12} />
            <YAxis
              tick={CHART_TICK}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => formatCompactKo(v)}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP}
              labelStyle={CHART_TOOLTIP_LABEL}
              cursor={CHART_TOOLTIP_CURSOR}
              formatter={(val: number | undefined) => [(val ?? 0).toLocaleString("ko-KR"), "조회수"]}
            />
            <Line type="monotone" dataKey="value" {...CHART_LINE_PRIMARY} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
