"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeUntil, setActiveUntil] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/cancel-subscription", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setOpen(false);
      if (data.activeUntil) {
        setActiveUntil(data.activeUntil);
      } else {
        router.refresh();
      }
    } catch {
      alert("구독 취소에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (activeUntil) {
    const until = new Date(activeUntil).toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric",
    });
    return (
      <div className="text-center text-xs text-gray-500 bg-gray-800/50 rounded-xl px-4 py-3">
        구독이 취소되었습니다.<br />
        <span className="text-gray-400">{until}</span>까지 서비스를 계속 이용할 수 있습니다.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-xl text-gray-600 hover:text-red-500 transition text-xs font-medium"
      >
        구독 취소
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-[#161b27] border border-gray-800 rounded-2xl p-6 w-80 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <p className="text-white text-sm font-semibold">구독을 취소하시겠습니까?</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                취소해도 현재 결제 기간 종료까지 서비스를 계속 이용할 수 있습니다.
                다음 결제일에 자동 갱신이 중단됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? "처리 중..." : "구독 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
