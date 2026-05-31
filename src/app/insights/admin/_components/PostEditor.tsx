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
import { extractYouTubeId, slugify, summarize, blocksToPlainText } from "@/lib/posts";
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
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [blocks, setBlocks] = useState<PostBlock[]>(
    Array.isArray(initial?.content) && initial!.content.length > 0
      ? (initial!.content as PostBlock[])
      : [{ type: "paragraph", text: "" }]
  );
  const [status, setStatus] = useState<"draft" | "published">((initial?.status as "draft" | "published") ?? "draft");

  // SEO 메타: 사용자가 직접 수정하기 전까지는 title+본문에서 자동 생성
  // touched=true → 수동 입력값 사용 / false → autoXxx 사용
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

  // ─── 자동 생성 값 ───
  const autoSlug = title ? slugify(title) : "";
  // description: 부제목 우선, 없으면 본문 요약
  const autoDescription = subtitle?.trim() || summarize(blocks, 155);
  const autoTags = extractAutoTags(title, blocks);

  // 실제 사용 값 (저장/표시)
  const effectiveSlug = slugTouched ? slug : autoSlug;
  const effectiveDescription = descTouched ? description : autoDescription;
  const effectiveTagsText = tagsTouched ? tagsText : autoTags.join(", ");

  // touched 안 됐을 때, 입력 필드의 보이는 값도 자동값으로 sync (수동 입력 보존)
  useEffect(() => {
    if (!slugTouched) setSlug(autoSlug);
  }, [autoSlug, slugTouched]);
  useEffect(() => {
    if (!descTouched) setDescription(autoDescription);
  }, [autoDescription, descTouched]);
  const autoTagsJoined = autoTags.join(", ");
  useEffect(() => {
    if (!tagsTouched) setTagsText(autoTagsJoined);
  }, [autoTagsJoined, tagsTouched]);

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
    const tags = effectiveTagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
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

// ─── 자동 태그 추출 (한글/영문 단어 빈도 기반 상위 5개) ───
const STOP_WORDS = new Set([
  // 한글 조사·대명사·일반어
  "이", "그", "저", "것", "수", "들", "및", "와", "과", "의", "을", "를", "에", "은", "는", "이", "가", "도", "만", "더", "또", "안", "내", "내가", "우리", "당신", "어떤", "하나", "하지", "있다", "없다", "하다", "되다", "있는", "없는", "하는", "되는", "그런", "이런", "저런", "에서", "으로", "에게", "처럼", "보다", "또는", "그리고", "하지만", "그러나", "왜냐하면", "때문", "정도", "경우", "방법", "사람", "오늘", "지금", "여기",
  // 영문
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
    .filter(([, c]) => c >= 2) // 최소 2회 등장
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
