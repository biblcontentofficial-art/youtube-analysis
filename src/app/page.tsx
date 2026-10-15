/**
 * 홈(서버 컴포넌트, 정적 렌더). 레이아웃 F = design-final/silver/home.html (DESIGN 7.1).
 * 첫 화면 #trend(8:4 실적 열) → 결과 미리보기 → 01·02·03 → 서비스 5가지 → 채널 실적 → 대행 CTA.
 *
 * 상태가 필요한 것(인증 확인·방문 기록·검색 폼·예시 칩·로그인 모달)은 HomeSearch(클라이언트)에 있다.
 * 검색 누적 로직(saveToHistory·trySearch)은 그 파일로 글자 그대로 옮겼다(scripts/ux/check-invariants.mjs).
 * 첫 화면에는 인물 사진·비블 아바타를 두지 않는다(미리보기 썸네일·채널 아이콘은 콘텐츠라 예외).
 */
import type { Metadata } from "next";
import { HomeSearchProvider, HomeSearchForm } from "@/app/_components/HomeSearch";
import LandingStats from "@/app/_components/LandingStats";
import HomeResultPreview from "@/app/_components/home/HomeResultPreview";
import HomeSteps from "@/app/_components/home/HomeSteps";
import HomeServices from "@/app/_components/home/HomeServices";
import HomeChannels from "@/app/_components/home/HomeChannels";
import HomeContact from "@/app/_components/home/HomeContact";

// 채널 실적(실시간 구독자·조회수)을 6시간마다 새로 그린다. 정적 렌더는 유지(ISR)
export const revalidate = 21600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const DOT = "⁠·⁠";

export default function Home() {
  return (
    <main id="main">
      <section id="trend" aria-labelledby="trend-title" className="border-b border-line">
        <div className="mx-auto max-w-wide px-6 pb-16 pt-8 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-14">
          <HomeSearchProvider>
            <div className="grid grid-cols-1 gap-7 sm:gap-8 lg:grid-cols-12 lg:items-start lg:gap-6">
              <div className="min-w-0 lg:col-span-8 lg:pr-6">
                <h1 id="trend-title" className="text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display">
                  <span className="block">키워드 하나로</span>{" "}
                  <span className="block">
                    <span className="text-accent">유튜브 트렌드</span>를 파악하세요
                  </span>
                </h1>
                <p className="mt-3 max-w-[34em] text-body text-fg-2 sm:mt-4 lg:mt-5 lg:text-lead">
                  {`조회수${DOT}구독자${DOT}게시일을 한눈에 확인하고 경쟁력 있는 콘텐츠 주제를 발견해 보세요.`}
                </p>
                <HomeSearchForm />
              </div>

              {/* 실적 열: 누구의 숫자인지 먼저, 숫자는 그 아래. 1024 이상에서 제목과 글자 윗선을 맞춘다. 아바타 없음 */}
              <aside
                aria-labelledby="trend-proof-title"
                className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8 lg:pt-[2px] xl:pt-[4px]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p id="trend-proof-title" className="text-lead font-bold leading-[1.4]">
                    {`비블이 운영${DOT}기획한 채널`}
                  </p>
                  <a
                    href="#channels"
                    className="-my-3 inline-flex h-11 shrink-0 items-center gap-1 text-caption font-semibold text-fg-2 transition-colors duration-150 hover:text-fg lg:hidden"
                  >
                    채널 보기 <span aria-hidden="true">→</span>
                  </a>
                </div>
                <p className="mt-1 text-caption text-fg-3">
                  <span className="whitespace-nowrap">{`세계유명 골프정보${DOT}영어 키위새 외`}</span>{" "}
                  <span className="whitespace-nowrap">
                    전체 채널 기준 · <time dateTime="2026-10">2026.10</time>
                  </span>
                </p>
                <LandingStats />
              </aside>
            </div>

            <HomeResultPreview />
          </HomeSearchProvider>

          <HomeSteps />
        </div>
      </section>

      <HomeServices />
      <HomeChannels />
      <HomeContact />
    </main>
  );
}
