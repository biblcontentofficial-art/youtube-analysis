"use client";

/**
 * C8 내 채널 등록 폼(카드 안, 클라이언트 잎). 근거: docs/trend-dev/spec.md 3.8 · DESIGN.md 6.5 · 6.9 · 6.19
 *
 *   <RegisterChannelForm onRegistered={reload} />                         POST /api/my-channel/register { input }
 *   <RegisterChannelForm preview initialError={{ kind: "not_found" }} />  로컬 미리보기(요청 없이 표시만)
 *
 * - INPUT(카드 안이라 면을 한 단 낮춘 inset) + 보조 버튼 '내 채널 등록' + 캡션.
 * - 등록 중: 버튼 안 스피너 + aria-busy + aria-disabled(두 번 눌러 쿼터를 두 번 쓰지 않게, 제출 함수가 막는다), 입력칸은 readOnly,
 *   캡션이 '읽는 중' 문장으로 바뀐다. disabled 를 쓰지 않는 것은 누른 자리에서 포커스가 빠지지 않게 하려는 것.
 * - 모바일(640 미만): 입력칸은 전체 폭, 버튼은 내용 폭(self-start). 오른쪽 76px 는 카카오 버튼 자리(DESIGN 6.5).
 * - 401: 로그인 화면으로 보내고 오류 문장은 띄우지 않는다({ ok:false, redirect:true }).
 * - 실패(ErrorText, 입력칸 바로 아래): 채널 못 찾음 / YouTube 오류·쿼터 / 7일 안 재등록('{M월 D일}부터 다시 분석할 수 있어요.').
 *   aria-invalid(빨간 테두리)는 입력값 문제(못 찾음·빈 칸)일 때만.
 * - postRegister·registerErrorMessage 는 카드의 '다시 분석'(저장된 채널 id 로 다시 등록)도 같이 쓴다.
 */
import { useId, useState, type FormEvent } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { ErrorText, inputClass } from "@/components/ui/field";
import { kstMonthDay } from "@/lib/trend/trendfit-schema";

export type RegisterError =
  | { kind: "not_found" }
  | { kind: "youtube_error" }
  | { kind: "too_soon"; nextAt: string }
  | { kind: "empty" };

export type RegisterOutcome = { ok: true } | { ok: false; error: RegisterError } | { ok: false; redirect: true };

/** 버튼 안 처리 중 표시(DESIGN 6.19: 스피너는 버튼 안에만, size-4) */
export const SPINNER = "size-4 animate-spin rounded-full border-2 border-line-hover border-t-fg motion-reduce:animate-none";

const PAGE_PATH = "/trend-search/breakout/keywords";

/** 처리 중 버튼 모양(disabled 와 같은 흐림·누름 막기). aria-disabled 라서 포커스는 버튼에 남는다 */
export const BUSY_LOOK = "aria-disabled:pointer-events-none aria-disabled:opacity-40";

export function registerErrorMessage(e: RegisterError): string {
  switch (e.kind) {
    case "not_found":
      return "채널을 찾지 못했습니다. 채널 주소나 @핸들을 다시 확인해 주세요.";
    case "too_soon":
      return `${kstMonthDay(e.nextAt)}부터 다시 분석할 수 있어요.`;
    case "empty":
      return "채널 주소나 @핸들을 입력해 주세요.";
    case "youtube_error":
      return "지금은 채널 정보를 불러올 수 없습니다. 잠시 뒤 다시 시도해 주세요.";
  }
}

/** POST /api/my-channel/register. 비로그인이면 로그인 화면으로 보낸다 */
export async function postRegister(input: string): Promise<RegisterOutcome> {
  try {
    const res = await fetch("/api/my-channel/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    if (res.status === 401) {
      window.location.href = `/sign-in?next=${encodeURIComponent(PAGE_PATH)}`;
      return { ok: false, redirect: true };
    }
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as { error?: string; nextAt?: string } | null;
    if (res.status === 409 && data?.error === "too_soon" && data.nextAt) return { ok: false, error: { kind: "too_soon", nextAt: data.nextAt } };
    if (res.status === 404) return { ok: false, error: { kind: "not_found" } };
    if (res.status === 400) return { ok: false, error: { kind: "empty" } };
    return { ok: false, error: { kind: "youtube_error" } };
  } catch {
    return { ok: false, error: { kind: "youtube_error" } };
  }
}

export function RegisterChannelForm({
  onRegistered,
  preview = false,
  initialError,
}: {
  onRegistered?: () => void;
  preview?: boolean;
  initialError?: RegisterError;
}) {
  const uid = useId();
  const inputId = `${uid}-channel`;
  const captionId = `${uid}-caption`;
  const errorId = `${uid}-error`;
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RegisterError | null>(initialError ?? null);
  const invalid = error?.kind === "not_found" || error?.kind === "empty";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const input = value.trim();
    if (!input) {
      setError({ kind: "empty" });
      return;
    }
    if (preview) return;
    setBusy(true);
    setError(null);
    const r = await postRegister(input);
    if ("redirect" in r) return; // 로그인 화면으로 이동 중: 처리 중 표시를 그대로 둔다
    setBusy(false);
    if (r.ok) onRegistered?.();
    else setError(r.error);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-3">
      <label htmlFor={inputId} className="sr-only">채널 주소 또는 @핸들</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={200}
          placeholder="채널 주소 또는 @핸들"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          readOnly={busy}
          aria-invalid={invalid || undefined}
          aria-describedby={cx(error ? errorId : "", captionId) || undefined}
          className={cx(inputClass({ inset: true }), "min-w-0 sm:flex-1")}
        />
        <button
          type="submit"
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          className={cx(buttonClass({ variant: "secondary", size: "md" }), "shrink-0 self-start sm:self-auto", BUSY_LOOK)}
        >
          {busy ? <span aria-hidden="true" className={SPINNER} /> : null}
          내 채널 등록
        </button>
      </div>
      {error ? <ErrorText id={errorId}>{registerErrorMessage(error)}</ErrorText> : null}
      <p id={captionId} className="mt-2 text-caption text-fg-3">
        {busy ? "채널 영상을 읽는 중이에요. 보통 몇 초 걸려요." : "등록하면 채널 최근 영상 제목으로 주제를 정리합니다. 7일에 한 번 다시 분석할 수 있어요."}
      </p>
    </form>
  );
}
