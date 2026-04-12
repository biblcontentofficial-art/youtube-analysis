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
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 text-xs">친구 초대</p>
        {count > 0 && (
          <span className="text-[10px] bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded-full">
            {count}명 초대 완료
          </span>
        )}
      </div>

      <p className="text-gray-400 text-xs mb-3">
        친구를 초대하면 나와 친구 모두 <span className="text-teal-400 font-semibold">무료 검색 3회</span>를 받아요!
      </p>

      {/* 추천 코드 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-wider text-center">
          {code}
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            copied
              ? "bg-teal-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
        >
          {copied ? "복사됨!" : "링크 복사"}
        </button>
      </div>

      {/* 보너스 현황 */}
      {bonus > 0 && (
        <p className="text-xs text-teal-400 mt-2">
          보너스 검색 <span className="font-bold">{bonus}회</span> 적립됨
        </p>
      )}
    </div>
  );
}
