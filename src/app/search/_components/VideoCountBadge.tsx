"use client";

import { useState, useEffect } from "react";

export default function VideoCountBadge({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ total: number; count: number }>).detail;
      setCount(detail.count);
    };
    window.addEventListener("UPDATE_VIEW_STATS", handler);
    return () => window.removeEventListener("UPDATE_VIEW_STATS", handler);
  }, []);

  return (
    <div className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-lg font-mono">
      {count}건
    </div>
  );
}
