/**
 * /trend-search/breakout/channels 스켈레톤(DESIGN 6.19). 서버가 로그인 확인·채널 집계를 읽는 동안
 * 섹션 머리 → 탭 줄 → 제목 → 기준 줄 → 칩 줄 → 표 행 8줄을 실제와 같은 폭·여백·높이로 그린다. 인증·데이터 호출 없음.
 * - 제목·설명은 고정 문구라 실제 글자를 그린다(폭에 따라 설명이 두 줄이 되거나 기준 줄이 옆으로 가는 것까지 실제와 같게).
 * - 1024 이상: 표 머리 + 행(아바타 32px · 채널명·최근 영상 두 줄 · 등장 일수 · 영상 수 · 구독자 · 최근 등장, 오른쪽 pr-14 는 실제 표와 같은 카카오 버튼 여백)
 * - 1024 미만: 목록 행(아바타 · 채널명 24px · 최근 영상 24px · 메타 한 줄 23.8px, 실제 행 106.8px(경계선 포함)과 같게)
 */
import { SectionHeader } from "@/components/ui/section-header";
import { BreakoutTabs } from "../_components/BreakoutTabs";
import { CHANNELS_DESC } from "./channels-view";

const BAR = "rounded-control bg-surface-2";
const ROWS = 8;
/** 스켈레톤 깜빡임(6.19, 움직임 줄이기 설정이면 멈춤) */
const PULSE = "animate-pulse motion-reduce:animate-none";
const CHIP_BOX = "h-10 rounded-control border border-line sm:h-9 pointer-coarse:h-11";

export default function ChannelsLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="CHANNELS" />
        <BreakoutTabs current="channels" />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-h3 md:text-h2">지금 크는 채널</h1>
            <p className="mt-2 text-ui text-fg-2 md:text-body">{CHANNELS_DESC}</p>
          </div>
          {/* 기준 줄 자리(text-body-sm 한 줄 23.8px, 폭은 '최근 14일(10/1~10/14) · 50곳' 정도) */}
          <div aria-hidden="true" className={`flex h-[23.8px] w-[174px] items-center ${PULSE}`}>
            <div className={`${BAR} h-3 w-40`} />
          </div>
        </div>

        <div aria-hidden="true" className={PULSE}>
          {/* 기간 · 길이 · 구독자 칩 + 캡션 */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex gap-1.5">
              <div className={`${CHIP_BOX} w-[77px] sm:w-[73px]`} />
              <div className={`${CHIP_BOX} w-[79px] sm:w-[75px]`} />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex gap-1.5">
              <div className={`${CHIP_BOX} w-12 sm:w-11`} />
              <div className={`${CHIP_BOX} w-12 sm:w-11`} />
              <div className={`${CHIP_BOX} w-12 sm:w-11`} />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex gap-1.5">
              <div className={`${CHIP_BOX} w-[77px] sm:w-[73px]`} />
              <div className={`${CHIP_BOX} w-[69px] sm:w-[65px]`} />
            </div>
            <span className="hidden h-5 w-px bg-line sm:block" />
            <div className="flex h-[19.5px] items-center"><div className={`${BAR} h-3 w-52`} /></div>
          </div>

          {/* 1024 이상: 표 */}
          <div className="mt-6 hidden lg:block">
            <div className="flex h-[46px] items-center border-y border-line">
              <div className={`${BAR} h-3 w-8`} />
              <div className="ml-auto flex items-center pr-14">
                <div className="flex w-[112px] justify-end"><div className={`${BAR} h-3 w-14`} /></div>
                <div className="flex w-[96px] justify-end"><div className={`${BAR} h-3 w-10`} /></div>
                <div className="flex w-[104px] justify-end"><div className={`${BAR} h-3 w-10`} /></div>
                <div className="flex w-[112px] justify-end"><div className={`${BAR} h-3 w-12`} /></div>
              </div>
            </div>
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex h-[63px] items-center border-b border-line-soft">
                <div className="size-8 shrink-0 rounded-full bg-surface-2" />
                <div className="ml-3 flex flex-col gap-2">
                  <div className={`${BAR} h-4 w-40`} />
                  <div className={`${BAR} h-3 w-72`} />
                </div>
                <div className="ml-auto flex items-center pr-14">
                  <div className="flex w-[112px] justify-end"><div className={`${BAR} h-5 w-9`} /></div>
                  <div className="flex w-[96px] justify-end"><div className={`${BAR} h-4 w-8`} /></div>
                  <div className="flex w-[104px] justify-end"><div className={`${BAR} h-4 w-12`} /></div>
                  <div className="flex w-[112px] justify-end"><div className={`${BAR} h-4 w-10`} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* 1024 미만: 목록 */}
          <div className="-mx-6 mt-6 divide-y divide-line-soft border-y border-line lg:hidden">
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex gap-3 px-6 py-4">
                <div className="size-8 shrink-0 rounded-full bg-surface-2" />
                <div className="min-w-0 flex-1">
                  <div className="flex h-6 items-center"><div className={`${BAR} h-4 w-32`} /></div>
                  <div className="flex h-6 items-center"><div className={`${BAR} h-3 w-52`} /></div>
                  <div className="mt-0.5 flex h-[23.8px] items-center"><div className={`${BAR} h-3 w-44`} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
