// 어드민 전용 트렌딩 API 디버그 라우트
// 비밀 토큰으로 접근: /api/debug-trending?token=bibl_debug_2026
import { NextRequest } from "next/server";

const DEBUG_TOKEN = process.env.DEBUG_TOKEN ?? "bibl_debug_2026";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== DEBUG_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const freeKeys: Array<{ name: string; key: string }> = [];
  const paidKeys: Array<{ name: string; key: string }> = [];

  if (process.env.YOUTUBE_API_KEY) freeKeys.push({ name: "YOUTUBE_API_KEY", key: process.env.YOUTUBE_API_KEY });
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`];
    if (k) freeKeys.push({ name: `YOUTUBE_API_KEY_${i}`, key: k });
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`];
    if (k) paidKeys.push({ name: `YOUTUBE_API_KEY_PAID_${i}`, key: k });
  }

  const allKeys = [...paidKeys, ...freeKeys];
  const results: Record<string, unknown>[] = [];

  for (const { name, key } of allKeys) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=KR&maxResults=1&key=${key}`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      const body = await res.json().catch(() => ({}));

      const reason = body?.error?.errors?.[0]?.reason ?? null;
      const message = body?.error?.message ?? null;

      results.push({
        name,
        keyPrefix: key.slice(0, 12) + "...",
        status: res.status,
        ok: res.ok,
        itemsCount: body?.items?.length ?? 0,
        error: message,
        reason,
      });
    } catch (e: unknown) {
      results.push({
        name,
        keyPrefix: key.slice(0, 12) + "...",
        status: 0,
        ok: false,
        error: String(e),
        reason: "exception",
      });
    }
  }

  return Response.json({
    totalKeys: allKeys.length,
    freeKeyCount: freeKeys.length,
    paidKeyCount: paidKeys.length,
    workingKeys: results.filter(r => r.ok).length,
    quotaExceededKeys: results.filter(r => (r.reason as string)?.includes("quota") || (r.reason as string)?.includes("Limit")).length,
    results,
  });
}
