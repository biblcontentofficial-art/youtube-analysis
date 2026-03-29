"use server";

export interface ChannelAnalysis {
  channel: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    createdAt: string;
    keywords: string[];
  };
  recentVideos: {
    videoId: string;
    title: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
  }[];
  insights: {
    avgViews: number;
    medianViews: number;
    bestVideo: { title: string; viewCount: number; videoId: string };
    uploadFrequencyDays: number;
    bestDayOfWeek: string;
    bestHour: number;
    viewTrend: "growing" | "stable" | "declining";
    viewTrendPercent: number;
  };
}

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

/**
 * Extract channel identifier from various URL formats.
 * Returns { type, value } where type is "id", "handle", or "query".
 */
function parseChannelInput(input: string): { type: "id" | "handle" | "query"; value: string } {
  const trimmed = input.trim();

  // Direct channel ID: UCxxxx
  if (trimmed.startsWith("UC") && trimmed.length >= 24 && !trimmed.includes("/")) {
    return { type: "id", value: trimmed };
  }

  // Handle format: @channelname
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed };
  }

  // URL formats
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const pathname = url.pathname;

    // youtube.com/channel/UCxxxx
    const channelMatch = pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return { type: "id", value: channelMatch[1] };
    }

    // youtube.com/@handle
    const handleMatch = pathname.match(/\/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      return { type: "handle", value: `@${handleMatch[1]}` };
    }

    // youtube.com/c/channelname or youtube.com/user/username
    const legacyMatch = pathname.match(/\/(c|user)\/([^/]+)/);
    if (legacyMatch) {
      return { type: "query", value: legacyMatch[2] };
    }
  } catch {
    // Not a valid URL, treat as search query
  }

  return { type: "query", value: trimmed };
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Resolve a channel handle or query to a channel ID.
 */
async function resolveChannelId(parsed: { type: "id" | "handle" | "query"; value: string }): Promise<string | null> {
  const apiKey = getApiKey();

  if (parsed.type === "id") {
    return parsed.value;
  }

  if (parsed.type === "handle") {
    // Try search API with the handle
    const handle = parsed.value.startsWith("@") ? parsed.value : `@${parsed.value}`;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`;
    const data = await fetchJson(searchUrl);
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId;
    }
    // Fallback: try channels list with forHandle
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(parsed.value.replace("@", ""))}&key=${apiKey}`;
    const channelData = await fetchJson(channelUrl);
    if (channelData.items && channelData.items.length > 0) {
      return channelData.items[0].id;
    }
    return null;
  }

  // Query: search for channel
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`;
  const data = await fetchJson(searchUrl);
  if (data.items && data.items.length > 0) {
    return data.items[0].snippet.channelId;
  }
  return null;
}

export async function analyzeChannel(channelInput: string): Promise<ChannelAnalysis | { error: string }> {
  try {
    const apiKey = getApiKey();
    const parsed = parseChannelInput(channelInput);
    const channelId = await resolveChannelId(parsed);

    if (!channelId) {
      return { error: "채널을 찾을 수 없습니다. URL이나 핸들을 다시 확인해주세요." };
    }

    // Fetch channel info
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
    const channelData = await fetchJson(channelUrl);

    if (!channelData.items || channelData.items.length === 0) {
      return { error: "채널 정보를 가져올 수 없습니다." };
    }

    const ch = channelData.items[0];
    const channelInfo = {
      id: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description || "",
      thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || "",
      subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
      viewCount: parseInt(ch.statistics.viewCount || "0"),
      videoCount: parseInt(ch.statistics.videoCount || "0"),
      createdAt: ch.snippet.publishedAt,
      keywords: ch.brandingSettings?.channel?.keywords
        ? ch.brandingSettings.channel.keywords.split(/\s+/).filter(Boolean).slice(0, 20)
        : [],
    };

    // Fetch recent videos (up to 30) via search API
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=30&key=${apiKey}`;
    const searchData = await fetchJson(searchUrl);

    const videoIds = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return {
        channel: channelInfo,
        recentVideos: [],
        insights: {
          avgViews: 0,
          medianViews: 0,
          bestVideo: { title: "-", viewCount: 0, videoId: "" },
          uploadFrequencyDays: 0,
          bestDayOfWeek: "-",
          bestHour: 0,
          viewTrend: "stable",
          viewTrendPercent: 0,
        },
      };
    }

    // Fetch video statistics
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const videosData = await fetchJson(videosUrl);

    const recentVideos = (videosData.items || []).map((v: any) => ({
      videoId: v.id,
      title: v.snippet.title,
      viewCount: parseInt(v.statistics.viewCount || "0"),
      likeCount: parseInt(v.statistics.likeCount || "0"),
      commentCount: parseInt(v.statistics.commentCount || "0"),
      publishedAt: v.snippet.publishedAt,
    }));

    // Sort by publishedAt descending
    recentVideos.sort(
      (a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Calculate insights
    const views = recentVideos.map((v: any) => v.viewCount);
    const avgViews = views.length > 0 ? Math.round(views.reduce((a: number, b: number) => a + b, 0) / views.length) : 0;

    const sortedViews = [...views].sort((a: number, b: number) => a - b);
    const medianViews =
      sortedViews.length > 0
        ? sortedViews.length % 2 === 0
          ? Math.round((sortedViews[sortedViews.length / 2 - 1] + sortedViews[sortedViews.length / 2]) / 2)
          : sortedViews[Math.floor(sortedViews.length / 2)]
        : 0;

    // Best video
    const bestIdx = views.indexOf(Math.max(...views));
    const bestVideo =
      recentVideos.length > 0
        ? {
            title: recentVideos[bestIdx].title,
            viewCount: recentVideos[bestIdx].viewCount,
            videoId: recentVideos[bestIdx].videoId,
          }
        : { title: "-", viewCount: 0, videoId: "" };

    // Upload frequency
    let uploadFrequencyDays = 0;
    if (recentVideos.length >= 2) {
      const dates = recentVideos.map((v: any) => new Date(v.publishedAt).getTime());
      const gaps: number[] = [];
      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }
      uploadFrequencyDays = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;
    }

    // Best day of week (by average views)
    const dayViewSums: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const v of recentVideos) {
      const day = new Date(v.publishedAt).getDay();
      dayViewSums[day] += v.viewCount;
      dayCounts[day]++;
    }
    const dayAvgs = dayViewSums.map((sum, i) => (dayCounts[i] > 0 ? sum / dayCounts[i] : 0));
    const bestDayIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    const bestDayOfWeek = DAY_NAMES[bestDayIdx];

    // Best hour
    const hourViewSums: number[] = new Array(24).fill(0);
    const hourCounts: number[] = new Array(24).fill(0);
    for (const v of recentVideos) {
      const hour = new Date(v.publishedAt).getHours();
      hourViewSums[hour] += v.viewCount;
      hourCounts[hour]++;
    }
    const hourAvgs = hourViewSums.map((sum, i) => (hourCounts[i] > 0 ? sum / hourCounts[i] : 0));
    const bestHour = hourAvgs.indexOf(Math.max(...hourAvgs));

    // View trend: recent 10 vs older 20
    let viewTrend: "growing" | "stable" | "declining" = "stable";
    let viewTrendPercent = 0;
    if (recentVideos.length >= 5) {
      const splitAt = Math.min(10, Math.floor(recentVideos.length / 2));
      const recentSlice = recentVideos.slice(0, splitAt);
      const olderSlice = recentVideos.slice(splitAt);

      const recentAvg =
        recentSlice.reduce((s: number, v: any) => s + v.viewCount, 0) / recentSlice.length;
      const olderAvg =
        olderSlice.reduce((s: number, v: any) => s + v.viewCount, 0) / olderSlice.length;

      if (olderAvg > 0) {
        viewTrendPercent = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        if (viewTrendPercent > 15) viewTrend = "growing";
        else if (viewTrendPercent < -15) viewTrend = "declining";
        else viewTrend = "stable";
      }
    }

    return {
      channel: channelInfo,
      recentVideos,
      insights: {
        avgViews,
        medianViews,
        bestVideo,
        uploadFrequencyDays,
        bestDayOfWeek,
        bestHour,
        viewTrend,
        viewTrendPercent,
      },
    };
  } catch (err: any) {
    console.error("[analyzeChannel] error:", err);
    return { error: err?.message || "채널 분석 중 오류가 발생했습니다." };
  }
}
