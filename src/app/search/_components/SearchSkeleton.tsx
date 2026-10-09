/**
 * 검색 결과 자리 스켈레톤 (DESIGN 6.19). 실제 결과 표·목록과 같은 크기의 surface 자리만 그린다.
 * - 1024 이상: 앱 표 행(체크 · 썸네일 w-32 · 제목 두 줄 · 조회수 · 구독자 · 게시일), 행 높이는 실제 행과 같은 약 96px
 * - 1024 미만: 목록 행(왼쪽 체크 띠 w-11 · 썸네일 w-28 md:w-44 · 제목 두 줄 · 메타 두 줄)
 * - animate-pulse 는 스켈레톤에만, 움직임 줄이기 설정에서는 멈춘다.
 * - 이 컴포넌트는 장식이다. 화면 단위 안내(role="status")는 loading.tsx 가 맡는다.
 */
const BAR = "rounded-control bg-surface-2";
const ROWS = 8;

export default function SearchSkeleton() {
  return (
    <div aria-hidden="true" className="w-full animate-pulse motion-reduce:animate-none">
      {/* 1024 이상: 표 */}
      <div className="hidden lg:block">
        <div className="flex h-11 items-center gap-6 border-y border-line">
          <div className="w-11 shrink-0" />
          <div className={`${BAR} h-3 w-24`} />
          <div className="ml-auto flex gap-10">
            <div className={`${BAR} h-3 w-12`} />
            <div className={`${BAR} h-3 w-12`} />
            <div className={`${BAR} h-3 w-12`} />
          </div>
        </div>
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className="flex h-24 items-center gap-6 border-b border-line-soft">
            <div className="flex w-11 shrink-0 justify-center">
              <div className="size-[18px] rounded bg-surface-2" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="aspect-video w-32 shrink-0 rounded-control bg-surface-2 xl:w-36" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className={`${BAR} h-4 w-full max-w-md`} />
                <div className={`${BAR} h-4 w-2/3 max-w-xs`} />
                <div className={`${BAR} h-3 w-24 xl:hidden`} />
              </div>
            </div>
            <div className="hidden w-40 shrink-0 items-center gap-2 xl:flex">
              <div className="size-7 shrink-0 rounded-full bg-surface-2" />
              <div className={`${BAR} h-3 w-24`} />
            </div>
            <div className="flex shrink-0 gap-10">
              <div className={`${BAR} h-5 w-12`} />
              <div className={`${BAR} h-4 w-12`} />
              <div className={`${BAR} h-4 w-12`} />
            </div>
          </div>
        ))}
      </div>

      {/* 1024 미만: 목록 */}
      <div className="divide-y divide-line-soft border-y border-line-soft lg:hidden">
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className="-mx-6 flex pl-[11px] pr-6">
            <div className="flex w-11 shrink-0 justify-center pt-[19px]">
              <div className="size-[18px] rounded bg-surface-2" />
            </div>
            <div className="flex min-w-0 flex-1 gap-3 py-4">
              <div className="aspect-video w-28 shrink-0 rounded-control bg-surface-2 md:w-44" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className={`${BAR} h-4 w-full`} />
                <div className={`${BAR} h-4 w-2/3`} />
                <div className={`${BAR} mt-1 h-3 w-24`} />
                <div className={`${BAR} h-3 w-36`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
