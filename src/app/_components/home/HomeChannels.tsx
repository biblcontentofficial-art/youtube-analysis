/* eslint-disable @next/next/no-img-element -- 대표 영상 썸네일은 YouTube 원본 URL, 실버 플레이 버튼은 정적 사진(시안과 같은 크기) */
/**
 * 채널 실적 부품(DESIGN 6.28). 홈 #channels 가 쓰고, /studio(C07)·/incubating(C09)이 props 로 머리 문구만 바꿔 다시 쓴다.
 * - 640 이상: 채널마다 왼쪽 4칸(아이콘 44px · 채널명(외부 링크 표시) · 분야 · 구독자) + 오른쪽 8칸 대표 영상 3장(1024 미만 2장)
 * - 640 미만: 4곳 2열 격자(28px 숫자) + 대표 영상 8장 가로 스냅 목록(aria-label '대표 영상')
 * - 이어서 실버 플레이 버튼 사진(5칸) + 큰 지표 7억+(7칸). showRevenue={false} 로 뺄 수 있다
 * 숫자는 확인된 사실만(6.14, layout-F/rationale.md 10장): 구독자 수는 공개 값 2026.10 기준.
 * 채널 아이콘은 콘텐츠라 '첫 화면 인물 사진 없음' 규칙 밖이다.
 */
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import ChannelAvatar from "./ChannelAvatar";

type Video = { id: string; title: string };
export type ProofChannel = {
  name: string;
  url: string;
  icon: string;
  field: string;
  subscribers: string;
  videos: [Video, Video, Video];
};

const DOT = "⁠·⁠";

export const PROOF_CHANNELS: ProofChannel[] = [
  {
    name: "세계유명 골프정보",
    url: "https://www.youtube.com/@세계유명골프정보",
    icon: "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
    field: "골프",
    subscribers: "25.8만",
    videos: [
      { id: "9hndIlWLWaM", title: "드라이버 이게 전부입니다, 가장 쉽게 잘 치는 법" },
      { id: "XaT3VzlTnoI", title: "멀리 치고 싶다면 백스윙 회전 하지 마세요" },
      { id: "cBlr5P0_KcM", title: "아이언 툭 쳐서 가볍게 150m 보내는 방법" },
    ],
  },
  {
    name: "영어 키위새",
    url: "https://www.youtube.com/@eng_kiwi",
    icon: "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
    field: "영어 교육",
    subscribers: "24.5만",
    videos: [
      { id: "-jWdORm55Kc", title: "외우지 말고 그냥 보세요, 영어말하기 코어동사 5개" },
      { id: "JHeJYy_A0aw", title: "퇴직후 영어공부 3년, 60대 엄마 말하기 진단" },
      { id: "4F2kGFDUo5M", title: "이거였구나, 영어 전치사 제대로 쓰는 방법" },
    ],
  },
  {
    name: "스윔클래스",
    url: "https://www.youtube.com/@swim_class",
    icon: "https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s240-c-k-c0x00ffffff-no-rj",
    field: "수영",
    subscribers: "8.57만",
    videos: [
      { id: "_5ELU7Bx_J4", title: "발차기가 이런거였어? 편안한 발차기 꿀팁" },
      { id: "ouwAdBTIJwA", title: "내가 이걸 몰라서 수영할 때 숨이 찼구나" },
      { id: "yaw140V8dcM", title: "자유형 잘하고 싶다면 이대로만 해보세요" },
    ],
  },
  {
    name: "비블 bibl",
    url: "https://www.youtube.com/@bibl_youtube",
    icon: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
    field: `사업${DOT}마케팅`,
    subscribers: "4.2만",
    videos: [
      { id: "N_816X7TFRU", title: "유튜브 5년동안 했더니 달라진 놀라운 변화" },
      { id: "Bnp0HyZXOAk", title: "돈 내고 쓰지 마세요, 쇼츠제작과 업로드 자동화" },
      { id: "0pyLmSNThh4", title: "에어비앤비 vs 단기임대, 이 순서대로만 따라하세요" },
    ],
  },
];

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

export default function HomeChannels({
  id = "channels",
  caption = `비블이 운영${DOT}기획한 채널`,
  label = "CHANNELS",
  lead = "말이 아닌,",
  title = "결과로 증명합니다",
  channels = PROOF_CHANNELS,
  showRevenue = true,
}: {
  id?: string;
  caption?: ReactNode;
  label?: string;
  lead?: ReactNode;
  title?: ReactNode;
  channels?: ProofChannel[];
  showRevenue?: boolean;
}) {
  const headingId = `${id}-title`;
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
          {`대표 채널 ${channels.length}곳 · 공개 구독자 수 · `}
          <time dateTime="2026-10">2026.10</time>
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
                <span className="mt-2 block truncate text-caption text-fg-3">{v.channel}</span>
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
                    className={i === 2 ? "relative hidden overflow-hidden rounded-lg bg-surface-2 lg:block" : "relative block overflow-hidden rounded-lg bg-surface-2"}
                  >
                    <VideoThumb video={v} sizes="(min-width: 1024px) 257px, 45vw" />
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
