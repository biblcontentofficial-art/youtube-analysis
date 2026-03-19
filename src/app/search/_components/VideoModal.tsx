"use client";

import { useEffect, useState } from "react";
import { Video } from "@/types";
import { fetchVideoDetail, fetchVideoComments, fetchChannelDetail } from "../actions"; 

interface Props {
  video: Video;
  onClose: () => void;
}

// [작은 통계 박스 컴포넌트]
function StatBox({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center h-full">
      <div className="text-xs text-gray-400 mb-2 whitespace-nowrap">{label}</div>
      <div className="text-base font-bold text-white whitespace-nowrap">{value}</div>
      {subValue && <div className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{subValue}</div>}
    </div>
  );
}

// [댓글 컴포넌트]
function CommentItem({ comment }: { comment: any }) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 animate-fadeIn">
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-gray-300 text-sm">{comment.author}</span>
        <span className="text-xs text-gray-600">{comment.publishedAt}</span>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed mb-2 break-words" dangerouslySetInnerHTML={{ __html: comment.text }} />
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-500">👍 {comment.likeCount}</div>
        {hasReplies && (
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            {showReplies ? "▲ 답글 접기" : `▼ 답글 ${comment.replyCount}개 보기`}
          </button>
        )}
      </div>
      {showReplies && hasReplies && (
        <div className="mt-3 pl-4 border-l-2 border-gray-800 space-y-3">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="bg-gray-900/50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-400 text-xs">{reply.author}</span>
                <span className="text-[10px] text-gray-600">{reply.publishedAt}</span>
              </div>
              <div className="text-xs text-gray-400 leading-relaxed mb-1 break-words" dangerouslySetInnerHTML={{ __html: reply.text }} />
              <div className="text-[10px] text-gray-500">👍 {reply.likeCount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideoModal({ video, onClose }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [d, c] = await Promise.all([
          fetchVideoDetail(video.videoId),
          fetchVideoComments(video.videoId),
        ]);
        setDetail(d);
        setComments(c);

        if (d && d.channelId) {
          const chData = await fetchChannelDetail(d.channelId);
          setChannelInfo(chData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [video, onClose]);

  const visibleComments = isExpanded ? comments : comments.slice(0, 1);

  // --- 통계 계산 로직 ---
  const avgViews = channelInfo ? Math.round(channelInfo.viewCount / channelInfo.videoCount) : 0;
  const daysSinceJoin = channelInfo ? Math.floor((new Date().getTime() - new Date(channelInfo.publishedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // 조회수 성과 계산 (현재 영상 조회수 vs 채널 평균 조회수)
  let viewPerformance = 0;
  let isBetter = false;
  if (detail && detail.rawViewCount > 0 && avgViews > 0) {
    const diff = detail.rawViewCount - avgViews;
    viewPerformance = (diff / avgViews) * 100;
    isBetter = viewPerformance >= 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950 shrink-0">
          <h2 className="text-lg font-bold text-white truncate pr-4">{video.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          {/* 1. 상단: 영상 정보 */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <img src={video.thumbnail} alt={video.title} className="w-full rounded-xl border border-gray-700 object-cover" />
              <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-center transition flex items-center justify-center gap-2">
                ▶ 유튜브에서 영상 보기
              </a>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              {/* 영상 통계 */}
              <div className="grid grid-cols-3 gap-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="text-center flex flex-col justify-center">
                  <div className="text-xs text-gray-400 mb-1">조회수</div>
                  <div className="font-bold text-white text-lg">{video.viewCountFormatted}</div>
                  
                  {/* [추가] 조회수 성과 비교 (평균 대비) */}
                  {channelInfo && (
                    <div className={`text-[10px] font-bold flex items-center justify-center gap-1 mt-1 ${isBetter ? "text-red-400" : "text-blue-400"}`}>
                      <span>{isBetter ? "↑" : "↓"}</span>
                      <span>{Math.abs(viewPerformance).toFixed(1)}%</span>
                      <span className="text-gray-500 font-normal text-[9px]">(평균대비)</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center border-l border-gray-700 flex flex-col justify-center">
                  <div className="text-xs text-gray-400 mb-1">좋아요</div>
                  <div className="font-bold text-blue-400 text-lg">{detail ? detail.likeCount : "-"}</div>
                </div>
                
                <div className="text-center border-l border-gray-700 flex flex-col justify-center">
                  <div className="text-xs text-gray-400 mb-1">댓글</div>
                  <div className="font-bold text-green-400 text-lg">{detail ? detail.commentCount : "-"}</div>
                </div>
              </div>

              {/* 태그 */}
              {detail?.tags && detail.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detail.tags.slice(0, 5).map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              {/* 설명 */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 h-40 overflow-y-auto text-sm text-gray-400 leading-relaxed whitespace-pre-wrap scrollbar-hide">
                {loading ? "정보를 불러오는 중..." : detail?.description || "설명이 없습니다."}
              </div>
            </div>
          </div>

          <hr className="border-gray-800" />

          {/* 2. 중단: 베스트 댓글 */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">베스트 댓글</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 py-4">댓글 로딩 중...</div>
              ) : comments.length > 0 ? (
                <>
                  {visibleComments.map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                  {comments.length > 1 && (
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {isExpanded ? "접기 ▲" : `댓글 ${comments.length - 1}개 더보기 ▼`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">댓글이 없거나 불러올 수 없습니다.</div>
              )}
            </div>
          </div>

          {/* 3. 하단: 채널 상세 정보 */}
          <div className="bg-gray-950 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src={video.channelThumbnail} alt={video.channelTitle} className="w-16 h-16 rounded-full border-2 border-gray-700" />
                <div>
                  <h3 className="text-xl font-bold text-white">{video.channelTitle}</h3>
                  <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">Youtube Channel</span>
                </div>
              </div>
              <a 
                href={`https://www.youtube.com/channel/${detail?.channelId}`} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-1"
              >
                채널 바로가기 ↗
              </a>
            </div>

            {loading || !channelInfo ? (
              <div className="text-center text-gray-500 py-8">채널 정보 분석 중...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <StatBox label="구독자" value={`${channelInfo.subscriberCount.toLocaleString()}명`} />
                  <StatBox label="총 영상 수" value={`${channelInfo.videoCount.toLocaleString()}개`} />
                  <StatBox label="채널 개설일" value={channelInfo.publishedAt} subValue={`${daysSinceJoin.toLocaleString()}일 경과`} />
                  <StatBox label="누적 조회수" value={(channelInfo.viewCount / 100000000).toFixed(1) + "억"} subValue={channelInfo.viewCount.toLocaleString()} />
                  <StatBox label="평균 조회수" value={avgViews.toLocaleString()} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">채널 정보</h4>
                    <div className="text-sm text-gray-400 bg-gray-900 p-4 rounded-xl border border-gray-800 h-40 overflow-y-auto whitespace-pre-wrap scrollbar-hide leading-relaxed">
                      {channelInfo.description}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">채널 키워드</h4>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-40 overflow-y-auto scrollbar-hide">
                      {channelInfo.keywords && channelInfo.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {channelInfo.keywords.map((k: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-700 transition-colors cursor-default">
                              #{k}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm flex items-center justify-center h-full">설정된 키워드가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}