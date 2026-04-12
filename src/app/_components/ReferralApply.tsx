"use client";

import { useEffect } from "react";

export default function ReferralApply() {
  useEffect(() => {
    // 쿠키에서 추천 코드 확인
    const match = document.cookie.match(/bibl_ref_code=([^;]+)/);
    if (!match) return;

    const refCode = match[1];

    // 추천 코드 적용 API 호출
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: refCode }),
    })
      .then(() => {
        // 쿠키 삭제
        document.cookie = "bibl_ref_code=; max-age=0; path=/";
      })
      .catch(() => {});
  }, []);

  return null;
}
