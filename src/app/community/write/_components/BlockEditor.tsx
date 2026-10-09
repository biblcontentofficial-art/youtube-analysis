"use client";

/**
 * 블록 에디터 (노션·카페 글쓰기 방식)
 *
 * 본문을 블록 단위로 편집하고, 저장할 때는 글 상세 렌더러가 이해하는 한 줄 규약으로 직렬화한다.
 *   문단        → 그대로
 *   소제목      → "## 제목"
 *   인용구      → "> 문장"
 *   구분선      → "---"
 *   이미지·영상 → URL 한 줄
 *
 * 사진·영상 파일은 고르는 즉시 스토리지에 올라가고 본문에는 /api/community/image?p=... 주소가 들어간다.
 * 글 상세(PostContent)는 그 주소의 확장자로 <img>·<video> 를 가려 바로 그린다.
 *
 * 넣기 도구는 두 곳이다: 에디터 위 늘 보이는 한 줄(마지막으로 커서가 있던 블록 뒤에 넣는다)과 블록 옆 '+'.
 * '+' 는 마우스 기기에서는 블록에 올리거나 블록에 커서가 있을 때만, 터치 기기에서는 늘 보인다(hover 가 없으므로).
 * 유튜브·링크 주소는 넣을 블록 아래에 열리는 입력 줄에서 받는다.
 */

import { useEffect, useRef, useState } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { INPUT } from "@/components/ui/field";
import { WarningIcon } from "@/components/ui/icons";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { MAX_FILE_BYTES, STORAGE_BUCKET, formatFileSize, mediaKind } from "@/lib/community";

/** video = 유튜브 임베드, clip = 직접 올린 영상 파일 */
type BlockType = "text" | "heading" | "quote" | "image" | "clip" | "video" | "divider";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 서버(upload/inline)와 같은 값

interface Block {
  id: string;
  type: BlockType;
  /** 텍스트 계열 내용 */
  text: string;
  /** 이미지·영상 주소 */
  url?: string;
  /** 업로드 진행 표시 */
  uploading?: boolean;
}

const YT_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/;
/** 에디터가 올린 영상 파일 주소 (이미지 패턴보다 먼저 검사해야 한다) */
const CLIP_RE = /^\/api\/community\/image\?p=\S+\.(mp4|mov|webm)$/i;

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function blank(type: BlockType = "text", text = ""): Block {
  return { id: newId(), type, text };
}

/** 저장된 본문 → 블록 */
export function parseBlocks(content: string): Block[] {
  const lines = (content ?? "").split("\n");
  const out: Block[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    const text = buf.join("\n").replace(/^\n+|\n+$/g, "");
    buf = [];
    if (text) out.push(blank("text", text));
  };

  for (const line of lines) {
    const t = line.trim();
    if (t === "---") {
      flush();
      out.push(blank("divider"));
    } else if (t.startsWith("## ")) {
      flush();
      out.push(blank("heading", t.slice(3)));
    } else if (t.startsWith("> ")) {
      flush();
      out.push(blank("quote", t.slice(2)));
    } else if (/^https?:\/\/\S+$/.test(t) && YT_RE.test(t)) {
      flush();
      out.push({ id: newId(), type: "video", text: "", url: t });
    } else if (CLIP_RE.test(t)) {
      flush();
      out.push({ id: newId(), type: "clip", text: "", url: t });
    } else if (
      /^(https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?\S*)?|\/api\/community\/image\?p=\S+|\/[\w\-/.]+\.(png|jpe?g|webp|gif))$/i.test(t)
    ) {
      flush();
      out.push({ id: newId(), type: "image", text: "", url: t });
    } else {
      buf.push(line);
    }
  }
  flush();
  return out.length > 0 ? out : [blank()];
}

/** 블록 → 저장할 본문 */
export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return b.text.trim() ? `## ${b.text.trim()}` : "";
        case "quote":
          return b.text.trim() ? `> ${b.text.trim()}` : "";
        case "divider":
          return "---";
        case "image":
        case "clip":
        case "video":
          return b.url ?? "";
        default:
          return b.text;
      }
    })
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 넣기 도구 버튼(툴바·블록 메뉴 공용). 36px, 터치 기기 44px */
const TOOL_BTN = cx(buttonClass({ variant: "secondary", size: "sm" }), "pointer-coarse:h-11");

/** 사진·영상 위 삭제 버튼 */
const MEDIA_DELETE =
  "absolute right-2 top-2 inline-flex h-9 items-center rounded-control border border-line-strong bg-canvas/80 px-3 text-caption font-medium text-fg transition-colors hover:bg-canvas pointer-coarse:h-11";

type UrlKind = "youtube" | "link";

const URL_LABEL: Record<UrlKind, { label: string; placeholder: string }> = {
  youtube: { label: "유튜브 주소", placeholder: "https://www.youtube.com/watch?v=..." },
  link: { label: "링크 주소", placeholder: "https://" },
};

export default function BlockEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  // 첫 블록 id 는 순번으로 둔다. 무작위 id 를 쓰면 서버 렌더와 브라우저의 data-block 이 달라
  // (React 18 은 속성 차이를 고치지 않는다) 새 블록 포커스·툴바 위치 찾기가 어긋난다.
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(value).map((b, i) => ({ ...b, id: `b${i}` })));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 열려 있는 주소 입력 줄: 어느 블록 뒤에 무엇을 넣을지 */
  const [urlInput, setUrlInput] = useState<{ kind: UrlKind; afterId: string } | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const pendingFor = useRef<string | null>(null);
  const focusId = useRef<string | null>(null);
  /** 마지막으로 커서가 있던 블록 (툴바가 그 뒤에 넣는다) */
  const lastFocused = useRef<string | null>(null);

  // 블록이 바뀌면 상위 폼에 직렬화된 본문을 넘긴다
  useEffect(() => {
    onChange(serializeBlocks(blocks));
    // onChange 는 상위에서 매 렌더 새로 만들어질 수 있어 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // 오류가 뜨면 화면 안으로 끌어온다(아래 고정 등록 줄에 가리지 않게 scroll-mb 로 여유를 둔다)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  // 새로 만든 블록으로 포커스 이동
  useEffect(() => {
    if (!focusId.current) return;
    const el = document.querySelector<HTMLTextAreaElement>(`[data-block="${focusId.current}"]`);
    focusId.current = null;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [blocks]);

  function patch(id: string, next: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...next } : b)));
  }

  function insertAfter(id: string, block: Block) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const next = [...prev];
      // 기준 블록이 사라졌으면 맨 뒤에 붙인다
      next.splice(i < 0 ? next.length : i + 1, 0, block);
      return next;
    });
    setMenuFor(null);
    if (block.type === "text" || block.type === "heading" || block.type === "quote") {
      focusId.current = block.id;
    }
  }

  /** 넣기 도구용: 넣을 자리가 빈 문단이면 그 문단을 바꾸고, 아니면 뒤에 넣는다 */
  function place(id: string, block: Block) {
    const target = blocks.find((b) => b.id === id);
    if (target && target.type === "text" && target.text.trim() === "") {
      const textLike = block.type === "text" || block.type === "heading" || block.type === "quote";
      setBlocks((prev) => {
        const i = prev.findIndex((x) => x.id === id);
        const next = prev.map((x) => (x.id === id ? { ...block, id } : x));
        // 영상이 맨 끝 문단을 바꾸면 이어 쓸 빈 문단을 하나 둔다
        if (!textLike && i === prev.length - 1) next.push(blank());
        return next;
      });
      setMenuFor(null);
      if (textLike) focusId.current = id;
      return;
    }
    insertAfter(id, block);
  }

  function remove(id: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length > 0 ? next : [blank()];
    });
  }

  /** 툴바가 넣을 자리: 마지막으로 커서가 있던 블록, 없으면 맨 끝 블록 */
  function toolbarTarget(): string {
    const id = lastFocused.current;
    if (id && blocks.some((b) => b.id === id)) return id;
    return blocks[blocks.length - 1].id;
  }

  /** 사진·영상 선택 → 즉시 업로드 → 본문에 주소 삽입 */
  async function uploadMedia(afterId: string, file: File) {
    setError(null);
    const kind = mediaKind(file.name);
    if (kind === "file") {
      setError("사진(png, jpg, gif, webp)이나 영상(mp4, mov, webm)만 넣을 수 있습니다.");
      return;
    }
    // 서버도 같은 기준으로 막지만, 큰 파일을 올리기 전에 먼저 알려 준다
    const limit = kind === "video" ? MAX_FILE_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      setError(
        `${kind === "video" ? "영상" : "사진"}은 ${formatFileSize(limit)}까지 올릴 수 있습니다. (${formatFileSize(file.size)})`
      );
      return;
    }
    const placeholder: Block = {
      id: newId(),
      type: kind === "video" ? "clip" : "image",
      text: "",
      uploading: true,
    };
    insertAfter(afterId, placeholder);

    try {
      const signRes = await fetch("/api/community/upload/inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      const signed = await signRes.json().catch(() => ({}));
      if (!signRes.ok) throw new Error(signed.message ?? "업로드 준비에 실패했습니다.");

      const supabase = createSupabaseBrowser();
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || undefined });
      if (upErr) throw new Error(upErr.message);

      patch(placeholder.id, {
        uploading: false,
        url: `/api/community/image?p=${encodeURIComponent(signed.path)}`,
      });
    } catch (e) {
      remove(placeholder.id);
      setError(e instanceof Error ? e.message : "파일을 올리지 못했습니다.");
    }
  }

  function pickMedia(afterId: string) {
    pendingFor.current = afterId;
    fileRef.current?.click();
  }

  /** 유튜브·링크 주소 입력 줄을 연다 */
  function openUrlInput(kind: UrlKind, afterId: string) {
    setMenuFor(null);
    setUrlValue("");
    setUrlInput({ kind, afterId });
  }

  function closeUrlInput() {
    setUrlInput(null);
    setUrlValue("");
  }

  function addVideo(afterId: string, raw: string) {
    const url = raw.trim();
    if (!url) return;
    if (!YT_RE.test(url)) {
      setError("유튜브 주소만 넣을 수 있습니다.");
      return;
    }
    setError(null);
    closeUrlInput();
    place(afterId, { id: newId(), type: "video", text: "", url });
  }

  function addLink(afterId: string, raw: string) {
    const url = raw.trim();
    if (!url) return;
    setError(null);
    closeUrlInput();
    place(afterId, blank("text", url));
  }

  function submitUrl() {
    if (!urlInput) return;
    if (urlInput.kind === "youtube") addVideo(urlInput.afterId, urlValue);
    else addLink(urlInput.afterId, urlValue);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>, b: Block) {
    // Enter = 새 블록, Shift+Enter = 줄바꿈 (노션과 동일)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      insertAfter(b.id, blank());
      return;
    }
    // 빈 블록에서 Backspace = 블록 삭제
    if (e.key === "Backspace" && b.text === "" && blocks.length > 1) {
      e.preventDefault();
      const i = blocks.findIndex((x) => x.id === b.id);
      const prev = blocks[i - 1];
      remove(b.id);
      if (prev && prev.type !== "image" && prev.type !== "clip" && prev.type !== "video" && prev.type !== "divider") {
        focusId.current = prev.id;
      }
    }
  }

  /** 넣기 도구 묶음(툴바·블록 메뉴가 같은 버튼과 같은 핸들러를 쓴다) */
  function tools(afterId: () => string) {
    return (
      <>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => pickMedia(afterId())}>
          사진·동영상
        </button>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => openUrlInput("youtube", afterId())}>
          유튜브
        </button>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => openUrlInput("link", afterId())}>
          링크
        </button>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => place(afterId(), blank("heading"))}>
          소제목
        </button>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => place(afterId(), blank("quote"))}>
          인용구
        </button>
        <button type="button" className={TOOL_BTN} disabled={disabled} onClick={() => insertAfter(afterId(), blank("divider"))}>
          구분선
        </button>
      </>
    );
  }

  // 칸마다 링을 그리지 않고 틀 하나에 포커스를 보인다: 흰 테두리 1px + 외곽선 1px(합쳐 2px, DESIGN 8 입력 규칙)
  return (
    <div className="rounded-card border border-line-strong bg-surface transition-colors duration-150 has-[textarea:focus-visible]:border-accent has-[textarea:focus-visible]:outline-1 has-[textarea:focus-visible]:outline-offset-0 has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-accent">
      {/* 넣기 도구 (늘 보임. 좁은 화면에서는 두 줄로 접혀 버튼이 모두 보인다) */}
      <div role="group" aria-label="본문에 넣기" className="flex flex-wrap items-center gap-1.5 border-b border-line p-2">
        {tools(toolbarTarget)}
      </div>

      <div className="min-h-[240px] p-2">
        {blocks.map((b) => (
          <div key={b.id}>
            <div className="group flex items-start gap-1">
              {/* 블록 추가 버튼: 마우스 기기는 올리거나 포커스할 때, 터치 기기는 늘 */}
              <div className="shrink-0 pt-0.5 opacity-100 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    closeUrlInput();
                    setMenuFor(menuFor === b.id ? null : b.id);
                  }}
                  aria-label="블록 추가"
                  aria-expanded={menuFor === b.id}
                  disabled={disabled}
                  className="flex size-9 items-center justify-center rounded-control text-body text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg pointer-fine:size-7"
                >
                  +
                </button>
              </div>

              {/* 블록 본문 */}
              <div className="min-w-0 flex-1">
                {b.type === "divider" ? (
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-line-strong" />
                    <button
                      type="button"
                      onClick={() => remove(b.id)}
                      aria-label="구분선 삭제"
                      className="inline-flex h-9 items-center rounded-control px-2.5 text-caption text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:h-11"
                    >
                      삭제
                    </button>
                  </div>
                ) : b.type === "image" ? (
                  <div className="py-2">
                    {b.uploading ? (
                      <div className="flex h-32 items-center justify-center rounded-control border border-dashed border-line-strong text-body-sm text-fg-3">
                        이미지 올리는 중…
                      </div>
                    ) : (
                      <div className="relative w-fit max-w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.url} alt="" className="block h-auto max-h-80 w-auto max-w-full rounded-control border border-line" />
                        <button type="button" onClick={() => remove(b.id)} aria-label="사진 삭제" className={MEDIA_DELETE}>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ) : b.type === "clip" ? (
                  <div className="py-2">
                    {b.uploading ? (
                      <div className="flex h-32 items-center justify-center rounded-control border border-dashed border-line-strong text-body-sm text-fg-3">
                        영상 올리는 중… 파일이 크면 시간이 걸립니다.
                      </div>
                    ) : (
                      <div className="relative">
                        <video
                          src={b.url}
                          controls
                          playsInline
                          preload="metadata"
                          className="block max-h-80 w-full rounded-control border border-line bg-canvas"
                        />
                        <button type="button" onClick={() => remove(b.id)} aria-label="영상 삭제" className={MEDIA_DELETE}>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ) : b.type === "video" ? (
                  <div className="relative py-2">
                    <div className="aspect-video w-full overflow-hidden rounded-control border border-line">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${(b.url ?? "").match(YT_RE)?.[1] ?? ""}`}
                        title="video"
                        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                    <button type="button" onClick={() => remove(b.id)} aria-label="유튜브 영상 삭제" className={cx(MEDIA_DELETE, "top-4")}>
                      삭제
                    </button>
                  </div>
                ) : (
                  <textarea
                    data-block={b.id}
                    value={b.text}
                    disabled={disabled}
                    aria-label={b.type === "heading" ? "소제목" : b.type === "quote" ? "인용구" : "본문 문단"}
                    onFocus={() => {
                      lastFocused.current = b.id;
                    }}
                    onChange={(e) => {
                      patch(b.id, { text: e.target.value });
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => onKeyDown(e, b)}
                    rows={1}
                    placeholder={
                      b.type === "heading"
                        ? "소제목"
                        : b.type === "quote"
                          ? "인용할 문장"
                          : "내용을 입력하세요"
                    }
                    className={`block w-full resize-none bg-transparent px-2 py-1.5 leading-relaxed text-fg placeholder:text-fg-3 focus:outline-hidden ${
                      b.type === "heading"
                        ? "text-h4 font-bold"
                        : b.type === "quote"
                          ? "border-l-2 border-line-hover italic text-fg-2"
                          : "text-ui"
                    }`}
                  />
                )}
              </div>
            </div>

            {menuFor === b.id && (
              <div className="mb-1 ml-10 mt-1 flex flex-wrap gap-1.5 rounded-card border border-line-strong bg-surface-2 p-2 pointer-fine:ml-8">
                {tools(() => b.id)}
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-control px-2.5 text-caption text-fg-3 transition-colors hover:text-fg pointer-coarse:h-11"
                  onClick={() => setMenuFor(null)}
                >
                  닫기
                </button>
              </div>
            )}

            {/* 유튜브·링크 주소 입력 줄 (넣을 블록 바로 아래) */}
            {urlInput?.afterId === b.id && (
              <div className="mb-1 ml-10 mt-1 flex flex-wrap items-center gap-2 rounded-card border border-line-strong bg-surface-2 p-2 pointer-fine:ml-8">
                <label htmlFor="block-url-input" className="sr-only">
                  {URL_LABEL[urlInput.kind].label}
                </label>
                <input
                  id="block-url-input"
                  type="url"
                  inputMode="url"
                  autoFocus
                  aria-label={URL_LABEL[urlInput.kind].label}
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    // 폼 제출 대신 이 줄의 '추가'로 처리한다
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      submitUrl();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      closeUrlInput();
                    }
                  }}
                  placeholder={URL_LABEL[urlInput.kind].placeholder}
                  className={cx(INPUT, "min-w-0 flex-1 basis-56")}
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={submitUrl}
                    disabled={!urlValue.trim()}
                    className={cx(buttonClass({ variant: "secondary" }))}
                  >
                    추가
                  </button>
                  <button type="button" onClick={closeUrlInput} className={buttonClass({ variant: "ghost" })}>
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="border-t border-line-soft px-4 py-2 text-micro text-fg-3">
        Enter 는 문단 나누기, Shift+Enter 는 줄바꿈입니다.
      </p>

      {error && (
        <p
          ref={errorRef}
          role="alert"
          className="flex scroll-mb-28 items-start gap-1.5 border-t border-line px-4 py-3 text-body-sm text-negative"
        >
          <WarningIcon size={16} className="mt-[3px]" />
          <span>{error}</span>
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          const target = pendingFor.current;
          e.target.value = "";
          pendingFor.current = null;
          if (file && target) uploadMedia(target, file);
        }}
      />
    </div>
  );
}
