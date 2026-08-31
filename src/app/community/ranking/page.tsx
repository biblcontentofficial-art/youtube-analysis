/**
 * /community/ranking — 멤버 랭킹 (Skool 방식)
 * 기간 탭(지난 7일 / 지난 30일 / 전체) + 리더보드 + 내 점수 카드 + 포인트 안내.
 * 레벨 배지는 항상 전체 기간 점수 기준으로 계산한다.
 */
import type { Metadata } from "next";
import MemberAvatar from "../_components/MemberAvatar";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import {
  getAvatarMap,
  getGradeMap,
  getMemberRanking,
  getPointsMap,
  getViewerMembership,
} from "@/lib/communityDb";
import {
  GRADE_THRESHOLDS,
  GRADE_NAMES,
  GRADE_EMOJI,
  gradeForPoints,
  pointsToNextGrade,
  displayName,
} from "@/lib/community";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "랭킹 | 비블 커뮤니티",
};

type Period = "7days" | "30days" | "all";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "7days", label: "지난 7일" },
  { key: "30days", label: "지난 30일" },
  { key: "all", label: "전체" },
];

function sinceFor(period: Period): Date | undefined {
  if (period === "7days") return new Date(Date.now() - 7 * 24 * 3600 * 1000);
  if (period === "30days") return new Date(Date.now() - 30 * 24 * 3600 * 1000);
  return undefined;
}



interface Props {
  searchParams: Promise<{ p?: string }>;
}

export default async function RankingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period: Period = sp.p === "7days" || sp.p === "all" ? sp.p : "30days";

  const [user, ranking] = await Promise.all([
    currentUser(),
    getMemberRanking(sinceFor(period), 30),
  ]);

  // 레벨 배지·내 점수용 전체 기간 점수 맵.
  // 전체 탭이면 같은 결과를 재사용하고, 아니면 한 번 더 조회한다.
  let allTimePoints: Record<string, number>;
  if (period === "all") {
    allTimePoints = {};
    for (const r of ranking) allTimePoints[r.author_id] = r.points;
  } else {
    allTimePoints = await getPointsMap();
  }

  // 프로필 사진 · 등급 (아바타)
  const peopleIds = [...ranking.map((r) => r.author_id), user?.id];
  const [avatarMap, gradeMap] = await Promise.all([
    getAvatarMap(peopleIds),
    getGradeMap(peopleIds),
  ]);

  // 내 카드는 활동 점수 기준 (리더보드의 좋아요 점수와 척도가 다르므로 분리한다)
  const myMembership = user
    ? await getViewerMembership({ id: user.id, email: user.email, plan: user.plan })
    : null;
  const myPoints = myMembership?.points ?? 0;
  const myGrade = myMembership?.grade ?? gradeForPoints(0);
  const myNext = pointsToNextGrade(myPoints);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-white">랭킹</h2>
      <p className="-mt-3 text-xs text-neutral-500">
        아래 순위는 기간 내 받은 좋아요 수 기준입니다. 등급은 활동 점수로 오릅니다.
      </p>

      {/* 내 순위 카드 */}
      {user && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-3">
            <MemberAvatar
              name={displayName(user.firstName, user.email)}
              avatarUrl={avatarMap[user.id]}
              grade={gradeMap[user.id]}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                내 활동 점수 <span className="tabular-nums">{myPoints.toLocaleString("ko-KR")}</span>점 · {GRADE_EMOJI[myGrade]} {GRADE_NAMES[myGrade]}
              </p>
              {myPoints === 0 ? (
                <p className="mt-0.5 text-xs text-neutral-400">
                  아직 점수가 없어요. 글을 쓰고 좋아요를 받아보세요.
                </p>
              ) : myNext !== null ? (
                <p className="mt-0.5 text-xs text-neutral-400">
                  {GRADE_NAMES[myNext.next]}까지{" "}
                  <span className="tabular-nums">{myNext.remain.toLocaleString("ko-KR")}</span>점
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-neutral-400">최고 등급에 도달했어요.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 기간 탭 */}
      <nav className="flex flex-wrap gap-2" aria-label="랭킹 기간">
        {PERIOD_TABS.map((tab) => {
          const active = tab.key === period;
          return (
            <Link
              key={tab.key}
              href={`/community/ranking?p=${tab.key}`}
              className={
                active
                  ? "rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
                  : "rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 hover:bg-white/[0.02]"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* 리더보드 */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2">
        {ranking.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            아직 랭킹이 없습니다. 첫 좋아요의 주인공이 되어보세요.
          </p>
        ) : (
          <ol>
            {ranking.map((member, i) => {
              const rank = i + 1;
              const name = displayName(member.author_name);
              const memberGrade = gradeMap[member.author_id] ?? gradeForPoints(allTimePoints[member.author_id] ?? 0);
              return (
                <li
                  key={member.author_id}
                  className="flex items-center gap-3 border-b border-white/[0.06] py-3 last:border-b-0"
                >
                  <span
                    className={`w-7 shrink-0 text-center text-sm tabular-nums ${
                      rank <= 3 ? "font-black text-[#00E5A0]" : "text-neutral-500"
                    }`}
                  >
                    {rank}
                  </span>
                  <MemberAvatar
                    name={name}
                    avatarUrl={avatarMap[member.author_id]}
                    grade={gradeMap[member.author_id]}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-neutral-500">{GRADE_EMOJI[memberGrade]} {GRADE_NAMES[memberGrade]}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#00E5A0]">
                    +{member.points.toLocaleString("ko-KR")}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* 점수·등급 안내 */}
      <section className="space-y-3">
        <p className="text-sm text-neutral-400">
          글 +5점(하루 3편까지) · 댓글 +1점(하루 5개까지) · 내 글이 받은 좋아요 +3점(상한 없음) ·
          출석 +1점 · 7일 연속 출석 +10점
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([1, 2, 3, 4, 5] as const).map((g) => (
            <div
              key={g}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs"
            >
              <span className="font-bold text-white">
                {GRADE_EMOJI[g]} {GRADE_NAMES[g]}
              </span>
              <span className="text-neutral-400">
                {" "}· <span className="tabular-nums">{GRADE_THRESHOLDS[g].toLocaleString("ko-KR")}</span>점
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
