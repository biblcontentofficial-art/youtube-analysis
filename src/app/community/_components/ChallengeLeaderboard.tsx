/**
 * 매일 유튜브 챌린지 월간 TOP 5 후보 (소유자 요청 2026-10-28, 레이스 막대형)
 * - 이번 달(KST)만 센다. 막대 길이 = 글 수 / 1위 글 수. 빈 자리는 '도전 가능'으로 남겨 첫 글만으로도 들어올 수 있게 보인다.
 * - 참여 유도: 마감까지 남은 날, 내 순위와 '앞 순위까지 / TOP 5까지 글 N개', 보상 문구(매달 말 TOP 5 사무실 초대 컨설팅).
 * - 같은 글 수면 먼저 도달한 사람이 앞선다(getMonthlyAuthorRanking). 그래서 따라잡으려면 '차이 + 1'개가 필요하다.
 * 서버 컴포넌트(훅 없음).
 */

import Link from "next/link";
import type { MemberGrade } from "@/lib/community";
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
  gradeMap: Record<string, MemberGrade>;
  writeHref: string;
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
  gradeMap,
  writeHref,
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

      <ol className="mt-5 space-y-2.5">
        {slots.map((r, i) => (
          <li key={r?.author_id ?? `empty-${i}`} className="flex items-center gap-3">
            <span className="tnum w-4 shrink-0 text-center text-caption font-bold text-fg-3">{i + 1}</span>
            {r ? (
              <MemberAvatar name={r.author_name} avatarUrl={avatarMap[r.author_id]} grade={gradeMap[r.author_id]} size={28} />
            ) : (
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-caption text-fg-4">
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
        <Link href={writeHref} className={cx(buttonClass({ size: "sm" }), "shrink-0")}>
          오늘 인증 쓰기
        </Link>
      </div>
    </section>
  );
}
