/**
 * /trend-search/breakout/channels · 지금 크는 채널(A2)
 * 최근 14/30일 브레이크아웃에 서로 다른 날 2번 이상 오른 구독자 10만(또는 1만) 미만 채널을 벤치마킹 후보로 보여 준다.
 * 데이터는 breakout_videos 를 RPC trend_recurring_channels 로 채널별 집계한다(src/lib/trend/channels.ts, API 비용 0).
 * 화면은 channels-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-channels?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 쿼리: days=14|30 · format=all|long|shorts · subs=100000|10000 (그 밖 값은 기본값 14 · all · 100000).
 * 관심 등록(동작 자리)과 관심 목록 탭 숫자는 T9(C7)에서 붙인다.
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getRecurringChannels, parseChannelQuery } from "@/lib/trend/channels";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
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

  const data = await getRecurringChannels(parseChannelQuery(sp));
  return <ChannelsView data={data} />;
}
