/**
 * Meta Threads API 클라이언트
 * Base: https://graph.threads.net/v1.0
 *
 * OAuth 흐름:
 *   1. /api/threads/auth → threads.net/oauth/authorize
 *   2. 콜백 → /api/threads/auth/callback → access_token 획득 → Supabase 저장
 *   3. 검색 시 저장된 토큰 사용
 */

const THREADS_API = "https://graph.threads.net/v1.0";
const THREADS_OAUTH_URL = "https://threads.net/oauth/authorize";
const THREADS_TOKEN_URL = "https://graph.threads.net/oauth/access_token";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export type ThreadMediaType = "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
export type OutlierGrade = "good" | "normal" | "bad";

export interface ThreadOwner {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
}

export interface ThreadPost {
  id: string;
  text: string;
  media_type: ThreadMediaType;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  replies_count: number;
  repost_count: number;
  quote_count: number;  // 인용(공유) 수
  owner: ThreadOwner;
  // 계산 필드
  viralScore: number;
  outlier: OutlierGrade;
  engagementRate: number; // (좋아요 + 리포스트 + 댓글 + 인용) / 팔로워
}

export interface ThreadsSearchResult {
  posts: ThreadPost[];
  cursor?: string; // 더보기 커서
}

// ─────────────────────────────────────────────────────────────
// 바이럴 점수 계산 (0~95, 유튜브 알고리즘 점수와 동일 스케일)
// ─────────────────────────────────────────────────────────────

export function calculateViralScore(
  likes: number,
  reposts: number,
  replies: number,
  followerCount: number,
  timestamp: string
): number {
  const followers = Math.max(followerCount, 1);

  // 팔로워 대비 각 반응 비율
  const likeRatio = likes / followers;
  const repostRatio = reposts / followers;
  const replyRatio = replies / followers;

  // 좋아요 점수 (40pt max)
  const likeScore = Math.min(40, likeRatio * 1000);
  // 리포스트 점수 (35pt max) — 리포스트는 도달 확장 효과가 커서 가중치 높음
  const repostScore = Math.min(35, repostRatio * 2000);
  // 댓글 점수 (25pt max)
  const replyScore = Math.min(25, replyRatio * 1500);

  // 최신 게시물 보너스 (최근 24시간 이내일수록 높음, 최대 +5pt)
  const hoursDiff = Math.max(
    (Date.now() - new Date(timestamp).getTime()) / 3_600_000,
    0.1
  );
  const recencyBonus = hoursDiff < 24 ? ((24 - hoursDiff) / 24) * 5 : 0;

  return Math.round(Math.min(95, likeScore + repostScore + replyScore + recencyBonus));
}

// ─────────────────────────────────────────────────────────────
// 아웃라이어 판정
// ─────────────────────────────────────────────────────────────

function calcOutlier(
  likes: number,
  reposts: number,
  replies: number,
  followerCount: number
): OutlierGrade {
  const followers = Math.max(followerCount, 1);
  const engRate = (likes + reposts + replies) / followers;

  // 팔로워 규모별 기준치 (소규모 계정은 기준을 낮춤)
  const base =
    followers < 1_000 ? 0.05 :
    followers < 10_000 ? 0.02 :
    followers < 100_000 ? 0.01 : 0.005;

  if (engRate >= base * 3) return "good";
  if (engRate >= base) return "normal";
  return "bad";
}

// ─────────────────────────────────────────────────────────────
// 원시 API 응답 → ThreadPost 변환
// ─────────────────────────────────────────────────────────────

function normalize(raw: Record<string, unknown>): ThreadPost {
  const likes = Number(raw.like_count ?? 0);
  const reposts = Number(raw.repost_count ?? 0);
  const replies = Number(raw.replies_count ?? 0);
  const quotes = Number(raw.quote_count ?? 0);
  const timestamp = String(raw.timestamp ?? new Date().toISOString());

  const ownerRaw = (raw.owner ?? {}) as Record<string, unknown>;
  const followerCount = Number(ownerRaw.followers_count ?? 0);

  const owner: ThreadOwner = {
    id: String(ownerRaw.id ?? ""),
    username: String(ownerRaw.username ?? ""),
    name: ownerRaw.name ? String(ownerRaw.name) : undefined,
    profile_picture_url: ownerRaw.profile_picture_url
      ? String(ownerRaw.profile_picture_url)
      : undefined,
    followers_count: followerCount,
  };

  return {
    id: String(raw.id ?? ""),
    text: String(raw.text ?? ""),
    media_type: (raw.media_type as ThreadMediaType) ?? "TEXT",
    thumbnail_url: raw.thumbnail_url ? String(raw.thumbnail_url) : undefined,
    media_url: raw.media_url ? String(raw.media_url) : undefined,
    timestamp,
    permalink: raw.permalink ? String(raw.permalink) : `https://www.threads.net/@${owner.username}`,
    like_count: likes,
    replies_count: replies,
    repost_count: reposts,
    quote_count: quotes,
    owner,
    viralScore: calculateViralScore(likes, reposts, replies, followerCount, timestamp),
    outlier: calcOutlier(likes, reposts, replies, followerCount),
    engagementRate:
      followerCount > 0
        ? (likes + reposts + replies + quotes) / followerCount
        : 0,
  };
}

// ─────────────────────────────────────────────────────────────
// OAuth URL 생성
// ─────────────────────────────────────────────────────────────

export function getOAuthUrl(state: string): string {
  const appId = process.env.THREADS_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/threads/auth/callback`;

  const params = new URLSearchParams({
    client_id: appId ?? "",
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_keyword_search,threads_manage_insights",
    response_type: "code",
    state,
  });

  return `${THREADS_OAUTH_URL}?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────
// OAuth 코드 → 액세스 토큰 교환
// ─────────────────────────────────────────────────────────────

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/threads/auth/callback`;

  const body = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID ?? "",
    client_secret: process.env.THREADS_APP_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(THREADS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = (await res.json()) as { access_token: string; user_id: string };

  // short-lived(1시간) → long-lived(60일) 토큰 교환
  const longLived = await exchangeForLongLivedToken(data.access_token);

  return { access_token: longLived, user_id: data.user_id };
}

/**
 * Short-lived 토큰(1시간) → Long-lived 토큰(60일) 교환
 * Meta 정책: short-lived 토큰은 1시간 후 만료.
 * long-lived 토큰은 60일간 유효, 만료 전 refresh 가능.
 */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: process.env.THREADS_APP_SECRET ?? "",
    access_token: shortLivedToken,
  });

  const res = await fetch(
    `${THREADS_API}/access_token?${params.toString()}`,
    { method: "GET" }
  );

  if (!res.ok) {
    // 실패 시 short-lived 토큰 그대로 사용 (1시간 동안은 유효)
    console.warn("Long-lived token exchange failed, using short-lived token");
    return shortLivedToken;
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return data.access_token;
}

/**
 * Long-lived 토큰 갱신 (만료 전 호출, 60일 연장)
 * 크론잡이나 사용자 접속 시 호출 가능
 */
export async function refreshLongLivedToken(currentToken: string): Promise<string | null> {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: currentToken,
  });

  const res = await fetch(
    `${THREADS_API}/refresh_access_token?${params.toString()}`,
    { method: "GET" }
  );

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return data.access_token;
}

// ─────────────────────────────────────────────────────────────
// 연결된 사용자 프로필 조회
// ─────────────────────────────────────────────────────────────

export async function getThreadsProfile(accessToken: string): Promise<{
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
}> {
  // 전체 필드로 시도 → 실패 시 최소 필드로 재시도
  for (const fields of [
    "id,username,name,threads_profile_picture_url,followers_count",
    "id,username",
  ]) {
    const res = await fetch(
      `${THREADS_API}/me?fields=${fields}&access_token=${accessToken}`,
      { cache: "no-store" }
    );
    if (!res.ok) continue;

    const data = (await res.json()) as Record<string, unknown>;
    if (!data.id) continue;

    return {
      id: String(data.id),
      username: String(data.username ?? ""),
      name: data.name ? String(data.name) : undefined,
      profile_picture_url: data.threads_profile_picture_url
        ? String(data.threads_profile_picture_url)
        : undefined,
      followers_count: Number(data.followers_count ?? 0),
    };
  }
  throw new Error("Failed to fetch Threads profile");
}

// ─────────────────────────────────────────────────────────────
// 해시태그 분석
// ─────────────────────────────────────────────────────────────

/** 게시물 텍스트에서 #해시태그 추출 */
export function extractHashtags(text: string): string[] {
  // 한글·영문·숫자·밑줄 지원
  const matches = text.match(/#[\w\u3131-\u3163\uac00-\ud7a3]+/g);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}

export interface HashtagStat {
  tag: string;          // #포함
  count: number;        // 출현 횟수
  avgEngagement: number; // 평균 (좋아요+리포스트+댓글)
  grade: "A" | "B" | "C" | "D"; // 성과 등급
  goodRatio: number;    // outlier "good" 비율 (0~1)
}

/** 게시물 배열에서 해시태그별 성과 분석 */
export function analyzeHashtags(posts: ThreadPost[]): HashtagStat[] {
  const map = new Map<string, { count: number; engSum: number; goodCount: number }>();

  for (const p of posts) {
    const tags = extractHashtags(p.text);
    const eng = p.like_count + p.repost_count + p.replies_count;
    const isGood = p.outlier === "good";

    for (const tag of new Set(tags)) { // 한 게시물에서 같은 태그 중복 방지
      const prev = map.get(tag) ?? { count: 0, engSum: 0, goodCount: 0 };
      prev.count++;
      prev.engSum += eng;
      if (isGood) prev.goodCount++;
      map.set(tag, prev);
    }
  }

  // 전체 평균 반응 (등급 기준)
  const allAvg =
    posts.length > 0
      ? posts.reduce((s, p) => s + p.like_count + p.repost_count + p.replies_count, 0) / posts.length
      : 1;

  const stats: HashtagStat[] = [];
  for (const [tag, v] of map) {
    if (v.count < 2) continue; // 1회 이하 노이즈 제거
    const avg = v.engSum / v.count;
    const ratio = avg / Math.max(allAvg, 1);
    const grade: HashtagStat["grade"] =
      ratio >= 2 ? "A" : ratio >= 1.2 ? "B" : ratio >= 0.8 ? "C" : "D";

    stats.push({
      tag,
      count: v.count,
      avgEngagement: Math.round(avg),
      grade,
      goodRatio: v.goodCount / v.count,
    });
  }

  return stats.sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ─────────────────────────────────────────────────────────────
// 게시 시간 분석 (키워드 검색 결과용)
// ─────────────────────────────────────────────────────────────

export interface PostTimeSlot {
  dayName: string;
  day: number;       // 0=일 ~ 6=토
  hour: number;      // 0~23
  count: number;
  avgEngagement: number;
  intensity: number; // 0~1 (히트맵 색상용)
}

export interface PostTimeInsight {
  bestDay: string;
  bestHour: number;
  bestDayHourAvg: number;
  slots: PostTimeSlot[]; // 요일별 요약 (7개)
  hourSlots: PostTimeSlot[]; // 시간대별 요약 (24개)
  totalPosts: number;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function analyzePostTimes(posts: ThreadPost[]): PostTimeInsight {
  // 요일별 집계
  const dayMap: Record<number, { count: number; engSum: number }> = {};
  // 시간대별 집계
  const hourMap: Record<number, { count: number; engSum: number }> = {};

  for (const p of posts) {
    const d = new Date(p.timestamp);
    const day = d.getDay();
    const hour = d.getHours();
    const eng = p.like_count + p.repost_count + p.replies_count;

    if (!dayMap[day]) dayMap[day] = { count: 0, engSum: 0 };
    dayMap[day].count++;
    dayMap[day].engSum += eng;

    if (!hourMap[hour]) hourMap[hour] = { count: 0, engSum: 0 };
    hourMap[hour].count++;
    hourMap[hour].engSum += eng;
  }

  // 요일별 슬롯
  const maxDayAvg = Math.max(
    ...Object.values(dayMap).map((v) => (v.count > 0 ? v.engSum / v.count : 0)),
    1
  );
  const slots: PostTimeSlot[] = DAY_LABELS.map((name, i) => {
    const v = dayMap[i] ?? { count: 0, engSum: 0 };
    const avg = v.count > 0 ? v.engSum / v.count : 0;
    return { dayName: name, day: i, hour: -1, count: v.count, avgEngagement: Math.round(avg), intensity: avg / maxDayAvg };
  });

  // 시간대별 슬롯
  const maxHourAvg = Math.max(
    ...Object.values(hourMap).map((v) => (v.count > 0 ? v.engSum / v.count : 0)),
    1
  );
  const hourSlots: PostTimeSlot[] = Array.from({ length: 24 }, (_, h) => {
    const v = hourMap[h] ?? { count: 0, engSum: 0 };
    const avg = v.count > 0 ? v.engSum / v.count : 0;
    return { dayName: "", day: -1, hour: h, count: v.count, avgEngagement: Math.round(avg), intensity: avg / maxHourAvg };
  });

  // 최적 요일·시간
  let bestDay = 0;
  let bestDayAvg = 0;
  for (const [day, v] of Object.entries(dayMap)) {
    const avg = v.engSum / v.count;
    if (avg > bestDayAvg) { bestDayAvg = avg; bestDay = Number(day); }
  }

  let bestHour = 12;
  let bestHourAvg = 0;
  for (const [hour, v] of Object.entries(hourMap)) {
    const avg = v.engSum / v.count;
    if (avg > bestHourAvg) { bestHourAvg = avg; bestHour = Number(hour); }
  }

  return {
    bestDay: DAY_LABELS[bestDay] ?? "-",
    bestHour,
    bestDayHourAvg: Math.round(bestDayAvg),
    slots,
    hourSlots,
    totalPosts: posts.length,
  };
}

// ─────────────────────────────────────────────────────────────
// 키워드 검색
// Threads API의 keyword search endpoint 사용
// ─────────────────────────────────────────────────────────────

// keyword_search에서 직접 가져올 필드 (engagement 포함해서 시도)
// Live 모드에서 like_count 등이 반환되면 이걸 우선 사용
const SEARCH_FIELDS = [
  "id",
  "text",
  "media_type",
  "thumbnail_url",
  "media_url",
  "timestamp",
  "permalink",
  "like_count",
  "replies_count",
  "repost_count",
  "quote_count",
  "owner{id,username}",
].join(",");

// 게시물 개별 조회 시 engagement 필드
const ENGAGEMENT_FIELDS = "id,like_count,replies_count,repost_count,quote_count";

// owner profile 조회 필드
const OWNER_FIELDS = "id,username,followers_count";

/** engagement 응답 안에 실제 데이터가 있는지 확인 */
function hasRealEngagement(data: Record<string, unknown>): boolean {
  return (
    Number(data.like_count) > 0 ||
    Number(data.replies_count) > 0 ||
    Number(data.repost_count) > 0 ||
    Number(data.quote_count) > 0
  );
}

export async function searchThreads(
  keyword: string,
  accessToken: string,
  cursor?: string
): Promise<ThreadsSearchResult> {
  const params = new URLSearchParams({
    q: keyword,
    fields: SEARCH_FIELDS,
    access_token: accessToken,
    limit: "50",
  });
  if (cursor) params.set("after", cursor);

  // Step 1: keyword_search (engagement 필드 포함 요청 — Live 모드에서 반환 가능)
  const res = await fetch(
    `${THREADS_API}/keyword_search?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Threads search failed: ${errText}`);
  }

  const json = (await res.json()) as {
    data?: Record<string, unknown>[];
    paging?: { cursors?: { after?: string } };
  };

  const rawPosts = json.data ?? [];

  // Step 2: keyword_search 결과에 engagement가 없으면 → 개별 post API 호출
  // (Threads API가 keyword_search에서 engagement를 반환하지 않는 경우 fallback)
  const needsPerPostFetch = rawPosts.every((p) => !hasRealEngagement(p));

  let engagementMap = new Map<string, Record<string, unknown>>();

  if (needsPerPostFetch && rawPosts.length > 0) {
    const results = await Promise.allSettled(
      rawPosts.map(async (post) => {
        const postId = String(post.id ?? "");
        try {
          const r = await fetch(
            `${THREADS_API}/${postId}?fields=${ENGAGEMENT_FIELDS}&access_token=${accessToken}`,
            { cache: "no-store" }
          );
          const data = (await r.json()) as Record<string, unknown>;
          if (!r.ok) {
            // API 오류 로그 (Vercel 함수 로그에서 확인 가능)
            console.error(`[Threads] engagement fetch ${postId} → ${r.status}:`, JSON.stringify(data));
            return null;
          }
          return { id: postId, data };
        } catch (e) {
          console.error(`[Threads] engagement fetch ${postId} exception:`, e);
          return null;
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        engagementMap.set(r.value.id, r.value.data);
      }
    }
  }

  // Step 3: owner followers_count 조회 (고유 owner ID별 1회)
  const ownerIds = new Map<string, string>(); // id → username
  for (const post of rawPosts) {
    const owner = (post.owner ?? {}) as Record<string, unknown>;
    const ownerId = String(owner.id ?? "");
    if (ownerId) ownerIds.set(ownerId, String(owner.username ?? ""));
  }

  const ownerFollowers = new Map<string, number>();
  await Promise.allSettled(
    Array.from(ownerIds.keys()).map(async (ownerId) => {
      try {
        const r = await fetch(
          `${THREADS_API}/${ownerId}?fields=${OWNER_FIELDS}&access_token=${accessToken}`,
          { cache: "no-store" }
        );
        if (!r.ok) return;
        const data = (await r.json()) as Record<string, unknown>;
        if (data.error) return; // API 오류 응답 무시
        ownerFollowers.set(ownerId, Number(data.followers_count ?? 0));
      } catch {
        // 조회 실패 시 0으로 유지
      }
    })
  );

  // Step 4: engagement + followers 데이터 병합
  const mergedPosts = rawPosts.map((post) => {
    const postId = String(post.id ?? "");
    const ownerRaw = (post.owner ?? {}) as Record<string, unknown>;
    const ownerId = String(ownerRaw.id ?? "");
    const followersCount = ownerFollowers.get(ownerId) ?? 0;

    // keyword_search에서 직접 반환된 engagement가 있으면 우선 사용
    // 없으면 per-post 호출 결과 사용
    const eng = needsPerPostFetch
      ? (engagementMap.get(postId) ?? post)
      : post;

    return {
      ...post,
      like_count: Number(eng.like_count ?? 0),
      replies_count: Number(eng.replies_count ?? 0),
      repost_count: Number(eng.repost_count ?? 0),
      quote_count: Number(eng.quote_count ?? 0),
      owner: {
        ...ownerRaw,
        followers_count: followersCount,
      },
    };
  });

  // 좋아요 → 댓글 → 리포스트 → 공유 순 내림차순 정렬
  const posts = mergedPosts
    .map(normalize)
    .sort((a, b) => {
      if (b.like_count !== a.like_count) return b.like_count - a.like_count;
      if (b.replies_count !== a.replies_count) return b.replies_count - a.replies_count;
      if (b.repost_count !== a.repost_count) return b.repost_count - a.repost_count;
      return b.quote_count - a.quote_count;
    });

  const nextCursor = json.paging?.cursors?.after;

  return { posts, cursor: nextCursor };
}

// ─────────────────────────────────────────────────────────────
// 필터 적용 (미디어 타입별)
// ─────────────────────────────────────────────────────────────

export function filterByMediaType(
  posts: ThreadPost[],
  filter: "all" | "text" | "image" | "video"
): ThreadPost[] {
  if (filter === "all") return posts;
  const typeMap: Record<string, ThreadMediaType[]> = {
    text: ["TEXT"],
    image: ["IMAGE", "CAROUSEL_ALBUM"],
    video: ["VIDEO"],
  };
  const allowed = typeMap[filter] ?? [];
  return posts.filter((p) => allowed.includes(p.media_type));
}

// ─────────────────────────────────────────────────────────────
// 계정 분석: 특정 사용자의 게시물 목록 조회
// ─────────────────────────────────────────────────────────────

const USER_POST_FIELDS = [
  "id",
  "text",
  "media_type",
  "thumbnail_url",
  "media_url",
  "timestamp",
  "permalink",
  "like_count",
  "replies_count",
  "repost_count",
].join(",");

/**
 * 특정 사용자의 최근 게시물 조회
 * GET /{user_id}/threads
 */
export async function getThreadsUserPosts(
  threadsUserId: string,
  accessToken: string,
  limit = 30
): Promise<ThreadPost[]> {
  const params = new URLSearchParams({
    fields: USER_POST_FIELDS,
    access_token: accessToken,
    limit: String(limit),
  });

  const res = await fetch(
    `${THREADS_API}/${threadsUserId}/threads?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch user posts: ${errText}`);
  }

  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  return (json.data ?? []).map(normalize);
}

/**
 * username → Threads user_id + profile 조회
 * 사용자의 OAuth 토큰으로 username 검색
 */
export async function getThreadsUserByUsername(
  username: string,
  accessToken: string
): Promise<{
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
  biography?: string;
} | null> {
  // 먼저 username으로 사용자 검색 시도
  const handle = username.replace(/^@/, "");
  const fields = "id,username,name,threads_profile_picture_url,threads_biography,followers_count";

  // Threads API: user lookup by username
  const res = await fetch(
    `${THREADS_API}/${handle}?fields=${fields}&access_token=${accessToken}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  if (!data.id) return null;

  return {
    id: String(data.id),
    username: String(data.username ?? handle),
    name: data.name ? String(data.name) : undefined,
    profile_picture_url: data.threads_profile_picture_url
      ? String(data.threads_profile_picture_url)
      : undefined,
    followers_count: Number(data.followers_count ?? 0),
    biography: data.threads_biography ? String(data.threads_biography) : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// 계정 분석: 인사이트 계산
// ─────────────────────────────────────────────────────────────

export interface ThreadsAccountInsights {
  avgLikes: number;
  avgReposts: number;
  avgReplies: number;
  medianEngagement: number;
  bestPost: ThreadPost | null;
  postFrequencyDays: number;
  bestDayOfWeek: string;
  bestHour: number;
  engagementTrend: "growing" | "stable" | "declining";
  trendPercent: number;
  mediaTypeBreakdown: Record<string, number>;
  bestMediaType: string;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function calculateAccountInsights(posts: ThreadPost[]): ThreadsAccountInsights {
  if (posts.length === 0) {
    return {
      avgLikes: 0, avgReposts: 0, avgReplies: 0, medianEngagement: 0,
      bestPost: null, postFrequencyDays: 0, bestDayOfWeek: "-", bestHour: 12,
      engagementTrend: "stable", trendPercent: 0,
      mediaTypeBreakdown: {}, bestMediaType: "-",
    };
  }

  // 평균 계산
  const totalLikes = posts.reduce((s, p) => s + p.like_count, 0);
  const totalReposts = posts.reduce((s, p) => s + p.repost_count, 0);
  const totalReplies = posts.reduce((s, p) => s + p.replies_count, 0);
  const n = posts.length;
  const avgLikes = Math.round(totalLikes / n);
  const avgReposts = Math.round(totalReposts / n);
  const avgReplies = Math.round(totalReplies / n);

  // 중앙값
  const engagements = posts
    .map((p) => p.like_count + p.repost_count + p.replies_count)
    .sort((a, b) => a - b);
  const medianEngagement = engagements[Math.floor(n / 2)];

  // 베스트 게시물
  const bestPost = posts.reduce((best, p) => {
    const eng = p.like_count + p.repost_count + p.replies_count;
    const bestEng = best.like_count + best.repost_count + best.replies_count;
    return eng > bestEng ? p : best;
  }, posts[0]);

  // 게시 빈도 (일 간격)
  const sorted = [...posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  let totalGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    totalGap +=
      (new Date(sorted[i].timestamp).getTime() -
        new Date(sorted[i + 1].timestamp).getTime()) /
      86_400_000;
  }
  const postFrequencyDays = sorted.length > 1 ? Math.round((totalGap / (sorted.length - 1)) * 10) / 10 : 0;

  // 최적 요일 + 시간
  const dayMap: Record<number, { count: number; engSum: number }> = {};
  const hourMap: Record<number, { count: number; engSum: number }> = {};
  for (const p of posts) {
    const d = new Date(p.timestamp);
    const day = d.getDay();
    const hour = d.getHours();
    const eng = p.like_count + p.repost_count + p.replies_count;

    if (!dayMap[day]) dayMap[day] = { count: 0, engSum: 0 };
    dayMap[day].count++;
    dayMap[day].engSum += eng;

    if (!hourMap[hour]) hourMap[hour] = { count: 0, engSum: 0 };
    hourMap[hour].count++;
    hourMap[hour].engSum += eng;
  }

  let bestDay = 0;
  let bestDayAvg = 0;
  for (const [day, v] of Object.entries(dayMap)) {
    const avg = v.engSum / v.count;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = Number(day);
    }
  }

  let bestHour = 12;
  let bestHourAvg = 0;
  for (const [hour, v] of Object.entries(hourMap)) {
    const avg = v.engSum / v.count;
    if (avg > bestHourAvg) {
      bestHourAvg = avg;
      bestHour = Number(hour);
    }
  }

  // 트렌드 (최근 절반 vs 이전 절반)
  const half = Math.floor(n / 2);
  const recentHalf = sorted.slice(0, half);
  const olderHalf = sorted.slice(half);
  const recentAvg =
    recentHalf.reduce((s, p) => s + p.like_count + p.repost_count + p.replies_count, 0) /
    Math.max(recentHalf.length, 1);
  const olderAvg =
    olderHalf.reduce((s, p) => s + p.like_count + p.repost_count + p.replies_count, 0) /
    Math.max(olderHalf.length, 1);
  const ratio = olderAvg > 0 ? recentAvg / olderAvg : 1;
  const trendPercent = Math.round((ratio - 1) * 100);
  const engagementTrend: ThreadsAccountInsights["engagementTrend"] =
    ratio > 1.15 ? "growing" : ratio < 0.85 ? "declining" : "stable";

  // 미디어 타입 분석
  const mediaMap: Record<string, { count: number; engSum: number }> = {};
  for (const p of posts) {
    const type = p.media_type;
    if (!mediaMap[type]) mediaMap[type] = { count: 0, engSum: 0 };
    mediaMap[type].count++;
    mediaMap[type].engSum += p.like_count + p.repost_count + p.replies_count;
  }
  const mediaTypeBreakdown: Record<string, number> = {};
  for (const [type, v] of Object.entries(mediaMap)) {
    mediaTypeBreakdown[type] = v.count;
  }

  let bestMediaType = "-";
  let bestMediaAvg = 0;
  for (const [type, v] of Object.entries(mediaMap)) {
    const avg = v.engSum / v.count;
    if (avg > bestMediaAvg) {
      bestMediaAvg = avg;
      bestMediaType = type;
    }
  }

  return {
    avgLikes, avgReposts, avgReplies, medianEngagement,
    bestPost, postFrequencyDays,
    bestDayOfWeek: DAY_NAMES[bestDay] ?? "-",
    bestHour, engagementTrend, trendPercent,
    mediaTypeBreakdown, bestMediaType,
  };
}

// ─────────────────────────────────────────────────────────────
// 내 계정 인사이트 (threads_manage_insights 스코프 필요)
// ─────────────────────────────────────────────────────────────

export interface ProfileInsights {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  followers_count: number;
  daily_views: { date: string; value: number }[];
}

export interface PostInsight {
  id: string;
  text: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  engagement_rate: number;
}

export interface MyAccountData {
  profile: {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count: number;
  };
  insights: ProfileInsights;
  posts: PostInsight[];
}

/**
 * 내 계정 프로필 인사이트 (프로필 조회수 + 팔로워 수)
 * GET /me/threads_insights?metric=views&period=day&since=...&until=...
 * GET /me/threads_insights?metric=follower_count (총 팔로워 수)
 */
export async function getMyProfileInsights(
  accessToken: string,
  since: number,
  until: number
): Promise<ProfileInsights> {
  // 프로필 조회수 (daily) + 팔로워 수 병렬 호출
  const [viewsRes, followerRes] = await Promise.all([
    fetch(
      `${THREADS_API}/me/threads_insights?metric=views&period=day&since=${since}&until=${until}&access_token=${accessToken}`,
      { cache: "no-store" }
    ),
    fetch(
      `${THREADS_API}/me/threads_insights?metric=follower_count&access_token=${accessToken}`,
      { cache: "no-store" }
    ),
  ]);

  let dailyViews: { date: string; value: number }[] = [];
  let totalViews = 0;

  if (viewsRes.ok) {
    const viewsJson = (await viewsRes.json()) as {
      data?: { values?: { end_time: string; value: number }[] }[];
    };
    const viewsData = viewsJson.data?.[0]?.values ?? [];
    dailyViews = viewsData.map((v) => ({
      date: v.end_time.split("T")[0],
      value: v.value,
    }));
    totalViews = viewsData.reduce((s, v) => s + v.value, 0);
  }

  // 팔로워 수: insights API → fallback to profile API
  let followersCount = 0;
  if (followerRes.ok) {
    const fJson = (await followerRes.json()) as {
      data?: { total_value?: { value: number }; values?: { value: number }[] }[];
    };
    followersCount = fJson.data?.[0]?.total_value?.value
      ?? fJson.data?.[0]?.values?.[0]?.value
      ?? 0;
  }

  if (followersCount === 0) {
    try {
      const profile = await getThreadsProfile(accessToken);
      followersCount = profile.followers_count;
    } catch {
      // ignore
    }
  }

  return {
    views: totalViews,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    followers_count: followersCount,
    daily_views: dailyViews,
  };
}

/**
 * 내 게시물 목록 + 인사이트
 * 본인 게시물이므로 /me/threads에 engagement 필드 직접 포함 가능
 * 조회수만 별도 insights API 호출 필요
 */
export async function getMyPostsWithInsights(
  accessToken: string,
  limit = 30
): Promise<PostInsight[]> {
  // 본인 게시물은 engagement 필드를 리스트 호출에 직접 포함
  const fields = [
    "id", "text", "media_type", "timestamp", "permalink",
    "like_count", "replies_count", "repost_count", "quote_count",
  ].join(",");

  const res = await fetch(
    `${THREADS_API}/me/threads?fields=${fields}&limit=${limit}&access_token=${accessToken}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[Threads] getMyPostsWithInsights error:", err);
    return [];
  }

  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const rawPosts = json.data ?? [];

  console.log(`[Threads] fetched ${rawPosts.length} own posts, sample:`,
    rawPosts[0] ? JSON.stringify({
      id: rawPosts[0].id,
      like_count: rawPosts[0].like_count,
      replies_count: rawPosts[0].replies_count,
      repost_count: rawPosts[0].repost_count,
      quote_count: rawPosts[0].quote_count,
    }) : "none"
  );

  // 조회수만 per-post insights API로 가져오기 (engagement는 위에서 이미 포함)
  const viewsResults = await Promise.allSettled(
    rawPosts.map(async (post) => {
      const postId = String(post.id);
      try {
        const r = await fetch(
          `${THREADS_API}/${postId}/insights?metric=views&access_token=${accessToken}`,
          { cache: "no-store" }
        );
        if (!r.ok) return 0;
        const d = (await r.json()) as {
          data?: { values?: { value: number }[] }[];
        };
        return d.data?.[0]?.values?.[0]?.value ?? 0;
      } catch {
        return 0;
      }
    })
  );

  return rawPosts.map((post, i) => {
    const likes = Number(post.like_count ?? 0);
    const replies = Number(post.replies_count ?? 0);
    const reposts = Number(post.repost_count ?? 0);
    const quotes = Number(post.quote_count ?? 0);
    const views = viewsResults[i].status === "fulfilled" ? viewsResults[i].value : 0;
    const total = likes + replies + reposts + quotes;

    return {
      id: String(post.id),
      text: String(post.text ?? ""),
      media_type: String(post.media_type ?? "TEXT"),
      timestamp: String(post.timestamp ?? new Date().toISOString()),
      permalink: String(post.permalink ?? "https://www.threads.net"),
      views,
      likes,
      replies,
      reposts,
      quotes,
      shares: 0,
      engagement_rate: views > 0 ? Math.round((total / views) * 1000) / 10 : 0,
    };
  });
}
