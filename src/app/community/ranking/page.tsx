/**
 * /community/ranking — 멤버 랭킹 (Skool 방식)
 * 기간 탭(지난 7일 / 지난 30일 / 전체) + 리더보드 표(기준 설명 바로 아래) + 내 점수 카드 + 포인트 안내.
 * 순위 숫자는 기간 내 받은 좋아요 수라 '좋아요 N' 으로 적는다. 상위 3위 순위만 흰 600, 내 줄은 bg-surface.
 * 운영자 계정 표시는 결정 17 기본(C): 그대로.
 * 레벨 배지는 항상 전체 기간 점수 기준으로 계산한다.
 * 등급은 이름 글자로만 적는다(이모지 아이콘 금지, DESIGN 1.3). 아바타 모서리 배지는 소유자 결정 대기.
 */
import type { Metadata } from "next";
import MemberAvatar from "../_components/MemberAvatar";
import Link from "next/link";
import { cx } from "@/components/ui/button";
import { SEGMENT, SEGMENT_ITEM } from "@/components/ui/chip";
import { NUM, ROW, TABLE, TD, TH } from "@/components/ui/table";
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

  // 회원 전용: 레이아웃 게이트가 화면을 막아도 페이지 RSC 는 함께 렌더되므로,
  // 비로그인이면 회원 이름·순위를 조회하지 않고 빈 화면을 돌려준다(게이트만 보인다).
  const user = await currentUser();
  if (!user) return null;
  const ranking = await getMemberRanking(sinceFor(period), 30);

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
      <h1 className="text-h4 font-extrabold text-fg">랭킹</h1>

      {/* 내 순위 카드 */}
      {user && (
        <section aria-label="내 활동 점수" className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <MemberAvatar
              name={displayName(user.firstName, user.email)}
              avatarUrl={avatarMap[user.id]}
              grade={gradeMap[user.id]}
            />
            <div className="min-w-0">
              <p className="text-body-sm font-bold text-fg">
                내 활동 점수 <span className="tnum">{myPoints.toLocaleString("ko-KR")}</span>점 · {GRADE_NAMES[myGrade]}
              </p>
              {myPoints === 0 ? (
                <p className="mt-0.5 text-caption text-fg-3">
                  아직 점수가 없어요. 글을 쓰고 좋아요를 받아보세요.
                </p>
              ) : myNext !== null ? (
                <p className="mt-0.5 text-caption text-fg-3">
                  {GRADE_NAMES[myNext.next]}까지{" "}
                  <span className="tnum">{myNext.remain.toLocaleString("ko-KR")}</span>점
                </p>
              ) : (
                <p className="mt-0.5 text-caption text-fg-3">최고 등급에 도달했어요.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 기간 탭 */}
      <nav className={SEGMENT} aria-label="랭킹 기간">
        {PERIOD_TABS.map((tab) => {
          const active = tab.key === period;
          return (
            <Link
              key={tab.key}
              href={`/community/ranking?p=${tab.key}`}
              aria-current={active ? "true" : undefined}
              className={SEGMENT_ITEM}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* 리더보드: 기준 설명 바로 아래 표 */}
      <section aria-labelledby="ranking-basis">
        <p id="ranking-basis" className="mb-3 text-caption text-fg-3">
          아래 순위는 기간 내 받은 좋아요 수 기준입니다. 등급은 활동 점수로 오릅니다.
        </p>
        {ranking.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-body-sm text-fg-3">
            아직 랭킹이 없습니다. 첫 좋아요의 주인공이 되어보세요.
          </p>
        ) : (
          <table className={TABLE}>
            <thead>
              <tr>
                <th scope="col" className={cx(TH, "w-14 text-center")}>순위</th>
                <th scope="col" className={TH}>멤버</th>
                <th scope="col" className={cx(TH, "w-28 pr-3 text-right")}>좋아요</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((member, i) => {
                const rank = i + 1;
                const name = displayName(member.author_name);
                const memberGrade = gradeMap[member.author_id] ?? gradeForPoints(allTimePoints[member.author_id] ?? 0);
                const isMe = user?.id === member.author_id;
                return (
                  <tr
                    key={member.author_id}
                    aria-current={isMe ? "true" : undefined}
                    className={cx(ROW, isMe && "bg-surface")}
                  >
                    <td
                      className={cx(
                        TD,
                        "tnum text-center text-body-sm",
                        rank <= 3 ? "font-semibold text-accent" : "text-fg-3",
                      )}
                    >
                      {rank}
                    </td>
                    <td className={TD}>
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar
                          name={name}
                          avatarUrl={avatarMap[member.author_id]}
                          grade={gradeMap[member.author_id]}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-semibold text-fg">
                            {name}
                            {isMe && <span className="ml-1.5 text-caption font-medium text-fg-3">(나)</span>}
                          </p>
                          <p className="text-caption text-fg-3">{GRADE_NAMES[memberGrade]}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cx(TD, NUM, "pr-3 text-body-sm text-fg-1")}>
                      좋아요 {member.points.toLocaleString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* 점수·등급 안내 */}
      <section className="space-y-3">
        <p className="text-body-sm text-fg-3">
          글 +5점(하루 3편까지) · 댓글 +1점(하루 5개까지) · 내 글이 받은 좋아요 +3점(상한 없음) ·
          출석 +1점 · 7일 연속 출석 +10점
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([1, 2, 3, 4, 5] as const).map((g) => (
            <div
              key={g}
              className="rounded-control border border-line bg-surface px-3 py-2 text-caption"
            >
              <span className="font-bold text-fg">
                {GRADE_NAMES[g]}
              </span>
              <span className="text-fg-3">
                {" "}· <span className="tnum">{GRADE_THRESHOLDS[g].toLocaleString("ko-KR")}</span>점
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
