import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function TossPaymentFailPage({
  searchParams,
}: {
  searchParams: { code?: string; message?: string; orderId?: string };
}) {
  const message = searchParams.message ?? "결제에 실패했습니다.";
  const code = searchParams.code;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-6 mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">결제에 실패했습니다</h1>
        <p className="text-gray-400 text-sm mb-2">{message}</p>
        {code && (
          <p className="text-gray-600 text-xs mb-8">오류 코드: {code}</p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-sm"
          >
            요금제 페이지로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-semibold rounded-xl transition text-sm"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
}
