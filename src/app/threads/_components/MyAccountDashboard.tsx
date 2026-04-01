"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileMetricCard from "./ProfileMetricCard";
import ProfileViewsChart from "./ProfileViewsChart";
import PostPerformanceTable from "./PostPerformanceTable";

interface PostInsight {
  id: string;
  text: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  engagement_rate: number;
}

interface InsightsData {
  profile: {
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count: number;
  };
  summary: {
    views: number;
    likes: number;
    replies: number;
    reposts: number;
    quotes: number;
    followers_count: number;
  };
  daily_views: { date: string; value: number }[];
  posts: PostInsight[];
  period_posts_count: number;
  dashboard: {
    streak: number;
    last30: { date: string; count: number }[];
    topPosts: PostInsight[];
    topTopics: { topic: string; engagement: number; type: string }[];
  };
  averages: {
    total_posts: number;
    avg_views: number;
    avg_likes: number;
    avg_replies: number;
    avg_reposts: number;
    avg_quotes: number;
    avg_engagement_rate: number;
  };
}

function fmt(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── 응원/인정 멘트 ──
const CHEERS_HIGH = ["프로 스레더시네요!", "발행 장인이세요!", "압도적이에요!", "독보적 꾸준함!", "대단하세요!"];
const CHEERS_MID = ["꾸준히 잘하고 계세요!", "좋은 페이스예요!", "이 흐름 유지해요!", "잘 성장하고 계세요!", "멋진 루틴이에요!"];
const CHEERS_LOW = ["시작이 반이에요!", "한 걸음씩 가봐요!", "오늘 한 개 써볼까요?", "다시 시작해봐요!", "할 수 있으세요!"];

function getCheer(avg: number): string {
  const list = avg >= 2 ? CHEERS_HIGH : avg >= 0.5 ? CHEERS_MID : CHEERS_LOW;
  return list[Math.floor(Math.random() * list.length)];
}

function StreakCard({ streak, last30 }: { streak: number; last30: { date: string; count: number }[] }) {
  const totalPosts = last30.reduce((s, d) => s + d.count, 0);
  const dailyAvg = Math.round(totalPosts / 30 * 10) / 10;
  const cheer = getCheer(dailyAvg);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        게시 연속 기록
      </h3>
      <div className="flex items-baseline justify-center gap-6 mb-4">
        <div className="text-center">
          <span className="text-4xl font-bold text-white">{streak}</span>
          <span className="text-base text-gray-500 ml-1">일 연속</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-teal-400">{dailyAvg}</span>
          <span className="text-sm text-gray-500 ml-1">개/일</span>
        </div>
      </div>
      <p className="text-center text-sm text-yellow-400 font-medium mb-4">{cheer}</p>
      <div className="flex flex-wrap gap-1">
        {last30.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count}개 게시`}
            className={`w-4 h-4 rounded-sm ${
              d.count >= 3
                ? "bg-teal-400"
                : d.count >= 2
                ? "bg-teal-500"
                : d.count >= 1
                ? "bg-teal-700"
                : "bg-gray-800"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-2">최근 30일</p>
    </div>
  );
}

export default function MyAccountDashboard() {
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/insights?period=${p}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? err.error ?? "데이터를 불러올 수 없습니다");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-400 text-base">데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-base text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, daily_views, posts, averages, dashboard } = data;

  return (
    <div className="space-y-8">
      {/* ─── 기간 선택 ─── */}
      <div className="flex gap-2">
        {[
          { label: "7일", value: 7 },
          { label: "1개월", value: 30 },
          { label: "6개월", value: 180 },
          { label: "1년", value: 365 },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-5 py-2 text-sm rounded-lg border transition ${
              period === opt.value
                ? "border-teal-500 text-teal-400 bg-teal-500/10"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ─── 대시보드 상단 4카드 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. 프로필 개요 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
            프로필 개요
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">팔로워</span>
              <span className="text-xl font-bold text-white">{fmt(summary.followers_count)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">조회수</span>
              <span className="text-xl font-bold text-white">{fmt(summary.views)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">좋아요</span>
              <span className="text-xl font-bold text-white">{fmt(summary.likes)}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-800">
              <div className="text-center">
                <p className="text-base font-bold text-white">{fmt(summary.replies)}</p>
                <p className="text-xs text-gray-600">댓글</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{fmt(summary.reposts)}</p>
                <p className="text-xs text-gray-600">리포스트</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{fmt(summary.quotes)}</p>
                <p className="text-xs text-gray-600">인용</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 게시 연속 기록 */}
        <StreakCard streak={dashboard.streak} last30={dashboard.last30} />

        {/* 3. 인기 콘텐츠 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            인기 콘텐츠
          </h3>
          <div className="space-y-3">
            {dashboard.topPosts.length === 0 && (
              <p className="text-sm text-gray-600">게시물이 없습니다</p>
            )}
            {dashboard.topPosts.map((p) => (
              <a
                key={p.id}
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-800/50 rounded-lg p-2.5 -mx-2 transition"
              >
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                  {p.text.slice(0, 80) || "(미디어 게시물)"}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span>조회 {fmt(p.views)}</span>
                  <span>좋아요 {fmt(p.likes)}</span>
                  <span>댓글 {fmt(p.replies)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 4. 콘텐츠 아이디어 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-4 font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            콘텐츠 아이디어
          </h3>
          {dashboard.topTopics.length === 0 ? (
            <p className="text-sm text-gray-600">아직 데이터가 부족합니다</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 leading-relaxed">
                반응이 좋았던 주제를 기반으로 비슷한 콘텐츠를 만들어보세요:
              </p>
              {dashboard.topTopics.map((t, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-300 line-clamp-2">{t.topic}...</p>
                  <p className="text-xs text-teal-500 mt-1.5">
                    반응 {fmt(t.engagement)} · 비슷한 주제로 작성 추천
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── 프로필 지표 6카드 ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <ProfileMetricCard label="팔로워 수" value={summary.followers_count} />
        <ProfileMetricCard label="조회수" value={summary.views} />
        <ProfileMetricCard label="좋아요 수" value={summary.likes} />
        <ProfileMetricCard label="댓글 수" value={summary.replies} />
        <ProfileMetricCard label="리포스트 수" value={summary.reposts} />
        <ProfileMetricCard label="인용 수" value={summary.quotes} />
      </div>

      {/* ─── 프로필 조회 변화 차트 ─── */}
      <ProfileViewsChart data={daily_views} />

      {/* ─── 평균 통계 ─── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-5">평균 통계</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <p className="text-3xl font-bold text-white">{averages.total_posts}</p>
            <p className="text-sm text-gray-500 mt-1">총 게시물 수</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{fmt(averages.avg_views)}</p>
            <p className="text-sm text-gray-500 mt-1">평균 조회수</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{averages.avg_likes}</p>
            <p className="text-sm text-gray-500 mt-1">평균 좋아요</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{averages.avg_replies}</p>
            <p className="text-sm text-gray-500 mt-1">평균 댓글</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{averages.avg_reposts}</p>
            <p className="text-sm text-gray-500 mt-1">평균 리포스트</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{averages.avg_quotes}</p>
            <p className="text-sm text-gray-500 mt-1">평균 인용</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{averages.avg_engagement_rate}%</p>
            <p className="text-sm text-gray-500 mt-1">평균 참여율</p>
          </div>
        </div>
      </div>

      {/* ─── 게시물 성과 테이블 ─── */}
      <PostPerformanceTable posts={posts} />
    </div>
  );
}
