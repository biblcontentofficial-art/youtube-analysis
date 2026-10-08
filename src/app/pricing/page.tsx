/**
 * 요금제(정적 렌더 ○). DESIGN 7.3: 첫 화면 한 줄 + 월간/연간 세그먼트 → 카드 4장 → 기능 비교표 → FAQ → 마지막 CTA.
 * page 는 searchParams·auth() 를 읽지 않는다. 결제 실패 안내(?error=)는 PricingNotice(클라이언트)가
 * Suspense 안에서 쿼리만 읽어 그린다. 로그인·현재 플랜은 PricingCards 가 브라우저에서 확인한다.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { OG_DEFAULT } from "@/lib/seo";
import PricingCards from "./_components/PricingCards";
import FaqAccordion from "./_components/FaqAccordion";
import PricingNotice from "./_components/PricingNotice";
import { SectionHeader } from "@/components/ui/section-header";
import { CONTAINER } from "@/components/ui/container";
import { buttonClass, cx } from "@/components/ui/button";
import { TABLE, TH_PREVIEW, TD_PREVIEW } from "@/components/ui/table";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "요금제 · 플랜 안내",
  description:
    "비블랩(bibl lab) 요금제 안내. 무료 Free 플랜부터 Starter·Pro·Business까지. 유튜브 영상 검색, 채널 찾기, 영상 수집·내보내기 기능을 합리적인 가격에 이용하세요.",
  keywords: [
    "비블랩 요금제", "비블 가격", "유튜브 분석 도구 가격", "bibl lab 플랜",
    "유튜브 분석 무료", "크리에이터 도구 요금제",
  ],
  alternates: { canonical: "https://bibllab.com/pricing" },
  openGraph: {
    ...OG_DEFAULT,
    title: "요금제 · 플랜 안내 | 비블랩",
    description: "비블랩 무료~비즈니스 플랜. 유튜브 분석·채널 찾기·영상 수집.",
    url: "https://bibllab.com/pricing",
  },
};

/**
 * 기능 비교표. 카드에 적힌 항목만 옮겼다(문구 그대로). true = 포함, false = 미포함, 문자열 = 카드의 값.
 * TEAM BIBL 은 카드의 'Pro의 모든 기능 포함'에 따라 Pro 와 같은 칸을 포함으로 둔다.
 * '팀 공유'는 네 플랜 모두 카드에서 제외라 표에 넣지 않았다.
 */
const PLAN_COLS = ["Free", "Starter", "Pro", "TEAM BIBL"] as const;
type Cell = boolean | string;
const COMPARE_ROWS: { label: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { label: "영상 검색", cells: ["2회/일", "50회/월", "500회/월", "무제한"] },
  { label: "채널 검색", cells: ["1회/일", "30회/월", "500회/월", "무제한"] },
  { label: "조회수·구독자·게시일 한눈에 보기", cells: [true, true, true, true] },
  { label: "필터", cells: ["기본 필터 (전체/쇼츠)", "쇼츠 필터 · 심화 필터", "쇼츠 필터 · 심화 필터", "쇼츠 필터 · 심화 필터"] },
  { label: "키워드 경쟁도 · 제목 패턴 분석", cells: [false, true, true, true] },
  { label: "검색 기록 저장", cells: [false, "30일", "무제한", "무제한"] },
  { label: "영상 수집 · 내보내기", cells: [false, false, "CSV 내보내기", "CSV 내보내기"] },
  { label: "채널 분석 리포트", cells: [false, false, true, true] },
  { label: "매주 1회 1:1 비블 컨설팅", cells: [false, false, false, true] },
  { label: "100강 VOD 제공", cells: [false, false, false, true] },
  { label: "매월 비블 오프라인 커뮤니티 초대권", cells: [false, false, false, true] },
];

/** 768 미만: 가로로 밀어도 기능 이름 열이 왼쪽에 남는다(바탕을 칠해 값이 그 밑으로 지나간다) */
const STICKY_COL = "max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-canvas max-md:border-r max-md:border-line";

function CompareCell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <CheckIcon size={16} className="inline-block text-fg-2" />
        <span className="sr-only">포함</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <CloseIcon size={16} className="inline-block text-fg-4" />
        <span className="sr-only">미포함</span>
      </>
    );
  }
  return <span className="tnum text-body-sm text-fg-1">{value}</span>;
}

export default function PricingPage() {
  return (
    <main id="main">
      {/* 첫 화면: 머리 + 결제 실패 안내 + 세그먼트 + 카드 */}
      <section aria-labelledby="pricing-title" className="border-b border-line">
        <div className={cx(CONTAINER.wide, "pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-14")}>
          <SectionHeader caption="심플한 요금제" label="PRICING" />
          <h1 id="pricing-title" className="text-h2 text-silver lg:text-h1">
            원하는 <span className="text-accent">플랜</span>을 선택하세요
          </h1>
          <p className="mt-3 text-body text-fg-2 sm:mt-4 lg:text-lead">
            <span className="block">무료로 시작하고, 필요할 때 업그레이드하세요.</span>
            <span className="block">언제든지 취소 가능합니다.</span>
          </p>

          <Suspense fallback={null}>
            <PricingNotice />
          </Suspense>

          <PricingCards />

          <div className="mt-8 space-y-1 text-caption text-fg-3">
            <p>모든 플랜은 카드 결제를 지원합니다.</p>
            <p>구독은 언제든지 취소 가능하며 남은 기간은 환불 처리됩니다.</p>
          </div>
        </div>
      </section>

      {/* 기능 비교표 */}
      <section aria-labelledby="compare-title" className="border-b border-line">
        <div className={cx(CONTAINER.wide, "py-16 md:py-24")}>
          <SectionHeader caption="플랜별 기능" label="COMPARE" />
          <h2 id="compare-title" className="text-h3 md:text-h2">기능 비교</h2>
          <p className="mt-6 text-caption text-fg-3 md:hidden">옆으로 밀어 다른 플랜을 볼 수 있습니다.</p>
          <div className="relative mt-3 overflow-x-auto md:mt-10" tabIndex={0} role="region" aria-labelledby="compare-title">
            <table className={cx(TABLE, "min-w-[640px]")}>
              <colgroup>
                <col className="w-[132px] md:w-[34%]" />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={cx(TH_PREVIEW, STICKY_COL)}>
                    <span className="sr-only">기능</span>
                  </th>
                  {PLAN_COLS.map((name) => (
                    <th
                      key={name}
                      scope="col"
                      className={cx(TH_PREVIEW, "px-3 text-center")}
                    >
                      <span className="text-body-sm font-semibold text-fg">{name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={cx(TD_PREVIEW, STICKY_COL, "pr-4 text-body-sm font-medium text-fg-2")}>
                      {row.label}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={PLAN_COLS[i]} className={cx(TD_PREVIEW, "px-3 text-center")}>
                        <CompareCell value={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="border-b border-line">
        <div className={cx(CONTAINER.wide, "py-16 md:py-24")}>
          <SectionHeader caption="요금제 FAQ" label="FAQ" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
            <h2 id="faq-title" className="text-h3 md:text-h2 lg:col-span-4">자주 묻는 질문</h2>
            <div className="lg:col-span-8">
              <FaqAccordion />
            </div>
          </div>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section aria-labelledby="pricing-cta-title">
        <div className={cx(CONTAINER.wide, "py-16 md:py-24")}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-6">
            <h2 id="pricing-cta-title" className="text-h3 sm:text-[40px] sm:leading-[1.2] lg:col-span-8 lg:text-h1">
              <span className="block text-fg-3">무료로 시작하고,</span>
              <span className="block">필요할 때 업그레이드하세요</span>
            </h2>
            <div className="lg:col-span-4">
              {/* 주 버튼 레시피 + 홈 마지막 CTA(HomeContact)와 같은 56px 높이만 덮어쓴다 */}
              <Link
                href="/sign-up"
                className={cx(buttonClass({ variant: "primary", size: "lg" }), "h-14! px-7! text-body!")}
              >
                무료로 시작
              </Link>
              <div className="mt-6 flex flex-col items-start border-t border-line pt-4">
                <Link
                  href="/studio/class/consulting"
                  className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2"
                >
                  1:1 팀비블 신청하기 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
