/**
 * 지표 한 칸(앱 카드 안 dl 항목). 숫자 tnum text-h4 800, 라벨 caption fg-3.
 * 근거: DESIGN.md 7.3 스레드 · 3.1 상승·하락(positive ▲ / negative ▼)
 */
import { formatCompactKo } from "@/lib/format";

interface Props {
  label: string;
  value: number;
  delta?: number;
  format?: "number" | "percent";
}

export default function ProfileMetricCard({ label, value, delta, format = "number" }: Props) {
  const display = format === "percent" ? `${value}%` : formatCompactKo(value);

  return (
    <div className="flex flex-col-reverse gap-1 rounded-card border border-line bg-surface p-4 md:p-5">
      <dt className="text-caption text-fg-3">{label}</dt>
      <dd className="tnum text-h4 font-extrabold text-fg" title={format === "number" ? value.toLocaleString("ko-KR") : undefined}>
        {display}
        {delta !== undefined && delta !== 0 && (
          <span className={`ml-2 text-caption font-semibold ${delta > 0 ? "text-positive" : "text-negative"}`}>
            <span aria-hidden="true">{delta > 0 ? "▲" : "▼"}</span>
            <span className="sr-only">{delta > 0 ? "증가" : "감소"}</span>
            {formatCompactKo(Math.abs(delta))}
          </span>
        )}
      </dd>
    </div>
  );
}
