"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useNavigationLoading } from "@/app/_components/NavigationLoader";

const EXAMPLE_KEYWORDS = ["캠핑", "영어 공부", "주식 투자", "다이어트", "여행 브이로그", "요리 레시피"];

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { showLoading } = useNavigationLoading();
  const [keyword, setKeyword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingKeyword, setPendingKeyword] = useState("");

  interface HistoryItem { term: string; count: number; }

  const saveToHistory = (term: string): number => {
    const saved = localStorage.getItem("searchHistory");
    let history: HistoryItem[] = [];
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      history = Array.isArray(parsed) && typeof parsed[0] === "string"
        ? parsed.map((t: string) => ({ term: t, count: 1 }))
        : parsed;
    } catch { history = []; }

    const existing = history.find((h) => h.term === term);
    let newCount = 1;
    if (existing) {
      newCount = existing.count + 1;
      history = [{ term, count: newCount }, ...history.filter((h) => h.term !== term)];
    } else {
      history = [{ term, count: 1 }, ...history];
    }
    localStorage.setItem("searchHistory", JSON.stringify(history.slice(0, 30)));
    return newCount;
  };

  const trySearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (isLoaded && !isSignedIn) {
      setPendingKeyword(trimmed);
      setShowAuthModal(true);
      return;
    }
    const count = saveToHistory(trimmed);
    showLoading(`"${trimmed}" 검색 중...`);
    router.push(`/search?q=${encodeURIComponent(trimmed)}&count=${count}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    if (!confirm(`"${trimmed}" 검색하시겠습니까?`)) return;
    trySearch(trimmed);
  };

  const handleExample = (kw: string) => {
    trySearch(kw);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 로그인 유도 모달 */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 아이콘 */}
            <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-400 mb-1">
              <span className="text-teal-400 font-medium">&ldquo;{pendingKeyword}&rdquo;</span> 검색을 시작하려면<br />
              로그인 또는 회원가입을 해주세요.
            </p>
            <p className="text-xs text-gray-600 mb-7">가입 후 하루 2회 무료 검색 · 1분 만에 시작</p>

            <div className="flex flex-col gap-3">
              <Link
                href={`/sign-up?redirect_url=/search?q=${encodeURIComponent(pendingKeyword)}`}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition text-sm"
              >
                회원가입 후 검색하기
              </Link>
              <Link
                href={`/sign-in?redirect_url=/search?q=${encodeURIComponent(pendingKeyword)}`}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition text-sm border border-gray-700"
              >
                로그인
              </Link>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-5 text-xs text-gray-600 hover:text-gray-400 transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-3xl text-center space-y-8">
          {/* 배지 */}
          <div className="inline-flex items-center rounded-full border border-teal-800 bg-teal-950/50 px-4 py-1.5 text-sm text-teal-400">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 mr-2 animate-pulse" />
            bibl lab · 유튜브 트렌드 분석
          </div>

          {/* 타이틀 */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              유튜브 키워드로<br />
              <span className="text-teal-400">트렌드를 선점</span>하세요
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
              조회수·구독자·성과도를 한눈에 분석해<br className="hidden sm:block" />
              경쟁력 있는 콘텐츠 주제를 찾아드립니다
            </p>
          </div>

          {/* 검색창 */}
          <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
            <div className="flex items-center bg-gray-900 border border-gray-700 focus-within:border-teal-500 rounded-2xl p-2 shadow-2xl transition-colors">
              <div className="pl-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="분석할 키워드를 입력하세요 (예: 캠핑, 영어 공부)"
                className="w-full bg-transparent text-white px-4 py-3 focus:outline-none text-base placeholder-gray-600"
                autoFocus
              />
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-400 text-white px-6 py-2.5 rounded-xl font-semibold transition-all text-sm shrink-0"
              >
                분석 시작
              </button>
            </div>
          </form>

          {/* 예시 키워드 */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs text-gray-600 self-center">인기 키워드:</span>
            {EXAMPLE_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => handleExample(kw)}
                className="text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-full transition"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 소셜 프루프 */}
      <div className="border-y border-gray-800 bg-gray-900/50 py-6">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-teal-400">10,000+</p>
            <p className="text-xs text-gray-500 mt-1">키워드 분석됨</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-400">실시간</p>
            <p className="text-xs text-gray-500 mt-1">YouTube 데이터 수집</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-400">무료</p>
            <p className="text-xs text-gray-500 mt-1">로그인 없이 2회 검색</p>
          </div>
        </div>
      </div>

      {/* 기능 소개 */}
      <div className="bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📈"
            title="성과도 분석"
            desc="영상의 조회수·구독자 비율로 실제 성과를 Good / Normal / Bad 로 즉시 판단합니다"
          />
          <FeatureCard
            icon="🔍"
            title="키워드 트렌드"
            desc="검색 키워드의 최신 영상을 실시간으로 수집하여 트렌드를 빠르게 파악합니다"
          />
          <FeatureCard
            icon="📋"
            title="채널 인사이트"
            desc="채널 평균 조회수 대비 반응도를 계산해 숨겨진 히트 채널을 발견합니다"
          />
        </div>
      </div>

      {/* 이용 방법 */}
      <div className="border-t border-gray-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">3단계로 바로 시작</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <StepCard step={1} title="키워드 입력" desc="분석하고 싶은 유튜브 키워드를 검색창에 입력하세요" />
            <StepCard step={2} title="실시간 분석" desc="YouTube API로 최신 영상 데이터를 수집·분석합니다" />
            <StepCard step={3} title="인사이트 확인" desc="성과도·조회수·채널 분석 결과로 전략을 세우세요" />
          </div>
        </div>
      </div>

      {/* 요금제 CTA */}
      <div className="border-t border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">더 많이 분석하고 싶으신가요?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">무료로 하루 2회 검색 가능합니다. 더 많은 검색과 고급 기능은 유료 플랜에서 이용하세요.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition"
          >
            요금제 보기
          </Link>
          <button
            onClick={() => trySearch("캠핑")}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
          >
            무료로 체험하기
          </button>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg">
        {step}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
