import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "유튜브 채널 대행 — 비블 TMK STUDIO",
  description:
    "총 65만 구독자 채널을 운영한 비블이 여러분의 채널을 직접 운영합니다. " +
    "기획·촬영·편집·업로드·분석까지 전 과정 채널 대행.",
};

// ─── 운영 및 공동기획 채널 데이터 ─────────────────────────────────────
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
  {
    name: "배고팡",
    handle: "@baegopang1",
    subs: "3.31만명",
    subsNum: "3.31만",
    category: "음식·다이어트",
    avatar: "https://yt3.googleusercontent.com/7lP38Oezdx8woNwzQcagjmiwMIjpacpOT3mXFetkFsKLetnyi9ymHenTMPUDMwIdjWaLkHYmIg=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/oIYW7usbQ4Wp4MdOEmAYHPzFB28-l0chRQwLQ6MvI8cv3IkPbRdyApkwW4CFNrRLu43YO05rVW8=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@baegopang1",
    color: "from-orange-900/80",
  },
  {
    name: "세계유명 골프레슨",
    handle: "@세계유명골프레슨",
    subs: "1.16만명",
    subsNum: "1.16만",
    category: "골프 레슨",
    avatar: "https://yt3.googleusercontent.com/JsHOMhsNg6GVEfeLgArKP5wappnficEWruFlxK8TRRf2_xpqBF3OQsbvkXu32srWaui02zppR_o=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/_MlBIxHi8Cvt7lTZg6F0svNJOVAz_Le2jthY8T6SS7ijj-auSC33JEKoYmy1CSpuq5Q8HPr-L7E=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/@세계유명골프레슨",
    color: "from-lime-900/80",
  },
  {
    name: "Drawing MiMiSulSul",
    handle: "@MIMISULSUL",
    subs: "8.47천명",
    subsNum: "0.85만",
    category: "드로잉",
    avatar: "https://yt3.googleusercontent.com/_jdM4wQ5HYAvKioeArkYrDYILEcC6Z72HAB9CW8zt-7UPSdJ8nk4s0keAKoQrwMr3Ln4k2_AgHQ=s240-c-k-c0x00ffffff-no-rj",
    banner: "https://yt3.googleusercontent.com/wn5G-HpcnYp6FyUiq9IUKQgCUMSXMRJvMN-3Q4VpdXT5w37GBmQ3JwRBVKe7fVy7G0XO9z1ctpE=w1280-fcrop64=1,00000000ffffffff",
    url: "https://www.youtube.com/channel/UC6dIuL-vSW_egzY4UiPzKtg",
    color: "from-pink-900/80",
  },
];

// ─── 4가지 핵심 차별점 ─────────────────────────────────────────────────
const FEATURES = [
  {
    num: "1",
    title: "전략적인 콘텐츠 기획",
    desc: "시청자의 관심사와 행동 패턴을 분석한 콘텐츠 전략을 제공합니다.\n전 세계 콘텐츠를 분석하여 채널 방향성을 명확히 제시합니다.",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=85",
    imgAlt: "콘텐츠 전략 기획",
    imgRight: true,
  },
  {
    num: "2",
    title: "대본 기획 작성",
    desc: "시청자가 원하는 정보를 담은 대본을 함께 기획합니다.\n높은 신뢰를 확보하면서 시청자에게 유익한 정보를 전달합니다.",
    img: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=85",
    imgAlt: "대본 기획 작성",
    imgRight: false,
  },
  {
    num: "3",
    title: "유튜브에 적합한 고퀄리티 편집",
    desc: "유튜브 알고리즘에 최적화된 편집을 진행합니다.\n도입부 3초 훅부터 CTA까지 시청 지속률을 극대화하는 편집으로 일반 대비 2~3배 높은 조회수를 달성합니다.",
    img: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=85",
    imgAlt: "고퀄리티 영상 편집",
    imgRight: true,
  },
  {
    num: "4",
    title: "데이터 분석 & 채널 성장 관리",
    desc: "매달 채널 데이터를 분석해 개선 포인트를 피드백합니다.\n제목·썸네일·SEO를 지속 최적화하고 조회수를 실제 비즈니스 매출로 연결하는 전략을 함께 설계합니다.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=85",
    imgAlt: "데이터 분석 대시보드",
    imgRight: false,
  },
];

// ─── 후기 ─────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: "체육 채널 운영 대표님", text: "썸네일·제목만 바꿨더니 영상 노출이 폭발했습니다. 올릴 때마다 조회 그래프가 눈에 띄게 올라갑니다." },
  { name: "사업자 대표님", text: "막막했던 홍보가 유튜브를 통해 체계화되며 월 매출이 2천만 원 이상 증가했습니다." },
  { name: "학원 원장님", text: "적용 후 전년 동월 대비 매출이 200% 성장했습니다. 신규 원생이 줄을 서고 있습니다." },
  { name: "피부관리샵 대표님", text: "인스타그램 영상이 20만 회를 돌파하며 신규 고객이 늘었고, 결국 직원을 추가 채용했습니다." },
  { name: "돈가스 매장 대표님", text: "작년 대비 매출이 40% 상승했습니다. 이제는 홍보 걱정이 아니라 손님 응대 인력을 추가 고민하고 있습니다." },
  { name: "쇼핑몰 운영자", text: "스토리텔링 콘텐츠 전략을 적용하니 상품 문의가 3배 증가했습니다. 단순 조회수가 아니라 매출로 이어지는 게 놀랍습니다." },
];

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-24 md:py-36">
          <p className="text-teal-400 text-sm font-medium tracking-widest uppercase mb-6">
            유튜브 채널 대행
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8 max-w-4xl">
            비블은 타 대행사와<br />
            비교할 수 없는<br />
            <span className="text-teal-400">4가지를 전달합니다</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl leading-relaxed">
            총 65만 구독자를 직접 키운 비블이<br />
            여러분의 채널을 처음부터 끝까지 운영합니다.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="http://pf.kakao.com/_xoGexgG/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-base"
            >
              무료 상담 받기
            </a>
            <a
              href="#features"
              className="px-8 py-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition text-base"
            >
              서비스 알아보기
            </a>
          </div>

          {/* 통계 */}
          <div className="flex flex-wrap gap-12 mt-20 pt-12 border-t border-gray-800">
            {[
              { val: "65만+", label: "총 구독자" },
              { val: "7개", label: "운영·공동기획 채널" },
              { val: "1억+", label: "누적 조회수" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold text-white">{s.val}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 운영 채널 포트폴리오 ─────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">포트폴리오</p>
          <h2 className="text-2xl md:text-4xl font-bold mb-3">
            운영 및 공동기획 하고 있는 채널
          </h2>
          <p className="text-gray-400 mb-12 text-sm md:text-base">
            총 <span className="text-teal-400 font-semibold">65만+ 구독자</span>를 함께 키웠습니다
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CHANNELS.map((ch) => (
              <a
                key={ch.handle}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-gray-900 border border-gray-800 hover:border-teal-700/50 transition"
              >
                <div className="relative h-20 overflow-hidden rounded-t-2xl">
                  <Image
                    src={ch.banner}
                    alt={`${ch.name} 채널 배너`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${ch.color} to-transparent`} />
                </div>
                <div className="px-4 pt-0 pb-4">
                  <div className="relative -mt-5 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-900">
                      <Image
                        src={ch.avatar}
                        alt={ch.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-white group-hover:text-teal-400 transition leading-tight">
                      {ch.name}
                    </div>
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

      {/* ── 4가지 특징 ───────────────────────────────────────────────── */}
      <section id="features">
        {FEATURES.map((feat, i) => (
          <div key={feat.num} className={`border-b border-gray-800 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30"}`}>
            <div className="max-w-screen-xl mx-auto px-4 py-0">
              <div className={`grid md:grid-cols-2 min-h-[480px] md:min-h-[560px] ${feat.imgRight ? "" : "md:[direction:rtl]"}`}>

                {/* 텍스트 */}
                <div className={`flex flex-col justify-center py-16 md:py-20 px-0 md:px-12 ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <span className="text-6xl md:text-8xl font-black text-gray-800 leading-none mb-6 select-none">
                    {feat.num}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mb-5 leading-tight">
                    {feat.title}
                  </h2>
                  <p className="text-gray-400 text-base leading-relaxed whitespace-pre-line">
                    {feat.desc}
                  </p>
                </div>

                {/* 이미지 */}
                <div className={`relative min-h-64 md:min-h-0 ${feat.imgRight ? "" : "md:[direction:ltr]"}`}>
                  <Image
                    src={feat.img}
                    alt={feat.imgAlt}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 via-transparent to-transparent" />
                </div>

              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA 중간 배너 ────────────────────────────────────────────── */}
      <section className="border-b border-gray-800 bg-teal-900/20">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            여러분의 채널이<br className="md:hidden" /> 성공 가능성이 있는지<br />
            <span className="text-teal-400">무료 진단을 받아보세요</span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm md:text-base">
            채널 URL만 보내주시면 즉시 무료 진단을 시작합니다.
          </p>
          <a
            href="http://pf.kakao.com/_xoGexgG/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition text-base"
          >
            무료 상담 받기 →
          </a>
        </div>
      </section>

      {/* ── 고객 후기 ─────────────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">후기</p>
          <h2 className="text-2xl md:text-4xl font-bold mb-12">
            실제로 변화한 채널들
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r) => (
              <div key={r.name} className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
                <div className="flex gap-0.5 text-amber-400 text-sm mb-4">★★★★★</div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>
                <div className="text-xs text-gray-500 font-medium border-t border-gray-800 pt-4">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 강사 소개 ─────────────────────────────────────────────────── */}
      <section className="border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">운영자 소개</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">비블 (김태민)</h2>
              <p className="text-teal-400 font-semibold text-lg mb-8">TMK STUDIO 대표</p>
              <p className="text-gray-400 leading-relaxed mb-8 text-sm md:text-base">
                세계유명 골프정보(24.8만), 영어키위새(23.5만), 스윔클래스(8.26만), 비블(3.52만) 등<br />
                다양한 분야의 채널을 직접 운영하며 수억 원의 매출을 만든 실전 전문가입니다.
              </p>
              <a
                href="https://www.youtube.com/@bibl_youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-700/50 rounded-xl text-sm text-red-400 transition font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                유튜브 채널 보러가기
              </a>
            </div>

            <a
              href="https://www.youtube.com/@bibl_youtube"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-gray-800 hover:border-teal-700/50 transition overflow-visible"
            >
              <div className="relative h-52 overflow-hidden rounded-t-2xl">
                <Image
                  src={CHANNELS[3].banner}
                  alt="비블 bibl 채널 배너"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/70 to-transparent" />
              </div>
              <div className="bg-gray-900 rounded-b-2xl px-5 pb-5">
                <div className="flex items-center gap-3 -mt-7 mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-900 shrink-0 shadow-lg">
                    <Image
                      src={CHANNELS[3].avatar}
                      alt="비블"
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="pt-6">
                    <div className="font-bold text-white text-sm">비블 bibl</div>
                    <div className="text-xs text-gray-500">@bibl_youtube</div>
                  </div>
                  <div className="ml-auto pt-6 text-right">
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

      {/* ── 하단 CTA ──────────────────────────────────────────────────── */}
      <section>
        <div className="max-w-screen-xl mx-auto px-4 py-28 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            채널 성장 가능성이 있는지<br />
            <span className="text-teal-400">지금 바로 확인하세요</span>
          </h2>
          <p className="text-gray-400 mb-10 text-base md:text-lg">
            평일 9시~18시 내 응답 보장 · 채널 URL만 보내주시면 무료 진단 시작
          </p>
          <a
            href="http://pf.kakao.com/_xoGexgG/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-12 py-5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl transition text-lg"
          >
            무료 상담 받기
          </a>
          <p className="text-xs text-gray-600 mt-5">비공개 채팅 · 스팸 없음 · 무료</p>
        </div>
      </section>

    </main>
  );
}
