import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSearchUsage } from "@/lib/searchLimit";
import LogoutButton from "./_components/LogoutButton";

export default async function MyPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) || "free";

  let usage = { used: 0, limit: 2 };
  try {
    usage = await getSearchUsage();
  } catch {}

  const planLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    business: "Business",
  };

  const planColors: Record<string, string> = {
    free: "text-gray-400",
    starter: "text-blue-400",
    pro: "text-teal-400",
    business: "text-purple-400",
  };

  const displayName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "사용자";
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/search" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-white">bibl</span>
              <span className="text-teal-400"> lab</span>
            </span>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 space-y-6">
          <h1 className="text-xl font-bold text-white text-center">마이페이지</h1>

          {searchParams.payment === 'success' && (
            <div className="bg-teal-950/50 border border-teal-700 rounded-xl p-4 text-center">
              <p className="text-teal-400 font-semibold text-sm">🎉 구독이 시작됐습니다!</p>
              <p className="text-gray-500 text-xs mt-1">이제 더 많은 검색을 즐기세요.</p>
            </div>
          )}

          {/* 유저 정보 */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-white font-semibold text-base">{displayName}</p>
            {email && <p className="text-gray-500 text-sm mt-0.5">{email}</p>}
          </div>

          {/* 현재 플랜 */}
          <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">현재 플랜</p>
              <p className={`font-bold text-lg ${planColors[plan] || "text-gray-400"}`}>
                {planLabels[plan] || plan}
              </p>
            </div>
            {plan === "free" && (
              <Link
                href="/pricing"
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                업그레이드
              </Link>
            )}
          </div>
          {plan !== "free" && (
            <div className="text-xs text-gray-600 mt-1">
              {plan === 'starter' && '하루 10회 검색 · 결과 100건'}
              {plan === 'pro' && '하루 50회 검색 · 결과 200건'}
              {plan === 'business' && '무제한 검색 · 결과 200건'}
            </div>
          )}

          {/* 오늘 사용량 */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-2">오늘 검색 사용량</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-lg">{usage.used} / {usage.limit}회</span>
              <span className="text-gray-600 text-xs">매일 00:00 UTC 리셋</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-teal-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 검색 바로가기 */}
          <Link
            href="/search"
            className="w-full flex items-center justify-center py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition text-sm font-medium"
          >
            검색으로 이동
          </Link>

          {/* 로그아웃 */}
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
