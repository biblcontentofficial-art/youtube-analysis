"use client";

/**
 * 관심 채널 등록 토글(C7, roadmap T9). '관심 등록' ↔ '등록됨'. 누르면 POST·DELETE /api/watch.
 * 근거: docs/trend-dev/spec.md 3.2·3.7 · DESIGN.md 6.5 고스트 버튼 · 6.13 토스트
 *
 *   <WatchChannelButton channel={{ channelId, title, thumb }} watched={ids.includes(channelId)} variant="ghost" />  1024 이상 표(h-9)
 *   <WatchChannelButton ... variant="text" />                                                                        1024 미만 목록(h-11 터치 영역)
 *   <WatchChannelButton ... preview />                                                                               로컬 미리보기(요청 없이 표시만 바뀜)
 *
 * - 같은 채널 버튼이 표·목록 두 곳에 있어도(폭에 따라 하나만 보임) 상태를 같이 쓴다(모듈 안 작은 저장소).
 * - 저장소 값은 '이 브라우저 탭에서 마지막으로 확인한 등록 여부'다. 여기 토글과 관심 목록의 채널 삭제(rememberWatched)가 모두 적는다.
 *   서버 값(watched)이 저장소 값과 같아지면 지운다(그 뒤로는 서버 값을 따른다). 토글이 성공하면 router.refresh() 로
 *   서버 값을 다시 받고 라우터 캐시를 비운다(다른 탭으로 옮겨 가도 30초 캐시의 오래된 값이 나오지 않게).
 * - 등록됨은 흰 글자(선택 표시). 누르면 등록을 푼다. 상태는 보이는 글자가 말하고, 채널 이름은 sr-only 로 덧붙인다.
 * - 한도 초과·실패는 토스트 하나(SelectionBar 의 ActionToast). 한도 문구는 플랜 이름으로 채운다('Free는 3개까지 등록할 수 있어요.'),
 *   Pro 미만이면 동작 '요금제 보기'. 한 번에 토스트 하나만(마지막으로 누른 버튼이 띄운다).
 * - 비로그인(401)은 로그인 화면으로 보낸다(이 버튼은 로그인 뒤 화면에만 있으므로 세션 만료 때만 생긴다).
 */
import { useEffect, useId, useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui/button";
import { ActionToast, type ToastData } from "@/app/search/_components/SelectionBar";
import { watchLimitMessage } from "@/lib/trend/notify-match";

export type WatchChannelInput = { channelId: string; title: string | null; thumb: string | null };

/* ── 모듈 안 저장소: 채널별 등록 상태(이 탭에서 마지막으로 확인한 값, 서버 값이 따라오면 지움) + 토스트 하나 ── */
const overrides = new Map<string, boolean>();
let toast: { owner: string; data: ToastData } | null = null;
let toastSeq = 0;
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const snapshot = () => version;

/** 관심 목록(WatchManager)에서 채널 등록을 바꿨을 때 부른다. 다른 탭의 버튼이 오래된 서버 값 대신 이 값을 보인다 */
export function rememberWatched(channelId: string, value: boolean) {
  overrides.set(channelId, value);
  emit();
}

/** 요청 실패 때 누르기 전 값으로 되돌린다(누르기 전에 저장소 값이 없었으면 지운다) */
function restore(channelId: string, prev: boolean | undefined) {
  if (prev === undefined) overrides.delete(channelId);
  else overrides.set(channelId, prev);
}

function showToast(owner: string, data: Omit<ToastData, "id">) {
  toastSeq++;
  toast = { owner, data: { ...data, id: toastSeq } };
  emit();
}

const PRICING_PLANS = new Set(["Free", "Starter", "팀비블"]);

/** 1024 이상 표: 고스트 버튼 36px(터치 기기 44px) */
const GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-control px-3 text-body-sm font-semibold transition-colors duration-150 hover:bg-surface-2 hover:text-fg pointer-coarse:h-11 disabled:opacity-40";
/** 1024 미만 목록: 글자 버튼, 높이 44px(터치). 글자를 위 줄 글자와 맞추려면 부르는 쪽이 -ml-2 를 넘긴다 */
const TEXT =
  "inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-control px-2 text-caption font-semibold transition-colors duration-150 hover:text-fg disabled:opacity-40";

export function WatchChannelButton({
  channel,
  watched,
  variant,
  preview = false,
  className,
}: {
  channel: WatchChannelInput;
  /** 서버에서 읽은 등록 여부 */
  watched: boolean;
  variant: "ghost" | "text";
  /** 로컬 미리보기: 요청을 보내지 않고 표시만 바꾼다 */
  preview?: boolean;
  className?: string;
}) {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const owner = useId();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const on = overrides.get(channel.channelId) ?? watched;
  const name = channel.title?.trim() || "채널";

  // 서버 값이 저장소 값을 따라왔으면 저장소 값을 지운다(같은 값이라 화면은 그대로). 요청 중에는 두지 않는다
  useEffect(() => {
    if (!busy && overrides.get(channel.channelId) === watched) overrides.delete(channel.channelId);
  }, [busy, watched, channel.channelId]);

  async function toggle() {
    if (busy) return;
    const next = !on;
    if (preview) {
      overrides.set(channel.channelId, next);
      emit();
      return;
    }
    setBusy(true);
    const prev = overrides.get(channel.channelId);
    overrides.set(channel.channelId, next); // 먼저 바꾸고 실패하면 되돌린다
    emit();
    try {
      const res = await fetch("/api/watch", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          next
            ? { type: "channel", channelId: channel.channelId, title: channel.title, thumb: channel.thumb }
            : { type: "channel", key: channel.channelId },
        ),
      });
      if (res.status === 401) {
        window.location.href = `/sign-in?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (res.ok) {
        router.refresh();
      } else {
        restore(channel.channelId, prev);
        const body = (await res.json().catch(() => null)) as { error?: string; limit?: number; planName?: string } | null;
        if (res.status === 409 && body?.error === "limit" && body.planName && body.limit != null) {
          showToast(owner, {
            tone: "error",
            message: watchLimitMessage(body.planName, body.limit),
            action: PRICING_PLANS.has(body.planName) ? { label: "요금제 보기", href: "/pricing" } : undefined,
          });
        } else {
          showToast(owner, { tone: "error", message: "관심 등록을 바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
        }
        emit();
      }
    } catch {
      restore(channel.channelId, prev);
      showToast(owner, { tone: "error", message: "관심 등록을 바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  const mine = toast?.owner === owner ? toast.data : null;
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-busy={busy || undefined}
        className={cx(variant === "ghost" ? GHOST : TEXT, on ? "text-fg" : "text-fg-2", className)}
      >
        {on ? "등록됨" : "관심 등록"}
        <span className="sr-only">, {name}</span>
      </button>
      {mine ? (
        <ActionToast
          toast={mine}
          onDismiss={() => {
            if (toast?.owner === owner) {
              toast = null;
              emit();
            }
          }}
        />
      ) : null}
    </>
  );
}
