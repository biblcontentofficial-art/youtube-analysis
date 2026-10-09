"use client";

import Link from "next/link";
import { useNavigationLoading } from "@/app/_components/NavigationLoader";
import { SEGMENT_ITEM } from "@/components/ui/chip";

/**
 * 길이 필터(전체 · 쇼츠 제외 · 쇼츠만). 세그먼트 레시피(DESIGN 6.6): 선택된 항목만 면이 surface-3 으로 한 단 올라간다.
 * 흰 면 활성 금지(흰 면은 폴드당 '검색' 하나). 선택 상태는 aria-current 로만 표시한다.
 * 틀(SEGMENT + 모바일 전체 폭)은 search/page.tsx 가 그린다.
 */

interface Props {
  href: string;
  active: boolean;
  label: string;
}

export default function FilterTab({ href, active, label }: Props) {
  const { showLoading } = useNavigationLoading();

  return (
    <Link
      href={href}
      onClick={() => { if (!active) showLoading("필터 적용 중..."); }}
      aria-current={active ? "true" : undefined}
      className={`${SEGMENT_ITEM} flex-1 md:flex-none`}
    >
      {label}
    </Link>
  );
}
