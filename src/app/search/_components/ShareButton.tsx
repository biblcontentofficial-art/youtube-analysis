"use client";

import { useState } from "react";
import Script from "next/script";
import { buttonClass, cx } from "@/components/ui/button";

interface ShareButtonProps {
  query: string;
}

type KakaoSDK = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (opts: Record<string, unknown>) => void };
};

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";

export default function ShareButton({ query }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://bibllab.com/search?q=${encodeURIComponent(query)}`;
  const shareText = `"${query}" 유튜브 키워드 분석 결과 · 비블랩`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKakaoShare = () => {
    if (typeof window === "undefined") return;
    // 카카오 SDK 미로드 시 URL 복사 폴백
    const w = window as unknown as { Kakao?: KakaoSDK };
    if (!w.Kakao || !w.Kakao.isInitialized()) {
      handleCopyLink();
      return;
    }
    w.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: shareText,
        description: "유튜브 키워드로 최신 영상을 찾고 조회수·구독자·게시일을 한눈에 확인하세요.",
        imageUrl: "https://bibllab.com/og-image.png",
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: "분석 결과 보기",
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* 카카오 SDK: 이 버튼이 있는 화면에서만, 페이지가 다 뜬 뒤 싣는다.
          키(NEXT_PUBLIC_KAKAO_JS_KEY, 빌드 때 코드에 들어감)가 없으면 싣지 않고, 카카오 버튼은 링크 복사로 동작한다 */}
      {KAKAO_JS_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onLoad={() => {
            const kakao = (window as unknown as { Kakao?: KakaoSDK }).Kakao;
            if (kakao && !kakao.isInitialized()) kakao.init(KAKAO_JS_KEY);
          }}
        />
      )}

      {/* URL 복사 */}
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="링크 공유"
        className={cx(buttonClass({ variant: "ghost", size: "sm" }), "gap-1.5 pointer-coarse:h-11")}
        title="링크 복사"
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4 shrink-0 text-positive">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            <span className="text-positive">복사됨</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4 shrink-0">
              <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
              <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865z" />
            </svg>
            <span>공유</span>
          </>
        )}
      </button>
      {/* 복사 결과를 스크린 리더에 알린다(버튼 이름은 '링크 공유'로 고정) */}
      <span role="status" className="sr-only">{copied ? "링크를 복사했습니다" : ""}</span>

      {/* 카카오톡 공유 */}
      <button
        type="button"
        onClick={handleKakaoShare}
        aria-label="카카오톡으로 공유"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-kakao text-kakao-icon transition-colors hover:bg-kakao-hover pointer-coarse:size-11"
        title="카카오톡 공유"
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.66 6.62l-.96 3.54c-.07.26.23.47.45.32L10 18.73c.64.1 1.31.17 2 .17 5.52 0 10-3.58 10-7.9S17.52 3 12 3z" />
        </svg>
      </button>

      {/* 네이티브 공유 (모바일) */}
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="공유하기"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:size-11 md:hidden"
        title="공유하기"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4 shrink-0">
          <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.481l6.733-3.367A2.52 2.52 0 0113 4.5z" />
        </svg>
      </button>
    </div>
  );
}
