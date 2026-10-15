/**
 * /trend-search/breakout/watch 스켈레톤(DESIGN 6.19). 서버가 로그인 확인·관심 목록·알림을 읽는 동안
 * 섹션 머리 → 탭 줄 → 제목·설명 → 두 칸(1024 미만은 새 영상 먼저, 관리 아래)을 실제와 같은 폭·여백으로 그린다. 인증·데이터 호출 없음.
 * - 새 영상: 칸 제목 → 날짜 머리 → 영상 행 6줄(썸네일 w-28·md:w-40 16:9 + 태그·제목 두 줄·채널·조회수)
 * - 관리: 칸 제목 → 입력 44px + '추가' → 칩 줄 → 관심 채널 제목 → 캡션 → 사용 수
 */
import { SectionHeader } from "@/components/ui/section-header";
import { BreakoutTabs } from "../_components/BreakoutTabs";
import { WATCH_DESC } from "./watch-view";

const BAR = "rounded-control bg-surface-2";
const ROWS = 6;
/** 스켈레톤 깜빡임(6.19, 움직임 줄이기 설정이면 멈춤) */
const PULSE = "animate-pulse motion-reduce:animate-none";

export default function WatchLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="WATCH" />
        <BreakoutTabs current="watch" />

        <div className="max-w-3xl">
          <h1 className="text-h3 md:text-h2">관심 목록</h1>
          <p className="mt-2 text-ui text-fg-2 md:text-body">{WATCH_DESC}</p>
        </div>

        <div aria-hidden="true" className={`mt-8 grid gap-12 lg:grid-cols-12 lg:gap-8 ${PULSE}`}>
          {/* 새 영상 */}
          <div className="min-w-0 lg:order-2 lg:col-span-8">
            <div className="flex h-[27px] items-center"><div className={`${BAR} h-4 w-16`} /></div>
            <div className="mt-3 border-b border-line pb-2">
              <div className="flex h-[23.8px] items-center"><div className={`${BAR} h-3 w-24`} /></div>
            </div>
            <div className="divide-y divide-line-soft">
              {Array.from({ length: ROWS }).map((_, i) => (
                <div key={i} className="flex gap-3 py-4 md:gap-4">
                  <div className="aspect-video w-28 shrink-0 rounded-control bg-surface-2 md:w-40" />
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-1.5">
                      <div className={`${BAR} h-5 w-8`} />
                      <div className={`${BAR} h-5 w-20`} />
                    </div>
                    <div className={`${BAR} mt-2.5 h-4 w-11/12`} />
                    <div className={`${BAR} mt-2 h-4 w-2/3`} />
                    <div className={`${BAR} mt-2.5 h-3 w-24`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 관리 */}
          <div className="min-w-0 lg:order-1 lg:col-span-4">
            <div className="flex h-[27px] items-center"><div className={`${BAR} h-4 w-20`} /></div>
            <div className="mt-3 flex gap-2">
              <div className="h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface" />
              <div className="h-11 w-[66px] rounded-control border border-line-strong bg-surface" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <div className="h-10 w-20 rounded-control border border-line sm:h-9" />
              <div className="h-10 w-24 rounded-control border border-line sm:h-9" />
            </div>
            <div className="mt-10 flex h-[27px] items-center"><div className={`${BAR} h-4 w-20`} /></div>
            <div className="mt-3 flex h-[19.5px] items-center"><div className={`${BAR} h-3 w-56`} /></div>
            <div className="mt-10 flex h-[19.5px] items-center"><div className={`${BAR} h-3 w-20`} /></div>
          </div>
        </div>
      </div>
    </main>
  );
}
