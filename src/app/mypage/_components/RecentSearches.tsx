"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { CHIP } from "@/components/ui/chip";

/** 칩과 같은 높이(DESIGN 6.6·8: 40px · 640 이상 36px · 터치 기기 44px). 자리 표시·빈 상태도 칩 줄과 같은 높이를 갖는다 */
const CHIP_H = "h-10 sm:h-9 pointer-coarse:h-11";

/**
 * 최근 검색 카드 틀(DESIGN 6.7 앱 카드 + 6.6 칩 줄).
 * 칩 줄은 모바일 한 줄 가로 스크롤, 640 이상은 줄바꿈해 모든 칩이 보인다. 포커스 링이 잘리지 않게 사방 4px 여유(-m-1 p-1).
 * 로컬 미리보기도 이 틀을 쓴다.
 */
export function RecentSearchesFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 md:p-6">
      <h3 className="mb-3 text-body-sm font-semibold text-fg-2">최근 검색 키워드</h3>
      <div className="-m-1 flex items-center gap-2 overflow-x-auto p-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {children}
      </div>
    </div>
  );
}

/** 불러오는 중: 칩 높이의 자리 표시 3개 */
export function RecentSearchesPlaceholder() {
  return (
    <div role="status" className="flex gap-2">
      <span className="sr-only">불러오는 중</span>
      {[72, 96, 64].map((w) => (
        <span
          key={w}
          aria-hidden="true"
          style={{ width: w }}
          className={`${CHIP_H} shrink-0 animate-pulse rounded-control bg-surface-2 motion-reduce:animate-none`}
        />
      ))}
    </div>
  );
}

/** 기록 없음: 칩 줄과 같은 높이 */
export function RecentSearchesEmpty() {
  return <p className={`${CHIP_H} flex items-center text-body-sm text-fg-3`}>아직 검색 기록이 없습니다.</p>;
}

interface HistoryItem {
  term: string;
  count: number;
}

function localHistoryKey(userId: string) {
  return `searchHistory:${userId}`;
}

function loadLocalHistory(userId: string): HistoryItem[] {
  try {
    const saved = localStorage.getItem(localHistoryKey(userId));
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    if (typeof parsed[0] === "string") {
      return parsed.map((t: string) => ({ term: t, count: 1 }));
    }
    return parsed;
  } catch {
    return [];
  }
}

export default function RecentSearches() {
  const router = useRouter();
  const [history, setHistoryState] = useState<HistoryItem[]>([]);
  // 기록을 한 번이라도 받았는지(받기 전에는 같은 높이의 자리 표시를 그린다)
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const setHistory = (items: HistoryItem[]) => {
    setHistoryState(items);
    setHistoryLoaded(true);
  };
  const [user, setUser] = useState<{ id: string; plan: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const plan = (data.user.user_metadata?.plan as string) ?? "free";
        setUser({ id: data.user.id, plan });
      }
      setIsLoaded(true);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setHistory([]);
      return;
    }

    const plan = user.plan;
    const canServerHistory = ["starter", "pro", "business", "admin", "team"].includes(plan);

    if (canServerHistory) {
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
      setHistory(loadLocalHistory(user.id));
    }
  }, [isLoaded, user?.id]);

  // 불러오는 동안·기록이 없을 때도 같은 높이의 카드를 둔다(아래 버튼이 밀리지 않게)
  const frame = (body: ReactNode) => <RecentSearchesFrame>{body}</RecentSearchesFrame>;

  if (!isLoaded || (user && !historyLoaded)) {
    return frame(<RecentSearchesPlaceholder />);
  }

  if (!user || history.length === 0) {
    return frame(<RecentSearchesEmpty />);
  }

  const top = history.slice(0, 8);

  return frame(
    <>
        {top.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(item.term)}&fromHistory=1`)}
            className={CHIP}
          >
            {item.term}
            {item.count > 1 && (
              <span className="tnum rounded-md bg-surface-3 px-1.5 py-0.5 text-micro font-semibold leading-none text-fg-1">
                {item.count}회
              </span>
            )}
          </button>
        ))}
    </>,
  );
}
