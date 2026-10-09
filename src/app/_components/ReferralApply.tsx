"use client";

import { useEffect, useState } from "react";
import { ActionToast, type ToastData } from "@/app/search/_components/SelectionBar";

/**
 * 초대 링크로 가입한 직후 한 번 초대 코드를 적용한다(쿠키는 auth/callback 이 심는다).
 * - API 의 JSON 응답(2xx·4xx)이면 쿠키를 지운다(이미 적용·잘못된 코드 같은 영구 실패를 다시 보내지 않게).
 * - 네트워크 오류·5xx·JSON 이 아닌 응답(점검 모드에서 /api/* 가 점검 화면으로 바뀐 200 HTML 등)이면 쿠키를 남겨 다음 화면에서 다시 시도한다.
 * - 응답이 { success: true } 일 때만 한 번 알린다(role=status 토스트). 문구는 확인된 사실(코드 적용)만 쓴다.
 */
export default function ReferralApply() {
  // 쿠키가 있을 때만 알림 자리(role=status)를 먼저 그려 두고, 성공하면 그 안에 문장을 넣는다(스크린 리더가 읽게)
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    // 쿠키에서 추천 코드 확인
    const match = document.cookie.match(/bibl_ref_code=([^;]+)/);
    if (!match) return;

    const refCode = match[1];
    setPending(true);

    // 추천 코드 적용 API 호출
    fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: refCode }),
    })
      .then(async (res) => {
        if (res.status >= 500) return;
        let data: { success?: boolean } | null = null;
        try {
          data = await res.json();
        } catch {
          return;
        }
        // 쿠키 삭제
        document.cookie = "bibl_ref_code=; max-age=0; path=/";
        if (res.ok && data?.success === true) {
          setToast({ id: 1, message: "초대 코드가 적용되었습니다." });
        }
      })
      .catch(() => {});
  }, []);

  if (!pending) return null;
  return <ActionToast toast={toast} onDismiss={() => setToast(null)} />;
}
