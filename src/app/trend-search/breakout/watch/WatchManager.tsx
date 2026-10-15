"use client";

/**
 * 관심 목록 관리 칸(C7, roadmap T9) + 열면 한 번 읽음 처리. 근거: docs/trend-dev/spec.md 3.7 · DESIGN.md 6.5 · 6.6 · 6.9 · 6.30
 *
 *   <WatchManager initial={watchList} heading="h2" />             관심 키워드 입력·칩 · 관심 채널 목록 · 'n / m개 사용'
 *   <WatchManager initial={watchList} preview initialError="limit" />   로컬 미리보기(요청 없이 표시만 바뀜)
 *   <MarkNotificationsRead />                                     마운트 때 POST /api/notifications/read 한 번
 *
 * - 키워드: INPUT + 보조 버튼 '추가'. 등록된 것은 칩 + 지우기 ×(aria-label '{키워드} 삭제'). 정규화·길이는 notify-match.ts normalizeWatch.
 * - 채널: 아바타 + 채널명(유튜브로 나감 .ext) + 지우기. 이름이 비워졌으면(30일 지나 purge, 최근 수집에도 없음) '채널 열기' 외부 링크만.
 *   채널 추가는 지금 크는 채널·영상 탭의 '관심 등록'에서만(채널 주소 입력은 YouTube 쿼터를 써서 범위 밖) → 캡션으로 알린다.
 * - 한도 초과: 입력 아래 ErrorText '{플랜}{은/는} {n}개까지 등록할 수 있어요.' + Pro 미만이면 글자 링크 '요금제 보기 →'.
 * - 저장은 서버(POST·DELETE /api/watch)가 정하고, 응답의 목록으로 화면을 바꾼다(낙관적 갱신 없음, 누르는 동안 버튼 잠금).
 * - 지우기 × 를 누르면 포커스를 같은 자리의 다음 ×(없으면 이전 ×, 목록이 비면 키워드 입력칸)로 옮긴다.
 * - 채널을 지우면 WatchChannelButton 저장소에도 알린다(rememberWatched). 다른 탭으로 돌아갔을 때 오래된 '등록됨'이 남지 않게.
 * - aria-invalid 와 빨간 테두리는 입력값 오류(invalid)일 때만. 한도·저장 실패는 오류 문장만 보이고 입력칸은 그대로.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { buttonClass, cx } from "@/components/ui/button";
import { ErrorText, INPUT } from "@/components/ui/field";
import { CloseIcon } from "@/components/ui/icons";
import { displayWatch, normalizeWatch, watchLimitMessage, WATCH_TERM_MAX, WATCH_TERM_MIN } from "@/lib/trend/notify-match";
import type { WatchChannel, WatchList } from "@/lib/trend/watch";
import { rememberWatched } from "../_components/WatchChannelButton";

type ErrorState = { kind: "limit"; limit: number; planName: string } | { kind: "invalid" } | { kind: "failed" } | null;

const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;

/** 칸 제목(watch-view.tsx COL_HEAD 와 같은 값) */
const COL_HEAD = "text-body font-semibold text-fg";

/** 등록된 키워드 칩(DESIGN 6.6 칩 모양, 누르는 곳은 안쪽 × 버튼) */
const KW_CHIP =
  "inline-flex h-10 max-w-full items-center rounded-control border border-line pl-3 text-caption font-medium text-fg-2 sm:h-9 pointer-coarse:h-11";
/** 키워드 지우기: 칩 테두리까지 덮는 높이(터치 기기 44px), 너비 36px(터치 기기 44px) */
const KW_REMOVE =
  "-my-px -mr-px inline-flex h-[calc(100%+2px)] w-9 shrink-0 pointer-coarse:w-11 items-center justify-center rounded-r-control text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-offset-[-2px]";
/** 채널 지우기(44px, 1024 이상 36px, 터치 기기 44px). 1024 미만은 행 오른쪽 56px 를 비워 카카오 버튼 자리와 겹치지 않게 한다 */
const CH_REMOVE =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg lg:size-9 pointer-coarse:size-11";

function ExtIcon() {
  return (
    <svg className="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** 채널 아바타 32px(DESIGN 6.30). 빈 자리는 surface-3 + 첫 글자, 그림이 깨지면 첫 글자가 보인다 */
function Avatar({ c }: { c: WatchChannel }) {
  return (
    <span aria-hidden="true" className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-caption font-semibold text-fg-2">
      {Array.from(c.title?.trim() ?? "")[0] ?? ""}
      {c.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.thumb} alt="" width={32} height={32} loading="lazy" decoding="async" className="absolute inset-0 size-full rounded-full object-cover" />
      ) : null}
    </span>
  );
}

/** 관심 목록 탭을 열면 안 읽은 알림을 한 번 읽음 처리한다(화면 표시는 그대로, 다음 방문부터 일반 굵기) */
export function MarkNotificationsRead() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/notifications/read", { method: "POST" }).catch(() => {
      /* 실패해도 다음 방문 때 다시 보낸다 */
    });
  }, []);
  return null;
}

export function WatchManager({
  initial,
  preview = false,
  initialError,
  heading = "h2",
}: {
  initial: WatchList;
  preview?: boolean;
  initialError?: "limit";
  heading?: "h2" | "h3";
}) {
  const H = heading;
  const uid = useId();
  const inputId = `${uid}-term`;
  const errorId = `${uid}-term-error`;
  const [watch, setWatch] = useState<WatchList>(initial);
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorState>(initialError === "limit" ? { kind: "limit", limit: initial.limit, planName: initial.planName } : null);

  const empty = watch.keywords.length === 0 && watch.channels.length === 0;

  /* 지운 뒤 포커스 옮기기: 지운 자리를 적어 두고, 요청이 끝난 뒤(busy 풀림) 그 자리(없으면 이전)의 × 나 입력칸으로.
     실패해서 항목이 남아 있으면 그 × 로 되돌린다(누르는 동안 disabled 라 포커스가 빠졌을 수 있다) */
  const inputRef = useRef<HTMLInputElement>(null);
  const kwRemoveRefs = useRef(new Map<string, HTMLButtonElement>());
  const chRemoveRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<{ list: "keyword" | "channel"; key: string; index: number } | null>(null);
  useLayoutEffect(() => {
    const p = pendingFocus.current;
    if (!p || busy) return;
    pendingFocus.current = null;
    const keys = p.list === "keyword" ? watch.keywords.map((k) => k.termNorm) : watch.channels.map((c) => c.channelId);
    const refs = p.list === "keyword" ? kwRemoveRefs.current : chRemoveRefs.current;
    const key = keys.includes(p.key) ? p.key : keys.length ? keys[Math.min(p.index, keys.length - 1)] : null;
    const target = key != null ? refs.get(key) : null;
    (target ?? inputRef.current)?.focus();
  }, [watch, busy]);

  /** 서버 응답 → 화면. 성공이면 목록을 바꾸고 true */
  async function send(method: "POST" | "DELETE", body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch("/api/watch", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) {
        window.location.href = `/sign-in?next=${encodeURIComponent("/trend-search/breakout/watch")}`;
        return false;
      }
      const data = (await res.json().catch(() => null)) as { watch?: WatchList; error?: string; limit?: number; planName?: string } | null;
      if (res.ok && data?.watch) {
        setWatch(data.watch);
        setError(null);
        return true;
      }
      if (res.status === 409 && data?.error === "limit") {
        setError({ kind: "limit", limit: data.limit ?? watch.limit, planName: data.planName ?? watch.planName });
      } else if (res.status === 400) {
        setError({ kind: "invalid" });
      } else {
        setError({ kind: "failed" });
      }
      return false;
    } catch {
      setError({ kind: "failed" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** 미리보기: 서버와 같은 규칙으로 화면만 바꾼다 */
  function previewAdd(norm: string, raw: string): boolean {
    if (watch.keywords.some((k) => k.termNorm === norm)) return true;
    if (watch.used >= watch.limit) {
      setError({ kind: "limit", limit: watch.limit, planName: watch.planName });
      return false;
    }
    const keywords = [...watch.keywords, { term: displayWatch(raw), termNorm: norm }];
    setWatch({ ...watch, keywords, used: keywords.length + watch.channels.length });
    setError(null);
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const norm = normalizeWatch(term);
    if (!norm) {
      setError({ kind: "invalid" });
      return;
    }
    const ok = preview ? previewAdd(norm, term) : await send("POST", { type: "keyword", term });
    if (ok) setTerm("");
  }

  async function removeKeyword(termNorm: string) {
    if (busy) return;
    const index = watch.keywords.findIndex((k) => k.termNorm === termNorm);
    pendingFocus.current = { list: "keyword", key: termNorm, index: Math.max(0, index) };
    if (preview) {
      const keywords = watch.keywords.filter((k) => k.termNorm !== termNorm);
      setWatch({ ...watch, keywords, used: keywords.length + watch.channels.length });
      setError(null);
      return;
    }
    await send("DELETE", { type: "keyword", key: termNorm });
  }

  async function removeChannel(channelId: string) {
    if (busy) return;
    const index = watch.channels.findIndex((c) => c.channelId === channelId);
    pendingFocus.current = { list: "channel", key: channelId, index: Math.max(0, index) };
    if (preview) {
      const channels = watch.channels.filter((c) => c.channelId !== channelId);
      setWatch({ ...watch, channels, used: watch.keywords.length + channels.length });
      setError(null);
      rememberWatched(channelId, false);
      return;
    }
    if (await send("DELETE", { type: "channel", key: channelId })) rememberWatched(channelId, false);
  }

  const errorText =
    error?.kind === "limit" ? (
      <>
        {watchLimitMessage(error.planName, error.limit)}
        {watch.showPricing ? (
          <>
            {" "}
            <Link href="/pricing" className="whitespace-nowrap font-semibold text-fg transition-colors duration-150 hover:text-fg-2">
              요금제 보기 <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : null}
      </>
    ) : error?.kind === "invalid" ? (
      `키워드는 공백을 빼고 ${WATCH_TERM_MIN}~${WATCH_TERM_MAX}자로 입력해 주세요.`
    ) : error?.kind === "failed" ? (
      "저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요."
    ) : null;

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby={`${uid}-kw`}>
        <H id={`${uid}-kw`} className={COL_HEAD}>관심 키워드</H>
        <form onSubmit={onSubmit} className="mt-3 flex gap-2" noValidate>
          <label htmlFor={inputId} className="sr-only">관심 키워드</label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              if (error && error.kind !== "limit") setError(null);
            }}
            placeholder="예: 가을 차박"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={60}
            aria-invalid={error?.kind === "invalid" ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cx(INPUT, "min-w-0 flex-1")}
          />
          <button type="submit" disabled={busy} aria-busy={busy || undefined} className={buttonClass({ variant: "secondary", size: "md" })}>
            추가
          </button>
        </form>
        {errorText ? <ErrorText id={errorId}>{errorText}</ErrorText> : null}

        {watch.keywords.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="등록한 관심 키워드">
            {watch.keywords.map((k) => (
              <li key={k.termNorm} className={KW_CHIP}>
                <span className="truncate">{k.term}</span>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) kwRemoveRefs.current.set(k.termNorm, el);
                    else kwRemoveRefs.current.delete(k.termNorm);
                  }}
                  onClick={() => removeKeyword(k.termNorm)}
                  disabled={busy}
                  aria-label={`${k.term} 삭제`}
                  className={KW_REMOVE}
                >
                  <CloseIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {empty ? <p className="mt-3 text-body-sm text-fg-3">관심 키워드나 채널을 등록해 보세요.</p> : null}
      </section>

      <section aria-labelledby={`${uid}-ch`}>
        <H id={`${uid}-ch`} className={COL_HEAD}>관심 채널</H>
        {watch.channels.length ? (
          <ul className="mt-3 divide-y divide-line-soft border-y border-line">
            {watch.channels.map((c) => {
              const name = c.title?.trim() || null;
              return (
                <li key={c.channelId} className="flex items-center gap-3 py-1.5 max-lg:pr-14">
                  <Avatar c={c} />
                  <a
                    href={channelUrl(c.channelId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(
                      "flex min-h-11 min-w-0 flex-1 items-center gap-1 transition-colors duration-150 hover:text-fg lg:min-h-9",
                      name ? "text-ui font-medium text-fg-1" : "text-body-sm text-fg-2",
                    )}
                  >
                    <span className="truncate">{name ?? "채널 열기"}</span>
                    <ExtIcon />
                    <span className="sr-only"> (새 창)</span>
                  </a>
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) chRemoveRefs.current.set(c.channelId, el);
                      else chRemoveRefs.current.delete(c.channelId);
                    }}
                    onClick={() => removeChannel(c.channelId)}
                    disabled={busy}
                    aria-label={`${name ?? "이 채널"} 삭제`}
                    className={CH_REMOVE}
                  >
                    <CloseIcon size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="mt-3 text-caption text-fg-3">채널은 지금 크는 채널·영상 탭에서 관심 등록을 눌러 추가해요.</p>
      </section>

      <p className="tnum text-caption text-fg-3">
        <span className="font-semibold text-fg-2">{watch.used}</span> / {watch.limit}개 사용
      </p>
    </div>
  );
}

