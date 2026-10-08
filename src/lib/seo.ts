/**
 * 공유 메타 기본값.
 *
 * Next 메타데이터는 openGraph 객체를 얕게 덮어쓴다. 페이지가 자체 openGraph 를 두면 루트 레이아웃의
 * images 가 상속되지 않아 카카오톡·슬랙 미리보기에 이미지가 빠진다. 그래서 자체 openGraph 를 가진
 * 페이지는 맨 앞에 `...OG_DEFAULT` 를 펼친다(페이지 값이 뒤에서 덮는다).
 *
 *   openGraph: { ...OG_DEFAULT, title: "…", url: "…" }
 */
import type { Metadata } from "next";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

export const OG_IMAGE = {
  url: "https://bibllab.com/og-image.png",
  width: 1280,
  height: 720,
  alt: "비블랩 - 유튜브 키워드·채널 분석 도구",
} as const;

export const OG_DEFAULT = {
  type: "website",
  locale: "ko_KR",
  siteName: "비블랩 (bibl lab)",
  images: [{ ...OG_IMAGE }],
} satisfies OpenGraph;
