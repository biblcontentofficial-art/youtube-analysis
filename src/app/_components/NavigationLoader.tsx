"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────
interface LoadingCtx {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingCtx>({
  showLoading: () => {},
  hideLoading: () => {},
});

export function useNavigationLoading() {
  return useContext(LoadingContext);
}

// ─────────────────────────────────────────────────────────
// Watcher: pathname/searchParams 변경 감지 → 로딩 숨김
// ─────────────────────────────────────────────────────────
function NavigationWatcher({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  useEffect(() => {
    onNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchString]);

  return null;
}

// ─────────────────────────────────────────────────────────
// Provider + 상단 프로그레스 바 (비블로킹)
// ─────────────────────────────────────────────────────────
export default function NavigationLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideLoading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLoading(false);
    setMessage(undefined);
  }, []);

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg);
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setMessage(undefined);
      timerRef.current = null;
    }, 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      <Suspense fallback={null}>
        <NavigationWatcher onNavigate={hideLoading} />
      </Suspense>

      {children}

      {/* 상단 프로그레스 바 */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 pointer-events-none">
          <div className="h-full bg-teal-400 animate-progress-bar" />
          <style jsx>{`
            @keyframes progress-bar {
              0% { width: 0%; }
              50% { width: 70%; }
              100% { width: 95%; }
            }
            .animate-progress-bar {
              animation: progress-bar 4s ease-out forwards;
            }
          `}</style>
        </div>
      )}

      {/* 검색 로딩 오버레이 (message 있을 때만) */}
      {loading && message && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4 px-8 py-7 bg-gray-900/90 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="w-10 h-10 border-[3px] border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">{message}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
