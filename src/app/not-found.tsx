import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="text-6xl font-black text-gray-800">404</div>
        <div className="text-4xl">🔍</div>
        <h1 className="text-xl font-bold text-white">페이지를 찾을 수 없어요</h1>
        <p className="text-gray-500 text-sm">
          요청하신 페이지가 존재하지 않거나 이동됐습니다.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/"
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            홈으로
          </Link>
          <Link
            href="/search"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-lg border border-gray-700 transition"
          >
            영상 찾기
          </Link>
        </div>
      </div>
    </main>
  );
}
