"use client";

interface Props {
  used: number;
  limit: number;
  isMonthly: boolean;
  onClose: () => void;
}

export default function ThreadsLimitModal({ used, limit, isMonthly, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🔒</div>
          <h2 className="text-white font-semibold text-lg">검색 한도 초과</h2>
          <p className="text-gray-400 text-sm mt-1">
            {isMonthly
              ? `이번 달 검색 횟수(${limit}회)를 모두 사용했어요.`
              : `오늘 검색 횟수(${limit}회)를 모두 사용했어요.`}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            현재 {used}/{limit}회 사용
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-4 text-sm text-gray-300 space-y-1">
          <p className="font-medium text-white text-xs mb-2">업그레이드하면</p>
          <p>Starter → 월 30회 스레드 검색</p>
          <p>Pro → 월 200회 스레드 검색</p>
          <p>Business → 무제한 검색</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            닫기
          </button>
          <a
            href="/pricing"
            className="flex-1 py-2 text-sm text-white bg-teal-500 hover:bg-teal-400 rounded-lg text-center transition font-medium"
          >
            플랜 업그레이드
          </a>
        </div>
      </div>
    </div>
  );
}
