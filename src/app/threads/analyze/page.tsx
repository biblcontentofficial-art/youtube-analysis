import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getThreadsConnection } from "@/lib/db";
import { analyzeThreadsAccount } from "./actions";
import AccountSearchForm from "./_components/AccountSearchForm";
import ThreadsAccountDashboard from "./_components/ThreadsAccountDashboard";
import ConnectMetaButton from "../_components/ConnectMetaButton";

export const metadata: Metadata = {
  title: "스레드 계정 분석 · 게시물 성과 리포트",
  description:
    "비블랩 — 스레드(Threads) 계정의 게시물 반응, 최적 게시 시간, 트렌드를 한눈에 분석합니다.",
  keywords: [
    "스레드 계정 분석", "threads 분석", "스레드 인사이트", "스레드 반응 분석",
    "threads analytics", "비블랩 스레드",
  ],
  alternates: { canonical: "https://bibllab.com/threads/analyze" },
};

interface Props {
  searchParams: { account?: string };
}

export default async function ThreadsAnalyzePage({ searchParams }: Props) {
  const account = (searchParams.account ?? "").trim();

  // 사용자 정보
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const plan = ((user?.publicMetadata?.plan as PlanKey) ?? "free") as PlanKey;
  const isStarterPlus = plan !== "free";

  // Meta 연결 여부
  const connection = userId ? await getThreadsConnection(userId) : null;

  // 분석 실행 (Starter+ & 연결됨 & 계정명 있을 때)
  let result: Awaited<ReturnType<typeof analyzeThreadsAccount>> | null = null;
  if (account && isStarterPlus && connection) {
    result = await analyzeThreadsAccount(account);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 192 192" fill="white" className="w-5 h-5">
                <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.05-14.127 5.177-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C88.984 150.013 83 132.995 82.667 112h-16.8c.353 24.923 7.62 44.968 21.516 59.273C101.182 185.072 122.027 192.113 148 192.351l.26-.002c29.603-.223 52.246-9.272 67.285-24.9 18.141-18.692 17.764-42.228 11.712-56.621-4.284-9.986-12.383-18.092-23.965-23.999a66.667 66.667 0 0 0-1.755-.84Z"/>
              </svg>
              <h1 className="text-lg font-semibold">스레드 계정 분석</h1>
            </div>
            <p className="text-xs text-gray-500">
              @username을 입력하면 게시물 성과·최적 시간·트렌드를 분석합니다
            </p>
          </div>
          <a
            href="/threads"
            className="text-xs text-gray-500 hover:text-gray-300 transition px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg"
          >
            ← 키워드 검색
          </a>
        </div>

        {/* 비로그인 */}
        {!userId && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-3">로그인 후 계정 분석을 이용할 수 있어요</p>
            <a href="/sign-in" className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg transition">
              로그인
            </a>
          </div>
        )}

        {/* Free 플랜 잠금 */}
        {userId && !isStarterPlus && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-white font-medium mb-1">Starter 플랜부터 이용 가능</p>
            <p className="text-gray-500 text-sm mb-4">
              스레드 계정 분석은 Starter 이상 플랜에서 사용할 수 있어요
            </p>
            <a
              href="/pricing"
              className="inline-block bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              플랜 업그레이드
            </a>
          </div>
        )}

        {/* Starter+ : Meta 미연결 */}
        {userId && isStarterPlus && !connection && (
          <div className="max-w-md mx-auto mt-8">
            <ConnectMetaButton />
          </div>
        )}

        {/* Starter+ & 연결됨 : 검색폼 + 결과 */}
        {userId && isStarterPlus && connection && (
          <div className="space-y-6">
            <AccountSearchForm defaultValue={account} />

            {!account && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3 opacity-30">@</div>
                <p className="text-gray-500 text-sm">분석할 스레드 계정을 입력하세요</p>
                <p className="text-gray-600 text-xs mt-1">@username 또는 Threads URL</p>
              </div>
            )}

            {account && result && "error" in result && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                {result.error}
              </div>
            )}

            {account && result && !("error" in result) && (
              <ThreadsAccountDashboard
                profile={result.profile}
                posts={result.posts}
                insights={result.insights}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
