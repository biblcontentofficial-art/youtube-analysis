"use client";

/**
 * 스레드(Threads) 글 붙여넣기 → AI 칼럼 변환 → draft 생성 모달
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POST_CATEGORIES, type PostCategory } from "@/lib/posts";

export default function ThreadsImport({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory>("비즈니스");
  const [provider, setProvider] = useState<"anthropic" | "openai" | "gemini">("anthropic");
  const [mode, setMode] = useState<"expand" | "preserve">("expand");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.trim().length;

  async function run() {
    setError(null);
    if (charCount < 30) {
      setError("스레드 글을 붙여넣어 주세요. (최소 30자)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posts/from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLabel: "스레드(Threads)에 올린 글",
          category,
          provider,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "변환에 실패했습니다.");
        return;
      }
      router.push(`/insights/admin/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-white/[0.10] rounded-2xl shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-white" viewBox="0 0 192 192" fill="currentColor"><path d="M141.5 88.4c-.7-.3-1.4-.7-2.1-1-1.2-22.8-13.7-35.9-34.7-36-9.5 0-17.4 4-23.1 11.7l11.4 7.8c4-5.4 8.5-6.5 11.7-6.5 4.2 0 8.3 1.6 10.4 4.4 1.6 2 2.6 4.7 3.1 8.2-6-1-12.4-1.3-19.3-.9-19.4 1.1-31.9 12.4-31.1 28.1.4 8 4.4 14.9 11.2 19.4 5.8 3.8 13.2 5.7 20.9 5.3 10.2-.6 18.2-4.5 23.8-11.6 4.2-5.4 6.9-12.4 8.1-21.2 4.9 3 8.5 6.9 10.5 11.6 3.4 8 3.6 21.2-7.1 31.9-9.4 9.4-20.7 13.5-37.7 13.6-18.9-.1-33.2-6.2-42.5-18-8.7-11.1-13.2-27.1-13.4-47.6.2-20.5 4.7-36.5 13.4-47.6 9.3-11.9 23.6-17.9 42.5-18 19 .1 33.5 6.2 43.1 18.1 4.7 5.9 8.3 13.2 10.6 21.8l13.4-3.6c-2.8-10.6-7.2-19.8-13.3-27.4C160.7 11.2 142.6 2.2 118.4 2h-.1C94.3 2.2 76.4 11.2 64.6 26.7 54 40.6 48.6 59.8 48.4 83.6v.8c.2 23.8 5.6 43 16.2 56.9 11.8 15.5 29.7 24.5 53.9 24.7h.1c21.5-.2 36.6-5.8 49.1-18.3 16.4-16.3 15.9-36.8 10.5-49.4-3.9-9-11.3-16.3-21.2-21.1Zm-39.3 35.4c-8.5.5-17.4-3.4-17.8-11.4-.3-5.9 4.2-12.5 18.3-13.3 1.6-.1 3.2-.1 4.7-.1 5.1 0 9.9.5 14.3 1.5-1.6 20.4-11.2 22.9-19.5 23.3Z"/></svg>
            <h3 className="text-base font-bold text-white">스레드 글로 칼럼 만들기</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[13px] text-slate-400 leading-relaxed">
            스레드에 올린 글을 복사해서 아래에 붙여넣으세요. AI가 칼럼 초안으로 변환합니다. 생성 후 편집 화면에서 검토·수정 후 발행하세요.
          </p>

          {/* 글 붙여넣기 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">스레드 글 원문</label>
              <span className="text-[10px] text-slate-600">{charCount.toLocaleString()}자</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="스레드 글 전체를 여기에 붙여넣으세요…"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-400/40 leading-relaxed"
            />
          </div>

          {/* 변환 강도 */}
          <div>
            <label className="text-xs text-slate-500">변환 강도</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {([
                { id: "expand", label: "칼럼으로 확장 (3000~4000자)" },
                { id: "preserve", label: "원문 톤 유지 + 다듬기" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    mode === m.id
                      ? "bg-teal-500/20 text-teal-200 border-teal-400/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="text-xs text-slate-500">카테고리</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {POST_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                    category === c
                      ? "bg-teal-500/20 text-teal-200 border-teal-400/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* AI 선택 */}
          <div>
            <label className="text-xs text-slate-500">변환 AI</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {([
                { id: "anthropic", label: "Claude (추천)" },
                { id: "openai", label: "ChatGPT" },
                { id: "gemini", label: "Gemini" },
              ] as const).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    provider === p.id
                      ? "bg-violet-500/20 text-violet-200 border-violet-400/50"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-sm text-white">
            취소
          </button>
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/40 border-t-transparent rounded-full animate-spin" />
                생성 중… (최대 1분)
              </>
            ) : (
              "칼럼 초안 생성"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
