"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { CloseIcon } from "@/components/ui/icons";
import { TAB, TAB_BAR, TAB_LIST } from "@/components/ui/tabs";

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

/** 개발 모드 전용 편집 패널(운영 번들에 없음). 모양은 DESIGN 토큰·공용 부품으로 */
const FIELD_LABEL = "text-micro font-semibold text-fg-3";
const SECTION_CARD = "space-y-3 rounded-card border border-line p-4";

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
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={cx(inputClass({ multiline: true, inset: true }), "resize-none")}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={inputClass({ inset: true })}
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
  const id = useId();
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
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      {/* 미리보기 */}
      {value && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={value}
          alt={label}
          className="h-28 w-full rounded-control border border-line object-cover"
        />
      )}
      <div className="flex gap-2">
        <input
          id={id}
          className={cx(inputClass({ inset: true }), "min-w-0 flex-1")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL 또는 /경로"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cx(buttonClass({ variant: "secondary" }), "shrink-0")}
        >
          {uploading ? "업로드 중" : "업로드"}
        </button>
      </div>
      {isExternal && (
        <p className="text-micro text-fg-3">
          외부 URL → 내 파일로 교체하려면 업로드 버튼 사용
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={`${label} 파일 선택`}
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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // 열면 닫기 버튼으로 포커스, Esc 로 닫기, 닫으면 여는 버튼으로 포커스를 돌린다
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);

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
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-[9998] inline-flex h-9 items-center rounded-control border border-line-strong bg-surface-2 px-3 text-caption font-bold text-fg transition-colors duration-150 hover:border-line-hover hover:bg-surface-3"
        title="Shift+E 로도 열 수 있어요"
      >
        편집
      </button>

      {/* 패널 오버레이 */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* 단색 배경 막(블러 없음, DESIGN 6.31) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-canvas/60"
            onClick={() => setOpen(false)}
          />

          {/* 편집 패널 */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="채널 대행 페이지 편집"
            className="relative flex h-full w-[420px] max-w-full flex-col border-l border-line bg-surface"
          >
            {/* 헤더 */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p lang="en" className="text-micro font-bold tracking-widest text-silver">DEV EDITOR</p>
                <p className="text-body-sm font-bold text-fg">채널 대행 페이지 편집</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || saved}
                  className={cx(buttonClass({ size: "sm" }), "min-w-20")}
                >
                  {saved ? "저장됨" : saving ? "저장 중..." : "저장 & 반영"}
                </button>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="inline-flex size-9 items-center justify-center rounded-control text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            </div>

            {/* 탭 */}
            <div className={cx(TAB_BAR, "shrink-0 px-2")}>
              <div role="tablist" aria-label="편집 구역" className={TAB_LIST}>
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={TAB}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div role="tabpanel" aria-label={tab} className="flex-1 space-y-4 overflow-y-auto p-4">
              {!content ? (
                <div className="flex h-32 items-center justify-center text-body-sm text-fg-3">
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
                        label="제목 강조 (흰 글자)"
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
                        label="제목 강조 (빨간 글자)"
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
                        <div key={f.num} className={SECTION_CARD}>
                          <p className="tnum text-caption font-bold text-silver">
                            {f.num}
                          </p>
                          <Field
                            label="제목"
                            value={f.title}
                            onChange={(v) => updateArrayItem("features", i, { title: v })}
                          />
                          <Field
                            label="설명 (줄바꿈=\n)"
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
                        <div key={i} className={SECTION_CARD}>
                          <p className="text-caption font-bold text-fg-3">후기 {i + 1}</p>
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
                        <div key={i} className={SECTION_CARD}>
                          <p className="text-caption font-bold text-fg-3">Q{i + 1}</p>
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
            <div className="shrink-0 border-t border-line px-4 py-3">
              <p className="text-center text-micro text-fg-3">
                저장하면 페이지가 새로고침됩니다 · Shift+E로 토글
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
