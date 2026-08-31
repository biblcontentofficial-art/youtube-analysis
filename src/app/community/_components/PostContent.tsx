/**
 * 커뮤니티 본문 렌더러 (글 상세 · 공개 페이지 공용)
 *
 * 사용자 생성 콘텐츠이므로 dangerouslySetInnerHTML 을 쓰지 않는다.
 * 한 줄 규약: 이미지·유튜브 주소는 그대로 삽입, "## " 소제목, "> " 인용, "---" 구분선.
 */

import type { ReactNode } from "react";

// ── 본문 자동 링크 (XSS 없이 React 노드로 조립) ────────────────────
const URL_RE = /https?:\/\/[^\s<>"']+/g;
const TRAIL_RE = /[.,!?;:)\]}>'"·]+$/;

function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = new RegExp(URL_RE.source, "g");
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    let url = m[0];
    const trimmed = url.replace(TRAIL_RE, "");
    if (trimmed !== url) {
      url = trimmed;
      re.lastIndex = m.index + url.length;
    }
    if (!url || !/^https?:\/\/\S/i.test(url)) continue;

    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <a
        key={`u${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-[#00E5A0] hover:text-[#66FFCC] underline underline-offset-2 break-all"
      >
        {url}
      </a>
    );
    last = m.index + url.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── 블록형 본문 렌더 ───────────────────────────────────────────────
// 한 줄이 이미지·유튜브 주소면 그대로 삽입하고, "## " 소제목, "> " 인용, "---" 구분선을 지원한다.
const IMG_LINE_RE =
  /^(https?:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"']*)?|\/api\/community\/image\?p=[^\s<>"']+|\/[A-Za-z0-9_\-/.]+\.(?:png|jpe?g|webp|gif))$/i;
const YT_LINE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})\S*$/i;

function renderContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buf: string[] = [];
  let key = 0;

  const flush = () => {
    const chunk = buf.join("\n").replace(/^\n+|\n+$/g, "");
    buf = [];
    if (!chunk) return;
    nodes.push(
      <p key={`p${key++}`} className="whitespace-pre-wrap">
        {linkify(chunk)}
      </p>
    );
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    const yt = t.match(YT_LINE_RE);

    if (IMG_LINE_RE.test(t)) {
      flush();
      nodes.push(
        // 본문 이미지는 형태를 정규식으로 검증한 주소만 그린다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`i${key++}`}
          src={t}
          alt=""
          loading="lazy"
          className="my-6 w-full rounded-2xl border border-neutral-800"
        />
      );
    } else if (yt) {
      flush();
      nodes.push(
        <div
          key={`v${key++}`}
          className="my-6 aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800"
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${yt[1]}`}
            title="YouTube video"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    } else if (t === "---") {
      flush();
      nodes.push(<hr key={`h${key++}`} className="my-8 border-neutral-800" />);
    } else if (t.startsWith("## ")) {
      flush();
      nodes.push(
        <h3 key={`t${key++}`} className="mb-3 mt-9 text-lg font-bold tracking-tight text-white lg:text-xl">
          {t.slice(3)}
        </h3>
      );
    } else if (t.startsWith("> ")) {
      flush();
      nodes.push(
        <blockquote
          key={`q${key++}`}
          className="my-5 border-l-2 border-neutral-600 py-1 pl-4 italic text-neutral-300"
        >
          {linkify(t.slice(2))}
        </blockquote>
      );
    } else {
      buf.push(line);
    }
  }
  flush();
  return nodes;
}


export default function PostContent({ content, className }: { content: string; className?: string }) {
  return (
    <article
      className={
        className ??
        "py-8 text-neutral-200 text-[15px] md:text-base leading-[1.85] break-words"
      }
    >
      {renderContent(content)}
    </article>
  );
}
