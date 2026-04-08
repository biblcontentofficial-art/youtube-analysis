/**
 * 인앱 브라우저 감지 유틸리티
 *
 * Google OAuth는 인앱 브라우저(WebView)에서 보안 정책으로 차단됩니다.
 * 이 유틸은 인앱 브라우저를 감지하고 외부 브라우저로 유도하는 기능을 제공합니다.
 */

export interface InAppInfo {
  isInApp: boolean;
  appName: string;
  isAndroid: boolean;
  isIOS: boolean;
}

export function detectInAppBrowser(): InAppInfo {
  if (typeof window === "undefined")
    return { isInApp: false, appName: "", isAndroid: false, isIOS: false };

  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // 카카오톡 (Android: KAKAOTALK, iOS: KakaoTalk / KAKAO)
  if (/KAKAOTALK|KakaoTalk/i.test(ua))
    return { isInApp: true, appName: "카카오톡", isAndroid, isIOS };
  if (!isAndroid && /KAKAO/i.test(ua))
    return { isInApp: true, appName: "카카오톡", isAndroid, isIOS };
  // 인스타그램
  if (/Instagram/i.test(ua))
    return { isInApp: true, appName: "인스타그램", isAndroid, isIOS };
  // 네이버 / 네이버 블로그 / 네이버 카페 / 밴드
  if (/NAVER|NaverSearch|nhn/i.test(ua))
    return { isInApp: true, appName: "네이버", isAndroid, isIOS };
  if (/\bBAND\b/i.test(ua))
    return { isInApp: true, appName: "밴드", isAndroid, isIOS };
  // 라인
  if (/Line\//i.test(ua))
    return { isInApp: true, appName: "라인", isAndroid, isIOS };
  // 페이스북
  if (/FBAN|FBAV|FB_IAB/i.test(ua))
    return { isInApp: true, appName: "페이스북", isAndroid, isIOS };
  // 트위터 / X
  if (/TwitterAndroid|Twitter for/i.test(ua))
    return { isInApp: true, appName: "트위터", isAndroid, isIOS };
  // 틱톡
  if (/TikTok|musical_ly/i.test(ua))
    return { isInApp: true, appName: "틱톡", isAndroid, isIOS };
  // 다음 / 카카오메일
  if (/DaumApps|KAKAOTALK|kakaomail/i.test(ua))
    return { isInApp: true, appName: "다음", isAndroid, isIOS };
  // 텔레그램
  if (/Telegram/i.test(ua))
    return { isInApp: true, appName: "텔레그램", isAndroid, isIOS };
  // 당근마켓
  if (/Karrot|Daangn/i.test(ua))
    return { isInApp: true, appName: "당근마켓", isAndroid, isIOS };
  // Android 범용 WebView (wv 플래그)
  if (isAndroid && /\bwv\b/.test(ua))
    return { isInApp: true, appName: "앱 내 브라우저", isAndroid, isIOS };
  // iOS 범용 WebView (Safari 없이 WebKit)
  if (isIOS && !/Safari\//i.test(ua) && /AppleWebKit/i.test(ua))
    return { isInApp: true, appName: "앱 내 브라우저", isAndroid, isIOS };

  return { isInApp: false, appName: "", isAndroid, isIOS };
}

/** Android: Chrome intent URL로 강제 외부 오픈 */
export function openInChrome(url: string) {
  window.location.href = `intent://${url.replace(
    /^https?:\/\//,
    ""
  )}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
    url
  )};end`;
}

/** iOS / 기타: 클립보드 복사 */
export async function copyUrl(): Promise<boolean> {
  const url = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    const el = document.createElement("textarea");
    el.value = url;
    el.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
