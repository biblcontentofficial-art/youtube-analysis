"use client";

/**
 * 노션 스타일 블록 에디터
 * - 위에 블록을 클릭하여 추가
 * - 각 블록은 인라인 편집
 * - 글/사진/영상/유튜브/구분선/인용/콜아웃/코드 지원
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post, PostBlock } from "@/lib/posts";
import { extractYouTubeId, slugify } from "@/lib/posts";
import PostRenderer from "../../_components/PostRenderer";

interface Props {
  initial?: Partial<Post>;
}

const NEW_BLOCKS: { label: string; icon: JSX.Element; create: () => PostBlock }[] = [
  {
    label: "단락",
    icon: <Ico path="M4 6h16M4 12h16M4 18h10" />,
    create: () => ({ type: "paragraph", text: "" }),
  },
  {
    label: "제목 H2",
    icon: <Ico path="M4 12h8m0-7v14m8-14v14" />,
    create: () => ({ type: "heading", level: 2, text: "" }),
  },
  {
    label: "제목 H3",
    icon: <Ico path="M4 12h6m0-6v12m6-12v12M16 18h4M16 6h4" />,
    create: () => ({ type: "heading", level: 3, text: "" }),
  },
  {
    label: "이미지",
    icon: <Ico path="M3 5h18v14H3zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21" />,
    create: () => ({ type: "image", src: "", alt: "", caption: "" }),
  },
  {
    label: "영상 (mp4)",
    icon: <Ico path="M23 7l-7 5 7 5V7zM14 5H3v14h11V5z" />,
    create: () => ({ type: "video", src: "", caption: "" }),
  },
  {
    label: "YouTube",
    icon: <Ico path="M22 12s0-4-1-5c-.5-.5-1-1-2-1H5c-1 0-1.5.5-2 1-1 1-1 5-1 5s0 4 1 5c.5.5 1 1 2 1h14c1 0 1.5-.5 2-1 1-1 1-5 1-5zM10 9l5 3-5 3V9z" />,
    create: () => ({ type: "youtube", videoId: "", caption: "" }),
  },
  {
    label: "인용",
    icon: <Ico path="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />,
    create: () => ({ type: "quote", text: "", cite: "" }),
  },
  {
    label: "콜아웃",
    icon: <Ico path="M12 2L2 22h20L12 2zM12 9v4M12 17h.01" />,
    create: () => ({ type: "callout", emoji: "💡", text: "" }),
  },
  {
    label: "코드",
    icon: <Ico path="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
    create: () => ({ type: "code", lang: "", text: "" }),
  },
  {
    label: "구분선",
    icon: <Ico path="M5 12h14" />,
    create: () => ({ type: "divider" }),
  },
];

function Ico({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function PostEditor({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [blocks, setBlocks] = useState<PostBlock[]>(
    Array.isArray(initial?.content) && initial!.content.length > 0
      ? (initial!.content as PostBlock[])
      : [{ type: "paragraph", text: "" }]
  );
  const [status, setStatus] = useState<"draft" | "published">((initial?.status as "draft" | "published") ?? "draft");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // 자동 slug 생성 (편집 모드 아닐 때만)
  useEffect(() => {
    if (!isEdit && title && !slug) {
      setSlug(slugify(title));
    }
  }, [title, isEdit, slug]);

  function updateBlock(i: number, patch: Partial<PostBlock>) {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch } as PostBlock;
      return next;
    });
  }
  function deleteBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function insertBlock(afterIdx: number, block: PostBlock) {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, block);
      return next;
    });
  }

  async function uploadFile(file: File): Promise<{ url: string; kind: "image" | "video" } | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/posts/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "업로드 실패");
      return null;
    }
    return { url: data.url, kind: data.kind };
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    setError(null);
    const r = await uploadFile(file);
    setCoverUploading(false);
    if (r) setCoverImage(r.url);
  }

  async function save(asStatus?: "draft" | "published") {
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const newStatus = asStatus ?? status;
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      cover_image: coverImage || null,
      content: blocks,
      tags,
      status: newStatus,
      slug: slug.trim() || undefined,
    };

    try {
      if (isEdit && initial?.id) {
        const res = await fetch(`/api/posts/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "저장 실패");
        setStatus(newStatus);
        if (newStatus === "published") {
          router.push(`/insights/${data.post.slug}`);
        } else {
          alert("임시저장 완료");
        }
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "저장 실패");
        if (newStatus === "published") {
          router.push(`/insights/${data.post.slug}`);
        } else {
          router.push(`/insights/admin/${data.post.id}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial?.id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
    if (res.ok) router.push("/insights");
    else alert("삭제 실패");
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* 상단 툴바 */}
      <header className="sticky top-14 z-40 bg-gray-950/95 backdrop-blur border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link href="/insights" className="text-sm text-slate-400 hover:text-white">← 목록</Link>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-semibold text-white">{isEdit ? "글 수정" : "새 글"}</span>
            <span className={`ml-2 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
              status === "published"
                ? "bg-teal-500/15 text-teal-300 border-teal-400/30"
                : "bg-amber-500/15 text-amber-300 border-amber-400/30"
            }`}>
              {status === "published" ? "PUBLISHED" : "DRAFT"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-white"
            >
              {showPreview ? "편집" : "미리보기"}
            </button>
            <button
              disabled={saving}
              onClick={() => save("draft")}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-white disabled:opacity-50"
            >
              임시저장
            </button>
            <button
              disabled={saving}
              onClick={() => save("published")}
              className="text-sm px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold disabled:opacity-50"
            >
              {saving ? "저장 중..." : "발행"}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-red-300"
              >
                삭제
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 pb-3">
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>
          </div>
        )}
      </header>

      {showPreview ? (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
          {coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt={title} className="w-full" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{title || "(제목 없음)"}</h1>
          {subtitle && <p className="mt-4 text-xl text-slate-400">{subtitle}</p>}
          <hr className="my-8 border-white/[0.06]" />
          <PostRenderer blocks={blocks} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
          {/* 메타 영역 */}
          <section className="space-y-3 mb-8 pb-8 border-b border-white/[0.06]">
            {/* 커버 */}
            <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-4">
              {coverImage ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="cover" className="w-full max-h-64 object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <FileButton label="커버 교체" accept="image/*" disabled={coverUploading} onPick={handleCoverUpload} />
                    <button onClick={() => setCoverImage("")} className="text-xs px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.10] text-slate-300">제거</button>
                  </div>
                </div>
              ) : (
                <FileButton label={coverUploading ? "업로드 중..." : "+ 커버 이미지 추가"} accept="image/*" disabled={coverUploading} onPick={handleCoverUpload} />
              )}
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="w-full bg-transparent text-3xl md:text-4xl font-bold text-white placeholder-slate-700 outline-none tracking-tight"
            />
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="부제목 (선택)"
              className="w-full bg-transparent text-lg text-slate-300 placeholder-slate-700 outline-none"
            />
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer text-slate-500 hover:text-white">SEO/메타 설정</summary>
              <div className="mt-3 space-y-2">
                <label className="block">
                  <span className="text-xs text-slate-500">SEO description (검색 결과에 노출되는 설명, 160자 권장)</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full mt-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">태그 (쉼표 구분, 예: 유튜브, 1인기업, 마케팅)</span>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    className="w-full mt-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">URL slug (영문/한글, 자동 생성됨)</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full mt-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40 font-mono"
                  />
                </label>
              </div>
            </details>
          </section>

          {/* 블록 편집 영역 */}
          <section className="space-y-2">
            {blocks.map((b, i) => (
              <BlockEditor
                key={i}
                index={i}
                block={b}
                onUpdate={(p) => updateBlock(i, p)}
                onDelete={() => deleteBlock(i)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                onUpload={uploadFile}
                canMoveUp={i > 0}
                canMoveDown={i < blocks.length - 1}
              />
            ))}
            <AddBlockButton onAdd={(block) => insertBlock(blocks.length - 1, block)} />
          </section>

          <p className="mt-12 text-xs text-slate-600 leading-relaxed">
            팁: <code className="text-slate-400">**굵게**</code>, <code className="text-slate-400">*기울임*</code>, <code className="text-slate-400">[링크](url)</code> 인라인 마크다운 지원.
            이미지·영상은 드래그할 수도 있어요 (각 블록 우측 ↕ 버튼으로 순서 변경).
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function FileButton({
  label, accept, disabled, onPick,
}: { label: string; accept: string; disabled?: boolean; onPick: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="text-xs px-3 py-1.5 rounded-md bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-200 font-semibold disabled:opacity-50"
      >
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
function AddBlockButton({ onAdd }: { onAdd: (b: PostBlock) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pt-3">
      {open ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">블록 추가</span>
            <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-white">닫기</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {NEW_BLOCKS.map((nb) => (
              <button
                key={nb.label}
                onClick={() => {
                  onAdd(nb.create());
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-teal-400/30 text-slate-300 hover:text-white transition"
              >
                {nb.icon}
                <span className="text-xs font-semibold">{nb.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-xl border border-dashed border-white/[0.10] hover:border-teal-400/30 hover:bg-teal-500/[0.04] text-slate-500 hover:text-teal-300 text-sm font-semibold transition"
        >
          + 블록 추가
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function BlockEditor({
  index, block, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, onUpload,
}: {
  index: number;
  block: PostBlock;
  onUpdate: (p: Partial<PostBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpload: (f: File) => Promise<{ url: string; kind: "image" | "video" } | null>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File, expect: "image" | "video") {
    setUploading(true);
    const r = await onUpload(file);
    setUploading(false);
    if (!r) return;
    if (expect === "image") onUpdate({ src: r.url } as Partial<PostBlock>);
    else onUpdate({ src: r.url } as Partial<PostBlock>);
  }

  return (
    <div className="group relative rounded-lg hover:bg-white/[0.02] transition pl-1 -ml-1">
      {/* 좌측 핸들 */}
      <div className="absolute -left-12 top-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onMoveUp} disabled={!canMoveUp} className="w-6 h-6 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 flex items-center justify-center" title="위로">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
        </button>
        <button onClick={onMoveDown} disabled={!canMoveDown} className="w-6 h-6 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 flex items-center justify-center" title="아래로">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <button onClick={onDelete} className="w-6 h-6 rounded text-red-400/70 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center" title="삭제">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" /></svg>
        </button>
      </div>

      {block.type === "paragraph" && (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="여기에 글을 작성하세요…"
          rows={Math.max(2, block.text.split("\n").length)}
          className="w-full bg-transparent text-[17px] leading-[1.85] text-slate-200 placeholder-slate-700 outline-none resize-none p-2"
        />
      )}

      {block.type === "heading" && (
        <div className="flex items-stretch gap-2 p-2">
          <select
            value={block.level}
            onChange={(e) => onUpdate({ level: Number(e.target.value) as 1 | 2 | 3 })}
            className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 text-xs text-slate-300 outline-none"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="제목"
            className={`flex-1 bg-transparent outline-none font-bold text-white ${
              block.level === 1 ? "text-3xl md:text-4xl" : block.level === 2 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
            }`}
          />
        </div>
      )}

      {block.type === "image" && (
        <div className="p-2 space-y-2">
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.src} alt={block.alt || ""} className="w-full rounded-xl border border-white/[0.06]" />
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-slate-500 mb-3">이미지를 업로드하거나 URL을 붙여넣으세요</p>
              <FileButton label={uploading ? "업로드 중..." : "이미지 선택"} accept="image/*" disabled={uploading} onPick={(f) => handleUpload(f, "image")} />
            </div>
          )}
          <input
            value={block.src}
            onChange={(e) => onUpdate({ src: e.target.value })}
            placeholder="이미지 URL"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-400 outline-none font-mono"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="캡션 (선택)"
            className="w-full bg-transparent text-sm text-slate-500 placeholder-slate-700 outline-none px-1"
          />
        </div>
      )}

      {block.type === "video" && (
        <div className="p-2 space-y-2">
          {block.src ? (
            <video src={block.src} controls className="w-full rounded-xl border border-white/[0.06] bg-black" />
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-slate-500 mb-3">영상 파일(mp4/webm)을 업로드하세요 (최대 30MB)</p>
              <FileButton label={uploading ? "업로드 중..." : "영상 선택"} accept="video/*" disabled={uploading} onPick={(f) => handleUpload(f, "video")} />
            </div>
          )}
          <input
            value={block.src}
            onChange={(e) => onUpdate({ src: e.target.value })}
            placeholder="영상 URL"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-400 outline-none font-mono"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="캡션 (선택)"
            className="w-full bg-transparent text-sm text-slate-500 placeholder-slate-700 outline-none px-1"
          />
        </div>
      )}

      {block.type === "youtube" && (
        <div className="p-2 space-y-2">
          {block.videoId ? (
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${block.videoId}`}
                className="absolute inset-0 w-full h-full rounded-xl border border-white/[0.06] bg-black"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-slate-500">YouTube URL을 붙여넣으세요</p>
            </div>
          )}
          <input
            value={block.videoId}
            onChange={(e) => {
              const id = extractYouTubeId(e.target.value) ?? e.target.value;
              onUpdate({ videoId: id });
            }}
            placeholder="YouTube URL 또는 videoId"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none font-mono"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="캡션 (선택)"
            className="w-full bg-transparent text-sm text-slate-500 placeholder-slate-700 outline-none px-1"
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="p-2 border-l-4 border-teal-400/50 pl-4 space-y-1">
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="인용문"
            rows={2}
            className="w-full bg-transparent italic text-slate-300 placeholder-slate-700 outline-none resize-none"
          />
          <input
            value={block.cite ?? ""}
            onChange={(e) => onUpdate({ cite: e.target.value })}
            placeholder="출처 (선택)"
            className="w-full bg-transparent text-sm text-slate-500 placeholder-slate-700 outline-none"
          />
        </div>
      )}

      {block.type === "callout" && (
        <div className="flex gap-2 p-3 rounded-xl bg-teal-500/[0.06] border border-teal-400/20">
          <input
            value={block.emoji ?? ""}
            onChange={(e) => onUpdate({ emoji: e.target.value })}
            className="w-10 bg-transparent text-2xl outline-none text-center"
          />
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="콜아웃 내용"
            rows={2}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-700 outline-none resize-none"
          />
        </div>
      )}

      {block.type === "code" && (
        <div className="p-2 space-y-2">
          <input
            value={block.lang ?? ""}
            onChange={(e) => onUpdate({ lang: e.target.value })}
            placeholder="언어 (선택: js, py, sh ...)"
            className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-slate-300 outline-none font-mono"
          />
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="코드"
            rows={5}
            className="w-full bg-slate-900 border border-white/[0.06] rounded-lg p-3 text-sm text-slate-200 outline-none font-mono"
          />
        </div>
      )}

      {block.type === "divider" && (
        <div className="py-4 px-2">
          <hr className="border-white/[0.10]" />
        </div>
      )}
    </div>
  );
}
