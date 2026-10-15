/**
 * /trend-search/breakout/channels · 지금 크는 채널(A2)
 * 최근 14/30일 브레이크아웃에 서로 다른 날 2번 이상 오른 구독자 10만(또는 1만) 미만 채널을 벤치마킹 후보로 보여 준다.
 * 데이터는 breakout_videos 를 RPC trend_recurring_channels 로 채널별 집계한다(src/lib/trend/channels.ts, API 비용 0).
 * 화면은 channels-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-channels?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 쿼리: days=14|30 · format=all|long|shorts · subs=100000|10000 (그 밖 값은 기본값 14 · all · 100000).
 * 동작 자리는 관심 등록(C7, WatchChannelButton: 1024 이상 고스트 · 미만 글자 버튼), 탭 줄 '관심 목록' 숫자는 안 읽은 알림 수
 * (notification_unread_count 1회). 로그인 뒤 데이터·관심 채널·안 읽은 수를 함께 읽는다.
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getRecurringChannels, parseChannelQuery } from "@/lib/trend/channels";
import { getUnreadCount, getWatchedChannelIds } from "@/lib/trend/watch";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
import { WatchChannelButton } from "../_components/WatchChannelButton";
import { ChannelsView } from "./channels-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "지금 크는 채널",
  description: "최근 브레이크아웃에 여러 번 오른 구독자 10만 미만 채널을 벤치마킹 후보로 모아 봅니다.",
  robots: { index: false, follow: false },
};

type SP = Promise<{ days?: string; format?: string; subs?: string }>;

export default async function ChannelsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
          <SectionHeader caption="유튜브 트렌드 서치" label="CHANNELS" />
          <h1 className="text-h3 md:text-h2">지금 크는 채널</h1>
          <LoginGate
            next="/trend-search/breakout/channels"
            desc="최근 브레이크아웃에 여러 번 오른 구독자 10만 미만 채널을 매일 모아 보여 드립니다."
          />
        </div>
      </main>
    );
  }

  const [data, watchedIds, unread] = await Promise.all([
    getRecurringChannels(parseChannelQuery(sp)),
    getWatchedChannelIds(user.id),
    getUnreadCount(user.id),
  ]);
  const watched = new Set(watchedIds);
  return (
    <ChannelsView
      data={data}
      badge={unread}
      actionSlot={(c, place) => (
        <WatchChannelButton
          channel={{ channelId: c.channelId, title: c.channelTitle, thumb: c.channelThumb }}
          watched={watched.has(c.channelId)}
          variant={place === "table" ? "ghost" : "text"}
          className={place === "table" ? "-mr-3" : "-ml-2"}
        />
      )}
    />
  );
}
