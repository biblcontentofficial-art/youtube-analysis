/**
 * 스레드 탭(내 계정 분석 · 수집함). 도구 탭 레시피: 현재 탭만 흰 글자 + 흰 2px 막대(aria-current="page").
 * 근거: DESIGN.md 6.3 · 7.3 스레드
 *
 * - 바닥 선(TAB_BAR)과 가로 스크롤(nav)을 다른 요소에 둔다(tabs.ts 주석과 같은 이유). nav 의 -mb-px 로 현재 탭 막대가 선 위에 그려진다.
 * - 아이콘 없이 글자만(도구 탭과 같은 모양).
 */
import Link from "next/link";
import { TAB_BAR } from "@/components/ui/tabs";

interface Props {
  current: string;
}

const TABS = [
  { key: "analytics", label: "내 계정 분석" },
  { key: "saved", label: "수집함" },
] as const;

/** 탭 하나. 높이 44px · 768 이상 48px (ToolTabs 와 같은 값) */
const TOOL_TAB =
  "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg md:h-12 aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent";

export default function ThreadsTabNav({ current }: Props) {
  return (
    <div className={TAB_BAR}>
      <nav aria-label="스레드 메뉴" className="scrollbar-hide -mb-px flex gap-6 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/threads?tab=${tab.key}`}
            aria-current={current === tab.key ? "page" : undefined}
            className={TOOL_TAB}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
