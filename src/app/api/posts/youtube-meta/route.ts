/**
 * GET /api/posts/youtube-meta?videoId=XXXX
 * YouTube oEmbed proxy — 영상 제목/저자명을 가져옴.
 * 어드민 전용. (CORS 우회 + 어드민 권한 체크)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canEditInsights } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || !canEditInsights({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const videoId = req.nextUrl.searchParams.get("videoId")?.trim();
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    return NextResponse.json({ message: "invalid videoId" }, { status: 400 });
  }
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "bibl-lab/1.0" } });
    if (!res.ok) return NextResponse.json({ title: "", author: "" });
    const data = await res.json();
    return NextResponse.json({
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch {
    return NextResponse.json({ title: "", author: "" });
  }
}
