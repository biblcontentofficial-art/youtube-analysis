import { NextRequest, NextResponse } from "next/server";

// bibllab.com/tmkstudio → 쿠키 설정 후 /studio로 리다이렉트
export function GET(request: NextRequest) {
  const url = new URL("/studio", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set("studio_access", "1", {
    maxAge: 60 * 60 * 24 * 365, // 1년
    path: "/",
    sameSite: "lax",
  });
  return response;
}
