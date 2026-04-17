import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// www.bibllab.com → bibllab.com 리다이렉트
function handleWwwRedirect(req: NextRequest): NextResponse | null {
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.bibllab.com")) {
    const url = req.nextUrl.clone();
    url.host = "bibllab.com";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }
  return null;
}

// tmklab.com → /tmklab-site 로 rewrite
function handleTmklab(req: NextRequest): NextResponse | null {
  const host = req.headers.get("host") ?? "";
  if (host === "tmklab.com" || host === "www.tmklab.com") {
    const url = req.nextUrl.clone();
    url.pathname = "/tmklab-site";
    return NextResponse.rewrite(url);
  }
  return null;
}

// 인증이 필요한 경로
const protectedPaths = [
  "/mypage",
  "/admin",
  "/saved",
  "/api/cancel-subscription",
  "/api/delete-account",
  "/api/checkout",
  "/api/saved-videos",
  "/api/search-history",
  "/api/studio/enroll",
  "/payment",
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export default async function middleware(req: NextRequest) {
  // 🚨 점검 모드: Vercel 환경변수 MAINTENANCE_MODE=true 설정 시 활성화
  if (process.env.MAINTENANCE_MODE === "true") {
    const { pathname } = req.nextUrl;
    // 점검 페이지 자체와 정적 파일은 통과
    if (pathname !== "/maintenance" && !pathname.startsWith("/_next") && !pathname.startsWith("/api/cron")) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url);
    }
  }

  // www → non-www 리다이렉트
  const wwwRedirect = handleWwwRedirect(req);
  if (wwwRedirect) return wwwRedirect;

  // tmklab 도메인 rewrite
  const tmklabResponse = handleTmklab(req);
  if (tmklabResponse) return tmklabResponse;

  // Supabase 세션 갱신 (모든 요청)
  const response = await updateSession(req);

  // 보호된 라우트 체크 — API는 라우트 핸들러에서 자체 체크
  if (isProtectedRoute(req.nextUrl.pathname) && !req.nextUrl.pathname.startsWith("/api/")) {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|txt|xml|html)).*)",
    "/(api|trpc)(.*)",
  ],
};
