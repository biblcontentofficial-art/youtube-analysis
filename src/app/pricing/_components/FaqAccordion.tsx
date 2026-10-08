"use client";

/**
 * 요금제 FAQ(DESIGN 6.21 아코디언). 질문은 h3 > button(aria-expanded·aria-controls),
 * 답은 닫혀 있어도 렌더하고 hidden 으로 접는다(서버 HTML 에 있다). 브라우저 안에서는 닫힌 답을
 * hidden="until-found" 로 바꿔 Ctrl+F 로 찾히게 하고, 찾으면(beforematch) 그 답을 연다.
 * React 18 은 hidden 을 참·거짓 속성으로만 다뤄 "until-found" 값을 직접 줄 수 없어 효과에서 속성을 고친다.
 * 문장은 그대로 두고, 답 속 '환불 정책 페이지'·'마이페이지 > 구독 관리'만 링크로 바꿨다.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/button";

const INLINE_LINK = "font-semibold text-fg underline underline-offset-4 transition-colors duration-150 hover:text-fg-2";

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "구독이 자동으로 갱신되나요?",
    a: "네, 다음 결제일 이전에 구독을 취소하지 않으면 동일한 플랜과 금액으로 자동 갱신됩니다. 마이페이지에서 언제든지 구독을 취소할 수 있습니다.",
  },
  {
    q: "플랜 변경은 어떻게 하나요?",
    a: (
      <>
        <Link href="/mypage" className={INLINE_LINK}>마이페이지 &gt; 구독 관리</Link>에서 플랜을 변경할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 현재 구독 기간 종료 후 적용됩니다.
      </>
    ),
  },
  {
    q: "환불 정책이 어떻게 되나요?",
    a: (
      <>
        결제일로부터 7일 이내 미사용 시 전액 환불이 가능합니다. 서비스 이용 이력이 있는 경우 잔여 기간에 비례하여 환불 처리됩니다. 자세한 내용은 <Link href="/refund" className={INLINE_LINK}>환불 정책 페이지</Link>를 확인해주세요.
      </>
    ),
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
    a: "Pro 플랜은 최대 2명, Team bibl 플랜은 최대 5명까지 팀원을 추가할 수 있습니다. 팀 공유 기능은 현재 준비 중이며 곧 오픈 예정입니다.",
  },
  {
    q: "플랜을 취소하면 데이터는 어떻게 되나요?",
    a: "구독 해지 즉시 저장된 검색 기록과 수집한 영상 데이터가 모두 삭제되며 복원이 불가능합니다. 해지 전에 필요한 데이터를 CSV 등으로 내보내기 해두시길 권장합니다.",
  },
];

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 닫힌 답: hidden="" → hidden="until-found"(지원하지 않는 브라우저는 그대로 접혀 있다)
  useEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (el && i !== openIdx) el.setAttribute("hidden", "until-found");
    });
  }, [openIdx]);

  // 페이지 안 찾기로 닫힌 답이 펼쳐지면 그 질문을 연 상태로 맞춘다
  useEffect(() => {
    const cleanups = answerRefs.current.map((el, i) => {
      if (!el) return () => {};
      const onMatch = () => setOpenIdx(i);
      el.addEventListener("beforematch", onMatch);
      return () => el.removeEventListener("beforematch", onMatch);
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQS.map((faq, i) => {
        const isOpen = openIdx === i;
        const qid = `faq-q-${i}`;
        const aid = `faq-a-${i}`;
        return (
          <div key={faq.q}>
            <h3>
              <button
                type="button"
                id={qid}
                aria-expanded={isOpen}
                aria-controls={aid}
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2 md:text-body"
              >
                {faq.q}
                <ChevronDownIcon
                  size={20}
                  className={cx("text-fg-3 transition-transform duration-150", isOpen && "rotate-180")}
                />
              </button>
            </h3>
            <div
              id={aid}
              ref={(el) => {
                answerRefs.current[i] = el;
              }}
              role="region"
              aria-labelledby={qid}
              hidden={!isOpen}
            >
              <p className="pb-5 text-body-sm text-fg-2 md:text-ui">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
