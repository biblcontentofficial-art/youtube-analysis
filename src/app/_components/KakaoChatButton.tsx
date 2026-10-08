/**
 * 우측 하단 고정 카카오톡 채널 문의 버튼 (전역 플로팅, 채널톡 스타일)
 * 스크롤과 무관하게 항상 같은 자리에 떠 있고, 클릭 시 카카오톡 채널 채팅으로 이동.
 * 층은 z-40: 전역 네비(z-50)·토스트(z-70) 아래이고, 모달은 브라우저 최상위 층이라 늘 이 버튼을 덮는다(globals.css "겹침 순서").
 * 하단 고정 바가 있는 화면에서는 globals.css 의 [data-kakao-fab] 규칙이 버튼을 바 위로 올린다.
 */
export default function KakaoChatButton() {
  return (
    <a
      href="https://pf.kakao.com/_beBNn/chat"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 채널로 문의하기"
      title="카카오톡 문의"
      data-kakao-fab=""
      className="group fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-kakao text-kakao-icon transition-colors duration-150 hover:bg-kakao-hover md:bottom-6 md:right-6"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3C6.477 3 2 6.477 2 10.5c0 2.568 1.524 4.832 3.848 6.24L4.5 21l4.38-2.318A11.3 11.3 0 0012 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"
          fill="currentColor"
        />
      </svg>
      {/* 데스크탑 호버 라벨 */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg opacity-0 transition-opacity group-hover:opacity-100 md:block">
        카카오톡 문의
      </span>
    </a>
  );
}
