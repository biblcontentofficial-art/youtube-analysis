/**
 * 커뮤니티 정보 사이드 카드 (Skool형 · 데스크톱 전용)
 * 커뮤니티 소개 · 멤버/글 수 · 새 포스트 CTA · 오픈채팅방 · 카테고리 목록.
 *
 * 카테고리 링크 규약: 피드는 /community?cat={slug} 쿼리 파라미터로 카테고리를 필터링한다.
 * (피드 페이지의 ?cat= 파싱과 반드시 같은 slug 규약을 쓴다)
 */

import Link from "next/link";
import type { Board } from "@/lib/community";

interface Props {
  boards: Board[];
  stats: { posts: number; members: number };
  /** board_id → 게시글 수 (getBoardCounts) */
  counts: Record<string, number>;
}

export default function CommunitySideCard({ boards, stats, counts }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm font-bold text-white">비블 커뮤니티</p>
      <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
        유튜브로 사업을 키우는 사람들의 공간.
        <br />
        질문하고, 자료 받고, 성과를 나눕니다.
      </p>

      <div className="my-4 border-t border-white/[0.06]" />

      <p className="text-xs text-neutral-500">
        멤버{" "}
        <span className="font-semibold text-neutral-200">{stats.members.toLocaleString()}</span>
        {" · "}글{" "}
        <span className="font-semibold text-neutral-200">{stats.posts.toLocaleString()}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/community/write"
          className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
        >
          새 포스트
        </Link>
        <a
          href="https://open.kakao.com/o/gsMC55Jh"
          target="_blank"
          rel="noopener noreferrer"
          title="참여코드 230000"
          className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          비블 오픈채팅방
        </a>
      </div>

      {boards.length > 0 && (
        <>
          <div className="my-4 border-t border-white/[0.06]" />
          <p className="px-2 text-xs font-bold text-neutral-500">카테고리</p>
          <ul className="mt-2 flex flex-col">
            {boards.map((b) => (
              <li key={b.id}>
                {/* 피드 카테고리 필터 규약: /community?cat={slug} */}
                <Link
                  href={`/community?cat=${b.slug}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-neutral-400 transition hover:bg-white/[0.02] hover:text-white"
                >
                  <span className="truncate">{b.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-neutral-500">
                    {counts[b.id] ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
