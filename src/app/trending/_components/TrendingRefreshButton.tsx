"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  categoryId: string;
  videoType: string;
}

interface Usage {
  ok: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
}

export default function TrendingRefreshButton({ categoryId, videoType }: Props) {
  const router = useRouter();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/trending-usage")
      .then(r => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);

    try {
      const res = await fetch(`/api/trending-refresh?${params}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message ?? "새로고침 실패", type: "error" });
        setLoading(false);
        return;
      }

      // 사용량 업데이트
      setUsage(prev => prev ? {
        ...prev,
        used: data.used,
        ok: data.limit === null || data.used < data.limit,
      } : null);

      setMessage({ text: "최신 데이터로 업데이트됐습니다", type: "success" });

      // 페이지 새로 로드 (서버 측 캐시가 삭제됐으므로 새 데이터 반영)
      setTimeout(() => {
        router.refresh();
        setLoading(false);
        setMessage(null);
      }, 600);
    } catch {
      setMessage({ text: "오류가 발생했습니다. 다시 시도해주세요.", type: "error" });
      setLoading(false);
    }
  };

  if (!usage) return null;

  const remaining = usage.unlimited ? null : (usage.limit ?? 0) - usage.used;
  const canRefresh = usage.unlimited || (remaining !== null && remaining > 0);

  return (
    <div className="flex items-center gap-2">
      {/* 사용량 배지 */}
      {!usage.unlimited && usage.limit !== null && usage.limit > 0 && (
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
          canRefresh
            ? "text-gray-400 border-gray-700 bg-gray-900"
            : "text-red-400 border-red-900 bg-red-950/40"
        }`}>
          새로고침 {usage.limit - usage.used}/{usage.limit}회 남음
        </span>
      )}
      {usage.unlimited && (
        <span className="text-[11px] px-2 py-0.5 rounded-full border text-teal-400 border-teal-900 bg-teal-950/40">
          ✨ 무제한 새로고침
        </span>
      )}

      {/* 새로고침 버튼 */}
      <button
        onClick={handleRefresh}
        disabled={!canRefresh || loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          canRefresh && !loading
            ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200 hover:text-white cursor-pointer"
            : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
        }`}
        title={canRefresh ? "캐시를 무시하고 최신 데이터 가져오기" : "오늘 새로고침 횟수를 모두 사용했습니다"}
      >
        <span className={loading ? "animate-spin" : ""}>🔄</span>
        <span>{loading ? "갱신 중..." : "지금 새로 불러오기"}</span>
      </button>

      {/* 결과 메시지 */}
      {message && (
        <span className={`text-[11px] ${message.type === "success" ? "text-teal-400" : "text-red-400"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
