"use client";

/**
 * 홈(bibllab.com 메인) 방문 기록. 예전에는 홈 검색(HomeSearchProvider)이 함께 보냈는데,
 * 검색이 /trend-search 로 옮겨 가면서 홈 방문만 따로 남긴다. 보내는 값·횟수(불러올 때마다 1번)는 예전과 같다.
 */
import { useEffect } from "react";

export default function HomeVisit() {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "bibllab", referrer: document.referrer || null }),
    }).catch(() => {});
  }, []);
  return null;
}
