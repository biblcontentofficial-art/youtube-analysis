"use client";

/**
 * 댓글 영역 — 목록(대댓글 1단계) · 작성 · 답글 · 삭제
 * 서버에서 내려준 comments 를 그대로 렌더하고, 변경 후에는 router.refresh() 로 다시 받아온다.
 *
 * - 오류는 그 동작을 한 자리(댓글 입력 아래 · 답글 입력 아래)에 negative 기호 + 문장으로, role="alert" 로 알린다.
 * - 답글 입력은 대댓글 목록 아래에 열리고 바로 커서가 놓인다.
 * - 글 작성자가 단 댓글에는 '작성자' 태그를 붙인다.
 * - actions 를 넘기면 등록·삭제 요청을 그 함수가 맡는다(로컬 고정 화면용). 넘기지 않으면 실제 API 를 부른다.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { buttonClass, cx } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { WarningIcon } from "@/components/ui/icons";
import {
  MAX_COMMENT_LEN,
  displayName,
  timeAgo,
  type CommunityComment,
  type MemberGrade,
} from "@/lib/community";
import MemberAvatar from "../../../_components/MemberAvatar";
import { linkify } from "../../../_components/PostContent";

/** 요청 결과: 실패하면 화면에 보일 문장, 성공하면 null */
export interface CommentActions {
  submit: (body: { postId: string; content: string; parentId?: string }) => Promise<string | null>;
  remove: (commentId: string) => Promise<string | null>;
}

interface Props {
  /** 작성자 id → 프로필 사진 */
  avatarMap?: Record<string, string>;
  /** 작성자 id → 회원 등급 */
  gradeMap?: Record<string, MemberGrade>;
  postId: string;
  /** 글 작성자 id ('작성자' 태그) */
  postAuthorId?: string | null;
  comments: CommunityComment[];
  currentUserId: string | null;
  canModerate: boolean;
  isLoggedIn: boolean;
  actions?: CommentActions;
}

const NETWORK_ERROR = "네트워크 오류가 발생했습니다.";

async function readMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  return data?.message ?? fallback;
}

const API_ACTIONS: CommentActions = {
  async submit(body) {
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok ? null : await readMessage(res, "댓글을 등록하지 못했습니다.");
    } catch {
      return NETWORK_ERROR;
    }
  },
  async remove(commentId) {
    try {
      const res = await fetch(`/api/community/comments/${commentId}`, { method: "DELETE" });
      return res.ok ? null : await readMessage(res, "댓글을 삭제하지 못했습니다.");
    } catch {
      return NETWORK_ERROR;
    }
  },
};

/** 답글·삭제 같은 작은 글자 버튼. 누름 영역 36px, 터치 기기 44px */
const META_BTN =
  "inline-flex h-9 items-center rounded-control px-2.5 text-caption font-medium text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50 pointer-coarse:h-11";

const REPLY_BTN = cx(buttonClass({ variant: "secondary", size: "sm" }), "pointer-coarse:h-11");

const TEXTAREA = cx(inputClass({ multiline: true }), "resize-y");

/** 오류 한 줄: negative 기호 + 문장, 스크린 리더가 바로 읽는다 */
function ErrorLine({ message, className }: { message: string; className?: string }) {
  return (
    <p role="alert" className={cx("flex items-start gap-1.5 text-body-sm text-negative", className)}>
      <WarningIcon size={16} className="mt-[3px]" />
      <span>{message}</span>
    </p>
  );
}

export default function CommentSection({
  postId,
  postAuthorId = null,
  comments,
  avatarMap = {},
  gradeMap = {},
  currentUserId,
  canModerate,
  isLoggedIn,
  actions = API_ACTIONS,
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
  /** 오류를 보일 자리: "main" = 댓글 입력 아래, 그 밖에는 답글을 다는 댓글 id */
  const [errorAt, setErrorAt] = useState<string>("main");

  function showError(message: string, at: string) {
    setError(message);
    setErrorAt(at);
  }

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
    const at = parentId ?? "main";
    if (text.length > MAX_COMMENT_LEN) {
      showError(`댓글은 ${MAX_COMMENT_LEN.toLocaleString()}자까지 작성할 수 있습니다.`, at);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const failed = await actions.submit(parentId ? { postId, content: text, parentId } : { postId, content: text });
      if (failed) {
        showError(failed, at);
        return;
      }
      if (parentId) {
        setReplyValue("");
        setReplyTo(null);
      } else {
        setValue("");
      }
      router.refresh();
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
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(commentId);
    setError("");
    try {
      const failed = await actions.remove(commentId);
      if (failed) {
        showError(failed, "main");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function canDelete(c: CommunityComment) {
    if (canModerate) return true;
    return !!currentUserId && c.author_id === currentUserId;
  }

  function renderComment(c: CommunityComment, isReply: boolean) {
    const byPostAuthor = !!postAuthorId && c.author_id === postAuthorId;
    return (
      <div className={isReply ? "" : "py-4"}>
        <div className="flex items-center gap-2">
          <MemberAvatar
            name={c.author_name}
            avatarUrl={c.author_id ? avatarMap[c.author_id] : null}
            grade={c.author_id ? gradeMap[c.author_id] : undefined}
            size={32}
          />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-body-sm font-semibold text-fg-1">{displayName(c.author_name)}</span>
            {byPostAuthor && (
              <span className="inline-flex shrink-0 items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">
                작성자
              </span>
            )}
            <span className="text-caption text-fg-3">{timeAgo(c.created_at)}</span>
          </div>

          <span className="ml-auto flex shrink-0 items-center gap-1">
            {!isReply && isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyValue("");
                  if (errorAt === c.id) setError("");
                }}
                aria-expanded={replyTo === c.id}
                className={META_BTN}
              >
                {replyTo === c.id ? "취소" : "답글"}
              </button>
            )}
            {canDelete(c) && (
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={deletingId === c.id}
                aria-label={`${displayName(c.author_name)} 댓글 삭제`}
                className={META_BTN}
              >
                {deletingId === c.id ? "삭제 중" : "삭제"}
              </button>
            )}
          </span>
        </div>

        <p className="mt-2 whitespace-pre-wrap pl-10 text-body-sm leading-[1.8] text-fg-1 wrap-anywhere">
          {linkify(c.content)}
        </p>
      </div>
    );
  }

  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-body font-bold text-fg">
        댓글 <span className="tnum font-semibold text-fg-3">{comments.length}</span>
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
            aria-label="댓글 내용"
            className={TEXTAREA}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="tnum text-caption text-fg-3">
              {value.length.toLocaleString()} / {MAX_COMMENT_LEN.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => submit(value)}
              disabled={busy || !value.trim()}
              className={buttonClass()}
            >
              {busy ? "등록 중" : "등록"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-line bg-surface px-5 py-6 text-center">
          <p className="text-body-sm text-fg-3">댓글은 로그인 후 작성할 수 있습니다.</p>
          <Link
            href={`/sign-in?next=${encodeURIComponent(pathname || "/community")}`}
            className={cx(buttonClass(), "mt-4")}
          >
            로그인하기
          </Link>
        </div>
      )}

      {error && errorAt === "main" && <ErrorLine message={error} className="mt-3" />}

      {/* 목록 */}
      {roots.length === 0 ? (
        <p className="mt-8 text-body-sm text-fg-3">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line-soft">
          {roots.map((c) => {
            const children = childMap.get(c.id) ?? [];
            return (
              <li key={c.id}>
                {renderComment(c, false)}

                {/* 대댓글 */}
                {children.length > 0 && (
                  <ul className="mb-4 ml-4 space-y-4 border-l border-line pl-5">
                    {children.map((child) => (
                      <li key={child.id}>{renderComment(child, true)}</li>
                    ))}
                  </ul>
                )}

                {/* 답글 입력 (대댓글 목록 아래) */}
                {replyTo === c.id && isLoggedIn && (
                  <div className="mb-4 ml-4 border-l border-line pl-5">
                    <textarea
                      value={replyValue}
                      onChange={(e) => setReplyValue(e.target.value)}
                      rows={3}
                      maxLength={MAX_COMMENT_LEN}
                      placeholder="답글을 남겨보세요."
                      aria-label="답글 내용"
                      autoFocus
                      className={TEXTAREA}
                    />
                    {error && errorAt === c.id && <ErrorLine message={error} className="mt-2" />}
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyValue("");
                          if (errorAt === c.id) setError("");
                        }}
                        disabled={busy}
                        className={REPLY_BTN}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => submit(replyValue, c.id)}
                        disabled={busy || !replyValue.trim()}
                        className={REPLY_BTN}
                      >
                        {busy ? "등록 중" : "답글 등록"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
