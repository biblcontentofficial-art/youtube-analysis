import Link from "next/link";
import type { PlanKey } from "@/lib/stripe";
import { getLimitCopy, LimitPerkList } from "./limitCopy";

/** /search 한도 초과 인라인 안내. 한도 초과 모달(LimitModal)과 같은 문구 상수를 쓴다. */
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
    <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-7 text-center break-keep">
      <svg viewBox="0 0 24 24" fill="none" className="mx-auto mb-5 h-8 w-8 text-white" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
      </svg>
      <h2 className="mb-2 text-xl font-bold text-white">
        {copy.period} 검색 {limit}회를 모두 사용했습니다
      </h2>
      {copy.next && (
        <p className="mb-1 text-sm text-neutral-400">
          {copy.next.name} 플랜으로 업그레이드하면 <span className="font-semibold text-white">{copy.next.searches}</span>이 가능합니다
        </p>
      )}
      <p className="text-xs text-neutral-400">{copy.reset}</p>
      {copy.next && (
        <p className="mt-0.5 text-xs text-neutral-400">
          {copy.next.name} {copy.next.price}
        </p>
      )}
      <div className="mt-6">
        <LimitPerkList perks={copy.perks} />
        <Link
          href="/pricing"
          className="inline-block w-full max-w-xs rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
        >
          플랜 업그레이드 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
