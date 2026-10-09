"use client";

import { useEffect, useState } from "react";

/** 결과 머리 캡션 '오늘 N건 검색됨'. 노출 조건(5건 이상)은 그대로, 숫자만 tnum font-semibold fg-1 (DESIGN 7.2 4행) */
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
    <span className="text-caption text-fg-3">
      오늘 <span className="tnum font-semibold text-fg-1">{count.toLocaleString()}</span>건 검색됨
    </span>
  );
}
