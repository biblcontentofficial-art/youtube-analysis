"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "./ConfirmDialog";
import { useNavigationLoading } from "./NavigationLoader";
import { useUser } from "@clerk/nextjs";

interface HistoryItem {
  term: string;
  count: number;
}

function loadLocalHistory(): HistoryItem[] {
  const saved = localStorage.getItem("searchHistory");
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

function saveLocalHistory(history: HistoryItem[]) {
  localStorage.setItem("searchHistory", JSON.stringify(history));
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

  // 플랜 확인 (publicMetadata.plan)
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  const useServerHistory = ["starter", "pro", "business", "admin"].includes(plan);

  // 히스토리 로드
  useEffect(() => {
    if (!user) {
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
            setHistory(loadLocalHistory());
          }
        })
        .catch(() => setHistory(loadLocalHistory()));
    } else {
      setHistory(loadLocalHistory());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, useServerHistory]);

  useEffect(() => {
    const currentQ = searchParams.get("q");
    if (currentQ) setKeyword(decodeURIComponent(currentQ).normalize("NFC"));
  }, [searchParams]);

  // count를 반환 (서버로 전달용)
  const saveToHistory = (term: string): number => {
    const prev = useServerHistory ? history : loadLocalHistory();
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
      // 서버 저장 (fire-and-forget)
      fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term }),
      }).catch(() => {});
    } else {
      saveLocalHistory(updated);
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
      localStorage.removeItem("searchHistory");
    }
  };

  const removeHistoryItem = async (term: string) => {
    if (!await showConfirm(`"${term}" 검색어를 삭제할까요?`)) return;
    const next = history.filter((h) => h.term !== term);
    setHistory(next);
    if (useServerHistory) {
      fetch("/api/search-history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ term }) }).catch(() => {});
    } else {
      saveLocalHistory(next);
    }
  };

  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim().normalize("NFC");
    if (!trimmed) return;

    if (!await showConfirm(`"${trimmed}" 검색하시겠습니까?`)) return;

    saveToHistory(trimmed);

    // count는 history 상태 대신 URL에서 직접 읽어서 계산 (가장 신뢰할 수 있는 값)
    // 같은 키워드 재검색 → count+1 (50→100→150→200...), 다른 키워드 → 1로 리셋
    const currentQ = decodeURIComponent(searchParams.get("q") ?? "").normalize("NFC");
    const prevCount = parseInt(searchParams.get("count") || "0");
    const count = currentQ === trimmed ? prevCount + 1 : 1;

    const currentFilter = searchParams.get("filter");
    const filterParam = currentFilter ? `&filter=${currentFilter}` : "";

    showLoading("검색 중...");
    router.push(`/search?q=${encodeURIComponent(trimmed)}&count=${count}${filterParam}`);
  };

  // 최근 검색어 클릭: 카운트 증가 없이 기존 결과 보기
  const navigateFromHistory = (term: string) => {
    setKeyword(term);
    const currentQ = searchParams.get("q");
    // 이미 같은 키워드 결과를 보고 있으면 그대로 유지
    if (currentQ && decodeURIComponent(currentQ).normalize("NFC") === term.normalize("NFC")) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(term)}&fromHistory=1`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSearch(keyword);
  };

  return (
    <div className="w-full flex flex-col gap-2 flex-1">
      {/* 검색창 */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드를 입력하세요"
          className="w-full pl-5 pr-12 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:border-teal-500 focus:outline-none placeholder-gray-600 text-sm transition-colors"
        />
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
                    {/* 클릭 → 검색 영역 */}
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
                    {/* X 버튼 — 부모 onClick과 완전 분리 */}
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
