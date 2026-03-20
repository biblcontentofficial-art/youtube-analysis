"use server";

import { searchVideos } from "@/lib/youtube";
import { getUserPlan } from "@/lib/searchLimit";
import {
  cacheGet,
  cacheSet,
  TTL,
  videoCacheKey,
  channelCacheKey,
  commentCacheKey,
} from "@/lib/cache";

// 1. 더보기 기능
export async function getMoreVideos(query: string, filter: string | undefined, pageToken: string) {
  const plan = await getUserPlan();
  const isPaid = plan !== "free";
  return await searchVideos(query, filter, pageToken, isPaid);
}

type VideoDetail = {
  channelId: string; description: string; tags: string[];
  likeCount: string; commentCount: string;
  rawLikeCount: number; rawViewCount: number;
} | null;

type ChannelDetail = {
  title: string; description: string; publishedAt: string;
  viewCount: number; subscriberCount: number; videoCount: number;
  keywords: string[];
} | null;

// 2. 영상 상세 정보 가져오기
export async function fetchVideoDetail(videoId: string): Promise<VideoDetail> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  // 캐시 확인 (24시간)
  const cacheKey = videoCacheKey(videoId);
  const cached = await cacheGet<VideoDetail>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.items?.length) return null;

    const item = data.items[0];
    const format = (num: string) => num ? parseInt(num).toLocaleString() : "0";

    const result = {
      channelId: item.snippet.channelId,
      description: item.snippet.description || "설명이 없습니다.",
      tags: item.snippet.tags || [],
      likeCount: format(item.statistics.likeCount),
      commentCount: format(item.statistics.commentCount),
      rawLikeCount: parseInt(item.statistics.likeCount || "0"),
      rawViewCount: parseInt(item.statistics.viewCount || "0"),
    };

    await cacheSet(cacheKey, result, TTL.VIDEO);
    return result;
  } catch (e) {
    console.error("Detail Fetch Error:", e);
    return null;
  }
}

// 3. 댓글 가져오기
export async function fetchVideoComments(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  // 캐시 확인 (12시간)
  const cacheKey = commentCacheKey(videoId);
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=10&order=relevance&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items) return [];

    const result = data.items.map((item: any) => {
      const topComment = item.snippet.topLevelComment.snippet;
      const replies = item.replies?.comments?.map((reply: any) => ({
        id: reply.id,
        author: reply.snippet.authorDisplayName,
        text: reply.snippet.textDisplay,
        likeCount: reply.snippet.likeCount,
        publishedAt: reply.snippet.publishedAt.split("T")[0],
      })) || [];

      return {
        id: item.id,
        author: topComment.authorDisplayName,
        text: topComment.textDisplay,
        likeCount: topComment.likeCount,
        publishedAt: topComment.publishedAt.split("T")[0],
        replyCount: item.snippet.totalReplyCount,
        replies: replies,
      };
    });

    await cacheSet(cacheKey, result, TTL.COMMENT);
    return result;
  } catch (e) {
    console.error("Comment Fetch Error:", e);
    return [];
  }
}

// 4. 채널 상세 정보 가져오기 (키워드 로직 개선)
export async function fetchChannelDetail(channelId: string): Promise<ChannelDetail> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  // 캐시 확인 (24시간)
  const cacheKey = channelCacheKey(channelId);
  const cached = await cacheGet<ChannelDetail>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.items?.length) return null;

    const item = data.items[0];
    const stats = item.statistics;
    const publishedAt = item.snippet.publishedAt.split("T")[0];

    let keywords: string[] = [];
    if (item.brandingSettings?.channel?.keywords) {
      const rawKeywords = item.brandingSettings.channel.keywords;
      keywords = rawKeywords
        .split(/[, ]+/)
        .map((k: string) => k.replace(/"/g, "").trim())
        .filter((k: string) => k.length > 0);
    }

    const result = {
      title: item.snippet.title,
      description: item.snippet.description || "채널 설명이 없습니다.",
      publishedAt: publishedAt,
      viewCount: parseInt(stats.viewCount || "0"),
      subscriberCount: parseInt(stats.subscriberCount || "0"),
      videoCount: parseInt(stats.videoCount || "0"),
      keywords: keywords,
    };

    await cacheSet(cacheKey, result, TTL.CHANNEL);
    return result;
  } catch (e) {
    console.error("Channel Fetch Error:", e);
    return null;
  }
}