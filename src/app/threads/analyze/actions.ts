"use server";

import {
  getThreadsUserByUsername,
  getThreadsUserPosts,
  calculateAccountInsights,
  calculateViralScore,
  type ThreadPost,
  type ThreadsAccountInsights,
} from "@/lib/threads";
import { getThreadsConnection } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export interface ThreadsAccountAnalysis {
  profile: {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count: number;
    biography?: string;
  };
  posts: ThreadPost[];
  insights: ThreadsAccountInsights;
}

/**
 * @username 또는 Threads URL → 계정 분석 데이터 반환
 */
export async function analyzeThreadsAccount(
  input: string
): Promise<ThreadsAccountAnalysis | { error: string }> {
  // 인증 확인
  const { userId } = await auth();
  if (!userId) return { error: "로그인이 필요합니다" };

  // Meta 연결 확인
  const connection = await getThreadsConnection(userId);
  if (!connection) return { error: "Meta 계정을 먼저 연결해주세요" };

  // 입력 파싱: @username, username, threads.net URL
  const username = parseInput(input);
  if (!username) return { error: "올바른 계정 이름을 입력해주세요 (예: @username)" };

  try {
    // 1. 프로필 조회
    const profile = await getThreadsUserByUsername(username, connection.access_token);
    if (!profile) return { error: `@${username} 계정을 찾을 수 없어요` };

    // 2. 최근 30개 게시물 조회
    const rawPosts = await getThreadsUserPosts(profile.id, connection.access_token, 30);

    // 3. 각 게시물에 바이럴 점수 + owner 정보 보완
    const posts: ThreadPost[] = rawPosts.map((p) => ({
      ...p,
      owner: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profile_picture_url: profile.profile_picture_url,
        followers_count: profile.followers_count,
      },
      viralScore: calculateViralScore(
        p.like_count,
        p.repost_count,
        p.replies_count,
        profile.followers_count,
        p.timestamp
      ),
    }));

    // 4. 인사이트 계산
    const insights = calculateAccountInsights(posts);

    return { profile, posts, insights };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "분석 중 오류가 발생했어요";
    // 토큰 만료
    if (msg.includes("190") || msg.includes("invalid_token")) {
      return { error: "Meta 연결이 만료됐어요. /threads 에서 다시 연결해주세요." };
    }
    return { error: msg };
  }
}

function parseInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // URL: threads.net/@username
  const urlMatch = trimmed.match(/threads\.net\/@?([\w.]+)/);
  if (urlMatch) return urlMatch[1];

  // @username
  if (trimmed.startsWith("@")) return trimmed.slice(1);

  // 그냥 username (영문+숫자+점+밑줄)
  if (/^[\w.]+$/.test(trimmed)) return trimmed;

  return null;
}
