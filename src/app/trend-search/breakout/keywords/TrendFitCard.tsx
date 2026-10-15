"use client";

/**
 * C8 '내 채널에 맞는 주제' 카드(클라이언트 잎). 근거: docs/trend-dev/spec.md 3.8 · roadmap T10 · DESIGN.md 6.12 · 6.19
 *
 *   <TrendFitCard registered mode="rising" />                 등록됨: 마운트 뒤 GET /api/trend/fit, 그동안 스켈레톤(줄 3개)
 *   <TrendFitCard registered={false} mode="top" />            미등록: 요청 없이 바로 등록 폼
 *   <TrendFitCard registered mode="rising" preview={...} />   로컬 미리보기(요청 없이 고정 상태)
 *
 * - 키워드 페이지 서버 렌더는 이 카드를 기다리지 않는다(표는 바로 그린다). 카드 자리는 page.tsx 가 plan·user_channels 유무로 정한다.
 * - 카드 실패(불러오기 오류·비로그인·잠금 응답)는 카드만 숨긴다. 표는 그대로.
 * - 등록됨: 머리 '{채널명} 주제와 가까운 급상승 키워드'(A1 이 top 이면 '…, 이번 주 많이 나온 주제') + 오른쪽 글자 버튼 '다시 분석'.
 *   7일 안이면 disabled + 버튼 옆 캡션 'M월 D일부터 다시 분석할 수 있어요'(title 툴팁 안 씀). 본문 주제어(흰 semibold) + 이유 한 줄 +
 *   '아직 안 다룸' 태그(최근 제목에서 다루지 않음). 아래 method=ai 면 AiNotice, overlap 이면 안내 한 줄 + DerivedNotice.
 * - 30일 지남(expired): '30일이 지나 채널 정보를 다시 읽어야 해요.' + '다시 분석'(바로 가능).
 * - '다시 분석'은 저장된 채널 id 로 다시 등록한다(POST /api/my-channel/register). 성공하면 카드를 다시 불러온다.
 * - 등록·다시 분석이 성공해 결과가 나오면 포커스를 카드 제목(tabIndex -1)으로 옮긴다(폼이 사라져도 위치를 잃지 않게).
 * - 스켈레톤은 실제 카드와 같은 행 구조: 768 미만은 주제어 줄 + 이유 줄(두 줄), 이상은 한 줄. 아래 안내 자리도 폭별 높이.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { ErrorText } from "@/components/ui/field";
import { AiNotice, DerivedNotice } from "@/components/ui/notice";
import { kstMonthDay, type TrendFitResponse } from "@/lib/trend/trendfit-schema";
import { BUSY_LOOK, RegisterChannelForm, SPINNER, postRegister, registerErrorMessage, type RegisterError } from "./RegisterChannelForm";

/** 미리보기 상태(ux-preview/trend-keywords ?fit=…) */
export type TrendFitPreview =
  | { view: "loading" }
  | { view: "data"; data: TrendFitResponse }
  | { view: "register-error"; error: RegisterError };

const CARD = "rounded-card border border-line bg-surface p-5";
/** 제목. 등록 뒤 포커스를 받는다(tabIndex -1, 포커스 링은 전역 :focus-visible 그대로) */
const HEAD = "text-ui font-semibold text-fg";
const BAR = "rounded-control bg-surface-2";
const PULSE = "animate-pulse motion-reduce:animate-none";
/** 오른쪽 글자 버튼(누름 영역 44px). 잠기면 라벨 fg-3(DESIGN 6.5 잠김), 흐리게 하지 않는다 */
const TEXT_BUTTON =
  "-mr-2 inline-flex h-11 shrink-0 items-center gap-2 px-2 text-body-sm font-semibold text-fg-2 transition-colors duration-150 hover:text-fg disabled:cursor-not-allowed disabled:text-fg-3 disabled:hover:text-fg-3 aria-disabled:pointer-events-none";

type Phase = { kind: "loading" } | { kind: "hidden" } | { kind: "data"; data: TrendFitResponse };

function initialPhase(registered: boolean, preview?: TrendFitPreview): Phase {
  if (preview?.view === "loading") return { kind: "loading" };
  if (preview?.view === "data") return { kind: "data", data: preview.data };
  if (preview?.view === "register-error" || !registered) return { kind: "data", data: { state: "unregistered" } };
  return { kind: "loading" };
}

/**
 * 6.19 카드 스켈레톤: 머리 한 줄 + 행 3개 + 아래 안내 자리. 실제 카드 높이에 맞춘다(레이아웃 이동 0).
 * 행: 768 이상 한 줄(약 42px), 미만은 주제어 줄 + 이유 줄(실제 li 의 이유가 w-full 로 내려감, 약 73px).
 * 안내: 768 이상 한 줄(18px), 미만은 외부 AI 안내 3줄 높이(약 54px).
 */
function FitSkeleton({ className }: { className?: string }) {
  return (
    <section aria-busy="true" className={cx(CARD, className)}>
      <span role="status" className="sr-only">내 채널에 맞는 주제를 불러오는 중</span>
      <div aria-hidden="true" className={PULSE}>
        <div className="flex h-11 items-center">
          <div className={cx(BAR, "h-4 w-64 max-w-full")} />
        </div>
        <div className="mt-2 divide-y divide-line-soft">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex h-[73px] flex-col justify-center gap-3 md:h-[42px] md:flex-row md:items-center md:justify-start">
              <div className={cx(BAR, "h-4 w-24")} />
              <div className={cx(BAR, "h-3 w-56 max-w-full md:w-48 md:max-w-[50%]")} />
            </div>
          ))}
        </div>
        {/* 아래 안내 문장 자리(실제 카드와 높이를 맞춘다) */}
        <div className="mt-3 flex h-[54px] flex-col justify-center gap-2 md:h-[18px]">
          <div className={cx(BAR, "h-3 w-80 max-w-full")} />
          <div className={cx(BAR, "h-3 w-40 md:hidden")} />
        </div>
      </div>
    </section>
  );
}

export function TrendFitCard({
  registered,
  mode,
  heading = "h2",
  preview,
  className,
}: {
  registered: boolean;
  /** A1 상태(top 이면 '이번 주 많이 나온 주제' 머리) */
  mode: "rising" | "top" | null;
  heading?: "h2" | "h3";
  preview?: TrendFitPreview;
  className?: string;
}) {
  const H = heading;
  const uid = useId();
  const headId = `${uid}-head`;
  const captionId = `${uid}-next`;
  const [phase, setPhase] = useState<Phase>(() => initialPhase(registered, preview));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);
  const started = useRef(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  /** 등록·다시 분석 성공 뒤 불러온 결과에서 제목으로 포커스를 옮길지 */
  const focusHead = useRef(false);

  const load = useCallback(async () => {
    setPhase({ kind: "loading" });
    try {
      const res = await fetch("/api/trend/fit", { cache: "no-store" });
      if (!res.ok) return setPhase({ kind: "hidden" });
      const data = (await res.json().catch(() => null)) as TrendFitResponse | null;
      if (!data || data.state === "error" || data.state === "locked") return setPhase({ kind: "hidden" });
      setPhase({ kind: "data", data });
    } catch {
      setPhase({ kind: "hidden" });
    }
  }, []);

  useEffect(() => {
    if (phase.kind === "loading" || !focusHead.current) return;
    focusHead.current = false;
    if (phase.kind === "data") headRef.current?.focus();
  }, [phase]);

  const reloadAfterRegister = useCallback(() => {
    focusHead.current = true;
    void load();
  }, [load]);

  useEffect(() => {
    if (preview || !registered || started.current) return;
    started.current = true;
    void load();
  }, [preview, registered, load]);

  async function reanalyze(channelId: string) {
    if (busy || preview) return;
    setBusy(true);
    setError(null);
    const r = await postRegister(channelId);
    if ("redirect" in r) return; // 로그인 화면으로 이동 중
    setBusy(false);
    if (r.ok) reloadAfterRegister();
    else setError(r.error);
  }

  if (phase.kind === "hidden") return null;
  if (phase.kind === "loading") return <FitSkeleton className={className} />;

  const data = phase.data;

  if (data.state === "unregistered") {
    return (
      <section aria-labelledby={headId} className={cx(CARD, className)}>
        <H id={headId} ref={headRef} tabIndex={-1} className={HEAD}>내 채널에 맞는 주제</H>
        <RegisterChannelForm
          preview={!!preview}
          initialError={preview?.view === "register-error" ? preview.error : undefined}
          onRegistered={reloadAfterRegister}
        />
      </section>
    );
  }

  if (data.state === "expired") {
    return (
      <section aria-labelledby={headId} className={cx(CARD, className)}>
        <H id={headId} ref={headRef} tabIndex={-1} className={HEAD}>내 채널에 맞는 주제</H>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p className="text-body-sm text-fg-2">30일이 지나 채널 정보를 다시 읽어야 해요.</p>
          <button
            type="button"
            onClick={() => reanalyze(data.channel.id)}
            aria-disabled={busy || undefined}
            aria-busy={busy || undefined}
            className={cx(buttonClass({ variant: "secondary", size: "sm" }), "pointer-coarse:h-11", BUSY_LOOK)}
          >
            {busy ? <span aria-hidden="true" className={SPINNER} /> : null}
            다시 분석
          </button>
        </div>
        {error ? <ErrorText>{registerErrorMessage(error)}</ErrorText> : null}
      </section>
    );
  }

  if (data.state !== "ready") return null;

  const name = data.channel.title?.trim() || "내 채널";
  const title = mode === "top" ? `${name} 주제와 가까운, 이번 주 많이 나온 주제` : `${name} 주제와 가까운 급상승 키워드`;
  const locked = !!data.nextAt;

  return (
    <section aria-labelledby={headId} className={cx(CARD, className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <H id={headId} ref={headRef} tabIndex={-1} className={cx(HEAD, "break-keep")}>{title}</H>
        <div className="flex flex-wrap items-center gap-x-2">
          {locked ? (
            <span id={captionId} className="text-caption text-fg-3">{kstMonthDay(data.nextAt!)}부터 다시 분석할 수 있어요</span>
          ) : null}
          <button
            type="button"
            onClick={() => reanalyze(data.channel.id)}
            disabled={locked}
            aria-disabled={busy || undefined}
            aria-busy={busy || undefined}
            aria-describedby={locked ? captionId : undefined}
            className={TEXT_BUTTON}
          >
            {busy ? <span aria-hidden="true" className={SPINNER} /> : null}
            다시 분석
          </button>
        </div>
      </div>
      {error ? <ErrorText>{registerErrorMessage(error)}</ErrorText> : null}

      {data.items.length ? (
        <ul className="mt-2 divide-y divide-line-soft">
          {data.items.map((t) => (
            <li key={t.term} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
              <span className="break-keep text-body-sm font-semibold text-fg">{t.term}</span>
              {!t.covered ? <span className={badgeClass()}>아직 안 다룸</span> : null}
              <span className="w-full text-body-sm text-fg-3 md:w-auto">{t.reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-t border-line-soft pt-3 text-body-sm text-fg-3">지금은 내 채널 주제와 가까운 주제어가 없어요.</p>
      )}

      {data.method === "ai" ? (
        <AiNotice className="mt-3" />
      ) : (
        <>
          <p className="mt-3 text-caption text-fg-3">
            {data.aiReady ? "단어가 겹치는 주제만 보여 드려요." : "AI 준비 중이라 단어가 겹치는 주제만 보여 드려요."}
          </p>
          <DerivedNotice what="겹치는 주제 판정은" />
        </>
      )}
    </section>
  );
}
