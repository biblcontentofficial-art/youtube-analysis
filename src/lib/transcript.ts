/**
 * YouTube 자막(대본) 추출
 *
 * 우선순위:
 *  1) Supadata API (SUPADATA_API_KEY 있을 때) — 남의 영상도 안정적으로 추출
 *  2) 무료 폴백: youtube timedtext (서버 IP 차단 시 실패 가능)
 *
 * 반환: { text, lang, source } 또는 에러 throw
 */

import { extractYouTubeId } from "@/lib/posts";

export interface TranscriptResult {
  text: string;
  lang: string;
  source: "supadata" | "timedtext";
  title?: string;
}

/** Supadata: https://supadata.ai — GET /v1/youtube/transcript */
async function fetchViaSupadata(videoId: string): Promise<TranscriptResult | null> {
  const key = process.env.SUPADATA_API_KEY;
  if (!key) return null;

  // text=true → 문단으로 합쳐진 평문, lang 우선 한국어
  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true&lang=ko`;
  const res = await fetch(url, { headers: { "x-api-key": key } });
  if (!res.ok) {
    // 한국어 자막이 없을 수 있음 → lang 지정 없이 재시도
    const res2 = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
      headers: { "x-api-key": key },
    });
    if (!res2.ok) {
      const msg = await res2.text().catch(() => "");
      throw new Error(`Supadata 자막 추출 실패 (${res2.status}): ${msg.slice(0, 200)}`);
    }
    const d2 = await res2.json();
    const t2 = typeof d2?.content === "string" ? d2.content : "";
    if (!t2) return null;
    return { text: t2, lang: d2?.lang || "unknown", source: "supadata" };
  }
  const d = await res.json();
  const t = typeof d?.content === "string" ? d.content : "";
  if (!t) return null;
  return { text: t, lang: d?.lang || "ko", source: "supadata" };
}

/** 무료 폴백: youtube 페이지에서 자막 트랙 추출 (불안정) */
async function fetchViaTimedText(videoId: string): Promise<TranscriptResult | null> {
  // 1) 영상 페이지에서 captionTracks 메타 추출
  const page = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.8" },
  });
  if (!page.ok) return null;
  const html = await page.text();

  const m = html.match(/"captionTracks":(\[.*?\])/);
  if (!m) return null;
  let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }> = [];
  try {
    tracks = JSON.parse(m[1].replace(/\\u0026/g, "&"));
  } catch {
    return null;
  }
  if (tracks.length === 0) return null;

  // 한국어 우선, 없으면 영어, 없으면 첫 번째
  const pick =
    tracks.find((t) => t.languageCode === "ko") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks[0];

  const xmlRes = await fetch(pick.baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!xmlRes.ok) return null;
  const xml = await xmlRes.text();

  const lines = Array.from(xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map((mm) =>
    decodeHtml(mm[1])
  );
  const text = lines.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return { text, lang: pick.languageCode, source: "timedtext" };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\n/g, " ");
}

/** 메인: URL/ID → 자막 텍스트 */
export async function fetchYouTubeTranscript(urlOrId: string): Promise<TranscriptResult> {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) throw new Error("유효한 YouTube URL이 아닙니다.");

  // 1) Supadata
  try {
    const r = await fetchViaSupadata(videoId);
    if (r && r.text.length > 50) return r;
  } catch (e) {
    // Supadata 실패 시 폴백으로
    console.warn("[transcript] supadata failed:", e instanceof Error ? e.message : e);
  }

  // 2) 무료 폴백
  try {
    const r = await fetchViaTimedText(videoId);
    if (r && r.text.length > 50) return r;
  } catch (e) {
    console.warn("[transcript] timedtext failed:", e instanceof Error ? e.message : e);
  }

  throw new Error(
    "자막을 가져오지 못했습니다. 자막이 없는 영상이거나 추출이 차단됐을 수 있습니다. (SUPADATA_API_KEY 설정 권장)"
  );
}
