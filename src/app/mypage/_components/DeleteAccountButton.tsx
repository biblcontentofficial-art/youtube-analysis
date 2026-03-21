"use client";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signOut } = useClerk();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      await signOut({ redirectUrl: "/" });
    } catch {
      alert("계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 space-y-3">
        <p className="text-red-400 text-sm font-medium">계정을 삭제하시겠습니까?</p>
        <p className="text-gray-500 text-xs">모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? "삭제 중..." : "삭제 확인"}
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
      className="w-full py-2 rounded-xl text-gray-600 hover:text-red-500 transition text-xs font-medium"
    >
      계정 삭제
    </button>
  );
}
