// 어드민 전용 트렌딩 API 디버그 라우트
// /api/debug-trending 호출 시 각 API 키의 상태를 반환
import { isAdminEmail } from "@/lib/adminAuth";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  // 어드민만 접근 가능
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  if (!isAdminEmail(email)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const freeKeys: string[] = [];
  const paidKeys: string[] = [];

  if (process.env.YOUTUBE_API_KEY) freeKeys.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`];
    if (k) freeKeys.push(k);
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`];
    if (k) paidKeys.push(k);
  }

  const results: Record<string, unknown>[] = [];

  const allKeys = [...paidKeys.map((k, i) => ({ key: k, label: `PAID_${i + 1}` })), ...freeKeys.map((k, i) => ({ key: k, label: `FREE_${i + 1}` }))];

  for (const { key, label } of allKeys) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=KR&maxResults=1&key=${key}`;
      const res = await fetch(url, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));

      results.push({
        label,
        keyPrefix: key.slice(0, 10) + "...",
        status: res.status,
        ok: res.ok,
        itemsCount: body?.items?.length ?? 0,
        error: body?.error?.message ?? null,
        reason: body?.error?.errors?.[0]?.reason ?? null,
      });
    } catch (e: unknown) {
      results.push({
        label,
        keyPrefix: key.slice(0, 10) + "...",
        status: 0,
        ok: false,
        error: String(e),
      });
    }
  }

  return Response.json({
    totalKeys: allKeys.length,
    freeKeyCount: freeKeys.length,
    paidKeyCount: paidKeys.length,
    results,
  });
}
