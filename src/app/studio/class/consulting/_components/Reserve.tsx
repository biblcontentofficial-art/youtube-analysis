"use client";

/**
 * 팀비블 5기 사전예약 (소유자 요청 2026-10-21: 4기 마감, 결제 버튼 대신 사전예약 설문 팝업).
 * - ReserveButton 은 어디에 몇 개를 두어도 되고, 누르면 창 이벤트로 페이지에 하나뿐인 ReserveDialog 를 연다.
 * - 주소 끝이 #reserve 면 들어오자마자 연다(요금제 카드 등 다른 페이지에서 바로 여는 링크).
 * - 항목: 이름 · 연락처 · 연령대 · 채널 주제 · 유튜브 운영 여부 · 유튜브 URL(선택) · 개인정보 수집 동의.
 * - 보내기: /api/studio/teambibl-reserve → 운영 메일(bibl.content.official@gmail.com).
 * - 검증은 누를 때 한 번: 비었거나 틀린 칸 아래에 오류, 첫 오류 칸으로 포커스.
 * 근거: DESIGN.md 6.9 입력 · 6.11 대화상자 · 6.13 상태 메시지
 */
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_DESCRIPTION } from "@/components/ui/dialog-classes";
import { ErrorText, Field, INPUT } from "@/components/ui/field";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";

const OPEN_EVENT = "teambibl-reserve:open";
const HASH = "#reserve";

const AGE_OPTIONS = ["20대 이하", "30대", "40대", "50대", "60대 이상"];
const STATUS_OPTIONS = ["운영 중", "준비 중"];

type Form = { name: string; phone: string; age: string; topic: string; status: string; youtubeUrl: string; consent: boolean };
type Errors = Partial<Record<keyof Form, string>>;
const INIT: Form = { name: "", phone: "", age: "", topic: "", status: "", youtubeUrl: "", consent: false };
const ORDER: (keyof Form)[] = ["name", "phone", "age", "topic", "status", "youtubeUrl", "consent"];

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "이름을 적어 주세요.";
  const digits = f.phone.replace(/\D/g, "");
  if (!digits) e.phone = "연락처를 적어 주세요.";
  else if (digits.length < 9 || digits.length > 11) e.phone = "연락처를 다시 확인해 주세요. 예) 010-1234-5678";
  if (!f.age) e.age = "연령대를 골라 주세요.";
  if (!f.topic.trim()) e.topic = "채널 주제를 적어 주세요.";
  if (!f.status) e.status = "운영 여부를 골라 주세요.";
  const url = f.youtubeUrl.trim();
  if (url && !/youtube\.com|youtu\.be|^@/i.test(url)) e.youtubeUrl = "유튜브 채널 주소를 적어 주세요. 예) youtube.com/@bibl";
  if (!f.consent) e.consent = "개인정보 수집에 동의해야 신청할 수 있어요.";
  return e;
}

/** 010-1234-5678 꼴로 하이픈을 넣는다(숫자만 남겨서) */
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}

/** 사전예약 창을 여는 버튼. 서버 컴포넌트 페이지 어디에나 둔다 */
export function ReserveButton({
  className,
  children,
  ...rest
}: { className: string; children: ReactNode } & Record<`data-${string}`, string>) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} {...rest}>
      {children}
    </button>
  );
}

/** 칩 모양 라디오(네이티브 radio 를 숨기고 label 을 칩으로). 선택은 has-checked, 포커스 링은 has-focus-visible */
function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: "age" | "status";
  legend: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = `reserve-${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 block text-body-sm font-medium text-fg-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <label
            key={opt}
            className="inline-flex h-11 cursor-pointer select-none items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3.5 text-ui text-fg-2 transition-colors duration-150 hover:border-line-hover has-checked:border-accent has-checked:bg-surface-3 has-checked:font-semibold has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              id={i === 0 ? `reserve-${name}` : undefined}
              type="radio"
              name={`reserve-${name}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              aria-invalid={error ? true : undefined}
              className="sr-only"
            />
            {value === opt && <CheckIcon size={16} className="text-accent" />}
            {opt}
          </label>
        ))}
      </div>
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </fieldset>
  );
}

/** 페이지에 하나만 둔다 */
export function ReserveDialog() {
  const titleId = useId();
  const descId = useId();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(INIT);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const show = useCallback(() => {
    setOpen(true);
    setServerError("");
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === HASH) show();
    };
    onHash();
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("hashchange", onHash);
    };
  }, [show]);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const close = () => {
    setOpen(false);
    if (window.location.hash === HASH) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // 접수를 마친 뒤 닫으면 다음에 열 때 빈 설문부터
    if (done) {
      setDone(false);
      setForm(INIT);
      setErrors({});
    }
  };

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate(form);
    setErrors(errs);
    const first = ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(`reserve-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/studio/teambibl-reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          age: form.age,
          topic: form.topic,
          status: form.status,
          youtubeUrl: form.youtubeUrl,
          privacyConsent: "동의",
        }),
      });
      if (res.status === 429) {
        setServerError("짧은 시간에 여러 번 접수됐어요. 1시간 뒤 다시 시도하시거나 카카오톡으로 문의해 주세요.");
        return;
      }
      if (res.status === 400) {
        setServerError("입력 내용을 확인해 주세요. 비어 있는 칸이 있거나 글자 수가 너무 길어요.");
        return;
      }
      if (!res.ok) throw new Error("server");
      setDone(true);
    } catch {
      setServerError("접수 중 오류가 났어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      labelledBy={titleId}
      describedBy={descId}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-md sm:p-8"
    >
      <button
        type="button"
        onClick={close}
        aria-label="닫기"
        className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-control text-fg-3 transition-colors duration-150 hover:text-fg"
      >
        <CloseIcon size={20} />
      </button>

      {done ? (
        <div className="py-4 text-center">
          <CheckIcon size={24} className="mx-auto mb-5 size-10 text-fg" />
          <h2 id={titleId} ref={doneRef} tabIndex={-1} className="text-h4 text-fg focus-visible:outline-0">
            사전예약이 접수됐어요
          </h2>
          <p id={descId} className="mt-3 text-body-sm text-fg-3">
            {form.name}님, 5기 모집이 열리면
            <br />
            {form.phone} 으로 가장 먼저 연락드릴게요.
          </p>
          <button type="button" onClick={close} className={cx(buttonClass({ size: "lg", block: true }), "mt-8")}>
            확인
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h2 id={titleId} className="pr-10 text-h4 text-fg">
            팀비블 5기 사전예약
          </h2>
          <p id={descId} className={DIALOG_DESCRIPTION}>
            4기는 마감됐어요. 5기 모집을 시작하면 사전예약하신 분께 가장 먼저 연락드려요.
          </p>

          <div className="mt-6 flex flex-col gap-5">
            <Field id="reserve-name" label="이름" error={errors.name}>
              {(c) => (
                <input
                  {...c}
                  type="text"
                  autoComplete="name"
                  maxLength={50}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <Field id="reserve-phone" label="연락처" error={errors.phone}>
              {(c) => (
                <input
                  {...c}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                  value={form.phone}
                  onChange={(e) => set("phone", formatPhone(e.target.value))}
                  className={INPUT}
                />
              )}
            </Field>
            <ChoiceGroup
              name="age"
              legend="연령대"
              options={AGE_OPTIONS}
              value={form.age}
              onChange={(v) => set("age", v)}
              error={errors.age}
            />
            <Field id="reserve-topic" label="채널 주제" hint="예) 영어 교육, 요리, 부동산, 쇼핑몰 운영" error={errors.topic}>
              {(c) => (
                <input
                  {...c}
                  type="text"
                  maxLength={200}
                  value={form.topic}
                  onChange={(e) => set("topic", e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <ChoiceGroup
              name="status"
              legend="유튜브 운영 여부"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => set("status", v)}
              error={errors.status}
            />
            <Field
              id="reserve-youtubeUrl"
              label={
                <>
                  유튜브 URL <span className="font-normal text-fg-3">(선택)</span>
                </>
              }
              hint="운영 중인 채널이 있으면 채널 주소를 적어 주세요."
              error={errors.youtubeUrl}
            >
              {(c) => (
                <input
                  {...c}
                  type="url"
                  inputMode="url"
                  placeholder="youtube.com/@채널이름"
                  maxLength={300}
                  value={form.youtubeUrl}
                  onChange={(e) => set("youtubeUrl", e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>

            <div>
              <label className="flex cursor-pointer select-none items-start gap-3 rounded-control border border-line-strong bg-surface px-3.5 py-3">
                <input
                  id="reserve-consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={cx("reserve-consent-detail", errors.consent && "reserve-consent-error") || undefined}
                  className="chk mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-ui font-semibold text-fg">[필수] 개인정보 수집·이용 동의</span>
                  <span id="reserve-consent-detail" className="mt-1 block text-caption text-fg-3">
                    수집 항목: 이름, 연락처, 연령대, 채널 주제, 운영 여부, 유튜브 URL · 목적: 팀비블 5기 모집 안내 연락 ·
                    보관: 5기 모집이 끝나면 파기
                  </span>
                </span>
              </label>
              {errors.consent && <ErrorText id="reserve-consent-error">{errors.consent}</ErrorText>}
            </div>
          </div>

          {serverError && (
            <p role="alert" className="mt-5 text-body-sm text-negative">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cx(buttonClass({ size: "lg", block: true }), "mt-6")}
          >
            {submitting ? "보내는 중…" : "사전예약 신청하기"}
          </button>
        </form>
      )}
    </Dialog>
  );
}
