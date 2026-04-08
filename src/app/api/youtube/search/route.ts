import { NextRequest, NextResponse } from "next/server";
import { searchVideos } from "@/lib/youtube";
import { incrementSearchCount } from "@/lib/searchLimit";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // IP 기반 Rate Limit: 분당 30회
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(ip, "yt-search", 30, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json(
      { error: "Missing query param: q" },
      { status: 400 },
    );
  }

  // 검색 횟수 제한 체크 및 카운트 증가
  const { ok, used, limit } = await incrementSearchCount();
  if (!ok) {
    return NextResponse.json(
      {
        error: "SEARCH_LIMIT_EXCEEDED",
        message: `오늘 검색 한도(${limit}회)를 초과했습니다. 플랜을 업그레이드하세요.`,
        used,
        limit,
      },
      { status: 429 },
    );
  }

  try {
    const data = await searchVideos(q);
    return NextResponse.json({ items: data.items, used, limit });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
