"use client";

import { useEffect, useState } from "react";

export default function ReferralSection() {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => {
        setCode(d.code || "");
        setCount(d.count || 0);
        setBonus(d.bonus || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return null;

  return (
    <div className="bg-neutral-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-neutral-400 text-xs">친구 초대</p>
        {count > 0 && (
          <span className="text-xs text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full">
            {count}명 초대 완료
          </span>
        )}
      </div>

      <p className="text-neutral-300 text-xs mb-3">
        친구를 초대하면 나와 친구 모두 <span className="text-white font-semibold">무료 검색 3회</span>를 받아요!
      </p>

      {/* 추천 코드 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-wider text-center">
          {code}
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded-lg border border-neutral-700 text-xs font-semibold transition-colors ${
            copied
              ? "bg-neutral-800 text-green-400"
              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          }`}
        >
          {copied ? "복사됨!" : "링크 복사"}
        </button>
      </div>

      {/* 보너스 현황 */}
      {bonus > 0 && (
        <p className="text-xs text-neutral-300 mt-2">
          보너스 검색 <span className="font-bold text-white">{bonus}회</span> 적립됨
        </p>
      )}
    </div>
  );
}
