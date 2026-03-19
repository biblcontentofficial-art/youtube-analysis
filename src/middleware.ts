import { NextRequest, NextResponse } from "next/server";

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
    "/pricing",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/youtube/search(.*)",
  ]);
  middlewareHandler = clerkMiddleware(async (auth: any, req: NextRequest) => {
    if (!isPublicRoute(req)) {
      await auth().protect();
    }
  });
} else {
  middlewareHandler = () => NextResponse.next();
}

export default middlewareHandler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
