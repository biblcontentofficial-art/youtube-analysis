"use client";

/**
 * 결과 머리 캡션의 '조회수 합계 N'(Starter 이상, 노출 조건·문구 그대로). 숫자만 tnum font-semibold fg-1 (DESIGN 7.2 4행).
 * 합계는 SearchResultList 가 UPDATE_VIEW_STATS 이벤트로 보낸다. 1억 이상이면 '시장성 좋음' 태그(무채색 테두리 + 흰 글자).
 */
import { useState, useEffect } from "react";
import { badgeClass } from "@/components/ui/badge";
import { formatCompactKo } from "@/lib/format";

export default function ViewStatsInline() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ total: number; count: number }>).detail;
      if (detail.count > 0) setTotal(detail.total);
    };
    window.addEventListener("UPDATE_VIEW_STATS", handler);
    return () => window.removeEventListener("UPDATE_VIEW_STATS", handler);
  }, []);

  if (total === null || total === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      {total >= 1_0000_0000 && <span className={badgeClass("accent")}>시장성 좋음</span>}
      <span>
        조회수 합계 <span className="tnum font-semibold text-fg-1">{formatCompactKo(total)}</span>
      </span>
    </span>
  );
}
