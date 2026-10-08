"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cx } from "@/components/ui/button";

interface UsageData {
  used: number;
  limit: number;
  plan: string;
  unlimited: boolean;
}

/** 검색 완료 때 이 이벤트가 오면 남은 횟수를 다시 읽는다(NavigationLoader 가 /search?q= 이동이 끝나면 보낸다) */
export const SEARCH_COMPLETE_EVENT = "bibl:search-complete";

/** 상자 모양(DESIGN 6.12 남은 횟수). 기능 색은 5회 이하 caution · 0회 negative, 평소 fg-2 */
const BADGE_BOX =
  "tnum inline-flex h-8 items-center whitespace-nowrap rounded-control border px-2.5 text-micro transition-colors duration-150";

/**
 * 네비 남은 횟수 배지(로그인 상태에서만 그린다). 누름 영역 44px, 누르면 요금제(무제한은 마이페이지).
 * 조회는 표시용 GET(/api/usage)만 하고 검색 차감과 무관하다.
 * 다시 읽는 때: /search 를 떠날 때, 검색 완료 이벤트. 메뉴를 누를 때마다 다시 읽지 않는다(인증·Redis 호출 절약).
 */
export default function SearchUsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d: UsageData) => { if (alive) setUsage(d); })
        .catch(() => {});
    };
    load();
    window.addEventListener(SEARCH_COMPLETE_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(SEARCH_COMPLETE_EVENT, load);
    };
  }, []);

  // /search 를 떠날 때 한 번 다시 읽는다
  useEffect(() => {
    const was = prevPath.current;
    prevPath.current = pathname;
    if (was === "/search" && pathname !== "/search") {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d: UsageData) => setUsage(d))
        .catch(() => {});
    }
  }, [pathname]);

  const wrap = "group hidden h-11 shrink-0 items-center px-1 sm:inline-flex";

  // 자리 폭은 늘 가장 긴 라벨 폭으로 잡는다(조회 전후·라벨이 바뀌어도 네비 오른쪽이 밀리지 않게). 배지는 오른쪽 정렬
  const slot = (badge: ReactNode) => (
    <span className="grid items-center justify-items-end">
      <span aria-hidden="true" className={cx(BADGE_BOX, "invisible font-semibold [grid-area:1/1]")}>
        한도 초과 · 업그레이드
      </span>
      {badge}
    </span>
  );
  const cell = "[grid-area:1/1]";

  // 조회 전: 같은 폭의 빈 자리
  if (!usage) {
    return <span aria-hidden="true" className={wrap}>{slot(null)}</span>;
  }

  // Business/Admin: 무제한 표시
  if (usage.unlimited) {
    return (
      <Link href="/mypage" className={wrap} title="무제한 검색">
        {slot(
          <span className={cx(BADGE_BOX, cell, "border-line text-fg-2 group-hover:border-line-hover group-hover:text-fg")}>
            무제한
          </span>,
        )}
      </Link>
    );
  }

  const remaining = Math.max(0, usage.limit - usage.used);
  const isOut = remaining === 0;
  const isLow = remaining <= 5;
  const label = isOut ? "한도 초과 · 업그레이드" : remaining === 1 ? "검색 1회 남음" : `${remaining}회 남음`;

  return (
    <Link
      href="/pricing"
      className={wrap}
      title={isOut ? "한도 초과 · 업그레이드" : `${usage.limit}회 중 ${usage.used}회 사용`}
    >
      {slot(
        <span
          aria-hidden="true"
          className={cx(
            BADGE_BOX,
            cell,
            isOut
              ? "border-negative/55 font-semibold text-negative"
              : isLow
              ? "border-caution/55 text-caution"
              : "border-line text-fg-2 group-hover:border-line-hover group-hover:text-fg",
          )}
        >
          {label}
        </span>,
      )}
      <span className="sr-only">{isOut ? "영상 검색 한도 초과, 요금제 보기" : `영상 검색 ${remaining}회 남음`}</span>
    </Link>
  );
}
