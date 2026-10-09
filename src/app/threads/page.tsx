import type { Metadata } from "next";
import { OG_DEFAULT } from "@/lib/seo";
import { auth, currentUser } from "@/lib/auth";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getThreadsConnection } from "@/lib/db";
import { getSavedThreads } from "@/lib/db";
import ConnectMetaButton from "./_components/ConnectMetaButton";
import MyAccountDashboard from "./_components/MyAccountDashboard";
import SavedThreadsList from "./saved/_components/SavedThreadsList";
import ThreadsTabNav from "./_components/ThreadsTabNav";
import ThreadsLogo from "./_components/ThreadsLogo";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { CheckIcon, InfoIcon, WarningIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "스레드 분석 · 내 계정 성과 데이터",
  description:
    "비블랩 스레드 분석. 내 Threads 계정의 성과를 분석하고 데이터 인사이트를 확인하세요.",
  keywords: [
    "스레드 분석", "threads analytics", "스레드 성과",
    "비블랩 스레드", "스레드 데이터",
  ],
  alternates: { canonical: "https://bibllab.com/threads" },
  openGraph: {
    ...OG_DEFAULT,
    title: "스레드 분석 | 비블랩",
    description: "내 Threads 계정 성과 분석, 게시물 데이터 인사이트.",
    url: "https://bibllab.com/threads",
  },
};

interface Props {
  searchParams: {
    tab?: string;
    connected?: string;
    error?: string;
    detail?: string;
  };
}

export default async function ThreadsPage({ searchParams }: Props) {
  const tab = (searchParams.tab ?? "analytics") as "analytics" | "saved";

  const justConnected = searchParams.connected === "1";
  const oauthError = searchParams.error;
  // searchParams.detail(OAuth 오류 원문)은 화면에 그리지 않는다(서버 로그에 남는다)

  // 사용자 정보
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const plan = ((user?.plan as PlanKey) ?? "free") as PlanKey;
  const planData = PLANS[plan in PLANS ? plan : "free"];
  const canViralScore = planData.canThreadsViralScore;
  const canCollect = planData.canCollect;

  // Meta 연결 여부
  const connection = userId ? await getThreadsConnection(userId) : null;

  // 수집함 데이터 (saved 탭에서만)
  let savedThreads: Awaited<ReturnType<typeof getSavedThreads>> = [];
  if (tab === "saved" && userId && canCollect) {
    savedThreads = await getSavedThreads(userId);
  }

  const oauthMessage =
    oauthError === "cancelled"
      ? "연결이 취소됐어요."
      : oauthError === "token_failed"
      ? "토큰 발급에 실패했어요. 다시 시도해주세요."
      : oauthError === "not_configured"
      ? "스레드 연동 기능을 준비하고 있어요. 곧 이용 가능합니다!"
      : "연결 중 오류가 발생했어요. 다시 시도해주세요.";

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        {/* 머리: 실버 라벨(DESIGN 6.4) + h1 */}
        <SectionHeader caption="Threads 계정 연동" label="THREADS" className="mb-6! md:mb-8!" />
        <h1 className="flex items-center gap-2.5 text-h3 text-fg">
          <ThreadsLogo decorative className="size-7 shrink-0" />
          스레드 분석
        </h1>
        <p className="mt-2 text-body-sm text-fg-3 md:text-ui">
          내 계정 성과 분석, 게시물 데이터 인사이트
        </p>

        {/* OAuth 결과 알림 (상태 메시지, DESIGN 6.13) */}
        {justConnected && (
          <div role="status" className={`${STATUS_BOX} border-positive/55`}>
            <CheckIcon className="mt-0.5 text-positive" />
            <div className="min-w-0">
              <p className="text-ui font-semibold text-positive">Threads 계정 연결 완료</p>
              <p className="mt-0.5 text-body-sm text-fg-3">이제 스레드 데이터를 분석할 수 있어요.</p>
            </div>
          </div>
        )}
        {oauthError && (
          oauthError === "not_configured" ? (
            <div role="status" className={`${STATUS_BOX} border-line`}>
              <InfoIcon className="mt-0.5 text-fg-2" />
              <p className="min-w-0 text-body-sm text-fg-2">{oauthMessage}</p>
            </div>
          ) : (
            <div role="alert" className={`${STATUS_BOX} border-negative/55`}>
              <WarningIcon className="mt-0.5 text-negative" />
              <div className="min-w-0">
                <p className="text-ui font-semibold text-negative">연결 실패</p>
                <p className="mt-0.5 text-body-sm text-fg-3">{oauthMessage}</p>
              </div>
            </div>
          )
        )}

        {/* 비로그인 → 로그인 유도 */}
        {!userId ? (
          <div className="mx-auto max-w-reading py-20 text-center md:py-24">
            <ThreadsLogo decorative className="mx-auto size-10 text-fg-3" />
            <h2 className="mt-5 text-h4 text-fg">Threads 계정 분석</h2>
            <p className="mt-3 text-body-sm text-fg-2 md:text-body">내 Threads 게시물의 성과를 한눈에 확인하세요</p>
            <p className="mt-1 text-caption text-fg-3">조회수, 좋아요, 댓글, 리포스트 등 상세 데이터 분석</p>
            <Link href="/sign-in" className={`${buttonClass({ size: "lg" })} mt-8`}>
              로그인하고 시작하기
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            {/* 탭 네비게이션 (도구 탭 레시피) */}
            <ThreadsTabNav current={tab} />

            {/* 탭 콘텐츠 */}
            <div className="mt-6">
              {/* ───── 내 계정 분석 탭 ───── */}
              {tab === "analytics" && (
                <div className="space-y-6">
                  {!canViralScore ? (
                    <>
                      {/* 무료: 플랜 안내를 먼저, 연결 카드는 그 아래(흰 버튼은 플랜 안내 하나) */}
                      <PlanLock
                        title="Starter 플랜부터 이용 가능"
                        desc="내 계정 데이터 분석은 Starter 이상 플랜에서 사용할 수 있어요"
                      />
                      <ConnectMetaButton username={connection?.username} secondary />
                    </>
                  ) : !connection ? (
                    <ConnectMetaButton />
                  ) : (
                    <>
                      <ConnectMetaButton username={connection.username} />
                      <MyAccountDashboard />
                    </>
                  )}
                </div>
              )}

              {/* ───── 수집함 탭 ───── */}
              {tab === "saved" && (
                <div>
                  {!canCollect ? (
                    <PlanLock
                      title="Pro 플랜부터 이용 가능"
                      desc="게시물 수집과 CSV 내보내기는 Pro 이상 플랜에서 사용할 수 있어요"
                    />
                  ) : (
                    <SavedThreadsList initialThreads={savedThreads} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/** 상태 메시지 상자(DESIGN 6.13). 테두리 색은 쓰는 곳에서 붙인다 */
const STATUS_BOX = "mt-6 flex gap-3 rounded-card border bg-surface p-4";

/** 플랜 잠금 안내: 앱 카드 + 제목 · 설명 · 흰 '플랜 업그레이드'. 자물쇠 아이콘 상자 없음(DESIGN 6.29) */
function PlanLock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-5 md:p-6">
      <div>
        <h2 className="text-ui font-semibold text-fg">{title}</h2>
        <p className="mt-1.5 text-body-sm text-fg-3">{desc}</p>
      </div>
      <Link href="/pricing" className={buttonClass()}>
        플랜 업그레이드 <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
