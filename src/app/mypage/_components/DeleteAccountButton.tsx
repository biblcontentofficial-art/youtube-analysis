"use client";
import { useId, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_ACTIONS, DIALOG_DESCRIPTION, DIALOG_TITLE } from "@/components/ui/dialog-classes";
import { buttonClass, cx } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

/** 계정 삭제 API 호출 → 로그아웃 → 홈. 실패면 throw */
async function deleteAccountRequest() {
  const res = await fetch("/api/delete-account", { method: "DELETE" });
  if (!res.ok) throw new Error("failed");
  const supabase = createSupabaseBrowser();
  await supabase.auth.signOut();
  window.location.href = "/";
}

/**
 * hasSubscription: 자동 갱신 중인 구독이 있으면 삭제 대상 목록에 구독 해지를 함께 적는다.
 * 처리 중에는 확인 버튼을 disabled 대신 aria-disabled 로 막아 포커스가 버튼에 남게 한다(실패 뒤에도 같은 버튼).
 * onConfirm: 로컬 미리보기에서 실패 응답을 흉내 낼 때만 넘긴다(기본은 /api/delete-account 호출).
 */
export default function DeleteAccountButton({
  hasSubscription = false,
  onConfirm = deleteAccountRequest,
}: {
  hasSubscription?: boolean;
  onConfirm?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const titleId = useId();
  const descId = useId();

  function openDialog() {
    setFailed(false);
    setOpen(true);
  }

  async function handleDelete() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch {
      // 실패하면 창을 닫지 않고 창 안에 알린다
      setFailed(true);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={cx(
          "inline-flex h-11 items-center text-body-sm font-semibold text-negative transition-colors duration-150",
          "underline-offset-4 hover:underline",
        )}
      >
        계정 삭제
      </button>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        dismissible={!loading}
        role="alertdialog"
        labelledBy={titleId}
        describedBy={descId}
      >
        <h2 id={titleId} className={DIALOG_TITLE}>계정을 삭제하시겠습니까?</h2>
        <p id={descId} className={DIALOG_DESCRIPTION}>
          모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-body-sm text-fg-2">
          <li>계정과 로그인 정보</li>
          <li>검색 기록</li>
          <li>수집한 영상</li>
          {hasSubscription && <li>진행 중인 구독(자동 갱신 중단)</li>}
        </ul>
        {failed && (
          <p role="alert" className="mt-4 flex gap-2 text-body-sm text-negative">
            <WarningIcon size={16} className="mt-0.5" />
            <span className="min-w-0 flex-1">계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.</span>
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
            onClick={handleDelete}
            aria-disabled={loading || undefined}
            aria-busy={loading || undefined}
            className={cx(buttonClass({ variant: "danger" }), "aria-disabled:opacity-40")}
          >
            {loading ? "삭제 중..." : "계정 삭제"}
          </button>
        </div>
      </Dialog>
    </>
  );
}
