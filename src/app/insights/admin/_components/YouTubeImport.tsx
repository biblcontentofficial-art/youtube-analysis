"use client";

/**
 * 유튜브 URL → 자막 → AI 칼럼 변환 → draft 생성 모달
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POST_CATEGORIES, type PostCategory } from "@/lib/posts";

export default function YouTubeImport({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<PostCategory>("유튜브");
  const [provider, setProvider] = useState<"anthropic" | "openai" | "gemini">("anthropic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needTranscript, setNeedTranscript] = useState(false);
  const [transcript, setTranscript] = useState("");

  async function run() {
    setError(null);
    if (!url.trim()) {
      setError("유튜브 URL을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/posts/from-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          category,
          provider,
          transcript: transcript.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needTranscript) setNeedTranscript(true);
        setError(data.message || "변환에 실패했습니다.");
        return;
      }
      // 생성된 draft 편집 화면으로 이동
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
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path fill="#fff" d="M9.545 15.568V8.432L15.818 12z" /></svg>
            <h3 className="text-base font-bold text-white">유튜브 영상으로 칼럼 만들기</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[13px] text-slate-400 leading-relaxed">
            영상 자막을 분석해 3000~4000자 칼럼 초안을 자동 생성합니다. 생성 후 편집 화면에서 검토·수정 후 발행하세요.
          </p>

          {/* URL */}
          <div>
            <label className="text-xs text-slate-500">유튜브 URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full mt-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-400/40 font-mono"
            />
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

          {/* 자막 직접 붙여넣기 (자동추출 실패 시) */}
          {needTranscript && (
            <div>
              <label className="text-xs text-amber-300">자막 자동 추출 실패 — 대본을 직접 붙여넣어 주세요</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={6}
                placeholder="영상 대본/자막 전문을 붙여넣으세요"
                className="w-full mt-1 bg-white/[0.03] border border-amber-400/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
              />
            </div>
          )}

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
