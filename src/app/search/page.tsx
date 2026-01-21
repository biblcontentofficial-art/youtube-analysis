import { Suspense } from "react";
import Link from "next/link";
import { searchVideos } from "@/lib/youtube";
import SearchResultList from "./_components/SearchResultList";

interface Props {
  searchParams: {
    q?: string;
    filter?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || "";
  const filter = searchParams.filter || ""; // 'shorts', 'long', or undefined (all)
  
  // 검색어가 없으면 빈 배열
  const videos = query ? await searchVideos(query, filter) : [];

  // 쿼리 문자열 인코딩 (링크 생성용)
  const encodedQuery = encodeURIComponent(query);

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">YouTube 성과 분석</h1>
        <p className="text-gray-400 mb-8">
          키워드를 입력하면 관련 영상 리스트와 성과(스파크라인 + 배지)를 보여줘요.
        </p>

        {/* --- 필터 버튼 영역 시작 --- */}
        {query && (
          <div className="flex gap-2 mb-6">
            <Link
              href={`/search?q=${encodedQuery}`}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                !filter
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              전체
            </Link>
            <Link
              href={`/search?q=${encodedQuery}&filter=long`}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === "long"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              쇼츠 제외 (3분+)
            </Link>
            <Link
              href={`/search?q=${encodedQuery}&filter=shorts`}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === "shorts"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              쇼츠만 보기 (3분 미만)
            </Link>
          </div>
        )}
        {/* --- 필터 버튼 영역 끝 --- */}

        {/* 검색 결과 리스트 */}
        <Suspense fallback={<div className="text-gray-500">데이터 분석 중...</div>}>
          <SearchResultList initialData={videos} />
        </Suspense>
      </div>
    </main>
  );
}