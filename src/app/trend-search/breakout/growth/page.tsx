/**
 * /trend-search/breakout/growth · 성장 추적(A3)
 * 같은 영상을 게시 다음 날·3일 뒤·7일 뒤 아침에 다시 잰 조회수로, 꾸준히 크는 영상과 초반에만 몰린 영상을 나눠 본다.
 * 데이터는 cron views_d1·track 단계가 채운 breakout_views 를 RPC 로 읽는다(src/lib/trend/growth.ts · track.ts).
 * 화면은 growth-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-growth?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 쿼리: date=YYYY-MM-DD(없거나 칩 목록에 없으면 7일 값이 있는 가장 최근 날짜) · sort=growth|v7|v1.
 * 가로 롱폼 전용(2026-10-16: 쇼츠·세로·라이브 제외)이라 예전 주소의 format 은 무시한다.
 * 탭 줄 '관심 목록' 숫자: 안 읽은 알림 수(getUnreadCount → RPC notification_unread_count 1회, T9).
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getGrowth, parseGrowthQuery } from "@/lib/trend/growth";
import { getUnreadCount } from "@/lib/trend/watch";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
import { GrowthView } from "./growth-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "성장 추적",
  description: "브레이크아웃 영상의 조회수를 게시 다음 날, 3일 뒤, 7일 뒤에 다시 재서 꾸준히 크는 영상과 초반에만 몰린 영상을 나눠 봅니다.",
  robots: { index: false, follow: false },
};

type SP = Promise<{ date?: string; sort?: string }>;

export default async function GrowthPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
          <SectionHeader caption="유튜브 트렌드 서치" label="GROWTH" />
          <h1 className="text-h3 md:text-h2">성장 추적</h1>
          <LoginGate
            next="/trend-search/breakout/growth"
            desc="브레이크아웃 영상의 조회수를 게시 다음 날, 3일 뒤, 7일 뒤에 다시 재서 보여 드립니다."
          />
        </div>
      </main>
    );
  }

  const [data, unread] = await Promise.all([getGrowth(parseGrowthQuery(sp)), getUnreadCount(user.id)]);
  return <GrowthView data={data} badge={unread} />;
}
