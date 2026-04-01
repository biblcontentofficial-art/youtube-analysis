// 유료 유저 전용 키: YOUTUBE_API_KEY_PAID_1 ~ YOUTUBE_API_KEY_PAID_10
// 무료 유저 키: YOUTUBE_API_KEY, YOUTUBE_API_KEY_2, ...
// 무료 키가 모두 소진되면 유료 키로 자동 폴백 (신규 회원 오류 방지)
function getAllApiKeys(paid: boolean = false): string[] {
  const freeKeys: string[] = [];
  const paidKeys: string[] = [];

  if (process.env.YOUTUBE_API_KEY) freeKeys.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`];
    if (k) freeKeys.push(k);
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`];
    if (k) paidKeys.push(k);
  }

  // 유료 유저: 유료 키 우선, 소진 시 무료 키로 폴백
  // 무료 유저: 무료 키 우선, 소진 시 유료 키로 폴백 (신규 회원 오류 방지)
  const keys = paid ? [...paidKeys, ...freeKeys] : [...freeKeys, ...paidKeys];
  if (!keys.length) throw new Error("YouTube API Key Missing");
  return keys;
}

function formatCount(count: string | number) {
  const num = typeof count === "string" ? parseInt(count) : count;
  if (!num) return "0";
  return num.toLocaleString(); 
}

function parseDuration(duration: string): number {
  if (!duration || duration === 'P0D') return 99999;
  const days = duration.match(/(\d+)D/);
  const hours = duration.match(/(\d+)H/);
  const minutes = duration.match(/(\d+)M/);
  const seconds = duration.match(/(\d+)S/);
  let totalSeconds = 0;
  if (days) totalSeconds += parseInt(days[1]) * 86400;
  if (hours) totalSeconds += parseInt(hours[1]) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
  if (seconds) totalSeconds += parseInt(seconds[1]);
  return totalSeconds;
}

// 알고리즘 탑승 확률 계산 (0~95%)
function calculateAlgorithmScore(
  viewCount: number,
  subscriberCount: number,
  publishedAt: string,
  performanceRatioRaw: number
): number {
  const now = new Date();
  const pubDate = new Date(publishedAt);
  const hoursDiff = Math.max((now.getTime() - pubDate.getTime()) / (1000 * 3600), 1);
  const daysDiff = hoursDiff / 24;

  const vph = viewCount / hoursDiff;

  let score = 0;

  // 조회 속도 (최대 35점)
  if (vph > 10000) score += 35;
  else if (vph > 3000) score += 28;
  else if (vph > 1000) score += 20;
  else if (vph > 300) score += 12;
  else if (vph > 100) score += 6;
  else score += 2;

  // 아웃라이어 비율 (최대 35점)
  if (performanceRatioRaw >= 5.0) score += 35;
  else if (performanceRatioRaw >= 3.0) score += 28;
  else if (performanceRatioRaw >= 1.5) score += 18;
  else if (performanceRatioRaw >= 0.8) score += 10;
  else score += 2;

  // 최신성 보너스 (최대 30점)
  if (daysDiff <= 1) score += 30;
  else if (daysDiff <= 3) score += 25;
  else if (daysDiff <= 7) score += 18;
  else if (daysDiff <= 30) score += 10;
  else if (daysDiff <= 90) score += 4;

  return Math.min(Math.round(score), 95);
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds >= 99999) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function isRealShorts(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD", 
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    return res.status === 200;
  } catch (e) { return false; }
}

function calculatePerformanceScore(viewCount: number, subscriberCount: number, publishedAt: string) {
  const now = new Date();
  const pubDate = new Date(publishedAt);
  let hoursDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
  if (hoursDiff < 1) hoursDiff = 1;

  const vph = viewCount / hoursDiff;
  const safeSubCount = subscriberCount > 0 ? subscriberCount : 1000;
  const viewToSubRatio = viewCount / safeSubCount;

  let score = 0;

  if (vph > 3000) score += 5;       
  else if (vph > 1000) score += 4;   
  else if (vph > 300) score += 3;    
  else if (vph > 100) score += 2;    

  if (viewToSubRatio > 1.0) score += 5;      
  else if (viewToSubRatio > 0.5) score += 4; 
  else if (viewToSubRatio > 0.3) score += 2; 
  else if (viewToSubRatio > 0.1) score += 1; 

  if (hoursDiff < 24) score += 1;

  return Math.min(score, 10);
}

function determineBadge(score: number): "Good" | "Normal" | "Bad" {
  if (score >= 5) return "Good";     
  if (score >= 3) return "Normal";   
  return "Bad";                      
}

function getScoreValue(scoreLabel: "Good" | "Normal" | "Bad"): number {
  if (scoreLabel === "Good") return 3;
  if (scoreLabel === "Normal") return 2;
  return 1;
}

// [수정] 정렬용 숫자(raw)도 반환하도록 변경
function calculatePerformanceRatio(viewCount: number, channelInfo: any) {
  const channelViewCount = parseInt(channelInfo?.statistics?.viewCount || "0");
  const channelVideoCount = parseInt(channelInfo?.statistics?.videoCount || "1");
  
  const avgViews = channelVideoCount > 0 ? channelViewCount / channelVideoCount : 1;
  
  if (avgViews === 0) return { ratio: "-", raw: 0, color: "text-gray-500" };

  const ratio = viewCount / avgViews;
  const ratioStr = ratio.toFixed(1) + "x"; 

  let color = "text-gray-500";
  if (ratio >= 3.0) color = "text-purple-400"; 
  else if (ratio >= 1.5) color = "text-red-400"; 
  else if (ratio >= 0.8) color = "text-green-400"; 
  else color = "text-gray-500"; 

  return { ratio: ratioStr, raw: ratio, color };
}

export interface ChannelResult {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  subscriberCountFormatted: string;
  videoCount: number;
  viewCount: number;
  avgViewsPerVideo: number;
  avgViewsFormatted: string;
  customUrl?: string;
  country?: string;
  publishedAt: string;
  topicTags: string[]; // 카테고리 태그 (YouTube topicDetails)
}

// Wikipedia URL → 한국어 카테고리 태그 매핑
const TOPIC_MAP: Record<string, string> = {
  Sport: "스포츠", Golf: "골프", Football: "풋볼", Soccer: "축구",
  Basketball: "농구", Baseball: "야구", Tennis: "테니스", Swimming: "수영",
  Fitness: "피트니스", Physical_fitness: "운동/건강", Yoga: "요가",
  Entertainment: "엔터테인먼트", Music: "음악", Film: "영화", Television_program: "TV/방송",
  Comedy: "코미디", Animation: "애니메이션",
  Gaming: "게임", Video_game_culture: "게임", Electronic_sports: "e스포츠",
  Food: "음식", Cooking: "요리",
  Travel: "여행", Tourism: "여행",
  Technology: "테크", Consumer_electronics: "전자기기",
  Fashion: "패션", Beauty: "뷰티", Lifestyle_sociology: "라이프스타일",
  Pets: "반려동물", Knowledge: "지식/교육", Education: "교육",
  Automotive: "자동차", Vehicle: "자동차",
  Finance: "경제/투자", Business: "비즈니스", Entrepreneurship: "창업",
  Health: "건강", Medicine: "의학",
  Politics: "정치", Society: "사회", News: "뉴스",
  Religion: "종교", Spirituality: "영성",
  Art: "예술", Craft: "공예", DIY: "DIY",
  Nature: "자연", Environment: "환경",
};

function parseTopicTags(topicCategories: string[] | undefined): string[] {
  if (!topicCategories?.length) return [];
  const tags: string[] = [];
  for (const url of topicCategories) {
    const slug = url.split("/wiki/").pop() ?? "";
    const label = TOPIC_MAP[slug] ?? TOPIC_MAP[slug.replace(/_/g, "")] ?? null;
    if (label && !tags.includes(label)) tags.push(label);
    if (tags.length >= 3) break;
  }
  return tags;
}

export async function searchChannels(query: string, isPaid = false): Promise<{
  items: ChannelResult[];
  error?: "quota_exceeded" | "api_error";
}> {
  if (!query) return { items: [] };

  let apiKeys: string[];
  try {
    apiKeys = getAllApiKeys(isPaid);
  } catch {
    return { items: [], error: "api_error" };
  }

  // Redis 캐시 확인 (24h TTL)
  const { cacheGet, cacheSet, channelSearchCacheKey, TTL } = await import("./cache");
  const cacheKey = channelSearchCacheKey(query);
  const cached = await cacheGet<ChannelResult[]>(cacheKey);
  if (cached) return { items: cached };

  let activeKeyIndex = 0;

  while (activeKeyIndex < apiKeys.length) {
    const apiKey = apiKeys[activeKeyIndex];
    try {
      // ── Step 1: 키워드 관련 영상 검색 (type=video) ──────────────────────────
      // 채널명 매칭이 아닌, 해당 주제의 영상을 만드는 채널을 찾기 위해
      // video 검색 후 channelId를 추출합니다.
      const videoSearchUrl =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet` +
        `&q=${encodeURIComponent(query)}` +
        `&type=video` +
        `&maxResults=50` +
        `&relevanceLanguage=ko` +
        `&key=${apiKey}`;
      const videoRes = await fetch(videoSearchUrl, { cache: "no-store" });

      if (!videoRes.ok) {
        const errBody = await videoRes.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || "";
        const reason0 = errBody?.error?.errors?.[0]?.reason ?? "";
        const domain0 = errBody?.error?.errors?.[0]?.domain ?? "";

        const isQuotaError = videoRes.status === 403 && (
          errMsg.toLowerCase().includes("quota") ||
          reason0.toLowerCase().includes("quota") ||
          domain0.toLowerCase().includes("quota") ||
          reason0 === "quotaExceeded" ||
          reason0 === "dailyLimitExceeded"
        );
        const isBadKey =
          videoRes.status === 400 || videoRes.status === 401 ||
          reason0 === "badRequest" || reason0 === "keyInvalid" ||
          errMsg.toLowerCase().includes("not valid");

        if (isQuotaError || isBadKey) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { items: [], error: isQuotaError ? "quota_exceeded" : "api_error" };
        }
        if (videoRes.status === 403) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { items: [], error: "quota_exceeded" };
        }
        return { items: [], error: "api_error" };
      }

      const videoData = await videoRes.json();
      // 실측: 채널 검색용 search.list 기록
      import("./metrics").then(({ trackYtApi }) => trackYtApi("search")).catch(() => {});
      if (!videoData.items?.length) return { items: [] };

      // ── Step 2: 채널 ID 빈도 집계 (많이 나올수록 해당 주제 전문 채널) ──────
      const channelFreq = new Map<string, number>();
      for (const item of videoData.items) {
        const cid = item.snippet?.channelId;
        if (cid) channelFreq.set(cid, (channelFreq.get(cid) ?? 0) + 1);
      }
      // 빈도 내림차순 정렬 후 상위 25개 채널 ID만 사용
      const sortedChannelIds = [...channelFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, 25);

      // ── Step 3: 채널 상세 정보 조회 ─────────────────────────────────────────
      const channelUrl =
        `https://www.googleapis.com/youtube/v3/channels` +
        `?part=snippet,statistics,topicDetails` +
        `&id=${sortedChannelIds.join(",")}` +
        `&key=${apiKey}`;
      const channelRes = await fetch(channelUrl, { cache: "no-store" });

      if (!channelRes.ok) {
        const errBody = await channelRes.json().catch(() => ({}));
        const reason0 = errBody?.error?.errors?.[0]?.reason ?? "";
        const isBadKey =
          channelRes.status === 400 || channelRes.status === 401 || reason0 === "keyInvalid";
        if (isBadKey || channelRes.status === 403) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
        }
        return { items: [], error: "api_error" };
      }

      const channelData = await channelRes.json();
      // 실측: 채널 검색용 channels.list 기록
      import("./metrics").then(({ trackYtApi }) => trackYtApi("channels")).catch(() => {});
      if (!channelData.items) return { items: [] };

      // ── Step 4: 빈도 순서 유지하며 ChannelResult 매핑 ───────────────────────
      const channelMap = new Map<string, any>();
      for (const ch of channelData.items) channelMap.set(ch.id, ch);

      const items: ChannelResult[] = sortedChannelIds
        .map((id) => channelMap.get(id))
        .filter(Boolean)
        .map((ch: any) => {
          const subCount = parseInt(ch.statistics?.subscriberCount || "0");
          const videoCount = parseInt(ch.statistics?.videoCount || "0");
          const totalViews = parseInt(ch.statistics?.viewCount || "0");
          const avgViews = videoCount > 0 ? Math.floor(totalViews / videoCount) : 0;
          return {
            channelId: ch.id,
            title: ch.snippet.title,
            description: ch.snippet.description || "",
            thumbnail:
              ch.snippet.thumbnails?.medium?.url ||
              ch.snippet.thumbnails?.default?.url ||
              "",
            subscriberCount: subCount,
            subscriberCountFormatted: formatCount(subCount),
            videoCount,
            viewCount: totalViews,
            avgViewsPerVideo: avgViews,
            avgViewsFormatted: formatCount(avgViews),
            customUrl: ch.snippet.customUrl,
            country: ch.snippet.country,
            publishedAt: ch.snippet.publishedAt || "",
            topicTags: parseTopicTags(ch.topicDetails?.topicCategories),
          };
        });

      await cacheSet(cacheKey, items, TTL.CHANNEL_SEARCH);
      return { items };
    } catch {
      // 예외 발생 시 다음 키로 시도
      activeKeyIndex++;
      if (activeKeyIndex < apiKeys.length) continue;
      return { items: [], error: "api_error" };
    }
  }

  return { items: [], error: "api_error" };
}

export interface TrendingVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  channelThumbnail: string;
  viewCount: number;
  viewCountFormatted: string;
  subscriberCount: number;
  subscriberCountFormatted: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
}

export async function getTrendingVideos(isPaid = false, maxResults = 50, categoryId = ""): Promise<{
  items: TrendingVideo[];
  error?: "quota_exceeded" | "api_error";
}> {
  let apiKeys: string[];
  try {
    apiKeys = getAllApiKeys(isPaid);
  } catch {
    return { items: [], error: "api_error" };
  }

  // Redis 캐시 확인 (1시간 TTL — 트렌드는 자주 변경)
  const { cacheGet, cacheSet, trendingCacheKey, TTL } = await import("./cache");
  const cacheKey = trendingCacheKey("KR", maxResults, categoryId);
  const cached = await cacheGet<TrendingVideo[]>(cacheKey);
  if (cached) return { items: cached };

  let activeKeyIndex = 0;
  let lastError: "quota_exceeded" | "api_error" = "api_error";

  while (activeKeyIndex < apiKeys.length) {
    const apiKey = apiKeys[activeKeyIndex];
    try {
      const catParam = categoryId ? `&videoCategoryId=${categoryId}` : "";
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=KR&maxResults=${maxResults}${catParam}&key=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const reason = errBody?.error?.errors?.[0]?.reason ?? "";
        const errMsg = (errBody?.error?.message ?? "").toLowerCase();

        // 1) 카테고리 자체가 지원 안 됨 → 키 문제 아님, 즉시 빈 결과 반환
        //    YouTube API: notFound(404) or 400 category error
        const isCategoryUnsupported =
          reason === "notFound" ||
          reason === "videoCategoryNotFound" ||
          reason === "invalidVideoCategory" ||
          errMsg.includes("videocategoryid") ||
          (errMsg.includes("category") && res.status === 400) ||
          errMsg.includes("not supported for this");
        if (isCategoryUnsupported) return { items: [] };

        // 2) 쿼터 초과 → 다음 키로
        const isQuota =
          res.status === 403 && (
            errMsg.includes("quota") ||
            reason.toLowerCase().includes("quota") ||
            errBody?.error?.errors?.[0]?.domain?.toLowerCase().includes("quota") ||
            reason === "dailyLimitExceeded" ||
            reason === "quotaExceeded"
          );

        // 3) 키 자체 불량 (badRequest에서 카테고리 오류 제외) → 다음 키로
        const isBadKey =
          res.status === 401 ||
          reason === "keyInvalid" ||
          errMsg.includes("not valid") ||
          (res.status === 400 && !isCategoryUnsupported);

        if (isQuota) { lastError = "quota_exceeded"; activeKeyIndex++; continue; }
        if (isBadKey) { activeKeyIndex++; continue; }
        return { items: [], error: "api_error" };
      }

      const data = await res.json();
      if (!data.items?.length) return { items: [] };

      // 채널 통계 조회 — 같은 키 사용
      const channelIds = [...new Set(data.items.map((v: any) => v.snippet.channelId))].join(",");
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
      const chRes = await fetch(chUrl, { cache: "no-store" });
      const chData = await chRes.json().catch(() => ({ items: [] }));
      const channelMap: Record<string, { sub: number; thumb: string }> = {};
      (chData.items || []).forEach((ch: any) => {
        channelMap[ch.id] = {
          sub: parseInt(ch.statistics?.subscriberCount || "0"),
          thumb: ch.snippet?.thumbnails?.default?.url || "",
        };
      });

      const items: TrendingVideo[] = data.items.map((item: any) => {
        const viewCount = parseInt(item.statistics?.viewCount || "0");
        const ch = channelMap[item.snippet.channelId] || { sub: 0, thumb: "" };
        const durationSec = parseDuration(item.contentDetails?.duration || "");
        return {
          videoId: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          channelThumbnail: ch.thumb,
          viewCount,
          viewCountFormatted: formatCount(viewCount) + "회",
          subscriberCount: ch.sub,
          subscriberCountFormatted: formatCount(ch.sub),
          publishedAt: item.snippet.publishedAt?.split("T")[0] || "",
          duration: formatDuration(durationSec),
          durationSeconds: durationSec,
        };
      });

      await cacheSet(cacheKey, items, TTL.TRENDING);
      return { items };
    } catch {
      // 네트워크 오류 등 예외 → 다음 키 시도
      activeKeyIndex++;
      continue;
    }
  }

  // 모든 API 키 실패 → YouTube RSS 폴백 시도
  try {
    const rssItems = await fetchTrendingViaRSS(maxResults);
    if (rssItems.length > 0) {
      // RSS 결과는 TTL 짧게 캐싱 (30분)
      await cacheSet(cacheKey + ":rss", rssItems, 60 * 30);
      return { items: rssItems };
    }
  } catch {
    // RSS도 실패하면 마지막 에러 반환
  }

  return { items: [], error: lastError };
}

/**
 * YouTube RSS 피드로 트렌딩 영상 가져오기 (API 키 불필요)
 * 조회수/구독자 수 정보는 없음
 */
async function fetchTrendingViaRSS(maxResults = 50): Promise<TrendingVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?chart=mostpopular&gl=KR&hl=ko`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Accept": "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const xml = await res.text();

  // XML 파싱 (정규식 기반 — 외부 패키지 불필요)
  const entries: TrendingVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  // eslint-disable-next-line no-cond-assign
  while ((match = entryRegex.exec(xml)) !== null && entries.length < maxResults) {
    const block = match[1];
    const videoId = (/<yt:videoId>(.*?)<\/yt:videoId>/.exec(block) || [])[1] ?? "";
    const title = (/<title>(.*?)<\/title>/.exec(block) || [])[1] ?? "";
    const channelTitle = (/<name>(.*?)<\/name>/.exec(block) || [])[1] ?? "";
    const channelId = (/<yt:channelId>(.*?)<\/yt:channelId>/.exec(block) || [])[1] ?? "";
    const publishedAt = (/<published>(.*?)<\/published>/.exec(block) || [])[1]?.split("T")[0] ?? "";

    if (!videoId) continue;

    entries.push({
      videoId,
      title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      channelTitle: channelTitle.replace(/&amp;/g, "&"),
      channelId,
      channelThumbnail: "",
      viewCount: 0,
      viewCountFormatted: "- 회",
      subscriberCount: 0,
      subscriberCountFormatted: "-",
      publishedAt,
      duration: "",
      durationSeconds: 9999,
    });
  }

  return entries;
}

export async function searchVideos(query: string, filter?: string, pageToken?: string, isPaid: boolean = false, order: string = "relevance", regionCode: string = "KR"): Promise<{
  items: any[];
  nextPageToken?: string;
  error?: "quota_exceeded" | "api_error";
}> {
  let apiKeys: string[];
  try {
    apiKeys = getAllApiKeys(isPaid);
  } catch {
    console.error("❌ YouTube API Key Missing");
    return { items: [], error: "api_error" };
  }
  if (!query) return { items: [], nextPageToken: undefined };

  // 캐시 확인
  const { cacheGet, cacheSet, searchCacheKey } = await import("./cache");
  const cacheKey = searchCacheKey(query, filter || "", pageToken, order, regionCode);
  const cached = await cacheGet<{ items: any[]; nextPageToken?: string }>(cacheKey);
  if (cached) {
    console.log(`✅ 캐시 히트: ${cacheKey}`);
    return cached;
  }

  let currentToken = pageToken;
  let foundItems: any[] = [];
  let attempt = 0;
  const maxAttempts = 5;
  let nextTokenToReturn: string | undefined = undefined;
  let activeKeyIndex = 0; // 현재 사용 중인 키 인덱스

  try {
    console.log(`🔍 검색 시작: "${query}" (필터: ${filter || "없음"}, 키 ${activeKeyIndex + 1}/${apiKeys.length})`);

    while (foundItems.length === 0 && attempt < maxAttempts) {
      const apiKey = apiKeys[activeKeyIndex];
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=50&order=${order}&regionCode=${regionCode}`;
      if (currentToken) searchUrl += `&pageToken=${currentToken}`;

      const searchRes = await fetch(searchUrl, { cache: 'no-store' });
      if (!searchRes.ok) {
        const errBody = await searchRes.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || "";
        const reason0 = errBody?.error?.errors?.[0]?.reason ?? "";
        const domain0 = errBody?.error?.errors?.[0]?.domain ?? "";
        // YouTube 쿼터 초과: 메시지보다 reason/domain 필드가 더 신뢰할 수 있음
        const isQuotaError = searchRes.status === 403 && (
          errMsg.toLowerCase().includes("quota") ||
          reason0.toLowerCase().includes("quota") ||
          domain0.toLowerCase().includes("quota") ||
          reason0 === "quotaExceeded" ||
          reason0 === "dailyLimitExceeded"
        );
        // 400 or 401 = 키 자체 문제, 403 = 권한/쿼터 문제 → 모두 다음 키로 시도
        const isBadKey = searchRes.status === 400 || searchRes.status === 401 ||
          reason0 === "badRequest" || reason0 === "keyInvalid" ||
          errMsg.toLowerCase().includes("not valid");
        if (isQuotaError || isBadKey) {
          const prevIndex = activeKeyIndex;
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) {
            console.warn(`⚠️ 키 ${prevIndex + 1} (${isQuotaError ? "쿼터소진" : "키오류"}) → 키 ${activeKeyIndex + 1}로 전환`);
            continue;
          }
          if (isQuotaError) {
            console.error("❌ 모든 YouTube API 키 쿼터 소진");
            return { items: [], error: "quota_exceeded" };
          }
          console.error("❌ 모든 YouTube API 키 유효하지 않음");
          return { items: [], error: "api_error" };
        }
        // 403 (쿼터 감지 못한 경우)도 다음 키 시도
        if (searchRes.status === 403) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { items: [], error: "quota_exceeded" };
        }
        console.error(`❌ YouTube API 에러 ${searchRes.status}:`, errMsg.slice(0, 100));
        return { items: [], error: "api_error" };
      }

      const searchData = await searchRes.json();
      // 실측: search.list 성공 호출 기록
      import("./metrics").then(({ trackYtApi }) => trackYtApi("search")).catch(() => {});
      if (!searchData.items?.length) break;

      currentToken = searchData.nextPageToken;
      nextTokenToReturn = currentToken;

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKeys[activeKeyIndex]}`;
      const videosRes = await fetch(videosUrl, { cache: 'no-store' });
      // 실측: videos.list 성공 호출 기록
      import("./metrics").then(({ trackYtApi }) => trackYtApi("videos")).catch(() => {});
      const videosData = await videosRes.json();
      
      if (!videosData.items) { attempt++; if (!currentToken) break; continue; }

      let items = videosData.items;

      if (filter === "shorts") {
        items = items.filter((item: any) => parseDuration(item.contentDetails.duration) <= 180);
        const checks = await Promise.all(items.map(async (item: any) => await isRealShorts(item.id)));
        items = items.filter((_: any, index: number) => checks[index]);
      } else if (filter === "long") {
        const checks = await Promise.all(items.map(async (item: any) => {
          const duration = parseDuration(item.contentDetails.duration);
          if (duration > 180) return true; 
          const isShort = await isRealShorts(item.id);
          return !isShort; 
        }));
        items = items.filter((_: any, index: number) => checks[index]);
      }

      if (items.length > 0) { foundItems = items; break; }
      attempt++; if (!currentToken) break; 
    }

    if (foundItems.length === 0) return { items: [], nextPageToken: nextTokenToReturn };

    const channelIds = [...new Set(foundItems.map((item: any) => item.snippet.channelId))].join(",");
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${apiKeys[activeKeyIndex]}`;
    const channelsRes = await fetch(channelsUrl);
    // 실측: channels.list 성공 호출 기록
    import("./metrics").then(({ trackYtApi }) => trackYtApi("channels")).catch(() => {});
    const channelsData = await channelsRes.json();
    
    const channelMap: Record<string, { sub: string, thumb: string }> = {}; 
    const channelDataItems = channelsData.items || []; 

    channelsData.items?.forEach((ch: any) => { 
        channelMap[ch.id] = {
            sub: ch.statistics.subscriberCount,
            thumb: ch.snippet.thumbnails.default?.url || ""
        };
    });

    const resultItems = foundItems.map((item: any) => {
      const viewCount = parseInt(item.statistics.viewCount || "0");
      const publishedAt = item.snippet.publishedAt;
      const channelInfo = channelMap[item.snippet.channelId] || { sub: "0", thumb: "" };
      const subscriberCount = parseInt(channelInfo.sub) || 0;

      const channelRawData = channelDataItems.find((c: any) => c.id === item.snippet.channelId);

      const performanceScore = calculatePerformanceScore(viewCount, subscriberCount, publishedAt);
      const badge = determineBadge(performanceScore);

      const { ratio, raw, color } = calculatePerformanceRatio(viewCount, channelRawData);

      const durationSeconds = parseDuration(item.contentDetails?.duration || "");
      const duration = formatDuration(durationSeconds);
      const algorithmScore = calculateAlgorithmScore(viewCount, subscriberCount, publishedAt, raw);

      return {
        videoId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        channelThumbnail: channelInfo.thumb,
        subscriberCount: formatCount(channelInfo.sub),
        subscriberCountRaw: subscriberCount,
        viewCount: viewCount,
        viewCountFormatted: formatCount(viewCount) + "회",
        publishedAt: publishedAt.split("T")[0],
        publishedAtRaw: new Date(publishedAt).getTime(),
        score: badge,
        scoreValue: getScoreValue(badge),
        performanceRatio: ratio,
        performanceRatioRaw: raw,
        performanceColor: color,
        duration,
        durationSeconds,
        algorithmScore,
      };
    });

    const result = { items: resultItems, nextPageToken: nextTokenToReturn };

    // 결과 캐시 저장
    await cacheSet(cacheKey, result);

    return result;

  } catch (error) {
    console.error("searchVideos 예외 발생:", error);
    return { items: [], nextPageToken: undefined };
  }
}

// ─── 채널 상세 대시보드용 ────────────────────────────────────────────────────────

export interface ChannelDetail extends ChannelResult {
  bannerUrl?: string;
  keywords?: string[];
}

export interface ChannelVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSec: number;
}

function isQuotaErr(status: number, errBody: any): boolean {
  const msg = errBody?.error?.message?.toLowerCase() ?? "";
  const reason = errBody?.error?.errors?.[0]?.reason ?? "";
  return status === 403 && (
    msg.includes("quota") || reason.includes("quota") ||
    reason === "quotaExceeded" || reason === "dailyLimitExceeded"
  );
}

export async function getChannelDetail(channelId: string, isPaid = false): Promise<{
  channel: ChannelDetail | null;
  error?: "quota_exceeded" | "api_error" | "not_found";
}> {
  if (!channelId) return { channel: null, error: "not_found" };

  let apiKeys: string[];
  try { apiKeys = getAllApiKeys(isPaid); }
  catch { return { channel: null, error: "api_error" }; }

  const { cacheGet, cacheSet, channelDetailCacheKey, TTL } = await import("./cache");
  const cacheKey = channelDetailCacheKey(channelId);
  const cached = await cacheGet<ChannelDetail>(cacheKey);
  if (cached) return { channel: cached };

  let activeKeyIndex = 0;
  while (activeKeyIndex < apiKeys.length) {
    const apiKey = apiKeys[activeKeyIndex];
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/channels` +
        `?part=snippet,statistics,topicDetails,brandingSettings` +
        `&id=${channelId}&key=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (isQuotaErr(res.status, errBody)) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { channel: null, error: "quota_exceeded" };
        }
        if (res.status === 400 || res.status === 401) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
        }
        return { channel: null, error: "api_error" };
      }

      const data = await res.json();
      const ch = data.items?.[0];
      if (!ch) return { channel: null, error: "not_found" };

      const subCount  = parseInt(ch.statistics?.subscriberCount || "0");
      const videoCount = parseInt(ch.statistics?.videoCount || "0");
      const totalViews = parseInt(ch.statistics?.viewCount || "0");
      const avgViews   = videoCount > 0 ? Math.floor(totalViews / videoCount) : 0;

      const channel: ChannelDetail = {
        channelId: ch.id,
        title:       ch.snippet.title,
        description: ch.snippet.description || "",
        thumbnail:
          ch.snippet.thumbnails?.high?.url ||
          ch.snippet.thumbnails?.medium?.url ||
          ch.snippet.thumbnails?.default?.url || "",
        subscriberCount: subCount,
        subscriberCountFormatted: formatCount(subCount),
        videoCount,
        viewCount: totalViews,
        avgViewsPerVideo: avgViews,
        avgViewsFormatted: formatCount(avgViews),
        customUrl:   ch.snippet.customUrl,
        country:     ch.snippet.country,
        publishedAt: ch.snippet.publishedAt || "",
        topicTags:   parseTopicTags(ch.topicDetails?.topicCategories),
        bannerUrl:   ch.brandingSettings?.image?.bannerExternalUrl,
        keywords:    ch.brandingSettings?.channel?.keywords
          ?.split(/\s+/)
          .filter((k: string) => k.length > 0) ?? [],
      };

      await cacheSet(cacheKey, channel, TTL.CHANNEL_DETAIL);
      return { channel };
    } catch {
      activeKeyIndex++;
      if (activeKeyIndex < apiKeys.length) continue;
      return { channel: null, error: "api_error" };
    }
  }
  return { channel: null, error: "api_error" };
}

export async function getChannelRecentVideos(channelId: string, isPaid = false): Promise<{
  videos: ChannelVideo[];
  error?: "quota_exceeded" | "api_error";
}> {
  if (!channelId) return { videos: [] };

  let apiKeys: string[];
  try { apiKeys = getAllApiKeys(isPaid); }
  catch { return { videos: [], error: "api_error" }; }

  const { cacheGet, cacheSet, channelVideosCacheKey, TTL } = await import("./cache");
  const cacheKey = channelVideosCacheKey(channelId);
  const cached = await cacheGet<ChannelVideo[]>(cacheKey);
  if (cached) return { videos: cached };

  // uploads 재생목록 ID = "UU" + channelId[2:]  (UC→UU)
  const uploadsId = "UU" + channelId.slice(2);

  let activeKeyIndex = 0;
  while (activeKeyIndex < apiKeys.length) {
    const apiKey = apiKeys[activeKeyIndex];
    try {
      // Step 1: uploads 재생목록에서 최신 영상 ID 획득 (1 unit)
      const plUrl =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=contentDetails&playlistId=${uploadsId}&maxResults=12&key=${apiKey}`;
      const plRes = await fetch(plUrl, { cache: "no-store" });

      if (!plRes.ok) {
        const errBody = await plRes.json().catch(() => ({}));
        if (isQuotaErr(plRes.status, errBody)) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { videos: [], error: "quota_exceeded" };
        }
        if (plRes.status === 400 || plRes.status === 401 || plRes.status === 403) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
        }
        return { videos: [], error: "api_error" };
      }

      const plData = await plRes.json();
      const videoIds: string[] = (plData.items ?? [])
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean);
      if (!videoIds.length) return { videos: [] };

      // Step 2: 영상 상세 (snippet + statistics + contentDetails)  (~1 unit/video)
      const vUrl =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=snippet,statistics,contentDetails` +
        `&id=${videoIds.join(",")}&key=${apiKey}`;
      const vRes = await fetch(vUrl, { cache: "no-store" });

      if (!vRes.ok) {
        const errBody = await vRes.json().catch(() => ({}));
        if (isQuotaErr(vRes.status, errBody)) {
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) continue;
          return { videos: [], error: "quota_exceeded" };
        }
        return { videos: [], error: "api_error" };
      }

      const vData = await vRes.json();
      const videos: ChannelVideo[] = (vData.items ?? []).map((v: any) => ({
        videoId:      v.id,
        title:        v.snippet.title,
        thumbnail:    v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
        publishedAt:  v.snippet.publishedAt,
        viewCount:    parseInt(v.statistics?.viewCount || "0"),
        likeCount:    parseInt(v.statistics?.likeCount || "0"),
        commentCount: parseInt(v.statistics?.commentCount || "0"),
        durationSec:  parseDuration(v.contentDetails?.duration || ""),
      }));

      await cacheSet(cacheKey, videos, TTL.CHANNEL_VIDEOS);
      return { videos };
    } catch {
      activeKeyIndex++;
      if (activeKeyIndex < apiKeys.length) continue;
      return { videos: [], error: "api_error" };
    }
  }
  return { videos: [], error: "api_error" };
}
