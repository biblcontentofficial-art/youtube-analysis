import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "유튜브 채널 무료 진단·상담 신청 | 비블 TMK STUDIO",
  description:
    "유튜브 채널 기획·촬영·편집·운영을 65만+ 구독자 비블에게 맡겨보세요. 채널 URL만 보내주시면 무료로 진단해드립니다. 카카오톡으로 바로 상담 가능.",
  keywords: [
    "유튜브 채널 대행",
    "유튜브 대행 상담",
    "유튜브 무료 컨설팅",
    "유튜브 채널 진단",
    "유튜브 운영 대행",
    "유튜브 마케팅 상담",
    "비블 상담",
    "TMK STUDIO",
    "유튜브 채널 컨설팅",
  ],
  alternates: { canonical: "https://bibllab.com/studio/consulting" },
  openGraph: {
    title: "유튜브 채널 무료 진단·상담 신청 | 비블 TMK STUDIO",
    description:
      "65만+ 구독자 채널을 운영한 비블이 무료로 진단합니다. 채널 URL만 보내주세요.",
    url: "https://bibllab.com/studio/consulting",
    siteName: "비블랩 (bibl lab)",
    images: [
      {
        url: "https://bibllab.com/studio/silver-play-button.jpg",
        width: 1200,
        height: 630,
        alt: "비블 TMK STUDIO 무료 채널 진단·상담",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "유튜브 채널 무료 진단·상담 신청 | 비블 TMK STUDIO",
    description: "65만+ 구독자 채널을 운영한 비블이 무료로 진단합니다.",
    images: ["https://bibllab.com/studio/silver-play-button.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
