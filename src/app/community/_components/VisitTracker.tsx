"use client";

/**
 * 커뮤니티 방문 기록 (등업 조건 "방문 N일" 집계용)
 * 하루 1회만 서버에 기록한다. localStorage로 같은 날 중복 호출을 막고,
 * 서버에서도 (user_id, visit_date) 기본키로 중복이 걸러진다.
 */
import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const key = `bibl-community-visit-${today}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // localStorage 불가 환경이면 서버 중복 방지에 맡긴다
    }
    // 기록 성공을 확인한 뒤에만 마킹한다 (실패한 날의 방문이 영구 누락되지 않도록)
    fetch("/api/community/visit", { method: "POST" })
      .then((res) => {
        if (!res.ok) return;
        try {
          localStorage.setItem(key, "1");
        } catch {
          /* 무시 */
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
