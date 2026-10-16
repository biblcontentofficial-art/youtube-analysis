/**
 * 브레이크아웃 구역 공통 틀: 앱 도구 탭(영상 찾기 · 채널 찾기 · 수집한 영상 · 브레이크아웃) 아래에 각 탭 화면.
 * 브레이크아웃 안의 탭(영상 · 급상승 키워드 · …)은 각 화면이 BreakoutTabs 로 그린다.
 *
 * 열람 권한: Pro·팀비블 등급부터(PLANS[plan].canBreakout, 소유자 결정 2026-10-16).
 * - 비로그인: 각 화면의 로그인 안내(LoginGate)를 그대로 보인다(children).
 * - 로그인했지만 권한 없음(Free·Starter): 수집한 영상(/saved)과 같은 업그레이드 안내.
 * 관심 목록·내 채널 주제 API(/api/watch, /api/trend/fit)도 같은 기준으로 서버에서 막는다.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import ToolTabs from "@/app/_components/ToolTabs";
import { currentUser } from "@/lib/auth";
import { canBreakout } from "@/lib/stripe";
import { buttonClass } from "@/components/ui/button";

export default async function BreakoutLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const locked = !!user && !canBreakout(user.plan as string);
  return (
    <>
      <ToolTabs current="/trend-search/breakout" />
      {locked ? (
        <main className="min-h-screen bg-canvas text-fg">
          <div className="mx-auto flex max-w-reading flex-col items-center px-6 py-24 text-center">
            <h1 className="text-h4 font-extrabold">브레이크아웃</h1>
            <p className="mt-3 text-body-sm text-fg-2">Pro 플랜부터 사용 가능한 기능입니다.</p>
            <p className="mt-1 text-caption text-fg-3">구독자 수에 비해 조회수가 잘 나온 가로 롱폼 영상과 급상승 키워드, 지금 크는 채널을 매일 모아 봅니다.</p>
            <Link href="/pricing" className={`${buttonClass()} mt-6`}>
              플랜 업그레이드 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </main>
      ) : (
        children
      )}
    </>
  );
}
