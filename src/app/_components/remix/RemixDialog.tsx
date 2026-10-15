"use client";
/* eslint-disable @next/next/no-img-element -- YouTube 썸네일 원본 URL */
/**
 * B5 '이 영상처럼 기획하기' 대화상자. 근거: docs/trend-dev/spec.md 2.3·3.5 · DESIGN.md 6.5·6.9·6.11·6.13 · roadmap T7
 *
 *   <RemixDialog video={v} onClose={close} />                       단독 대화상자(RemixProvider·RemixButton 이 연다)
 *   <RemixPanel video={v} titleId={id} onBack={…} onClose={…} />     VideoModal 안에서 내용만 바꿀 때
 *
 * - 크기는 VideoModal 과 같다: 768 미만 전체 화면, 768 이상 max-w-xl, 본문 overflow-y-auto.
 * - 대화상자 안 흰 면 버튼은 '초안 만들기' 하나. 복사는 고스트 버튼.
 * - 남은 횟수는 GET /api/ai/usage(remix). available false → 주 버튼 대신 AiLockedButton.
 *   limit 0(Free) → 주 버튼 disabled + 요금제 안내, 0회 남음 → disabled + 다시 쓸 수 있는 시각(빨강 캡션).
 * - 요청 중: 버튼 안 스피너(size-4) + aria-busy + disabled + '보통 10초 안팎 걸려요'. 두 번 눌러 2회 차감되지 않게.
 * - 닫았다 다시 열면 GET /api/ai/remix/latest 로 같은 영상의 오늘 결과를 먼저 보여 준다.
 *   요청 중에 닫아도 요청은 끝까지 간다(서버가 저장). 같은 영상을 다시 열면 진행 중인 요청을 기다린다.
 * - 실패는 charged 로 나눈 ActionToast(spec 3.5 문구). 성공 결과 아래 AiNotice.
 * - preview 를 넘기면 네트워크를 쓰지 않고 그 상태를 그린다(로컬 고정 화면 /ux-preview/trend-remix).
 */
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { cx } from "@/components/ui/button";
import { Field, INPUT } from "@/components/ui/field";
import { CloseIcon } from "@/components/ui/icons";
import { AiLockedButton, AiNotice } from "@/components/ui/notice";
import { ActionToast, BTN_BASE, BTN_GHOST, type ToastData } from "@/app/search/_components/SelectionBar";
import { REMIX_LIMITS, retryCaption, type RemixResult, type RemixVideo } from "@/lib/trend/remix-schema";

export type RemixUsage = { used: number; limit: number; available: boolean };

/** 로컬 고정 화면용 상태. 넘기면 fetch 를 하지 않는다 */
export type RemixPreview = {
  usage: RemixUsage | "unauth";
  topic?: string;
  audience?: string;
  busy?: boolean;
  result?: RemixResult | null;
  toast?: "temp" | "charged" | null;
  /** 다시 쓸 수 있는 시각 계산 기준(ms) */
  now?: number;
};

type UsageState = RemixUsage | "loading" | "error" | "unauth";
type ApiResult = { status: number; body: Record<string, unknown> };

/** Pro(하루 20회) 미만이면 0회일 때 '요금제 보기 →'. usage API 가 플랜 이름을 주지 않아 한도로 판단한다 */
const PRO_DAILY_LIMIT = 20;

const MSG_TEMP = "초안을 만들지 못했습니다. 횟수는 차감되지 않았습니다.";
const MSG_CHARGED = "초안을 만들지 못했습니다. 이번 시도는 사용 횟수에 포함됐어요.";

/** 같은 영상의 진행 중인 요청과 그 입력값(대화상자를 닫았다 다시 열어도 이어 받고, 실패하면 같은 입력으로 다시 시도한다) */
const inflight = new Map<string, { p: Promise<ApiResult>; topic: string; audience: string }>();

const SUBTITLE = "text-caption font-semibold text-fg-3";
const INNER_BOX = "rounded-control border border-line bg-surface";
const TEXT_LINK = "inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2";
const SPINNER = "size-4 animate-spin rounded-full border-2 border-line-hover border-t-accent-ink";

/** 대화상자 크기(VideoModal 과 같은 클래스) */
export const REMIX_DIALOG_CLASS = cx(
  "overflow-y-auto overscroll-contain",
  "max-md:m-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-5 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]",
  "md:max-h-[calc(100dvh-2rem)] md:max-w-xl",
);

const two = (n: number) => String(n).padStart(2, "0");

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const j = await res.json();
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function CopyButton({ text, name }: { text: string; name: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={copied ? `${name} 복사됨` : `${name} 복사`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className={cx(BTN_GHOST, "h-9 shrink-0 px-2.5 text-caption pointer-coarse:h-11")}
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

function ResultView({ result }: { result: RemixResult }) {
  return (
    <section aria-label="기획 초안" className="mt-6 border-t border-line pt-6">
      <div className="space-y-6">
        <div>
          <h3 className={SUBTITLE}>제목 후보</h3>
          <ol className={cx(INNER_BOX, "mt-2 divide-y divide-line-soft")}>
            {result.titles.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-1 pl-3 pr-1">
                <span className="tnum shrink-0 text-caption font-semibold text-fg-3">{two(i + 1)}</span>
                <p className="min-w-0 flex-1 py-1.5 text-body-sm text-fg-1">{t}</p>
                <CopyButton text={t} name={`제목 후보 ${two(i + 1)}`} />
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className={SUBTITLE}>썸네일 문구</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {result.thumbnail_texts.map((t, i) => (
              <li key={i} className="inline-flex items-center rounded-md border border-line-strong px-2 py-1 text-body-sm font-semibold text-fg-1">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className={SUBTITLE}>인트로 30초</h3>
            <CopyButton text={result.intro_30s} name="인트로 30초" />
          </div>
          <p className={cx(INNER_BOX, "mt-1 whitespace-pre-line p-4 text-body-sm text-fg-2")}>{result.intro_30s}</p>
        </div>

        <div>
          <h3 className={SUBTITLE}>이 영상에서 가져온 점</h3>
          <ul className="mt-2 space-y-1.5 text-body-sm text-fg-2">
            {result.why_it_worked.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true" className="text-fg-3">·</span>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {result.cautions.length > 0 && (
          <div>
            <h3 className={SUBTITLE}>주의할 점</h3>
            <ul className="mt-2 space-y-1.5 text-body-sm text-fg-2">
              {result.cautions.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="text-fg-3">·</span>
                  <span className="min-w-0">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <AiNotice className="mt-4" />
    </section>
  );
}

export function RemixPanel({
  video,
  titleId,
  onClose,
  onBack,
  preview,
}: {
  video: RemixVideo;
  /** 대화상자 aria-labelledby 와 잇는 제목 id */
  titleId: string;
  onClose: () => void;
  /** VideoModal 안에서 열었을 때 '← 영상 정보로' */
  onBack?: () => void;
  preview?: RemixPreview;
}) {
  const formId = useId();
  const [usage, setUsage] = useState<UsageState>(preview ? preview.usage : "loading");
  const [topic, setTopic] = useState(preview?.topic ?? "");
  const [audience, setAudience] = useState(preview?.audience ?? "");
  const [busy, setBusy] = useState(!!preview?.busy);
  const [result, setResult] = useState<RemixResult | null>(preview?.result ?? null);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const mounted = useRef(true);
  const toastSeq = useRef(0);
  const topicRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  /** 처음 열 때 한 번만 본다(부모가 onBack 을 렌더마다 새로 만들어도 포커스·스크롤을 다시 옮기지 않게) */
  const openedInline = useRef(!!onBack);
  /** 이어받은 요청의 '다시 시도'가 그때의 입력값으로 부르게 최신 submit 을 둔다 */
  const submitRef = useRef<() => void>(() => {});

  const showToast = useCallback((tone: "temp" | "charged", retry?: () => void) => {
    toastSeq.current += 1;
    setToast({
      id: toastSeq.current,
      tone: "error",
      message: tone === "temp" ? MSG_TEMP : MSG_CHARGED,
      action: tone === "temp" && retry ? { label: "다시 시도", onClick: retry } : undefined,
    });
  }, []);

  // 고정 화면의 토스트
  useEffect(() => {
    if (preview?.toast) showToast(preview.toast, () => {});
  }, [preview?.toast, showToast]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // VideoModal 안에서 바꿔 열면 한 번만 맨 위로 올리고 '영상 정보로' 에 포커스
  useEffect(() => {
    if (!openedInline.current) return;
    const head = headRef.current;
    head?.closest("dialog")?.scrollTo({ top: 0 });
    head?.querySelector<HTMLElement>("[data-remix-back]")?.focus();
  }, []);

  const applyResponse = useCallback(
    (res: ApiResult, retry: () => void) => {
      const b = res.body;
      const remaining = typeof b.remaining === "number" ? b.remaining : null;
      setUsage((u) => (typeof u === "object" && remaining !== null ? { ...u, used: Math.max(0, u.limit - remaining) } : u));
      if (res.status === 200 && b.data) {
        setResult(b.data as RemixResult);
        return;
      }
      if (res.status === 401) {
        setUsage("unauth");
        return;
      }
      if (res.status === 429) {
        const used = Number(b.used) || 0;
        const limit = Number(b.limit) || 0;
        setUsage((u) => ({ used, limit, available: typeof u === "object" ? u.available : true }));
        return;
      }
      if (res.status === 400 && b.error === "invalid_topic") {
        setTopicError("내 채널 주제를 적어 주세요.");
        topicRef.current?.focus();
        return;
      }
      // 400(영상 값 형식 오류 등)은 다시 보내도 같아서 '다시 시도'를 달지 않는다
      const canRetry = b.charged !== true && res.status !== 400;
      showToast(b.charged === true ? "charged" : "temp", canRetry ? retry : undefined);
    },
    [showToast],
  );

  const follow = useCallback(
    async (p: Promise<ApiResult>, retry: () => void) => {
      setBusy(true);
      setToast(null);
      const res = await p;
      if (!mounted.current) return;
      setBusy(false);
      applyResponse(res, retry);
    },
    [applyResponse],
  );

  const submit = useCallback(() => {
    if (busy || preview) return;
    const t = topic.trim();
    if (!t) {
      setTopicError("내 채널 주제를 적어 주세요.");
      topicRef.current?.focus();
      return;
    }
    setTopicError(null);
    const p: Promise<ApiResult> = fetch("/api/ai/remix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video: {
          videoId: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount,
          subscriberCount: video.subscriberCount,
          durationSec: video.durationSec,
          publishedAt: video.publishedAt,
        },
        topic: t,
        audience: audience.trim(),
      }),
    })
      .then(async (r) => ({ status: r.status, body: await readJson(r) }))
      .catch(() => ({ status: 0, body: { charged: false } }))
      .finally(() => inflight.delete(video.videoId));
    inflight.set(video.videoId, { p, topic: t, audience: audience.trim() });
    void follow(p, submit);
  }, [busy, preview, topic, audience, video, follow]);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  // 처음 열 때: 진행 중인 요청을 이어받고, 남은 횟수를 읽은 뒤 로그인이 확인되면 오늘 결과를 읽는다
  useEffect(() => {
    if (preview) return;
    let alive = true;
    const running = inflight.get(video.videoId);
    if (running) {
      setTopic(running.topic);
      setAudience(running.audience);
      void follow(running.p, () => submitRef.current());
    }

    const loadLatest = () =>
      fetch(`/api/ai/remix/latest?videoId=${encodeURIComponent(video.videoId)}`, { cache: "no-store" })
        .then(async (r) => {
          if (!alive || !r.ok) return;
          const j = await readJson(r);
          if (!j.data) return;
          setResult((cur) => cur ?? (j.data as RemixResult));
          const input = j.input as { topic?: string; audience?: string } | null;
          if (input) {
            setTopic((cur) => cur || input.topic || "");
            setAudience((cur) => cur || input.audience || "");
          }
        })
        .catch(() => {});

    // 비로그인이면 latest 도 401 이라 usage 결과를 보고 보낸다
    fetch("/api/ai/usage", { cache: "no-store" })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) return setUsage("unauth");
        if (!r.ok) {
          setUsage("error");
        } else {
          const j = await readJson(r);
          if (!alive) return;
          const remix = j.remix as { used?: number; limit?: number } | undefined;
          setUsage({ used: Number(remix?.used) || 0, limit: Number(remix?.limit) || 0, available: j.available === true });
        }
        if (!running) void loadLatest();
      })
      .catch(() => alive && setUsage("error"));
    return () => {
      alive = false;
    };
    // 영상이 바뀔 때만 다시 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const now = preview?.now ?? Date.now();
  const u = typeof usage === "object" ? usage : null;
  const remaining = u ? Math.max(0, u.limit - u.used) : null;
  const locked = u ? !u.available : false;
  const noPlan = u ? u.limit <= 0 : false;
  const exhausted = u ? !noPlan && remaining === 0 : false;
  const disabled = busy || usage === "loading" || usage === "unauth" || noPlan || exhausted;

  return (
    <>
      <div ref={headRef} className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            data-remix-back=""
            onClick={onBack}
            className="-ml-0.5 inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg"
          >
            <span aria-hidden="true">←</span>영상 정보로
          </button>
        ) : (
          <p className="text-caption text-fg-3">기획 초안</p>
        )}
        <button type="button" onClick={onClose} aria-label="닫기" className={cx(BTN_GHOST, "-mr-2 size-11 shrink-0")}>
          <CloseIcon size={20} />
        </button>
      </div>

      <h2 id={titleId} className="mt-2 text-lead font-bold leading-[1.45] text-fg">
        이 영상처럼 기획하기
      </h2>

      {/* 원본 영상 한 줄 */}
      <div className="mt-4 flex items-center gap-3">
        <span className="block w-24 shrink-0 overflow-hidden rounded-control bg-surface">
          {video.thumbnail ? (
            <img src={video.thumbnail} alt="" width={192} height={108} decoding="async" className="aspect-video w-full object-cover" />
          ) : (
            <span className="block aspect-video w-full" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-body-sm font-medium leading-[1.5] text-fg-1">{video.title}</p>
          <p className="mt-0.5 truncate text-caption text-fg-3">{video.channelTitle}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4" aria-busy={busy || undefined}>
        <Field id={`${formId}-topic`} label="내 채널 주제" hint="필수 · 60자 이내" error={topicError}>
          {(control) => (
            <input
              {...control}
              ref={topicRef}
              type="text"
              required
              value={topic}
              maxLength={REMIX_LIMITS.topic}
              placeholder="예: 30대 직장인 재테크"
              autoComplete="off"
              onChange={(e) => {
                setTopic(e.target.value);
                if (topicError) setTopicError(null);
              }}
              className={INPUT}
            />
          )}
        </Field>
        <Field id={`${formId}-audience`} label="보는 사람 (선택)" hint="40자 이내">
          {(control) => (
            <input
              {...control}
              type="text"
              value={audience}
              maxLength={REMIX_LIMITS.audience}
              placeholder="예: 사회초년생"
              autoComplete="off"
              onChange={(e) => setAudience(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>

        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {locked ? (
              <AiLockedButton />
            ) : (
              <button
                type="submit"
                disabled={disabled}
                aria-busy={busy || undefined}
                className={cx(BTN_BASE, "h-11 bg-accent px-5 text-ui font-bold text-accent-ink hover:bg-accent-hover active:bg-accent-active")}
              >
                {busy && <span aria-hidden="true" className={SPINNER} />}
                {busy ? "초안 만드는 중" : "초안 만들기"}
              </button>
            )}
            {u && !locked && !noPlan && (
              <p className="tnum text-caption text-fg-3">오늘 {remaining}회 남음</p>
            )}
          </div>

          {busy && (
            <p role="status" className="mt-2 text-caption text-fg-3">
              보통 10초 안팎 걸려요
            </p>
          )}
          {!locked && noPlan && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <p className="text-caption text-fg-3">영상 기획 초안은 Starter 이상 요금제에서 쓸 수 있어요.</p>
              <Link href="/pricing" className={TEXT_LINK}>
                요금제 보기 <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
          {!locked && exhausted && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <p className="text-caption text-negative">{retryCaption(now)}</p>
              {u && u.limit < PRO_DAILY_LIMIT && (
                <Link href="/pricing" className={TEXT_LINK}>
                  요금제 보기 <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          )}
          {usage === "unauth" && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <p className="text-caption text-fg-3">로그인하고 쓸 수 있어요.</p>
              <Link href="/sign-in" className={TEXT_LINK}>
                로그인 <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </form>

      {result && <ResultView result={result} />}

      <ActionToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

export function RemixDialog({ video, onClose, preview }: { video: RemixVideo; onClose: () => void; preview?: RemixPreview }) {
  const titleId = useId();
  return (
    <Dialog open onClose={onClose} labelledBy={titleId} className={REMIX_DIALOG_CLASS}>
      <RemixPanel video={video} titleId={titleId} onClose={onClose} preview={preview} />
    </Dialog>
  );
}
