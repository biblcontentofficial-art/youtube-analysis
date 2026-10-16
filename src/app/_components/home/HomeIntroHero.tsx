/**
 * 홈 첫 화면 #intro(비블랩 소개, 2026-10-16 소유자 확정 안 C 실적 중심).
 * 큰 숫자 70만+ → 제목·설명(하는 일 3가지) → 버튼 2개(서비스 보기 / 트렌드 서치) → 채널 4곳 줄.
 * 채널 줄은 HomeChannels 와 같은 실시간 값(src/lib/proofChannels.ts, 30일 캐시). 실패하면 고정값.
 * 70만+ 는 표시한 4곳 외 운영·기획 채널을 포함한 값이라 숫자 아래에 그 사실을 적는다(4곳 합계와 다르다).
 * 채널 아이콘은 콘텐츠라 '첫 화면 인물 사진 없음' 규칙 밖이다.
 */
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import ChannelAvatar from "./ChannelAvatar";
import { getProofChannels, PROOF_CHANNELS_FALLBACK } from "@/lib/proofChannels";

/** 가운뎃점에서 줄이 갈리지 않게 앞뒤에 WORD JOINER(U+2060) */
const DOT = "⁠·⁠";

/** 채널 줄의 한 줄 설명. 없으면 데이터의 분야 값 */
const CHANNEL_NOTE: Record<string, string> = {
  "세계유명 골프정보": "골프",
  "영어 키위새": "영어 교육",
  스윔클래스: "수영 교육",
  "비블 bibl": "1인 사업가 콘텐츠 비즈니스",
};

/**
 * 채널 칸 테두리·여백: 1024 미만 2열(짝수 칸 왼쪽 선, 3번째부터 위 선), 1024 이상 4열(첫 칸 빼고 왼쪽 선)
 */
const CHANNEL_CELL = [
  "flex min-w-0 flex-col border-line py-5 pr-4",
  "even:border-l even:pl-4 even:pr-0 nth-[n+3]:border-t",
  "lg:border-l lg:p-6 lg:even:px-6 lg:nth-[n+3]:border-t-0 lg:first:border-l-0 lg:first:pl-0",
].join(" ");

export default async function HomeIntroHero() {
  const live = await getProofChannels().catch(() => null);
  const channels = live?.channels ?? PROOF_CHANNELS_FALLBACK;
  const asOf = new Date(new Date(live?.fetchedAt ?? Date.now()).getTime() + 9 * 3600_000);
  const ym = `${asOf.getUTCFullYear()}.${String(asOf.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <section id="intro" aria-labelledby="intro-title" className="border-b border-line">
      <div className="mx-auto max-w-wide px-6 pb-14 pt-8 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-14">
        <SectionHeader caption={`비블랩${DOT}유튜브 컨설팅과 채널 운영`} label="BIBL LAB" className="mb-8 md:mb-12" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-6">
          {/* 결과 먼저: 큰 숫자. 보이는 숫자는 장식, 스크린 리더는 sr-only 문장 */}
          <div className="lg:col-span-6">
            <p className="tnum text-[88px] font-extrabold leading-[0.9] tracking-[-0.03em] sm:text-[120px] lg:text-[148px] xl:text-[176px]">
              <span aria-hidden="true">
                70만<span className="text-silver">+</span>
              </span>
              <span className="sr-only">총 구독자 70만 명 이상</span>
            </p>
            <p className="mt-4 text-ui text-fg-3 lg:mt-5 lg:text-body">{`비블이 운영${DOT}기획한 채널 총 구독자`}</p>
            <p className="mt-1 text-caption text-fg-4">
              <span className="whitespace-nowrap">{`아래 채널 4곳 외 운영${DOT}기획 채널 포함`}</span>{" "}
              <span className="whitespace-nowrap">
                · <time dateTime="2026-10">2026.10</time>
              </span>
            </p>
          </div>

          <div className="lg:col-span-6">
            <h1 id="intro-title" className="text-h3 text-silver sm:text-[40px] sm:leading-[1.2] lg:text-h1">
              <span className="block">채널 4개를 직접 키운 비블이</span>{" "}
              <span className="block">
                <span className="text-accent">여러분의 채널</span>을 키웁니다
              </span>
            </h1>
            <p className="mt-4 max-w-[34em] text-body text-fg-2 lg:mt-5 lg:text-lead">
              {`골프${DOT}영어${DOT}수영${DOT}비즈니스 채널을 직접 기획하고 운영합니다. 비블랩은 그 방법으로 1:1 컨설팅, 채널 대행, 브랜드 인큐베이팅을 합니다.`}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-8">
              <Link href="#services" className={buttonClass({ size: "lg" })}>
                비블랩 서비스 보기
              </Link>
              <Link href="/trend-search" className={buttonClass({ variant: "secondary", size: "lg" })}>
                유튜브 트렌드 서치
              </Link>
            </div>
          </div>
        </div>

        {/* 채널 4곳 줄: 아바타(채널 아이콘) · 채널명 · 한 줄 설명 · 구독자 */}
        <div className="mt-12 lg:mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-caption text-fg-3">
              {`직접 운영${DOT}기획하는 채널 4곳 · YouTube 공개 구독자 수 · `}
              <time dateTime={ym.replace(".", "-")}>{ym}</time>
            </p>
            <a
              href="#channels"
              className="-my-3 inline-flex h-11 shrink-0 items-center gap-1 text-caption font-semibold text-fg-2 transition-colors duration-150 hover:text-fg"
            >
              채널 실적 보기 <span aria-hidden="true">→</span>
            </a>
          </div>
          <ul className="mt-2 grid grid-cols-2 border-t border-line lg:grid-cols-4">
            {channels.map((c) => (
              <li key={c.name} className={CHANNEL_CELL}>
                <div className="flex items-center gap-2.5">
                  <ChannelAvatar src={c.icon} size={40} className="size-8 sm:size-10" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-bold sm:text-ui">{c.name}</p>
                    <p className="text-caption text-fg-3">{CHANNEL_NOTE[c.name] ?? c.field}</p>
                  </div>
                </div>
                <p className="mt-auto flex items-baseline gap-1.5 pt-4">
                  <span className="tnum text-[28px] font-extrabold leading-none tracking-[-0.03em] lg:text-[36px]">{c.subscribers}</span>
                  <span className="text-caption text-fg-3">구독자</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
