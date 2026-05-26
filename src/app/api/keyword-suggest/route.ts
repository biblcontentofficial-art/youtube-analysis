/**
 * YouTube 자동완성 키워드 추천 API
 *
 * Google이 제공하는 공개 suggest 엔드포인트 사용 — bibl lab은 그대로 전달만 함.
 * ToS III.E.4h 안전: 우리가 만든 metric이 아닌 Google/YouTube가 직접 제공하는 데이터.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ message: "키워드가 비어있습니다." }, { status: 400 });
  }

  try {
    // Google suggest endpoint (youtube client). JSONP 응답을 받지만 잘라서 파싱.
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&hl=ko&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bibl-lab/1.0)",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ message: "추천 키워드를 가져올 수 없습니다." }, { status: 502 });
    }
    const text = await res.text();
    // window.google.ac.h([...]) 형태로 반환됨. 괄호 안의 JSON만 추출
    const match = text.match(/\(([\s\S]+)\)/);
    if (!match) {
      return NextResponse.json({ suggestions: [] });
    }
    const data = JSON.parse(match[1]);
    // data[1]은 [["키워드", 0, [..]], ...] 형태
    const suggestions: string[] = Array.isArray(data?.[1])
      ? data[1]
          .map((item: unknown) => Array.isArray(item) ? item[0] : null)
          .filter((s: unknown): s is string => typeof s === "string" && s.toLowerCase() !== q.toLowerCase())
          .slice(0, 20)
      : [];
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[keyword-suggest] error:", e);
    return NextResponse.json({ message: "오류가 발생했습니다." }, { status: 500 });
  }
}
