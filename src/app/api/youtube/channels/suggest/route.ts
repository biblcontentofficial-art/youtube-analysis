import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const SUGGEST_TTL = 60 * 60; // 1시간 캐시

function getAllFreeKeys(): string[] {
  const keys: string[] = [];
  if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) return NextResponse.json({ items: [] });

  const cacheKey = `yt:suggest:ch:${q.toLowerCase()}`;
  const cached = await cacheGet<object[]>(cacheKey);
  if (cached) return NextResponse.json({ items: cached });

  const apiKeys = getAllFreeKeys();
  if (!apiKeys.length) return NextResponse.json({ items: [] });

  let keyIndex = 0;
  while (keyIndex < apiKeys.length) {
    const apiKey = apiKeys[keyIndex];
    try {
      // 1단계: 채널 ID 목록 검색
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(q)}&type=channel&maxResults=8&key=${apiKey}`;
      const searchRes = await fetch(searchUrl, { cache: "no-store" });

      if (!searchRes.ok) {
        const errBody = await searchRes.json().catch(() => ({}));
        const reason0 = errBody?.error?.errors?.[0]?.reason ?? "";
        const isRetry = searchRes.status === 400 || searchRes.status === 401 ||
          searchRes.status === 403 || reason0 === "quotaExceeded" || reason0 === "keyInvalid";
        if (isRetry) { keyIndex++; continue; }
        return NextResponse.json({ items: [] });
      }

      const searchData = await searchRes.json();
      if (!searchData.items?.length) return NextResponse.json({ items: [] });

      const channelIds = searchData.items
        .map((item: any) => item.id?.channelId)
        .filter(Boolean)
        .join(",");

      // 2단계: 채널 상세 정보
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
      const chRes = await fetch(chUrl, { cache: "no-store" });
      if (!chRes.ok) { keyIndex++; continue; }

      const chData = await chRes.json();
      if (!chData.items?.length) return NextResponse.json({ items: [] });

      const items = chData.items.map((ch: any) => {
        const subs = parseInt(ch.statistics?.subscriberCount || "0");
        return {
          channelId: ch.id,
          title: ch.snippet.title,
          thumbnail: ch.snippet.thumbnails?.default?.url || "",
          subscriberCount: subs,
          subscriberCountFormatted: formatCount(subs),
          customUrl: ch.snippet.customUrl ?? null,
        };
      });

      await cacheSet(cacheKey, items, SUGGEST_TTL);
      return NextResponse.json({ items });
    } catch {
      keyIndex++;
    }
  }

  return NextResponse.json({ items: [] });
}
