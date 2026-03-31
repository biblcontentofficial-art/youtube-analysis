import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getSavedThreads } from "@/lib/db";
import SavedThreadsList from "./_components/SavedThreadsList";

export const metadata: Metadata = {
  title: "수집한 스레드 게시물",
  description: "비블랩 — 수집한 스레드 게시물을 확인하고 CSV로 내보내세요.",
};

export default async function SavedThreadsPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/search");
  }

  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const plan = ((user?.publicMetadata?.plan as PlanKey) ?? "free") as PlanKey;
  const planData = PLANS[plan in PLANS ? plan : "free"];

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-3">로그인이 필요합니다</p>
          <a href="/sign-in" className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg">로그인</a>
        </div>
      </main>
    );
  }

  if (!planData.canCollect) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-lg font-semibold mb-1">Pro 플랜부터 이용 가능</h1>
          <p className="text-gray-500 text-sm mb-4">
            스레드 게시물 수집과 CSV 내보내기는 Pro 이상 플랜에서 사용할 수 있어요
          </p>
          <a href="/pricing" className="bg-teal-500 hover:bg-teal-400 text-white text-sm px-5 py-2 rounded-lg transition">
            플랜 업그레이드
          </a>
        </div>
      </main>
    );
  }

  const threads = await getSavedThreads(userId);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">수집한 스레드</h1>
            <p className="text-xs text-gray-500">수집한 게시물을 확인하고 CSV로 내보내세요</p>
          </div>
          <a
            href="/threads"
            className="text-xs text-gray-500 hover:text-gray-300 transition px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg"
          >
            ← 스레드 검색
          </a>
        </div>

        <SavedThreadsList initialThreads={threads} />
      </div>
    </main>
  );
}
