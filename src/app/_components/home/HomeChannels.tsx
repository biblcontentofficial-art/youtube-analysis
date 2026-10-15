/* eslint-disable @next/next/no-img-element -- 대표 영상 썸네일은 YouTube 원본 URL, 실버 플레이 버튼은 정적 사진(시안과 같은 크기) */
/**
 * 채널 실적 부품(DESIGN 6.28). 홈 #channels 가 쓰고, /studio(C07)·/incubating(C09)이 props 로 머리 문구만 바꿔 다시 쓴다.
 * - 640 이상: 채널마다 왼쪽 4칸(아이콘 44px · 채널명(외부 링크 표시) · 분야 · 구독자) + 오른쪽 8칸 대표 영상 3장(1024 미만 2장)
 * - 640 미만: 4곳 2열 격자(28px 숫자) + 대표 영상 8장 가로 스냅 목록(aria-label '대표 영상')
 * - 이어서 실버 플레이 버튼 사진(5칸) + 큰 지표 7억+(7칸). showRevenue={false} 로 뺄 수 있다
 * 숫자는 YouTube 공개 값을 실시간으로 받는다(src/lib/proofChannels.ts, 6시간 캐시): 구독자 수, 채널별 조회수 높은 영상 3개와 조회수.
 * 비블 bibl 은 소유자가 고른 영상 3개. 실패하면 고정값.
 * 채널 아이콘은 콘텐츠라 '첫 화면 인물 사진 없음' 규칙 밖이다.
 */
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import ChannelAvatar from "./ChannelAvatar";

import { getProofChannels, PROOF_CHANNELS_FALLBACK, type ProofChannel, type ProofVideo } from "@/lib/proofChannels";
import { formatCompactKo } from "@/lib/format";

export type { ProofChannel };
type Video = ProofVideo;

const DOT = "⁠·⁠";

/** 다른 페이지가 이름으로 골라 쓰는 고정값(실시간 값은 HomeChannels 가 직접 받는다) */
export const PROOF_CHANNELS = PROOF_CHANNELS_FALLBACK;

const viewsLabel = (v: Video) => (v.views == null ? null : `조회수 ${formatCompactKo(v.views)}회`);

const ytThumb = (id: string, size: "mq" | "sd" | "maxres") =>
  `https://i.ytimg.com/vi/${id}/${size === "mq" ? "mqdefault" : size === "sd" ? "sddefault" : "maxresdefault"}.jpg`;

function VideoThumb({ video, sizes, className = "" }: { video: Video; sizes: string; className?: string }) {
  return (
    <img
      src={ytThumb(video.id, "mq")}
      srcSet={`${ytThumb(video.id, "mq")} 320w, ${ytThumb(video.id, "sd")} 640w, ${ytThumb(video.id, "maxres")} 1280w`}
      sizes={sizes}
      width={320}
      height={180}
      alt={video.title}
      className={`aspect-video w-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

function ExtIcon() {
  return (
    <svg className="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export default async function HomeChannels({
  id = "channels",
  caption = `비블이 운영${DOT}기획한 채널`,
  label = "CHANNELS",
  lead = "말이 아닌,",
  title = "결과로 증명합니다",
  channels: channelsProp,
  only,
  showRevenue = true,
}: {
  id?: string;
  caption?: ReactNode;
  label?: string;
  lead?: ReactNode;
  title?: ReactNode;
  channels?: ProofChannel[];
  /** 실시간 데이터에서 이 이름의 채널만 보여 준다 */
  only?: string[];
  showRevenue?: boolean;
}) {
  const headingId = `${id}-title`;
  const live = channelsProp ? null : await getProofChannels().catch(() => null);
  const all = channelsProp ?? live?.channels ?? PROOF_CHANNELS_FALLBACK;
  const channels = only ? all.filter((c) => only.includes(c.name)) : all;
  const asOf = new Date(live?.fetchedAt ?? Date.now());
  const asOfKst = new Date(asOf.getTime() + 9 * 3600_000);
  const ym = `${asOfKst.getUTCFullYear()}.${String(asOfKst.getUTCMonth() + 1).padStart(2, "0")}`;
  const mobileVideos = channels.flatMap((c) => c.videos.slice(0, 2).map((v) => ({ ...v, channel: c.name })));

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-wide px-6 py-16 md:py-24 lg:px-8">
        <SectionHeader caption={caption} label={label} />
        <h2 id={headingId} className="text-h3 md:text-h1">
          <span className="block text-fg-3">{lead}</span>
          <span className="block">{title}</span>
        </h2>

        <p className="mt-10 text-caption text-fg-3 md:mt-12">
          {`대표 채널 ${channels.length}곳 · YouTube 공개 구독자 수·조회수 · `}
          <time dateTime={ym.replace(".", "-")}>{ym}</time>
        </p>

        {/* 640 미만: 2열 격자 + 대표 영상 가로 스냅 목록 */}
        <div className="mt-4 sm:hidden">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 border-t border-line pt-5">
            {channels.map((c) => (
              <li key={c.name} className="min-w-0">
                <div className="flex items-center gap-2">
                  <ChannelAvatar src={c.icon} size={32} className="size-8" />
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-my-3 inline-flex min-h-11 min-w-0 items-center text-body-sm font-bold leading-[1.35] hover:underline hover:underline-offset-4"
                  >
                    <span>
                      {c.name} <ExtIcon />
                      <span className="sr-only"> (새 창)</span>
                    </span>
                  </a>
                </div>
                <p className="tnum mt-3 text-[28px] font-extrabold leading-none tracking-[-0.03em]">{c.subscribers}</p>
                <p className="mt-1.5 text-caption text-fg-3">{`${c.field} · 구독자`}</p>
              </li>
            ))}
          </ul>
          <div
            aria-label="대표 영상"
            role="region"
            className="-mx-6 mt-7 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 scrollbar-hide"
          >
            {mobileVideos.map((v) => (
              <a key={v.id} href={watchUrl(v.id)} target="_blank" rel="noopener noreferrer" className="relative block w-[64%] shrink-0 snap-start">
                <span className="block overflow-hidden rounded-lg bg-surface-2">
                  <VideoThumb video={v} sizes="64vw" />
                </span>
                <span className="sr-only"> (새 창)</span>
                <span className="mt-2 block truncate text-caption text-fg-3">
                  {v.channel}
                  {viewsLabel(v) && <span className="tnum"> · {viewsLabel(v)}</span>}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* 640 이상: 채널마다 한 줄 */}
        <ol className="mt-4 hidden border-b border-line sm:block">
          {channels.map((c) => (
            <li key={c.name} className="grid gap-5 border-t border-line py-7 lg:grid-cols-12 lg:gap-6 lg:py-9">
              <div className="flex flex-col gap-4 lg:col-span-4 lg:justify-between">
                <div className="flex items-center gap-3">
                  <ChannelAvatar src={c.icon} size={48} className="size-11 lg:size-12" />
                  <div className="min-w-0">
                    <p className="text-lead font-extrabold leading-tight">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="-my-3 inline-block py-3 hover:underline hover:underline-offset-4">
                        {c.name} <ExtIcon />
                        <span className="sr-only"> (새 창)</span>
                      </a>
                    </p>
                    <p className="mt-1 text-caption text-fg-3">{c.field}</p>
                  </div>
                </div>
                <p className="flex items-baseline gap-2 lg:block">
                  <span className="tnum block text-[28px] font-extrabold leading-none tracking-[-0.03em] lg:text-[36px]">{c.subscribers}</span>
                  <span className="block text-caption text-fg-3 lg:mt-1.5">구독자</span>
                </p>
              </div>
              <div className="grid grid-cols-2 content-start gap-2 self-center lg:col-span-8 lg:grid-cols-3 lg:gap-4">
                {c.videos.map((v, i) => (
                  <a
                    key={v.id}
                    href={watchUrl(v.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={i === 2 ? "group hidden lg:block" : "group block"}
                  >
                    <span className="block overflow-hidden rounded-lg bg-surface-2">
                      <VideoThumb video={v} sizes="(min-width: 1024px) 257px, 45vw" className="transition-opacity duration-150 group-hover:opacity-90" />
                    </span>
                    {viewsLabel(v) && <span className="tnum mt-2 block text-caption text-fg-3">{viewsLabel(v)}</span>}
                    <span className="sr-only"> (새 창)</span>
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <p className="tnum mt-4 text-caption text-fg-3">{`표시한 ${channels.length}곳 외 운영${DOT}기획 채널 포함 총 구독자 70만+`}</p>

        {showRevenue && (
          <div className="mt-14 grid grid-cols-1 gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-6">
            <figure className="lg:col-span-5">
              <div className="overflow-hidden rounded-panel border border-line bg-surface-2">
                <img
                  src="/home/silver-play-button-neutral.jpg"
                  width={1600}
                  height={1200}
                  alt="세계유명 골프정보가 받은 유튜브 실버 플레이 버튼"
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-3 text-caption text-fg-3">
                <span className="font-semibold text-fg-1">유튜브가 직접 수여한 실버 플레이 버튼.</span> 세계유명 골프정보 10만&nbsp;구독자 달성
              </figcaption>
            </figure>
            <div className="flex flex-col justify-end lg:col-span-7 lg:pl-10">
              <p className="tnum text-[44px] font-extrabold leading-none tracking-[-0.035em] sm:text-[48px] xl:text-[56px]">
                <span aria-hidden="true">
                  7억<span className="text-silver">+</span>
                </span>
                <span className="sr-only">7억 원 이상</span>
              </p>
              <p className="mt-2.5 text-caption text-fg-3 lg:text-ui">골프 쇼핑몰 연 매출</p>
              <h3 className="mt-8 text-h4 font-extrabold lg:mt-10 lg:text-h3">채널 성과에서 끝나지 않습니다</h3>
              <p className="mt-3 max-w-[34em] text-body text-fg-2 lg:text-lead">
                {`세계유명 골프정보의 조회수는 쇼핑몰 매출로 이어졌습니다. 다양한 채널을 직접 운영${DOT}기획하고 사업으로 연결한 실전 경험을 그대로 여러분의 채널에 적용합니다.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
