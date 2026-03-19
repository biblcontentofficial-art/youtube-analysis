"use client";

import { useMemo } from "react";

interface Props {
  data: number[];
  color?: string;
}

export default function Sparkline({ data, color = "#60A5FA" }: Props) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}