import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "팀비블 1:1 유튜브 컨설팅 | 65만 구독자 비블의 40주 코칭",
  description:
    "총 65만+ 구독자 채널을 운영한 비블이 직접 코칭하는 40주 1:1 유튜브 컨설팅. 매주 30분 1:1 미팅 + 160강 VOD + 비블 VIP 오프라인 커뮤니티. 월 310,000원~.",
  keywords: [
    "팀비블",
    "비블 컨설팅",
    "유튜브 컨설팅",
    "유튜브 1:1 코칭",
    "유튜브 강의",
    "유튜브 교육",
    "유튜버 교육",
    "유튜브 1:1 컨설팅",
    "유튜브 1대1 컨설팅",
    "유튜브 멘토링",
    "유튜브 채널 키우기 강의",
    "유튜브 성장 코칭",
    "유튜브 마스터 클래스",
    "비블",
    "TMK STUDIO",
  ],
  alternates: { canonical: "https://bibllab.com/studio/class/team-bibl" },
  openGraph: {
    title: "팀비블 1:1 유튜브 컨설팅 | 65만 구독자 비블의 40주 코칭",
    description:
      "매주 30분 1:1 비블 컨설팅 + 160강 VOD + 비블 VIP 오프라인 커뮤니티. 검증된 노하우로 채널을 성장시킵니다.",
    url: "https://bibllab.com/studio/class/team-bibl",
    siteName: "비블랩 (bibl lab)",
    images: [
      {
        url: "https://bibllab.com/studio/team-bibl/hero-thumbnail.png",
        width: 900,
        height: 505,
        alt: "팀비블 1:1 유튜브 컨설팅",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "팀비블 1:1 유튜브 컨설팅 | 비블의 40주 코칭",
    description: "매주 30분 1:1 비블 컨설팅 + 160강 VOD + VIP 커뮤니티.",
    images: ["https://bibllab.com/studio/team-bibl/hero-thumbnail.png"],
  },
  robots: { index: true, follow: true },
};

export default function TeamBiblLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
