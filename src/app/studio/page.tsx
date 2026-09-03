import type { Metadata } from "next";
import TrackVisit from "@/app/_components/TrackVisit";
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
  title: "유튜브 채널 대행 | 70만 구독자 비블의 TMK STUDIO",
  description:
    "구독자 0명에서 24만까지. 총 70만+ 구독자 채널을 운영한 유튜브 전문가 비블이 기획·촬영·편집·업로드·분석까지 전 과정을 책임집니다. 지금 채널 대행 문의를 남겨보세요.",
  keywords: [
    "유튜브 채널 대행",
    "유튜브 대행",
    "유튜브 운영 대행",
    "유튜브 컨설팅",
    "유튜브 마케팅 대행사",
    "유튜브 채널 운영",
    "유튜브 기획 대행",
    "유튜브 편집 대행",
    "유튜브 채널 키우기",
    "유튜브 성장 대행",
    "MCN",
    "TMK STUDIO",
    "비블",
    "bibl lab",
    "유튜브 마케팅",
    "브랜디드 콘텐츠",
    "유튜브 SEO",
  ],
  alternates: {
    canonical: "https://bibllab.com/studio",
  },
  openGraph: {
    title: "유튜브 채널 대행 | 70만 구독자 비블의 TMK STUDIO",
    description:
      "구독자 0명에서 24만까지. 총 70만+ 구독자 채널을 운영한 유튜브 전문가 비블이 기획·촬영·편집·업로드·분석까지 전 과정을 책임집니다.",
    url: "https://bibllab.com/studio",
    siteName: "비블랩 (bibl lab)",
    images: [
      {
        url: "https://bibllab.com/studio/silver-play-button.jpg",
        width: 1200,
        height: 630,
        alt: "비블 TMK STUDIO — 유튜브 채널 대행 전문",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "유튜브 채널 대행 | 비블 TMK STUDIO",
    description: "구독자 0명에서 24만까지. 70만+ 구독자 채널 운영 비블이 직접 운영합니다.",
    images: ["https://bibllab.com/studio/silver-play-button.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD: Service 스키마 (구글이 "유튜브 채널 대행" 검색 시 노출)
const studioJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "비블 TMK STUDIO — 유튜브 채널 대행",
  serviceType: "유튜브 채널 운영 대행",
  description:
    "총 70만+ 구독자 채널을 운영한 비블이 직접 기획·촬영·편집·업로드·분석까지 전 과정을 대행합니다. " +
    "구독자 0명부터 24만까지 성장시킨 검증된 노하우로 여러분의 유튜브 채널을 키웁니다.",
  provider: {
    "@type": "Organization",
    name: "비블랩 (bibl lab)",
    url: "https://bibllab.com",
    logo: "https://bibllab.com/og-image.png",
    sameAs: ["https://www.youtube.com/@biblcontent"],
  },
  areaServed: { "@type": "Country", name: "South Korea" },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "유튜브 채널 대행 서비스",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "올인원 유튜브 채널 대행",
          description: "기획·촬영·편집·업로드·분석 전 과정 대행",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "1:1 유튜브 컨설팅",
          description: "70만+ 구독자 비블이 직접 진행하는 1:1 유튜브 브랜딩·비즈니스 컨설팅",
        },
      },
    ],
  },
  // NOTE: Service 타입은 구글 리뷰 스니펫 비대상이라 aggregateRating을 넣으면
  // 서치콘솔 "리뷰 스니펫 - 일부 항목이 잘못됨" 경고가 발생 → 제거
  url: "https://bibllab.com/studio",
};

const CHANNELS = [
  {
    name: "세계유명 골프정보",
    handle: "@세계유명골프정보",
    subsNum: "25.8만",
    category: "골프",
    result: "구독자 0→25만",
    avatar: "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/fNxhkFCNtSBP1dtg0i3W5oZKlohCyLhkNY8vUA1X8qC28L7q_t0QR9j_Ui-qaIq7f5hyiNAcWg=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@세계유명골프정보",
    color: "from-green-900/80",
  },
  {
    name: "영어 키위새",
    handle: "@eng_kiwi",
    subsNum: "24.5만",
    category: "영어 교육",
    result: "구독자 0→24만",
    avatar: "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/-GU5UUOmKhc_zSCX2RCxc2FRG1ESh1EgLcS9A8AVUT5O9_RfRC4zFNH0pTyQXhisD4jrM6Xxww=w1280-fcrop64=1,00005a5afffffea",
    url: "https://www.youtube.com/@eng_kiwi",
    color: "from-blue-900/80",
  },
  {
    name: "스윔클래스",
    handle: "@swim_class",
    subsNum: "8.57만",
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
    subsNum: "4.2만",
    category: "사업·마케팅",
    result: "매출 연결 콘텐츠",
    avatar: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/XDssFLodQnpmebO2quHSdHYPUroghTjlqATrtTahvyMNfVWUxTP4lr55XEKqLiUh-z2y2wJFaRQ=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@bibl_youtube",
    color: "from-neutral-900/80",
  },
  {
    name: "세계유명 골프레슨",
    handle: "@세계유명골프레슨",
    subsNum: "1.84만",
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
    subsNum: "0.95만",
    category: "드로잉",
    result: "해외 구독자 유입",
    avatar: "https://yt3.googleusercontent.com/_jdM4wQ5HYAvKioeArkYrDYILEcC6Z72HAB9CW8zt-7UPSdJ8nk4s0keAKoQrwMr3Ln4k2_AgHQ=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/wn5G-HpcnYp6FyUiq9IUKQgCUMSXMRJvMN-3Q4VpdXT5w37GBmQ3JwRBVKe7fVy7G0XO9z1ctpE=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/channel/UC6dIuL-vSW_egzY4UiPzKtg",
    color: "from-pink-900/80",
  },
];

// 비블 채널 (하단 소개 카드에서 사용 — 배열 순서 변경에도 안전)
const BIBL_CHANNEL = CHANNELS.find((c) => c.handle === "@bibl_youtube")!;

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
  { q: "대행 비용은 얼마인가요?", a: "채널 현황과 원하시는 서비스 범위에 따라 달라집니다. 채널 대행 문의를 남겨주시면 채널을 검토한 뒤 맞춤 제안을 드립니다. 카카오톡으로 채널 URL만 보내주시면 됩니다." },
  { q: "최소 계약 기간이 있나요?", a: "최소 3개월 계약을 권장합니다. 채널 데이터가 축적되어야 알고리즘이 채널을 학습하고 성장 궤도에 오르기 때문입니다. 3개월 안에 가시적인 변화를 반드시 확인하실 수 있습니다." },
  { q: "구독자 0명 채널도 가능한가요?", a: "네, 구독자 0명부터 시작해도 됩니다. 오히려 처음부터 올바른 전략으로 시작하는 것이 훨씬 효율적입니다. 채널이 없다면 처음부터 함께 설계합니다." },
  { q: "어떤 분야든 가능한가요?", a: "골프, 영어교육, 피트니스, 음식, 뷰티, 사업·마케팅, 드로잉 등 다양한 분야의 채널을 운영한 경험이 있습니다. 분야보다는 '타깃 시청자가 명확한지'가 더 중요합니다." },
  { q: "결과를 보장해주나요?", a: "특정 구독자 수를 보장하는 건 어렵습니다. 하지만 저희가 운영한 모든 채널은 3개월 내 가시적인 성장을 달성했습니다. 실제 운영 데이터를 문의 시 공유해드립니다." },
  { q: "촬영도 대행해주나요?", a: "네, 기획·촬영·편집·업로드·분석까지 전 과정을 대행합니다. 장소 섭외, 카메라·조명·음향 장비, 출연자 디렉팅까지 모두 포함됩니다. 여러분은 시간만 내주시면 됩니다." },
];

// 레퍼런스 톤: 좌측 캡션 + 우측 영문 라벨 섹션 헤더
function SectionLabel({ label, caption = "비블의 유튜브 채널 대행" }: { label: string; caption?: string }) {
  return (
    <div data-animate="fade" className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-12">
      <TrackVisit page="studio" />
      <span className="text-xs md:text-sm text-neutral-500">{caption}</span>
      <span className="text-sm md:text-base font-black tracking-[0.25em] text-white">{label}</span>
    </div>
  );
}

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* JSON-LD: 구글이 "유튜브 채널 대행" 검색 시 풍부한 결과(Service) 노출 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(studioJsonLd) }}
      />
      <StudioGuard />
      <AnimationObserver />
      {DevEditor && <DevEditor />}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* HERO — 고통 공감 + 명확한 약속                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-neutral-800 overflow-hidden">

        <div className="relative max-w-screen-xl mx-auto px-4 py-24 md:py-36">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p data-animate="up" className="text-sm md:text-base text-neutral-400 font-medium mb-4">
                {C.hero.badge.split("70만+").map((part, idx, arr) => (
                  <span key={idx}>
                    {part}
                    {idx < arr.length - 1 && <span className="text-[#E5484D] font-bold">70만+</span>}
                  </span>
                ))}
              </p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
                <span data-animate="up" data-delay="60" className="block mb-1 text-neutral-300">
                  {C.hero.subtitle}
                </span>
                <span data-animate="up" data-delay="160" className="block">
                  {C.hero.titleLine1 && <>{C.hero.titleLine1}{" "}</>}
                  <span className="text-white highlight-draw">{C.hero.titleHighlight}</span>
                </span>
              </h1>

              <p data-animate="up" data-delay="260" className="text-neutral-400 text-base md:text-lg mb-10 leading-relaxed whitespace-pre-line">
                {C.hero.desc}
              </p>

              <div data-animate="up" data-delay="360" className="flex flex-wrap gap-4">
                <a
                  href="/studio/consulting"
                  className="px-8 py-4 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition text-base"
                >
                  {C.hero.ctaPrimary}
                </a>
                <a
                  href="#process"
                  className="px-8 py-4 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-semibold rounded-xl transition text-base"
                >
                  {C.hero.ctaSecondary}
                </a>
              </div>

              <p data-animate="fade" data-delay="500" className="text-xs text-neutral-600 mt-4">
                채널 URL만 보내주시면 됩니다
              </p>
            </div>

            {/* 실버 플레이 버튼 — 꽉 채운 이미지 */}
            <div data-animate="right" className="flex flex-col gap-4">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 aspect-[4/3]">
                <Image
                  src={C.hero.heroImage}
                  alt="히어로 이미지"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">
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
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="PROBLEM" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black leading-tight mb-14">
            <span className="text-neutral-400">유튜브를 혼자 운영하면서</span><br />
            답답하지 않으셨나요?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "",
                badge: "문제 01",
                title: "기획이 막막하다",
                desc: "무슨 주제로 찍어야 할지, 어떤 소재로 영상을 만들어야 할지 전혀 감이 안 옵니다. 경쟁자는 많은데 아무도 내 영상을 시청하지 않습니다.",
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
                desc: "업로드 하더라도 조회수가 안나옵니다. 썸네일, 제목, 내용, 구매전환, 브랜딩 어떤것이 원인인지 알기 어렵기에 개선이 불가능합니다. 결국 포기하게 되죠.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-animate="up"
                data-delay={String(i * 100)}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-xl text-white">{item.title}</h3>
                  <span className="ml-3 shrink-0 text-xs font-bold text-neutral-400 border border-neutral-700 px-2.5 py-1 rounded-md whitespace-nowrap">
                    {item.badge}
                  </span>
                </div>
                <p className="text-base text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div data-animate="up" data-delay="300" className="mt-10 text-center">
            <p className="text-neutral-500 text-base mb-4">이 3가지 문제, 비블이 전부 해결합니다.</p>
            <a
              href="/studio/consulting"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition text-sm"
            >
              채널 대행 문의하기 →
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* YouTube 영상                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-lg mx-auto px-4 py-20">
          <SectionLabel label="INTERVIEW" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black mb-10">
            영상으로 만나보세요
          </h2>
          <div data-animate="up" data-delay="160" className="relative w-full overflow-hidden rounded-2xl border border-neutral-800" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/ojLicBvcS4o?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=ojLicBvcS4o"
              title="비블 소개 영상"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 포트폴리오                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="PORTFOLIO" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black mb-3">
            말이 아닌, 결과로 증명합니다
          </h2>
          <p data-animate="up" data-delay="160" className="text-neutral-400 mb-12 text-base md:text-lg">
            총 <span className="text-[#E5484D] font-bold">70만+</span> 채널을 실제로 운영하고 있는 스튜디오입니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CHANNELS.map((ch, i) => (
              <a
                key={ch.handle}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                data-animate="up"
                data-delay={String(i * 60)}
                className="channel-card group rounded-2xl bg-neutral-900 border border-neutral-800"
              >
                <div className="relative h-32 md:h-44 overflow-hidden rounded-t-2xl">
                  <Image src={ch.banner} alt={`${ch.name} 채널 배너`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  {/* 결과 배지 */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-neutral-700">
                    {ch.result}
                  </div>
                </div>
                <div className="px-6 pt-0 pb-6">
                  <div className="relative -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-neutral-900 shadow-lg">
                      <Image src={ch.avatar} alt={ch.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-base md:text-lg text-white leading-tight">{ch.name}</div>
                    <div className="text-xs text-neutral-500">{ch.handle}</div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-2xl font-black text-white">{ch.subsNum}</span>
                        <span className="text-xs text-neutral-500 ml-1.5">구독자</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400">{ch.category}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* 90일 실측 성과 — 세계유명 골프정보 */}
          <div data-animate="up" className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 md:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">직접 운영 채널 실측 데이터</p>
                <h3 className="text-xl md:text-2xl font-bold text-white">「세계유명 골프정보」 최근 90일 성과</h3>
              </div>
              <span className="text-xs text-neutral-500">YouTube 스튜디오 기준</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
              {[
                { value: "485.2만", label: "총 조회수 (90일)" },
                { value: "3,189만", label: "총 노출수" },
                { value: "8.01%", label: "평균 클릭률 (업계 평균 4~6%)" },
                { value: "35만 시간", label: "누적 시청 시간" },
                { value: "+5,100명", label: "구독자 순증 (90일)" },
                { value: "25.8만", label: "현재 구독자" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-black text-white tracking-tight">{s.value}</div>
                  <div className="text-xs text-neutral-500 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 pt-6 border-t border-neutral-800 text-sm text-neutral-400 leading-relaxed">
              채널 성과에서 끝나지 않습니다. 이 트래픽은 골프 쇼핑몰 <span className="text-[#E5484D] font-semibold">연 매출 7억+</span>으로 직접 연결됩니다.
              트래픽을 매출로 전환하는 비즈니스 설계 — 일반 대행사와 가장 다른 지점입니다.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 영상 썸네일 마퀴 — 실제 운영 영상들                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800 py-16 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 mb-10">
          <SectionLabel label="CONTENTS" />
          <h2 data-animate="up" className="text-2xl md:text-4xl font-black leading-snug">
            <span className="text-neutral-400">{C.marquee.titleLine1}</span><br />
            <span className="text-[#E5484D]">
              {C.marquee.titleHighlight}
            </span>{C.marquee.titleLine2}
          </h2>
          <p data-animate="up" data-delay="160" className="text-neutral-400 text-sm md:text-base mt-5 max-w-2xl leading-relaxed space-y-2">
            {C.marquee.desc1}<br className="hidden md:block" />
            <br />
            {C.marquee.desc2}
          </p>
          <p data-animate="up" data-delay="220" className="text-xs text-neutral-600 mt-3">
            마우스를 올리면 멈춥니다 · 클릭하면 유튜브로 이동합니다
          </p>
        </div>
        <VideoMarquee />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 진행 프로세스 — 불안 해소                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="process" className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="PROCESS" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black leading-tight mb-4">
            <span className="text-neutral-400">문의부터 운영까지,</span><br /><span className="text-[#E5484D]">7단계</span>로 진행됩니다
          </h2>
          <p data-animate="up" data-delay="160" className="text-neutral-400 mb-16 text-base">
            여러분이 쓰는 시간은 월 촬영 하루 3~4시간, 질문지 답변 2~3시간이 전부입니다
          </p>

          <div className="max-w-3xl space-y-3">
            {[
              {
                step: "01",
                title: "채널 대행 문의 + 기획 미팅",
                desc: "어떤 주제로 시작할지, 채널 방향성·브랜딩·비즈니스 모델까지 함께 잡습니다.",
              },
              {
                step: "02",
                title: "채널 성장 기획서 (비블 직접 작성)",
                desc: "시장 분석, 포지셔닝, 수익화 설계를 담은 기획서를 받아보실 수 있습니다.",
              },
              {
                step: "03",
                title: "데이터 기반 주제 선별 + 질문지 전달",
                desc: "비블랩 자체 유튜브 분석 SaaS로 트렌드와 효과가 검증된 주제를 선별하고, 시청자가 궁금해할 내용을 질문지로 전달드립니다.",
              },
              {
                step: "04",
                title: "답변 → 유튜브 대본으로 디벨롭",
                desc: "질문지에 답변만 대략 채워주시면, 유튜브에서 통하는 구조의 대본 초안으로 디벨롭해 드립니다.",
              },
              {
                step: "05",
                title: "촬영 (비블 현장 직접 디렉팅)",
                desc: "월 1회 촬영으로 한 번에 4건을 제작합니다. 비블과 유튜브 채널을 직접 운영 중인 PD가 현장에서 실시간 디렉팅합니다.",
              },
              {
                step: "06",
                title: "편집 + 썸네일 + SEO 업로드",
                desc: "편집·자막·효과음은 물론, 클릭을 만드는 썸네일과 제목을 비블이 직접 제작해 업로드까지 완료합니다.",
              },
              {
                step: "07",
                title: "데이터 분석 + 월간 리포트",
                desc: "클릭률·시청 지속시간·유입 경로를 분석해 월간 리포트를 드리고, 다음 달 전략을 조정합니다.",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                data-animate="up"
                data-delay={String(i * 60)}
                className="flex gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:p-6"
              >
                <div className="shrink-0 w-9 pt-0.5 text-lg font-black text-neutral-500">
                  {s.step}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-white mb-1.5">{s.title}</h3>
                  <p className="text-sm md:text-base text-neutral-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 4가지 차별점                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section id="features">
        <div className="max-w-screen-xl mx-auto px-4 pt-20">
          <SectionLabel label="STRENGTH" />
        </div>
        {C.features.map((feat: typeof C.features[0] & { imgRight?: boolean }, i) => {
          feat = { ...feat, imgRight: i % 2 === 0 };
          return (
          <div key={feat.num} className={`border-b border-neutral-800 ${i % 2 === 0 ? "bg-black" : "bg-neutral-950"}`}>
            <div className="max-w-screen-xl mx-auto px-4 py-0">
              <div className={`grid md:grid-cols-2 min-h-[460px] md:min-h-[520px] ${feat.imgRight ? "" : "md:[direction:rtl]"}`}>
                <div className={`flex flex-col justify-center py-16 md:py-20 px-0 md:px-12 ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <span data-animate={feat.imgRight ? "left" : "right"} className="text-5xl md:text-7xl font-black text-neutral-700 leading-none mb-5 select-none">
                    {feat.num}
                  </span>
                  <h2 data-animate={feat.imgRight ? "left" : "right"} data-delay="100" className="text-2xl md:text-3xl font-black mb-5 leading-tight">
                    {feat.title}
                  </h2>
                  <p data-animate={feat.imgRight ? "left" : "right"} data-delay="200" className="text-neutral-400 text-base leading-relaxed whitespace-pre-line">
                    {feat.desc}
                  </p>
                </div>
                <div data-animate={feat.imgRight ? "right" : "left"} className={`relative min-h-64 md:min-h-0 overflow-hidden ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <Image src={feat.img} alt={feat.imgAlt} fill className="object-cover feat-img" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 기존 대행사의 구조적 문제 + 비교표                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="DIFFERENCE" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black leading-tight">
            <span className="text-neutral-400">기존 유튜브 대행사의</span><br /><span className="text-[#E5484D]">3가지</span> 구조적 문제
          </h2>
          <p data-animate="up" data-delay="160" className="text-neutral-400 mt-5 mb-14 text-base max-w-2xl">
            직접 이 사업에 뛰어들어 경쟁사를 깊이 분석한 결과, 업계에는 명확한 구조적 문제가 있었습니다.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                badge: "문제 01",
                title: "직접 운영해 본 적이 없다",
                desc: "방송국·제작사 출신, 고가 장비, 수준급 편집. 겉보기엔 전문적이지만 결과는 좋지 않습니다. 유튜브의 본질은 고퀄리티 영상이 아니라 클릭하게 만들고, 끝까지 보게 만들고, 비즈니스로 연결되게 만드는 것이기 때문입니다.",
              },
              {
                badge: "문제 02",
                title: "\"성과 보장\"은 위험 신호다",
                desc: "\"조회수 안 나오면 환불\", \"3개월에 구독자 1만 보장\" — 이런 보장형 계약 뒤에는 트래픽을 돈으로 사서 주입하는 관행이 존재합니다. 보장 수치를 채우기 위한 어뷰징은 채널 자체를 망가뜨립니다.",
              },
              {
                badge: "문제 03",
                title: "유튜브는 알아도 비즈니스를 모른다",
                desc: "채널을 빠르게 키우는 업체도 있습니다. 하지만 직접 사업을 해본 경험이 없다면, 채널이 커져도 매출로 이어지지 않습니다. 트래픽을 매출로 전환하는 것은 완전히 별개의 역량입니다.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-animate="up"
                data-delay={String(i * 100)}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <span className="inline-block text-xs font-bold text-neutral-400 border border-neutral-700 px-2.5 py-1 rounded-md mb-4">
                  {item.badge}
                </span>
                <h3 className="font-bold text-xl text-white mb-3">{item.title}</h3>
                <p className="text-base text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 비교표 */}
          <div data-animate="up" className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900">
                  <th className="px-5 py-4 font-semibold text-neutral-500 w-40">항목</th>
                  <th className="px-5 py-4 font-semibold text-neutral-500">일반 대행사</th>
                  <th className="px-5 py-4 font-bold text-white">TMK STUDIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {[
                  { k: "직접 운영 채널", a: "없음", b: "총 70만 구독자, 7개 채널" },
                  { k: "사업 경험", a: "영상 제작자 출신 다수", b: "유튜브 분석 SaaS 운영 · 매출 7억+ 쇼핑몰 · 유튜버 교육 컨설팅 · 오프라인 매장 3곳" },
                  { k: "주제 선정", a: "감 · 회의", b: "자체 SaaS 데이터 + 운영 인사이트" },
                  { k: "촬영 디렉팅", a: "PD 외주", b: "비블 직접 현장 디렉팅" },
                  { k: "썸네일 · 제목", a: "디자이너 외주", b: "비블 직접 제작" },
                  { k: "비즈니스 연결", a: "채널 성장에서 끝", b: "트래픽 → 매출 퍼널 + 브랜딩 설계" },
                ].map((row) => (
                  <tr key={row.k} className="bg-neutral-950">
                    <td className="px-5 py-4 text-neutral-500 align-top">{row.k}</td>
                    <td className="px-5 py-4 text-neutral-500 align-top">{row.a}</td>
                    <td className="px-5 py-4 text-white font-medium align-top">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 고객 후기 — 구체적 수치                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="REVIEW" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black mb-12">
            숫자가 거짓말하지 않습니다
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {C.reviews.map((r, i) => (
              <div
                key={r.name}
                data-animate="up"
                data-delay={String(i * 80)}
                className="review-card rounded-2xl bg-neutral-900 border border-neutral-800 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5 text-white text-sm">★★★★★</div>
                  <span className="text-xs font-bold text-[#E5484D] border border-neutral-700 px-2.5 py-1 rounded-full">
                    {r.result}
                  </span>
                </div>
                <p className="text-base text-neutral-300 leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>
                <div className="text-sm text-neutral-500 font-medium border-t border-neutral-800 pt-4">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 운영자 소개 — 권위 확립                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="ABOUT" />
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 data-animate="up" className="text-4xl md:text-5xl font-black mb-2">비블 (김태민)</h2>
              <p data-animate="up" data-delay="160" className="text-[#E5484D] font-bold text-lg mb-8">TMK STUDIO 대표</p>

              <div data-animate="up" data-delay="220" className="space-y-6 mb-8">
                {/* 온라인 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-2.5">온라인</p>
                  <div className="space-y-2">
                    {[
                      "유튜브 총 70만+ 채널 운영 및 공동기획",
                      "세계유명골프정보, 영어키위새, 스윔클래스, 비블bibl 등",
                      "인스타그램 3.0만 @seyugolf",
                      "스레드 2.2만 @bibl_youtube",
                      "SEMOGOLF 대표 (골프 영상 제작, 쇼핑몰)",
                      "TMK STUDIO 대표 (유튜브 제작 프로덕션)",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-neutral-300">
                        <span className="text-neutral-500 mt-0.5 shrink-0 text-xs">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 교육 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-2.5">교육</p>
                  <div className="space-y-2">
                    {[
                      "사범대학 체육교육과 학사 (차석 졸업)",
                      "2급 정교사",
                      "팀 내부 교사 출신들의 유튜브 교육 커리큘럼",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-neutral-300">
                        <span className="text-neutral-500 mt-0.5 shrink-0 text-xs">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 사업 운영 */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-2.5">사업 운영</p>
                  <div className="space-y-2">
                    {[
                      "프랜차이즈 B사 3곳",
                      "프랜차이즈 M사 1곳",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-base text-neutral-300">
                        <span className="text-neutral-500 mt-0.5 shrink-0 text-xs">✓</span>
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
                className="inline-flex items-center gap-2 px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 rounded-xl text-sm text-white transition font-medium"
              >
                <svg className="w-4 h-4 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
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
              className="channel-card group rounded-2xl border border-neutral-800"
            >
              <div className="relative h-52 overflow-hidden rounded-t-2xl">
                <Image src={BIBL_CHANNEL.banner} alt="비블 bibl 채널 배너" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
              </div>
              <div className="bg-neutral-900 rounded-b-2xl px-5 pb-5 pt-10 relative">
                <div className="absolute -top-7 left-5 w-14 h-14 rounded-full overflow-hidden border-[3px] border-neutral-900 shadow-lg shrink-0">
                  <Image src={BIBL_CHANNEL.avatar} alt="비블" width={56} height={56} className="object-cover w-full h-full" unoptimized />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-white text-sm">비블 bibl</div>
                    <div className="text-xs text-neutral-500">@bibl_youtube</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-lg">{BIBL_CHANNEL.subsNum}</div>
                    <div className="text-xs text-neutral-500">구독자</div>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">사업하는 사람들의 이야기를 전합니다 · 동영상 248개</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 가격 안내                                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="PRICE" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black">
            명확한 가격으로 안내합니다
          </h2>
          <p data-animate="up" data-delay="160" className="mt-6 mb-12 text-lg md:text-2xl font-bold text-white">
            기본 구성 · 월 콘텐츠 발행량 <span className="text-[#E5484D]">롱폼 4개 + 쇼츠(롱폼 리프레이밍) 4개</span>
          </p>

          <div className="mx-auto max-w-2xl">
            <div
              data-animate="up"
              className="flex flex-col justify-between rounded-3xl border border-neutral-800 bg-neutral-900 p-8 md:p-10 min-h-[260px]"
            >
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">비블 유튜브 대행 패키지</h3>
                <p className="text-sm text-neutral-400">
                  기획 · 촬영 · 편집 · 업로드 · 채널관리 · 비블 디렉팅
                </p>
              </div>
              <div className="mt-10 text-right">
                <p className="text-xs text-neutral-500 mb-1.5">부가세(VAT) 미포함</p>
                <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  ₩3,500,000
                  <span className="text-lg font-bold text-neutral-500">/월</span>
                </p>
              </div>
            </div>

            <p data-animate="up" data-delay="120" className="mt-5 text-sm text-neutral-400">
              * 야외 · 해외 촬영 패키지 : 가격 협의
            </p>
          </div>

          <p data-animate="fade" data-delay="200" className="mt-8 text-xs text-neutral-600">
            * 가격은 변동될 수 있으니 꼭 참고해주세요. 채널 상황에 따라 구성을 조정해 제안드립니다.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FAQ — 반론 처리                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-neutral-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <SectionLabel label="FAQ" />
          <h2 data-animate="up" className="text-3xl md:text-5xl font-black mb-12">
            자주 하시는 질문
          </h2>
          <div className="max-w-3xl space-y-4">
            {C.faqs.map((item, i) => (
              <details
                key={item.q}
                data-animate="up"
                data-delay={String(i * 60)}
                className="group rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
              >
                <summary className="p-5 cursor-pointer list-none text-base font-semibold flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-neutral-500 group-open:rotate-180 transition-transform shrink-0 text-lg">▾</span>
                </summary>
                <div className="px-5 pb-5 text-base text-neutral-400 leading-relaxed border-t border-neutral-800 pt-4">
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
          <div className="relative rounded-3xl border border-neutral-800 bg-neutral-950 p-10 md:p-16 text-center">
            <div data-animate="up" className="mb-8">
              <a
                href="/studio/consulting"
                className="inline-flex items-center gap-2.5 border border-neutral-700 hover:border-neutral-500 rounded-full px-5 py-2 transition group"
              >
                <span className="text-xs font-semibold text-[#E5484D] tracking-wide">이번달 신규 대행 마감임박</span>
                <span className="w-px h-3 bg-neutral-700" />
                <span className="text-xs font-semibold text-white group-hover:text-neutral-300 transition">채널 대행 문의 남기기 →</span>
              </a>
            </div>

            <h2 data-animate="up" data-delay="80" className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
              지금 채널 대행을 문의해보세요.<br />
              비블이 직접 연락드립니다.
            </h2>

            <p data-animate="up" data-delay="160" className="text-neutral-500 mb-10 text-base md:text-lg max-w-xl mx-auto">
              여러분의 채널에 맞는 대행 방향을 제안해드립니다.
            </p>

            <div data-animate="scale" data-delay="240">
              <a
                href="/studio/consulting"
                className="inline-flex items-center gap-3 px-12 py-5 bg-white hover:bg-neutral-200 text-black font-bold rounded-2xl transition text-lg"
              >
                채널 대행 문의하기
              </a>
            </div>

            <div data-animate="fade" data-delay="400" className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-neutral-600">
              <span>✓ 채널 URL 하나면 OK</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
