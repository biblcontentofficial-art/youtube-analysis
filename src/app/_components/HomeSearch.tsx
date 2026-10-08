"use client";

/**
 * 홈 검색(클라이언트 잎). 서버 컴포넌트 홈(page.tsx)이 첫 화면을 그리고, 상태가 필요한 것만 여기서 맡는다:
 * 인증 확인 · 방문 기록 · 검색 폼 · 예시 칩 · 로그인 모달 · 결과 미리보기 아래 링크.
 *
 * 불변 조건 1(검색 누적): saveToHistory · trySearch 본문은 옛 page.tsx 에서 글자 그대로 옮겼다
 * (scripts/ux/check-invariants.mjs 가 이름으로 찾아 해시를 비교한다). 검색창 제출과 예시 칩은 모두 trySearch 를 거친다.
 * /search?q=… 로 바로 가는 링크를 만들지 않는다(기록 저장·count 를 건너뛴다).
 */
import React, { createContext, useContext, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useNavigationLoading } from "@/app/_components/NavigationLoader";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { rememberPendingKeyword, forgetPendingKeyword } from "@/app/_components/pendingKeyword";
import { Dialog } from "@/components/ui/dialog";
import { DIALOG_DESCRIPTION, DIALOG_TITLE } from "@/components/ui/dialog-classes";
import { buttonClass } from "@/components/ui/button";
import { CHIP } from "@/components/ui/chip";

const EXAMPLE_KEYWORDS = ["캠핑", "영어 공부", "주식 투자", "다이어트", "여행 브이로그", "요리 레시피"];

type HomeSearchValue = {
  isSignedIn: boolean;
  isLoaded: boolean;
  trySearch: (term: string) => void;
};

const HomeSearchContext = createContext<HomeSearchValue | null>(null);

function useHomeSearch(): HomeSearchValue {
  const value = useContext(HomeSearchContext);
  if (!value) throw new Error("HomeSearchProvider 안에서만 쓴다");
  return value;
}

/** 첫 화면(#trend) 전체를 감싼다. 서버에서 그린 children 은 그대로 서버 HTML 로 남는다 */
export function HomeSearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  React.useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsSignedIn(!!data.user);
      setIsLoaded(true);
    };
    fetchUser();
    // bibllab.com 메인 방문 트래킹
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "bibllab", referrer: document.referrer || null }),
    }).catch(() => {});
  }, []);
  const { showLoading } = useNavigationLoading();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState("");
  const titleId = useId();
  const descId = useId();

  // 로그인 모달이 열리면 입력한 키워드를 맡아 둔다. 로그인 뒤 /search 가 q 없이 열리면
  // SearchBar 가 입력창에만 채운다(자동 검색·차감 없음). 돌아갈 주소에는 q 를 싣지 않는다.
  React.useEffect(() => {
    if (showAuthModal && pendingKeyword) rememberPendingKeyword(pendingKeyword);
  }, [showAuthModal, pendingKeyword]);

  // 로그인하지 않고 모달을 닫으면(닫기·Esc·배경 클릭) 맡아 둔 키워드도 버린다.
  const closeAuthModal = () => {
    forgetPendingKeyword();
    setShowAuthModal(false);
  };

  interface HistoryItem { term: string; count: number; }

  const saveToHistory = (term: string): number => {
    const saved = localStorage.getItem("searchHistory");
    let history: HistoryItem[] = [];
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      history = Array.isArray(parsed) && typeof parsed[0] === "string"
        ? parsed.map((t: string) => ({ term: t, count: 1 }))
        : parsed;
    } catch { history = []; }

    const existing = history.find((h) => h.term === term);
    let newCount = 1;
    if (existing) {
      newCount = existing.count + 1;
      history = [{ term, count: newCount }, ...history.filter((h) => h.term !== term)];
    } else {
      history = [{ term, count: 1 }, ...history];
    }
    localStorage.setItem("searchHistory", JSON.stringify(history.slice(0, 30)));
    return newCount;
  };

  const trySearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (isLoaded && !isSignedIn) {
      setPendingKeyword(trimmed);
      setShowAuthModal(true);
      return;
    }
    const count = saveToHistory(trimmed);
    showLoading(`"${trimmed}" 검색 중...`);
    router.push(`/search?q=${encodeURIComponent(trimmed)}&count=${count}`);
  };

  return (
    <HomeSearchContext.Provider value={{ isSignedIn, isLoaded, trySearch }}>
      {children}

      {/* 로그인 유도 모달(Dialog 셸: 제목이 이름, 첫 버튼 포커스, Esc·배경 클릭으로 닫힘) */}
      <Dialog open={showAuthModal} onClose={closeAuthModal} labelledBy={titleId} describedBy={descId}>
        <h2 id={titleId} className={DIALOG_TITLE}>로그인이 필요합니다</h2>
        <p id={descId} className={DIALOG_DESCRIPTION}>
          <span className="font-medium text-fg">&ldquo;{pendingKeyword}&rdquo;</span> 검색을 시작하려면 로그인 또는 회원가입을 해주세요.
        </p>
        <p className="mt-2 text-caption text-fg-3">가입 후 하루 2회 무료 검색 · 1분 만에 시작</p>
        <div className="mt-6 grid gap-2">
          <Link href="/sign-up?redirect_url=/search" className={buttonClass({ block: true })}>
            회원가입 후 검색하기
          </Link>
          <Link href="/sign-in?redirect_url=/search" className={buttonClass({ variant: "secondary", block: true })}>
            로그인
          </Link>
          <button type="button" onClick={closeAuthModal} className={buttonClass({ variant: "ghost", block: true })}>
            닫기
          </button>
        </div>
      </Dialog>
    </HomeSearchContext.Provider>
  );
}

/** 첫 화면 검색창 + 안내 한 줄 + 예시 칩 6개 */
export function HomeSearchForm() {
  const { isSignedIn, isLoaded, trySearch } = useHomeSearch();
  const showConfirm = useConfirm();
  const [keyword, setKeyword] = useState("");
  const inputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    if (!await showConfirm(`"${trimmed}" 검색하시겠습니까?`)) return;
    trySearch(trimmed);
  };

  const handleExample = (kw: string) => {
    trySearch(kw);
  };

  const signedIn = isLoaded && isSignedIn;

  return (
    <>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="mt-6 flex h-14 max-w-[640px] items-center gap-2 rounded-card border border-line-strong bg-surface p-1 pl-4 transition-colors duration-150 focus-within:border-accent lg:mt-8"
      >
        <svg className="size-5 shrink-0 text-fg-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <label htmlFor={inputId} className="sr-only">검색할 키워드</label>
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="분석할 키워드를 입력하세요"
          className="h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-0 placeholder:text-fg-3"
        />
        <button
          type="submit"
          className="inline-flex h-full shrink-0 items-center justify-center whitespace-nowrap rounded-control bg-accent px-5 text-ui font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active"
        >
          분석 시작
        </button>
      </form>
      {/* 한 줄 자리는 같다: 비로그인은 가입 안내, 로그인은 예시 칩 차감 안내(결정 10 기본 B). 줄 수가 같아 레이아웃 이동이 없다 */}
      <p id="home-search-note" className="mt-3 text-caption text-fg-3">
        {signedIn ? "예시 키워드를 누르면 검색 1회가 차감됩니다" : "가입 후 하루 2회 무료 검색 · 1분 만에 시작"}
      </p>

      <div className="-mx-6 mt-4 flex items-center gap-1.5 overflow-x-auto px-6 scrollbar-hide sm:mx-0 sm:mt-5 sm:flex-wrap sm:overflow-visible sm:px-0">
        <span className="mr-1 shrink-0 text-caption text-fg-3">예시</span>
        {EXAMPLE_KEYWORDS.map((kw) => (
          <button key={kw} type="button" onClick={() => handleExample(kw)} aria-describedby={signedIn ? "home-search-note" : undefined} className={CHIP}>
            {kw}
          </button>
        ))}
      </div>
    </>
  );
}

/** 결과 미리보기 아래 링크. /search?q=… 로 바로 보내지 않는다(검색은 언제나 trySearch 경유) */
export function HomePreviewLink({ className }: { className?: string }) {
  const { isSignedIn, isLoaded } = useHomeSearch();
  if (isLoaded && isSignedIn) {
    return (
      <Link href="/search" className={className}>
        영상 찾기에서 직접 검색하기 <span aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <Link href="/sign-in?redirect_url=/search" className={className}>
      로그인하고 전체 결과 보기 <span aria-hidden="true">→</span>
    </Link>
  );
}
