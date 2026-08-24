"use client";

/**
 * 댓글 영역 — 목록(대댓글 1단계) · 작성 · 답글 · 삭제
 * 서버에서 내려준 comments 를 그대로 렌더하고, 변경 후에는 router.refresh() 로 다시 받아온다.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { MAX_COMMENT_LEN, displayName, timeAgo, type CommunityComment } from "@/lib/community";

interface Props {
  postId: string;
  comments: CommunityComment[];
  currentUserId: string | null;
  canModerate: boolean;
  isLoggedIn: boolean;
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  canModerate,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();

  const [value, setValue] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // 부모 없는(또는 부모가 사라진) 댓글을 루트로, 나머지는 부모 아래 1단계로 묶는다
  const { roots, childMap } = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id));
    const rootList: CommunityComment[] = [];
    const map = new Map<string, CommunityComment[]>();

    for (const c of comments) {
      if (c.parent_id && ids.has(c.parent_id)) {
        const list = map.get(c.parent_id) ?? [];
        list.push(c);
        map.set(c.parent_id, list);
      } else {
        rootList.push(c);
      }
    }
    return { roots: rootList, childMap: map };
  }, [comments]);

  async function submit(content: string, parentId?: string) {
    const text = content.trim();
    if (!text || busy) return;
    if (text.length > MAX_COMMENT_LEN) {
      setError(`댓글은 ${MAX_COMMENT_LEN.toLocaleString()}자까지 작성할 수 있습니다.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentId ? { postId, content: text, parentId } : { postId, content: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "댓글을 등록하지 못했습니다.");
        return;
      }
      if (parentId) {
        setReplyValue("");
        setReplyTo(null);
      } else {
        setValue("");
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    if (deletingId) return;
    const ok = await confirm({
      message: "이 댓글을 삭제할까요?",
      subMessage: "삭제한 댓글은 되돌릴 수 없습니다.",
      confirmText: "삭제",
    });
    if (!ok) return;

    setDeletingId(commentId);
    setError("");
    try {
      const res = await fetch(`/api/community/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "댓글을 삭제하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  function canDelete(c: CommunityComment) {
    if (canModerate) return true;
    return !!currentUserId && c.author_id === currentUserId;
  }

  function renderComment(c: CommunityComment, isReply: boolean) {
    return (
      <div className={isReply ? "" : "py-4"}>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-300 font-bold tracking-tight">
            {displayName(c.author_name)}
          </span>
          <span className="text-neutral-500">{timeAgo(c.created_at)}</span>

          <span className="ml-auto flex items-center gap-2">
            {!isReply && isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyValue("");
                }}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                {replyTo === c.id ? "취소" : "답글"}
              </button>
            )}
            {canDelete(c) && (
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={deletingId === c.id}
                className="text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {deletingId === c.id ? "삭제 중" : "삭제"}
              </button>
            )}
          </span>
        </div>

        <p className="mt-2 text-sm text-neutral-200 leading-[1.8] whitespace-pre-wrap break-words">
          {c.content}
        </p>
      </div>
    );
  }

  return (
    <section className="border-t border-white/[0.06] pt-8">
      <h2 className="text-white font-bold tracking-tight text-base">
        댓글 <span className="text-[#00E5A0]">{comments.length}</span>
      </h2>

      {/* 작성 폼 */}
      {isLoggedIn ? (
        <div className="mt-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            maxLength={MAX_COMMENT_LEN}
            placeholder="댓글을 남겨보세요."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 resize-y"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              {value.length.toLocaleString()} / {MAX_COMMENT_LEN.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => submit(value)}
              disabled={busy || !value.trim()}
              className="bg-white hover:bg-neutral-200 text-black font-bold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "등록 중" : "등록"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-6 text-center">
          <p className="text-sm text-neutral-400">댓글은 로그인 후 작성할 수 있습니다.</p>
          <Link
            href={`/sign-in?next=${encodeURIComponent(pathname || "/community")}`}
            className="mt-4 inline-block bg-white hover:bg-neutral-200 text-black font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            로그인하기
          </Link>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-neutral-400">{error}</p>}

      {/* 목록 */}
      {roots.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="mt-6 divide-y divide-white/[0.06]">
          {roots.map((c) => {
            const children = childMap.get(c.id) ?? [];
            return (
              <li key={c.id}>
                {renderComment(c, false)}

                {/* 답글 입력 */}
                {replyTo === c.id && isLoggedIn && (
                  <div className="mb-4 pl-6 border-l border-white/[0.06]">
                    <textarea
                      value={replyValue}
                      onChange={(e) => setReplyValue(e.target.value)}
                      rows={3}
                      maxLength={MAX_COMMENT_LEN}
                      placeholder="답글을 남겨보세요."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 resize-y"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyValue("");
                        }}
                        disabled={busy}
                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-xl px-4 py-2 text-xs transition-colors disabled:opacity-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => submit(replyValue, c.id)}
                        disabled={busy || !replyValue.trim()}
                        className="bg-white hover:bg-neutral-200 text-black font-bold rounded-xl px-4 py-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {busy ? "등록 중" : "답글 등록"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 대댓글 */}
                {children.length > 0 && (
                  <ul className="pb-4 pl-6 border-l border-white/[0.06] space-y-4">
                    {children.map((child) => (
                      <li key={child.id}>{renderComment(child, true)}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
