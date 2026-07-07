"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ConsultingApplyForm from "./_components/ConsultingApplyForm";

/**
 * 1:1 유튜브 컨설팅 상세 페이지
 * - 상세 이미지 4장 (public/studio/1on1-consulting/1~4.png)
 * - "1:1 컨설팅 신청" 버튼 → 신청 폼 모달 → bibl.content.official@gmail.com 메일
 */

const DETAIL_IMAGES = [1, 2, 3, 4];

export default function OneOnOneConsultingPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 상단 네비 */}
      <div className="sticky top-14 z-30 bg-black/90 backdrop-blur border-b border-gray-900">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/studio" className="text-xs text-gray-400 hover:text-white transition inline-flex items-center gap-1">
            ← 스튜디오
          </Link>
          <span className="text-sm font-bold text-white">1:1 유튜브 컨설팅</span>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-teal-400 hover:text-teal-300 transition"
          >
            신청하기
          </button>
        </div>
      </div>

      {/* 상세 이미지 */}
      <div className="max-w-2xl mx-auto">
        {DETAIL_IMAGES.map((n) => (
          <div key={n} className="w-full leading-[0]">
            <Image
              src={`/studio/1on1-consulting/${n}.png`}
              alt={`1:1 유튜브 컨설팅 상세 ${n}`}
              width={1000}
              height={8000}
              className="w-full h-auto"
              priority={n === 1}
            />
          </div>
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="max-w-2xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
          비블과 <span className="text-teal-400">1:1</span>로 시작하세요
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          브랜딩부터 비즈니스 확장까지, 당신의 채널에 맞춘 1:1 맞춤 컨설팅입니다.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-xl transition text-base shadow-lg shadow-teal-900/30"
        >
          1:1 컨설팅 신청하기
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </button>
        <p className="text-xs text-gray-600 mt-4">영업일 기준 1~2일 내 연락드립니다</p>
      </div>

      {/* 모바일 하단 고정 신청 버튼 */}
      <div className="sticky bottom-0 z-30 md:hidden bg-black/95 backdrop-blur border-t border-gray-900 p-3">
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-xl transition text-sm"
        >
          1:1 컨설팅 신청하기
        </button>
      </div>

      {showForm && <ConsultingApplyForm onClose={() => setShowForm(false)} />}
    </main>
  );
}
