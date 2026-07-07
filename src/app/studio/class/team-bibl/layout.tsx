import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1:1 유튜브 컨설팅 | 65만 구독자 비블의 맞춤 코칭",
  description:
    "총 65만+ 구독자 채널을 운영한 비블이 직접 진행하는 1:1 유튜브 컨설팅. 유튜브를 통한 브랜딩과 비즈니스 확장을 개인 맞춤으로 설계합니다.",
  keywords: [
    "1:1 유튜브 컨설팅",
    "유튜브 1대1 컨설팅",
    "비블 컨설팅",
    "유튜브 컨설팅",
    "유튜브 1:1 코칭",
    "유튜브 멘토링",
    "유튜브 브랜딩",
    "유튜브 비즈니스",
    "유튜브 성장 코칭",
    "비블",
    "TMK STUDIO",
  ],
  alternates: { canonical: "https://bibllab.com/studio/class/team-bibl" },
  openGraph: {
    title: "1:1 유튜브 컨설팅 | 65만 구독자 비블의 맞춤 코칭",
    description:
      "65만+ 구독자 채널을 운영한 비블이 직접 진행하는 1:1 유튜브 컨설팅. 브랜딩과 비즈니스 확장을 개인 맞춤으로.",
    url: "https://bibllab.com/studio/class/team-bibl",
    siteName: "비블랩 (bibl lab)",
    images: [
      {
        url: "https://bibllab.com/studio/1on1-consulting/1.png",
        width: 1000,
        height: 1000,
        alt: "1:1 유튜브 컨설팅",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "1:1 유튜브 컨설팅 | 비블의 맞춤 코칭",
    description: "65만+ 구독자 비블이 직접 진행하는 1:1 유튜브 컨설팅.",
    images: ["https://bibllab.com/studio/1on1-consulting/1.png"],
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
