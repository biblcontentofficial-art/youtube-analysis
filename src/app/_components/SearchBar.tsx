"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "./ConfirmDialog";
import { useNavigationLoading } from "./NavigationLoader";
import { useUser } from "@clerk/nextjs";

interface HistoryItem {
  term: string;
  count: number;
}

const REGIONS = [
  { code: "KR", flag: "🇰🇷", label: "대한민국" },
  { code: "US", flag: "🇺🇸", label: "미국" },
  { code: "JP", flag: "🇯🇵", label: "일본" },
  { code: "GB", flag: "🇬🇧", label: "영국" },
  { code: "DE", flag: "🇩🇪", label: "독일" },
] as const;

// localStorage 키를 userId로 스코핑 — 계정 전환 시 타인 기록 노출 방지
function localHistoryKey(userId?: string) {
  return userId ? `searchHistory:${userId}` : "searchHistory";
}

function loadLocalHistory(userId?: string): HistoryItem[] {
  const saved = localStorage.getItem(localHistoryKey(userId));
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // 구버전 string[] 포맷 호환
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed.map((term: string) => ({ term, count: 1 }));
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalHistory(history: HistoryItem[], userId?: string) {
  localStorage.setItem(localHistoryKey(userId), JSON.stringify(history));
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showConfirm = useConfirm();
  const { showLoading } = useNavigationLoading();
  const { user } = useUser();
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // 국가 필터
  const [region, setRegion] = useState("KR");
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const regionMenuRef = useRef<HTMLDivElement>(null);

  // 플랜 확인 (publicMetadata.plan)
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  const useServerHistory = ["starter", "pro", "business", "admin"].includes(plan);

  // URL에서 region 동기화
  useEffect(() => {
    const r = searchParams.get("region");
    if (r && REGIONS.some((x) => x.code === r)) setRegion(r);
  }, [searchParams]);

  // 외부 클릭 시 국가 메뉴 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (regionMenuRef.current && !regionMenuRef.current.contains(e.target as Node)) {
        setShowRegionMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 히스토리 로드 — userId 스코핑으로 계정 전환 시 타인 기록 노출 방지
  useEffect(() => {
    if (!user) {
      // 비로그인: 공유 키 사용 (브라우저 익명)
      setHistory(loadLocalHistory());
      return;
    }
    if (useServerHistory) {
      fetch("/api/search-history")
        .then((r) => r.json())
        .then((data) => {
          if (data.items?.length) {
            setHistory(data.items.map((it: { term: string; count: number }) => ({ term: it.term, count: it.count })));
          } else {
            setHistory(loadLocalHistory(user.id));
          }
        })
        .catch(() => setHistory(loadLocalHistory(user.id)));
    } else {
      // 로그인 상태 Free 플랜: userId 스코핑된 localStorage
      setHistory(loadLocalHistory(user.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, useServerHistory]);

  useEffect(() => {
    const currentQ = searchParams.get("q");
    if (currentQ) setKeyword(decodeURIComponent(currentQ).normalize("NFC"));
  }, [searchParams]);

  const saveToHistory = (term: string): number => {
    const prev = useServerHistory ? history : loadLocalHistory(user?.id);
    const existing = prev.find((h) => h.term === term);
    let updated: HistoryItem[];
    let newCount: number;

    if (existing) {
      newCount = existing.count + 1;
      updated = [{ term, count: newCount }, ...prev.filter((h) => h.term !== term)];
    } else {
      newCount = 1;
      updated = [{ term, count: 1 }, ...prev];
    }

    updated = updated.slice(0, 30);
    setHistory(updated);

    if (useServerHistory) {
      fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term }),
      }).catch(() => {});
    } else {
      saveLocalHistory(updated, user?.id);
    }

    if (!isExpanded) setIsExpanded(true);
    return newCount;
  };

  const removeAllHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await showConfirm("최근 검색어를 모두 삭제할까요?")) return;
    setHistory([]);
    if (useServerHistory) {
      fetch("/api/search-history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
    } else {
      localStorage.removeItem(localHistoryKey(user?.id));
    }
  };

  const removeHistoryItem = async (term: string) => {
    if (!await showConfirm(`"${term}" 검색어를 삭제할까요?`)) return;
    const next = history.filter((h) => h.term !== term);
    setHistory(next);
    if (useServerHistory) {
      fetch("/api/search-history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ term }) }).catch(() => {});
    } else {
      saveLocalHistory(next, user?.id);
    }
  };

  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim().normalize("NFC");
    if (!trimmed) return;

    // v (버전) 계산 — await 이전에 처리해야 stale searchParams 방지
    const currentQ = decodeURIComponent(searchParams.get("q") ?? "").normalize("NFC");
    const prevV = parseInt(searchParams.get("v") || "0");
    const v = currentQ === trimmed ? prevV + 1 : 1;
    const currentFilter = searchParams.get("filter");
    const filterParam = currentFilter ? `&filter=${currentFilter}` : "";

    if (!await showConfirm(`"${trimmed}" 검색하시겠습니까?`)) return;

    saveToHistory(trimmed);

    showLoading("검색 중...");
    router.push(`/search?q=${encodeURIComponent(trimmed)}&v=${v}&region=${region}${filterParam}`);
  };

  // 최근 검색어 클릭: 카운트 증가 없이 기존 결과 보기
  const navigateFromHistory = (term: string) => {
    setKeyword(term);
    const currentQ = searchParams.get("q");
    if (currentQ && decodeURIComponent(currentQ).normalize("NFC") === term.normalize("NFC")) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(term)}&fromHistory=1&region=${region}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSearch(keyword);
  };

  const currentRegion = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  return (
    <div className="w-full flex flex-col gap-2 flex-1">
      {/* 검색창 */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드를 입력하세요"
          className="w-full pl-5 pr-28 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:border-teal-500 focus:outline-none placeholder-gray-600 text-sm transition-colors"
        />

        {/* 국가 선택 버튼 */}
        <div ref={regionMenuRef} className="absolute right-12 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setShowRegionMenu((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
            title="검색 국가 선택"
          >
            <span>{currentRegion.flag}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-gray-500">
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 드롭다운 */}
          {showRegionMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => {
                    setRegion(r.code);
                    setShowRegionMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                    region === r.code
                      ? "bg-teal-900/50 text-teal-300"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{r.flag}</span>
                  <span>{r.label}</span>
                  {region === r.code && <span className="ml-auto text-teal-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      </form>

      {/* 검색 기록 */}
      {history.length > 0 && (
        <div className="w-full bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-3 py-2 cursor-pointer bg-gray-800/40 hover:bg-gray-800/60 transition-colors select-none"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              최근 검색어
              {useServerHistory && <span className="text-[10px] text-teal-600 bg-teal-950/40 border border-teal-900 px-1 py-0.5 rounded">서버 저장</span>}
              <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
            </div>
            {isExpanded && (
              <button
                onClick={removeAllHistory}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                전체 삭제
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="px-3 py-3 border-t border-gray-800 max-h-[120px] overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-teal-600 rounded-lg transition-all overflow-hidden"
                  >
                    <div
                      onClick={() => navigateFromHistory(item.term)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-gray-200">{item.term}</span>
                      {item.count > 1 && (
                        <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800 px-1.5 py-0.5 rounded-full leading-none">
                          {item.count}회
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeHistoryItem(item.term)}
                      className="pr-2 pl-0.5 py-1.5 text-gray-600 hover:text-red-400 transition-colors self-stretch flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
