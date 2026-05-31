"use client";

/**
 * 메일리/노션 스타일 블록 에디터
 * - 본문에서 '/' 입력 시 블록 메뉴 (BlockPicker)
 * - 각 블록 왼쪽 호버 '+' / '⠿' 핸들로 블록 추가·이동·삭제
 * - YouTube URL 붙여넣으면 썸네일+재생버튼 카드로 자동 변환
 * - SEO 메타 자동 생성 (제목·본문 기반)
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post, PostBlock } from "@/lib/posts";
import { extractYouTubeId, slugify, summarize, blocksToPlainText, POST_CATEGORIES, DEFAULT_CATEGORY, normalizeCategory, type PostCategory } from "@/lib/posts";
import PostRenderer from "../../_components/PostRenderer";
import BlockPicker from "./BlockPicker";
import YouTubeImport from "./YouTubeImport";
import ThreadsImport from "./ThreadsImport";

interface Props {
  initial?: Partial<Post>;
}

export default function PostEditor({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [category, setCategory] = useState<PostCategory>(normalizeCategory(initial?.category) ?? DEFAULT_CATEGORY);
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [blocks, setBlocks] = useState<PostBlock[]>(
    Array.isArray(initial?.content) && initial!.content.length > 0
      ? (initial!.content as PostBlock[])
      : [{ type: "paragraph", text: "" }]
  );
  const [status, setStatus] = useState<"draft" | "published">((initial?.status as "draft" | "published") ?? "draft");

  // SEO 메타: 사용자가 직접 수정하기 전까지는 title+본문에서 자동 생성
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descTouched, setDescTouched] = useState(!!initial?.description);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [tagsTouched, setTagsTouched] = useState(!!(initial?.tags && initial.tags.length > 0));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showYtImport, setShowYtImport] = useState(false);
  const [showThreadsImport, setShowThreadsImport] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // 블록 추가 메뉴 상태
  // target: "end" → 맨 끝에 추가 / number → 해당 인덱스 뒤에 추가 / {replace} → 슬래시 입력 중인 블록 교체
  const [picker, setPicker] = useState<
    | null
    | { mode: "insert"; after: number | "end"; rect: DOMRect | null }
    | { mode: "slash"; index: number; rect: DOMRect | null }
  >(null);

  // ─── 자동 생성 값 ───
  const autoSlug = title ? slugify(title) : "";
  const autoDescription = subtitle?.trim() || summarize(blocks, 155);
  const autoTags = extractAutoTags(title, blocks);
  const autoTagsJoined = autoTags.join(", ");

  const effectiveSlug = slugTouched ? slug : autoSlug;
  const effectiveDescription = descTouched ? description : autoDescription;
  const effectiveTagsText = tagsTouched ? tagsText : autoTagsJoined;

  useEffect(() => {
    if (!slugTouched) setSlug(autoSlug);
  }, [autoSlug, slugTouched]);
  useEffect(() => {
    if (!descTouched) setDescription(autoDescription);
  }, [autoDescription, descTouched]);
  useEffect(() => {
    if (!tagsTouched) setTagsText(autoTagsJoined);
  }, [autoTagsJoined, tagsTouched]);

  // ─── 블록 조작 ───
  function updateBlock(i: number, patch: Partial<PostBlock>) {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch } as PostBlock;
      return next;
    });
  }
  function replaceBlock(i: number, block: PostBlock) {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = block;
      return next;
    });
  }
  function deleteBlock(i: number) {
    setBlocks((prev) => (prev.length <= 1 ? [{ type: "paragraph", text: "" }] : prev.filter((_, idx) => idx !== i)));
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
  // 드래그앤드롭: from 위치 블록을 to 위치로 이동
  function moveBlockTo(from: number, to: number) {
    setBlocks((prev) => {
      if (from === to || from < 0 || from >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      const insertAt = from < to ? to - 1 : to;
      next.splice(insertAt, 0, moved);
      return next;
    });
  }
  function insertBlockAfter(afterIdx: number | "end", block: PostBlock) {
    setBlocks((prev) => {
      const next = [...prev];
      const at = afterIdx === "end" ? next.length : afterIdx + 1;
      next.splice(at, 0, block);
      return next;
    });
  }

  // 엔터: 단락을 커서 기준으로 분리 → 현재 블록=앞부분, 새 단락=뒷부분
  function splitParagraph(i: number, before: string, after: string) {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = { type: "paragraph", text: before };
      next.splice(i + 1, 0, { type: "paragraph", text: after });
      return next;
    });
  }

  // BlockPicker가 블록을 선택했을 때
  function handlePick(block: PostBlock) {
    if (!picker) return;
    if (picker.mode === "slash") {
      // 슬래시로 띄운 경우: 현재 빈 단락을 교체
      replaceBlock(picker.index, block);
    } else {
      insertBlockAfter(picker.after, block);
    }
    setPicker(null);
  }

  // ─── 업로드 ───
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

  // ─── 저장 ───
  async function save(asStatus?: "draft" | "published") {
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const newStatus = asStatus ?? status;
    const tags = effectiveTagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      category,
      description: effectiveDescription.trim() || null,
      cover_image: coverImage || null,
      content: blocks,
      tags,
      status: newStatus,
      slug: effectiveSlug.trim() || undefined,
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
        if (newStatus === "published") router.push(`/insights/${data.post.slug}`);
        else alert("임시저장 완료");
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "저장 실패");
        if (newStatus === "published") router.push(`/insights/${data.post.slug}`);
        else router.push(`/insights/admin/${data.post.id}`);
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
            {!isEdit && (
              <>
                <button
                  onClick={() => setShowYtImport(true)}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-200 font-semibold"
                  title="유튜브 영상 자막으로 칼럼 초안 생성"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path fill="#fff" d="M9.545 15.568V8.432L15.818 12z" /></svg>
                  유튜브에서
                </button>
                <button
                  onClick={() => setShowThreadsImport(true)}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white font-semibold"
                  title="스레드 글을 붙여넣어 칼럼 초안 생성"
                >
                  <svg className="w-4 h-4" viewBox="0 0 192 192" fill="currentColor"><path d="M141.5 88.4c-.7-.3-1.4-.7-2.1-1-1.2-22.8-13.7-35.9-34.7-36-9.5 0-17.4 4-23.1 11.7l11.4 7.8c4-5.4 8.5-6.5 11.7-6.5 4.2 0 8.3 1.6 10.4 4.4 1.6 2 2.6 4.7 3.1 8.2-6-1-12.4-1.3-19.3-.9-19.4 1.1-31.9 12.4-31.1 28.1.4 8 4.4 14.9 11.2 19.4 5.8 3.8 13.2 5.7 20.9 5.3 10.2-.6 18.2-4.5 23.8-11.6 4.2-5.4 6.9-12.4 8.1-21.2 4.9 3 8.5 6.9 10.5 11.6 3.4 8 3.6 21.2-7.1 31.9-9.4 9.4-20.7 13.5-37.7 13.6-18.9-.1-33.2-6.2-42.5-18-8.7-11.1-13.2-27.1-13.4-47.6.2-20.5 4.7-36.5 13.4-47.6 9.3-11.9 23.6-17.9 42.5-18 19 .1 33.5 6.2 43.1 18.1 4.7 5.9 8.3 13.2 10.6 21.8l13.4-3.6c-2.8-10.6-7.2-19.8-13.3-27.4C160.7 11.2 142.6 2.2 118.4 2h-.1C94.3 2.2 76.4 11.2 64.6 26.7 54 40.6 48.6 59.8 48.4 83.6v.8c.2 23.8 5.6 43 16.2 56.9 11.8 15.5 29.7 24.5 53.9 24.7h.1c21.5-.2 36.6-5.8 49.1-18.3 16.4-16.3 15.9-36.8 10.5-49.4-3.9-9-11.3-16.3-21.2-21.1Zm-39.3 35.4c-8.5.5-17.4-3.4-17.8-11.4-.3-5.9 4.2-12.5 18.3-13.3 1.6-.1 3.2-.1 4.7-.1 5.1 0 9.9.5 14.3 1.5-1.6 20.4-11.2 22.9-19.5 23.3Z"/></svg>
                  스레드에서
                </button>
              </>
            )}
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

            {/* 카테고리 선택 (필수) */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-slate-500 mr-1">카테고리</span>
              {POST_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${
                    category === c
                      ? "bg-teal-500/20 text-teal-200 border-teal-400/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:border-white/[0.20] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <details className="text-sm text-slate-400">
              <summary className="cursor-pointer text-slate-500 hover:text-white">
                SEO/메타 설정
                <span className="ml-2 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-400/20">
                  자동 생성
                </span>
              </summary>
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                제목·부제목·본문을 쓰면 아래 항목은 자동으로 채워집니다. 직접 입력하면 수동값으로 고정되고, <b className="text-slate-400">[자동으로 되돌리기]</b> 를 누르면 다시 자동 추출됩니다.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      SEO description <span className="text-slate-600">(검색 결과 설명, 155자 권장)</span>
                    </span>
                    <AutoBadge touched={descTouched} onReset={() => { setDescTouched(false); setDescription(autoDescription); }} />
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescTouched(true); setDescription(e.target.value); }}
                    rows={2}
                    placeholder={autoDescription || "본문이 생기면 자동으로 채워집니다"}
                    className={`w-full bg-white/[0.03] border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40 ${
                      descTouched ? "border-white/[0.10]" : "border-teal-400/15"
                    }`}
                  />
                  <div className="mt-1 text-[10px] text-slate-600 text-right">{(descTouched ? description : autoDescription).length} / 160</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      태그 <span className="text-slate-600">(쉼표 구분, 자동 추출 최대 5개)</span>
                    </span>
                    <AutoBadge touched={tagsTouched} onReset={() => { setTagsTouched(false); setTagsText(autoTagsJoined); }} />
                  </div>
                  <input
                    value={tagsText}
                    onChange={(e) => { setTagsTouched(true); setTagsText(e.target.value); }}
                    placeholder={autoTagsJoined || "예: 유튜브, 1인기업, 마케팅"}
                    className={`w-full bg-white/[0.03] border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40 ${
                      tagsTouched ? "border-white/[0.10]" : "border-teal-400/15"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">URL slug</span>
                    <AutoBadge touched={slugTouched} onReset={() => { setSlugTouched(false); setSlug(autoSlug); }} />
                  </div>
                  <input
                    value={slug}
                    onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                    placeholder={autoSlug || "post-slug"}
                    className={`w-full bg-white/[0.03] border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-400/40 font-mono ${
                      slugTouched ? "border-white/[0.10]" : "border-teal-400/15"
                    }`}
                  />
                  <div className="mt-1 text-[10px] text-slate-600">/insights/{effectiveSlug || "..."}</div>
                </div>
              </div>
            </details>
          </section>

          {/* 블록 편집 영역 */}
          <section
            className="space-y-1"
            onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
          >
            {blocks.map((b, i) => (
              <BlockRow
                key={i}
                index={i}
                block={b}
                onUpdate={(p) => updateBlock(i, p)}
                onReplace={(blk) => replaceBlock(i, blk)}
                onDelete={() => deleteBlock(i)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                onUpload={uploadFile}
                onSlash={(rect) => setPicker({ mode: "slash", index: i, rect })}
                onAddAfter={(rect) => setPicker({ mode: "insert", after: i, rect })}
                onEnterAddBelow={() => insertBlockAfter(i, { type: "paragraph", text: "" })}
                onSplit={(before, after) => splitParagraph(i, before, after)}
                canMoveUp={i > 0}
                canMoveDown={i < blocks.length - 1}
                isDragging={dragIndex === i}
                showDropLine={dropIndex === i && dragIndex !== null && dragIndex !== i}
                onDragStart={() => setDragIndex(i)}
                onDragEnterRow={() => { if (dragIndex !== null) setDropIndex(i); }}
                onDragEndRow={() => {
                  if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
                    moveBlockTo(dragIndex, dropIndex > dragIndex ? dropIndex + 1 : dropIndex);
                  }
                  setDragIndex(null);
                  setDropIndex(null);
                }}
              />
            ))}

            {/* 맨 끝 + 블록 추가 버튼 */}
            <div className="pt-3">
              <button
                onClick={(e) => setPicker({ mode: "insert", after: "end", rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })}
                className="group w-full flex items-center gap-2 py-3 px-3 rounded-xl border border-dashed border-white/[0.10] hover:border-teal-400/40 hover:bg-teal-500/[0.04] text-slate-500 hover:text-teal-300 text-sm font-semibold transition"
              >
                <span className="w-6 h-6 rounded-md bg-white/[0.05] group-hover:bg-teal-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
                블록 추가
                <span className="ml-auto text-[11px] text-slate-600">또는 본문에서 <kbd className="px-1 py-0.5 rounded bg-white/[0.05]">/</kbd> 입력</span>
              </button>
            </div>
          </section>

          <p className="mt-12 text-xs text-slate-600 leading-relaxed">
            팁: 본문에 <kbd className="px-1 py-0.5 rounded bg-white/[0.05] text-slate-400">/</kbd> 를 입력하면 블록 메뉴가 열립니다.
            <code className="text-slate-400 ml-1">**굵게**</code>, <code className="text-slate-400">*기울임*</code>, <code className="text-slate-400">[링크](url)</code> 인라인 마크다운 지원.
            YouTube 주소를 붙여넣으면 썸네일 카드로 자동 변환됩니다.
          </p>
        </div>
      )}

      {/* 블록 추가 메뉴 */}
      {picker && (
        <BlockPicker
          onPick={handlePick}
          onClose={() => setPicker(null)}
          anchorRect={picker.rect}
          variant={picker.rect ? "popover" : "panel"}
        />
      )}

      {/* 유튜브 → 칼럼 변환 모달 */}
      {showYtImport && <YouTubeImport onClose={() => setShowYtImport(false)} />}

      {/* 스레드 → 칼럼 변환 모달 */}
      {showThreadsImport && <ThreadsImport onClose={() => setShowThreadsImport(false)} />}

      {/* 인라인 서식 툴바 (텍스트 드래그 선택 시) */}
      <InlineFormatToolbar />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function AutoBadge({ touched, onReset }: { touched: boolean; onReset: () => void }) {
  if (!touched) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-400/20">
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        자동
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-teal-500/15 hover:text-teal-300 text-slate-400 border border-white/[0.10] hover:border-teal-400/30 transition"
      title="제목·본문에서 다시 자동 추출"
    >
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
      자동으로
    </button>
  );
}

// ─── 자동 태그 추출 ───
const STOP_WORDS = new Set([
  "이", "그", "저", "것", "수", "들", "및", "와", "과", "의", "을", "를", "에", "은", "는", "이", "가", "도", "만", "더", "또", "안", "내", "내가", "우리", "당신", "어떤", "하나", "하지", "있다", "없다", "하다", "되다", "있는", "없는", "하는", "되는", "그런", "이런", "저런", "에서", "으로", "에게", "처럼", "보다", "또는", "그리고", "하지만", "그러나", "왜냐하면", "때문", "정도", "경우", "방법", "사람", "오늘", "지금", "여기",
  "the", "a", "an", "of", "in", "on", "is", "are", "to", "for", "with", "and", "or", "but", "this", "that", "it", "as", "be", "at", "by", "from", "you", "we", "they", "i", "my", "your", "our", "their",
]);

function extractAutoTags(title: string, blocks: PostBlock[]): string[] {
  const all = (title + " " + blocksToPlainText(blocks))
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  if (all.length === 0) return [];
  const count: Record<string, number> = {};
  for (const w of all) count[w] = (count[w] ?? 0) + 1;
  return Object.entries(count)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([w]) => w);
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

// ─── 내용 높이에 맞춰 자동으로 늘어나는 textarea (잘림 방지) ───
function AutoTextarea({
  value,
  className,
  onChange,
  onKeyDown,
  placeholder,
}: {
  value: string;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => { onChange(e); resize(); }}
      onKeyDown={onKeyDown}
      onInput={resize}
      placeholder={placeholder}
      className={className}
      style={{ overflow: "hidden", resize: "none" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
function BlockRow({
  index, block, onUpdate, onReplace, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
  onUpload, onSlash, onAddAfter, onEnterAddBelow, onSplit,
  isDragging, showDropLine, onDragStart, onDragEnterRow, onDragEndRow,
}: {
  index: number;
  block: PostBlock;
  onUpdate: (p: Partial<PostBlock>) => void;
  onReplace: (b: PostBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpload: (f: File) => Promise<{ url: string; kind: "image" | "video" } | null>;
  onSlash: (rect: DOMRect | null) => void;
  onAddAfter: (rect: DOMRect | null) => void;
  onEnterAddBelow: () => void;
  onSplit: (before: string, after: string) => void;
  isDragging: boolean;
  showDropLine: boolean;
  onDragStart: () => void;
  onDragEnterRow: () => void;
  onDragEndRow: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragArmed, setDragArmed] = useState(false);
  void index; void onMoveUp; void onMoveDown; void canMoveDown;

  async function handleUpload(file: File) {
    setUploading(true);
    const r = await onUpload(file);
    setUploading(false);
    if (r) onUpdate({ src: r.url } as Partial<PostBlock>);
  }

  // 단락: '/' 입력 감지 → 슬래시 메뉴, YouTube URL 붙여넣기 감지 → 자동 변환
  function handleParagraphChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    // 빈 단락에서 '/' 한 글자만 입력 → 슬래시 메뉴
    if (val === "/") {
      const rect = e.target.getBoundingClientRect();
      onSlash(rect);
      // '/' 는 본문에 남기지 않음
      onUpdate({ text: "" } as Partial<PostBlock>);
      return;
    }
    // YouTube URL을 통째로 붙여넣은 경우 자동 변환
    const trimmed = val.trim();
    const ytId = extractYouTubeId(trimmed);
    if (ytId && /(youtube\.com|youtu\.be)/.test(trimmed) && trimmed.split(/\s+/).length === 1) {
      onReplace({ type: "youtube", videoId: ytId, caption: "" });
      return;
    }
    onUpdate({ text: val } as Partial<PostBlock>);
  }

  return (
    <div
      className={`group relative rounded-lg transition ${isDragging ? "opacity-40" : "hover:bg-white/[0.015]"}`}
      draggable={dragArmed}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnter={onDragEnterRow}
      onDragEnd={() => { setDragArmed(false); onDragEndRow(); }}
      onDrop={(e) => { e.preventDefault(); setDragArmed(false); onDragEndRow(); }}
    >
      {/* 드롭 위치 표시선 */}
      {showDropLine && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-teal-400 rounded-full z-10 pointer-events-none" />
      )}

      {/* 좌측 호버 핸들: 드래그 / + 추가 / 삭제 */}
      <div className="absolute -left-16 top-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
        {/* 드래그 핸들 (⋮⋮) */}
        <button
          onMouseDown={() => setDragArmed(true)}
          onMouseUp={() => setDragArmed(false)}
          className="w-6 h-6 rounded text-slate-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center cursor-grab active:cursor-grabbing"
          title="드래그해서 이동"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.6"/><circle cx="15" cy="5" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="19" r="1.6"/><circle cx="15" cy="19" r="1.6"/></svg>
        </button>
        <button
          onClick={(e) => onAddAfter((e.currentTarget as HTMLElement).getBoundingClientRect())}
          className="w-6 h-6 rounded text-slate-500 hover:text-teal-300 hover:bg-teal-500/10 flex items-center justify-center"
          title="아래에 블록 추가"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button onClick={onDelete} className="w-6 h-6 rounded text-red-400/60 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center" title="삭제">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" /></svg>
        </button>
      </div>

      {/* ── 블록 타입별 에디터 ── */}
      {block.type === "paragraph" && (
        <AutoTextarea
          value={block.text}
          onChange={handleParagraphChange}
          onKeyDown={(e) => {
            // Shift+Enter: 같은 블록 안에서 줄바꿈 (기본 동작 유지)
            if (e.key === "Enter" && e.shiftKey) return;
            // Enter: 커서 기준으로 단락 분리 → 새 독립 블록
            if (e.key === "Enter") {
              e.preventDefault();
              const ta = e.currentTarget;
              const pos = ta.selectionStart ?? ta.value.length;
              const before = ta.value.slice(0, pos);
              const after = ta.value.slice(pos);
              onSplit(before, after);
              // 새 블록(아래)로 포커스 이동
              requestAnimationFrame(() => {
                const root = ta.closest("section");
                const areas = root?.querySelectorAll<HTMLTextAreaElement>("textarea");
                if (!areas) return;
                const idx = Array.from(areas).indexOf(ta);
                const nextTa = areas[idx + 1];
                if (nextTa) {
                  nextTa.focus();
                  nextTa.setSelectionRange(0, 0);
                }
              });
              return;
            }
            // Backspace: 빈 단락이면 위 블록과 병합되도록 삭제
            if (e.key === "Backspace" && block.text === "" && canMoveUp) {
              e.preventDefault();
              onDelete();
            }
          }}
          placeholder="여기에 글을 작성하세요. Enter로 문단 분리, '/' 입력 시 블록 메뉴…"
          className="w-full bg-transparent text-[17px] leading-[1.85] text-slate-200 placeholder-slate-700 outline-none p-2"
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

      {block.type === "list" && (
        <div className="p-2 space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-slate-500">{block.ordered ? "번호 목록" : "글머리 목록"}</span>
            <button
              onClick={() => onUpdate({ ordered: !block.ordered } as Partial<PostBlock>)}
              className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.10] text-slate-400"
            >
              {block.ordered ? "→ 글머리로" : "→ 번호로"}
            </button>
          </div>
          {block.items.map((it, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className="text-slate-600 text-sm w-5 text-right">{block.ordered ? `${j + 1}.` : "•"}</span>
              <input
                value={it}
                onChange={(e) => {
                  const items = [...block.items];
                  items[j] = e.target.value;
                  onUpdate({ items } as Partial<PostBlock>);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const items = [...block.items];
                    items.splice(j + 1, 0, "");
                    onUpdate({ items } as Partial<PostBlock>);
                  } else if (e.key === "Backspace" && it === "" && block.items.length > 1) {
                    e.preventDefault();
                    const items = block.items.filter((_, k) => k !== j);
                    onUpdate({ items } as Partial<PostBlock>);
                  }
                }}
                placeholder="항목 입력 (Enter로 다음 항목)"
                className="flex-1 bg-transparent text-[16px] text-slate-200 placeholder-slate-700 outline-none py-0.5"
              />
            </div>
          ))}
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
              <FileButton label={uploading ? "업로드 중..." : "이미지 선택"} accept="image/*" disabled={uploading} onPick={handleUpload} />
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
              <FileButton label={uploading ? "업로드 중..." : "영상 선택"} accept="video/*" disabled={uploading} onPick={handleUpload} />
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
        <YouTubeBlockEditor block={block} onUpdate={onUpdate} />
      )}

      {block.type === "quote" && (
        <div className="p-2 border-l-4 border-teal-400/50 pl-4 space-y-1">
          <AutoTextarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="인용문"
            className="w-full bg-transparent italic text-slate-300 placeholder-slate-700 outline-none"
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
          <AutoTextarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="글 박스 내용"
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-700 outline-none"
          />
        </div>
      )}

      {block.type === "button" && (
        <div className="p-2 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="text-[11px] text-slate-500">버튼 (CTA)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={block.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="버튼 텍스트"
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={block.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="링크 URL"
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">정렬:</span>
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => onUpdate({ align: a } as Partial<PostBlock>)}
                className={`text-xs px-2 py-1 rounded ${
                  (block.align ?? "center") === a ? "bg-teal-500/20 text-teal-200" : "bg-white/[0.05] text-slate-400"
                }`}
              >
                {a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
              </button>
            ))}
          </div>
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

      {block.type === "html" && (
        <div className="p-2 space-y-2">
          <div className="text-[11px] text-amber-400/80 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
            HTML 직접 삽입 — iframe·임베드 코드를 붙여넣으세요
          </div>
          <textarea
            value={block.html}
            onChange={(e) => onUpdate({ html: e.target.value })}
            placeholder='<iframe src="..."></iframe>'
            rows={4}
            className="w-full bg-slate-900 border border-white/[0.06] rounded-lg p-3 text-sm text-slate-200 outline-none font-mono"
          />
          {block.html && (
            <div className="rounded-lg border border-white/[0.06] p-3 bg-black/30">
              <div className="text-[10px] text-slate-600 mb-2">미리보기</div>
              <div dangerouslySetInnerHTML={{ __html: block.html }} />
            </div>
          )}
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

// ─── YouTube 블록 에디터 (URL 입력 → videoId 추출 + 제목 자동 fetch + 썸네일 미리보기) ───
function YouTubeBlockEditor({
  block, onUpdate,
}: {
  block: Extract<PostBlock, { type: "youtube" }>;
  onUpdate: (p: Partial<PostBlock>) => void;
}) {
  const [input, setInput] = useState(block.videoId ? `https://youtu.be/${block.videoId}` : "");
  const [fetching, setFetching] = useState(false);

  async function applyUrl(raw: string) {
    const id = extractYouTubeId(raw.trim());
    if (!id) {
      onUpdate({ videoId: "" });
      return;
    }
    onUpdate({ videoId: id });
    // 제목 자동 가져오기
    setFetching(true);
    try {
      const res = await fetch(`/api/posts/youtube-meta?videoId=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) onUpdate({ videoId: id, title: data.title } as Partial<PostBlock>);
      }
    } catch {
      /* ignore */
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="p-2 space-y-2">
      {block.videoId ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-black" style={{ paddingTop: "56.25%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${block.videoId}/hqdefault.jpg`}
            alt={block.title || "YouTube 썸네일"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-2xl">
              <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
          {block.title && (
            <div className="absolute top-2 left-2 right-2 text-white text-sm font-semibold drop-shadow-lg line-clamp-2">
              {block.title}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-slate-500">YouTube URL을 붙여넣으면 썸네일 카드가 만들어집니다</p>
        </div>
      )}
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          applyUrl(e.target.value);
        }}
        placeholder="https://www.youtube.com/watch?v=… 또는 https://youtu.be/…"
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none font-mono focus:border-teal-400/40"
      />
      <input
        value={block.title ?? ""}
        onChange={(e) => onUpdate({ title: e.target.value } as Partial<PostBlock>)}
        placeholder={fetching ? "제목 불러오는 중…" : "영상 제목 (자동으로 채워짐, 수정 가능)"}
        className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-700 outline-none px-1"
      />
      <input
        value={block.caption ?? ""}
        onChange={(e) => onUpdate({ caption: e.target.value })}
        placeholder="캡션 (선택)"
        className="w-full bg-transparent text-sm text-slate-500 placeholder-slate-700 outline-none px-1"
      />
    </div>
  );
}

// ─── 인라인 서식 툴바: textarea에서 텍스트를 선택하면 굵게/기울임/링크 팝업 ───
function InlineFormatToolbar() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const targetRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    function onSelect() {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el.tagName !== "TEXTAREA") { setPos(null); return; }
      const ta = el as HTMLTextAreaElement;
      const start = ta.selectionStart ?? 0;
      const end = ta.selectionEnd ?? 0;
      if (end <= start) { setPos(null); return; }
      targetRef.current = ta;
      const r = ta.getBoundingClientRect();
      // 선택 영역 정확 좌표 계산은 복잡 → textarea 상단 중앙에 표시
      setPos({ top: r.top - 44, left: r.left + r.width / 2 });
    }
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, []);

  function wrap(prefix: string, suffix: string, placeholder = "") {
    const ta = targetRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = ta.value;
    const sel = val.slice(start, end) || placeholder;
    const next = val.slice(0, start) + prefix + sel + suffix + val.slice(end);
    // React 제어 컴포넌트 값 강제 갱신 (네이티브 setter + input 이벤트)
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(ta, next);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    // 선택 유지
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + sel.length);
    });
    setPos(null);
  }

  function addLink() {
    const url = window.prompt("링크 URL을 입력하세요", "https://");
    if (!url) return;
    wrap("[", `](${url})`, "링크");
  }

  if (!pos) return null;

  return (
    <div
      className="fixed z-[120] -translate-x-1/2 flex items-center gap-0.5 px-1 py-1 rounded-lg bg-slate-800 border border-white/[0.12] shadow-xl shadow-black/50"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()} // 선택 유지
    >
      <button onClick={() => wrap("**", "**", "굵게")} className="w-8 h-8 rounded hover:bg-white/[0.10] text-white font-bold text-sm" title="굵게">B</button>
      <button onClick={() => wrap("*", "*", "기울임")} className="w-8 h-8 rounded hover:bg-white/[0.10] text-white italic text-sm" title="기울임">i</button>
      <button onClick={addLink} className="w-8 h-8 rounded hover:bg-white/[0.10] text-white flex items-center justify-center" title="링크">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07l-1.41 1.41M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07l1.41-1.41" /></svg>
      </button>
    </div>
  );
}
