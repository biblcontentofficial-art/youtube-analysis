"use client";

/**
 * 블록 기반 포스트 렌더러 — Notion / 메일리 스타일
 */

import { useState } from "react";
import type { PostBlock } from "@/lib/posts";

function inline(text: string) {
  // 인라인 마크다운: **굵게**, *기울임*, [텍스트](url)
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
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {inline(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─── YouTube 썸네일 + 클릭 시 iframe 로드 (메일리/노션 스타일) ───
function YouTubeEmbed({ videoId, title, caption }: { videoId: string; title?: string; caption?: string }) {
  const [playing, setPlaying] = useState(false);
  // maxresdefault가 없을 수 있어서 hqdefault fallback
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  return (
    <figure className="my-6">
      <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-black" style={{ paddingTop: "56.25%" }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title || caption || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full h-full cursor-pointer"
            aria-label="YouTube 영상 재생"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={title || "YouTube 썸네일"}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={() => setThumb(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 group-hover:from-black/50 transition" />
            {/* 상단 타이틀 (있을 때) */}
            {title && (
              <div className="absolute top-3 left-3 right-3 flex items-start gap-2 z-10">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white/95 overflow-hidden flex items-center justify-center text-black text-xs font-bold">
                  YT
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white text-sm md:text-base font-semibold leading-tight drop-shadow-lg line-clamp-2">
                    {title}
                  </div>
                </div>
              </div>
            )}
            {/* 재생 버튼 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-110 transition-all shadow-2xl flex items-center justify-center">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* 우측 하단 YouTube 라벨 */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded text-white text-xs font-medium">
              <span className="opacity-80">다음에서 보기:</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              <span className="font-bold">YouTube</span>
            </div>
          </button>
        )}
      </div>
      {caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{caption}</figcaption>}
    </figure>
  );
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
            if (!b.videoId) return null;
            return <YouTubeEmbed key={i} videoId={b.videoId} title={b.title} caption={b.caption} />;

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

          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            const cls = b.ordered ? "list-decimal" : "list-disc";
            return (
              <Tag key={i} className={`${cls} pl-6 space-y-2 text-slate-200`}>
                {b.items.filter((t) => t.trim().length > 0).map((it, j) => (
                  <li key={j} className="leading-relaxed">{inline(it)}</li>
                ))}
              </Tag>
            );
          }

          case "button": {
            const align = b.align === "left" ? "justify-start" : b.align === "right" ? "justify-end" : "justify-center";
            return (
              <div key={i} className={`my-6 flex ${align}`}>
                <a
                  href={b.url}
                  target={b.url?.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-base font-bold transition shadow-lg shadow-teal-900/20"
                >
                  {b.label || "버튼"}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            );
          }

          case "html":
            // 어드민만 작성 가능. 위험할 수 있으나 신뢰된 작성자(어드민)만 접근.
            return (
              <div
                key={i}
                className="my-6 [&_iframe]:rounded-xl [&_iframe]:w-full [&_img]:rounded-xl [&_img]:w-full"
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
