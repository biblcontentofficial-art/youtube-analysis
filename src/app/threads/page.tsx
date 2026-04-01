import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getThreadsConnection } from "@/lib/db";
import { getThreadsUsage } from "@/lib/threadsLimit";
import { searchThreads, filterByMediaType } from "@/lib/threads";
import { getSavedThreads } from "@/lib/db";
import ThreadsSearchBar from "./_components/ThreadsSearchBar";
import ThreadsFilterTab from "./_components/FilterTab";
import ConnectMetaButton from "./_components/ConnectMetaButton";
import ThreadsResultList from "./_components/ThreadsResultList";
import MyAccountDashboard from "./_components/MyAccountDashboard";
import SavedThreadsList from "./saved/_components/SavedThreadsList";
import ThreadsTabNav from "./_components/ThreadsTabNav";

export const metadata: Metadata = {
  title: "스레드 트렌드 분석 · 바이럴 게시물 찾기",
  description:
    "비블랩 스레드 분석 — 키워드로 스레드(Threads) 트렌드 게시물을 검색하고 바이럴 점수·아웃라이어를 확인하세요. 크리에이터와 마케터를 위한 데이터 인사이트.",
  keywords: [
    "스레드 분석", "스레드 트렌드", "threads 바이럴", "스레드 키워드 검색",
    "비블랩 스레드", "스레드 마케팅", "threads analytics",
  ],
  alternates: { canonical: "https://bibllab.com/threads" },
  openGraph: {
    title: "스레드 트렌드 분석 | 비블랩",
    description: "스레드 키워드 검색, 바이럴 점수, 아웃라이어 분석.",
    url: "https://bibllab.com/threads",
  },
};

interface Props {
  searchParams: {
    q?: string;
    filter?: string;
    tab?: string;
    connected?: string;
    error?: string;
    detail?: string;
  };
}

export default async function ThreadsPage({ searchParams }: Props) {
  const tab = (searchParams.tab ?? "search") as "search" | "analytics" | "saved";
  const query = (searchParams.q ?? "").trim();
  const filter = (searchParams.filter ?? "all") as "all" | "text" | "image" | "video";
  const justConnected = searchParams.connected === "1";
  const oauthError = searchParams.error;
  const oauthErrorDetail = searchParams.detail;

  // 사용자 정보
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const plan = ((user?.publicMetadata?.plan as PlanKey) ?? "free") as PlanKey;
  const planData = PLANS[plan in PLANS ? plan : "free"];
  const canViralScore = planData.canThreadsViralScore;
  const canCollect = planData.canCollect;
  const threadsConfigured = !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);

  // Meta 연결 여부
  const connection = userId ? await getThreadsConnection(userId) : null;

  // 검색 횟수
  const usage = await getThreadsUsage();

  // 검색 실행 (키워드 검색 탭에서만)
  let posts: Awaited<ReturnType<typeof searchThreads>>["posts"] = [];
  let nextCursor: string | undefined;
  let searchError: string | null = null;

  if (tab === "search" && query && connection) {
    try {
      const result = await searchThreads(query, connection.access_token);
      const filtered = filterByMediaType(result.posts, filter);
      posts = filtered;
      nextCursor = result.cursor;
    } catch (err) {
      searchError = err instanceof Error ? err.message : "검색 중 오류가 발생했어요";
    }
  }

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
            <svg viewBox="0 0 192 192" fill="white" className="w-5 h-5">
              <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.05-14.127 5.177-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C88.984 150.013 83 132.995 82.667 112h-16.8c.353 24.923 7.62 44.968 21.516 59.273C101.182 185.072 122.027 192.113 148 192.351l.26-.002c29.603-.223 52.246-9.272 67.285-24.9 18.141-18.692 17.764-42.228 11.712-56.621-4.284-9.986-12.383-18.092-23.965-23.999a66.667 66.667 0 0 0-1.755-.84Z"/>
            </svg>
            <h1 className="text-lg font-semibold">스레드 분석</h1>
          </div>
          <p className="text-xs text-gray-500">
            키워드 트렌드 검색, 내 계정 성과 분석, 게시물 수집
          </p>
        </div>

        {/* OAuth 결과 알림 */}
        {justConnected && (
          <div className="mb-4 bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3 text-sm text-teal-400">
            Meta 계정 연결 완료! 이제 스레드 게시물을 검색할 수 있어요.
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

        {/* 탭 네비게이션 */}
        <ThreadsTabNav current={tab} />

        {/* 탭 콘텐츠 */}
        <div className="mt-6">
          {/* ───── 키워드 검색 탭 ───── */}
          {tab === "search" && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 사이드바 */}
              <div className="lg:w-64 shrink-0 space-y-4">
                {userId && !threadsConfigured ? (
                  <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                    <p className="text-sm text-white font-medium mb-1">스레드 연동 준비 중</p>
                    <p className="text-xs text-gray-500">곧 Meta(Threads) 계정 연동이 가능해져요.</p>
                  </div>
                ) : userId ? (
                  <ConnectMetaButton username={connection?.username} />
                ) : (
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-400 mb-3">로그인 후 스레드를 분석해보세요</p>
                    <a href="/sign-in" className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-md transition">
                      로그인
                    </a>
                  </div>
                )}

                {userId && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">스레드 검색 사용량</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xl font-bold text-white">{usage.used}</span>
                        <span className="text-gray-600 text-sm">/{usage.unlimited ? "\u221e" : usage.limit}</span>
                      </div>
                      <span className="text-xs text-gray-600">{usage.isMonthly ? "이번 달" : "오늘"}</span>
                    </div>
                    {!usage.unlimited && (
                      <div className="mt-2 bg-gray-800 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {!canViralScore && userId && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">바이럴 점수 잠금</p>
                    <p className="text-xs text-gray-400">Starter 플랜부터 바이럴 점수를 확인할 수 있어요.</p>
                    <a href="/pricing" className="mt-2 inline-block text-xs text-teal-400 hover:text-teal-300 transition">
                      플랜 보기 &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* 메인 영역 */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <ThreadsSearchBar defaultValue={query} />
                </div>

                {query && (
                  <div className="mb-4">
                    <ThreadsFilterTab current={filter} />
                  </div>
                )}

                {!query ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 192 192" fill="white" className="w-9 h-9 opacity-30">
                        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.05-14.127 5.177-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C88.984 150.013 83 132.995 82.667 112h-16.8c.353 24.923 7.62 44.968 21.516 59.273C101.182 185.072 122.027 192.113 148 192.351l.26-.002c29.603-.223 52.246-9.272 67.285-24.9 18.141-18.692 17.764-42.228 11.712-56.621-4.284-9.986-12.383-18.092-23.965-23.999a66.667 66.667 0 0 0-1.755-.84Z"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">키워드를 검색하면</p>
                    <p className="text-gray-500 text-sm">스레드 인기 게시물을 분석해드려요</p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {["다이어트", "재테크", "자기계발", "마케팅", "부업"].map((kw) => (
                        <a key={kw} href={`/threads?q=${encodeURIComponent(kw)}`} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-full transition">
                          {kw}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : !connection ? (
                  <div className="text-center py-16">
                    <p className="text-gray-400 text-sm mb-2">&ldquo;{query}&rdquo; 검색 결과를 보려면</p>
                    <p className="text-gray-500 text-xs mb-6">왼쪽에서 Meta 계정을 연결해주세요</p>
                  </div>
                ) : searchError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                    {searchError}
                  </div>
                ) : (
                  <ThreadsResultList
                    initialPosts={posts}
                    initialCursor={nextCursor}
                    query={query}
                    filter={filter}
                    canViralScore={canViralScore}
                    canCollect={canCollect}
                    used={usage.used}
                    limit={usage.limit}
                    isMonthly={usage.isMonthly}
                  />
                )}
              </div>
            </div>
          )}

          {/* ───── 내 계정 분석 탭 ───── */}
          {tab === "analytics" && (
            <div>
              {!userId ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm mb-3">로그인 후 이용할 수 있어요</p>
                  <a href="/sign-in" className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg">로그인</a>
                </div>
              ) : !canViralScore ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-white mb-1">Starter 플랜부터 이용 가능</h2>
                  <p className="text-xs text-gray-500 mb-4">내 계정 데이터 분석은 Starter 이상 플랜에서 사용할 수 있어요</p>
                  <a href="/pricing" className="bg-teal-500 hover:bg-teal-400 text-white text-sm px-5 py-2 rounded-lg transition">
                    플랜 업그레이드
                  </a>
                </div>
              ) : !connection ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm mb-4">Meta 계정을 연결하면 내 스레드 성과를 분석해드려요</p>
                  <ConnectMetaButton username={undefined} />
                </div>
              ) : (
                <MyAccountDashboard />
              )}
            </div>
          )}

          {/* ───── 수집함 탭 ───── */}
          {tab === "saved" && (
            <div>
              {!userId ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm mb-3">로그인 후 이용할 수 있어요</p>
                  <a href="/sign-in" className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg">로그인</a>
                </div>
              ) : !canCollect ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-white mb-1">Pro 플랜부터 이용 가능</h2>
                  <p className="text-xs text-gray-500 mb-4">스레드 게시물 수집과 CSV 내보내기는 Pro 이상 플랜에서 사용할 수 있어요</p>
                  <a href="/pricing" className="bg-teal-500 hover:bg-teal-400 text-white text-sm px-5 py-2 rounded-lg transition">
                    플랜 업그레이드
                  </a>
                </div>
              ) : (
                <SavedThreadsList initialThreads={savedThreads} />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
