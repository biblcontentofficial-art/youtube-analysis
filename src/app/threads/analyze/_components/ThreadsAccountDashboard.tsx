"use client";

import { useState, useMemo } from "react";
import type { ThreadPost, ThreadsAccountInsights } from "@/lib/threads";
import { analyzeHashtags } from "@/lib/threads";

// ─────────────────────────────────────────────────────────────
// 타입 & 유틸
// ─────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
  biography?: string;
}

interface Props {
  profile: Profile;
  posts: ThreadPost[];
  insights: ThreadsAccountInsights;
}

function fmtNum(n: number): string {
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

const MEDIA_LABELS: Record<string, string> = {
  TEXT: "텍스트",
  IMAGE: "이미지",
  VIDEO: "영상",
  CAROUSEL_ALBUM: "슬라이드",
};

type SortKey = "engagement" | "likes" | "reposts" | "replies" | "time";

// ─────────────────────────────────────────────────────────────
// 카드 컴포넌트
// ─────────────────────────────────────────────────────────────

function InsightCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 대시보드
// ─────────────────────────────────────────────────────────────

export default function ThreadsAccountDashboard({ profile, posts, insights }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("engagement");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    const dir = sortAsc ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "likes": return (a.like_count - b.like_count) * dir;
        case "reposts": return (a.repost_count - b.repost_count) * dir;
        case "replies": return (a.replies_count - b.replies_count) * dir;
        case "time": return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * dir;
        default: {
          const aEng = a.like_count + a.repost_count + a.replies_count;
          const bEng = b.like_count + b.repost_count + b.replies_count;
          return (aEng - bEng) * dir;
        }
      }
    });
    return arr;
  }, [posts, sortKey, sortAsc]);

  const trendColor =
    insights.engagementTrend === "growing" ? "text-teal-400" :
    insights.engagementTrend === "declining" ? "text-red-400" : "text-gray-400";
  const trendEmoji =
    insights.engagementTrend === "growing" ? "↑" :
    insights.engagementTrend === "declining" ? "↓" : "→";

  // 요일별 히트맵 데이터
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const dayStats = useMemo(() => {
    const map: Record<number, { count: number; engSum: number }> = {};
    for (const p of posts) {
      const day = new Date(p.timestamp).getDay();
      const eng = p.like_count + p.repost_count + p.replies_count;
      if (!map[day]) map[day] = { count: 0, engSum: 0 };
      map[day].count++;
      map[day].engSum += eng;
    }
    const maxAvg = Math.max(...Object.values(map).map((v) => v.engSum / v.count), 1);
    return DAY_NAMES.map((name, i) => {
      const v = map[i] ?? { count: 0, engSum: 0 };
      const avg = v.count > 0 ? v.engSum / v.count : 0;
      return { name, count: v.count, avg: Math.round(avg), intensity: avg / maxAvg };
    });
  }, [posts]);

  // 미디어 타입별 평균 반응
  const mediaStats = useMemo(() => {
    const map: Record<string, { count: number; engSum: number }> = {};
    for (const p of posts) {
      const t = p.media_type;
      if (!map[t]) map[t] = { count: 0, engSum: 0 };
      map[t].count++;
      map[t].engSum += p.like_count + p.repost_count + p.replies_count;
    }
    const maxAvg = Math.max(...Object.values(map).map((v) => v.engSum / v.count), 1);
    return Object.entries(map)
      .map(([type, v]) => ({
        type,
        label: MEDIA_LABELS[type] ?? type,
        count: v.count,
        avgEng: Math.round(v.engSum / v.count),
        ratio: (v.engSum / v.count) / maxAvg,
      }))
      .sort((a, b) => b.avgEng - a.avgEng);
  }, [posts]);

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      {/* ── 프로필 카드 ─────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
        {profile.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt={profile.username}
            className="w-16 h-16 rounded-full border border-gray-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xl text-gray-500">
            @
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white">
            @{profile.username}
            {profile.name && (
              <span className="text-sm text-gray-500 font-normal ml-2">{profile.name}</span>
            )}
          </h2>
          {profile.biography && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{profile.biography}</p>
          )}
        </div>
        <div className="flex gap-6 shrink-0 text-center">
          <div>
            <div className="text-lg font-bold text-white">{fmtNum(profile.followers_count)}</div>
            <div className="text-[10px] text-gray-600">팔로워</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{posts.length}</div>
            <div className="text-[10px] text-gray-600">분석 게시물</div>
          </div>
        </div>
      </div>

      {/* ── 인사이트 카드 4개 ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InsightCard
          label="평균 반응"
          value={fmtNum(insights.avgLikes + insights.avgReposts + insights.avgReplies)}
          sub={`좋아요 ${fmtNum(insights.avgLikes)} · 리포스트 ${fmtNum(insights.avgReposts)} · 댓글 ${fmtNum(insights.avgReplies)}`}
        />
        <InsightCard
          label="게시 빈도"
          value={insights.postFrequencyDays > 0 ? `${insights.postFrequencyDays}일` : "-"}
          sub="게시물 간 평균 간격"
        />
        <InsightCard
          label="최적 게시 시간"
          value={`${insights.bestDayOfWeek} ${insights.bestHour}시`}
          sub="평균 반응이 가장 높은 시점"
        />
        <InsightCard
          label="트렌드"
          value={`${trendEmoji} ${insights.trendPercent > 0 ? "+" : ""}${insights.trendPercent}%`}
          valueColor={trendColor}
          sub={
            insights.engagementTrend === "growing" ? "반응이 증가하는 추세" :
            insights.engagementTrend === "declining" ? "반응이 감소하는 추세" :
            "안정적인 반응 유지 중"
          }
        />
      </div>

      {/* ── 탑 게시물 TOP 10 ─────────────────────── */}
      {(() => {
        const top10 = [...posts]
          .sort((a, b) => (b.like_count + b.repost_count + b.replies_count) - (a.like_count + a.repost_count + a.replies_count))
          .slice(0, 10);
        if (top10.length === 0) return null;
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">반응 TOP {top10.length}</h3>
            <div className="space-y-1">
              {top10.map((p, i) => (
                <a
                  key={p.id}
                  href={p.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition"
                >
                  <span className="text-xs text-gray-600 w-5 text-right font-mono">{i + 1}</span>
                  <p className="text-sm text-gray-300 flex-1 min-w-0 line-clamp-1">
                    {p.text || <span className="text-gray-600 italic">(미디어)</span>}
                  </p>
                  <div className="flex gap-3 text-xs text-gray-500 shrink-0">
                    <span>{fmtNum(p.like_count + p.repost_count + p.replies_count)} 반응</span>
                    <span>{timeAgo(p.timestamp)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 해시태그 분석 ─────────────────────── */}
      {(() => {
        const hashStats = analyzeHashtags(posts);
        if (hashStats.length === 0) return null;
        const maxAvg = Math.max(...hashStats.slice(0, 10).map((s) => s.avgEngagement), 1);
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              자주 사용하는 해시태그 ({hashStats.length}개)
            </h3>
            <div className="space-y-2">
              {hashStats.slice(0, 10).map((s) => (
                <div key={s.tag} className="flex items-center gap-3">
                  <span className={`w-7 text-center text-xs font-bold px-1.5 py-0.5 rounded border ${
                    s.grade === "A" ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                    s.grade === "B" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                    s.grade === "C" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                    "bg-gray-700/50 text-gray-500 border-gray-600"
                  }`}>
                    {s.grade}
                  </span>
                  <span className="text-sm text-gray-300 w-28 truncate">{s.tag}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.max((s.avgEngagement / maxAvg) * 100, 4)}%` }} />
                  </div>
                  <span className="text-xs text-white font-medium w-16 text-right">{fmtNum(s.avgEngagement)}</span>
                  <span className="text-xs text-gray-600 w-8 text-right">{s.count}회</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 요일별 히트맵 + 미디어 분석 (2열) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 요일 히트맵 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">요일별 게시 패턴</h3>
          <div className="grid grid-cols-7 gap-2">
            {dayStats.map((d) => (
              <div
                key={d.name}
                className="text-center rounded-lg p-2 border transition"
                style={{
                  borderColor: `rgba(45, 212, 191, ${d.intensity * 0.5 + 0.1})`,
                  backgroundColor: `rgba(45, 212, 191, ${d.intensity * 0.15})`,
                }}
              >
                <div className="text-xs font-medium text-gray-400">{d.name}</div>
                <div className="text-sm font-bold text-white mt-1">{d.count}</div>
                <div className="text-[10px] text-gray-600">평균 {fmtNum(d.avg)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 미디어 타입 분석 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">미디어 타입별 반응</h3>
          <div className="space-y-3">
            {mediaStats.map((m) => (
              <div key={m.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">
                    {m.label} <span className="text-gray-600">({m.count}개)</span>
                  </span>
                  <span className="text-white font-medium">평균 {fmtNum(m.avgEng)}</span>
                </div>
                <div className="bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.max(m.ratio * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
            {mediaStats.length === 0 && (
              <p className="text-xs text-gray-600">게시물이 없어요</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 최근 게시물 테이블 ─────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400">
            최근 게시물 ({posts.length}개)
          </h3>
        </div>

        {/* 헤더 */}
        <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_80px_80px] px-4 py-2 text-[10px] text-gray-600 border-b border-gray-800/50">
          <span>게시물</span>
          <button onClick={() => toggleSort("engagement")} className="text-right hover:text-gray-400 transition">
            반응합계{sortArrow("engagement")}
          </button>
          <button onClick={() => toggleSort("likes")} className="text-right hover:text-gray-400 transition">
            좋아요{sortArrow("likes")}
          </button>
          <button onClick={() => toggleSort("reposts")} className="text-right hover:text-gray-400 transition">
            리포스트{sortArrow("reposts")}
          </button>
          <button onClick={() => toggleSort("replies")} className="text-right hover:text-gray-400 transition">
            댓글{sortArrow("replies")}
          </button>
          <button onClick={() => toggleSort("time")} className="text-right hover:text-gray-400 transition">
            게시일{sortArrow("time")}
          </button>
        </div>

        {/* 행 */}
        <div className="divide-y divide-gray-800/50">
          {sortedPosts.map((p) => {
            const totalEng = p.like_count + p.repost_count + p.replies_count;
            return (
              <a
                key={p.id}
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_80px_80px] px-4 py-3 hover:bg-gray-800/30 transition items-center gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 line-clamp-1">
                    {p.text || <span className="text-gray-600 italic">(미디어)</span>}
                  </p>
                  <div className="flex gap-2 mt-0.5 md:hidden text-xs text-gray-600">
                    <span>반응 {fmtNum(totalEng)}</span>
                    <span>·</span>
                    <span>{timeAgo(p.timestamp)}</span>
                  </div>
                </div>
                <div className="hidden md:block text-right text-sm text-white font-medium">
                  {fmtNum(totalEng)}
                </div>
                <div className="hidden md:block text-right text-sm text-gray-400">
                  {fmtNum(p.like_count)}
                </div>
                <div className="hidden md:block text-right text-sm text-gray-400">
                  {fmtNum(p.repost_count)}
                </div>
                <div className="hidden md:block text-right text-sm text-gray-400">
                  {fmtNum(p.replies_count)}
                </div>
                <div className="hidden md:block text-right text-xs text-gray-600">
                  {timeAgo(p.timestamp)}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
