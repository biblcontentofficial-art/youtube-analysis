"use client";

/**
 * 1:1 유튜브 컨설팅 신청 폼 (Tally 폼 레퍼런스 재구성)
 * 제출 → /api/studio/consulting-1on1 → bibl.content.official@gmail.com 메일 발송
 */

import { useState } from "react";
import Link from "next/link";

const GENDER = ["여성", "남성"];
const AGE = ["만 18-24세", "만 25-34세", "만 35-44세", "만 45-54세", "만 55-64세", "만 65세 이상"];
const SERVICE = ["1:1 유튜브를 통한 브랜딩과 비즈니스 확장 (5기 / 26년 1월 중순~)"];
const SOURCE = ["유튜브", "스레드", "인스타그램", "단톡방", "지인추천", "기타"];
const PAY = ["계좌이체"];
const WAIT = ["동의", "비동의"];

interface FormState {
  name: string;
  gender: string;
  age: string;
  phone: string;
  email: string;
  service: string;
  source: string;
  reason: string;
  snsUrl: string;
  bizName: string;
  bizNumber: string;
  taxEmail: string;
  payMethod: string;
  waitConsent: string;
  privacyConsent: string;
}

const INIT: FormState = {
  name: "", gender: "", age: "", phone: "", email: "",
  service: SERVICE[0], source: "", reason: "",
  snsUrl: "", bizName: "", bizNumber: "", taxEmail: "",
  payMethod: PAY[0], waitConsent: "", privacyConsent: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-white">
        {label}{required && <span className="text-teal-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange, cols = 2 }: { options: string[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
            value === opt
              ? "border-teal-500 bg-teal-950/40 text-white font-semibold"
              : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition"
    />
  );
}

export default function ConsultingApplyForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit =
    form.name.trim() && form.gender && form.age && form.phone.trim() && emailValid &&
    form.service && form.source && form.reason.trim() && form.payMethod &&
    form.waitConsent && form.privacyConsent === "동의";

  async function handleSubmit() {
    setError("");
    if (!canSubmit) {
      setError("필수 항목(*)을 모두 입력하고 개인정보 수집에 동의해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/studio/consulting-1on1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "제출 실패");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950/95 backdrop-blur rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-white">1:1 유튜브 컨설팅 신청</h2>
            <p className="text-xs text-gray-500 mt-0.5">비블과 1:1로 진행하는 브랜딩·비즈니스 컨설팅</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {done ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">신청이 접수되었습니다!</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              {form.name}님의 1:1 컨설팅 신청을 확인했습니다.<br />영업일 기준 1~2일 내 연락드리겠습니다.
            </p>
            <button onClick={onClose} className="px-6 py-3 bg-teal-500 hover:bg-teal-400 rounded-xl text-sm font-bold text-white transition">
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-6">
              <Field label="성함" required>
                <Input value={form.name} onChange={set("name")} placeholder="홍길동" />
              </Field>

              <Field label="성별" required>
                <Chips options={GENDER} value={form.gender} onChange={set("gender")} />
              </Field>

              <Field label="연령" required>
                <Chips options={AGE} value={form.age} onChange={set("age")} cols={2} />
              </Field>

              <Field label="휴대폰 번호" required>
                <Input value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" type="tel" />
              </Field>

              <Field label="E-mail" required>
                <Input value={form.email} onChange={set("email")} placeholder="example@email.com" type="email" />
              </Field>

              <Field label="희망하는 서비스" required>
                <Chips options={SERVICE} value={form.service} onChange={set("service")} cols={1} />
              </Field>

              <Field label="어디에서 컨설팅 서비스를 알게 되셨나요?" required>
                <Chips options={SOURCE} value={form.source} onChange={set("source")} cols={3} />
              </Field>

              <Field label="컨설팅 신청 사유" required>
                <textarea
                  value={form.reason}
                  onChange={(e) => set("reason")(e.target.value)}
                  rows={4}
                  placeholder="현재 상황, 목표, 비블과 함께 이루고 싶은 것을 자유롭게 적어주세요."
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </Field>

              {/* 선택 정보 */}
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-500 mb-4 mt-4">선택 정보 (세금계산서 발행이 필요한 경우 입력)</p>
                <div className="space-y-4">
                  <Field label="운영하시는 SNS URL">
                    <Input value={form.snsUrl} onChange={set("snsUrl")} placeholder="https://youtube.com/@채널명" />
                  </Field>
                  <Field label="사업자 명">
                    <Input value={form.bizName} onChange={set("bizName")} placeholder="(선택)" />
                  </Field>
                  <Field label="사업자등록번호">
                    <Input value={form.bizNumber} onChange={set("bizNumber")} placeholder="000-00-00000 (선택)" />
                  </Field>
                  <Field label="전자세금계산서 수신 이메일">
                    <Input value={form.taxEmail} onChange={set("taxEmail")} placeholder="tax@email.com (선택)" type="email" />
                  </Field>
                </div>
              </div>

              <Field label="결제 수단" required>
                <Chips options={PAY} value={form.payMethod} onChange={set("payMethod")} cols={1} />
              </Field>

              <Field label="다음 기수 대기 동의" required>
                <p className="text-xs text-gray-500 -mt-1 mb-1">이번 기수 마감 시 다음 기수 안내를 받는 것에 동의하시나요?</p>
                <Chips options={WAIT} value={form.waitConsent} onChange={set("waitConsent")} />
              </Field>

              <Field label="개인정보 수집·이용 동의" required>
                <p className="text-xs text-gray-500 -mt-1 mb-1">
                  신청 내용은 컨설팅 상담 목적으로만 이용되며, 상담 완료 후 파기됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => set("privacyConsent")(form.privacyConsent === "동의" ? "" : "동의")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition ${
                    form.privacyConsent === "동의"
                      ? "border-teal-500 bg-teal-950/40 text-white"
                      : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center ${form.privacyConsent === "동의" ? "border-teal-400 bg-teal-500" : "border-gray-600"}`}>
                    {form.privacyConsent === "동의" && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    )}
                  </span>
                  개인정보 수집 및 이용에 동의합니다.
                </button>
              </Field>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>

            {/* 제출 */}
            <div className="sticky bottom-0 p-5 border-t border-gray-800 bg-gray-950/95 backdrop-blur rounded-b-2xl">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition text-sm shadow-lg shadow-teal-900/30"
              >
                {submitting ? "제출 중…" : "1:1 컨설팅 신청하기"}
              </button>
              <p className="text-[11px] text-gray-600 text-center mt-3">
                영업일 기준 1~2일 내 연락드립니다 ·{" "}
                <Link href="/privacy" className="underline hover:text-gray-400">개인정보처리방침</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
