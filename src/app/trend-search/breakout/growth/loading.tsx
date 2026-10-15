/**
 * /trend-search/breakout/growth 스켈레톤(DESIGN 6.19). 서버가 로그인 확인·추적 기록을 읽는 동안
 * 섹션 머리 → 탭 줄 → 제목 → 기준 줄 → 날짜 칩 → 길이·정렬 칩 → 표 행 6줄을 실제와 같은 폭·여백·높이로 그린다. 인증·데이터 호출 없음.
 * - 제목·설명은 고정 문구라 실제 글자를 그린다(폭에 따라 설명이 두 줄이 되거나 기준 줄이 옆으로 가는 것까지 실제와 같게).
 * - 1024 이상: 표 머리 + 행(썸네일 w-32 · xl:w-36, 제목 두 줄 · 채널 · 숫자 세 칸 · 흐름, 오른쪽 pr-14 는 실제 표와 같은 카카오 버튼 여백)
 * - 1024 미만: '조회수: 다음 날 → 3일 뒤 → 7일 뒤' 줄(36px) + 목록 행(썸네일 w-28 · md:w-44, 제목 두 줄 · 채널 · 값 한 줄, 390 폭 실제 행 125.8px 와 같게)
 */
import { SectionHeader } from "@/components/ui/section-header";
import { BreakoutTabs } from "../_components/BreakoutTabs";
import { GROWTH_DESC } from "./growth-view";

const BAR = "rounded-control bg-surface-2";
const ROWS = 6;
/** 스켈레톤 깜빡임(6.19, 움직임 줄이기 설정이면 멈춤) */
const PULSE = "animate-pulse motion-reduce:animate-none";
const CHIP_BOX = "h-10 shrink-0 rounded-control border border-line sm:h-9 pointer-coarse:h-11";

export default function GrowthLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="GROWTH" />
        <BreakoutTabs current="growth" />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-h3 md:text-h2">성장 추적</h1>
            <p className="mt-2 text-ui text-fg-2 md:text-body">{GROWTH_DESC}</p>
          </div>
          {/* 기준 줄 자리(text-body-sm 한 줄 23.8px, '10월 8일 (목) 게시 · 226개' 정도) */}
          <div aria-hidden="true" className={`flex h-[23.8px] w-[168px] items-center ${PULSE}`}>
            <div className={`${BAR} h-3 w-40`} />
          </div>
        </div>

        <div aria-hidden="true" className={PULSE}>
          {/* 날짜 칩 줄(가로 스크롤 자리, 아래 pb-1 은 실제 nav 와 같게) */}
          <div className="-mx-6 mt-8 flex gap-1.5 overflow-hidden px-6 pb-1 lg:mx-0 lg:px-0">
            {[104, 168, 168, 140, 140, 140].map((w, i) => (
              <div key={i} className={CHIP_BOX} style={{ width: w }} />
            ))}
          </div>

          {/* 길이 · 정렬 칩 + 캡션 */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex gap-1.5">
              <div className={`${CHIP_BOX} w-12 sm:w-11`} />
              <div className={`${CHIP_BOX} w-12 sm:w-11`} />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex flex-wrap gap-1.5">
              <div className={`${CHIP_BOX} w-[110px] sm:w-[104px]`} />
              <div className={`${CHIP_BOX} w-[98px] sm:w-[92px]`} />
              <div className={`${CHIP_BOX} w-[110px] sm:w-[104px]`} />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex h-[19.5px] items-center"><div className={`${BAR} h-3 w-52`} /></div>
          </div>

          {/* 1024 이상: 표 */}
          <div className="mt-6 hidden lg:block">
            <div className="flex h-[46px] items-center border-y border-line">
              <div className={`${BAR} h-3 w-8`} />
              <div className="ml-auto flex items-center">
                <div className="flex w-[112px] justify-end"><div className={`${BAR} h-3 w-10`} /></div>
                <div className="flex w-[112px] justify-end"><div className={`${BAR} h-3 w-10`} /></div>
                <div className="flex w-[128px] justify-end"><div className={`${BAR} h-3 w-10`} /></div>
                <div className="w-[176px] pl-8 pr-14"><div className={`${BAR} h-3 w-8`} /></div>
              </div>
            </div>
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex items-center border-b border-line-soft py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-4 pr-6">
                  <div className="aspect-video w-32 shrink-0 rounded-control bg-surface-2 xl:w-36" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className={`${BAR} h-4 w-full max-w-md`} />
                    <div className={`${BAR} h-4 w-2/3 max-w-xs`} />
                    <div className={`${BAR} h-3 w-24`} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <div className="flex w-[112px] justify-end"><div className={`${BAR} h-4 w-12`} /></div>
                  <div className="flex w-[112px] justify-end"><div className={`${BAR} h-4 w-12`} /></div>
                  <div className="flex w-[128px] justify-end"><div className={`${BAR} h-5 w-14`} /></div>
                  <div className="w-[176px] pl-8 pr-14"><div className={`${BAR} h-5 w-16`} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* 1024 미만: 목록 */}
          <div className="mt-6 lg:hidden">
            <div className="-mx-6 flex h-9 items-center border-y border-line px-6"><div className={`${BAR} h-3 w-44`} /></div>
            <div className="-mx-6 divide-y divide-line-soft border-b border-line">
              {Array.from({ length: ROWS }).map((_, i) => (
                <div key={i} className="flex gap-3 px-6 py-4">
                  <div className="aspect-video w-28 shrink-0 self-start rounded-control bg-surface-2 md:w-44" />
                  <div className="min-w-0 flex-1">
                    <div className="flex h-[22.5px] items-center md:h-6"><div className={`${BAR} h-4 w-full`} /></div>
                    <div className="flex h-[22.5px] items-center md:h-6"><div className={`${BAR} h-4 w-2/3`} /></div>
                    <div className="mt-1 flex h-[18px] items-center"><div className={`${BAR} h-3 w-20`} /></div>
                    <div className="mt-0.5 flex h-[23.8px] items-center"><div className={`${BAR} h-3 w-40`} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
