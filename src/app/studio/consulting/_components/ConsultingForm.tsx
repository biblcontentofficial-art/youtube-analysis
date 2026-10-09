"use client";

/**
 * 채널 대행 상담 신청 폼 (3단계).
 * - 폼 본체는 정적 프리렌더된다. 주소 쿼리(키워드 컨설팅 요청)는 마운트 뒤 window.location 에서 읽는다
 *   (useSearchParams 는 Suspense 경계에 BAILOUT_TO_CLIENT_SIDE_RENDERING 자리를 남겨서 쓰지 않는다).
 * - 버튼은 항상 누를 수 있고, 누르면 비었거나 형식이 틀린 칸 아래에 오류를 보이고 첫 오류로 포커스를 옮긴다.
 * - 검증은 화면에서만 한다. /api/studio/contact 로 보내는 본문·필드 이름·필수 항목은 그대로다.
 * 근거: DESIGN.md 6.9 입력 · 6.24 라디오 카드 · 6.13 상태 메시지, 로드맵 C08(R12b)
 */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { buttonClass, cx } from "@/components/ui/button";
import { ErrorText, Field, INPUT, TEXTAREA } from "@/components/ui/field";
import { ArrowRightIcon, CheckIcon, WarningIcon } from "@/components/ui/icons";

// ── 질문 데이터 ──────────────────────────────────────────────
const SOURCE_OPTIONS = ["유튜브", "인스타그램", "스레드", "지인 소개", "블로그/검색"];
const SERVICE_OPTIONS = [
  { value: "채널 대행 (기획·촬영·편집·업로드 전 과정)", label: "채널 대행 풀패키지", desc: "기획·촬영·편집·업로드·분석 전 과정" },
];
const GOAL_OPTIONS = [
  { value: "사업·브랜드 홍보 및 매출 연결", label: "사업·브랜드 홍보", desc: "유튜브로 고객·매출 만들기" },
  { value: "퍼스널 브랜딩 및 수익화", label: "퍼스널 브랜딩", desc: "개인 채널 성장 & 수익화" },
  { value: "구독자·조회수 성장", label: "구독자·조회수 성장", desc: "채널 규모 키우기" },
  { value: "기타", label: "기타", desc: "직접 입력" },
];
const BUDGET_OPTIONS = [
  {
    value: "비블 유튜브 대행 패키지 · 월 350만원 (부가세 별도, 롱폼 4편 + 쇼츠 4편)",
    label: "비블 유튜브 대행 패키지 · 월 350만원",
    desc: "기획·촬영·편집·업로드·채널관리·비블 디렉팅 · 롱폼 4편 + 쇼츠(롱폼 리프레이밍) 4편 · 부가세 별도",
  },
  {
    value: "야외·해외 촬영 패키지 · 가격 협의",
    label: "야외·해외 촬영 패키지 · 가격 협의",
    desc: "촬영 지역·일정에 따라 별도 견적",
  },
  {
    value: "발행량 확대 · 가격 협의",
    label: "발행량 확대 · 가격 협의",
    desc: "롱폼·쇼츠 수량과 구성을 맞춤 기획해 별도 견적",
  },
  {
    value: "아직 정하지 못했습니다 · 상담 후 결정",
    label: "아직 정하지 못했어요",
    desc: "상담하면서 채널 상황에 맞는 구성을 정하고 싶어요",
  },
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
  channelStatus: string;
  concern: string;
  region: string;
  period: string;
};

type FieldKey = keyof FormData;
type Errors = Partial<Record<FieldKey, string>>;

const INIT: FormData = {
  source: "", service: "",
  name: "", phone: "", email: "", channelUrl: "",
  goal: "", budget: "", channelStatus: "", concern: "", region: "", period: "",
};

const STEPS = ["유입·관심 서비스", "기본 정보", "상담 내용"];

/**
 * 서버 제한에 맞춘 글자 수. 이름 50·연락처 30, 텍스트 4항목은 message 하나로 합쳐 2,000자 안(합계 1,600 + 항목 이름).
 */
const MAX = { name: 50, phone: 30, channelStatus: 300, concern: 1200, region: 50, period: 50 } as const;

/** 칸마다 입력 요소 id. 첫 오류로 포커스를 옮길 때 쓴다(라디오 묶음은 선택된 칸 또는 첫 칸) */
const ID_PREFIX = "consult-";

/** 단계별 검사 순서(화면 위에서 아래) */
const STEP_FIELDS: FieldKey[][] = [
  ["source", "service"],
  ["name", "phone", "email", "channelUrl"],
  ["goal", "budget", "channelStatus", "concern", "region", "period"],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(key: FieldKey, form: FormData): string | undefined {
  const v = form[key].trim();
  switch (key) {
    case "source":
      return v ? undefined : "어떻게 알게 되셨는지 선택해주세요.";
    case "service":
      return v ? undefined : "관심 있는 서비스를 선택해주세요.";
    case "name":
      return v ? undefined : "성함을 입력해주세요.";
    case "phone":
      if (!v) return "연락처를 입력해주세요.";
      return v.replace(/\D/g, "").length >= 9 ? undefined : "연락처를 숫자 9자리 이상으로 입력해주세요.";
    case "email":
      return !v || EMAIL_RE.test(v) ? undefined : "이메일 형식을 확인해주세요.";
    case "goal":
      return v ? undefined : "운영 목적을 선택해주세요.";
    case "budget":
      return v ? undefined : "희망 패키지를 선택해주세요.";
    case "channelStatus":
      return v ? undefined : "채널 이름 및 현황을 입력해주세요.";
    case "concern":
      return v ? undefined : "현재 가지고 계신 고민을 입력해주세요.";
    case "region":
      return v ? undefined : "거주하시는 지역을 입력해주세요.";
    case "period":
      return v ? undefined : "유튜브를 운영한 기간을 입력해주세요.";
    default:
      return undefined;
  }
}

// ── 서브 컴포넌트 ──────────────────────────────────────────────

/** 필수 표시 */
function Req() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-fg-3">
      *
    </span>
  );
}

type RadioOption = { value: string; label: string; desc?: string };

/** 라디오 카드 묶음(6.24): role=radiogroup + role=radio, 화살표로 이동·선택, 선택된 칸만 Tab 으로 들어온다 */
function RadioGroup({
  name,
  label,
  extra,
  options,
  value,
  onChange,
  error,
  columns = 1,
}: {
  name: FieldKey;
  label: string;
  extra?: ReactNode;
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  columns?: 1 | 2;
}) {
  const labelId = `${ID_PREFIX}${name}-label`;
  const errorId = `${ID_PREFIX}${name}-error`;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabIndexOf = (i: number) => (i === (selectedIndex >= 0 ? selectedIndex : 0) ? 0 : -1);

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    onChange(options[next].value);
    document.getElementById(`${ID_PREFIX}${name}-${next}`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(i, -1);
    } else if (e.key === " ") {
      e.preventDefault();
      onChange(options[i].value);
    }
  };

  return (
    <div>
      <p id={labelId} className="mb-3 text-body-sm font-semibold text-fg">
        {label}
        <Req />
        {extra}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx("grid gap-2", columns === 2 && "grid-cols-2")}
      >
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              id={`${ID_PREFIX}${name}-${i}`}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabIndexOf(i)}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="flex min-h-11 w-full items-center gap-3 rounded-control border border-line-strong bg-surface px-4 py-3 text-left text-ui text-fg-2 transition-colors duration-150 hover:border-line-hover aria-checked:border-accent aria-checked:bg-surface-2 aria-checked:text-fg"
            >
              <span className="min-w-0 flex-1">
                <span className={cx("block", selected && "font-semibold")}>{opt.label}</span>
                {opt.desc && <span className="mt-0.5 block text-caption text-fg-3">{opt.desc}</span>}
              </span>
              {selected && <CheckIcon size={16} className="text-accent" />}
            </button>
          );
        })}
      </div>
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}

// ── 메인 폼 ──────────────────────────────────────────────
export default function ConsultingForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INIT);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevView = useRef({ step, done });

  // 단계가 바뀌거나 완료되면 맨 위로 올리고 제목에 포커스(스크린 리더가 새 단계를 읽는다).
  // 직전 값과 비교하므로 첫 렌더나 개발 모드 StrictMode 의 두 번 실행에서는 움직이지 않는다.
  useEffect(() => {
    const prev = prevView.current;
    if (prev.step === step && prev.done === done) return;
    prevView.current = { step, done };
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  // 검색 페이지에서 키워드 컨설팅 요청 시 메시지 자동 채우기 (Phase 3.8)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    const query = params.get("query");
    if (source === "keyword" && query) {
      setForm((f) => ({
        ...f,
        concern: `[키워드 컨설팅 요청]\n검색 키워드: "${query}"\n\n위 키워드와 관련된 유튜브 채널 전략에 대해 비블의 의견을 듣고 싶습니다.\n\n구체적으로 궁금한 점:\n- \n- `.slice(0, MAX.concern),
      }));
    }
  }, []);

  const set = (key: FieldKey) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    // 고친 칸의 오류는 바로 지운다(다시 누르면 다시 검사)
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const focusField = (key: FieldKey) => {
    const radioOptions =
      key === "source" ? SOURCE_OPTIONS.map((v) => ({ value: v })) :
      key === "service" ? SERVICE_OPTIONS :
      key === "goal" ? GOAL_OPTIONS :
      key === "budget" ? BUDGET_OPTIONS : null;
    if (radioOptions) {
      const i = Math.max(0, radioOptions.findIndex((o) => o.value === form[key]));
      document.getElementById(`${ID_PREFIX}${key}-${i}`)?.focus();
    } else {
      document.getElementById(`${ID_PREFIX}${key}`)?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const found: Errors = {};
    for (const key of STEP_FIELDS[step]) {
      const msg = validate(key, form);
      if (msg) found[key] = msg;
    }
    const firstError = STEP_FIELDS[step].find((k) => found[k]);
    setErrors(found);
    if (firstError) {
      focusField(firstError);
      return;
    }

    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // 질문지 4항목을 기존 message 필드로 합쳐 전송 (API·DB 스키마 변경 없이 호환)
      const message = [
        `채널 이름 및 현황: ${form.channelStatus}`,
        `현재 가지고 계신 고민: ${form.concern}`,
        `거주하시는 지역: ${form.region}`,
        `유튜브를 운영한 기간: ${form.period}`,
      ].join("\n");
      const res = await fetch("/api/studio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, message }),
      });
      if (res.status === 429) {
        setError("짧은 시간에 신청이 여러 번 접수되었습니다. 1시간 뒤 다시 시도하시거나 카카오톡으로 문의해주세요.");
        return;
      }
      if (res.status === 400) {
        setError("입력 내용을 확인해주세요. 비어 있는 필수 항목이 있거나 글자 수가 너무 깁니다.");
        return;
      }
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 pb-28 pt-12 text-center text-fg md:pb-12">
        <CheckIcon size={24} className="mb-6 size-10 text-fg" />
        <h1 ref={headingRef} tabIndex={-1} className="mb-3 text-h3 md:text-h2">
          상담 신청이 완료됐습니다!
        </h1>
        <p className="mb-8 max-w-sm text-body text-fg-3">
          {form.name}님의 신청을 확인했습니다.<br />
          영업일 기준 1~2일 내 연락드리겠습니다.
        </p>

        {/* 카카오톡 채널 연결 */}
        <a
          href="https://pf.kakao.com/_beBNn/chat"
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonClass({ variant: "kakao", size: "lg", block: true }), "mb-3 max-w-xs")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-kakao-icon">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.568 1.524 4.832 3.848 6.24L4.5 21l4.38-2.318A11.3 11.3 0 0012 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" fill="currentColor" />
          </svg>
          카카오톡으로 바로 문의하기
          <span className="sr-only">(새 창)</span>
        </a>
        <p className="mb-6 text-caption text-fg-3">더 빠른 답변을 원하시면 카카오톡을 이용해주세요</p>

        <Link href="/studio" className={buttonClass({ variant: "secondary" })}>
          채널 대행 페이지로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas pb-28 text-fg md:pb-0">
      {/* 상단: 돌아가기 · 단계 */}
      <div className="mx-auto flex max-w-reading items-center justify-between px-6 pt-6">
        <Link
          href="/studio"
          className="inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg"
        >
          <span aria-hidden="true">←</span> 채널 대행 페이지
        </Link>
        <span className="text-caption tabular-nums text-fg-3">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div className="mx-auto max-w-reading px-6 pb-8 pt-4 md:pb-16">
        {/* 단계 막대 */}
        <div aria-hidden="true" className="mb-8 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-chart-1" : "bg-surface-3")} />
          ))}
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <p className="mb-2 text-caption font-bold tracking-[0.15em] text-silver">
            STEP {step + 1} · {STEPS[step]}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="mb-2 text-h3 md:text-h2">
            {step === 0 && "안녕하세요"}
            {step === 1 && "기본 정보를 알려주세요"}
            {step === 2 && "채널 상담 내용"}
          </h1>
          {step === 0 && (
            <p className="text-body-sm text-fg-3">
              TMK STUDIO를 어떻게 알게 되셨나요?<br />관심 있는 서비스를 선택해주세요.
            </p>
          )}
          {step === 1 && <p className="text-body-sm text-fg-3">상담 연락을 위해 필요한 정보입니다.</p>}
          {step === 2 && (
            <p className="text-body-sm text-fg-3">솔직하게 적어주실수록 더 좋은 상담이 가능합니다.</p>
          )}
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {/* ── STEP 0 ── */}
          {step === 0 && (
            <div className="space-y-8">
              <RadioGroup
                name="source"
                label="TMK STUDIO를 어떻게 알게 되셨나요?"
                options={SOURCE_OPTIONS.map((v) => ({ value: v, label: v }))}
                value={form.source}
                onChange={set("source")}
                error={errors.source}
                columns={2}
              />
              <RadioGroup
                name="service"
                label="관심 있는 서비스"
                options={SERVICE_OPTIONS}
                value={form.service}
                onChange={set("service")}
                error={errors.service}
              />
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-5">
              <Field id={`${ID_PREFIX}name`} label={<>성함<Req /></>} error={errors.name}>
                {(control) => (
                  <input
                    {...control}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={MAX.name}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="홍길동"
                    className={INPUT}
                  />
                )}
              </Field>
              <Field id={`${ID_PREFIX}phone`} label={<>연락처<Req /></>} error={errors.phone}>
                {(control) => (
                  <input
                    {...control}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={MAX.phone}
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    placeholder="010-0000-0000"
                    className={INPUT}
                  />
                )}
              </Field>
              <Field id={`${ID_PREFIX}email`} label="이메일" error={errors.email}>
                {(control) => (
                  <input
                    {...control}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    placeholder="example@email.com"
                    className={INPUT}
                  />
                )}
              </Field>
              <Field id={`${ID_PREFIX}channelUrl`} label="현재 운영 중인 유튜브 채널 URL" error={errors.channelUrl}>
                {(control) => (
                  <input
                    {...control}
                    name="channelUrl"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    value={form.channelUrl}
                    onChange={(e) => set("channelUrl")(e.target.value)}
                    placeholder="https://youtube.com/@채널명 (없으면 빈칸)"
                    className={INPUT}
                  />
                )}
              </Field>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-8">
              <RadioGroup
                name="goal"
                label="유튜브 채널 운영 목적"
                options={GOAL_OPTIONS}
                value={form.goal}
                onChange={set("goal")}
                error={errors.goal}
              />
              <RadioGroup
                name="budget"
                label="희망 패키지를 선택해주세요"
                extra={<span className="ml-1.5 font-normal text-fg-3">(부가세 별도)</span>}
                options={BUDGET_OPTIONS}
                value={form.budget}
                onChange={set("budget")}
                error={errors.budget}
              />

              <div className="space-y-5">
                <p className="text-caption text-fg-3">
                  채널을 운영하고 있지 않거나 해당 없는 항목은 &lsquo;없음&rsquo;이라고 적어주세요.
                </p>

                <Field id={`${ID_PREFIX}channelStatus`} label={<>채널 이름 및 현황<Req /></>} error={errors.channelStatus}>
                  {(control) => (
                    <textarea
                      {...control}
                      name="channelStatus"
                      required
                      maxLength={MAX.channelStatus}
                      rows={2}
                      value={form.channelStatus}
                      onChange={(e) => set("channelStatus")(e.target.value)}
                      placeholder="예: 홍길동TV, 구독자 1,000명, 월 2회 업로드 중 (없다면 '없음')"
                      className={TEXTAREA}
                    />
                  )}
                </Field>

                <Field
                  id={`${ID_PREFIX}concern`}
                  label={<>현재 가지고 계신 고민<Req /></>}
                  hint={
                    <span className="tabular-nums">
                      {form.concern.length.toLocaleString()} / {MAX.concern.toLocaleString()}자
                    </span>
                  }
                  error={errors.concern}
                >
                  {(control) => (
                    <textarea
                      {...control}
                      name="concern"
                      required
                      maxLength={MAX.concern}
                      rows={4}
                      value={form.concern}
                      onChange={(e) => set("concern")(e.target.value)}
                      placeholder="예: 영상을 꾸준히 올려도 조회수가 나오지 않습니다."
                      className={TEXTAREA}
                    />
                  )}
                </Field>

                <Field id={`${ID_PREFIX}region`} label={<>거주하시는 지역<Req /></>} error={errors.region}>
                  {(control) => (
                    <input
                      {...control}
                      name="region"
                      type="text"
                      required
                      maxLength={MAX.region}
                      value={form.region}
                      onChange={(e) => set("region")(e.target.value)}
                      placeholder="예: 서울, 경기 수원"
                      className={INPUT}
                    />
                  )}
                </Field>

                <Field id={`${ID_PREFIX}period`} label={<>유튜브를 운영한 기간<Req /></>} error={errors.period}>
                  {(control) => (
                    <input
                      {...control}
                      name="period"
                      type="text"
                      required
                      maxLength={MAX.period}
                      value={form.period}
                      onChange={(e) => set("period")(e.target.value)}
                      placeholder="예: 6개월 (운영 전이라면 '없음')"
                      className={INPUT}
                    />
                  )}
                </Field>
              </div>
            </div>
          )}

          {/* 제출 오류 */}
          {error && (
            <div role="alert" className="mt-6 flex gap-3 rounded-card border border-line bg-surface p-4">
              <WarningIcon size={20} className="mt-0.5 text-negative" />
              <p className="text-body-sm text-fg-2">{error}</p>
            </div>
          )}

          {/* 버튼 영역. 768 미만은 오른쪽을 카카오 상담 버튼 자리로 비운다(첫 화면·스크롤 끝 겹침 0) */}
          <div className="mt-8 flex gap-3 max-md:pr-16">
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setStep((s) => s - 1);
                }}
                className={cx(buttonClass({ variant: "secondary", size: "lg" }), "flex-1")}
              >
                이전
              </button>
            )}
            <button
              type="submit"
              aria-busy={submitting || undefined}
              disabled={submitting}
              className={cx(buttonClass({ size: "lg" }), "flex-1")}
            >
              {submitting ? "제출 중..." : step < 2 ? (
                <>
                  다음 <ArrowRightIcon size={16} />
                </>
              ) : (
                "상담 신청하기"
              )}
            </button>
          </div>
        </form>

        {/* 하단 안내 */}
        {/* 768 미만은 버튼 줄과 같은 축(왼쪽 정렬, 오른쪽 카카오 자리 비움)에 맞춘다 */}
        <p className="mt-4 text-caption text-fg-3 max-md:pr-16 md:text-center">영업일 기준 1~2일 내 연락드립니다 · 완전 무료</p>
      </div>
    </main>
  );
}
