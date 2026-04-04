import { NextRequest, NextResponse } from "next/server";

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

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk =
  !!clerkKey &&
  clerkKey.startsWith("pk_") &&
  clerkKey !== "pk_test_placeholder";

// Clerk이 설정된 경우에만 미들웨어 적용
let middlewareHandler: (req: NextRequest) => Response | Promise<Response>;

if (hasClerk) {
  const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");

  const isPublicRoute = createRouteMatcher([
    "/",
    "/search(.*)",
    "/pricing",
    "/privacy",
    "/terms",
    "/refund",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/sso-callback(.*)",
    // 완전 공개 페이지 (인증 불필요)
    "/studio",
    "/studio/consulting",
    "/studio/class(.*)",
    "/channels(.*)",
    "/threads(.*)",
    "/tmklab-site(.*)",
    "/tmkstudio",
    "/sitemap.xml",
    "/robots.txt",
    // API
    "/api/youtube/search(.*)",
    "/api/threads/auth(.*)",
    "/api/youtube/channels/suggest(.*)",
    "/api/usage(.*)",
    "/api/channel-usage(.*)",
    // Dev only API (로컬 개발 편집기)
    "/api/dev(.*)",
    // 상담 신청 폼 (비로그인 가능)
    "/api/studio/contact(.*)",
    // 결제 콜백: 외부 서버가 인증 없이 호출
    "/api/payple/confirm(.*)",
    "/api/toss/confirm(.*)",
    "/api/toss/billing/confirm(.*)",
    "/api/stripe/webhook(.*)",
  ]);

  middlewareHandler = clerkMiddleware(async (auth: any, req: NextRequest) => {
    const tmklabResponse = handleTmklab(req);
    if (tmklabResponse) return tmklabResponse;

    if (!isPublicRoute(req)) {
      await auth().protect();
    }
  });
} else {
  middlewareHandler = (req: NextRequest) => handleTmklab(req) ?? NextResponse.next();
}

export default middlewareHandler;

export const config = {
  // 정적 파일, 이미지, 폰트 등은 미들웨어 완전 제외
  // studio·pricing·channels 같은 공개 HTML 페이지도 Edge 호출 최소화
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|txt|xml|html)).*)",
    "/(api|trpc)(.*)",
  ],
};
