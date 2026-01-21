"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SparkPoint } from "@/lib/youtube";

export function Sparkline({ data }: { data: SparkPoint[] }) {
  return (
    <div className="h-12 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "rgba(15, 22, 35, 0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "white",
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(value: unknown) => [
              typeof value === "number"
                ? Math.round(value).toLocaleString("ko-KR")
                : String(value),
              "예상 일일 조회수",
            ]}
            labelFormatter={(label: unknown) => `최근 30일 · Day ${label}`}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

