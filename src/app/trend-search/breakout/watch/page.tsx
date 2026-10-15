/**
 * /trend-search/breakout/watch · 관심 목록(C7)
 * 등록한 관심 키워드·채널의 영상이 브레이크아웃에 오르면 매일 아침 cron notify 단계가 알림을 만들고, 여기서 모아 본다.
 * 데이터는 src/lib/trend/watch.ts(listWatch · listNotifications · getUnreadCount), 쓰기는 /api/watch · /api/notifications/read.
 * 화면은 watch-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-watch?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 이메일·카카오 발송은 범위 밖(사이트 안 알림만). 플랜은 getUserPlan(userId)(profiles)로만 정한다.
 */
import type { Metadata } from "next";
import { currentUser, getUserPlan } from "@/lib/auth";
import { getUnreadCount, listNotifications, listWatch } from "@/lib/trend/watch";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
import { WatchView, type WatchPageData } from "./watch-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "관심 목록",
  description: "등록한 키워드·채널의 영상이 브레이크아웃에 오르면 매일 아침 모아 봅니다.",
  robots: { index: false, follow: false },
};

export default async function WatchPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
          <SectionHeader caption="유튜브 트렌드 서치" label="WATCH" />
          <h1 className="text-h3 md:text-h2">관심 목록</h1>
          <LoginGate
            next="/trend-search/breakout/watch"
            desc="등록한 키워드·채널의 영상이 브레이크아웃에 오르면 매일 아침 모아 보여 드립니다."
          />
        </div>
      </main>
    );
  }

  const [watch, notifications, unread] = await Promise.all([
    getUserPlan(user.id).then((plan) => listWatch(user.id, plan)),
    listNotifications(user.id),
    getUnreadCount(user.id),
  ]);
  const data: WatchPageData = watch && notifications ? { state: "ok", watch, notifications } : { state: "error" };
  return <WatchView data={data} badge={unread} />;
}
