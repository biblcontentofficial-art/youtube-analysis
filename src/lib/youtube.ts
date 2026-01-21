import { google } from "googleapis";

// 환경변수 체크
function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// ISO 8601 Duration (예: PT3M15S) -> 초(Seconds) 변환 함수
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = parseInt(match[3]) || 0;

  return hours + minutes + seconds;
}

// 메인 검색 함수
export async function searchVideos(query: string, filter?: string) {
  const apiKey = assertEnv("YOUTUBE_API_KEY");
  
  // 1. 검색 API 호출 (ID 목록 확보)
  // 필터링을 위해 넉넉하게 20개 정도 가져옴
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "20"); 

  const searchRes = await fetch(searchUrl.toString());
  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  const videoIds = searchData.items
    .map((item: any) => item.id.videoId)
    .join(",");

  // 2. 상세 정보 API 호출 (조회수, 게시일, 길이 정보 확보)
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("id", videoIds);
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl.toString());
  const videosData = await videosRes.json();

  if (!videosData.items) return [];

  // 3. 데이터 가공 및 필터링 (3분 = 180초 기준)
  let items = videosData.items;

  if (filter === 'shorts') {
    // 3분 미만만 남김
    items = items.filter((item: any) => parseDuration(item.contentDetails.duration) < 180);
  } else if (filter === 'long') {
    // 3분 이상만 남김
    items = items.filter((item: any) => parseDuration(item.contentDetails.duration) >= 180);
  }

  // 4. 최종 데이터 매핑
  return items.map((item: any) => {
    const viewCount = parseInt(item.statistics.viewCount || "0");
    const publishedAt = item.snippet.publishedAt; // e.g., "2024-01-20T..."

    return {
      videoId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      viewCount: viewCount,
      publishedAt: publishedAt.split("T")[0], // YYYY-MM-DD
      // 그래프 & 배지 데이터 생성
      sparkline: makeMockTotalLifetimeTrend(item.id, viewCount, publishedAt),
      score: computePerformanceScore(viewCount, publishedAt),
    };
  });
}

// 배지 점수 계산 (Good, Normal, Bad)
export function computePerformanceScore(viewCount: number, publishedAt: string): "Good" | "Normal" | "Bad" {
  // 간단한 로직: 하루 평균 조회수 등으로 판단 (여기서는 단순화)
  const daysSince = Math.max(1, (new Date().getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  const dailyViews = viewCount / daysSince;

  if (dailyViews > 1000) return "Good";
  if (dailyViews > 100) return "Normal";
  return "Bad";
}

// 그래프 데이터 생성 (절대 감소하지 않는 랜덤 성장)
export function makeMockTotalLifetimeTrend(videoId: string, totalViews: number, publishedAt: string) {
  // 시드 생성 (새로고침해도 모양 유지)
  let seed = 0;
  for (let i = 0; i < videoId.length; i++) seed += videoId.charCodeAt(i);
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const points = 20;
  const data = [0];
  let currentViews = 0;

  // 4가지 패턴 중 하나 선택
  const type = Math.floor(random() * 4); 

  for (let i = 1; i < points - 1; i++) {
    const progress = i / (points - 1);
    let factor = progress;

    if (type === 0) factor = progress * progress; // J커브 (급상승)
    else if (type === 1) factor = Math.sqrt(progress); // 초반 급상승 (로그)
    else if (type === 2) factor = progress; // 꾸준함 (직선)
    else { 
        // 계단형
        factor = progress < 0.5 ? progress * 0.5 : progress * 1.5; 
    }

    // 노이즈 추가
    const noise = (random() - 0.5) * 0.2; 
    let nextVal = totalViews * (factor + noise);

    // 오름차순 보정 (Ratchet): 절대 줄어들지 않게 함
    if (nextVal < currentViews) nextVal = currentViews;
    // 총 조회수를 넘지 않게 함
    if (nextVal > totalViews) nextVal = totalViews;

    currentViews = nextVal;
    data.push(Math.round(currentViews));
  }

  data.push(totalViews); // 마지막은 정확히 총 조회수
  return data;
}