"use client";

/**
 * 전역 확인창. const confirm = useConfirm(); if (!await confirm("…")) return;
 * 결과는 그대로다: 확인 true, 취소·Esc·바깥 클릭 false.
 *
 * 모양과 키보드는 src/components/ui/dialog.tsx 셸이 맡는다(최상위 층, 포커스 가둠·복귀, Esc).
 * Enter 는 포커스된 버튼만 누른다. 처음 포커스는 '확인'이라 검색창 Enter → 확인창 Enter 로 검색하는 흐름이 그대로이고,
 * destructive(삭제 등 되돌릴 수 없는 동작)이면 '취소'에 둬서 Enter 한 번에 실행되지 않게 한다.
 */
import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_ACTIONS, DIALOG_DESCRIPTION, DIALOG_TITLE } from "@/components/ui/dialog-classes";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

interface ConfirmOptions {
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  /** 되돌릴 수 없는 동작: 확인 버튼을 레드 테두리(danger)로, 처음 포커스를 '취소'로 */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  // id 는 요청마다 바뀌어 창을 새로 연다(처음 포커스를 요청마다 다시 잡는다)
  const [request, setRequest] = useState<{ id: number; options: ConfirmOptions } | null>(null);
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const seq = useRef(0);
  const titleId = useId();
  const descId = useId();

  const confirm: ConfirmFn = useCallback((options) => {
    const normalized: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;
    // 앞선 확인창이 아직 열려 있으면 취소로 끝낸다(답 없이 남는 Promise 를 만들지 않는다)
    resolveRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      seq.current += 1;
      setRequest({ id: seq.current, options: normalized });
      setOpen(true);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(value);
    setOpen(false);
  }, []);

  const options = request?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        key={request?.id ?? 0}
        open={open}
        onClose={() => settle(false)}
        role="alertdialog"
        labelledBy={titleId}
        describedBy={options?.subMessage ? descId : undefined}
      >
        {options && (
          <>
            <div aria-hidden="true" className="mb-5">
              <Logo size="sm" />
            </div>
            <h2 id={titleId} className={DIALOG_TITLE}>
              {options.message}
            </h2>
            {options.subMessage && (
              <p id={descId} className={DIALOG_DESCRIPTION}>
                {options.subMessage}
              </p>
            )}
            <div className={DIALOG_ACTIONS}>
              <button
                type="button"
                onClick={() => settle(false)}
                data-autofocus={options.destructive ? "" : undefined}
                className={buttonClass({ variant: "secondary" })}
              >
                {options.cancelText ?? "취소"}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                data-autofocus={options.destructive ? undefined : ""}
                className={buttonClass({ variant: options.destructive ? "danger" : "primary" })}
              >
                {options.confirmText ?? "확인"}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
