import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getSavedVideos } from "@/lib/db";
import { PLANS, PlanKey } from "@/lib/stripe";
import SavedVideoList from "./_components/SavedVideoList";

export default async function SavedPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const plan = (user?.publicMetadata?.plan as string) ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  if (!planData.canSavedVideos) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🔖</div>
          <h1 className="text-2xl font-bold">수집한 영상</h1>
          <p className="text-gray-400 text-sm">Pro 플랜부터 사용 가능한 기능입니다.</p>
          <p className="text-gray-600 text-xs">영상 찾기에서 영상을 수집하면 이곳에서 모아볼 수 있습니다.</p>
          <Link
            href="/pricing"
            className="inline-block bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            플랜 업그레이드 →
          </Link>
        </div>
      </main>
    );
  }

  const videos = userId ? await getSavedVideos(userId) : [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">🔖 수집한 영상</h1>
            <p className="text-xs text-gray-500 mt-0.5">영상 찾기에서 수집한 영상을 모아볼 수 있습니다</p>
          </div>
          <Link
            href="/search"
            className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg transition font-medium"
          >
            영상 찾기 →
          </Link>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <SavedVideoList initialVideos={videos} />
      </div>
    </main>
  );
}
