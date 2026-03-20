// 유료 유저 전용 키: YOUTUBE_API_KEY_PAID_1 ~ YOUTUBE_API_KEY_PAID_10
// 무료 유저 키: YOUTUBE_API_KEY, YOUTUBE_API_KEY_2, ...
function getAllApiKeys(paid: boolean = false): string[] {
  const keys: string[] = [];
  if (paid) {
    for (let i = 1; i <= 10; i++) {
      const k = process.env[`YOUTUBE_API_KEY_PAID_${i}`];
      if (k) keys.push(k);
    }
    if (keys.length > 0) return keys;
    // 유료 전용 키 미설정 시 일반 키 사용
  }
  if (process.env.YOUTUBE_API_KEY) keys.push(process.env.YOUTUBE_API_KEY);
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`YOUTUBE_API_KEY_${i}`];
    if (k) keys.push(k);
  }
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

export async function searchVideos(query: string, filter?: string, pageToken?: string, isPaid: boolean = false): Promise<{
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
  const cacheKey = searchCacheKey(query, filter || "", pageToken);
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
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=50`;
      if (currentToken) searchUrl += `&pageToken=${currentToken}`;

      const searchRes = await fetch(searchUrl, { cache: 'no-store' });
      if (!searchRes.ok) {
        const errBody = await searchRes.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || "";
        if (searchRes.status === 403 && errMsg.includes("quota")) {
          // 다음 키로 전환
          activeKeyIndex++;
          if (activeKeyIndex < apiKeys.length) {
            console.warn(`⚠️ 키 ${activeKeyIndex} 쿼터 소진 → 키 ${activeKeyIndex + 1}로 전환`);
            continue; // 같은 attempt, 다음 키로 재시도
          }
          console.error("❌ 모든 YouTube API 키 쿼터 소진");
          return { items: [], error: "quota_exceeded" };
        }
        console.error(`❌ YouTube API 에러 ${searchRes.status}:`, JSON.stringify(errMsg));
        return { items: [], error: "api_error" };
      }

      const searchData = await searchRes.json();
      if (!searchData.items?.length) break; 
      
      currentToken = searchData.nextPageToken;
      nextTokenToReturn = currentToken;

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKeys[activeKeyIndex]}`;
      const videosRes = await fetch(videosUrl, { cache: 'no-store' });
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