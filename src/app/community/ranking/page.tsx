/**
 * /community/ranking — 멤버 랭킹 (Skool 방식)
 * 기간 탭(지난 7일 / 지난 30일 / 전체) + 리더보드 + 내 점수 카드 + 포인트 안내.
 * 레벨 배지는 항상 전체 기간 점수 기준으로 계산한다.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getMemberRanking, getPointsMap } from "@/lib/communityDb";
import {
  LEVEL_THRESHOLDS,
  levelForPoints,
  pointsToNextLevel,
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

/** 이니셜 아바타 + 우하단 레벨 배지 (Skool 방식) */
function LevelAvatar({ name, level }: { name: string; level: number }) {
  const initial = (name.trim().charAt(0) || "비").toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">
        {initial}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5A0] text-[9px] font-black text-black">
        {level}
      </span>
    </div>
  );
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

  const myPoints = user ? allTimePoints[user.id] ?? 0 : 0;
  const myLevel = levelForPoints(myPoints);
  const myNext = pointsToNextLevel(myPoints);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-white">랭킹</h2>

      {/* 내 순위 카드 */}
      {user && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-3">
            <LevelAvatar
              name={displayName(user.firstName, user.email)}
              level={myLevel}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                내 점수 <span className="tabular-nums">{myPoints.toLocaleString("ko-KR")}</span>점 · LV.{myLevel}
              </p>
              {myPoints === 0 ? (
                <p className="mt-0.5 text-xs text-neutral-400">
                  아직 점수가 없어요. 글을 쓰고 좋아요를 받아보세요.
                </p>
              ) : myNext !== null ? (
                <p className="mt-0.5 text-xs text-neutral-400">
                  다음 레벨까지 <span className="tabular-nums">{myNext.toLocaleString("ko-KR")}</span>점
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-neutral-400">최고 레벨에 도달했어요.</p>
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
              const level = levelForPoints(allTimePoints[member.author_id] ?? 0);
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
                  <LevelAvatar name={name} level={level} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-neutral-500">LV.{level}</p>
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

      {/* 포인트 안내 */}
      <section className="space-y-3">
        <p className="text-sm text-neutral-400">
          다른 멤버가 내 글에 좋아요를 누르면 1점을 얻어요.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVEL_THRESHOLDS.map((threshold, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs"
            >
              <span className="font-bold text-white">LV.{i + 1}</span>
              <span className="text-neutral-400">
                {" "}· <span className="tabular-nums">{threshold.toLocaleString("ko-KR")}</span>점
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
