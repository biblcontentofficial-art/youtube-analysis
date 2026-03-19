export interface Video {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    channelThumbnail: string;
    subscriberCount: string;
    subscriberCountRaw: number;
    viewCount: number;
    viewCountFormatted: string;
    publishedAt: string;
    publishedAtRaw: number;
    score: "Good" | "Normal" | "Bad";
    scoreValue: number;
    performanceRatio: string;
    performanceRatioRaw: number;
    performanceColor: string;
    duration?: string;        // 표시용 (예: "10:24")
    durationSeconds?: number; // 정렬/필터용
    algorithmScore: number;   // 알고리즘 탑승 확률 (0-95)
  }