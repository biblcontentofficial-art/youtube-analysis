"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/cancel-subscription", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      alert("구독 취소에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 space-y-3">
        <p className="text-red-400 text-sm font-medium">정말 구독을 취소하시겠습니까?</p>
        <p className="text-gray-500 text-xs">취소 즉시 Free 플랜으로 전환됩니다.</p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? "처리 중..." : "취소 확인"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-500 hover:text-red-400 hover:border-red-800 transition text-sm font-medium"
    >
      구독 취소
    </button>
  );
}
