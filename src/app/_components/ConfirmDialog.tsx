"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ConfirmOptions {
  message: string;
  confirmText?: string;
  cancelText?: string;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm: ConfirmFn = useCallback((options) => {
    const normalized: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ options: normalized, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleCancel}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 로고 */}
            <div className="flex items-center gap-1.5 mb-5">
              <div className="w-6 h-6 bg-black border border-gray-700 rounded-md flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight">
                <span className="text-white">bibl</span>
                <span className="text-teal-400"> lab</span>
              </span>
            </div>

            <p className="text-white text-sm leading-relaxed mb-6">
              {state.options.message}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors"
              >
                {state.options.cancelText ?? "취소"}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-500 rounded-xl font-medium transition-colors"
              >
                {state.options.confirmText ?? "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
