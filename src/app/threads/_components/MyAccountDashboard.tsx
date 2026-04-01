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
      const json = await res.json();
      setData(json);
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
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-400 text-sm">데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, daily_views, posts, averages } = data;

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
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
            className={`px-4 py-1.5 text-xs rounded-lg border transition ${
              period === opt.value
                ? "border-teal-500 text-teal-400 bg-teal-500/10"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 프로필 지표 카드 6개 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ProfileMetricCard label="팔로워 수" value={summary.followers_count} />
        <ProfileMetricCard label="조회수" value={summary.views} />
        <ProfileMetricCard label="좋아요 수" value={summary.likes} />
        <ProfileMetricCard label="댓글 수" value={summary.replies} />
        <ProfileMetricCard label="리포스트 수" value={summary.reposts} />
        <ProfileMetricCard label="인용 수" value={summary.quotes} />
      </div>

      {/* 프로필 조회 변화 차트 */}
      <ProfileViewsChart data={daily_views} />

      {/* 평균 통계 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-white mb-4">평균 통계</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{averages.total_posts}</p>
            <p className="text-xs text-gray-500">총 게시물 수</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_views.toLocaleString()}</p>
            <p className="text-xs text-gray-500">평균 조회수</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_likes}</p>
            <p className="text-xs text-gray-500">평균 좋아요</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_replies}</p>
            <p className="text-xs text-gray-500">평균 댓글</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_reposts}</p>
            <p className="text-xs text-gray-500">평균 리포스트</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_quotes}</p>
            <p className="text-xs text-gray-500">평균 인용</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{averages.avg_engagement_rate}%</p>
            <p className="text-xs text-gray-500">평균 참여율</p>
          </div>
        </div>
      </div>

      {/* 게시물 성과 테이블 */}
      <PostPerformanceTable posts={posts} />
    </div>
  );
}
