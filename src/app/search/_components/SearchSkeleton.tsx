export default function SearchSkeleton() {
  return (
    <div className="w-full mt-4 animate-pulse">
      {/* 헤더 */}
      <div className="hidden md:grid items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-t-lg"
        style={{ gridTemplateColumns: "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-800 rounded" />
        ))}
      </div>

      {/* 스켈레톤 행 */}
      <div className="border border-gray-800 border-t-0 rounded-b-lg divide-y divide-gray-800/60 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            {/* 데스크탑 */}
            <div className="hidden md:grid items-center gap-2 px-3 py-3 bg-gray-950"
              style={{ gridTemplateColumns: "32px 36px 110px 1fr 90px 140px 80px 80px 90px 90px" }}>
              <div className="h-3.5 w-3.5 bg-gray-800 rounded mx-auto" />
              <div className="h-4 w-6 bg-gray-800 rounded mx-auto" />
              <div className="aspect-video bg-gray-800 rounded-md" />
              <div className="flex flex-col gap-2 pl-1">
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
              <div className="h-4 bg-gray-800 rounded w-14 mx-auto" />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-7 h-7 bg-gray-800 rounded-full" />
                <div className="h-2.5 bg-gray-800 rounded w-16" />
                <div className="h-2 bg-gray-800 rounded w-10" />
              </div>
              <div className="h-4 bg-gray-800 rounded w-10 mx-auto" />
              <div className="h-8 bg-gray-800 rounded-lg w-16 mx-auto" />
              <div className="h-8 bg-gray-800 rounded w-14 mx-auto" />
              <div className="h-5 bg-gray-800 rounded w-20 mx-auto" />
            </div>

            {/* 모바일 */}
            <div className="flex md:hidden gap-3 px-3 py-3 bg-gray-950">
              <div className="w-3.5 h-3.5 bg-gray-800 rounded shrink-0 mt-1" />
              <div className="w-28 aspect-video bg-gray-800 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
                <div className="h-2.5 bg-gray-800 rounded w-24" />
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-800 rounded w-14" />
                  <div className="h-5 bg-gray-800 rounded w-10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
