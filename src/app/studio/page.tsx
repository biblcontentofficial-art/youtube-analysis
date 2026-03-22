import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, INSTRUCTOR } from "@/lib/courses";

export const metadata: Metadata = {
  title: "TMK STUDIO — 유튜브 채널 대행·강의·컨설팅",
  description:
    "총 70만 구독자 채널을 직접 운영한 비블이 여러분의 채널 성장을 함께 합니다. " +
    "1:1 컨설팅·강의·채널 대행 — 말이 아닌 실전으로 증명합니다.",
};

const REVIEWS = [
  { name: "체육&채널 운영 대표님", text: "썸네일·제목만 바꿨더니 영상 노출이 폭발했습니다. 올릴 때마다 조회 그래프가 눈에 띄게 올라갑니다." },
  { name: "사업자 대표님", text: "막막했던 홍보가 유튜브를 통해 체계화되며 월 매출이 2천만 원 이상 증가했습니다." },
  { name: "학원 원장님", text: "강의 적용 후 전년 동월 대비 매출이 200% 성장했습니다. 유튜브 덕분에 신규 원생이 줄을 서고 있습니다." },
  { name: "피부관리샵 대표님", text: "인스타그램 영상이 20만 회를 돌파하며 신규 고객이 늘었고, 결국 직원을 추가 채용했습니다." },
  { name: "돈가스 매장 대표님", text: "작년 대비 매출이 40% 상승했습니다. 이제는 홍보 걱정이 아니라 손님 응대 인력을 추가 고민하고 있습니다." },
  { name: "쇼핑몰 운영자", text: "스토리텔링 콘텐츠 전략을 적용하니 상품 문의가 3배 증가했습니다. 단순 조회수가 아니라 매출로 이어지는 게 놀랍습니다." },
];

const PROCESS_STEPS = [
  { num: "01", title: "브랜드 정체성 기획", desc: "채널 방향·타겟·포지셔닝 설계" },
  { num: "02", title: "콘텐츠 기획", desc: "키워드 리서치 & 아이디어 도출" },
  { num: "03", title: "대본 구성안 전달", desc: "도입부·본문·CTA 최적화 원고" },
  { num: "04", title: "촬영 및 편집", desc: "전문 편집팀 투입" },
  { num: "05", title: "업로드 & SEO", desc: "제목·썸네일·설명란 최적화" },
  { num: "06", title: "데이터 분석", desc: "월간 리포트 & 개선 피드백" },
  { num: "07", title: "비즈니스 성과 연계", desc: "수익화 & 매출 전환 전략" },
  { num: "08", title: "1:1 비블 컨설팅", desc: "직접 진행하는 맞춤 컨설팅" },
];

const CHANNELS = [
  { name: "세계유명 골프정보", subs: "24만", color: "text-teal-400" },
  { name: "영어키위새", subs: "22만", color: "text-blue-400" },
  { name: "스윔클래스", subs: "8만", color: "text-purple-400" },
  { name: "비블 bibl", subs: "3.5만", color: "text-amber-400" },
];

export default function StudioPage() {
  const publishedCourses = COURSES.filter((c) => c.published);

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/40 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="relative max-w-screen-xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/40 border border-teal-800/60 text-teal-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              TMK STUDIO — 실전으로 증명합니다
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
              70만 구독자를<br />
              직접 키운 유튜버 비블이<br />
              <span className="text-teal-400">채널 성장을 함께 합니다</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              수억 원의 매출을 만든 실전 경험을 그대로 나눕니다.<br />
              강의·1:1 컨설팅·채널 대행 — 데이터로 증명하는 성장 전략.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/studio/class"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm"
              >
                강의 보러가기
              </Link>
              <Link
                href="/studio/consulting"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition text-sm"
              >
                무료 상담 신청
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 채널 실적 ─────────────────────────────────────────── */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-screen-xl mx-auto px-4 py-10">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">직접 운영 중인 채널</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center">
                <div className={`text-2xl font-bold ${ch.color}`}>{ch.subs}</div>
                <div className="text-xs text-gray-400 mt-1">{ch.name}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8 text-center">
            {INSTRUCTOR.stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TMK 철학 ─────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            TMK STUDIO는 <span className="text-teal-400">다릅니다</span>
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl">
            강의하는 사람이 직접 채널을 운영하고, 성과를 투명하게 공개합니다. 이것이 끝까지 지켜온 원칙입니다.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "진실성", desc: "강의하는 사람이 직접 채널을 운영하고, 성과를 투명하게 공개합니다. 신뢰의 원칙." },
              { title: "실전성", desc: "수많은 시행착오 속에서 검증된 방법만 전합니다. 누구나 따라 할 수 있는 구조로 바꾸었습니다." },
              { title: "성장과 영향력", desc: "숫자에 머물지 않습니다. 브랜드를 성장시키고, 개인의 가치를 영향력으로 확장하는 길을 제시합니다." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                <div className="w-8 h-8 rounded-lg bg-teal-900/50 flex items-center justify-center mb-4">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 서비스 카드 ───────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">서비스 선택</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {publishedCourses.map((course) => (
              <Link
                key={course.slug}
                href={
                  course.category === "consulting"
                    ? "/studio/consulting"
                    : course.category === "agency"
                    ? "/studio/consulting"
                    : `/studio/class/${course.slug}`
                }
                className="group rounded-2xl bg-gray-900 border border-gray-800 hover:border-teal-700/60 transition overflow-hidden"
              >
                {/* 썸네일 placeholder */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                  <div className="text-4xl opacity-20">
                    {course.category === "consulting" ? "💬" : course.category === "agency" ? "🎬" : "📚"}
                  </div>
                  {course.badge && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                      {course.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-500 mb-1">
                    {course.category === "consulting" ? "1:1 컨설팅" : course.category === "agency" ? "채널 대행" : "온라인 강의"}
                  </div>
                  <h3 className="font-bold text-white group-hover:text-teal-400 transition mb-2 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{course.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <span>★</span>
                      <span>{course.rating}</span>
                      <span className="text-gray-600">({course.enrollCount}명)</span>
                    </div>
                    <span className="font-bold text-teal-400 text-sm">{course.priceLabel}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 대행 프로세스 ─────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">채널 대행 진행 과정</h2>
          <p className="text-gray-400 mb-10 text-sm">브랜딩부터 비즈니스 연계까지 8단계 전 과정을 책임집니다</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                <div className="text-teal-400 font-mono text-xs mb-2">{step.num}</div>
                <div className="font-semibold text-sm text-white mb-1">{step.title}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/studio/consulting"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition"
            >
              무료 상담 받기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 수강생 후기 ───────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">실제 변화한 수강생들</h2>
          <p className="text-gray-400 mb-10 text-sm">숫자가 아닌 매출로, 조회수가 아닌 비즈니스로 증명합니다</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r) => (
              <div key={r.name} className="rounded-xl bg-gray-900 border border-gray-800 p-5">
                <div className="flex gap-0.5 text-amber-400 text-xs mb-3">★★★★★</div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="text-xs text-gray-500 font-medium">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 강사 소개 ─────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">강사 소개</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              비블 (김태민)<br />
              <span className="text-teal-400">TMK STUDIO 대표</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8 whitespace-pre-line">
              {INSTRUCTOR.bio}
            </p>
            <a
              href={INSTRUCTOR.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-700/50 rounded-lg text-sm text-red-400 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.47 4.83 4.83 0 0 0-6.27 0 4.83 4.83 0 0 1-3.77 2.47A4.83 4.83 0 0 0 3 10.46v3.08a4.83 4.83 0 0 0 2.78 4.34 4.83 4.83 0 0 1 3.77 2.47 4.83 4.83 0 0 0 6.27 0 4.83 4.83 0 0 1 3.77-2.47A4.83 4.83 0 0 0 21 13.54v-3.08a4.83 4.83 0 0 0-1.41-3.77z"/>
              </svg>
              유튜브 채널 보러가기
            </a>
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ─────────────────────────────────────────── */}
      <section>
        <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            지금 시작할 준비가 됐나요?
          </h2>
          <p className="text-gray-400 mb-8">무료 상담으로 채널 현황을 진단받고, 맞는 서비스를 선택하세요.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/studio/consulting"
              className="px-8 py-3.5 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition"
            >
              무료 상담 신청
            </Link>
            <Link
              href="/studio/class"
              className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition"
            >
              강의 목록 보기
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
