/**
 * 홈 = 비블랩 소개(서버 컴포넌트, 정적 렌더). 2026-10-16 소유자 확정 안 C(실적 중심),
 * 시안 src/app/ux-preview/home-intro-c · docs/home-intro/home-intro-c-*.png.
 * 첫 화면 #intro(70만+ · 하는 일 · 채널 4곳) → 서비스 #services → 비블 소개 #about → 채널 실적 #channels → 대행 CTA.
 *
 * 키워드 검색(HomeSearch · 결과 미리보기 · 01·02·03)은 유튜브 트렌드 서치 허브(/trend-search)로 옮겼다.
 * 검색 누적 로직(saveToHistory·trySearch)은 HomeSearch.tsx 에 그대로 있다(scripts/ux/check-invariants.mjs).
 * 모션 A 은은하게(소유자 결정 2026-10-17, 시안 src/app/ux-preview/home-motion · docs/home-motion):
 * 첫 화면 블록은 CSS 로 한 번 떠오르고(data-animate="load"), 아래 구역은 화면에 들어올 때 한 번 떠오른다(data-animate="rise").
 * 70만+ 와 채널 4곳 구독자는 한 번 센다(CountUp). 움직임 줄이기 설정이면 모두 정지. AnimationObserver 는 클라이언트 잎이라 정적 렌더 그대로.
 * 첫 화면에는 인물 사진·비블 아바타를 두지 않는다(채널 아이콘은 콘텐츠라 예외). 인물 사진은 #about 에만.
 */
import type { Metadata } from "next";
import AnimationObserver from "@/app/_components/AnimationObserver";
import HomeVisit from "@/app/_components/home/HomeVisit";
import HomeIntroHero from "@/app/_components/home/HomeIntroHero";
import HomeServices from "@/app/_components/home/HomeServices";
import HomeAbout from "@/app/_components/home/HomeAbout";
import HomeChannels from "@/app/_components/home/HomeChannels";
import HomeContact from "@/app/_components/home/HomeContact";

// 정적 렌더 유지(ISR). 페이지는 하루에 한 번 다시 그리고, 채널 실적 데이터는 30일 캐시(proofChannels)를 그대로 쓴다.
// 실시간 값 받기에 실패한 날은 고정값으로 그렸다가 다음 날 다시 시도한다
export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="main">
      <HomeVisit />
      <HomeIntroHero />
      <HomeServices />
      <HomeAbout />
      <HomeChannels animate />
      <HomeContact />
      <AnimationObserver />
    </main>
  );
}
