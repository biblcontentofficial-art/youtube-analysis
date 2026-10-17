/* eslint-disable @next/next/no-img-element -- 정적 사진(public/home), 다른 홈 부품과 같이 최적화 서버를 거치지 않는다 */
/**
 * 홈 비블 소개 #about(2026-10-16 소유자 확정 안 C). 작은 정사각 인물 사진(3칸) + 제목·설명·사실 3줄(9칸).
 * 첫 화면 아래라 '첫 화면 인물 사진 없음' 규칙과 부딪히지 않는다.
 * 모션 A(소유자 결정 2026-10-17): 머리·사진·글 묶음이 화면에 들어올 때 한 번 떠오른다(data-animate="rise").
 * 사진은 public/home/bibl-portrait-original.webp(배경을 지우지 않은 원본 public/studio/instructor.jpg 를 가운데 정사각으로 잘라 800px, 소유자 요청 2026-10-17).
 */
import { SectionHeader } from "@/components/ui/section-header";

/** 가운뎃점에서 줄이 갈리지 않게 앞뒤에 WORD JOINER(U+2060). 10억+으로 도 같은 문자로 묶는다 */
const DOT = "⁠·⁠";

const ABOUT_ROWS: { title: string; desc: string }[] = [
  {
    title: `채널 4개 직접 운영${DOT}기획`,
    desc: `세계유명 골프정보${DOT}영어 키위새${DOT}스윔클래스${DOT}비블 bibl. 채널 운영은 쇼핑몰, 영어 강의, 컨설팅 등 연 매출 10억⁠+⁠으로 이어졌습니다.`,
  },
  {
    title: "유튜브 실버 플레이 버튼",
    desc: "세계유명 골프정보로 10만 구독자를 달성해 유튜브가 직접 수여했습니다.",
  },
  {
    title: "교육 채널 컨설팅",
    desc: `구독자 11만${DOT}5만 영어 유튜버 등 여러 교육 채널을 컨설팅했습니다.`,
  },
];

export default function HomeAbout() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-wide px-6 py-16 md:py-24 lg:px-8">
        <SectionHeader caption="비블랩을 운영하는 사람" label="ABOUT" animate="rise" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
          <figure data-animate="rise" className="w-40 sm:w-52 lg:col-span-3 lg:w-auto">
            <div className="overflow-hidden rounded-panel border border-line bg-canvas">
              <img
                src="/home/bibl-portrait-original.webp"
                width={720}
                height={720}
                alt="비블 프로필 사진. 검은 배경 앞 검은 재킷 차림"
                className="aspect-square w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="mt-3">
              <span className="block text-ui font-bold">비블 bibl</span>
              <span className="block text-caption text-fg-3">총 구독자 70만 유튜버</span>
            </figcaption>
          </figure>

          <div data-animate="rise" className="lg:col-span-9 lg:pl-10">
            <h2 id="about-title" className="text-h3 md:text-h1">
              <span className="block text-fg-3">직접 해 본 방법만</span>
              <span className="block">가르치고, 맡아서 운영합니다</span>
            </h2>
            <p className="mt-5 max-w-[34em] text-body text-fg-2 lg:text-lead">
              {`골프 채널을 키워 쇼핑몰 매출로 연결했고, 영어${DOT}수영 교육 채널을 기획했습니다. 지금은 1인 사업가와 선생님의 채널을 컨설팅하고 대신 운영합니다.`}
            </p>
            <dl className="mt-10 border-t border-line lg:mt-12">
              {ABOUT_ROWS.map((r) => (
                <div key={r.title} className="grid gap-1 border-b border-line py-5 md:grid-cols-12 md:gap-6">
                  <dt className="text-ui font-bold md:col-span-4">{r.title}</dt>
                  <dd className="text-body-sm text-fg-2 md:col-span-8 md:text-body">{r.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
