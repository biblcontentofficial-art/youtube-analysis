/**
 * 매일 유튜브 챌린지 월간 TOP 5 후보 (소유자 요청 2026-10-28, 레이스 막대형)
 * - 이번 달(KST)만 센다. 막대 길이 = 글 수 / 1위 글 수. 빈 자리는 '도전 가능'으로 남겨 첫 글만으로도 들어올 수 있게 보인다.
 * - 참여 유도: 마감까지 남은 날, 내 순위와 '앞 순위까지 / TOP 5까지 글 N개', 보상 문구(매달 말 TOP 5 사무실 초대 컨설팅).
 * - 같은 글 수면 먼저 도달한 사람이 앞선다(getMonthlyAuthorRanking). 그래서 따라잡으려면 '차이 + 1'개가 필요하다.
 * 챌린지 게시판과 커뮤니티 첫 화면(전체글)에 띄운다. 전체글에서는 '챌린지 게시판' 링크가 함께 보인다.
 * 서버 컴포넌트(훅 없음).
 */

import Link from "next/link";
import type { MonthlyAuthor } from "@/lib/communityDb";
import { buttonClass, cx } from "@/components/ui/button";
import MemberAvatar from "./MemberAvatar";

const TOP = 5;

interface Props {
  ranking: MonthlyAuthor[];
  /** 이번 달 숫자(1~12) */
  month: number;
  /** 오늘 포함 마감까지 남은 날 */
  daysLeft: number;
  /** 마감일 표기(예: 10.31) */
  endLabel: string;
  viewerId?: string | null;
  avatarMap: Record<string, string | null>;
  writeHref: string;
  /** 다른 화면(전체글)에서 띄울 때 챌린지 게시판으로 가는 링크 */
  boardHref?: string;
}

/**
 * 순위 배지(아바타 오른쪽 아래). 소유자 요청 2026-10-29: 1등 다이아몬드 왕관 · 2등 금 왕관 · 3등 금메달 · 4등 은메달 · 5등 동메달.
 * 메달·보석 색은 의미가 있는 표식이라 SVG fill 리터럴로 둔다(유튜브·구글 로고와 같은 예외). 순위는 옆 숫자로도 읽히므로 장식(aria-hidden).
 */
const MEDAL = {
  gold: { face: "#F5C542", edge: "#B8860B", ribbon: "#D9534F" },
  silver: { face: "#D7DBE0", edge: "#8A9099", ribbon: "#5B7DB1" },
  bronze: { face: "#D08A4E", edge: "#8B5A2B", ribbon: "#5B7DB1" },
} as const;

function Crown({ body, edge, gem }: { body: string; edge: string; gem: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-full" aria-hidden="true">
      <path d="M3 15.5 2 6.5l4.5 3.5L10 4l3.5 6L18 6.5l-1 9Z" fill={body} stroke={edge} strokeWidth="1" strokeLinejoin="round" />
      <rect x="3" y="15" width="14" height="2.5" rx="0.8" fill={body} stroke={edge} strokeWidth="1" />
      <path d="M10 9.5 11.6 11.5 10 13.5 8.4 11.5Z" fill={gem} stroke={edge} strokeWidth="0.6" />
    </svg>
  );
}

function Medal({ face, edge, ribbon }: { face: string; edge: string; ribbon: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-full" aria-hidden="true">
      <path d="M6 1h3l2 6H8Z" fill={ribbon} />
      <path d="M14 1h-3L9 7h3Z" fill={ribbon} opacity="0.85" />
      <circle cx="10" cy="12.5" r="6" fill={face} stroke={edge} strokeWidth="1.2" />
      <circle cx="10" cy="12.5" r="3.6" fill="none" stroke={edge} strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const icon =
    rank === 1 ? (
      // 다이아몬드 왕관: 얼음빛 몸체 + 흰 보석
      <Crown body="#BDEFFF" edge="#4FB3D9" gem="#FFFFFF" />
    ) : rank === 2 ? (
      <Crown body="#F5C542" edge="#B8860B" gem="#D9534F" />
    ) : rank === 3 ? (
      <Medal {...MEDAL.gold} />
    ) : rank === 4 ? (
      <Medal {...MEDAL.silver} />
    ) : (
      <Medal {...MEDAL.bronze} />
    );
  return (
    <span className="absolute -bottom-1.5 -right-2 flex size-6 items-center justify-center rounded-full border border-line bg-surface-2 p-[3px]">
      {icon}
    </span>
  );
}

function viewerMessage(ranking: MonthlyAuthor[], viewerId: string): string {
  const idx = ranking.findIndex((r) => r.author_id === viewerId);
  const mine = idx >= 0 ? ranking[idx].count : 0;
  if (idx === 0) {
    const second = ranking[1]?.count ?? 0;
    return `지금 1위 · 2위와 ${mine - second}개 차이`;
  }
  if (idx > 0 && idx < TOP) {
    const ahead = ranking[idx - 1].count;
    return `지금 ${idx + 1}위 · 글 ${ahead - mine + 1}개면 ${idx}위`;
  }
  // TOP 5 밖: 자리가 비어 있으면 1개, 다 찼으면 5위보다 1개 더
  const fifth = ranking[TOP - 1]?.count;
  const need = fifth === undefined ? 1 : fifth - mine + 1;
  return `${mine > 0 ? `이번 달 ${mine}개 · ` : ""}글 ${need}개면 TOP 5 진입`;
}

export default function ChallengeLeaderboard({
  ranking,
  month,
  daysLeft,
  endLabel,
  viewerId,
  avatarMap,
  writeHref,
  boardHref,
}: Props) {
  const top = ranking.slice(0, TOP);
  const max = Math.max(1, top[0]?.count ?? 1);
  const slots = Array.from({ length: TOP }, (_, i) => top[i] ?? null);

  return (
    <section aria-labelledby="challenge-top-title" className="rounded-card border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="challenge-top-title" className="text-ui font-extrabold text-fg md:text-body">
          {month}월 챌린지 TOP 5 후보
        </h3>
        <p className="tnum text-caption text-fg-3">
          {daysLeft <= 1 ? "오늘 마감" : `마감까지 ${daysLeft}일`} · {endLabel}
        </p>
      </div>
      <p className="mt-1.5 text-body-sm text-fg-2">
        매달 말 TOP 5에 선정된 분들은 비블 사무실에 초대해 컨설팅을 직접 드리고 있습니다.
      </p>

      <ol className="mt-5 space-y-3.5">
        {slots.map((r, i) => (
          <li key={r?.author_id ?? `empty-${i}`} className="flex items-center gap-3">
            <span className="tnum w-4 shrink-0 text-center text-caption font-bold text-fg-3">{i + 1}</span>
            {r ? (
              <span className="relative shrink-0">
                {/* 등급 배지 대신 순위 배지(1 다이아 왕관 · 2 금 왕관 · 3 금 · 4 은 · 5 동메달) */}
                <MemberAvatar name={r.author_name} avatarUrl={avatarMap[r.author_id]} size={36} />
                <RankBadge rank={i + 1} />
              </span>
            ) : (
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-caption text-fg-4">
                +
              </span>
            )}
            <span className={cx("w-20 shrink-0 truncate text-body-sm sm:w-28", r ? "font-semibold text-fg" : "text-fg-4")}>
              {r ? r.author_name : "도전 가능"}
              {r && r.author_id === viewerId && <span className="ml-1 text-caption font-normal text-fg-3">(나)</span>}
            </span>
            <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
              {r && (
                <span
                  className={cx("absolute inset-y-0 left-0 rounded-full", i === 0 ? "bg-accent" : "bg-silver")}
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              )}
            </span>
            <span className="tnum w-10 shrink-0 text-right text-body-sm font-semibold text-fg">
              {r ? `${r.count}개` : ""}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-fg-2">
          {viewerId ? (
            <>
              <span className="font-semibold text-fg">나</span> · {viewerMessage(ranking, viewerId)}
            </>
          ) : (
            "로그인하고 오늘의 인증 글을 남겨 보세요"
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {boardHref && (
            <Link href={boardHref} className={buttonClass({ variant: "secondary", size: "sm" })}>
              챌린지 게시판
            </Link>
          )}
          <Link href={writeHref} className={buttonClass({ size: "sm" })}>
            오늘 인증 쓰기
          </Link>
        </div>
      </div>
    </section>
  );
}
