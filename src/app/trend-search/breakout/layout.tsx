/**
 * 브레이크아웃 구역 공통 틀: 앱 도구 탭(영상 찾기 · 채널 찾기 · 수집한 영상 · 브레이크아웃) 아래에 각 탭 화면.
 * 브레이크아웃 안의 탭(영상 · 급상승 키워드 · …)은 각 화면이 BreakoutTabs 로 그린다.
 * 서버 컴포넌트, 로그인·데이터를 읽지 않는다.
 */
import type { ReactNode } from "react";
import ToolTabs from "@/app/_components/ToolTabs";

export default function BreakoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ToolTabs current="/trend-search/breakout" />
      {children}
    </>
  );
}
