/**
 * /trend-search/breakout/keywords · 급상승 키워드(A1)
 * 브레이크아웃 영상 제목에서 최근 7일 동안 서로 다른 채널이 많이 새로 쓴 주제어를 보여 준다.
 * 데이터는 cron terms 단계가 날짜별로 모아 둔 breakout_terms 를 RPC 로 합산한다(src/lib/trend/rising.ts).
 * 가로 롱폼 전용(소유자 결정 2026-10-16: 쇼츠·세로·라이브 제외). 길이 칩이 없고, 예전 주소의 ?format= 은 무시한다.
 * 화면은 keywords-view.tsx(props 만 받음). 로컬 미리보기 /ux-preview/trend-keywords?state=… 가 같은 화면을 고정 데이터로 그린다.
 * 탭 줄 '관심 목록' 숫자: 안 읽은 알림 수(getUnreadCount → RPC notification_unread_count 1회, T9).
 * C8 '내 채널에 맞는 주제'(T10): 서버는 plan(currentUser 가 이미 읽은 값)과 user_channels 행 유무만 읽어 카드 자리를 정한다
 * (Starter 미만 잠금 줄 / 카드 잎). Claude 호출과 주제 고르기는 카드 잎이 GET /api/trend/fit 으로 따로 부른다(표 TTFB 와 무관).
 */
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getRisingTerms } from "@/lib/trend/rising";
import { getUnreadCount } from "@/lib/trend/watch";
import { hasUserChannel } from "@/lib/trend/my-channel";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { SectionHeader } from "@/components/ui/section-header";
import { LoginGate } from "../_components/LoginGate";
import { KeywordsView, type KeywordsFit } from "./keywords-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "급상승 키워드",
  description: "브레이크아웃 영상 제목에서 최근 7일 동안 새로 많이 쓰인 주제어를 서로 다른 채널 수로 모아 봅니다.",
  robots: { index: false, follow: false },
};

export default async function KeywordsPage() {
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

  const canFit = Object.prototype.hasOwnProperty.call(PLANS, user.plan) && PLANS[user.plan as PlanKey].canTrendFit;
  const [data, unread, registered] = await Promise.all([
    getRisingTerms(),
    getUnreadCount(user.id),
    canFit ? hasUserChannel(user.id) : Promise.resolve(false),
  ]);
  const fit: KeywordsFit = canFit ? { kind: "card", registered } : { kind: "locked" };
  return <KeywordsView data={data} badge={unread} fit={fit} />;
}
