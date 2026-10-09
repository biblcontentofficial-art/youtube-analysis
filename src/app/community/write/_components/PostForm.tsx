"use client";

/**
 * 커뮤니티 글쓰기 · 수정 폼
 * - 신규: POST /api/community/posts → 첨부 업로드 → 상세로 이동
 * - 수정: PATCH /api/community/posts/[id] → (새 첨부 있으면 업로드) → 상세로 이동
 *
 * 첨부는 서명 업로드 URL 방식이다.
 *   1) POST /api/community/upload/sign     → {path, token}
 *   2) storage.uploadToSignedUrl(...)      → 브라우저에서 스토리지로 직접 전송
 *   3) POST /api/community/upload/confirm  → community_attachments 등록
 * 파일 본문이 서버리스 함수를 거치지 않으므로 Vercel 4.5MB 본문 한도에 걸리지 않는다.
 *
 * 글이 만들어진 뒤 업로드가 실패하면 createdPostId 를 들고 있다가
 * 다시 눌렀을 때 글을 또 만들지 않고 남은 첨부만 재시도한다.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { buttonClass, cx } from "@/components/ui/button";
import { INPUT } from "@/components/ui/field";
import { WarningIcon } from "@/components/ui/icons";
import BlockEditor from "./BlockEditor";
import {
  ALLOWED_FILE_EXT,
  MAX_CONTENT_LEN,
  MAX_FILE_BYTES,
  MAX_TITLE_LEN,
  STORAGE_BUCKET,
  fileExtOf,
  formatFileSize,
  groupBoards,
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

/** 라벨 (DESIGN 6.9) */
const LABEL = "block text-body-sm font-medium text-fg-2";
/** 글자 수 */
const COUNT = "tnum text-caption text-fg-3";
/** 뒤로가기 글자 링크 (DESIGN 6.32) */
const TEXT_LINK =
  "inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg";

/** 사용자에게 안내·허용하는 확장자 (svg 는 스크립트를 품을 수 있어 제외) */
const PICKABLE_EXT = ALLOWED_FILE_EXT.filter((e) => e !== "svg");

const DEFAULT_MIME = "application/octet-stream";

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

  // 새 글은 게시판을 정해서 들어오지 않았으면 비워 두고 '게시판을 선택하세요'를 보인다.
  // 수정은 게시판 select 가 잠겨 있으므로, 글의 게시판을 모를 때 예전처럼 첫 게시판으로 둔다.
  const [boardSlug, setBoardSlug] = useState(initialBoardSlug || (isEdit ? (boards[0]?.slug ?? "") : ""));
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isNotice, setIsNotice] = useState(initialIsNotice);
  const [files, setFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPostUrl, setSavedPostUrl] = useState<string | null>(null);
  /** 신규 작성에서 이미 만들어진 글 id (재시도 시 중복 생성 방지) */
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const board = useMemo(() => boards.find((b) => b.slug === boardSlug) ?? null, [boards, boardSlug]);
  const allowFiles = !!board?.allow_files;
  /** 글이 이미 등록된 뒤에는 본문·게시판을 더 고쳐도 반영되지 않으므로 잠근다 */
  const locked = !!createdPostId;

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
      const ext = fileExtOf(f.name);
      if (!PICKABLE_EXT.includes(ext)) {
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

  /**
   * 첨부 순차 업로드 (sign → uploadToSignedUrl → confirm).
   * 성공한 파일은 목록에서 지워 재시도 때 다시 올라가지 않게 하고, 실패 목록을 돌려준다.
   */
  async function uploadAll(targetPostId: string, list: File[]): Promise<string[]> {
    const failed: string[] = [];
    const done: File[] = [];
    const supabase = createSupabaseBrowser();

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const mimeType = f.type || DEFAULT_MIME;
      setProgress(`첨부 업로드 중 (${i + 1}/${list.length}) · ${f.name}`);

      try {
        // 1) 업로드 주소 발급 (권한·확장자·용량은 서버가 검증한다)
        const signRes = await fetch("/api/community/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: targetPostId,
            fileName: f.name,
            fileSize: f.size,
            mimeType,
          }),
        });
        if (!signRes.ok) {
          failed.push(`${f.name} (${await readMessage(signRes, "업로드 준비 실패")})`);
          continue;
        }
        const signed = (await signRes.json()) as { path?: string; token?: string };
        if (!signed?.path || !signed?.token) {
          failed.push(`${f.name} (업로드 주소를 받지 못했습니다)`);
          continue;
        }

        // 2) 브라우저 → 스토리지 직접 업로드
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .uploadToSignedUrl(signed.path, signed.token, f, { contentType: mimeType });
        if (upErr) {
          failed.push(`${f.name} (${upErr.message || "업로드 실패"})`);
          continue;
        }

        // 3) 첨부 레코드 등록
        const confirmRes = await fetch("/api/community/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: targetPostId,
            path: signed.path,
            fileName: f.name,
            fileSize: f.size,
            mimeType,
          }),
        });
        if (!confirmRes.ok) {
          failed.push(`${f.name} (${await readMessage(confirmRes, "첨부 등록 실패")})`);
          continue;
        }

        done.push(f);
      } catch {
        failed.push(`${f.name} (네트워크 오류)`);
      }
    }

    setProgress(null);
    if (done.length > 0) setFiles((prev) => prev.filter((f) => !done.includes(f)));
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
      let targetId = postId ?? createdPostId ?? "";
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
      } else if (!targetId) {
        // 이미 만들어 둔 글이 없을 때만 생성한다 (재시도 시 중복 생성 방지)
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
        setCreatedPostId(data.id);
      }

      const detailUrl = `/community/${targetSlug}/${targetId}`;

      if (allowFiles && files.length > 0) {
        const failed = await uploadAll(targetId, files);
        if (failed.length > 0) {
          setError(
            `글은 저장됐지만 일부 파일 업로드에 실패했습니다: ${failed.join(", ")} · 아래 버튼을 다시 누르면 실패한 파일만 재시도합니다.`
          );
          setSavedPostUrl(detailUrl);
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

  const submitLabel = saving
    ? "저장 중…"
    : isEdit
      ? "수정 완료"
      : locked
        ? "첨부 다시 올리기"
        : "등록";

  return (
    <div>
      <Link href="/community" className={TEXT_LINK}>
        <span aria-hidden="true">←</span>
        커뮤니티
      </Link>
      <h1 className="mt-2 text-title font-extrabold text-fg">{isEdit ? "글 수정" : "글쓰기"}</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* 게시판 */}
        <div>
          <label htmlFor="board" className={LABEL}>
            게시판
          </label>
          <select
            id="board"
            value={boardSlug}
            onChange={(e) => setBoardSlug(e.target.value)}
            disabled={isEdit || locked || saving}
            className={cx(INPUT, "mt-2")}
          >
            {!initialBoardSlug && (
              <option value="" disabled className="bg-surface">
                게시판을 선택하세요
              </option>
            )}
            {groupBoards(boards).map(({ group, boards: groupItems }) => (
              <optgroup key={group} label={group} className="bg-surface">
                {groupItems.map((b) => (
                  <option key={b.id} value={b.slug} className="bg-surface">
                    {b.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {isEdit && (
            <p className="mt-1.5 text-caption text-fg-3">수정할 때는 게시판을 변경할 수 없습니다.</p>
          )}
          {!isEdit && board?.description && (
            <p className="mt-1.5 text-caption text-fg-3">{board.description}</p>
          )}
        </div>

        {/* 제목 */}
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="title" className={LABEL}>
              제목
            </label>
            <span className={COUNT}>
              {title.length}/{MAX_TITLE_LEN}
            </span>
          </div>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LEN))}
            placeholder="제목을 입력하세요"
            disabled={saving || locked}
            className={cx(INPUT, "mt-2")}
          />
        </div>

        {/* 본문 */}
        <div>
          <div className="flex items-baseline justify-between">
            <span id="content-label" className={LABEL}>
              본문
            </span>
            <span className={COUNT}>
              {content.length.toLocaleString()}/{MAX_CONTENT_LEN.toLocaleString()}
            </span>
          </div>
          <div className="mt-2" role="group" aria-labelledby="content-label">
            <BlockEditor
              value={content}
              onChange={(next) => setContent(next.slice(0, MAX_CONTENT_LEN))}
              disabled={saving || locked}
            />
          </div>
        </div>

        {locked && (
          <p className="text-caption text-fg-3">
            글은 이미 등록됐습니다. 제목·본문을 더 고치려면 저장된 글에서 수정해 주세요.
          </p>
        )}

        {/* 공지 (운영진 전용) */}
        {canModerate && (
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2.5 rounded-control border border-line bg-surface px-4 py-2.5 transition-colors hover:border-line-hover">
            <input
              type="checkbox"
              checked={isNotice}
              onChange={(e) => setIsNotice(e.target.checked)}
              disabled={saving || locked}
              className="chk"
            />
            <span className="text-body-sm text-fg-1">공지로 등록 (목록 상단 고정)</span>
          </label>
        )}

        {/* 첨부 */}
        {allowFiles && (
          <div className="rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-sm font-bold text-fg">파일 첨부</p>
                <p className="mt-1 text-caption text-fg-3">
                  문서·이미지·영상·압축 파일 등, 파일당 최대 {formatFileSize(MAX_FILE_BYTES)}
                </p>
                <details className="mt-1 text-caption text-fg-3">
                  <summary className="inline-flex h-9 cursor-pointer items-center underline decoration-fg-4 underline-offset-2 hover:text-fg">
                    올릴 수 있는 형식 보기
                  </summary>
                  <p className="mt-1 wrap-anywhere">{PICKABLE_EXT.join(", ")}</p>
                </details>
                <p className="mt-1 text-caption text-fg-3">
                  사진·영상은 글 아래에 바로 보이고, 그 외 파일은 다운로드 목록으로 붙습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className={buttonClass({ variant: "secondary", size: "sm" })}
              >
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={PICKABLE_EXT.map((e) => `.${e}`).join(",")}
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-4 divide-y divide-line-soft border-t border-line-soft">
                {files.map((f, i) => (
                  <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-body-sm text-fg-1">{f.name}</span>
                    <span className="tnum shrink-0 text-caption text-fg-3">{formatFileSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={saving}
                      className="inline-flex h-9 shrink-0 items-center rounded-control px-2.5 text-caption text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50 pointer-coarse:h-11"
                    >
                      제거
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {isEdit && (
              <p className="mt-3 text-caption text-fg-3">
                여기서 고른 파일은 기존 첨부에 추가됩니다.
              </p>
            )}
          </div>
        )}

        {/* 상태 */}
        {progress && (
          <p role="status" className="text-body-sm text-fg-2">
            {progress}
          </p>
        )}
        {error && (
          <div role="alert" className="flex items-start gap-1.5 text-body-sm text-negative">
            <WarningIcon size={16} className="mt-[3px]" />
            <div className="min-w-0">
              <p className="wrap-anywhere">{error}</p>
              {savedPostUrl && (
                <Link
                  href={savedPostUrl}
                  className="mt-2 inline-flex h-9 items-center font-semibold text-fg underline decoration-fg-4 underline-offset-2 hover:decoration-fg"
                >
                  저장된 글 보기
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 액션: 화면 아래에 붙는 줄. 모바일에서는 카카오 버튼이 이 줄 위로 올라간다(data-bottom-bar) */}
        <div
          data-bottom-bar="md"
          className="sticky bottom-0 z-30 flex items-center gap-2 border-t border-line bg-canvas pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
        >
          <button type="submit" disabled={saving} className={buttonClass()}>
            {submitLabel}
          </button>
          <Link
            href={isEdit && initialBoardSlug ? `/community/${initialBoardSlug}/${postId}` : "/community"}
            className={buttonClass({ variant: "secondary" })}
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
