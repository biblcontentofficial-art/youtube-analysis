import type { Metadata } from "next";
import Image from "next/image";
import AnimationObserver from "@/app/_components/AnimationObserver";
import StudioGuard from "./_components/StudioGuard";
import StatsCounter from "./_components/StatsCounter";
import VideoMarquee from "./_components/VideoMarquee";
import rawContent from "./studio-content.json";

export const dynamic = "force-static";

// dev 환경에서만 DevEditor 로드
let DevEditor: React.ComponentType | null = null;
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DevEditor = require("./_components/DevEditor").default;
}

const C = rawContent;

export const metadata: Metadata = {
  title: "유튜브 채널 대행 — 비블 TMK STUDIO",
  description:
    "총 65만 구독자 채널을 운영한 비블이 여러분의 채널을 직접 운영합니다. " +
    "기획·촬영·편집·업로드·분석까지 전 과정 올인원 채널 대행.",
  openGraph: {
    title: "유튜브 채널 대행 — 비블 TMK STUDIO",
    description:
      "총 65만 구독자 채널을 운영한 비블이 여러분의 채널을 직접 운영합니다. 기획·촬영·편집·업로드·분석까지 전 과정 올인원 채널 대행.",
    url: "https://bibllab.com/studio",
    images: [
      {
        url: "https://bibllab.com/studio/silver-play-button.jpg",
        width: 1200,
        height: 630,
        alt: "비블 TMK STUDIO 유튜브 채널 대행",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

const CHANNELS = [
  {
    name: "세계유명 골프정보",
    handle: "@세계유명골프정보",
    subsNum: "24.8만",
    category: "골프",
    result: "구독자 0→24만",
    avatar: "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/fNxhkFCNtSBP1dtg0i3W5oZKlohCyLhkNY8vUA1X8qC28L7q_t0QR9j_Ui-qaIq7f5hyiNAcWg=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@세계유명골프정보",
    color: "from-green-900/80",
  },
  {
    name: "영어 키위새",
    handle: "@eng_kiwi",
    subsNum: "23.5만",
    category: "영어 교육",
    result: "구독자 0→23만",
    avatar: "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/-GU5UUOmKhc_zSCX2RCxc2FRG1ESh1EgLcS9A8AVUT5O9_RfRC4zFNH0pTyQXhisD4jrM6Xxww=w1280-fcrop64=1,00005a5afffffea",
    url: "https://www.youtube.com/@eng_kiwi",
    color: "from-blue-900/80",
  },
  {
    name: "스윔클래스",
    handle: "@swim_class",
    subsNum: "8.26만",
    category: "수영",
    result: "월 조회수 300만+",
    avatar: "https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/fzwxJIRRnLH4cIGna2T7zi0tnEj9Mn6jayGPF9j0D-aPWLTTqEfXMGMwSnpzgYtvxwqXdIdFeg=w1280-fcrop64=1,00005a5afffffea",
    url: "https://www.youtube.com/@swim_class",
    color: "from-cyan-900/80",
  },
  {
    name: "비블 bibl",
    handle: "@bibl_youtube",
    subsNum: "3.52만",
    category: "사업·마케팅",
    result: "매출 연결 콘텐츠",
    avatar: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/XDssFLodQnpmebO2quHSdHYPUroghTjlqATrtTahvyMNfVWUxTP4lr55XEKqLiUh-z2y2wJFaRQ=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@bibl_youtube",
    color: "from-teal-900/80",
  },
  {
    name: "배고팡",
    handle: "@baegopang1",
    subsNum: "3.31만",
    category: "음식·다이어트",
    result: "매출 40% 상승",
    avatar: "https://yt3.googleusercontent.com/7lP38Oezdx8woNwzQcagjmiwMIjpacpOT3mXFetkFsKLetnyi9ymHenTMPUDMwIdjWaLkHYmIg=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/oIYW7usbQ4Wp4MdOEmAYHPzFB28-l0chRQwLQ6MvI8cv3IkPbRdyApkwW4CFNrRLu43YO05rVW8=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@baegopang1",
    color: "from-orange-900/80",
  },
  {
    name: "세계유명 골프레슨",
    handle: "@세계유명골프레슨",
    subsNum: "1.16만",
    category: "골프 레슨",
    result: "6개월 내 수익화",
    avatar: "https://yt3.googleusercontent.com/JsHOMhsNg6GVEfeLgArKP5wappnficEWruFlxK8TRRf2_xpqBF3OQsbvkXu32srWaui02zppR_o=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/_MlBIxHi8Cvt7lTZg6F0svNJOVAz_Le2jthY8T6SS7ijj-auSC33JEKoYmy1CSpuq5Q8HPr-L7E=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@세계유명골프레슨",
    color: "from-lime-900/80",
  },
  {
    name: "Drawing MiMiSulSul",
    handle: "@MIMISULSUL",
    subsNum: "0.85만",
    category: "드로잉",
    result: "해외 구독자 유입",
    avatar: "https://yt3.googleusercontent.com/_jdM4wQ5HYAvKioeArkYrDYILEcC6Z72HAB9CW8zt-7UPSdJ8nk4s0keAKoQrwMr3Ln4k2_AgHQ=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/wn5G-HpcnYp6FyUiq9IUKQgCUMSXMRJvMN-3Q4VpdXT5w37GBmQ3JwRBVKe7fVy7G0XO9z1ctpE=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/channel/UC6dIuL-vSW_egzY4UiPzKtg",
    color: "from-pink-900/80",
  },
];

const FEATURES = [
  {
    num: "01",
    title: "전략적인 콘텐츠 & 대본 기획",
    desc: "타겟 시청자의 행동 패턴을 분석한 콘텐츠 전략을 수립합니다.\n경쟁 채널을 분석해 방향을 잡고, 높은 시청 지속을 만드는 대본까지 함께 기획합니다.",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=85",
    imgAlt: "콘텐츠 전략 기획",
    imgRight: true,
  },
  {
    num: "02",
    title: "전문 장비 촬영 대행",
    desc: "장소 섭외부터 카메라·조명·음향까지 전문 장비로 직접 촬영합니다.\n출연자 디렉팅, 멘트 가이드까지 제공해 누구나 자연스럽게 카메라 앞에 설 수 있도록 돕습니다.",
    img: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&q=85",
    imgAlt: "전문 촬영 대행",
    imgRight: false,
  },
  {
    num: "03",
    title: "유튜브 최적화 고퀄리티 편집",
    desc: "유튜브 알고리즘에 최적화된 편집을 진행합니다.\n도입부 3초 훅부터 CTA까지 시청 지속률을 극대화하는 편집으로 일반 대비 2~3배 높은 조회수를 달성합니다.",
    img: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=85",
    imgAlt: "고퀄리티 영상 편집",
    imgRight: true,
  },
  {
    num: "04",
    title: "데이터 분석 & 채널 성장 관리",
    desc: "매달 채널 데이터를 분석해 개선 포인트를 피드백합니다.\n제목·썸네일·SEO를 지속 최적화하고, 조회수를 실제 비즈니스 매출로 연결하는 전략을 함께 설계합니다.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=85",
    imgAlt: "데이터 분석 대시보드",
    imgRight: false,
  },
];

const REVIEWS = [
  { name: "체육 채널 운영 대표님", result: "영상 노출 3배 증가", text: "썸네일·제목만 바꿨더니 영상 노출이 폭발했습니다. 올릴 때마다 조회 그래프가 눈에 띄게 올라갑니다." },
  { name: "사업자 대표님", result: "월 매출 +2,000만원", text: "막막했던 홍보가 유튜브를 통해 체계화되며 월 매출이 2천만 원 이상 증가했습니다." },
  { name: "학원 원장님", result: "전년 대비 매출 200%", text: "적용 후 전년 동월 대비 매출이 200% 성장했습니다. 신규 원생이 줄을 서고 있습니다." },
  { name: "피부관리샵 대표님", result: "영상 20만 뷰 달성", text: "인스타그램 영상이 20만 회를 돌파하며 신규 고객이 늘었고, 결국 직원을 추가 채용했습니다." },
  { name: "돈가스 매장 대표님", result: "매출 40% 상승", text: "작년 대비 매출이 40% 상승했습니다. 이제는 홍보 걱정이 아니라 손님 응대 인력을 추가 고민하고 있습니다." },
  { name: "쇼핑몰 운영자", result: "문의 3배 증가", text: "스토리텔링 콘텐츠 전략을 적용하니 상품 문의가 3배 증가했습니다. 단순 조회수가 아니라 매출로 이어지는 게 놀랍습니다." },
];

const FAQS = [
  { q: "대행 비용은 얼마인가요?", a: "채널 현황과 원하시는 서비스 범위에 따라 달라집니다. 먼저 무료 진단을 받으신 후 맞춤 제안을 드립니다. 카카오톡으로 채널 URL만 보내주시면 됩니다." },
  { q: "최소 계약 기간이 있나요?", a: "최소 3개월 계약을 권장합니다. 채널 데이터가 축적되어야 알고리즘이 채널을 학습하고 성장 궤도에 오르기 때문입니다. 3개월 안에 가시적인 변화를 반드시 확인하실 수 있습니다." },
  { q: "구독자 0명 채널도 가능한가요?", a: "네, 구독자 0명부터 시작해도 됩니다. 오히려 처음부터 올바른 전략으로 시작하는 것이 훨씬 효율적입니다. 채널이 없다면 처음부터 함께 설계합니다." },
  { q: "어떤 분야든 가능한가요?", a: "골프, 영어교육, 피트니스, 음식, 뷰티, 사업·마케팅, 드로잉 등 다양한 분야의 채널을 운영한 경험이 있습니다. 분야보다는 '타깃 시청자가 명확한지'가 더 중요합니다." },
  { q: "결과를 보장해주나요?", a: "특정 구독자 수를 보장하는 건 어렵습니다. 하지만 저희가 운영한 모든 채널은 3개월 내 가시적인 성장을 달성했습니다. 실제 운영 데이터를 상담 시 공유해드립니다." },
  { q: "촬영도 대행해주나요?", a: "네, 기획·촬영·편집·업로드·분석까지 전 과정을 대행합니다. 장소 섭외, 카메라·조명·음향 장비, 출연자 디렉팅까지 모두 포함됩니다. 여러분은 시간만 내주시면 됩니다." },
];

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <StudioGuard />
      <AnimationObserver />
      {DevEditor && <DevEditor />}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO — 고통 공감 + 명확한 약속                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-gray-800 overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-screen-xl mx-auto px-4 py-24 md:py-36">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p data-animate="up" className="text-sm md:text-base text-gray-400 font-medium mb-4">
                {C.hero.badge}
              </p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
                <span data-animate="up" data-delay="60" className="block mb-1">
                  {C.hero.subtitle}
                </span>
                <span data-animate="up" data-delay="160" className="block">
                  {C.hero.titleLine1 && <>{C.hero.titleLine1}{" "}</>}
                  <span className="text-teal-400 highlight-draw">{C.hero.titleHighlight}</span>
                </span>
              </h1>

              <p data-animate="up" data-delay="260" className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed whitespace-pre-line">
                {C.hero.desc}
              </p>

              <div data-animate="up" data-delay="360" className="flex flex-wrap gap-4">
                <a
                  href="/studio/consulting"
                  className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-base shadow-lg shadow-teal-900/40"
                >
                  {C.hero.ctaPrimary}
                </a>
                <a
                  href="#process"
                  className="px-8 py-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition text-base"
                >
                  {C.hero.ctaSecondary}
                </a>
              </div>

              <p data-animate="fade" data-delay="500" className="text-xs text-gray-600 mt-4">
                채널 URL만 보내주시면 됩니다 · 완전 무료
              </p>
            </div>

            {/* 실버 플레이 버튼 — 꽉 채운 이미지 */}
            <div data-animate="right" className="flex flex-col gap-4">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 aspect-[4/3]">
                <Image
                  src={C.hero.heroImage}
                  alt="히어로 이미지"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                {C.hero.heroImageCaption}
              </p>
            </div>
          </div>

          {/* 숫자 통계 */}
          <StatsCounter />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 문제 공감 — 혼자 하면 왜 실패하는가                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800 bg-gray-900/20">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-3">왜 혼자는 어려운가</p>
            <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold">
              유튜브 채널 운영,<br />
              <span className="text-teal-400">혼자 하면 이 3가지에서 막힙니다</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "",
                badge: "문제 01",
                title: "기획이 막막하다",
                desc: "무슨 주제로 찍어야 할지, 어떤 제목이 뜨는지 전혀 감이 안 옵니다. 경쟁자는 많고 내 영상만 아무도 안 봅니다.",
              },
              {
                icon: "",
                badge: "문제 02",
                title: "시간이 없다",
                desc: "기획, 촬영, 편집까지 영상 하나 제작하는데 20시간 가까이 걸립니다. 본업까지 병행하면 결국 유튜브 업로드를 미루게 되죠. 업로드 주기가 늦어지는 채널은 점점 조회수가 줄어들 수 밖에 없습니다.",
              },
              {
                icon: "",
                badge: "문제 03",
                title: "뭐가 문제인지 모른다",
                desc: "업로드 하더라도 조회수가 안나옵니다. 썸네일, 제목, 내용, 브랜딩 어떤것이 원인인지 알기 어렵기에 개선이 불가능합니다. 결국 포기하게 되죠.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-animate="up"
                data-delay={String(i * 100)}
                className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-xl text-white">{item.title}</h3>
                  <span className="ml-3 shrink-0 text-xs font-bold text-teal-400 bg-teal-950/50 border border-teal-800/50 px-2.5 py-1 rounded-md whitespace-nowrap">
                    {item.badge}
                  </span>
                </div>
                <p className="text-base text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div data-animate="up" data-delay="300" className="mt-10 text-center">
            <p className="text-gray-500 text-base mb-4">이 3가지 문제, 비블이 전부 해결합니다.</p>
            <a
              href="/studio/consulting"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-sm"
            >
              무료로 해결 방법 상담받기 →
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 포트폴리오                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-3">실제 운영 채널</p>
          <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold mb-3">
            말이 아닌, 결과로 증명합니다
          </h2>
          <p data-animate="up" data-delay="160" className="text-gray-400 mb-12 text-base md:text-lg">
            총 <span className="text-teal-400 font-semibold">65만+ 구독자</span> 채널을 운영 및 공동 기획하고 있습니다.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CHANNELS.map((ch, i) => (
              <a
                key={ch.handle}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                data-animate="up"
                data-delay={String(i * 60)}
                className="channel-card group rounded-2xl bg-gray-900 border border-gray-800"
              >
                <div className="relative h-20 overflow-hidden rounded-t-2xl">
                  <Image src={ch.banner} alt={`${ch.name} 채널 배너`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className={`absolute inset-0 bg-gradient-to-t ${ch.color} to-transparent`} />
                  {/* 결과 배지 */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-teal-800/50">
                    {ch.result}
                  </div>
                </div>
                <div className="px-4 pt-0 pb-4">
                  <div className="relative -mt-5 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-900">
                      <Image src={ch.avatar} alt={ch.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-white group-hover:text-teal-400 transition leading-tight">{ch.name}</div>
                    <div className="text-[10px] text-gray-500">{ch.handle}</div>
                    <div className="flex items-center justify-between pt-1.5">
                      <div>
                        <span className="text-base font-bold text-teal-400">{ch.subsNum}</span>
                        <span className="text-[10px] text-gray-500 ml-1">구독자</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">{ch.category}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 영상 썸네일 마퀴 — 실제 운영 영상들                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800 bg-gray-950 py-16 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 mb-10">
          <p data-animate="up" className="text-xs text-teal-500 uppercase tracking-widest mb-3 font-semibold">{C.marquee.label}</p>
          <h2 data-animate="up" data-delay="80" className="text-2xl md:text-4xl font-black leading-snug">
            {C.marquee.titleLine1}<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg,#14b8a6,#06b6d4)" }}>
              {C.marquee.titleHighlight}
            </span>{C.marquee.titleLine2}
          </h2>
          <p data-animate="up" data-delay="160" className="text-gray-400 text-sm md:text-base mt-5 max-w-2xl leading-relaxed space-y-2">
            {C.marquee.desc1}<br className="hidden md:block" />
            <br />
            {C.marquee.desc2}
          </p>
          <p data-animate="up" data-delay="220" className="text-xs text-gray-600 mt-3">
            마우스를 올리면 멈춥니다 · 클릭하면 유튜브로 이동합니다
          </p>
        </div>
        <VideoMarquee />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 진행 프로세스 — 불안 해소                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="process" className="border-b border-gray-800 bg-gray-900/20">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-3 text-center">진행 과정</p>
          <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold mb-4 text-center">
            상담부터 운영까지<br />딱 3단계입니다
          </h2>
          <p data-animate="up" data-delay="160" className="text-gray-400 text-center mb-16 text-base">복잡한 절차 없이 빠르게 시작합니다</p>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* 연결선 (데스크탑) */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-teal-800 to-teal-800" />

            {[
              {
                step: "01",
                icon: "",
                title: "무료 채널 진단",
                desc: "카카오톡으로 채널 URL을 보내주시면 현황을 분석하고 성장 가능성과 방향을 무료로 진단해드립니다.",
                duration: "1~2일",
              },
              {
                step: "02",
                icon: "",
                title: "맞춤 전략 수립",
                desc: "채널 특성, 타깃 시청자, 경쟁 채널을 분석해 3개월 콘텐츠 로드맵을 수립합니다. 계약 전 전략안을 먼저 확인하실 수 있습니다.",
                duration: "3~5일",
              },
              {
                step: "03",
                icon: "",
                title: "기획→촬영→편집→업로드 전 과정",
                desc: "기획·대본·촬영·편집·업로드·댓글관리·월간 데이터 리포트까지 전부 진행합니다. 여러분은 일정에 맞춰 자리만 잡아주시면 됩니다.",
                duration: "계약 후 즉시",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                data-animate="up"
                data-delay={String(i * 120)}
                className="relative flex flex-col items-center text-center"
              >
                {/* 숫자 원형 배지 */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-teal-500/40 bg-gradient-to-br from-teal-950 to-gray-900 flex items-center justify-center shadow-xl shadow-teal-950/60">
                    <span
                      className="text-3xl font-black tracking-tighter text-transparent bg-clip-text"
                      style={{ backgroundImage: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}
                    >
                      {s.step}
                    </span>
                  </div>
                  {/* 외부 링 애니메이션 */}
                  <div className="absolute inset-0 rounded-full border border-teal-500/20 scale-125" />
                </div>
                <div className="text-xs text-teal-500 font-bold tracking-widest mb-2">STEP {s.step}</div>
                <h3 className="font-bold text-xl mb-3 text-white">{s.title}</h3>
                <p className="text-base text-gray-400 leading-relaxed mb-5 max-w-xs">{s.desc}</p>
                <span className="text-xs border border-teal-800/50 text-teal-400/70 bg-teal-950/30 rounded-full px-4 py-1.5 font-medium">{s.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 4가지 차별점                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="features">
        {C.features.map((feat: typeof C.features[0] & { imgRight?: boolean }, i) => {
          feat = { ...feat, imgRight: i % 2 === 0 };
          return (
          <div key={feat.num} className={`border-b border-gray-800 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30"}`}>
            <div className="max-w-screen-xl mx-auto px-4 py-0">
              <div className={`grid md:grid-cols-2 min-h-[460px] md:min-h-[520px] ${feat.imgRight ? "" : "md:[direction:rtl]"}`}>
                <div className={`flex flex-col justify-center py-16 md:py-20 px-0 md:px-12 ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <span data-animate={feat.imgRight ? "left" : "right"} className="text-5xl md:text-7xl font-black text-gray-800 leading-none mb-5 select-none">
                    {feat.num}
                  </span>
                  <h2 data-animate={feat.imgRight ? "left" : "right"} data-delay="100" className="text-2xl md:text-3xl font-bold mb-5 leading-tight">
                    {feat.title}
                  </h2>
                  <p data-animate={feat.imgRight ? "left" : "right"} data-delay="200" className="text-gray-400 text-base leading-relaxed whitespace-pre-line">
                    {feat.desc}
                  </p>
                </div>
                <div data-animate={feat.imgRight ? "right" : "left"} className={`relative min-h-64 md:min-h-0 overflow-hidden ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <Image src={feat.img} alt={feat.imgAlt} fill className="object-cover feat-img" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 고객 후기 — 구체적 수치                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-3">고객 후기</p>
          <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold mb-12">
            숫자가 거짓말하지 않습니다
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {C.reviews.map((r, i) => (
              <div
                key={r.name}
                data-animate="up"
                data-delay={String(i * 80)}
                className="review-card rounded-2xl bg-gray-900 border border-gray-800 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5 text-teal-400 text-sm">★★★★★</div>
                  <span className="text-xs font-bold text-teal-400 bg-teal-950/50 border border-teal-800/50 px-2.5 py-1 rounded-full">
                    {r.result}
                  </span>
                </div>
                <p className="text-base text-gray-300 leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>
                <div className="text-sm text-gray-500 font-medium border-t border-gray-800 pt-4">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 운영자 소개 — 권위 확립                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800 bg-gray-900/20">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-4">운영자 소개</p>
              <h2 data-animate="up" data-delay="80" className="text-4xl md:text-5xl font-bold mb-2">비블 (김태민)</h2>
              <p data-animate="up" data-delay="160" className="text-teal-400 font-semibold text-lg mb-8">TMK STUDIO 대표</p>

              <div data-animate="up" data-delay="220" className="space-y-6 mb-8">
                {/* 온라인 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-2.5">온라인</p>
                  <div className="space-y-2">
                    {[
                      "유튜브 총 65만+ 채널 운영 및 공동기획",
                      "세계유명골프정보, 영어키위새, 스윔클래스, 비블bibl 등",
                      "인스타그램 2.7만 @seyugolf",
                      "스레드 1.7만 @bibl_youtube",
                      "SEMOGOLF 대표 (골프 영상 제작, 쇼핑몰)",
                      "TMK STUDIO 대표 (유튜브 제작 프로덕션)",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-gray-300">
                        <span className="text-teal-400 mt-0.5 shrink-0 text-xs">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 교육 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-2.5">교육</p>
                  <div className="space-y-2">
                    {[
                      "사범대학 교육과 전공 (차석 졸업)",
                      "2급 정교사",
                      "팀 내부 교사 출신들의 유튜브 교육 커리큘럼",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-gray-300">
                        <span className="text-teal-400 mt-0.5 shrink-0 text-xs">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 사업 운영 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-2.5">사업 운영</p>
                  <div className="space-y-2">
                    {[
                      "프랜차이즈 B사 3곳",
                      "프랜차이즈 M사 1곳",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-gray-300">
                        <span className="text-teal-400 mt-0.5 shrink-0 text-xs">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <a
                data-animate="up"
                data-delay="340"
                href="https://www.youtube.com/@bibl_youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-700/50 rounded-xl text-sm text-red-400 transition font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                비블 채널 바로가기
              </a>
            </div>

            {/* 비블 채널 카드 */}
            <a
              href="https://www.youtube.com/@bibl_youtube"
              target="_blank"
              rel="noopener noreferrer"
              data-animate="right"
              className="channel-card group rounded-2xl border border-gray-800"
            >
              <div className="relative h-52 overflow-hidden rounded-t-2xl">
                <Image src={CHANNELS[3].banner} alt="비블 bibl 채널 배너" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/70 to-transparent" />
              </div>
              <div className="bg-gray-900 rounded-b-2xl px-5 pb-5 pt-10 relative">
                <div className="absolute -top-7 left-5 w-14 h-14 rounded-full overflow-hidden border-[3px] border-gray-900 shadow-lg shrink-0">
                  <Image src={CHANNELS[3].avatar} alt="비블" width={56} height={56} className="object-cover w-full h-full" unoptimized />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-sm">비블 bibl</div>
                    <div className="text-xs text-gray-500">@bibl_youtube</div>
                  </div>
                  <div className="text-right">
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

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FAQ — 반론 처리                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p data-animate="up" className="text-sm text-gray-500 uppercase tracking-widest mb-3 text-center">FAQ</p>
          <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold mb-12 text-center">
            자주 하시는 질문
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {C.faqs.map((item, i) => (
              <details
                key={item.q}
                data-animate="up"
                data-delay={String(i * 60)}
                className="group rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition"
              >
                <summary className="p-5 cursor-pointer list-none text-base font-semibold flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform shrink-0 text-lg">▾</span>
                </summary>
                <div className="px-5 pb-5 text-base text-gray-400 leading-relaxed border-t border-gray-800 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 최종 CTA — 긴급성 + 리스크 해소                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="max-w-screen-xl mx-auto px-4 py-28">
          <div className="relative rounded-3xl border border-teal-800/40 bg-gradient-to-br from-teal-950/40 to-gray-900 overflow-hidden p-10 md:p-16 text-center">
            {/* 배경 효과 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

            <div data-animate="up" className="relative inline-block mb-8">
              {/* 외부 ping 링 */}
              <div className="absolute inset-0 rounded-2xl border border-red-500/60 animate-ping" style={{ animationDuration: "1.8s" }} />
              {/* 글로우 pulse */}
              <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ boxShadow: "0 0 20px 4px rgba(239,68,68,0.25)" }} />
              <a
                href="/studio/consulting"
                className="relative inline-flex flex-col items-center gap-1 border border-red-600/70 bg-red-950/50 hover:bg-red-950/70 rounded-2xl px-7 py-3.5 transition group"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-red-400">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse shrink-0" />
                  이번달 신규 대행 마감임박
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-teal-300 transition">
                  무료 상담을 남겨주세요 →
                </span>
              </a>
            </div>

            <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-bold mb-6 leading-tight relative">
              지금 무료 상담을 신청해보세요.<br />
              <span className="text-teal-400">비블이 직접 연락드립니다.</span>
            </h2>

            <p data-animate="up" data-delay="160" className="text-gray-400 mb-10 text-base md:text-lg relative max-w-xl mx-auto">
              여러분의 유튜브 성장 가능성을 무료로 확인해드립니다.
            </p>

            <div data-animate="scale" data-delay="240" className="relative">
              <a
                href="/studio/consulting"
                className="inline-flex items-center gap-3 px-12 py-5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl transition text-lg shadow-2xl shadow-teal-900/50"
              >
                무료 상담 바로가기
              </a>
            </div>

            <div data-animate="fade" data-delay="400" className="relative mt-8 flex flex-wrap justify-center gap-6 text-xs text-gray-600">
              <span>✓ 완전 무료</span>
              <span>✓ 채널 URL 하나면 OK</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
