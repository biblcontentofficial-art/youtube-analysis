"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "./ConfirmDialog";
import { useNavigationLoading } from "./NavigationLoader";
import { useEffect as useEffectOnce } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { takePendingKeyword } from "./pendingKeyword";
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";

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
  try {
    const saved = localStorage.getItem(localHistoryKey(userId));
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // 구버전 string[] 포맷 호환
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed.map((term: string) => ({ term, count: 1 }));
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// userId 스코핑 키 + 구버전 익명 키를 모두 읽어 병합 (데이터 유실 방지)
function loadAllLocalHistory(userId?: string): HistoryItem[] {
  const scoped = userId ? loadLocalHistory(userId) : [];
  const anonymous = loadLocalHistory(); // 구버전 키 (userId 없음)

  // 병합: userId 스코핑 우선, 익명 키에만 있는 항목은 추가
  const merged = new Map<string, HistoryItem>();
  for (const item of anonymous) merged.set(item.term, item);
  for (const item of scoped) {
    const ex = merged.get(item.term);
    merged.set(item.term, { term: item.term, count: ex ? Math.max(item.count, ex.count) : item.count });
  }
  return Array.from(merged.values());
}

function saveLocalHistory(history: HistoryItem[], userId?: string) {
  localStorage.setItem(localHistoryKey(userId), JSON.stringify(history));
}

/** hint: 검색창 바로 아래 안내 줄(차감·초기화·남은 횟수). 서버 페이지가 사용량을 알아 넘겨 준다 */
export default function SearchBar({ hint }: { hint?: React.ReactNode } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showConfirm = useConfirm();
  const { showLoading } = useNavigationLoading();
  const [sbUser, setSbUser] = useState<{ id: string; plan: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffectOnce(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const plan = (data.user.user_metadata?.plan as string) ?? "free";
        setSbUser({ id: data.user.id, plan });
      }
      setIsLoaded(true);
    };
    fetchUser();
  }, []);
  const user = sbUser;
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // 국가 필터
  const [region, setRegion] = useState("KR");
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const regionMenuRef = useRef<HTMLDivElement>(null);

  // 플랜 확인
  const plan = user?.plan ?? "free";
  const useServerHistory = ["starter", "pro", "business", "admin", "team"].includes(plan);

  // 플랜별 히스토리 표시 한도
  const historyLimit =
    plan === "free" ? 10 :
    plan === "starter" ? 30 :
    100; // pro, business, admin

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

  // 히스토리 로드 — isLoaded 확정 후 실행 (플리커 방지)
  useEffect(() => {
    if (!isLoaded) return; // 아직 유저 정보 로딩 중이면 실행하지 않음
    if (!user) {
      // 비로그인: 익명 localStorage
      setHistory(loadAllLocalHistory().slice(0, 10));
      return;
    }
    if (useServerHistory) {
      // 서버 히스토리 + localStorage 병합 (구버전 데이터 유실 방지)
      fetch("/api/search-history")
        .then((r) => r.json())
        .then((data) => {
          const serverItems: HistoryItem[] = data.items?.length
            ? data.items.map((it: { term: string; count: number }) => ({ term: it.term, count: it.count }))
            : [];

          // localStorage에만 있는 항목 추가 (서버 미보유 구버전 데이터)
          const localItems = loadAllLocalHistory(user.id);
          const serverTerms = new Set(serverItems.map((i) => i.term));
          const localOnly = localItems.filter((i) => !serverTerms.has(i.term));
          const merged = [...serverItems, ...localOnly].slice(0, historyLimit);
          setHistory(merged);

          // localStorage 전용 항목을 서버에 마이그레이션 (fire-and-forget)
          if (localOnly.length > 0) {
            localOnly.slice(0, 20).forEach((item) => {
              fetch("/api/search-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ term: item.term }),
              }).catch(() => {});
            });
          }
        })
        .catch(() => setHistory(loadAllLocalHistory(user.id).slice(0, historyLimit)));
    } else {
      // Free 플랜: 모든 localStorage 소스 병합 후 10개 표시
      setHistory(loadAllLocalHistory(user.id).slice(0, historyLimit));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id, useServerHistory]);

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
    if (!await showConfirm({ message: "최근 검색어를 모두 삭제할까요?", destructive: true })) return;
    setHistory([]);
    if (useServerHistory) {
      fetch("/api/search-history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
    } else {
      localStorage.removeItem(localHistoryKey(user?.id));
    }
  };

  const removeHistoryItem = async (term: string) => {
    if (!await showConfirm({ message: `"${term}" 검색어를 삭제할까요?`, destructive: true })) return;
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

    if (!await showConfirm({
      message: `"${trimmed}" 검색하시겠습니까?`,
      subMessage: "확인 시 검색 사용량 1회가 차감됩니다.",
    })) return;

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

  // 로그인 안내(홈 모달·한도 모달)에서 맡아 둔 키워드: q 없이 열렸을 때만 입력창을 채운다(자동 검색·차감 없음).
  useEffect(() => {
    if (searchParams.get("q")) return;
    const pending = takePendingKeyword();
    if (pending) setKeyword(pending.normalize("NFC"));
  }, [searchParams]);

  const currentRegion = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  // 국가 메뉴 키보드: 열면 선택된 항목으로, 위아래 화살표·Home·End 로 이동, Esc 는 닫고 여는 버튼으로 (DESIGN 6.22)
  const regionButtonRef = useRef<HTMLButtonElement>(null);
  const regionItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (!showRegionMenu) return;
    const i = REGIONS.findIndex((r) => r.code === region);
    regionItemRefs.current[i < 0 ? 0 : i]?.focus();
  // 메뉴를 열 때만 포커스를 옮긴다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRegionMenu]);

  const closeRegionMenu = (returnFocus: boolean) => {
    setShowRegionMenu(false);
    if (returnFocus) regionButtonRef.current?.focus();
  };

  const handleRegionMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = regionItemRefs.current.filter((el): el is HTMLButtonElement => !!el);
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(at + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeRegionMenu(true);
    } else if (e.key === "Tab") {
      closeRegionMenu(false);
    }
  };

  const historyListId = "search-history-list";

  return (
    <div className="flex w-full flex-1 flex-col gap-2">
      {/* 검색창 (DESIGN 6.9 앱 검색창: 모바일 50px · 640 이상 56px) */}
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex h-[50px] w-full items-center gap-2 rounded-card border border-line-strong bg-surface p-0.5 pl-4 transition-colors focus-within:border-accent sm:h-14 sm:p-1 lg:pl-5"
      >
        <SearchIcon className="text-fg-3" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드를 입력하세요"
          aria-label="검색할 키워드"
          enterKeyHint="search"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-body font-medium text-fg outline-none placeholder:text-fg-3 lg:text-[17px]"
        />

        {/* 국가 선택 버튼 (국기 이모지는 글자 라벨과 함께 쓰는 예외, DESIGN 6.22) */}
        <div ref={regionMenuRef} className="relative h-full shrink-0">
          <button
            ref={regionButtonRef}
            type="button"
            onClick={() => setShowRegionMenu((v) => !v)}
            onKeyDown={(e) => {
              if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !showRegionMenu) {
                e.preventDefault();
                setShowRegionMenu(true);
              }
            }}
            aria-label={`검색 국가: ${currentRegion.label}`}
            aria-haspopup="menu"
            aria-expanded={showRegionMenu}
            className="inline-flex h-full min-w-11 items-center justify-center gap-1 rounded-control px-2 text-body-sm font-medium text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg sm:px-3"
          >
            <span aria-hidden="true">{currentRegion.flag}</span>
            <span aria-hidden="true" className="hidden sm:inline">{currentRegion.label}</span>
            <ChevronDownIcon size={16} className="text-fg-3" />
          </button>

          {/* 드롭다운 */}
          {showRegionMenu && (
            <div
              role="menu"
              aria-label="검색 국가"
              onKeyDown={handleRegionMenuKeyDown}
              className="absolute right-0 top-full z-50 mt-2 w-44 rounded-card border border-line bg-surface p-1.5"
            >
              {REGIONS.map((r, i) => (
                <button
                  key={r.code}
                  ref={(el) => {
                    regionItemRefs.current[i] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={region === r.code}
                  tabIndex={region === r.code ? 0 : -1}
                  onClick={() => {
                    setRegion(r.code);
                    closeRegionMenu(true);
                  }}
                  className="flex h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-body-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg aria-checked:font-semibold aria-checked:text-fg"
                >
                  <span aria-hidden="true" className="text-base">{r.flag}</span>
                  <span>{r.label}</span>
                  {region === r.code && <CheckIcon size={16} className="ml-auto text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 검색 버튼 (흰 면은 이 화면에 이것 하나) */}
        <button
          type="submit"
          aria-label="검색"
          className="inline-flex h-full min-h-11 shrink-0 items-center justify-center rounded-control bg-accent px-5 text-ui font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active lg:px-7"
        >
          검색
        </button>
      </form>
      {/* 검색창 바로 아래 안내 줄(DESIGN 7.2 3행). 기록은 그 아래 */}
      {hint}

      {/* 검색 기록: Starter 이상만 표시 */}
      {useServerHistory && history.length > 0 && (
        <div className="w-full rounded-card border border-line bg-surface">
          <div className="flex items-center justify-between gap-2 pr-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={historyListId}
              className="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-card px-3 text-left text-caption font-medium text-fg-3 transition-colors hover:text-fg"
            >
              최근 검색어
              <span className="inline-flex items-center rounded border border-line-strong px-1 text-micro font-medium leading-[18px] text-fg-3">서버 저장</span>
              <ChevronDownIcon size={16} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {isExpanded && (
              <button
                type="button"
                onClick={removeAllHistory}
                className="inline-flex h-11 shrink-0 items-center rounded-control px-2.5 text-caption text-fg-3 transition-colors hover:text-negative"
              >
                전체 삭제
              </button>
            )}
          </div>

          {isExpanded && (
            <div id={historyListId} className="max-h-[132px] overflow-y-auto border-t border-line-soft px-3 py-3">
              <ul aria-label="최근 검색어" className="flex flex-wrap gap-1.5">
                {history.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center overflow-hidden rounded-control border border-line transition-colors hover:border-line-hover"
                  >
                    <button
                      type="button"
                      onClick={() => navigateFromHistory(item.term)}
                      className="inline-flex h-9 items-center px-2.5 text-caption font-medium text-fg-2 transition-colors hover:text-fg pointer-coarse:h-11"
                    >
                      {item.term}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeHistoryItem(item.term)}
                      aria-label={`${item.term} 기록 삭제`}
                      className="inline-flex h-9 w-8 items-center justify-center text-fg-3 transition-colors hover:text-negative pointer-coarse:h-11 pointer-coarse:w-10"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
