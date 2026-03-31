import type { ThreadPost, OutlierGrade } from "@/lib/threads";

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
          {/* 계정 */}
          <span className="text-xs text-gray-500">
            @{post.owner.username}
          </span>
          {post.owner.followers_count > 0 && (
            <span className="text-xs text-gray-600">
              {formatCount(post.owner.followers_count)} 팔로워
            </span>
          )}
          <span className="text-xs text-gray-700">·</span>
          <span className="text-xs text-gray-600">{timeAgo(post.timestamp)}</span>
        </div>
      </div>

      {/* 반응 지표 4개 — 좋아요 · 리포스트 · 댓글 · 공유(인용) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* 좋아요 */}
        <div className="text-center min-w-[40px]">
          <div className="text-sm font-bold text-rose-400 tabular-nums">
            {formatCount(post.like_count)}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">좋아요</div>
        </div>
        {/* 리포스트 */}
        <div className="text-center min-w-[40px]">
          <div className="text-sm font-bold text-teal-400 tabular-nums">
            {formatCount(post.repost_count)}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">리포스트</div>
        </div>
        {/* 댓글 */}
        <div className="text-center min-w-[40px]">
          <div className="text-sm font-bold text-blue-400 tabular-nums">
            {formatCount(post.replies_count)}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">댓글</div>
        </div>
        {/* 공유(인용) */}
        <div className="text-center min-w-[40px]">
          <div className="text-sm font-bold text-yellow-400 tabular-nums">
            {formatCount(post.quote_count)}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5">공유</div>
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
          <div className="text-gray-600 text-xs" title="Starter 플랜부터 확인 가능">
            🔒
          </div>
        )}
      </div>
    </a>
  );
}
