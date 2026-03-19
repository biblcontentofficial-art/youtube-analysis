"use server";

import { searchVideos } from "@/lib/youtube";
import { getUserPlan } from "@/lib/searchLimit";

// 1. 더보기 기능
export async function getMoreVideos(query: string, filter: string | undefined, pageToken: string) {
  const plan = await getUserPlan();
  const isPaid = plan !== "free";
  return await searchVideos(query, filter, pageToken, isPaid);
}

// 2. 영상 상세 정보 가져오기
export async function fetchVideoDetail(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.items?.length) return null;

    const item = data.items[0];
    const format = (num: string) => num ? parseInt(num).toLocaleString() : "0";

    return {
      channelId: item.snippet.channelId,
      description: item.snippet.description || "설명이 없습니다.",
      tags: item.snippet.tags || [],
      likeCount: format(item.statistics.likeCount),
      commentCount: format(item.statistics.commentCount),
      // 평균 좋아요 추정용 raw 데이터는 이제 필요 없지만, 혹시 몰라 둡니다.
      rawLikeCount: parseInt(item.statistics.likeCount || "0"),
      rawViewCount: parseInt(item.statistics.viewCount || "0"),
    };
  } catch (e) {
    console.error("Detail Fetch Error:", e);
    return null;
  }
}

// 3. 댓글 가져오기
export async function fetchVideoComments(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=10&order=relevance&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((item: any) => {
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
  } catch (e) {
    console.error("Comment Fetch Error:", e);
    return [];
  }
}

// 4. 채널 상세 정보 가져오기 (키워드 로직 개선)
export async function fetchChannelDetail(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.items?.length) return null;

    const item = data.items[0];
    const stats = item.statistics;
    const publishedAt = item.snippet.publishedAt.split("T")[0];

    // [수정] 키워드 파싱 로직 개선 (모든 키워드 가져오기)
    let keywords: string[] = [];
    if (item.brandingSettings?.channel?.keywords) {
      const rawKeywords = item.brandingSettings.channel.keywords;
      // 쉼표나 공백으로 분리하고, 따옴표 제거 및 빈 문자열 필터링
      keywords = rawKeywords
        .split(/[, ]+/) // 쉼표 또는 공백 하나 이상으로 분리
        .map((k: string) => k.replace(/"/g, "").trim()) // 따옴표 제거 및 공백 정리
        .filter((k: string) => k.length > 0); // 빈 문자열 제거
    }

    return {
      title: item.snippet.title,
      description: item.snippet.description || "채널 설명이 없습니다.",
      publishedAt: publishedAt,
      viewCount: parseInt(stats.viewCount || "0"),
      subscriberCount: parseInt(stats.subscriberCount || "0"),
      videoCount: parseInt(stats.videoCount || "0"),
      keywords: keywords,
    };
  } catch (e) {
    console.error("Channel Fetch Error:", e);
    return null;
  }
}