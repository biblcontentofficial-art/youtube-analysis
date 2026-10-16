/**
 * /trend-search/breakout 화면 스켈레톤(DESIGN 6.19). 서버가 로그인 확인·날짜·목록을 읽는 동안
 * 섹션 머리 → 탭 줄 → 제목 → 정렬 칩 → 표 행 6줄을 실제와 같은 폭·여백·높이로 그린다. 인증·데이터 호출 없음.
 * - 1024 이상: 앱 표 행(썸네일 w-32 · 제목 두 줄 · 채널 · 숫자 네 칸), 행 높이는 실제 행과 같은 약 96px
 * - 1024 미만: 목록 행(썸네일 w-28 md:w-44 · 제목 두 줄 · 채널 · 메타)
 * 새 탭(keywords·channels·growth·watch)은 각 항목이 자기 폴더에 loading.tsx 를 둔다.
 */
import { SectionHeader } from "@/components/ui/section-header";
import { BreakoutTabs } from "./_components/BreakoutTabs";

const BAR = "rounded-control bg-surface-2";
const ROWS = 6;

export default function BreakoutLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="BREAKOUT" />
        <BreakoutTabs current="videos" />

        <h1 className="text-h3 md:text-h2">브레이크아웃</h1>

        <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
          {/* 설명 자리 */}
          <div className="mt-2 flex h-[27px] max-w-3xl items-center md:h-[30px]">
            <div className={`${BAR} h-4 w-full max-w-xl`} />
          </div>

          {/* 정렬·기준 칩 줄 */}
          <div className="mt-8 flex flex-wrap gap-1.5 border-b border-line pb-6 lg:border-b-0 lg:pb-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-control border border-line sm:h-9 pointer-coarse:h-11" />
            ))}
          </div>

          {/* 1024 이상: 표 */}
          <div className="mt-6 hidden lg:block">
            <div className="flex h-11 items-center gap-6 border-y border-line">
              <div className={`${BAR} h-3 w-10`} />
              <div className="ml-auto flex gap-16 pr-2">
                <div className={`${BAR} h-3 w-12`} />
                <div className={`${BAR} h-3 w-12`} />
                <div className={`${BAR} h-3 w-12`} />
                <div className={`${BAR} h-3 w-12`} />
              </div>
            </div>
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex h-24 items-center gap-6 border-b border-line-soft">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="aspect-video w-32 shrink-0 rounded-control bg-surface-2 xl:w-36" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className={`${BAR} h-4 w-full max-w-md`} />
                    <div className={`${BAR} h-4 w-2/3 max-w-xs`} />
                    <div className={`${BAR} h-3 w-24`} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-16 pr-2">
                  <div className={`${BAR} h-5 w-12`} />
                  <div className={`${BAR} h-4 w-12`} />
                  <div className={`${BAR} h-4 w-12`} />
                  <div className={`${BAR} h-4 w-12`} />
                </div>
              </div>
            ))}
          </div>

          {/* 1024 미만: 목록 */}
          <div className="-mx-6 mt-2 divide-y divide-line-soft lg:hidden">
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex gap-3 px-6 py-4">
                <div className="aspect-video w-28 shrink-0 self-start rounded-control bg-surface-2 md:w-44" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className={`${BAR} h-4 w-full`} />
                  <div className={`${BAR} h-4 w-2/3`} />
                  <div className={`${BAR} mt-1 h-3 w-24`} />
                  <div className={`${BAR} h-3 w-36`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
