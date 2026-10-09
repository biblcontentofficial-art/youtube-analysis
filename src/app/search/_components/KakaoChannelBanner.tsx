"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_beBNn/friend";
const LS_KEY = "bibl_kakao_channel_added";

/** 토스트(data-toast 를 단 요소)가 떠 있는지 지켜본다. 토스트와 같은 자리라 그동안 배너를 띄우지 않는다(DESIGN 6.13) */
function useToastVisible(active: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active) return;
    const check = () => setVisible(document.querySelector("[data-toast]") !== null);
    check();
    // 결과 화면은 DOM 변경이 잦다. 한 프레임에 한 번만 검사한다
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active]);
  return visible;
}

export default function KakaoChannelBanner() {
  const [show, setShow] = useState(false);
  const toastVisible = useToastVisible(show);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      if (localStorage.getItem(LS_KEY)) return;

      // 카카오 계정으로 로그인한 유저인지 확인
      const provider = data.user.app_metadata?.provider;
      const isKakaoUser = provider === "kakao";
      if (isKakaoUser) {
        setTimeout(() => setShow(true), 1500);
      }
    };
    fetchUser();
  }, []);

  const handleAdd = () => {
    window.open(KAKAO_CHANNEL_URL, "_blank");
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  if (!show || toastVisible) return null;

  return (
    <aside
      aria-labelledby="kakao-channel-banner-title"
      className="fixed bottom-24 left-4 right-4 z-70 overflow-hidden rounded-panel bg-kakao text-kakao-ink animate-in slide-in-from-bottom-4 duration-300 sm:left-auto sm:right-6 sm:w-72"
    >
      <div className="p-5">
        <div className="mb-3 flex items-start gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="mt-0.5 shrink-0">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.818c0 2.74 1.63 5.152 4.1 6.628-.148.536-.97 3.514-.97 3.514s-.015.128.067.177a.23.23 0 00.19-.026l4.378-2.898c.72.107 1.459.162 2.235.162 5.523 0 10-3.477 10-7.818C22 6.477 17.523 3 12 3z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p id="kakao-channel-banner-title" className="text-body-sm font-bold">카카오톡 채널 추가</p>
            <p className="mt-0.5 text-micro">티엠케이(tmk) 비블 유튜브 브랜딩</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="카카오톡 채널 안내 닫기"
            className="-mr-3 -mt-3 inline-flex size-11 shrink-0 items-center justify-center rounded-control transition-colors hover:bg-kakao-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-caption">
          채널을 추가하면 유튜브 트렌드 인사이트와 업데이트 소식을 카카오톡으로 받을 수 있어요!
        </p>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex h-11 w-full items-center justify-center rounded-control bg-kakao-ink text-ui font-bold text-kakao transition-colors hover:bg-kakao-ink/85"
        >
          채널 추가하기
        </button>
      </div>
    </aside>
  );
}
