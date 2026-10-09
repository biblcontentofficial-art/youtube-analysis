import Link from "next/link";
import type { PlanKey } from "@/lib/stripe";
import { buttonClass } from "@/components/ui/button";
import { getLimitCopy, LimitPerkList } from "./limitCopy";

/**
 * /search 한도 초과 인라인 안내. 한도 초과 모달(LimitModal)과 같은 문구 상수를 쓴다.
 * 이 화면의 흰 면은 검색 버튼 하나라 요금제 버튼은 보조 버튼(DESIGN 1.2·6.5).
 * 남은 횟수 0회 배지는 DESIGN 6.12(0회 = negative 테두리·글자).
 */
export default function LimitNotice({
  limit,
  isMonthly,
  plan,
}: {
  limit: number;
  isMonthly: boolean;
  plan: PlanKey;
}) {
  const copy = getLimitCopy(isMonthly, plan);
  return (
    <div className="mb-6 rounded-card border border-line bg-surface p-6 text-center break-keep md:p-8">
      <p className="mb-4 inline-flex h-8 items-center rounded-control border border-negative/55 px-2.5 text-caption font-medium text-negative tnum">
        {copy.period} 0회 남음
      </p>
      <h2 className="text-h4 font-bold text-fg">
        {copy.period} 검색 {limit}회를 모두 사용했습니다
      </h2>
      {copy.next && (
        <p className="mt-2 text-body-sm text-fg-3">
          {copy.next.name} 플랜으로 업그레이드하면 <span className="font-semibold text-fg">{copy.next.searches}</span>이 가능합니다
        </p>
      )}
      <p className="mt-1 text-caption text-fg-3">{copy.reset}</p>
      {copy.next && (
        <p className="mt-0.5 text-caption text-fg-3">
          {copy.next.name} {copy.next.price}
        </p>
      )}
      <div className="mt-6">
        <LimitPerkList perks={copy.perks} />
        <Link href="/pricing" className={buttonClass({ variant: "secondary", size: "lg" })}>
          플랜 업그레이드 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
