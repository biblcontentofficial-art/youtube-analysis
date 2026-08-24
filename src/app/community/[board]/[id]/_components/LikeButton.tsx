"use client";

/**
 * 좋아요 버튼 — 낙관적 업데이트 후 서버 응답으로 확정한다.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
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

export default function LikeButton({ postId, initialLiked, initialCount, isLoggedIn }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needSignIn, setNeedSignIn] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextUrl = pathname || "/community";

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  function clearError() {
    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
      errorTimer.current = null;
    }
    setError(null);
    setNeedSignIn(false);
  }

  /** 3초 뒤 자동으로 사라지는 안내 */
  function showError(message: string, signIn: boolean) {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setError(message);
    setNeedSignIn(signIn);
    errorTimer.current = setTimeout(() => {
      setError(null);
      setNeedSignIn(false);
      errorTimer.current = null;
    }, 3000);
  }

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    if (busy) return;

    // 다음 클릭 시 이전 안내는 초기화
    clearError();

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
      if (!res.ok) {
        // 실패 시 롤백 + 사유 안내
        setLiked(prevLiked);
        setCount(prevCount);
        const msg = await readMessage(res, "좋아요 처리에 실패했습니다.");
        showError(msg, res.status === 401);
        return;
      }
      const data = (await res.json()) as { liked?: boolean; likeCount?: number };
      if (typeof data.liked === "boolean") setLiked(data.liked);
      if (typeof data.likeCount === "number") setCount(Math.max(0, data.likeCount));
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
      showError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
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

      {error && (
        <p role="status" className="text-center text-xs text-red-400">
          {error}
          {needSignIn && (
            <>
              {" "}
              <Link
                href={`/sign-in?next=${encodeURIComponent(nextUrl)}`}
                className="underline underline-offset-2 hover:text-red-300"
              >
                로그인하러 가기
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
