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
 * 이미지는 고르는 즉시 스토리지에 올라가고 본문에는 /api/community/image?p=... 주소가 들어간다.
 */

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { STORAGE_BUCKET } from "@/lib/community";

type BlockType = "text" | "heading" | "quote" | "image" | "video" | "divider";

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

const BTN =
  "rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-200 transition hover:bg-neutral-700";

export default function BlockEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(value));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pendingFor = useRef<string | null>(null);
  const focusId = useRef<string | null>(null);

  // 블록이 바뀌면 상위 폼에 직렬화된 본문을 넘긴다
  useEffect(() => {
    onChange(serializeBlocks(blocks));
    // onChange 는 상위에서 매 렌더 새로 만들어질 수 있어 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

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
      next.splice(i + 1, 0, block);
      return next;
    });
    setMenuFor(null);
    if (block.type === "text" || block.type === "heading" || block.type === "quote") {
      focusId.current = block.id;
    }
  }

  function remove(id: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length > 0 ? next : [blank()];
    });
  }

  /** 이미지 선택 → 즉시 업로드 → 본문에 주소 삽입 */
  async function uploadImage(afterId: string, file: File) {
    setError(null);
    const placeholder: Block = { id: newId(), type: "image", text: "", uploading: true };
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
      setError(e instanceof Error ? e.message : "이미지를 올리지 못했습니다.");
    }
  }

  function addVideo(afterId: string) {
    const url = prompt("유튜브 주소를 붙여넣으세요.\n예: https://www.youtube.com/watch?v=...");
    if (!url) return;
    if (!YT_RE.test(url.trim())) {
      setError("유튜브 주소만 넣을 수 있습니다.");
      return;
    }
    setError(null);
    insertAfter(afterId, { id: newId(), type: "video", text: "", url: url.trim() });
  }

  function addLink(afterId: string) {
    const url = prompt("링크 주소를 붙여넣으세요.");
    if (!url?.trim()) return;
    insertAfter(afterId, blank("text", url.trim()));
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
      if (prev && prev.type !== "image" && prev.type !== "video" && prev.type !== "divider") {
        focusId.current = prev.id;
      }
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-3">
      {blocks.map((b) => (
        <div key={b.id} className="group relative rounded-xl px-1 py-0.5">
          {/* 블록 본문 */}
          {b.type === "divider" ? (
            <div className="flex items-center gap-2 py-3">
              <div className="h-px flex-1 bg-neutral-700" />
              <button type="button" onClick={() => remove(b.id)} className="text-xs text-neutral-500 hover:text-white">
                삭제
              </button>
            </div>
          ) : b.type === "image" ? (
            <div className="py-2">
              {b.uploading ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-700 text-sm text-neutral-500">
                  이미지 올리는 중…
                </div>
              ) : (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.url} alt="" className="w-full rounded-xl border border-neutral-800" />
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1 text-xs text-white hover:bg-black"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ) : b.type === "video" ? (
            <div className="relative py-2">
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-neutral-800">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${(b.url ?? "").match(YT_RE)?.[1] ?? ""}`}
                  title="video"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(b.id)}
                className="absolute right-2 top-4 rounded-lg bg-black/70 px-2.5 py-1 text-xs text-white hover:bg-black"
              >
                삭제
              </button>
            </div>
          ) : (
            <textarea
              data-block={b.id}
              value={b.text}
              disabled={disabled}
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
                    : "내용을 입력하세요. Enter 로 새 줄, 왼쪽 + 로 사진·영상을 넣습니다."
              }
              className={`w-full resize-none bg-transparent px-2 py-1.5 leading-relaxed text-white placeholder-neutral-600 focus:outline-none ${
                b.type === "heading"
                  ? "text-lg font-bold"
                  : b.type === "quote"
                    ? "border-l-2 border-neutral-600 text-neutral-300 italic"
                    : "text-[15px]"
              }`}
            />
          )}

          {/* 블록 추가 버튼 */}
          <div className="absolute -left-1 top-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setMenuFor(menuFor === b.id ? null : b.id)}
              aria-label="블록 추가"
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-white/[0.06] hover:text-white"
            >
              +
            </button>
          </div>

          {menuFor === b.id && (
            <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl border border-neutral-700 bg-neutral-950 p-2">
              <button
                type="button"
                className={BTN}
                onClick={() => {
                  pendingFor.current = b.id;
                  fileRef.current?.click();
                }}
              >
                사진
              </button>
              <button type="button" className={BTN} onClick={() => addVideo(b.id)}>
                동영상
              </button>
              <button type="button" className={BTN} onClick={() => addLink(b.id)}>
                링크
              </button>
              <button type="button" className={BTN} onClick={() => insertAfter(b.id, blank("heading"))}>
                소제목
              </button>
              <button type="button" className={BTN} onClick={() => insertAfter(b.id, blank("quote"))}>
                인용구
              </button>
              <button type="button" className={BTN} onClick={() => insertAfter(b.id, blank("divider"))}>
                구분선
              </button>
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 hover:text-white"
                onClick={() => setMenuFor(null)}
              >
                닫기
              </button>
            </div>
          )}
        </div>
      ))}

      {error && <p className="mt-2 px-2 text-xs text-red-400">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          const target = pendingFor.current;
          e.target.value = "";
          pendingFor.current = null;
          if (file && target) uploadImage(target, file);
        }}
      />
    </div>
  );
}
