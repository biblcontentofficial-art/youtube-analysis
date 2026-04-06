"use client";

import { useState } from "react";
import Link from "next/link";

// ── 질문 데이터 ──────────────────────────────────────────────
const SOURCE_OPTIONS = ["유튜브", "인스타그램", "스레드", "지인 소개", "블로그/검색"];
const SERVICE_OPTIONS = [
  { value: "채널 대행 (기획·촬영·편집·업로드 전 과정)", label: "채널 대행 풀패키지", desc: "기획·촬영·편집·업로드·분석 전 과정" },
  { value: "기획만 (촬영·편집·업로드 직접)", label: "기획만", desc: "기획만 비블에게 전달받고, 촬영·편집·업로드는 직접하는 과정" },
];
const GOAL_OPTIONS = [
  { value: "사업·브랜드 홍보 및 매출 연결", label: "사업·브랜드 홍보", desc: "유튜브로 고객·매출 만들기" },
  { value: "퍼스널 브랜딩 및 수익화", label: "퍼스널 브랜딩", desc: "개인 채널 성장 & 수익화" },
  { value: "구독자·조회수 성장", label: "구독자·조회수 성장", desc: "채널 규모 키우기" },
  { value: "기타", label: "기타", desc: "직접 입력" },
];
const BUDGET_OPTIONS = [
  "월 200만원 미만 (기획만)",
  "월 200~500만원",
  "월 500~1,000만원",
  "월 1,000만원 이상",
];

type FormData = {
  // Step 1
  source: string;
  service: string;
  // Step 2
  name: string;
  phone: string;
  email: string;
  channelUrl: string;
  // Step 3
  goal: string;
  budget: string;
  message: string;
};

const INIT: FormData = {
  source: "", service: "",
  name: "", phone: "", email: "", channelUrl: "",
  goal: "", budget: "", message: "",
};

const STEPS = ["유입·관심 서비스", "기본 정보", "상담 내용"];

// ── 서브 컴포넌트 ──────────────────────────────────────────────
function RadioCard({
  selected, onClick, label, desc,
}: { selected: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 ${
        selected
          ? "border-teal-500 bg-teal-950/40 text-white"
          : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          selected ? "border-teal-400" : "border-gray-600"
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-teal-400" />}
        </div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
    </button>
  );
}

function TextInput({
  label, value, onChange, placeholder, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-300">
        {label}{required && <span className="text-teal-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition"
      />
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function ConsultingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormData) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const canNext = () => {
    if (step === 0) return !!form.source && !!form.service;
    if (step === 1) return !!form.name && !!form.phone;
    if (step === 2) return !!form.goal && !!form.budget;
    return false;
  };

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/studio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("서버 오류");
      setDone(true);
    } catch {
      setError("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 완료 화면 ──
  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-3">상담 신청이 완료됐습니다!</h1>
        <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-8">
          {form.name}님의 신청을 확인했습니다.<br />
          영업일 기준 1~2일 내 연락드리겠습니다.
        </p>

        {/* 카카오톡 채널 연결 */}
        <a
          href="http://pf.kakao.com/_beBNn/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FFD700] rounded-2xl text-[#3A1D1D] font-bold text-sm transition mb-3 w-full max-w-xs justify-center"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.568 1.524 4.832 3.848 6.24L4.5 21l4.38-2.318A11.3 11.3 0 0012 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" fill="#3A1D1D"/>
          </svg>
          카카오톡으로 바로 문의하기
        </a>
        <p className="text-xs text-gray-600 mb-6">더 빠른 답변을 원하시면 카카오톡을 이용해주세요</p>

        <Link
          href="/studio"
          className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition"
        >
          채널 대행 페이지로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 상단 네비 */}
      <div className="max-w-xl mx-auto px-4 pt-8 pb-0 flex items-center justify-between">
        <Link href="/studio" className="text-xs text-gray-500 hover:text-gray-300 transition flex items-center gap-1">
          ← 채널 대행 페이지
        </Link>
        <span className="text-xs text-gray-600">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* 프로그레스 바 */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-800">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <p className="text-xs text-teal-500 font-bold uppercase tracking-widest mb-2">
            STEP {step + 1} — {STEPS[step]}
          </p>
          {step === 0 && (
            <>
              <h1 className="text-2xl md:text-3xl font-black mb-2">안녕하세요 👋</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                TMK STUDIO를 어떻게 알게 되셨나요?<br />관심 있는 서비스를 선택해주세요.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-2xl md:text-3xl font-black mb-2">기본 정보를 알려주세요</h1>
              <p className="text-gray-400 text-sm">상담 연락을 위해 필요한 정보입니다.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-2xl md:text-3xl font-black mb-2">채널 상담 내용</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                솔직하게 적어주실수록 더 좋은 상담이 가능합니다.
              </p>
            </>
          )}
        </div>

        {/* ── STEP 0 ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-bold text-white mb-3">
                TMK STUDIO를 어떻게 알게 되셨나요? <span className="text-teal-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SOURCE_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt}
                    selected={form.source === opt}
                    onClick={() => set("source")(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-3">
                관심 있는 서비스 <span className="text-teal-400">*</span>
              </p>
              <div className="space-y-2">
                {SERVICE_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt.value}
                    selected={form.service === opt.value}
                    onClick={() => set("service")(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <TextInput label="성함" value={form.name} onChange={set("name")} placeholder="홍길동" required />
            <TextInput label="연락처" value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" type="tel" required />
            <TextInput label="이메일" value={form.email} onChange={set("email")} placeholder="example@email.com" type="email" />
            <TextInput
              label="현재 운영 중인 유튜브 채널 URL"
              value={form.channelUrl}
              onChange={set("channelUrl")}
              placeholder="https://youtube.com/@채널명 (없으면 빈칸)"
            />
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-bold text-white mb-3">
                유튜브 채널 운영 목적 <span className="text-teal-400">*</span>
              </p>
              <div className="space-y-2">
                {GOAL_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt.value}
                    selected={form.goal === opt.value}
                    onClick={() => set("goal")(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-3">
                월 광고비 집행 가능 예산 <span className="text-teal-400">*</span>
              </p>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt}
                    selected={form.budget === opt}
                    onClick={() => set("budget")(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-300">
                현재 가장 큰 고민이나 전달 사항
                <span className="text-gray-600 font-normal ml-1">(선택)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
                placeholder="채널 현황, 목표, 고민 등 자유롭게 적어주세요."
                rows={4}
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-4 border border-gray-700 hover:border-gray-500 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext() || submitting}
            className="flex-1 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition text-sm shadow-lg shadow-teal-900/30"
          >
            {submitting
              ? "제출 중..."
              : step < 2
              ? "다음 →"
              : "상담 신청하기"}
          </button>
        </div>

        {/* 하단 안내 */}
        <p className="text-xs text-gray-600 text-center mt-4">
          영업일 기준 1~2일 내 연락드립니다 · 완전 무료
        </p>
      </div>
    </main>
  );
}
