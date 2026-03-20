"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────
interface LoadingCtx {
  showLoading: (message?: string) => void;
}

const LoadingContext = createContext<LoadingCtx>({ showLoading: () => {} });

export function useNavigationLoading() {
  return useContext(LoadingContext);
}

// ─────────────────────────────────────────────────────────
// Watcher: pathname/searchParams 변경 감지 → 로딩 숨김
// (useSearchParams는 Suspense 안에서만 사용 가능)
// ─────────────────────────────────────────────────────────
function NavigationWatcher({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onNavigate();
  }, [pathname, searchParams, onNavigate]);

  return null;
}

// ─────────────────────────────────────────────────────────
// Provider + Overlay
// ─────────────────────────────────────────────────────────
export default function NavigationLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("로딩 중...");

  const hideLoading = useCallback(() => setLoading(false), []);

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg ?? "로딩 중...");
    setLoading(true);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading }}>
      {/* pathname/searchParams 변경 시 자동으로 로딩 닫힘 */}
      <Suspense fallback={null}>
        <NavigationWatcher onNavigate={hideLoading} />
      </Suspense>

      {children}

      {/* 전체화면 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-gray-950/75 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            {/* 스피너 링 */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" />
              {/* 중앙 로고 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5 opacity-60"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>

            {/* 메시지 */}
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{message}</p>
              <p className="text-gray-500 text-xs mt-1">잠시만 기다려주세요</p>
            </div>

            {/* 하단 점 애니메이션 */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
