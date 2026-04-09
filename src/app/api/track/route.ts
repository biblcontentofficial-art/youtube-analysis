import { NextRequest, NextResponse } from "next/server";
import { trackVisit } from "@/lib/trackVisit";

export async function POST(request: NextRequest) {
  try {
    const { page, referrer } = await request.json();
    if (!page || typeof page !== "string") {
      return NextResponse.json({ error: "invalid page" }, { status: 400 });
    }
    trackVisit(page, referrer ?? null); // fire-and-forget
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
