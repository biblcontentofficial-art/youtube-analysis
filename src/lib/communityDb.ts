/**
 * 커뮤니티 서버 전용 데이터 접근 (서비스 롤)
 * 권한 검사는 호출부(page/route)에서 community.ts 헬퍼로 수행한다.
 */
import "server-only";
import { getSupabase } from "@/lib/supabase";
import {
  type Board,
  type CommunityPost,
  type CommunityComment,
  type Attachment,
  type PostSummary,
  PAGE_SIZE,
} from "@/lib/community";

export async function getBoards(): Promise<Board[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from("community_boards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[community:boards]", error.message);
    return [];
  }
  return (data ?? []) as Board[];
}

export async function getBoard(slug: string): Promise<Board | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data } = await db
    .from("community_boards")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Board) ?? null;
}

export interface ListResult {
  posts: CommunityPost[];
  notices: CommunityPost[];
  total: number;
}

/** 게시판 글 목록 (공지 상단 분리 + 페이지네이션 + 검색) */
export async function listPosts(
  boardId: string,
  { page = 1, q = "" }: { page?: number; q?: string } = {}
): Promise<ListResult> {
  const db = getSupabase();
  if (!db) return { posts: [], notices: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;

  let query = db
    .from("community_posts")
    .select("*", { count: "exact" })
    .eq("board_id", boardId)
    .eq("status", "published")
    .eq("is_notice", false);

  if (q.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  }

  const [{ data: posts, count }, { data: notices }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1),
    db
      .from("community_posts")
      .select("*")
      .eq("board_id", boardId)
      .eq("status", "published")
      .eq("is_notice", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    posts: (posts ?? []) as CommunityPost[],
    notices: (notices ?? []) as CommunityPost[],
    total: count ?? 0,
  };
}

/** 커뮤니티 홈: 전체 게시판 최신글 */
export async function listRecentPosts(limit = 12): Promise<PostSummary[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data } = await db
    .from("community_posts")
    .select("*, board:community_boards(slug,name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as PostSummary[];
}

/** 커뮤니티 홈: 인기글 (최근 14일 좋아요·조회수 기준) */
export async function listPopularPosts(limit = 5): Promise<PostSummary[]> {
  const db = getSupabase();
  if (!db) return [];
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data } = await db
    .from("community_posts")
    .select("*, board:community_boards(slug,name)")
    .eq("status", "published")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as PostSummary[];
}

export async function getPost(id: string): Promise<PostSummary | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data } = await db
    .from("community_posts")
    .select("*, board:community_boards(slug,name)")
    .eq("id", id)
    .maybeSingle();
  if (!data || (data as PostSummary).status !== "published") return null;
  return data as PostSummary;
}

export async function getComments(postId: string): Promise<CommunityComment[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data } = await db
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  return (data ?? []) as CommunityComment[];
}

export async function getAttachments(postId: string): Promise<Attachment[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data } = await db
    .from("community_attachments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Attachment[];
}

/** 내가 이 글에 좋아요를 눌렀는지 */
export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { data } = await db
    .from("community_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** 조회수 원자적 증가 (실패해도 무시) */
export async function incrementView(postId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  await db.rpc("community_increment_view", { p_post_id: postId }).then(
    () => {},
    () => {}
  );
}

/** 게시판별 글 개수 (홈 카드 표시용) */
export async function getBoardCounts(): Promise<Record<string, number>> {
  const db = getSupabase();
  if (!db) return {};
  const { data } = await db
    .from("community_posts")
    .select("board_id")
    .eq("status", "published")
    .limit(5000);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { board_id: string }[]) {
    counts[row.board_id] = (counts[row.board_id] ?? 0) + 1;
  }
  return counts;
}
