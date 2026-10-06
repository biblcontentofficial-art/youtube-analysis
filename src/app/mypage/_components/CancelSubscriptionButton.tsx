"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * cancelled: 이미 해지된 구독이면 버튼을 그리지 않는다.
 * 이 화면에서 취소한 직후에는 router.refresh() 로 다시 그려져도 이 컴포넌트가 같은 자리에 남아 취소 안내가 유지된다.
 */
export default function CancelSubscriptionButton({ cancelled = false }: { cancelled?: boolean }) {
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
      }
      // 위 결제일 카드도 '해지됨'으로 바뀌도록 서버 화면을 다시 그린다(호출 API 는 그대로)
      router.refresh();
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
      <div className="text-center text-xs text-neutral-400 bg-neutral-800/50 rounded-xl px-4 py-3 break-keep">
        구독이 취소되었습니다.<br />
        <span className="text-neutral-200">{until}</span>까지 서비스를 계속 이용할 수 있습니다.
      </div>
    );
  }

  if (cancelled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-xl text-neutral-400 hover:text-red-500 transition text-xs font-medium"
      >
        구독 취소
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-80 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <p className="text-white text-sm font-semibold">구독을 취소하시겠습니까?</p>
              <p className="text-neutral-400 text-xs leading-relaxed">
                취소해도 현재 결제 기간 종료까지 서비스를 계속 이용할 수 있습니다.
                다음 결제일에 자동 갱신이 중단됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition disabled:opacity-50"
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
