/**
 * /search 화면 스켈레톤 (DESIGN 6.19). 서버가 검색·차감을 끝낼 때까지 앱 셸(도구 탭 → 검색창 → 결과 자리)을 같은 크기로 그린다.
 * 레이아웃 이동이 없게 page.tsx 의 바깥 틀과 같은 폭·여백·높이를 쓴다. 인증·데이터 호출 없음.
 */
import ToolTabs from "../_components/ToolTabs";
import SearchSkeleton from "./_components/SearchSkeleton";

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <ToolTabs current="/search" />
      <div className="mx-auto w-full max-w-wide px-6 pb-16 lg:px-8">
        <div aria-hidden="true" className="animate-pulse pb-4 pt-4 motion-reduce:animate-none lg:pb-6 lg:pt-6">
          {/* 검색창 자리: 모바일 50px · 640 이상 56px */}
          <div className="h-[50px] w-full rounded-card border border-line bg-surface sm:h-14" />
          <div className="mt-1.5 h-[19.5px] py-1 sm:mt-2">
            <div className="h-3 w-56 rounded-control bg-surface-2" />
          </div>
        </div>
        {/* 결과 머리 자리: 길이 필터 세그먼트 높이 */}
        <div aria-hidden="true" className="mb-4 h-12 w-full animate-pulse rounded-control border border-line motion-reduce:animate-none md:h-10 md:w-64" />
        <SearchSkeleton />
      </div>
    </main>
  );
}
