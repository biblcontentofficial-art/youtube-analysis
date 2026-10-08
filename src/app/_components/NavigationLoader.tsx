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
import { SEARCH_COMPLETE_EVENT } from "./SearchUsageBadge";

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
function NavigationWatcher({
  onNavigate,
  seenRef,
}: {
  onNavigate: () => void;
  /** 마지막으로 그려진 주소(경로 + 쿼리). pushState 래핑이 이미 끝난 이동에 막대를 다시 띄우지 않게 쓴다 */
  seenRef: React.MutableRefObject<string>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const isFirst = useRef(true);

  useEffect(() => {
    seenRef.current = pathname + (searchString ? `?${searchString}` : "");
    // 최초 마운트 시에는 숨기지 않음 (페이지 이동 완료 시에만 숨김)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onNavigate();
    // 검색 결과(/search?q=…) 이동이 끝나면 = 서버 렌더(차감 포함)가 끝난 것. 네비 남은 횟수 배지가 다시 읽는다
    if (pathname === "/search" && searchParams.has("q")) {
      window.dispatchEvent(new Event(SEARCH_COMPLETE_EVENT));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchString]);

  return null;
}

// ─────────────────────────────────────────────────────────
// Progress Bar UI (DESIGN 6.31: 흰 2px 막대, 끝 점·글로우 없음, z-80)
// prefers-reduced-motion 이면 globals.css 전역 규칙이 전환을 끈다(나타났다 사라짐)
// ─────────────────────────────────────────────────────────
function ProgressBar({ visible }: { visible: boolean }) {
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  // 단계 타이머를 모두 모아 둔다(하나만 기억하면 숨긴 뒤에도 남은 타이머가 막대 폭을 다시 늘린다)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const clear = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  useEffect(() => {
    if (visible) {
      // 시작: 0 → 빠르게 30% → 천천히 85%까지
      setOpacity(1);
      setWidth(0);

      rafRef.current = requestAnimationFrame(() => {
        setWidth(30); // 즉시 30%
        timersRef.current.push(
          setTimeout(() => setWidth(55), 400),
          setTimeout(() => setWidth(72), 900),
          setTimeout(() => setWidth(85), 1800),
          setTimeout(() => setWidth(92), 3500),
        );
      });
    } else {
      // 완료: 100%로 채우고 페이드 아웃
      clear();
      setWidth(100);
      timersRef.current.push(
        setTimeout(() => {
          setOpacity(0);
          timersRef.current.push(setTimeout(() => setWidth(0), 300));
        }, 200),
      );
    }

    return clear;
  }, [visible]);

  if (width === 0 && !visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-80 h-0.5"
      style={{ opacity, transition: "opacity 0.4s ease" }}
    >
      <div
        className="h-full bg-accent"
        style={{
          width: `${width}%`,
          transition: visible
            ? "width 0.6s cubic-bezier(0.1, 0.5, 0.5, 1)"
            : "width 0.15s ease-out",
        }}
      />
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
  const seenRef = useRef("");

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

      // 외부링크·해시·메일·전화·새탭·API·파일 내려받기 무시(문서 이동이 없어 막대가 10초 동안 남는다)
      if (
        href.startsWith("/api/") ||
        anchor.hasAttribute("download") ||
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
      // Next 의 HistoryUpdater 가 useInsertionEffect 안에서 pushState 를 부른다. 그 안에서 setState 하면
      // 'useInsertionEffect must not schedule updates' 경고가 나므로 상태 변경을 한 박자 미룬다.
      // 미룬 사이 이동이 이미 그려졌으면(Watcher 가 새 주소를 봤으면) 띄우지 않는다(막대가 10초 남는 것 방지).
      queueMicrotask(() => {
        const qs = new URLSearchParams(window.location.search).toString();
        if (window.location.pathname + (qs ? `?${qs}` : "") !== seenRef.current) showLoading();
      });
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
        <NavigationWatcher onNavigate={hideLoading} seenRef={seenRef} />
      </Suspense>

      {/* 상단 프로그레스 바 (항상 렌더, 내부에서 visible 제어) */}
      <ProgressBar visible={loading} />

      {children}

      {/* 검색 로딩 오버레이 (message 있을 때만) */}
      {loading && message && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-80 flex items-center justify-center bg-canvas/60"
        >
          <div className="flex flex-col items-center gap-4 rounded-panel border border-line-strong bg-surface-2 px-8 py-7">
            <div aria-hidden="true" className="size-10 animate-spin rounded-full border-[3px] border-line-strong border-t-accent" />
            <p className="text-body-sm font-medium text-fg">{message}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
