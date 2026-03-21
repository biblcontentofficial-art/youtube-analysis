"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "구독이 자동으로 갱신되나요?",
    a: "네, 다음 결제일 이전에 구독을 취소하지 않으면 동일한 플랜과 금액으로 자동 갱신됩니다. 마이페이지에서 언제든지 구독을 취소할 수 있습니다.",
  },
  {
    q: "플랜 변경은 어떻게 하나요?",
    a: "마이페이지 > 구독 관리에서 플랜을 변경할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 현재 구독 기간 종료 후 적용됩니다.",
  },
  {
    q: "환불 정책이 어떻게 되나요?",
    a: "결제일로부터 7일 이내 미사용 시 전액 환불이 가능합니다. 서비스 이용 이력이 있는 경우 잔여 기간에 비례하여 환불 처리됩니다. 자세한 내용은 환불 정책 페이지를 확인해주세요.",
  },
  {
    q: "검색 횟수는 언제 초기화되나요?",
    a: "Free 플랜의 일별 검색 횟수는 매일 자정(UTC 기준)에 초기화됩니다. Starter·Pro 플랜의 월별 횟수는 매월 1일에 초기화됩니다.",
  },
  {
    q: "결제 수단은 무엇을 지원하나요?",
    a: "신용카드 및 체크카드(국내외)를 지원합니다. 간편결제(카카오페이, 네이버페이)도 순차적으로 추가할 예정입니다.",
  },
  {
    q: "팀원 추가는 어떻게 하나요?",
    a: "Pro 플랜은 최대 2명, Business 플랜은 최대 5명까지 팀원을 추가할 수 있습니다. 팀 공유 기능은 현재 준비 중이며 곧 오픈 예정입니다.",
  },
  {
    q: "플랜을 취소하면 데이터는 어떻게 되나요?",
    a: "구독 해지 즉시 저장된 검색 기록과 수집한 영상 데이터가 모두 삭제되며 복원이 불가능합니다. 해지 전에 필요한 데이터를 CSV 등으로 내보내기 해두시길 권장합니다.",
  },
];

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="mt-20 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-white text-center mb-8">자주 묻는 질문</h2>
      <div className="divide-y divide-gray-800 border-t border-gray-800">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <span className={`text-sm font-medium transition ${isOpen ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                  {faq.q}
                </span>
                <svg
                  className={`w-4 h-4 shrink-0 ml-4 transition-transform text-gray-500 ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <p className="pb-4 text-sm text-gray-400 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
