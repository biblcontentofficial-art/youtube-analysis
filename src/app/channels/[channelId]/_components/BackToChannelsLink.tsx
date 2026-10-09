"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cameFromChannelList, isPlainLeftClick } from "../../_components/listState";

/**
 * "채널 찾기로 돌아가기".
 * 같은 탭에서 목록을 거쳐 왔으면 router.back() 으로 이미 받은 목록을 되살린다(서버 재요청·재차감 없음,
 * 바꿔 둔 정렬 유지). 직접 들어왔거나 새 탭이면 href(검증된 from 또는 /channels)로 이동한다.
 */
export default function BackToChannelsLink({ href }: { href: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      // 미리 가져오기를 끄면 목록 주소로 가는 요청이 실제로 누를 때만 생긴다.
      prefetch={false}
      onClick={(e) => {
        if (!isPlainLeftClick(e)) return;
        if (!cameFromChannelList(window.location.pathname)) return;
        e.preventDefault();
        router.back();
      }}
      className="inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg"
    >
      <span aria-hidden="true">←</span>
      <span>채널 찾기로 돌아가기</span>
    </Link>
  );
}
