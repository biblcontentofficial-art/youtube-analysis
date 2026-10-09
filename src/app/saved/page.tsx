import { auth, currentUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { getSavedVideos } from "@/lib/db";
import { PLANS, PlanKey } from "@/lib/stripe";
import SavedVideoList from "./_components/SavedVideoList";
import ToolTabs from "../_components/ToolTabs";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "수집한 영상",
};

/**
 * 수집한 영상 (Pro). 앱 셸: 도구 탭(현재 = 수집한 영상) → 제목 → 목록 (DESIGN 7.2, 검정 캔버스)
 */
export default async function SavedPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const plan = (user?.plan as string) ?? "free";
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;

  if (!planData.canSavedVideos) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <ToolTabs current="/saved" />
        <div className="mx-auto flex max-w-reading flex-col items-center px-6 py-24 text-center">
          <h1 className="text-h4 font-extrabold">수집한 영상</h1>
          <p className="mt-3 text-body-sm text-fg-2">Pro 플랜부터 사용 가능한 기능입니다.</p>
          <p className="mt-1 text-caption text-fg-3">영상 찾기에서 영상을 수집하면 이곳에서 모아볼 수 있습니다.</p>
          <Link href="/pricing" className={`${buttonClass()} mt-6`}>
            플랜 업그레이드 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  const videos = userId ? await getSavedVideos(userId) : [];

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <ToolTabs current="/saved" />
      <div className="mx-auto w-full max-w-wide px-6 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-h4 font-extrabold">수집한 영상</h1>
            <p className="mt-1 text-body-sm text-fg-3">영상 찾기에서 수집한 영상을 모아볼 수 있습니다</p>
          </div>
          {/* 빈 상태에는 목록 안 '영상 찾기' 버튼이 있어 머리의 같은 버튼은 그리지 않는다 */}
          {videos.length > 0 && (
            <Link href="/search" className={buttonClass({ variant: "secondary", size: "sm" })}>
              영상 찾기 <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <SavedVideoList initialVideos={videos} />
      </div>
    </main>
  );
}
