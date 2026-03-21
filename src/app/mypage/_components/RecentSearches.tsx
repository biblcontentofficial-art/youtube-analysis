"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
  const { user, isLoaded } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setHistory([]);
      return;
    }

    const plan = (user.publicMetadata?.plan as string) ?? "free";
    const canServerHistory = ["starter", "pro", "business", "admin"].includes(plan);

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
  }, [isLoaded, user]);

  if (!isLoaded || !user || history.length === 0) return null;

  const top = history.slice(0, 8);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <p className="text-gray-500 text-xs mb-3">최근 검색 키워드</p>
      <div className="flex flex-wrap gap-2">
        {top.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => router.push(`/search?q=${encodeURIComponent(item.term)}&fromHistory=1`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 hover:bg-gray-700 border border-gray-700 hover:border-teal-600 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
          >
            {item.term}
            {item.count > 1 && (
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800 px-1.5 py-0.5 rounded-full leading-none">
                {item.count}회
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
