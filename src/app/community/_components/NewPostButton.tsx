"use client";

/**
 * 새 포스트 버튼.
 * 지금 보고 있는 게시판을 글쓰기 폼의 기본 선택으로 넘긴다.
 * (카테고리 피드 /community?cat=slug, 게시판 글 상세 /community/[board]/[id])
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RESERVED_BOARD_SLUGS } from "@/lib/community";

export default function NewPostButton({ className }: { className: string }) {
  const pathname = usePathname() || "/community";
  const params = useSearchParams();

  let board = params.get("cat") ?? "";
  if (!board && pathname.startsWith("/community/")) {
    const seg = pathname.split("/")[2] ?? "";
    if (seg && !RESERVED_BOARD_SLUGS.includes(seg)) board = seg;
  }

  const href = board ? `/community/write?board=${encodeURIComponent(board)}` : "/community/write";

  return (
    <Link href={href} className={className}>
      새 포스트
    </Link>
  );
}
