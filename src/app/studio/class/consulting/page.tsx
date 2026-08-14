"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * 팀비블 1:1 유튜브 컨설팅 상세 페이지
 * - 상세 이미지 7장 (public/studio/consulting/1~7.png)
 * - "1:1 팀비블 신청하기" 클릭 → Latpeed 결제 페이지로 이동
 * - 블랙&화이트 톤 (상세 이미지와 통일)
 */

const DETAIL_IMAGES = [1, 2, 3, 4, 5, 6, 7];
const APPLY_URL = "https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/eLjQa";

function ApplyButton({ label = "1:1 팀비블 신청하기" }: { label?: string }) {
  return (
    <a
      href={APPLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition text-base shadow-lg shadow-white/10"
    >
      {label}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
    </a>
  );
}

export default function TeamBiblConsultingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* 상단 네비 */}
      <div className="sticky top-14 z-30 bg-black/90 backdrop-blur border-b border-gray-900">
        <div className="max-w-[1000px] mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/studio" className="text-xs text-gray-400 hover:text-white transition inline-flex items-center gap-1">
            ← 스튜디오
          </Link>
          <span className="text-sm font-bold text-white">1:1 유튜브 컨설팅</span>
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white hover:text-gray-300 underline underline-offset-4 transition"
          >
            신청하기
          </a>
        </div>
      </div>

      {/* 상단 CTA */}
      <div className="max-w-[1000px] mx-auto px-4 pt-12 pb-10 text-center border-b border-gray-900">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
          팀비블 1:1 유튜브 컨설팅
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          유튜브 채널 성장과 함께 사업을 성장시키는 방법까지, 비블이 1:1로 함께합니다.
        </p>
        <ApplyButton />
        <p className="text-xs text-gray-600 mt-4">신청 페이지로 이동합니다</p>
      </div>

      {/* 상세 이미지 */}
      <div className="max-w-[1000px] mx-auto">
        {DETAIL_IMAGES.map((n) => (
          <div key={n} className="w-full leading-[0]">
            <Image
              src={`/studio/consulting/${n}.png`}
              alt={`팀비블 1:1 유튜브 컨설팅 상세 ${n}`}
              width={1000}
              height={8000}
              className="w-full h-auto"
              priority={n === 1}
            />
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="max-w-[1000px] mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
          1:1 팀비블과 시작하세요
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          유튜브 채널 성장과 함께 사업을 성장시키는 방법까지, 비블이 1:1로 함께합니다.
        </p>
        <ApplyButton />
        <p className="text-xs text-gray-600 mt-4">신청 페이지로 이동합니다</p>
      </div>

      {/* 모바일 하단 고정 신청 버튼 */}
      <div className="sticky bottom-0 z-30 md:hidden bg-black/95 backdrop-blur border-t border-gray-900 p-3">
        <a
          href={APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-white hover:bg-gray-200 text-black text-center font-black rounded-xl transition text-sm"
        >
          1:1 팀비블 신청하기
        </a>
      </div>
    </main>
  );
}
