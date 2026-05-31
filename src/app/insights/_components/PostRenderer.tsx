/**
 * 블록 기반 포스트 렌더러 — Notion 스타일
 * 클라이언트 컴포넌트 (재사용: detail page + editor preview)
 */

import type { PostBlock } from "@/lib/posts";

function inline(text: string) {
  // 매우 가벼운 인라인 마크다운: **굵게**, *기울임*, [텍스트](url)
  const parts: (string | JSX.Element)[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={key++} className="font-bold text-white">{m[1]}</strong>);
    else if (m[2]) parts.push(<em key={key++} className="italic">{m[2]}</em>);
    else if (m[3] && m[4]) parts.push(<a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">{m[3]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function paragraph(text: string) {
  // 줄바꿈 처리
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {inline(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function PostRenderer({ blocks }: { blocks: PostBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-slate-500 italic">아직 내용이 없습니다.</p>;
  }

  return (
    <div className="space-y-5 text-slate-200 leading-[1.85] text-[17px]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return (
              <p key={i} className="text-slate-200">
                {paragraph(b.text)}
              </p>
            );

          case "heading": {
            const sz =
              b.level === 1
                ? "text-3xl md:text-4xl font-bold text-white mt-10 mb-2 tracking-tight"
                : b.level === 2
                ? "text-2xl md:text-3xl font-bold text-white mt-8 mb-1 tracking-tight"
                : "text-xl md:text-2xl font-bold text-white mt-6 mb-1 tracking-tight";
            const Tag = (`h${b.level}` as "h1" | "h2" | "h3");
            return <Tag key={i} className={sz}>{inline(b.text)}</Tag>;
          }

          case "image":
            return (
              <figure key={i} className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt={b.alt || b.caption || ""}
                  className="w-full rounded-xl border border-white/[0.06]"
                  loading="lazy"
                />
                {b.caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{b.caption}</figcaption>}
              </figure>
            );

          case "video":
            return (
              <figure key={i} className="my-6">
                <video
                  src={b.src}
                  controls
                  className="w-full rounded-xl border border-white/[0.06] bg-black"
                  preload="metadata"
                />
                {b.caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{b.caption}</figcaption>}
              </figure>
            );

          case "youtube":
            return (
              <figure key={i} className="my-6">
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${b.videoId}`}
                    title={b.caption || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-xl border border-white/[0.06] bg-black"
                  />
                </div>
                {b.caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{b.caption}</figcaption>}
              </figure>
            );

          case "divider":
            return <hr key={i} className="my-8 border-white/[0.08]" />;

          case "quote":
            return (
              <blockquote key={i} className="my-6 pl-5 border-l-4 border-teal-400/50 text-slate-300 italic">
                <p>{inline(b.text)}</p>
                {b.cite && <footer className="text-sm text-slate-500 mt-2 not-italic">— {b.cite}</footer>}
              </blockquote>
            );

          case "code":
            return (
              <pre key={i} className="my-6 p-4 rounded-xl bg-slate-900 border border-white/[0.06] overflow-x-auto text-sm text-slate-200">
                <code>{b.text}</code>
              </pre>
            );

          case "callout":
            return (
              <div key={i} className="my-6 flex gap-3 p-4 rounded-xl bg-teal-500/[0.06] border border-teal-400/20">
                <div className="text-2xl shrink-0">{b.emoji || "💡"}</div>
                <div className="text-slate-200">{paragraph(b.text)}</div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
