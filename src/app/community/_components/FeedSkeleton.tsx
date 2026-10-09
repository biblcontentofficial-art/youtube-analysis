/**
 * 커뮤니티 피드 로딩 스켈레톤. /community 피드 page.tsx 의 Suspense fallback 으로만 쓴다
 * (loading.tsx 로 두면 랭킹·소개·글 상세·redirect 전용 세그먼트까지 감싸므로 피드에만 건다).
 * 피드 머리 한 줄 + 글 카드 4개. 카드 크기는 FeedCard 와 맞춘다(DESIGN 6.19, animate-pulse 는 스켈레톤에만).
 */

const BAR = "rounded-control bg-surface-2 animate-pulse motion-reduce:animate-none";

export default function FeedSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">불러오는 중</span>

      {/* 피드 머리 자리 */}
      <div aria-hidden="true" className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className={`${BAR} h-7 w-32`} />
          <div className={`${BAR} h-4 w-56`} />
        </div>
        <div className={`${BAR} h-11 w-full lg:w-80`} />
      </div>

      {/* 글 카드 자리 */}
      <div aria-hidden="true" className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3.5 rounded-card border border-line bg-surface p-5">
            <div className="size-9 shrink-0 rounded-full bg-surface-2 animate-pulse motion-reduce:animate-none" />
            <div className="min-w-0 flex-1">
              <div className={`${BAR} h-4 w-40`} />
              <div className={`${BAR} mt-2 h-5 w-3/4`} />
              <div className={`${BAR} mt-2 h-4 w-full`} />
              <div className={`${BAR} mt-1.5 h-4 w-2/3`} />
              <div className={`${BAR} mt-3 h-3 w-36`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
