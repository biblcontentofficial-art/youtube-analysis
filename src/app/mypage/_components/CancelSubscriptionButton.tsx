"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_ACTIONS, DIALOG_DESCRIPTION, DIALOG_TITLE } from "@/components/ui/dialog-classes";
import { buttonClass, cx } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

/** 구독 취소 API 호출. 실패면 throw, 성공이면 이용 가능 기한(없으면 null)을 돌려준다 */
async function cancelSubscriptionRequest(): Promise<{ activeUntil: string | null }> {
  const res = await fetch("/api/cancel-subscription", { method: "POST" });
  if (!res.ok) throw new Error("failed");
  const data = await res.json();
  return { activeUntil: data.activeUntil ?? null };
}

/**
 * cancelled: 이미 해지된 구독이면 버튼을 그리지 않는다.
 * 이 화면에서 취소한 직후에는 router.refresh() 로 다시 그려져도 이 컴포넌트가 같은 자리에 남아 취소 안내가 유지된다.
 * 알림 자리(role=status)는 처음부터 비워 두고 성공하면 문장을 채운다(스크린 리더가 바뀐 내용을 읽게).
 * 성공하면 연 버튼이 사라지므로 포커스를 그 알림으로 옮긴다(body 로 빠지지 않게).
 * 처리 중에는 확인 버튼을 disabled 대신 aria-disabled 로 막아 포커스가 버튼에 남게 한다(실패 뒤에도 같은 버튼).
 * onConfirm: 로컬 미리보기에서 실패 응답을 흉내 낼 때만 넘긴다(기본은 /api/cancel-subscription 호출).
 */
export default function CancelSubscriptionButton({
  cancelled = false,
  onConfirm = cancelSubscriptionRequest,
}: {
  cancelled?: boolean;
  onConfirm?: () => Promise<{ activeUntil: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeUntil, setActiveUntil] = useState<string | null>(null);
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (activeUntil) statusRef.current?.focus();
  }, [activeUntil]);

  function openDialog() {
    setFailed(false);
    setOpen(true);
  }

  async function handleCancel() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const data = await onConfirm();
      setOpen(false);
      if (data.activeUntil) {
        setActiveUntil(data.activeUntil);
      }
      // 위 결제일 카드도 '해지됨'으로 바뀌도록 서버 화면을 다시 그린다(호출 API 는 그대로)
      router.refresh();
    } catch {
      // 실패하면 창을 닫지 않고 창 안에 알린다
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const until = activeUntil
    ? new Date(activeUntil).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  // 비어 있는 동안은 sr-only(절대 배치라 줄 간격·버튼 배치에 영향 없음)
  const status = (
    <p
      ref={statusRef}
      role="status"
      tabIndex={-1}
      className={until ? "basis-full break-keep text-body-sm text-fg-3" : "sr-only"}
    >
      {until && (
        <>
          구독이 취소되었습니다. <span className="text-fg-1">{until}</span>까지 서비스를 계속 이용할 수 있습니다.
        </>
      )}
    </p>
  );

  // 버튼·확인창은 자동 갱신 중인 구독에만. 알림 자리는 늘 같은 위치에 두어 다시 그려져도 같은 요소로 남게 한다
  const showButton = !activeUntil && !cancelled;

  return (
    <>
      {showButton && (
        <button type="button" onClick={openDialog} className={buttonClass({ variant: "secondary" })}>
          구독 취소
        </button>
      )}
      {status}

      {showButton && (
        <Dialog
          open={open}
          onClose={() => !loading && setOpen(false)}
          dismissible={!loading}
          role="alertdialog"
          labelledBy={titleId}
          describedBy={descId}
        >
          <h2 id={titleId} className={DIALOG_TITLE}>구독을 취소하시겠습니까?</h2>
          <p id={descId} className={DIALOG_DESCRIPTION}>
            취소해도 현재 결제 기간 종료까지 서비스를 계속 이용할 수 있습니다.
            다음 결제일에 자동 갱신이 중단됩니다.
          </p>
          {failed && (
            <p role="alert" className="mt-4 flex gap-2 text-body-sm text-negative">
              <WarningIcon size={16} className="mt-0.5" />
              <span className="min-w-0 flex-1">구독 취소에 실패했습니다. 잠시 후 다시 시도해주세요.</span>
            </p>
          )}
          <div className={DIALOG_ACTIONS}>
            <button
              type="button"
              data-autofocus
              onClick={() => setOpen(false)}
              disabled={loading}
              className={buttonClass({ variant: "secondary" })}
            >
              돌아가기
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-disabled={loading || undefined}
              aria-busy={loading || undefined}
              className={cx(buttonClass({ variant: "danger" }), "aria-disabled:opacity-40")}
            >
              {loading ? "처리 중..." : "구독 취소"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
