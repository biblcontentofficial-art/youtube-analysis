import type { Metadata } from "next";
import { OG_DEFAULT, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "1:1 유튜브 컨설팅 | 70만 구독자 비블의 맞춤 코칭",
  description:
    "총 70만+ 구독자 채널을 운영한 비블이 직접 진행하는 1:1 유튜브 컨설팅. 유튜브를 통한 브랜딩과 비즈니스 확장을 개인 맞춤으로 설계합니다.",
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
  alternates: { canonical: "https://bibllab.com/studio/class/consulting" },
  // 공유 이미지는 사이트 기본(1280×720). 세로 8,695px 상세 이미지는 미리보기에서 잘린다.
  // openGraph·twitter 는 얕게 덮어쓰므로 images 를 지우지 않고 OG_DEFAULT 를 펼친다.
  openGraph: {
    ...OG_DEFAULT,
    title: "1:1 유튜브 컨설팅 | 70만 구독자 비블의 맞춤 코칭",
    description:
      "70만+ 구독자 채널을 운영한 비블이 직접 진행하는 1:1 유튜브 컨설팅. 브랜딩과 비즈니스 확장을 개인 맞춤으로.",
    url: "https://bibllab.com/studio/class/consulting",
  },
  twitter: {
    card: "summary_large_image",
    title: "1:1 유튜브 컨설팅 | 비블의 맞춤 코칭",
    description: "70만+ 구독자 비블이 직접 진행하는 1:1 유튜브 컨설팅.",
    images: [OG_IMAGE.url],
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
