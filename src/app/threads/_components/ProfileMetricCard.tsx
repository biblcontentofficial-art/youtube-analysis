"use client";

interface Props {
  label: string;
  value: number;
  delta?: number;
  format?: "number" | "percent";
}

function fmt(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ProfileMetricCard({ label, value, delta, format = "number" }: Props) {
  const display = format === "percent" ? `${value}%` : fmt(value);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-white">{display}</span>
      {delta !== undefined && delta !== 0 && (
        <span
          className={`text-xs font-medium ${
            delta > 0 ? "text-teal-400" : "text-red-400"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {fmt(delta)}
        </span>
      )}
    </div>
  );
}
