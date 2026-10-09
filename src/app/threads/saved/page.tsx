import type { Metadata } from "next";
import { auth, currentUser } from "@/lib/auth";
import { PLANS, PlanKey } from "@/lib/stripe";
import { getSavedThreads } from "@/lib/db";
import SavedThreadsList from "./_components/SavedThreadsList";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "수집한 스레드 게시물",
  description: "비블랩. 수집한 스레드 게시물을 확인하고 CSV로 내보내세요.",
};

export default async function SavedThreadsPage() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const plan = ((user?.plan as PlanKey) ?? "free") as PlanKey;
  const planData = PLANS[plan in PLANS ? plan : "free"];

  if (!userId) {
    return (
      <main className="flex min-h-[60vh] items-center bg-canvas py-16 text-fg md:py-24">
        <div className="mx-auto w-full max-w-reading px-6 text-center lg:px-8">
          <p className="text-body-sm text-fg-2 md:text-body">로그인이 필요합니다</p>
          <Link href="/sign-in" className={`${buttonClass()} mt-6`}>로그인</Link>
        </div>
      </main>
    );
  }

  if (!planData.canCollect) {
    return (
      <main className="flex min-h-[60vh] items-center bg-canvas py-16 text-fg md:py-24">
        <div className="mx-auto w-full max-w-reading px-6 text-center lg:px-8">
          <h1 className="text-h4 text-fg">Pro 플랜부터 이용 가능</h1>
          <p className="mt-3 text-body-sm text-fg-3 md:text-body">
            스레드 게시물 수집과 CSV 내보내기는 Pro 이상 플랜에서 사용할 수 있어요
          </p>
          <Link href="/pricing" className={`${buttonClass()} mt-8`}>
            플랜 업그레이드 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  const threads = await getSavedThreads(userId);

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        {/* 뒤로가기 글자 링크(DESIGN 6.32) */}
        <Link
          href="/threads"
          className="inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg"
        >
          <span aria-hidden="true">←</span> 스레드 분석
        </Link>
        <div className="mb-6 mt-2">
          <h1 className="text-h4 font-extrabold">수집한 스레드</h1>
          <p className="mt-1 text-body-sm text-fg-3">수집한 게시물을 확인하고 CSV로 내보내세요</p>
        </div>

        <SavedThreadsList initialThreads={threads} />
      </div>
    </main>
  );
}
