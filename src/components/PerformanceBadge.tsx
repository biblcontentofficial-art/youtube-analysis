import type { PerformanceBadge } from "@/lib/youtube";

const badgeStyles: Record<PerformanceBadge, string> = {
  Good: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25",
  Normal: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25",
  Bad: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25",
};

export function PerformanceBadge({ value }: { value: PerformanceBadge }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[value]}`}
    >
      {value}
    </span>
  );
}

