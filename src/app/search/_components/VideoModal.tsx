"use client";

import { useEffect, useState } from "react";
import { Video } from "@/types";
import { fetchVideoDetail, fetchVideoComments, fetchChannelDetail } from "../actions";

interface Props {
  video: Video;
  onClose: () => void;
}

// XSS 방지: HTML 태그 제거 후 텍스트만 반환 (줄바꿈 보존)
function sanitizeComment(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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
      <p className="text-sm text-gray-400 leading-relaxed mb-2 break-words whitespace-pre-wrap">{sanitizeComment(comment.text)}</p>
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
              <p className="text-xs text-gray-400 leading-relaxed mb-1 break-words whitespace-pre-wrap">{sanitizeComment(reply.text)}</p>
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
  const [fetchError, setFetchError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ─── 사용자 자가 계산기 (클라이언트 측만, 사용자 명시 클릭 시에만 실행) ───
  const [calcResult, setCalcResult] = useState<null | { ratio: number; videoViews: number; avgViews: number; pct: number }>(null);

  // ─── AI 분석 (사용자 명시 클릭 시 외부 LLM API 호출 또는 ChatGPT 새 탭) ───
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setFetchError(false);
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
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // 모달 열릴 때 body 스크롤 잠금 (모바일 iOS 포함)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, onClose]);

  const visibleComments = isExpanded ? comments : comments.slice(0, 1);

  // --- YouTube가 직접 제공하는 데이터(평균 조회수는 채널 총 조회수 ÷ 영상 수, 단순 산술) ---
  // 평균 조회수는 채널 통계로 표시만 하고, 영상 단일 비교는 사용자가 버튼 눌러야만 계산
  const avgViews = channelInfo && channelInfo.videoCount > 0
    ? Math.round(channelInfo.viewCount / channelInfo.videoCount)
    : 0;
  const daysSinceJoin = channelInfo ? Math.floor((new Date().getTime() - new Date(channelInfo.publishedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // ─── 사용자 자가 계산 핸들러 (클릭 시에만 실행) ───
  // YouTube ToS III.E.4h: 우리가 "제공(offer)"하는 게 아니라 사용자가 직접 계산 도구를 사용
  function handleSelfCalculate() {
    if (!detail || !detail.rawViewCount || !avgViews) return;
    const videoViews = detail.rawViewCount;
    const ratio = videoViews / avgViews;
    const pct = ((videoViews - avgViews) / avgViews) * 100;
    setCalcResult({ ratio, videoViews, avgViews, pct });
  }

  // ─── AI 분석 핸들러 (사용자 클릭 시 외부 LLM 호출) ───
  async function handleAiAnalyze() {
    if (!detail || !channelInfo) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: video.title,
          videoViews: detail.rawViewCount ?? 0,
          videoDescription: (detail.description || "").slice(0, 1000),
          channelTitle: video.channelTitle,
          channelSubscribers: channelInfo.subscriberCount,
          channelAvgViews: avgViews,
          channelTotalVideos: channelInfo.videoCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.message || "AI 분석에 실패했습니다.");
        return;
      }
      setAiResult(data.text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI 분석 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  // ─── ChatGPT/Claude 새 탭으로 열기 (AI API 키 없을 때 백업) ───
  function handleOpenChatGPT() {
    if (!detail || !channelInfo) return;
    const prompt = `다음 유튜브 영상이 잘 된 이유를 분석해줘:\n\n` +
      `[영상] ${video.title}\n` +
      `조회수: ${(detail.rawViewCount ?? 0).toLocaleString()}회\n\n` +
      `[채널] ${video.channelTitle}\n` +
      `구독자: ${channelInfo.subscriberCount.toLocaleString()}명\n` +
      `총 영상 수: ${channelInfo.videoCount}개\n` +
      `채널 평균 조회수: ${avgViews.toLocaleString()}회\n\n` +
      `이 영상이 잘 된 이유, 제목/썸네일 패턴, 벤치마킹 포인트를 3~5줄로 알려줘.`;
    const url = `https://chat.openai.com/?prompt=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

          {/* 에러 상태 */}
          {fetchError && !loading && (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-center text-sm">
              <p className="text-red-400 mb-2">정보를 불러오지 못했습니다.</p>
              <button
                onClick={fetchData}
                className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 1. 상단: 영상 정보 */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              <img src={video.thumbnail} alt={video.title} className="w-full rounded-xl border border-gray-700 object-cover" />
              <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-center transition flex items-center justify-center gap-2">
                ▶ 유튜브에서 영상 보기
              </a>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              {/* 영상 통계 (YouTube 공식 데이터만) */}
              <div className="grid grid-cols-3 gap-2 bg-gray-800/50 p-3 sm:p-4 rounded-xl border border-gray-700">
                <div className="text-center flex flex-col justify-center">
                  <div className="text-xs text-gray-400 mb-1">조회수</div>
                  <div className="font-bold text-white text-lg">{video.viewCountFormatted}</div>
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
                <img src={video.channelThumbnail} alt={video.channelTitle} className="w-16 h-16 rounded-full border-2 border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
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

          {/* 4. 사용자 도구 — 본인이 명시적으로 클릭해야 작동 */}
          {channelInfo && detail && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">🛠️ 사용자 도구</h3>
              <p className="text-xs text-gray-600 mb-4">
                아래 도구는 사용자가 직접 실행할 때만 동작합니다. 표시되는 결과는 YouTube 공식 메트릭이 아닌, 사용자가 자가 계산하거나 외부 AI가 생성한 참고용 정보입니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* 자가 계산기 버튼 */}
                <button
                  onClick={handleSelfCalculate}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-700/60 hover:border-teal-500 text-teal-300 hover:text-teal-200 font-medium text-sm rounded-xl transition"
                >
                  📊 채널 평균 대비 비율 계산하기
                </button>

                {/* AI 분석 버튼 */}
                <button
                  onClick={handleAiAnalyze}
                  disabled={aiLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 border border-purple-700/60 hover:border-purple-500 text-purple-300 hover:text-purple-200 font-medium text-sm rounded-xl transition"
                >
                  {aiLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                      AI가 분석 중...
                    </>
                  ) : (
                    <>🤖 AI에게 이 영상이 잘 된 이유 묻기</>
                  )}
                </button>
              </div>

              {/* 자가 계산 결과 표시 (사용자 클릭 후에만 나타남) */}
              {calcResult && (
                <div className="mb-3 p-4 bg-teal-950/40 border border-teal-800/60 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-teal-300">📊 사용자 자가 계산 결과</h4>
                    <button onClick={() => setCalcResult(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-3">
                    ※ 이 수치는 사용자가 직접 도구를 실행하여 클라이언트(브라우저)에서 단순 산술로 계산한 값입니다.
                    YouTube의 공식 메트릭이 아니며, bibl lab이 제공하는 평가 지표가 아닙니다.
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">이 영상 조회수</div>
                      <div className="font-bold text-white">{calcResult.videoViews.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">채널 평균 조회수</div>
                      <div className="font-bold text-white">{calcResult.avgViews.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-1">사용자 계산값</div>
                      <div className="font-bold text-teal-300">
                        {calcResult.ratio.toFixed(2)}x
                        <span className={`block text-[10px] mt-0.5 ${calcResult.pct >= 0 ? "text-red-400" : "text-blue-400"}`}>
                          {calcResult.pct >= 0 ? "+" : ""}{calcResult.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI 분석 결과 표시 */}
              {aiResult && (
                <div className="mb-3 p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-purple-300">🤖 AI 분석 결과</h4>
                    <button onClick={() => setAiResult(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-3">
                    ※ 외부 AI 서비스(OpenAI/Anthropic)가 생성한 텍스트입니다. bibl lab이 제공하는 메트릭이나 평가가 아니며, YouTube의 공식 정보도 아닙니다.
                  </p>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {aiResult}
                  </div>
                </div>
              )}

              {/* AI 에러 시 ChatGPT 새 탭 백업 */}
              {aiError && (
                <div className="mb-3 p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-amber-300">⚠️ AI 분석을 사용할 수 없습니다</h4>
                    <button onClick={() => setAiError(null)} className="text-xs text-gray-500 hover:text-gray-300">닫기 ✕</button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{aiError}</p>
                  <button
                    onClick={handleOpenChatGPT}
                    className="px-3 py-2 bg-amber-700/40 hover:bg-amber-700/60 text-amber-200 text-xs font-medium rounded-lg border border-amber-700/60"
                  >
                    🔗 ChatGPT에서 분석 요청 (새 탭)
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}