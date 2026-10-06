"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      alert("계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-xl text-neutral-400 hover:text-red-500 transition text-xs font-medium"
      >
        계정 삭제
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
              <p className="text-white text-sm font-semibold">계정을 삭제하시겠습니까?</p>
              <p className="text-neutral-400 text-xs leading-relaxed">
                모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
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
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? "삭제 중..." : "계정 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
