import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/lib/trackVisit";

export async function GET(request: NextRequest) {
  const referrer = request.headers.get("referer");
  trackVisit("teambibl", referrer); // fire-and-forget

  const url = new URL("/studio/class/team-bibl", request.url);
  return NextResponse.redirect(url);
}
