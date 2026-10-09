/**
 * 검색 한도 안내 문구. 한도 초과 모달(LimitModal)과 /search 인라인 카드(LimitNotice)가 같이 쓴다.
 *
 * - 초기화 시각은 src/lib/searchLimit.ts 의 실제 동작이다. 일 한도는 UTC 날짜 키라 한국 시간 오전 9시에,
 *   월 한도는 매월 1일에 초기화된다.
 * - 가격은 /pricing(src/app/pricing/_components/PricingCards.tsx)과 같은 값이다. 요금이 바뀌면 함께 고친다.
 * - 파생 지표(알고리즘 확률 등) 홍보 문구는 넣지 않는다(YouTube 정책, 커밋 d5a5164).
 * - 혜택 문구는 두 화면에 원래 있던 항목을 합친 것이다(모달: 검색 기록 30일 저장, 인라인 카드: 채널 리포트).
 *   인라인 카드의 '알고리즘 탑승 확률'만 위 정책에 따라 뺐다.
 */
import { Fragment } from "react";
import type { PlanKey } from "@/lib/stripe";
import { CheckIcon } from "@/components/ui/icons";

export type UpgradePlan = {
  name: string;
  /** 강조 문구: "Starter 플랜으로 {searches}이 가능합니다" */
  searches: string;
  price: string;
  /** 혜택 항목. 화면에는 " · " 로 이어 붙이고, 줄바꿈은 항목 사이에서만 한다. */
  perks: string[];
};

/** /search 무료 안내 줄도 이 가격을 쓴다 */
export const STARTER: UpgradePlan = {
  name: "Starter",
  searches: "월 50회 검색",
  price: "월 ₩19,000 (연간 결제 시 월 ₩15,000)",
  perks: ["월 50회", "채널 찾기", "검색 기록 30일 저장"],
};

/** 검색 결과 아래 Pro 안내 카드(ResultFootCards)도 이 가격·한도를 쓴다 */
export const PRO: UpgradePlan = {
  name: "Pro",
  searches: "월 500회 검색",
  price: "월 ₩45,000 (연간 결제 시 월 ₩39,000)",
  perks: ["월 500회", "영상 수집", "CSV 내보내기", "채널 리포트"],
};

export function getLimitCopy(isMonthly: boolean, plan: PlanKey) {
  // 권유 플랜: Free → Starter, Starter·팀비블 → Pro. 그 위(Pro 등)는 권유 없이 초기화 안내만.
  const next = plan === "free" ? STARTER : plan === "starter" || plan === "team" ? PRO : null;
  return {
    period: isMonthly ? "이번 달" : "오늘",
    reset: isMonthly ? "매월 1일 초기화" : "매일 오전 9시(한국 시간) 초기화",
    next,
    // 혜택 비교는 지금 플랜보다 위 단계만 보여 준다.
    perks: plan === "free" ? [STARTER, PRO] : next ? [next] : [],
  };
}

/** 플랜 혜택 비교 목록 (모달·인라인 카드 공용) */
export function LimitPerkList({ perks }: { perks: UpgradePlan[] }) {
  if (perks.length === 0) return null;
  return (
    <ul className="mx-auto mb-6 max-w-md space-y-2 rounded-card border border-line bg-surface px-4 py-3 text-left">
      {perks.map((p) => (
        <li key={p.name} className="flex items-start gap-2 text-caption text-fg-3 break-keep">
          <CheckIcon size={16} className="mt-0.5 text-fg-3" />
          <span>
            <span className="font-semibold text-fg">{p.name}</span>
            <span aria-hidden="true" className="mx-1 text-fg-4">·</span>
            {p.perks.map((item, i) => (
              <Fragment key={item}>
                {i > 0 && " "}
                <span className="whitespace-nowrap">
                  {item}
                  {i < p.perks.length - 1 && " ·"}
                </span>
              </Fragment>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
