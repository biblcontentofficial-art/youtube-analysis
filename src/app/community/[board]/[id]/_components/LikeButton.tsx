"use client";

/**
 * 좋아요 버튼 — 낙관적 업데이트 후 서버 응답으로 확정한다.
 */

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export default function LikeButton({ postId, initialLiked, initialCount, isLoggedIn }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname || "/community")}`);
      return;
    }
    if (busy) return;

    const prevLiked = liked;
    const prevCount = count;

    // 낙관적 업데이트
    setLiked(!prevLiked);
    setCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));
    setBusy(true);

    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("like failed");
      const data = (await res.json()) as { liked?: boolean; likeCount?: number };
      if (typeof data.liked === "boolean") setLiked(data.liked);
      if (typeof data.likeCount === "number") setCount(Math.max(0, data.likeCount));
    } catch {
      // 실패 시 롤백
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
        liked
          ? "border-[#00E5A0]/40 bg-white/[0.02] hover:bg-white/[0.05] text-[#00E5A0]"
          : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white"
      }`}
    >
      {liked ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-9.6-9A5.3 5.3 0 0 1 12 6.1 5.3 5.3 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
          <path
            d="M12 21s-7.5-4.6-9.6-9A5.3 5.3 0 0 1 12 6.1 5.3 5.3 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="font-bold tracking-tight">{count.toLocaleString()}</span>
    </button>
  );
}
