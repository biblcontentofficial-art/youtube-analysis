import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "TMK STUDIO — 유튜브 채널 대행·강의·컨설팅",
  description:
    "총 70만 구독자 채널을 직접 운영한 비블이 여러분의 채널 성장을 함께 합니다. " +
    "1:1 컨설팅·강의·채널 대행 — 말이 아닌 실전으로 증명합니다.",
};

// ─── 실제 운영 채널 데이터 (YouTube에서 수집) ──────────────────────────
const CHANNELS = [
  {
    name: "세계유명 골프정보",
    handle: "@세계유명골프정보",
    subs: "24.8만명",
    subsNum: "24.8만",
    category: "골프",
    avatar: "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/fNxhkFCNtSBP1dtg0i3W5oZKlohCyLhkNY8vUA1X8qC28L7q_t0QR9j_Ui-qaIq7f5hyiNAcWg=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@세계유명골프정보",
    color: "from-green-900/80",
  },
  {
    name: "영어 키위새",
    handle: "@eng_kiwi",
    subs: "23.5만명",
    subsNum: "23.5만",
    category: "영어 교육",
    avatar: "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/-GU5UUOmKhc_zSCX2RCxc2FRG1ESh1EgLcS9A8AVUT5O9_RfRC4zFNH0pTyQXhisD4jrM6Xxww=w1280-fcrop64=1,00005a5afffffea",
    url: "https://www.youtube.com/@eng_kiwi",
    color: "from-blue-900/80",
  },
  {
    name: "스윔클래스",
    handle: "@swim_class",
    subs: "8.26만명",
    subsNum: "8.26만",
    category: "수영",
    avatar: "https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/fzwxJIRRnLH4cIGna2T7zi0tnEj9Mn6jayGPF9j0D-aPWLTTqEfXMGMwSnpzgYtvxwqXdIdFeg=w1280-fcrop64=1,00005a5afffffea",
    url: "https://www.youtube.com/@swim_class",
    color: "from-cyan-900/80",
  },
  {
    name: "비블 bibl",
    handle: "@bibl_youtube",
    subs: "3.52만명",
    subsNum: "3.52만",
    category: "사업·마케팅",
    avatar: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/XDssFLodQnpmebO2quHSdHYPUroghTjlqATrtTahvyMNfVWUxTP4lr55XEKqLiUh-z2y2wJFaRQ=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@bibl_youtube",
    color: "from-teal-900/80",
  },
];

const REVIEWS = [
  { name: "체육&채널 운영 대표님", text: "썸네일·제목만 바꿨더니 영상 노출이 폭발했습니다. 올릴 때마다 조회 그래프가 눈에 띄게 올라갑니다." },
  { name: "사업자 대표님", text: "막막했던 홍보가 유튜브를 통해 체계화되며 월 매출이 2천만 원 이상 증가했습니다." },
  { name: "학원 원장님", text: "강의 적용 후 전년 동월 대비 매출이 200% 성장했습니다. 유튜브 덕분에 신규 원생이 줄을 서고 있습니다." },
  { name: "피부관리샵 대표님", text: "인스타그램 영상이 20만 회를 돌파하며 신규 고객이 늘었고, 결국 직원을 추가 채용했습니다." },
  { name: "돈가스 매장 대표님", text: "작년 대비 매출이 40% 상승했습니다. 이제는 홍보 걱정이 아니라 손님 응대 인력을 추가 고민하고 있습니다." },
  { name: "쇼핑몰 운영자", text: "스토리텔링 콘텐츠 전략을 적용하니 상품 문의가 3배 증가했습니다. 단순 조회수가 아니라 매출로 이어지는 게 놀랍습니다." },
];

// 채널 대행 8단계 — 채널 배너를 증거 이미지로 활용한 4개 블록
const PROCESS_BLOCKS = [
  {
    steps: ["01 브랜드 정체성 기획", "02 콘텐츠 기획"],
    title: "채널 방향과 콘텐츠 전략 수립",
    desc: "채널의 핵심 가치와 타겟 시청자를 정의하고, 키워드 리서치로 알고리즘에 최적화된 콘텐츠 아이디어를 도출합니다.",
    channel: CHANNELS[0], // 골프 채널
    imgLeft: false,
  },
  {
    steps: ["03 대본 구성안 전달", "04 촬영 및 편집"],
    title: "전문 제작팀이 직접 만드는 콘텐츠",
    desc: "도입부 3초 훅부터 CTA까지 최적화된 원고를 작성하고, 전문 편집팀이 시청 지속률 높은 영상을 제작합니다.",
    channel: CHANNELS[1], // 영어 채널
    imgLeft: true,
  },
  {
    steps: ["05 업로드 & SEO 최적화", "06 데이터 분석"],
    title: "알고리즘 최적화 & 월간 성과 리포트",
    desc: "제목·썸네일·설명란을 SEO에 맞게 최적화하고, 매달 채널 데이터를 분석해 개선 포인트를 피드백합니다.",
    channel: CHANNELS[2], // 스윔클래스
    imgLeft: false,
  },
  {
    steps: ["07 비즈니스 성과 연계", "08 1:1 비블 컨설팅"],
    title: "조회수를 매출로 연결하는 전략",
    desc: "수익화와 비즈니스 전환 전략을 설계하고, 비블이 직접 진행하는 1:1 맞춤 컨설팅으로 성과를 끌어냅니다.",
    channel: CHANNELS[3], // 비블
    imgLeft: true,
  },
];

export default function StudioPage() {
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
              채널 대행·1:1 컨설팅·강의 — 데이터로 증명하는 성장 전략.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/studio/consulting" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm">
                무료 상담 신청
              </Link>
              <Link href="/studio/class" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition text-sm">
                강의 보러가기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 직접 운영 채널 실적 ──────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">직접 운영 중인 채널</p>
          <h2 className="text-xl md:text-2xl font-bold mb-8">
            총 <span className="text-teal-400">70만+ 구독자</span>를 직접 키웠습니다
          </h2>

          {/* YouTube 스타일 채널 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHANNELS.map((ch) => (
              <a
                key={ch.handle}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-teal-700/50 transition"
              >
                {/* 배너 이미지 */}
                <div className="relative h-20 overflow-hidden">
                  <Image
                    src={ch.banner}
                    alt={`${ch.name} 채널 배너`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${ch.color} to-transparent`} />
                </div>

                {/* 아바타 + 정보 */}
                <div className="px-4 pb-4">
                  {/* 아바타 — 배너에 겹치게 */}
                  <div className="relative -mt-6 mb-3 flex items-end gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-900 shrink-0">
                      <Image
                        src={ch.avatar}
                        alt={ch.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-white group-hover:text-teal-400 transition leading-tight">
                      {ch.name}
                    </div>
                    <div className="text-xs text-gray-500">{ch.handle}</div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-lg font-bold text-teal-400">{ch.subsNum}</span>
                        <span className="text-xs text-gray-500 ml-1">구독자</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{ch.category}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* 합계 통계 */}
          <div className="grid grid-cols-3 gap-6 mt-10 text-center border-t border-gray-800 pt-8">
            {[
              { val: "70만+", label: "총 구독자" },
              { val: "1억+", label: "누적 조회수" },
              { val: "4개", label: "운영 채널" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">{s.val}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TMK 철학 ─────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            TMK STUDIO는 <span className="text-teal-400">다릅니다</span>
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl text-sm">
            강의하는 사람이 직접 채널을 운영하고, 성과를 투명하게 공개합니다.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "진실성", desc: "강의하는 사람이 직접 채널을 운영하고, 성과를 투명하게 공개합니다. 신뢰의 원칙." },
              { title: "실전성", desc: "수많은 시행착오 속에서 검증된 방법만 전합니다. 누구나 따라 할 수 있는 구조로 바꾸었습니다." },
              { title: "성장과 영향력", desc: "숫자에 머물지 않습니다. 브랜드를 성장시키고, 개인의 가치를 영향력으로 확장하는 길을 제시합니다." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                <div className="w-2 h-2 rounded-full bg-teal-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 서비스 선택: 채널 대행만 ─────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">서비스 선택</h2>
          <p className="text-gray-400 mb-10 text-sm">채널 전체를 맡기고 싶다면 — TMK STUDIO가 처음부터 끝까지 책임집니다</p>

          {/* 채널 대행 — 풀 피처드 카드 */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* 좌측: 채널 배너 콜라주 */}
              <div className="relative min-h-64 md:min-h-80 overflow-hidden bg-gray-800">
                {/* 4개 채널 배너 2×2 그리드 */}
                <div className="grid grid-cols-2 h-full">
                  {CHANNELS.map((ch) => (
                    <div key={ch.handle} className="relative overflow-hidden">
                      <Image
                        src={ch.banner}
                        alt={ch.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      {/* 채널명 오버레이 */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <Image src={ch.avatar} alt={ch.name} width={20} height={20} className="rounded-full object-cover" unoptimized />
                        <span className="text-[10px] text-white font-medium drop-shadow">{ch.subsNum}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl text-center">
                    <div className="text-teal-400 font-bold text-lg">70만+ 구독자</div>
                    <div className="text-gray-300 text-xs">직접 키운 채널들</div>
                  </div>
                </div>
              </div>

              {/* 우측: 서비스 설명 */}
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white mb-4">
                    맞춤형 풀매니지먼트
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight">
                    유튜브 채널 대행
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    브랜드 기획부터 촬영·편집·업로드·데이터 분석·비즈니스 연계까지
                    8단계 전 과정을 TMK STUDIO가 직접 운영합니다.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      "브랜드 정체성 기획부터 시작",
                      "전문 편집팀 촬영·편집",
                      "월간 데이터 리포트 제공",
                      "비즈니스 성과 연계 컨설팅",
                      "1:1 비블 직접 컨설팅 포함",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-teal-400 shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/studio/consulting"
                    className="flex-1 py-3 text-center bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm"
                  >
                    무료 상담 신청
                  </Link>
                  <div className="text-right shrink-0">
                    <div className="text-teal-400 font-bold">가격문의</div>
                    <div className="text-xs text-gray-500">상담 후 안내</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 다른 서비스 링크 */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/studio/class/1on1-consulting" className="flex-1 min-w-48 py-3 text-center rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-sm text-gray-400 hover:text-white transition">
              1:1 유튜브 컨설팅 →
            </Link>
            <Link href="/studio/class/youtube-business-blackmap" className="flex-1 min-w-48 py-3 text-center rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-sm text-gray-400 hover:text-white transition">
              유튜브 비즈니스 블랙맵 강의 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 채널 대행 진행 과정: 사진+글 교대 레이아웃 ──────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">채널 대행 진행 과정</h2>
          <p className="text-gray-400 mb-12 text-sm">브랜딩부터 비즈니스 연계까지 8단계 전 과정을 책임집니다</p>

          <div className="space-y-16">
            {PROCESS_BLOCKS.map((block, i) => (
              <div
                key={i}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${block.imgLeft ? "" : "md:[&>*:first-child]:order-2"}`}
              >
                {/* 텍스트 영역 */}
                <div className={block.imgLeft ? "order-2 md:order-2" : "order-2 md:order-1"}>
                  <div className="flex gap-2 mb-4">
                    {block.steps.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-teal-900/40 border border-teal-800/60 text-teal-400 text-[10px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{block.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{block.desc}</p>
                </div>

                {/* 채널 증거 이미지 카드 */}
                <a
                  href={block.channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-2xl overflow-hidden border border-gray-800 hover:border-teal-700/50 transition ${block.imgLeft ? "order-1 md:order-1" : "order-1 md:order-2"}`}
                >
                  {/* 배너 */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={block.channel.banner}
                      alt={block.channel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${block.channel.color} to-transparent`} />
                  </div>
                  {/* 채널 정보 */}
                  <div className="bg-gray-900 px-4 pb-4">
                    <div className="flex items-center gap-3 -mt-5 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-900 shrink-0">
                        <Image src={block.channel.avatar} alt={block.channel.name} width={40} height={40} className="object-cover" unoptimized />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{block.channel.name}</div>
                        <div className="text-xs text-gray-500">{block.channel.handle}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-teal-400 font-bold text-base">{block.channel.subsNum}</div>
                        <div className="text-xs text-gray-500">구독자</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">TMK STUDIO 운영 채널</div>
                  </div>
                </a>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
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
        <div className="max-w-screen-xl mx-auto px-4 py-14">
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
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* 텍스트 */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">강사 소개</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                비블 (김태민)
              </h2>
              <h3 className="text-xl text-teal-400 font-bold mb-6">TMK STUDIO 대표</h3>
              <p className="text-gray-400 leading-relaxed mb-8 text-sm">
                총 70만 구독자 채널 운영자 · TMK STUDIO 대표<br />
                세계유명 골프정보(24.8만), 영어키위새(23.5만), 스윔클래스(8.26만), 비블(3.52만) 등
                다양한 분야 채널을 직접 운영하며 수억 원의 매출을 만든 실전 전문가
              </p>
              <a
                href="https://www.youtube.com/@bibl_youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-700/50 rounded-lg text-sm text-red-400 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                유튜브 채널 보러가기
              </a>
            </div>

            {/* 비블 채널 카드 */}
            <a
              href="https://www.youtube.com/@bibl_youtube"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden border border-gray-800 hover:border-teal-700/50 transition"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={CHANNELS[3].banner}
                  alt="비블 bibl 채널 배너"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/70 to-transparent" />
              </div>
              <div className="bg-gray-900 px-5 pb-5">
                <div className="flex items-center gap-3 -mt-6 mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-900 shrink-0">
                    <Image src={CHANNELS[3].avatar} alt="비블" width={56} height={56} className="object-cover" unoptimized />
                  </div>
                  <div>
                    <div className="font-bold text-white">비블 bibl</div>
                    <div className="text-xs text-gray-500">@bibl_youtube</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-teal-400 font-bold text-lg">3.52만</div>
                    <div className="text-xs text-gray-500">구독자</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">사업하는 사람들의 이야기를 전합니다 · 동영상 158개</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ─────────────────────────────────────────── */}
      <section>
        <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">지금 시작할 준비가 됐나요?</h2>
          <p className="text-gray-400 mb-8 text-sm">무료 상담으로 채널 현황을 진단받고, 맞는 서비스를 선택하세요.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/studio/consulting" className="px-8 py-3.5 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition">
              무료 상담 신청
            </Link>
            <Link href="/studio/class" className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold transition">
              강의 목록 보기
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
