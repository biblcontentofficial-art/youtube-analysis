export async function GET() {
  const baseUrl = "https://bibllab.com";

  const pages = [
    { title: "비블랩 - 유튜브 키워드·채널 분석 도구", url: "/", date: "2026-04-11" },
    { title: "영상 찾기 - 유튜브 키워드 검색", url: "/search", date: "2026-04-11" },
    { title: "채널 찾기 - 유튜브 채널 분석", url: "/channels", date: "2026-04-11" },
    { title: "스레드 분석", url: "/threads", date: "2026-04-11" },
    { title: "요금제", url: "/pricing", date: "2026-04-11" },
    { title: "비블 TMK STUDIO", url: "/studio", date: "2026-04-11" },
    { title: "팀비블 - 유튜브 1:1 컨설팅", url: "/studio/class/team-bibl", date: "2026-04-11" },
    { title: "무료 상담 신청", url: "/studio/consulting", date: "2026-04-11" },
    { title: "비블랩 소개", url: "/about", date: "2026-04-11" },
  ];

  const items = pages
    .map(
      (p) => `    <item>
      <title>${p.title}</title>
      <link>${baseUrl}${p.url}</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

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
