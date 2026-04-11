import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "팀비블 : 유튜브를 책임지고 실행하는 1:1 컨설팅 프로그램",
  description:
    "비블의 40주 1:1 유튜브 컨설팅. 기획부터 촬영·편집·업로드·분석까지, 총 65만 구독자를 운영한 비블이 직접 코칭합니다. 월 390,000원.",
  keywords: [
    "팀비블", "비블 컨설팅", "유튜브 컨설팅", "유튜브 코칭",
    "유튜브 강의", "1:1 유튜브", "유튜버 교육", "비블",
  ],
  alternates: { canonical: "https://bibllab.com/studio/class/team-bibl" },
  openGraph: {
    title: "팀비블 : 유튜브 1:1 컨설팅 프로그램 | 비블",
    description:
      "40주 커리큘럼, 160강. 비블이 직접 코칭하는 유튜브 성장 프로그램.",
    url: "https://bibllab.com/studio/class/team-bibl",
    images: [
      {
        url: "https://bibllab.com/studio/team-bibl/hero-thumbnail.png",
        width: 900,
        height: 505,
        alt: "팀비블 유튜브 프로젝트",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function TeamBiblLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
