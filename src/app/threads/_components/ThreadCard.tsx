import type { ThreadPost, OutlierGrade } from "@/lib/threads";

// ── SVG 아이콘 ──────────────────────────────────────────────

function IconHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function IconRepost({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ── 유틸 ────────────────────────────────────────────────────

function outlierBadge(grade: OutlierGrade) {
  if (grade === "good")
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
        GOOD
      </span>
    );
  if (grade === "normal")
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-400 border border-gray-600">
        NORMAL
      </span>
    );
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
      BAD
    </span>
  );
}

function mediaIcon(type: ThreadPost["media_type"]) {
  switch (type) {
    case "IMAGE":
      return (
        <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded">
          이미지
        </span>
      );
    case "VIDEO":
      return (
        <span className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-1.5 py-0.5 rounded">
          영상
        </span>
      );
    case "CAROUSEL_ALBUM":
      return (
        <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded">
          슬라이드
        </span>
      );
    default:
      return (
        <span className="text-[10px] text-gray-400 bg-gray-700 border border-gray-600 px-1.5 py-0.5 rounded">
          텍스트
        </span>
      );
  }
}

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// ── 컴포넌트 ────────────────────────────────────────────────

interface Props {
  post: ThreadPost;
  rank: number;
  canViralScore: boolean;
}

export default function ThreadCard({ post, rank, canViralScore }: Props) {
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition group"
    >
      {/* 순위 */}
      <div className="w-6 shrink-0 text-center text-xs text-gray-600 pt-1 font-mono">
        {rank}
      </div>

      {/* 미디어 타입 */}
      <div className="w-14 shrink-0 pt-0.5">
        {mediaIcon(post.media_type)}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed">
          {post.text || <span className="text-gray-500 italic">내용 없음</span>}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-gray-500">@{post.owner.username}</span>
          {post.owner.followers_count > 0 && (
            <span className="text-xs text-gray-600">
              {formatCount(post.owner.followers_count)} 팔로워
            </span>
          )}
          <span className="text-xs text-gray-700">·</span>
          <span className="text-xs text-gray-600">{timeAgo(post.timestamp)}</span>
        </div>
      </div>

      {/* 반응 지표 4개 — 공유 · 리포스트 · 댓글 · 좋아요 */}
      <div className="flex items-center gap-3 shrink-0">
        {/* 공유(인용) — 1순위 */}
        <div className="flex flex-col items-center min-w-[40px] gap-0.5">
          <IconShare className="w-3.5 h-3.5 text-yellow-400" />
          <div className="text-sm font-bold text-yellow-400 tabular-nums leading-none">
            {formatCount(post.quote_count)}
          </div>
          <div className="text-[10px] text-gray-600">공유</div>
        </div>
        {/* 리포스트 — 2순위 */}
        <div className="flex flex-col items-center min-w-[40px] gap-0.5">
          <IconRepost className="w-3.5 h-3.5 text-teal-400" />
          <div className="text-sm font-bold text-teal-400 tabular-nums leading-none">
            {formatCount(post.repost_count)}
          </div>
          <div className="text-[10px] text-gray-600">리포스트</div>
        </div>
        {/* 댓글 — 3순위 */}
        <div className="flex flex-col items-center min-w-[40px] gap-0.5">
          <IconComment className="w-3.5 h-3.5 text-blue-400" />
          <div className="text-sm font-bold text-blue-400 tabular-nums leading-none">
            {formatCount(post.replies_count)}
          </div>
          <div className="text-[10px] text-gray-600">댓글</div>
        </div>
        {/* 좋아요 — 3순위 */}
        <div className="flex flex-col items-center min-w-[40px] gap-0.5">
          <IconHeart className="w-3.5 h-3.5 text-rose-400" />
          <div className="text-sm font-bold text-rose-400 tabular-nums leading-none">
            {formatCount(post.like_count)}
          </div>
          <div className="text-[10px] text-gray-600">좋아요</div>
        </div>
      </div>

      {/* 바이럴 점수 */}
      <div className="shrink-0 w-12 text-right">
        {canViralScore ? (
          <div>
            <div
              className={`text-sm font-bold tabular-nums ${
                post.viralScore >= 70
                  ? "text-teal-400"
                  : post.viralScore >= 40
                  ? "text-yellow-400"
                  : "text-gray-500"
              }`}
            >
              {post.viralScore}
            </div>
            <div className="text-[10px] text-gray-600">바이럴</div>
          </div>
        ) : (
          <div className="flex justify-end" title="Starter 플랜부터 확인 가능">
            <IconLock className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
    </a>
  );
}
