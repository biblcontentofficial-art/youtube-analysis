"use client";

/**
 * 글 수정·삭제 액션 (작성자 본인 또는 운영진에게만 렌더된다)
 * 노출 여부는 서버(page.tsx)에서 canManagePost 로 판정한다.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/app/_components/ConfirmDialog";

interface Props {
  postId: string;
  boardSlug: string;
}

export default function PostActions({ postId, boardSlug }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (busy) return;
    const ok = await confirm({
      message: "이 글을 삭제할까요?",
      subMessage: "삭제한 글은 목록에서 사라지며 되돌릴 수 없습니다.",
      confirmText: "삭제",
    });
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "삭제하지 못했습니다.");
        setBusy(false);
        return;
      }
      router.push(`/community/${boardSlug}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1.5">
        <Link
          href={`/community/write?id=${postId}`}
          className="text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl px-3 py-1.5 transition-colors"
        >
          수정
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "삭제 중" : "삭제"}
        </button>
      </span>
      {error && <span className="text-[11px] text-neutral-400">{error}</span>}
    </span>
  );
}
