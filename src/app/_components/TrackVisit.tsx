"use client";

/**
 * 페이지 방문 기록 (트래픽 분석용)
 * 메뉴별 유입을 보기 위해 각 랜딩 페이지에 심는다.
 * 같은 세션에서 같은 페이지는 한 번만 보낸다.
 */
import { useEffect } from "react";

export default function TrackVisit({ page }: { page: string }) {
  useEffect(() => {
    const key = `bibl-track-${page}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // sessionStorage 불가 환경이면 그대로 진행
    }
    // 기록에 성공한 뒤에만 표시한다 (한 번 실패했다고 그 세션 방문이 영영 누락되지 않도록)
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, referrer: document.referrer || null }),
    })
      .then((res) => {
        if (!res.ok) return;
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* 무시 */
        }
      })
      .catch(() => {});
  }, [page]);

  return null;
}
