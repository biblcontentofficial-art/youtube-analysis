import { getSupabase } from "./supabase";

function parseSource(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    if (hostname.includes("google")) return "google";
    if (hostname.includes("instagram") || hostname.includes("cdninstagram")) return "instagram";
    if (hostname.includes("kakao")) return "kakao";
    if (hostname.includes("naver")) return "naver";
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "youtube";
    if (hostname.includes("facebook") || hostname.includes("fb.com")) return "facebook";
    if (hostname.includes("twitter") || hostname.includes("x.com") || hostname.includes("t.co")) return "twitter";
    if (hostname.includes("threads")) return "threads";
    return hostname || "other";
  } catch {
    return "other";
  }
}

export async function trackVisit(page: string, referrer: string | null) {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("page_visits").insert({
      page,
      referrer: referrer ?? null,
      source: parseSource(referrer),
    });
  } catch {
    // 추적 실패는 무시 (리다이렉트에 영향 없어야 함)
  }
}
