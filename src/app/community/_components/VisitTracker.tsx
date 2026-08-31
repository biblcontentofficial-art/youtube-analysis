"use client";

/**
 * 커뮤니티 방문 기록 + 등급 재계산 트리거
 * 서버가 (user_id, visit_date) 기본키로 하루 1회만 기록하고,
 * 같은 요청에서 활동 점수·등급을 갱신한다. 세션당 1회만 호출한다.
 */
import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    // 방문 기록은 서버에서 (user_id, 날짜) 기준으로 하루 1회만 쌓이고,
    // 이 호출은 등급 재계산도 겸하므로 세션당 1회 보낸다.
    const key = "bibl-community-visit-sent";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 불가 환경이면 그대로 진행한다
    }
    fetch("/api/community/visit", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
