import { getSupabase } from "@/lib/supabase";

// 칼럼 새 글이 들어오도록 한 시간마다 다시 만든다(빌드 때 한 번 굳지 않게)
export const revalidate = 3600;

/** XML 특수문자 이스케이프 */
function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 본문 앞부분 한 줄 요약(이미지 URL·소제목 기호 제거) */
function summary(content: string, max = 200): string {
  const text = content
    .split("\n")
    .filter((l) => !/^\s*(https?:\/\/|\/api\/community\/image)/.test(l))
    .join(" ")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 비블 bibl 칼럼 최신 글(공개 게시판, 2026-10-30 색인 허용). 실패하면 빈 목록 */
async function columnItems(baseUrl: string): Promise<string[]> {
  try {
    const db = getSupabase();
    if (!db) return [];
    const { data: board } = await db.from("community_boards").select("id").eq("slug", "column").eq("is_active", true).maybeSingle();
    if (!board) return [];
    const { data: posts } = await db
      .from("community_posts")
      .select("id, title, content, created_at")
      .eq("board_id", board.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    return (posts ?? []).map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${baseUrl}/community/column/${p.id}</link>
      <guid isPermaLink="true">${baseUrl}/community/column/${p.id}</guid>
      <description>${esc(summary(p.content ?? ""))}</description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const baseUrl = "https://bibllab.com";

  const pages = [
    { title: "비블랩 - 유튜브 키워드·채널 분석 도구", url: "/", date: "2026-04-11" },
    { title: "영상 찾기 - 유튜브 키워드 검색", url: "/search", date: "2026-04-11" },
    { title: "채널 찾기 - 유튜브 채널 분석", url: "/channels", date: "2026-04-11" },
    { title: "스레드 분석", url: "/threads", date: "2026-04-11" },
    { title: "요금제", url: "/pricing", date: "2026-04-11" },
    { title: "비블 TMK STUDIO", url: "/studio", date: "2026-04-11" },
    { title: "팀비블 - 유튜브 1:1 컨설팅", url: "/studio/class/consulting", date: "2026-04-11" },
    { title: "무료 상담 신청", url: "/studio/consulting", date: "2026-04-11" },
    { title: "비블랩 소개", url: "/about", date: "2026-04-11" },
  ];

  const pageItems = pages
    .map(
      (p) => `    <item>
      <title>${p.title}</title>
      <link>${baseUrl}${p.url}</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");
  const items = [...(await columnItems(baseUrl)), pageItems].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>비블랩 (bibl lab)</title>
    <link>${baseUrl}</link>
    <description>유튜브 키워드·채널 분석 도구. 크리에이터를 위한 데이터 인사이트.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
