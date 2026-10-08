/**
 * 커뮤니티 본문 렌더러 (글 상세 · 공개 페이지 공용)
 *
 * 사용자 생성 콘텐츠이므로 dangerouslySetInnerHTML 을 쓰지 않는다.
 * 한 줄 규약: 이미지·영상·유튜브 주소는 그대로 삽입, "## " 소제목, "> " 인용, "---" 구분선.
 * 글은 빈 줄을 기준으로 문단(<p>)을 나눠 그린다(저장 형식은 그대로, 표시만).
 * 이미지·영상은 세로로 길어도 화면 높이 70% 를 넘지 않고, 이미지는 눌러서 원본을 새 탭으로 연다(DESIGN 7.3 글 상세).
 */

import type { ReactNode } from "react";
import { cx } from "@/components/ui/button";

/** 본문 이미지 기본 모양: 비율 유지, 가로 이미지는 폭을 채우고 세로 이미지는 높이 70vh 에서 멈춘다 */
const IMAGE_CLASS = "mx-auto block h-auto w-auto max-w-full max-h-[70vh] rounded-panel border border-line";
const VIDEO_CLASS = "mx-auto my-6 block w-auto max-w-full max-h-[70vh] rounded-panel border border-line bg-canvas";

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
        className="text-fg underline decoration-fg-4 underline-offset-2 wrap-anywhere transition-colors hover:decoration-fg"
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
// 에디터가 올린 영상 파일 (외부 주소는 CSP media-src 에 막히므로 우리 저장소 경로만 그린다)
const VIDEO_LINE_RE = /^\/api\/community\/image\?p=[^\s<>"']+\.(?:mp4|mov|webm)$/i;
const YT_LINE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})\S*$/i;

/** 본문에서 처음 나오는 이미지 줄(공유 미리보기·배너용). 회원 전용 저장소 주소(/api/…)는 건너뛴다 */
export function firstBodyImage(text: string): string | null {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (IMG_LINE_RE.test(t) && !VIDEO_LINE_RE.test(t) && !t.startsWith("/api/")) return t;
  }
  return null;
}

/**
 * 본문 첫 줄(빈 줄 제외)이 이미지면 그 주소와 나머지 본문으로 나눈다. 없으면 image 는 null.
 * 페이지가 첫 이미지를 배너로 따로 그릴 때 본문에서 같은 사진이 두 번 나오지 않게 한다(원문은 그대로).
 */
export function splitLeadImage(text: string): { image: string | null; rest: string } {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.trim() !== "");
  if (i < 0) return { image: null, rest: text };
  const t = lines[i].trim();
  // 회원 전용 저장소 주소(/api/…)는 공개 페이지 배너로 올리지 않는다(firstBodyImage 와 같은 기준)
  if (!IMG_LINE_RE.test(t) || VIDEO_LINE_RE.test(t) || t.startsWith("/api/")) return { image: null, rest: text };
  return { image: t, rest: lines.slice(i + 1).join("\n") };
}

function renderContent(text: string, imageClassName: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buf: string[] = [];
  let key = 0;

  // 빈 줄(공백만 있는 줄 포함)로 문단을 나눈다. 문단 안의 줄바꿈은 그대로 보인다
  const flush = () => {
    const chunk = buf.join("\n").replace(/^\s*\n|\n\s*$/g, "");
    buf = [];
    for (const para of chunk.split(/\n[ \t]*\n/)) {
      const p = para.replace(/^\n+|\n+$/g, "");
      if (!p.trim()) continue;
      nodes.push(
        <p key={`p${key++}`} className="whitespace-pre-wrap">
          {linkify(p)}
        </p>
      );
    }
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    const yt = t.match(YT_LINE_RE);

    // 영상 경로도 IMG_LINE_RE 의 /api/community/image 패턴에 걸리므로 먼저 가른다
    if (VIDEO_LINE_RE.test(t)) {
      flush();
      nodes.push(
        <video
          key={`c${key++}`}
          src={t}
          controls
          playsInline
          preload="metadata"
          className={VIDEO_CLASS}
        />
      );
    } else if (IMG_LINE_RE.test(t)) {
      flush();
      nodes.push(
        // 본문 이미지는 형태를 정규식으로 검증한 주소만 그린다. 눌러서 원본을 새 탭으로
        <a key={`i${key++}`} href={t} target="_blank" rel="noopener noreferrer" className="mx-auto my-6 block w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t} alt="본문 이미지" loading="lazy" className={imageClassName} />
          <span className="sr-only"> 원본 보기 (새 창)</span>
        </a>
      );
    } else if (yt) {
      flush();
      nodes.push(
        <div
          key={`v${key++}`}
          className="my-6 aspect-video w-full overflow-hidden rounded-panel border border-line"
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
      nodes.push(<hr key={`h${key++}`} className="my-8 border-line" />);
    } else if (t.startsWith("## ")) {
      flush();
      nodes.push(
        <h3 key={`t${key++}`} className="mb-3 mt-9 text-h4 font-bold text-fg">
          {t.slice(3)}
        </h3>
      );
    } else if (t.startsWith("> ")) {
      flush();
      nodes.push(
        <blockquote
          key={`q${key++}`}
          className="my-5 border-l-2 border-line-hover py-1 pl-4 italic text-fg-2"
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


export default function PostContent({
  content,
  className,
  imageClassName = IMAGE_CLASS,
}: {
  content: string;
  /** 글자 크기·색·여백. 문단 간격(space-y-4)은 늘 붙는다 */
  className?: string;
  /** 본문 이미지 클래스 전체를 바꾼다(기본: 비율 유지 + 높이 70vh 상한) */
  imageClassName?: string;
}) {
  return (
    <article className={cx("space-y-4", className ?? "py-8 text-body text-fg-1 break-words")}>
      {renderContent(content, imageClassName)}
    </article>
  );
}
