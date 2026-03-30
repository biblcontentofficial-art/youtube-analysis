"use client";

import { useState, useCallback } from "react";
import type { ThreadPost } from "@/lib/threads";
import ThreadCard from "./ThreadCard";
import ThreadsLimitModal from "./LimitModal";
import HashtagAnalysis from "./HashtagAnalysis";
import PostTimeAnalysis from "./PostTimeAnalysis";

interface Props {
  initialPosts: ThreadPost[];
  initialCursor?: string;
  query: string;
  filter: string;
  canViralScore: boolean;
  canCollect: boolean;
  used: number;
  limit: number;
  isMonthly: boolean;
}

export default function ThreadsResultList({
  initialPosts,
  initialCursor,
  query,
  filter,
  canViralScore,
  canCollect,
  used: initialUsed,
  limit,
  isMonthly,
}: Props) {
  const [posts, setPosts] = useState<ThreadPost[]>(initialPosts);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(!initialCursor);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [used, setUsed] = useState(initialUsed);

  // 수집 관련 상태
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [collecting, setCollecting] = useState(false);
  const [collectToast, setCollectToast] = useState<{ count: number } | null>(null);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === posts.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(posts.map((p) => p.id)));
  };

  const handleCollect = useCallback(async (ids?: Set<string>) => {
    const targetIds = ids ?? checkedIds;
    if (targetIds.size === 0) return;
    setCollecting(true);

    try {
      const targets = posts.filter((p) => targetIds.has(p.id));
      const payload = targets.map((p) => ({
        id: p.id,
        text: p.text,
        media_type: p.media_type,
        permalink: p.permalink,
        username: p.owner.username,
        followers_count: p.owner.followers_count,
        like_count: p.like_count,
        repost_count: p.repost_count,
        replies_count: p.replies_count,
        viral_score: p.viralScore,
        timestamp: p.timestamp,
        query,
      }));

      const res = await fetch("/api/threads/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: payload }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollectToast({ count: data.saved });
        setCheckedIds(new Set());
        setTimeout(() => setCollectToast(null), 4000);
      }
    } finally {
      setCollecting(false);
    }
  }, [checkedIds, posts, query]);

  const loadMore = useCallback(async () => {
    if (loading || exhausted || !cursor) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ q: query, filter, cursor });
      const res = await fetch(`/api/threads/search?${params.toString()}`);
      const data = await res.json();

      if (res.status === 429) {
        setShowLimitModal(true);
        return;
      }

      if (!res.ok) return;

      const newPosts: ThreadPost[] = data.posts ?? [];
      const existingIds = new Set(posts.map((p) => p.id));
      const deduped = newPosts.filter((p) => !existingIds.has(p.id));

      setPosts((prev) => [...prev, ...deduped]);
      setCursor(data.cursor);
      setUsed(data.used ?? used);
      if (!data.cursor || deduped.length === 0) setExhausted(true);
    } finally {
      setLoading(false);
    }
  }, [loading, exhausted, cursor, query, filter, posts, used]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-400 text-sm">검색 결과가 없어요</p>
        <p className="text-gray-600 text-xs mt-1">다른 키워드로 검색해보세요</p>
      </div>
    );
  }

  return (
    <>
      {showLimitModal && (
        <ThreadsLimitModal
          used={used}
          limit={limit}
          isMonthly={isMonthly}
          onClose={() => setShowLimitModal(false)}
        />
      )}

      {/* 수집 토스트 */}
      {collectToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-500 text-white px-4 py-3 rounded-xl shadow-xl text-sm flex items-center gap-3 animate-in slide-in-from-bottom">
          <span>{collectToast.count}개 수집 완료!</span>
          <a href="/threads/saved" className="underline font-medium">보기 →</a>
        </div>
      )}

      {/* 결과 헤더 + 수집 버튼 */}
      <div className="flex items-center justify-between mb-2 px-3">
        <div className="flex items-center gap-3">
          {canCollect && (
            <button
              onClick={toggleAll}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              {checkedIds.size === posts.length ? "전체 해제" : "전체 선택"}
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{posts.length}개 게시물</span>
            {checkedIds.size > 0 && (
              <span className="text-teal-400">{checkedIds.size}개 선택</span>
            )}
            <span>·</span>
            <span>{used}/{limit === 9999 ? "∞" : limit}회 검색 사용</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCollect && checkedIds.size > 0 && (
            <button
              onClick={() => handleCollect()}
              disabled={collecting}
              className="text-xs bg-teal-500 hover:bg-teal-400 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {collecting ? "수집 중..." : `${checkedIds.size}개 수집`}
            </button>
          )}
          {canCollect && (
            <button
              onClick={() => handleCollect(new Set(posts.map((p) => p.id)))}
              disabled={collecting}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              전체 수집
            </button>
          )}
          {!canCollect && (
            <a
              href="/pricing"
              className="text-xs text-gray-600 hover:text-gray-400 transition"
              title="Pro 플랜부터 수집 가능"
            >
              🔒 수집
            </a>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-800/50">
        {posts.map((post, i) => (
          <div key={post.id} className="flex items-start">
            {canCollect && (
              <label className="flex items-center pt-4 pl-2 pr-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedIds.has(post.id)}
                  onChange={() => toggleCheck(post.id)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                />
              </label>
            )}
            <div className="flex-1 min-w-0">
              <ThreadCard
                post={post}
                rank={i + 1}
                canViralScore={canViralScore}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 분석 섹션: 해시태그 + 게시 시간 */}
      {posts.length >= 5 && (
        <div className="mt-6 space-y-4">
          <HashtagAnalysis posts={posts} />
          <PostTimeAnalysis posts={posts} />
        </div>
      )}

      {/* 더보기 / 끝 */}
      <div className="mt-4 flex justify-center">
        {exhausted ? (
          <p className="text-xs text-gray-600">
            모든 결과를 불러왔어요 ({posts.length}개)
          </p>
        ) : (
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "불러오는 중..." : "더보기"}
          </button>
        )}
      </div>
    </>
  );
}
