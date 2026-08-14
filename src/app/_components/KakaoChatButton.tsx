/**
 * 우측 하단 고정 카카오톡 채널 문의 버튼 (전역 플로팅, 채널톡 스타일)
 * 스크롤과 무관하게 항상 같은 자리에 떠 있고, 클릭 시 카카오톡 채널 채팅으로 이동.
 */
export default function KakaoChatButton() {
  return (
    <a
      href="https://pf.kakao.com/_beBNn/chat"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 채널로 문의하기"
      title="카카오톡 문의"
      className="group fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#FEE500] hover:bg-[#FFD900] shadow-lg shadow-black/40 transition-transform duration-200 hover:scale-105"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3C6.477 3 2 6.477 2 10.5c0 2.568 1.524 4.832 3.848 6.24L4.5 21l4.38-2.318A11.3 11.3 0 0012 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"
          fill="#3A1D1D"
        />
      </svg>
      {/* 데스크탑 호버 라벨 */}
      <span className="pointer-events-none absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
        카카오톡 문의
      </span>
    </a>
  );
}
