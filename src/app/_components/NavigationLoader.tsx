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
// Watcher: pathname/searchParams 변경 감지 → 로딩 완료
// ─────────────────────────────────────────────────────────
function NavigationWatcher({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const isFirst = useRef(true);

  useEffect(() => {
    // 최초 마운트 시에는 숨기지 않음 (페이지 이동 완료 시에만 숨김)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchString]);

  return null;
}

// ─────────────────────────────────────────────────────────
// Progress Bar UI
// ─────────────────────────────────────────────────────────
function ProgressBar({ visible }: { visible: boolean }) {
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  useEffect(() => {
    if (visible) {
      // 시작: 0 → 빠르게 30% → 천천히 85%까지
      setOpacity(1);
      setWidth(0);

      rafRef.current = requestAnimationFrame(() => {
        setWidth(30); // 즉시 30%
        timerRef.current = setTimeout(() => setWidth(55), 400);
        timerRef.current = setTimeout(() => setWidth(72), 900);
        timerRef.current = setTimeout(() => setWidth(85), 1800);
        timerRef.current = setTimeout(() => setWidth(92), 3500);
      });
    } else {
      // 완료: 100%로 채우고 페이드 아웃
      clear();
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setOpacity(0);
        timerRef.current = setTimeout(() => setWidth(0), 300);
      }, 200);
    }

    return clear;
  }, [visible]);

  if (width === 0 && !visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ opacity, transition: "opacity 0.3s ease" }}
    >
      <div
        className="h-[2px] bg-teal-400 relative"
        style={{
          width: `${width}%`,
          transition: visible
            ? "width 0.6s cubic-bezier(0.1, 0.5, 0.5, 1)"
            : "width 0.15s ease-out",
          boxShadow: "0 0 8px 1px rgba(45,212,191,0.7)",
        }}
      >
        {/* 오른쪽 끝 빛 번짐 */}
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-[2px]"
          style={{
            background: "linear-gradient(to left, transparent, rgba(45,212,191,0.4))",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────
export default function NavigationLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideLoading = useCallback(() => {
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
    setLoading(false);
    setMessage(undefined);
  }, []);

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg);
    setLoading(true);
    // 안전장치: 최대 10초 후 강제 종료
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      setLoading(false);
      setMessage(undefined);
      safetyTimerRef.current = null;
    }, 10000);
  }, []);

  // ── 전역 링크 클릭 인터셉터 ──────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 수정자 키 + 우클릭은 무시
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // 외부링크·해시·메일·전화·새탭 무시
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.rel?.includes("external")
      ) return;

      // 현재 경로와 동일하면 무시
      const currentPath = window.location.pathname + window.location.search;
      const targetPath = href.split("?")[0] + (href.includes("?") ? "?" + href.split("?")[1] : "");
      if (currentPath === targetPath) return;

      showLoading();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [showLoading]);

  // router.push() 인터셉터 (프로그래매틱 네비게이션 감지)
  useEffect(() => {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      showLoading();
      return originalPushState(...args);
    };

    history.replaceState = (...args) => {
      return originalReplaceState(...args);
    };

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [showLoading]);

  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      <Suspense fallback={null}>
        <NavigationWatcher onNavigate={hideLoading} />
      </Suspense>

      {/* 상단 프로그레스 바 (항상 렌더, 내부에서 visible 제어) */}
      <ProgressBar visible={loading} />

      {children}

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
