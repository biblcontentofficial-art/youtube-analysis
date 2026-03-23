"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Content = {
  hero: {
    badge: string;
    subtitle: string;
    titleLine1: string;
    titleHighlight: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroImage: string;
    heroImageCaption: string;
  };
  marquee: {
    label: string;
    titleLine1: string;
    titleHighlight: string;
    titleLine2: string;
    desc1: string;
    desc2: string;
  };
  features: { num: string; title: string; desc: string; img: string; imgAlt: string }[];
  reviews: { name: string; result: string; text: string }[];
  faqs: { q: string; a: string }[];
};

const TABS = ["히어로", "마퀴", "차별점", "후기", "FAQ"] as const;
type Tab = (typeof TABS)[number];

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-teal-500 transition"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dest", "studio");
    const res = await fetch("/api/dev/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    onChange(url);
    setUploading(false);
  };

  const isExternal = value.startsWith("http");

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {/* 미리보기 */}
      {value && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={value}
          alt={label}
          className="w-full h-28 object-cover rounded-lg border border-gray-700"
        />
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL 또는 /경로"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
        >
          {uploading ? "..." : "업로드"}
        </button>
      </div>
      {isExternal && (
        <p className="text-[10px] text-gray-500">
          외부 URL → 내 파일로 교체하려면 업로드 버튼 사용
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

export default function DevEditor() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("히어로");
  const [content, setContent] = useState<Content | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 최초 열 때 JSON 로드
  useEffect(() => {
    if (open && !content) {
      fetch("/api/dev/content")
        .then((r) => r.json())
        .then(setContent);
    }
  }, [open, content]);

  // 단축키: Shift+E
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "E") setOpen((o) => !o);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const update = useCallback(
    <K extends keyof Content>(section: K, patch: Partial<Content[K]>) => {
      setContent((prev) =>
        prev
          ? { ...prev, [section]: { ...(prev[section] as object), ...(patch as object) } }
          : prev
      );
    },
    []
  );

  const updateArrayItem = useCallback(
    <K extends "features" | "reviews" | "faqs">(
      section: K,
      index: number,
      patch: Partial<Content[K][number]>
    ) => {
      setContent((prev) => {
        if (!prev) return prev;
        const arr = [...(prev[section] as Content[K])];
        arr[index] = { ...arr[index], ...patch } as Content[K][number];
        return { ...prev, [section]: arr };
      });
    },
    []
  );

  const save = async () => {
    if (!content) return;
    setSaving(true);
    await fetch("/api/dev/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // 저장 후 페이지 새로고침 → 변경사항 반영
      window.location.reload();
    }, 800);
  };

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-[9998] flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-3 py-2 rounded-full shadow-lg shadow-indigo-900/50 transition"
        title="Shift+E 로도 열 수 있어요"
      >
        ✏️ 편집
      </button>

      {/* 패널 오버레이 */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* 반투명 배경 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 편집 패널 */}
          <div className="relative w-[420px] max-w-full h-full bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
              <div>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Dev Editor</p>
                <p className="text-white font-bold text-sm">채널 대행 페이지 편집</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={save}
                  disabled={saving || saved}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-lg transition disabled:opacity-60 min-w-[80px]"
                >
                  {saved ? "✓ 저장됨" : saving ? "저장 중..." : "저장 & 반영"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-800 shrink-0 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                    tab === t
                      ? "border-b-2 border-teal-400 text-teal-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!content ? (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                  로딩 중...
                </div>
              ) : (
                <>
                  {/* ── 히어로 ── */}
                  {tab === "히어로" && (
                    <div className="space-y-4">
                      <Field
                        label="상단 배지"
                        value={content.hero.badge}
                        onChange={(v) => update("hero", { badge: v })}
                      />
                      <Field
                        label="부제목 (작은 글씨)"
                        value={content.hero.subtitle}
                        onChange={(v) => update("hero", { subtitle: v })}
                        multiline
                      />
                      <Field
                        label="제목 1줄"
                        value={content.hero.titleLine1}
                        onChange={(v) => update("hero", { titleLine1: v })}
                      />
                      <Field
                        label="제목 강조 (teal 색상)"
                        value={content.hero.titleHighlight}
                        onChange={(v) => update("hero", { titleHighlight: v })}
                      />
                      <Field
                        label="설명문"
                        value={content.hero.desc}
                        onChange={(v) => update("hero", { desc: v })}
                        multiline
                      />
                      <Field
                        label="CTA 버튼 (메인)"
                        value={content.hero.ctaPrimary}
                        onChange={(v) => update("hero", { ctaPrimary: v })}
                      />
                      <Field
                        label="CTA 버튼 (서브)"
                        value={content.hero.ctaSecondary}
                        onChange={(v) => update("hero", { ctaSecondary: v })}
                      />
                      <ImageField
                        label="우측 이미지 (실버버튼 등)"
                        value={content.hero.heroImage}
                        onChange={(v) => update("hero", { heroImage: v })}
                      />
                      <Field
                        label="이미지 캡션"
                        value={content.hero.heroImageCaption}
                        onChange={(v) => update("hero", { heroImageCaption: v })}
                        multiline
                      />
                    </div>
                  )}

                  {/* ── 마퀴 ── */}
                  {tab === "마퀴" && (
                    <div className="space-y-4">
                      <Field
                        label="상단 레이블"
                        value={content.marquee.label}
                        onChange={(v) => update("marquee", { label: v })}
                      />
                      <Field
                        label="제목 1줄"
                        value={content.marquee.titleLine1}
                        onChange={(v) => update("marquee", { titleLine1: v })}
                      />
                      <Field
                        label="제목 강조 (teal 그라디언트)"
                        value={content.marquee.titleHighlight}
                        onChange={(v) => update("marquee", { titleHighlight: v })}
                      />
                      <Field
                        label="제목 마지막"
                        value={content.marquee.titleLine2}
                        onChange={(v) => update("marquee", { titleLine2: v })}
                      />
                      <Field
                        label="본문 1단락"
                        value={content.marquee.desc1}
                        onChange={(v) => update("marquee", { desc1: v })}
                        multiline
                      />
                      <Field
                        label="본문 2단락"
                        value={content.marquee.desc2}
                        onChange={(v) => update("marquee", { desc2: v })}
                        multiline
                      />
                    </div>
                  )}

                  {/* ── 차별점 (FEATURES) ── */}
                  {tab === "차별점" && (
                    <div className="space-y-6">
                      {content.features.map((f, i) => (
                        <div key={f.num} className="border border-gray-800 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-black text-teal-400 uppercase tracking-widest">
                            {f.num}
                          </p>
                          <Field
                            label="제목"
                            value={f.title}
                            onChange={(v) => updateArrayItem("features", i, { title: v })}
                          />
                          <Field
                            label="설명 (줄바꿈=\\n)"
                            value={f.desc}
                            onChange={(v) => updateArrayItem("features", i, { desc: v })}
                            multiline
                          />
                          <ImageField
                            label="이미지"
                            value={f.img}
                            onChange={(v) => updateArrayItem("features", i, { img: v })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── 후기 ── */}
                  {tab === "후기" && (
                    <div className="space-y-6">
                      {content.reviews.map((r, i) => (
                        <div key={i} className="border border-gray-800 rounded-xl p-4 space-y-3">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">후기 {i + 1}</p>
                          <Field
                            label="이름/직함"
                            value={r.name}
                            onChange={(v) => updateArrayItem("reviews", i, { name: v })}
                          />
                          <Field
                            label="결과 배지"
                            value={r.result}
                            onChange={(v) => updateArrayItem("reviews", i, { result: v })}
                          />
                          <Field
                            label="후기 내용"
                            value={r.text}
                            onChange={(v) => updateArrayItem("reviews", i, { text: v })}
                            multiline
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── FAQ ── */}
                  {tab === "FAQ" && (
                    <div className="space-y-4">
                      {content.faqs.map((faq, i) => (
                        <div key={i} className="border border-gray-800 rounded-xl p-4 space-y-3">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Q{i + 1}</p>
                          <Field
                            label="질문"
                            value={faq.q}
                            onChange={(v) => updateArrayItem("faqs", i, { q: v })}
                          />
                          <Field
                            label="답변"
                            value={faq.a}
                            onChange={(v) => updateArrayItem("faqs", i, { a: v })}
                            multiline
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 하단 안내 */}
            <div className="px-4 py-3 border-t border-gray-800 shrink-0">
              <p className="text-[10px] text-gray-600 text-center">
                저장하면 페이지가 새로고침됩니다 · Shift+E로 토글
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
