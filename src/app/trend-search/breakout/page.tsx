/**
 * /trend-search/breakout — 브레이크아웃
 * 주제와 상관없이, 하루 동안 게시된 영상 중 구독자 수에 비해 조회수가 잘 나온 영상을 모아 본다.
 * 데이터는 매일 아침 cron(/api/cron/breakout)이 전날(한국 시간) 게시분을 수집해 둔다.
 * 화면에는 YouTube 가 주는 원본 값(조회수·구독자·게시일)만 보여 주고, 조회수÷구독자는 정렬·필터에만 쓴다.
 * 로그인 뒤: 탭 줄 '관심 목록' 숫자(안 읽은 알림 수, notification_unread_count 1회)와 행마다 관심 채널 등록 버튼(C7, T9).
 * 두 값은 약속(Promise)으로 넘겨 영상 목록과 함께 읽는다.
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getUnreadCount, getWatchedChannelIds } from "@/lib/trend/watch";
import { SectionHeader } from "@/components/ui/section-header";
import { BreakoutView } from "./breakout-view";
import { LoginGate } from "./_components/LoginGate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "브레이크아웃",
  description: "주제와 상관없이 오늘 유튜브에서 구독자 대비 조회수가 잘 나온 영상을 매일 모아 봅니다.",
  robots: { index: false, follow: false },
};

type SP = Promise<{ date?: string; sort?: string; type?: string; min?: string }>;

export default async function BreakoutPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
          <SectionHeader caption="유튜브 트렌드 서치" label="BREAKOUT" />
          <h1 className="text-h3 md:text-h2">브레이크아웃</h1>
          <LoginGate
            next="/trend-search/breakout"
            desc="오늘 유튜브에서 구독자 대비 조회수가 잘 나온 영상을 매일 모아 보여 드립니다."
          />
        </div>
      </main>
    );
  }

  return <BreakoutView sp={sp} badge={getUnreadCount(user.id)} watchedIds={getWatchedChannelIds(user.id)} />;
}
