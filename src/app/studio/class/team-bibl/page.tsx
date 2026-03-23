"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const CURRICULUM = [
  {
    week: "1주차", lessons: [
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법1 (Welcome 영상)", duration: "25:11" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법2", duration: "14:55" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법3", duration: "10:43" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법4", duration: "16:33" },
    ],
  },
  {
    week: "2주차", lessons: [
      { title: "[2주차] 채널 프로필 세팅", duration: "15:53" },
      { title: "[2주차] 채널 기본 세팅", duration: "11:02" },
      { title: "[2주차] 유튜브 알고리즘의 이해", duration: "12:52" },
      { title: "[2주차] 좋은 영상에 대한 감 익히기", duration: "12:21" },
    ],
  },
  {
    week: "3주차", lessons: [
      { title: "[3주차] 썸네일의 중요성 이해하기", duration: "08:11" },
      { title: "[3주차] 좋은 썸네일이란?", duration: "22:45" },
      { title: "[3주차] 제목의 중요성 이해하기", duration: "07:13" },
      { title: "[3주차] 좋은 제목이란?", duration: "10:35" },
    ],
  },
  {
    week: "4주차", lessons: [
      { title: "[4주차] 썸네일 제작 기본 이론", duration: "12:15" },
      { title: "[4주차] 썸네일 제작 실습", duration: "09:57" },
      { title: "[4주차] AI 활용1 : 이미지 수정", duration: "09:20" },
      { title: "[4주차] AI 활용2 : 딥 리서치, 심층 리서치", duration: "12:30" },
    ],
  },
  {
    week: "5주차", lessons: [
      { title: "[5주차] 썸네일 이론 심화", duration: "13:22" },
      { title: "[5주차] 썸네일 기획 심화", duration: "08:09" },
      { title: "[5주차] 썸네일, 제목 테스트 기능", duration: "18:26" },
      { title: "[5주차] 썸네일 벤치마킹 심화", duration: "15:58" },
    ],
  },
  {
    week: "6주차", lessons: [
      { title: "[6주차] 원고의 중요성 & 목표 지표", duration: "21:57" },
      { title: "[6주차] 인트로 30초 기획 1", duration: "15:21" },
      { title: "[6주차] 인트로 30초 기획 2", duration: "10:57" },
      { title: "[6주차] 스토리의 7가지 요소", duration: "16:00" },
    ],
  },
  {
    week: "7주차", lessons: [
      { title: "[7주차] 본문 기획", duration: "21:41" },
      { title: "[7주차] 본문 설계", duration: "13:17" },
      { title: "[7주차] 아웃트로 설계", duration: "06:56" },
      { title: "[7주차] 실제 적용", duration: "11:18" },
    ],
  },
  {
    week: "8주차", lessons: [
      { title: "[8주차] 유튜브로 판매를 만드는 공식", duration: "19:37" },
      { title: "[8주차] 판매용 대본 기획", duration: "12:59" },
      { title: "[8주차] 랜딩페이지 제작", duration: "17:20" },
      { title: "[8주차] 판매 방식", duration: "16:02" },
    ],
  },
  {
    week: "9주차", lessons: [
      { title: "[9주차] AI 활용 방법", duration: "15:29" },
      { title: "[9주차] AI 작가 제작하기", duration: "15:12" },
      { title: "[9주차] AI 작가 에이전트", duration: "13:06" },
      { title: "[9주차] Claude 다양한 활용 방법", duration: "22:25" },
    ],
  },
];

const REVIEWS = [
  {
    name: "장**",
    rating: 5,
    date: "3주 전",
    text: "유튜브시작함에있어서 너무막막하고 많은고민이 있었는데 강의들으면서 하나하나 시작하게 되었어요 아직은 이러한 과정이 쉽진 않지만 꾸준히 노력해서 유튜브를 키워보고싶어요!",
  },
  {
    name: "박**",
    rating: 5,
    date: "3주 전",
    text: "'뭐라도 해야 하는데' 라는 마음은 누구나 갖고 있지만, 실행할 수 있게 만드는 강의라고 생각합니다. 이제 5주차 강의를 듣고 있으며, 아무것도 모르는 초보도 적용하고 실행할 수 있도록 강의가 구성되어 있습니다. 최근 다양한 짧은 강의가 수 없이 많지만, 비블님 강의는 꾸준하게 성과를 끌어낼 수 있는 기간으로 세팅한 점도 매력적이라고 생각됩니다.",
  },
  {
    name: "허**",
    rating: 5,
    date: "4주 전",
    text: ".",
  },
  {
    name: "서***",
    rating: 5,
    date: "1개월 전",
    text: "항상 새로운 관점과 새로운 방법을 실행을 하면서 배우니 주입으로 끝나는 것이 아니라 '내가 했었던 이 방법을 이렇게 적용하면 더 나은 결과가 나올 수 있구나' 라는 깨달음과 함께 공부할 수 있어 너무 좋습니다.\n\n이번 AI 활용과 썸네일 제작 관련해서도 여러 번 복습하면서 내 것으로 만들겠습니다.",
  },
  {
    name: "서************",
    rating: 5,
    date: "1개월 전",
    text: "초보 유튜버에게 기본부터 차근차근 알려주셔서 너무 감사합니다. 강의보고 실행하며 꾸준히 성장하고 싶습니다🥰",
  },
  {
    name: "전**",
    rating: 5,
    date: "1개월 전",
    text: "현재까지 대부분 알고 있던 내용들이었으나 도움되거나 다시한번 리마인드하면서 배워가는게 너무 좋습니다.\n\n앞으로 어떤걸 어떻게 알려주실지 너무나 기대가 됩니다 ㅎㅎ",
  },
  {
    name: "마***",
    rating: 5,
    date: "1개월 전",
    text: "너무너무 좋고 유익한 정보들만 쏙쏙 뽑아서 먹여주는 숟가락 같은 역할을 대표님이 강의를 통해서 해 주시네요 넘너무 너무 좋아요 감사합니다",
  },
];

const TABS = ["클래스 소개", "리뷰", "커리큘럼", "강사 소개"];

export default function TeamBiblPage() {
  const [activeTab, setActiveTab] = useState("클래스 소개");
  const [openWeeks, setOpenWeeks] = useState<string[]>(["1주차"]);
  const [stickyNav, setStickyNav] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        setStickyNav(window.scrollY > navRef.current.offsetTop - 64);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const el = sectionRefs.current[tab];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleWeek = (week: string) => {
    setOpenWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-2">
        <Link href="/studio/class" className="text-xs text-gray-500 hover:text-gray-300 transition inline-flex items-center gap-1">
          ← 강의 목록
        </Link>
      </div>

      {/* 전체 2열 레이아웃 */}
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── 좌측 콘텐츠 열 ── */}
          <div className="lg:col-span-2">

            {/* 히어로 썸네일 */}
            <div className="rounded-2xl overflow-hidden mb-5 mt-4">
              <Image
                src="/studio/team-bibl/hero-thumbnail.png"
                alt="팀비블 유튜브 프로젝트"
                width={900}
                height={505}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* 제목 & 메타 */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  {"★★★★★"}
                  <span className="text-white font-bold ml-1">5.0</span>
                  <span className="text-gray-500 ml-1">({REVIEWS.length}개의 리뷰)</span>
                </div>
                <span className="w-px h-4 bg-gray-700" />
                <span className="text-xs text-gray-500">동영상 36개 · 총 8시간 38분</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-1">
                팀비블 : 10개월간 유튜브 강의와 실행을 책임지는 관리형 프로젝트
              </h1>
              <p className="text-gray-400 text-sm">비블 | 김태민 · 입문 이상</p>
            </div>

            {/* 스티키 탭 내비 */}
            <div ref={navRef} className={`border-b border-gray-800 bg-gray-950 -mx-4 px-4 ${stickyNav ? "sticky top-16 z-30" : ""}`}>
              <div className="flex gap-0 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => scrollToSection(tab)}
                    className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      activeTab === tab
                        ? "border-teal-400 text-teal-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 섹션들 */}
            <div className="space-y-12 pt-8">

            {/* 클래스 소개 */}
            <section ref={(el) => { sectionRefs.current["클래스 소개"] = el; }}>
              <h2 className="text-xl font-bold mb-6">클래스 소개</h2>
              <div className="space-y-0">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="w-full">
                    <Image
                      src={`/studio/team-bibl/${String(n).padStart(2, "0")}.png`}
                      alt={`팀비블 소개 ${String(n).padStart(2, "0")}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 리뷰 */}
            <section ref={(el) => { sectionRefs.current["리뷰"] = el; }}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold">리뷰</h2>
                <div className="flex items-center gap-1 text-amber-400">
                  {"★★★★★"}
                  <span className="text-white font-bold ml-1">5.0</span>
                </div>
                <span className="text-gray-500 text-sm">{REVIEWS.length}개의 리뷰</span>
              </div>
              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-700 flex items-center justify-center text-sm font-bold">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.date}</p>
                        </div>
                      </div>
                      <div className="text-amber-400 text-sm">{"★".repeat(r.rating)}</div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 커리큘럼 */}
            <section ref={(el) => { sectionRefs.current["커리큘럼"] = el; }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">커리큘럼</h2>
                <span className="text-xs text-gray-500">총 36강 · 8시간 38분</span>
              </div>
              <div className="space-y-2">
                {CURRICULUM.map((section) => (
                  <div key={section.week} className="rounded-xl border border-gray-800 overflow-hidden">
                    <button
                      onClick={() => toggleWeek(section.week)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gray-900 hover:bg-gray-800 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-600/20 border border-teal-600/40 flex items-center justify-center text-teal-400 text-xs font-bold">
                          {section.week.replace("주차", "")}
                        </span>
                        <span className="font-semibold">{section.week}</span>
                        <span className="text-xs text-gray-500">{section.lessons.length}강</span>
                      </div>
                      <span className={`text-gray-400 transition-transform duration-200 ${openWeeks.includes(section.week) ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    {openWeeks.includes(section.week) && (
                      <div className="divide-y divide-gray-800/60">
                        {section.lessons.map((lesson, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3 bg-gray-950/50">
                            <div className="flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-300">{lesson.title}</span>
                            </div>
                            <span className="text-xs text-gray-500 ml-4 flex-shrink-0">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 강사 소개 */}
            <section ref={(el) => { sectionRefs.current["강사 소개"] = el; }}>
              <h2 className="text-xl font-bold mb-6">강사 소개</h2>
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    <Image src="/studio/instructor.jpg" alt="비블 김태민" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">비블 bibl, 김태민</p>
                    <p className="text-sm text-teal-400">총 65만 구독자 유튜버 · TMK STUDIO 대표</p>
                  </div>
                </div>
                <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                  <div>
                    <p className="text-white font-semibold mb-2">온라인</p>
                    <ul className="space-y-1">
                      <li>· 총 65만 구독자 유튜버</li>
                      <li>· 세계유명 골프정보(24만), 영어키위새(22만), 스윔클래스(8만), 비블bibl(3.5만) 등 다수 채널 운영</li>
                      <li>· 인스타그램 2.7만 @seyugolf · 스레드 1.6만 @bibl_youtube</li>
                      <li>· 쇼핑몰 semogolf 대표</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-2">교육</p>
                    <ul className="space-y-1">
                      <li>· 단국대학교 사범대학 교육과 전공, 차석 졸업</li>
                      <li>· 유튜브 교육 & 컨설팅 TMKLab.com 대표</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-2">사업</p>
                    <ul className="space-y-1">
                      <li>· 개인/기업 유튜브 1:1 컨설팅</li>
                      <li>· 유튜브 채널 대행 TMK STUDIO 운영</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            </div>{/* space-y-12 끝 */}
          </div>{/* 좌측 col-span-2 끝 */}

          {/* ── 우측 sticky 카드 (데스크탑) ── */}
          <div className="hidden lg:block lg:col-span-1 self-start sticky top-24 pt-4">
            <PriceCard />
          </div>

        </div>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4">
        <a
          href="https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/BUXQC"
          className="block w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-center text-base transition"
        >
          수강신청 하기
        </a>
      </div>
      <div className="lg:hidden h-24" />
    </main>
  );
}

function PriceCard() {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="p-6">
        <p className="text-xs text-gray-500 mb-1">10개월 할부 시</p>
        <p className="text-3xl font-black text-white mb-1">월 390,000원</p>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-gray-500">권장 소비자 가격</span>
          <span className="text-sm text-gray-500 line-through">990,000원</span>
        </div>

        <a
          href="https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/BUXQC"
          className="block w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-center text-sm transition mb-3"
        >
          수강신청 하기
        </a>
        <a
          href="http://pf.kakao.com/_beBNn/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium text-center text-sm transition"
        >
          카카오톡 문의
        </a>

        <div className="mt-5 pt-5 border-t border-gray-800 space-y-2">
          {[
            { icon: "👥", label: "모집 정원", value: "50명 한정" },
            { icon: "📅", label: "수강 기한", value: "1000일" },
            { icon: "🎬", label: "동영상", value: "36개 (총 8시간 38분)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                <span>{item.icon}</span>{item.label}
              </span>
              <span className="text-gray-300 font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 남은 자리 배지 */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-red-400 font-medium">남은 자리 : 3명</span>
        </div>
      </div>
    </div>
  );
}
