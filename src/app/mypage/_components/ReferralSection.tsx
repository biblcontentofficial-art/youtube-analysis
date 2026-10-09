"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonClass, cx } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";

export type ReferralInfo = { code: string; count: number; bonus: number };

/** 내 초대 코드·초대 수·보너스 조회(GET /api/referral). 실패하면 빈 코드 */
async function loadReferral(): Promise<ReferralInfo> {
  const d = await fetch("/api/referral").then((r) => r.json());
  return { code: d.code || "", count: d.count || 0, bonus: d.bonus || 0 };
}

/**
 * 친구 초대 카드. 불러오는 동안에도 같은 높이로 자리를 잡는다(밀림 0).
 * 안내 문구는 확인된 사실만 쓴다: 초대 링크로 가입하면 두 사람에게 보너스 3회가 적립된다(api/referral POST 의 ref:bonus +3).
 * 적립된 보너스가 실제 검색 차감 한도에 들어가는지는 lib/searchLimit 이 정하고(지금은 표시용 getSearchUsage 에서만 더함),
 * 그 판단은 소유자 확인 대기라 '한도가 늘어난다'는 문장은 쓰지 않는다.
 * load: 로컬 미리보기에서 고정 데이터를 넘길 때만 쓴다(기본은 /api/referral 조회).
 */
export default function ReferralSection({ load = loadReferral }: { load?: () => Promise<ReferralInfo> }) {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInfo = useCallback(() => {
    setLoading(true);
    load()
      .then((d) => {
        setCode(d.code);
        setCount(d.count);
        setBonus(d.bonus);
      })
      .catch(() => setCode(""))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const referralLink = `https://bibllab.com/sign-in?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [count > 0 && `${count}명 초대 완료`, bonus > 0 && `보너스 검색 ${bonus}회 적립됨`].filter(Boolean);
  // 코드를 받은 뒤에만 '없음'을 말한다(불러오는 중·실패면 알 수 없으므로 빈 자리)
  const statsText = stats.length > 0 ? stats.join(" · ") : !loading && code ? "아직 초대한 친구가 없습니다." : "";

  return (
    <div className="grid gap-5 rounded-card border border-line bg-surface p-5 md:grid-cols-2 md:gap-8 md:p-6">
      <div className="min-w-0">
        <p className="break-keep text-body-sm text-fg-2">
          친구가 내 초대 링크로 가입하면 나와 친구 모두 <span className="whitespace-nowrap font-semibold text-fg">보너스 검색 3회</span>가 적립됩니다.
        </p>
        {/* 초대 현황: 값이 없어도 한 줄 자리를 둔다 */}
        <p
          className={cx(
            "tnum mt-3 min-h-[1.5rem] text-body-sm",
            stats.length > 0 ? "font-medium text-fg-1" : "text-fg-3",
          )}
        >
          {statsText}
        </p>
      </div>

      <div className="min-w-0">
        {/* 라벨 줄: 실패하면 같은 자리(같은 높이)에 오류 문장을 쓴다. 좁은 폭에서도 코드 줄 상자 안에 긴 문장을 넣지 않는다 */}
        {!loading && !code ? (
          <p role="alert" className="mb-2 flex items-center gap-1.5 break-keep text-caption text-negative">
            <WarningIcon size={16} />
            초대 코드를 불러오지 못했습니다
          </p>
        ) : (
          <p className="mb-2 text-caption text-fg-3">내 초대 코드</p>
        )}
        {loading ? (
          <div role="status" className="flex items-center gap-2">
            <span className="sr-only">불러오는 중</span>
            <div aria-hidden="true" className="h-11 flex-1 animate-pulse rounded-control bg-surface-2 motion-reduce:animate-none" />
            <div aria-hidden="true" className="h-11 w-28 animate-pulse rounded-control bg-surface-2 motion-reduce:animate-none" />
          </div>
        ) : code ? (
          <div className="flex items-center gap-2">
            <div className="tnum flex h-11 min-w-0 flex-1 items-center justify-center rounded-control border border-line-strong px-3 text-ui font-semibold tracking-wider text-fg">
              {code}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cx(buttonClass({ variant: "secondary" }), "w-28")}
            >
              {copied ? "복사됨!" : "링크 복사"}
            </button>
            <span role="status" className="sr-only">{copied ? "초대 링크를 복사했습니다" : ""}</span>
          </div>
        ) : (
          // 실패해도 코드 줄과 같은 높이(44px): 다시 시도 버튼 하나
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchInfo} className={cx(buttonClass({ variant: "secondary" }), "w-28")}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
