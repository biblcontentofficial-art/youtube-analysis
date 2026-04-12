"use client";

import { useEffect, useState } from "react";

export default function TodaySearchCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/search-count")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => {});
  }, []);

  if (count === null || count < 5) return null;

  return (
    <span className="text-xs text-gray-500">
      오늘 <span className="text-teal-400 font-semibold">{count.toLocaleString()}</span>건 검색됨
    </span>
  );
}
