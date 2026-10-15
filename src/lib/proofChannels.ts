/**
 * 홈·/studio·/incubating 의 '비블이 운영·기획한 채널' 실적 데이터.
 *
 * - 구독자 수·채널 아이콘: channels.list 로 실제 값(1 unit).
 * - 대표 영상: 채널 업로드 목록 전체(playlistItems, 50개당 1 unit)를 받아 조회수 높은 순 3개. 쇼츠(3분 이하)는 뺀다
 *   (세로 썸네일이 16:9 칸에서 잘리기 때문). search.list(order=viewCount, 100 unit)보다 싸고 순서가 정확하다.
 * - pinned 가 있는 채널(비블 bibl)은 소유자가 고른 영상을 그 순서대로 쓰고 조회수만 붙인다.
 * - 30일 캐시(unstable_cache, 소유자 지정: 한 달에 한 번). 실패하면 채널마다 아래 고정값으로 돌아간다.
 */
import { unstable_cache } from "next/cache";
import { youtubeGet as ytGet } from "@/lib/breakout";
import { formatCompactKo } from "@/lib/format";

export type ProofVideo = { id: string; title: string; views: number | null };
export type ProofChannel = {
  name: string;
  url: string;
  icon: string;
  field: string;
  subscribers: string;
  videos: ProofVideo[];
};

type ChannelConfig = Omit<ProofChannel, "subscribers" | "videos"> & {
  channelId: string;
  /** 소유자가 고른 대표 영상(순서 유지). 없으면 조회수 높은 순 */
  pinned?: string[];
  /** API 실패 때 보여 줄 값 */
  fallback: { subscribers: string; videos: ProofVideo[] };
};

const DOT = "⁠·⁠";
const SHORTS_MAX_SEC = 180;
const MAX_UPLOAD_PAGES = 20; // 최대 1,000개 영상까지 훑는다
const REVALIDATE = 2592000; // 30일(소유자 지정: 한 달에 한 번)

/** 정적 페이지(ISR) 안에서 부르므로 no-store 대신 30일 재검증 fetch 를 쓴다 */
const youtubeGet = (path: string, params: Record<string, string>) =>
  ytGet(path, params, { next: { revalidate: REVALIDATE, tags: ["proof-channels"] } });

const CHANNELS: ChannelConfig[] = [
  {
    name: "세계유명 골프정보",
    url: "https://www.youtube.com/@세계유명골프정보",
    channelId: "UChrcr99LjxyW8pnQXqagWqA",
    icon: "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
    field: "골프",
    fallback: {
      subscribers: "26.3만",
      videos: [
        { id: "aAtvbqj3sqo", title: "아이언샷 잘 치는법! 10타 줄어드는 경사면 스윙 공식!", views: null },
        { id: "1ye3ibMLPmM", title: "'이것만' 알아도 어프로치 온탕냉탕 안합니다. 타수가 확 줄어드는 어프로치샷 레슨!", views: null },
        { id: "lEY-uRVt5t4", title: "유틸리티 이렇게만 치면 무조건 멀리나갑니다. 힘 주고 치지 마세요.", views: null },
      ],
    },
  },
  {
    name: "영어 키위새",
    url: "https://www.youtube.com/@eng_kiwi",
    channelId: "UCv3aqvZYZM6FUMLqhMO9l6Q",
    icon: "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
    field: "영어 교육",
    fallback: {
      subscribers: "25.3만",
      videos: [
        { id: "neZF9pm228k", title: "비싼 수업 안 들어도 영어를 유창하게 하는 방법", views: null },
        { id: "rf_QOqEqaH8", title: "영어가 한국어처럼 쉽게 될 수 있다? 혼자 영어 하신다면 꼭 보세요", views: null },
        { id: "EsrLJSQ7qgw", title: "현지에서 와장창 깨진 영어, 고정관념 바꾸고 입 트인 공부법", views: null },
      ],
    },
  },
  {
    name: "스윔클래스",
    url: "https://www.youtube.com/@swim_class",
    channelId: "UCWvis47NedoIOVPZx37thkQ",
    icon: "https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s240-c-k-c0x00ffffff-no-rj",
    field: "수영",
    fallback: {
      subscribers: "8.7만",
      videos: [
        { id: "tVhe4wXsn5I", title: "상위권 수영 선수들은 다 이렇게 연습합니다. 부드러운 자유형을 하기 위한 자유형 총정리!", views: null },
        { id: "GQCMrKWtfr8", title: "최소한의 운동으로 진짜 힘 빼고 가볍게 수영 잘하는 요령!", views: null },
        { id: "9p1fSFg7iMg", title: "조금이라도 빨리 알았으면 좋았을 부드러운 자유형 하는 방법", views: null },
      ],
    },
  },
  {
    name: "비블 bibl",
    url: "https://www.youtube.com/@bibl_youtube",
    channelId: "UCP-fDy76kLheskwrmA-b5_w",
    icon: "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
    field: `사업${DOT}마케팅`,
    pinned: ["ceSRoPrXYmo", "bzGfk4kKVv8", "oP3mz3_bURc"],
    fallback: {
      subscribers: "4.5만",
      videos: [
        { id: "ceSRoPrXYmo", title: "이걸 깨닫고 나니 그때부터 유튜브가 폭발적으로 성장했어요!", views: null },
        { id: "bzGfk4kKVv8", title: "유튜버 90%가 이걸 몰라서 결국 접는 거에요", views: null },
        { id: "oP3mz3_bURc", title: "유튜브 시작한 사람 99%가 이걸 몰라서 조회수가 안나오는 겁니다", views: null },
      ],
    },
  },
];

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

function parseDuration(iso: string | undefined): number {
  const m = iso?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

type VideoRow = { id: string; title: string; views: number; seconds: number };

async function videoDetails(ids: string[]): Promise<Map<string, VideoRow>> {
  const out = new Map<string, VideoRow>();
  const pages = await Promise.all(chunk(ids, 50).map((g) =>
    youtubeGet("videos", { part: "snippet,statistics,contentDetails", id: g.join(","), maxResults: "50" })));
  for (const v of pages.flatMap((d) => d?.items ?? [])) {
    out.set(v.id, {
      id: v.id,
      title: v.snippet?.title ?? "",
      views: Number(v.statistics?.viewCount ?? 0),
      seconds: parseDuration(v.contentDetails?.duration),
    });
  }
  return out;
}

async function uploadIds(playlistId: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = "";
  for (let p = 0; p < MAX_UPLOAD_PAGES; p++) {
    const d = await youtubeGet("playlistItems", {
      part: "contentDetails", playlistId, maxResults: "50", ...(pageToken ? { pageToken } : {}),
    });
    if (!d) break;
    for (const it of d.items ?? []) if (it.contentDetails?.videoId) ids.push(it.contentDetails.videoId);
    pageToken = d.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return ids;
}

async function fetchProofChannels(): Promise<ProofChannel[]> {
  const ch = await youtubeGet("channels", {
    part: "snippet,statistics,contentDetails", id: CHANNELS.map((c) => c.channelId).join(","), maxResults: "50",
  });
  const byId = new Map<string, any>((ch?.items ?? []).map((c: any) => [c.id, c]));

  return Promise.all(CHANNELS.map(async (c): Promise<ProofChannel> => {
    const base = { name: c.name, url: c.url, field: c.field };
    const info = byId.get(c.channelId);
    const subsRaw = info && !info.statistics?.hiddenSubscriberCount ? Number(info.statistics?.subscriberCount ?? 0) : 0;
    const icon = info?.snippet?.thumbnails?.high?.url ?? info?.snippet?.thumbnails?.medium?.url ?? c.icon;
    const subscribers = subsRaw > 0 ? formatCompactKo(subsRaw) : c.fallback.subscribers;

    try {
      let videos: ProofVideo[] = [];
      if (c.pinned) {
        const d = await videoDetails(c.pinned);
        videos = c.pinned.map((id, i) => {
          const v = d.get(id);
          return { id, title: v?.title ?? c.fallback.videos[i]?.title ?? "", views: v ? v.views : null };
        });
      } else {
        const uploads = info?.contentDetails?.relatedPlaylists?.uploads;
        if (uploads) {
          const d = await videoDetails(await uploadIds(uploads));
          videos = [...d.values()]
            .filter((v) => v.seconds > SHORTS_MAX_SEC)
            .sort((a, b) => b.views - a.views)
            .slice(0, 3)
            .map(({ id, title, views }) => ({ id, title, views }));
        }
      }
      return { ...base, icon, subscribers, videos: videos.length === 3 ? videos : c.fallback.videos };
    } catch {
      return { ...base, icon, subscribers, videos: c.fallback.videos };
    }
  }));
}

/** 한 달(30일)에 한 번 새로 받는다(소유자 지정). 날짜(YYYY.MM)는 받은 시점 기준 */
export const getProofChannels = unstable_cache(
  async () => {
    const channels = await fetchProofChannels();
    // 하나라도 실시간 값을 못 받았으면 저장하지 않는다(던지면 캐시에 남지 않고, 화면은 이번만 고정값)
    if (channels.some((c) => c.videos.some((v) => v.views == null))) throw new Error("proof channels incomplete");
    return { channels, fetchedAt: new Date().toISOString() };
  },
  ["proof-channels-v1"],
  { revalidate: REVALIDATE, tags: ["proof-channels"] },
);

/** API 를 부르지 않는 고정값(미리보기·실패 대비) */
export const PROOF_CHANNELS_FALLBACK: ProofChannel[] = CHANNELS.map((c) => ({
  name: c.name, url: c.url, icon: c.icon, field: c.field, subscribers: c.fallback.subscribers, videos: c.fallback.videos,
}));
