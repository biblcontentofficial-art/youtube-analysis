/**
 * 트렌드 서치 도구 탭(앱 셸 둘째 줄). 현재 탭만 흰 글자 + 흰 2px 막대(aria-current="page").
 * 근거: DESIGN.md 6.3 · 7.2 2행, 시안 design-final/silver/app.html 309~319행
 *
 *   <ToolTabs current="/search" />
 *
 * - 탭 목록: 영상 찾기 · 채널 찾기 · 수집한 영상(Pro) · 브레이크아웃(소유자 요청 2026-10-16, /trend-search/breakout 이하 전체가 현재 탭).
 *   '채널 분석'(/my-channel)은 로그인·횟수 제한 없이 YouTube 쿼터를 쓰는 경로라, 서버 측 제한이 먼저 들어가기 전에는 넣지 않는다.
 * - 잠긴 탭은 라벨 fg-3 + Pro 태그 한 모양(DESIGN 6.12·6.29). 자물쇠 아이콘 없음.
 *   잠금 표기는 결정 9 답 전까지 지금 정책 그대로(수집한 영상 = Pro 부터). 채널 찾기는 Free 도 쓸 수 있어 태그를 달지 않는다.
 * - 바닥 선은 tabs.ts 의 TAB_BAR 를 쓴다. 가로 스크롤(nav)은 다른 요소에 둔다(tabs.ts 주석과 같은 이유). nav 의 -mb-px 로 현재 탭 막대가 선 위에 그려진다.
 *   TAB_LIST 는 gap-1 이라 도구 탭 간격(gap-6, DESIGN 6.3)과 겹쳐 쓰지 않고 같은 구조를 이 파일에서 적는다(cx 는 클래스 병합을 하지 않는다).
 * - 서버 컴포넌트. 로그인·플랜을 읽지 않는다(앱 화면마다 같은 탭).
 */
import Link from "next/link";
import { TAB_BAR } from "@/components/ui/tabs";

export type ToolTabHref = "/search" | "/channels" | "/saved" | "/trend-search/breakout";

const TABS: { href: ToolTabHref; label: string; plan?: string }[] = [
  { href: "/search", label: "영상 찾기" },
  { href: "/channels", label: "채널 찾기" },
  { href: "/saved", label: "수집한 영상", plan: "Pro" },
  { href: "/trend-search/breakout", label: "브레이크아웃", plan: "Pro" },
];

/** 탭 하나. 높이 44px · 768 이상 48px */
const TOOL_TAB =
  "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent text-body-sm font-medium text-fg-3 transition-colors duration-150 hover:text-fg md:h-12 aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent";

/** 잠긴 탭의 요금제 태그(DESIGN 6.12 Pro) */
const PLAN_TAG = "inline-flex items-center rounded border border-line-strong px-1 text-micro font-medium leading-[18px] text-fg-3";

export default function ToolTabs({ current }: { current: ToolTabHref }) {
  return (
    <div className={TAB_BAR}>
      <div className="mx-auto w-full max-w-wide px-6 lg:px-8">
        <nav aria-label="트렌드 서치 도구" className="scrollbar-hide -mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.href === current ? "page" : undefined}
              className={TOOL_TAB}
            >
              {t.label}
              {t.plan && <span className={PLAN_TAG}>{t.plan}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
