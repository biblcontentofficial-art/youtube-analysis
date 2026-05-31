/**
 * 비블 인사이트 (Insights) — 비즈니스 칼럼/뉴스레터 게시물
 *
 * 블록 기반 컨텐츠 구조 (노션 스타일)
 */

export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "video"; src: string; caption?: string } // self-hosted mp4
  | { type: "youtube"; videoId: string; caption?: string; title?: string }
  | { type: "divider" }
  | { type: "quote"; text: string; cite?: string }
  | { type: "code"; lang?: string; text: string }
  | { type: "callout"; emoji?: string; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "button"; label: string; url: string; align?: "left" | "center" | "right" }
  | { type: "html"; html: string };

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  content: PostBlock[];
  description: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  view_count: number;
  author_id: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
}

/** YouTube URL → videoId 추출 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  // already an id
  if (/^[\w-]{11}$/.test(url)) return url;
  return null;
}

/** title → slug (한글 그대로, 공백→하이픈, 특수문자 제거) */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || `post-${Date.now().toString(36)}`;
}

/** 컨텐츠 블록에서 일반 텍스트 추출 (검색/요약용) */
export function blocksToPlainText(blocks: PostBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
        case "heading":
        case "quote":
        case "callout":
          return b.text;
        case "code":
          return b.text;
        case "image":
        case "video":
          return b.caption ?? "";
        case "youtube":
          return [b.title, b.caption].filter(Boolean).join(" ");
        case "list":
          return b.items.join(" ");
        case "button":
          return b.label;
        case "html":
          // strip tags loosely
          return b.html.replace(/<[^>]*>/g, " ");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");
}

export function summarize(blocks: PostBlock[], max = 160): string {
  const text = blocksToPlainText(blocks).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

/** 한글 우호 가독 시간 (분) — 분당 500자 가정 */
export function readingTimeMinutes(blocks: PostBlock[]): number {
  const len = blocksToPlainText(blocks).length;
  return Math.max(1, Math.round(len / 500));
}
