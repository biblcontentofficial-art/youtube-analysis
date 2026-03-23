import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 상담 신청 — 비블 TMK STUDIO",
  description:
    "유튜브 채널 기획·촬영·편집·운영 전 과정을 맡겨보세요. 65만+ 구독자를 운영한 비블이 무료로 채널을 진단해드립니다.",
  openGraph: {
    title: "무료 상담 신청 — 비블 TMK STUDIO",
    description:
      "유튜브 채널 기획·촬영·편집·운영 전 과정을 맡겨보세요. 65만+ 구독자를 운영한 비블이 무료로 채널을 진단해드립니다.",
    url: "https://bibllab.com/studio/consulting",
    images: [
      {
        url: "https://bibllab.com/studio/silver-play-button.jpg",
        width: 1200,
        height: 630,
        alt: "비블 TMK STUDIO 무료 상담",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
