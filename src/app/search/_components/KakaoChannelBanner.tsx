"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_beBNn/friend";
const LS_KEY = "bibl_kakao_channel_added";

export default function KakaoChannelBanner() {
  const { user, isLoaded } = useUser();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (localStorage.getItem(LS_KEY)) return;

    // 카카오 계정으로 로그인한 유저인지 확인
    const isKakaoUser = user.externalAccounts?.some(
      (acc) => (acc.provider as string).includes("kakao")
    );
    if (isKakaoUser) {
      // 페이지 진입 후 1.5초 뒤 표시
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  const handleAdd = () => {
    window.open(KAKAO_CHANNEL_URL, "_blank");
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-72 bg-[#FEE500] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 bg-[#191919] rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" fill="#FEE500"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#191919] text-sm">카카오톡 채널 추가</p>
            <p className="text-[#444] text-xs mt-0.5">티엠케이(tmk) 비블 유튜브 브랜딩</p>
          </div>
          <button onClick={handleDismiss} className="ml-auto text-[#666] hover:text-[#191919] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <p className="text-[#333] text-xs mb-4">
          채널을 추가하면 유튜브 트렌드 인사이트와 업데이트 소식을 카카오톡으로 받을 수 있어요!
        </p>

        <button
          onClick={handleAdd}
          className="w-full bg-[#191919] text-[#FEE500] font-bold text-sm py-2.5 rounded-xl hover:bg-[#333] transition"
        >
          채널 추가하기
        </button>
      </div>
    </div>
  );
}
