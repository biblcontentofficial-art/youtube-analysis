/**
 * /community/about — 비블 커뮤니티 소개
 * 커뮤니티가 무엇을 하는 공간인지, 이용 규칙, 시작 CTA를 한 페이지로 안내한다.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "소개 | 비블 커뮤니티",
};

const FEATURES: { title: string; description: string }[] = [
  {
    title: "실전 Q&A",
    description:
      "채널 운영에서 막히는 지점을 질문하고, 실제로 해본 사람의 답을 받습니다.",
  },
  {
    title: "유튜브 자료 다운로드",
    description:
      "기획 템플릿, 체크리스트 등 비블이 실무에서 쓰는 자료를 내려받습니다.",
  },
  {
    title: "성과 공유",
    description:
      "구독자, 조회수, 매출 변화를 기록하고 서로의 성장 과정을 지켜봅니다.",
  },
  {
    title: "비블 칼럼",
    description:
      "유튜브 알고리즘과 채널 성장 전략을 다룬 비블의 글을 가장 먼저 읽습니다.",
  },
];

const RULES: string[] = [
  "서로 존중하는 말로 대화합니다.",
  "광고성 글과 도배는 예고 없이 삭제됩니다.",
  "커뮤니티 자료의 무단 반출을 금지합니다.",
];

export default function CommunityAboutPage() {
  return (
    <div className="space-y-6">
      {/* 소개 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
          유튜브로 사업을 키우는 사람들의 공간
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-200 lg:text-base">
          총 70만+ 구독자 채널을 운영하는 비블이 만든 커뮤니티입니다. 혼자
          막히던 유튜브 운영을 함께 풀어갑니다.
        </p>
      </section>

      {/* 이곳에서 할 수 있는 것 */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight text-white">
          이곳에서 할 수 있는 것
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <h4 className="text-sm font-bold text-white">{feature.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 규칙 */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight text-white">이용 규칙</h3>
        <ul className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          {RULES.map((rule, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-neutral-200">
              <span className="shrink-0 font-bold text-[#00E5A0]">{i + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/community"
          className="rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-black hover:bg-neutral-200"
        >
          커뮤니티 시작하기
        </Link>
        <Link
          href="/studio"
          className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-neutral-700"
        >
          유튜브 채널 대행 문의
        </Link>
      </section>
    </div>
  );
}
