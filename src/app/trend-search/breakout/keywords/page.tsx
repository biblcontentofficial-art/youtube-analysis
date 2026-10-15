/**
 * /trend-search/breakout/keywords · 급상승 키워드(A1)
 * 브레이크아웃 영상 제목에서 최근 7일 동안 서로 다른 채널이 많이 새로 쓴 주제어를 보여 준다.
 * 데이터는 cron terms 단계가 날짜별로 모아 둔 breakout_terms 를 RPC 로 합산한다(src/lib/trend/rising.ts).
 * 화면은 keywords-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-keywords?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 탭 줄 '관심 목록' 숫자: 안 읽은 알림 수(getUnreadCount → RPC notification_unread_count 1회, T9).
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getRisingTerms, type RisingFormat } from "@/lib/trend/rising";
import { getUnreadCount } from "@/lib/trend/watch";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
import { KeywordsView } from "./keywords-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "급상승 키워드",
  description: "브레이크아웃 영상 제목에서 최근 7일 동안 새로 많이 쓰인 주제어를 서로 다른 채널 수로 모아 봅니다.",
  robots: { index: false, follow: false },
};

type SP = Promise<{ format?: string }>;

export default async function KeywordsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
          <SectionHeader caption="유튜브 트렌드 서치" label="RISING" />
          <h1 className="text-h3 md:text-h2">급상승 키워드</h1>
          <LoginGate
            next="/trend-search/breakout/keywords"
            desc="브레이크아웃 영상 제목에서 최근 7일 동안 새로 많이 쓰인 주제어를 매일 모아 보여 드립니다."
          />
        </div>
      </main>
    );
  }

  const format: RisingFormat = sp.format === "shorts" ? "shorts" : "long";
  const [data, unread] = await Promise.all([getRisingTerms({ format }), getUnreadCount(user.id)]);
  return <KeywordsView data={data} badge={unread} />;
}
