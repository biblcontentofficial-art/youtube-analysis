import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/lib/trackVisit";

/**
 * /consulting 단축 주소 → 실제 1:1 유튜브 컨설팅 상세 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  const referrer = request.headers.get("referer");
  trackVisit("consulting", referrer); // fire-and-forget

  const url = new URL("/studio/class/consulting", request.url);
  return NextResponse.redirect(url);
}
