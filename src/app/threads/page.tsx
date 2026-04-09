import type { Metadata } from "next";
import { auth, currentUser } from "@/lib/auth";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getThreadsConnection } from "@/lib/db";
import { getSavedThreads } from "@/lib/db";
import ConnectMetaButton from "./_components/ConnectMetaButton";
import MyAccountDashboard from "./_components/MyAccountDashboard";
import SavedThreadsList from "./saved/_components/SavedThreadsList";
import ThreadsTabNav from "./_components/ThreadsTabNav";
import ThreadsLogo from "./_components/ThreadsLogo";

export const metadata: Metadata = {
  title: "스레드 분석 · 내 계정 성과 데이터",
  description:
    "비블랩 스레드 분석 — 내 Threads 계정의 성과를 분석하고 데이터 인사이트를 확인하세요.",
  keywords: [
    "스레드 분석", "threads analytics", "스레드 성과",
    "비블랩 스레드", "스레드 데이터",
  ],
  alternates: { canonical: "https://bibllab.com/threads" },
  openGraph: {
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
  const oauthErrorDetail = searchParams.detail;

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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ThreadsLogo className="w-7 h-7 text-white" />
            <h1 className="text-2xl font-bold">Threads 분석</h1>
          </div>
          <p className="text-sm text-gray-500">
            내 계정 성과 분석, 게시물 데이터 인사이트
          </p>
        </div>

        {/* OAuth 결과 알림 */}
        {justConnected && (
          <div className="mb-4 bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3 text-sm text-teal-400">
            Meta 계정 연결 완료! 이제 스레드 데이터를 분석할 수 있어요.
          </div>
        )}
        {oauthError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {oauthError === "cancelled"
              ? "연결이 취소됐어요."
              : oauthError === "token_failed"
              ? "토큰 발급에 실패했어요. 다시 시도해주세요."
              : oauthError === "not_configured"
              ? "스레드 연동 기능을 준비하고 있어요. 곧 이용 가능합니다!"
              : "연결 중 오류가 발생했어요. 다시 시도해주세요."}
          {oauthErrorDetail && (
            <div className="mt-2 text-xs text-red-300/70 font-mono break-all">
              {decodeURIComponent(oauthErrorDetail)}
            </div>
          )}
          </div>
        )}

        {/* 비로그인 → 로그인 유도 */}
        {!userId ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-5">
              <ThreadsLogo className="w-11 h-11 text-white opacity-30" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Threads 계정 분석</h2>
            <p className="text-base text-gray-400 mb-1">내 Threads 게시물의 성과를 한눈에 확인하세요</p>
            <p className="text-sm text-gray-500 mb-8">조회수, 좋아요, 댓글, 리포스트 등 상세 데이터 분석</p>
            <a
              href="/sign-in"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-base font-medium px-8 py-3 rounded-lg transition"
            >
              로그인하고 시작하기
            </a>
          </div>
        ) : (
          <>
            {/* 로그인됨 — Meta 연결 상태 */}
            <div className="mb-6">
              <ConnectMetaButton username={connection?.username} />
            </div>

            {/* 탭 네비게이션 */}
            <ThreadsTabNav current={tab} />

            {/* 탭 콘텐츠 */}
            <div className="mt-6">
              {/* ───── 내 계정 분석 탭 ───── */}
              {tab === "analytics" && (
                <div>
                  {!canViralScore ? (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2">Starter 플랜부터 이용 가능</h2>
                      <p className="text-sm text-gray-500 mb-5">내 계정 데이터 분석은 Starter 이상 플랜에서 사용할 수 있어요</p>
                      <a href="/pricing" className="bg-teal-500 hover:bg-teal-400 text-white text-base px-6 py-2.5 rounded-lg transition">
                        플랜 업그레이드
                      </a>
                    </div>
                  ) : !connection ? (
                    <div className="text-center py-20">
                      <p className="text-gray-400 text-base">위에서 Meta 계정을 연결하면 내 Threads 성과를 분석해드려요</p>
                    </div>
                  ) : (
                    <MyAccountDashboard />
                  )}
                </div>
              )}

              {/* ───── 수집함 탭 ───── */}
              {tab === "saved" && (
                <div>
                  {!canCollect ? (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2">Pro 플랜부터 이용 가능</h2>
                      <p className="text-sm text-gray-500 mb-5">게시물 수집과 CSV 내보내기는 Pro 이상 플랜에서 사용할 수 있어요</p>
                      <a href="/pricing" className="bg-teal-500 hover:bg-teal-400 text-white text-base px-6 py-2.5 rounded-lg transition">
                        플랜 업그레이드
                      </a>
                    </div>
                  ) : (
                    <SavedThreadsList initialThreads={savedThreads} />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
