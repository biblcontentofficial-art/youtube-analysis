"use client";

/**
 * /studio FAQ(DESIGN 6.21 아코디언). 요금제 FaqAccordion 과 같은 구조:
 * 질문은 h3 > button(aria-expanded·aria-controls), 답은 닫혀 있어도 렌더하고 hidden 으로 접는다(서버 HTML 에 있다).
 * 브라우저 안에서는 닫힌 답을 hidden="until-found" 로 바꿔 Ctrl+F 로 찾히게 하고, 찾으면(beforematch) 그 답을 연다.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/button";

export default function StudioFaq({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (el && i !== openIdx) el.setAttribute("hidden", "until-found");
    });
  }, [openIdx]);

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
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        const qid = `studio-faq-q-${i}`;
        const aid = `studio-faq-a-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                id={qid}
                aria-expanded={isOpen}
                aria-controls={aid}
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2 md:text-body"
              >
                {item.q}
                <ChevronDownIcon
                  size={20}
                  className={cx("shrink-0 text-fg-3 transition-transform duration-150", isOpen && "rotate-180")}
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
              <p className="whitespace-pre-line pb-5 text-body-sm text-fg-2 md:text-ui">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
