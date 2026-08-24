"use client";

/**
 * 커뮤니티 글쓰기 · 수정 폼
 * - 신규: POST /api/community/posts → 첨부 순차 업로드 → 상세로 이동
 * - 수정: PATCH /api/community/posts/[id] → (새 첨부 있으면 업로드) → 상세로 이동
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALLOWED_FILE_EXT,
  MAX_CONTENT_LEN,
  MAX_FILE_BYTES,
  MAX_TITLE_LEN,
  formatFileSize,
  type Board,
} from "@/lib/community";

interface Props {
  boards: Board[];
  canModerate: boolean;
  postId?: string;
  initialBoardSlug: string;
  initialTitle: string;
  initialContent: string;
  initialIsNotice: boolean;
}

const INPUT =
  "w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400";

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

/** 응답에서 message 키를 최대한 안전하게 뽑는다 */
async function readMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function PostForm({
  boards,
  canModerate,
  postId,
  initialBoardSlug,
  initialTitle,
  initialContent,
  initialIsNotice,
}: Props) {
  const router = useRouter();
  const isEdit = !!postId;

  const [boardSlug, setBoardSlug] = useState(initialBoardSlug || boards[0]?.slug || "");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isNotice, setIsNotice] = useState(initialIsNotice);
  const [files, setFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPostUrl, setSavedPostUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const board = useMemo(() => boards.find((b) => b.slug === boardSlug) ?? null, [boards, boardSlug]);
  const allowFiles = !!board?.allow_files;

  // 본문 자동 높이 (최소 높이는 min-h 클래스가 16줄로 잡아 준다)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  // 첨부 불가 게시판으로 바꾸면 선택 파일 초기화
  useEffect(() => {
    if (!allowFiles && files.length > 0) setFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowFiles]);

  function addFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    const next: File[] = [];
    const rejected: string[] = [];

    for (const f of Array.from(picked)) {
      const ext = fileExt(f.name);
      if (!ALLOWED_FILE_EXT.includes(ext)) {
        rejected.push(`${f.name} (허용되지 않는 형식)`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        rejected.push(`${f.name} (${formatFileSize(f.size)} · 최대 ${formatFileSize(MAX_FILE_BYTES)})`);
        continue;
      }
      const dup = files.some((x) => x.name === f.name && x.size === f.size);
      if (dup) continue;
      next.push(f);
    }

    if (next.length > 0) setFiles((prev) => [...prev, ...next]);
    setError(rejected.length > 0 ? `첨부할 수 없는 파일: ${rejected.join(", ")}` : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /** 첨부 순차 업로드. 실패한 파일 이름 배열을 돌려준다 */
  async function uploadAll(targetPostId: string): Promise<string[]> {
    const failed: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress(`첨부 업로드 중 (${i + 1}/${files.length}) · ${f.name}`);
      try {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("postId", targetPostId);
        const res = await fetch("/api/community/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const msg = await readMessage(res, "업로드 실패");
          failed.push(`${f.name} (${msg})`);
        }
      } catch {
        failed.push(`${f.name} (네트워크 오류)`);
      }
    }
    setProgress(null);
    return failed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const t = title.trim();
    const c = content.trim();
    const invalid =
      (!boardSlug && "게시판을 선택해 주세요.") ||
      (!t && "제목을 입력해 주세요.") ||
      (t.length > MAX_TITLE_LEN && `제목은 ${MAX_TITLE_LEN}자까지 입력할 수 있습니다.`) ||
      (!c && "본문을 입력해 주세요.") ||
      (c.length > MAX_CONTENT_LEN && `본문은 ${MAX_CONTENT_LEN}자까지 입력할 수 있습니다.`);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    setError(null);
    setSavedPostUrl(null);

    try {
      let targetId = postId ?? "";
      let targetSlug = boardSlug;

      if (isEdit) {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, content: c, isNotice: canModerate ? isNotice : undefined }),
        });
        if (!res.ok) {
          setError(await readMessage(res, "글 수정에 실패했습니다."));
          setSaving(false);
          return;
        }
        targetSlug = initialBoardSlug || boardSlug;
      } else {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardSlug,
            title: t,
            content: c,
            isNotice: canModerate ? isNotice : undefined,
          }),
        });
        if (!res.ok) {
          setError(await readMessage(res, "글 등록에 실패했습니다."));
          setSaving(false);
          return;
        }
        const data = (await res.json()) as { id?: string };
        if (!data?.id) {
          setError("글은 등록됐지만 응답이 올바르지 않습니다. 목록에서 확인해 주세요.");
          setSaving(false);
          return;
        }
        targetId = data.id;
      }

      const detailUrl = `/community/${targetSlug}/${targetId}`;

      if (allowFiles && files.length > 0) {
        const failed = await uploadAll(targetId);
        if (failed.length > 0) {
          setError(`글은 저장됐지만 일부 파일 업로드에 실패했습니다: ${failed.join(", ")}`);
          setSavedPostUrl(detailUrl);
          setFiles([]);
          setSaving(false);
          return;
        }
      }

      router.push(detailUrl);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setProgress(null);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-screen-lg mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">{isEdit ? "글 수정" : "글쓰기"}</h1>
          <Link href="/community" className="text-sm text-neutral-400 transition hover:text-white">
            커뮤니티
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* 게시판 */}
          <div>
            <label htmlFor="board" className="block text-xs font-semibold text-neutral-400">
              게시판
            </label>
            <select
              id="board"
              value={boardSlug}
              onChange={(e) => setBoardSlug(e.target.value)}
              disabled={isEdit || saving}
              className={`${INPUT} mt-2 disabled:opacity-60`}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.slug} className="bg-neutral-900">
                  {b.group_name} · {b.name}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-2 text-xs text-neutral-500">수정할 때는 게시판을 변경할 수 없습니다.</p>
            )}
            {!isEdit && board?.description && (
              <p className="mt-2 text-xs text-neutral-500">{board.description}</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="title" className="block text-xs font-semibold text-neutral-400">
                제목
              </label>
              <span className="text-xs text-neutral-500">
                {title.length}/{MAX_TITLE_LEN}
              </span>
            </div>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LEN))}
              placeholder="제목을 입력하세요"
              disabled={saving}
              className={`${INPUT} mt-2`}
            />
          </div>

          {/* 본문 */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="content" className="block text-xs font-semibold text-neutral-400">
                본문
              </label>
              <span className="text-xs text-neutral-500">
                {content.length.toLocaleString()}/{MAX_CONTENT_LEN.toLocaleString()}
              </span>
            </div>
            <textarea
              id="content"
              ref={textareaRef}
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LEN))}
              placeholder="내용을 입력하세요"
              disabled={saving}
              className={`${INPUT} mt-2 min-h-[472px] resize-none overflow-hidden leading-7`}
            />
          </div>

          {/* 공지 (운영진 전용) */}
          {canModerate && (
            <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 accent-[#00E5A0]"
              />
              <span className="text-sm text-neutral-200">공지로 등록 (목록 상단 고정)</span>
            </label>
          )}

          {/* 첨부 */}
          {allowFiles && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">파일 첨부</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    파일당 최대 {formatFileSize(MAX_FILE_BYTES)} · {ALLOWED_FILE_EXT.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white transition hover:bg-neutral-700 disabled:opacity-50"
                >
                  파일 선택
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_EXT.map((e) => `.${e}`).join(",")}
                  onChange={(e) => addFiles(e.target.files)}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <ul className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{f.name}</span>
                      <span className="shrink-0 text-xs text-neutral-500">{formatFileSize(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        disabled={saving}
                        className="shrink-0 text-xs text-neutral-400 transition hover:text-white disabled:opacity-50"
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isEdit && (
                <p className="mt-3 text-xs text-neutral-500">
                  여기서 고른 파일은 기존 첨부에 추가됩니다.
                </p>
              )}
            </div>
          )}

          {/* 상태 */}
          {progress && <p className="text-sm text-neutral-400">{progress}</p>}
          {error && (
            <div className="text-sm text-red-400">
              <p>{error}</p>
              {savedPostUrl && (
                <Link href={savedPostUrl} className="mt-2 inline-block text-[#00E5A0] hover:text-[#66FFCC]">
                  저장된 글 보기
                </Link>
              )}
            </div>
          )}

          {/* 액션 */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {saving ? "저장 중…" : isEdit ? "수정 완료" : "등록"}
            </button>
            <Link
              href={isEdit && initialBoardSlug ? `/community/${initialBoardSlug}/${postId}` : "/community"}
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-sm text-white transition hover:bg-neutral-700"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
