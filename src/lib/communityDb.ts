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
  sanitizeSearch,
  type MemberRank,
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

/**
 * 게시판 글 목록 (공지 상단 고정 + 페이지네이션 + 검색)
 * 공지도 일반 목록·검색·페이지네이션에 그대로 포함된다.
 * (예전처럼 본문에서 is_notice=false 로 배제하면 6번째 이후 공지가 어디에도 안 나온다)
 * 상단 고정으로 이미 보이는 최신 공지 5개만, 첫 페이지·검색 없음일 때 본문에서 제외해 중복을 막는다.
 */
export async function listPosts(
  boardId: string,
  { page = 1, q = "" }: { page?: number; q?: string } = {}
): Promise<ListResult> {
  const db = getSupabase();
  if (!db) return { posts: [], notices: [], total: 0 };

  const term = sanitizeSearch(q);
  // 상단 고정 노출 조건은 호출부(board/page.tsx)와 동일하게 원본 q 기준으로 판단한다.
  // (정제 후 빈 문자열이 되는 검색어에서 공지가 통째로 사라지지 않도록)
  const pinTop = page === 1 && !q.trim();
  const from = (page - 1) * PAGE_SIZE;

  // 상단 고정용 공지 (최신 5개) — 본문에서 제외할 id를 먼저 확보해야 한다
  const { data: noticeRows } = await db
    .from("community_posts")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "published")
    .eq("is_notice", true)
    .order("created_at", { ascending: false })
    .limit(5);
  const notices = (noticeRows ?? []) as CommunityPost[];

  let query = db
    .from("community_posts")
    .select("*", { count: "exact" })
    .eq("board_id", boardId)
    .eq("status", "published");

  if (term) {
    query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  }

  const excludeIds = pinTop ? notices.map((n) => n.id) : [];
  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: posts, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return {
    posts: (posts ?? []) as CommunityPost[],
    notices,
    // total은 항상 공지 포함 기준. 상단 고정으로 제외한 만큼(excludeIds) 다시 더해
    // 페이지마다 전체 개수·페이지 수가 흔들리지 않게 한다.
    total: (count ?? 0) + excludeIds.length,
  };
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

/**
 * 조회수 원자적 증가 (실패해도 무시)
 * 서버 렌더에서 호출하지 말 것 — /api/community/view 를 통해 클라이언트에서 1회만 호출.
 * (서버 렌더에서 올리면 댓글 작성 후 router.refresh() 마다 조회수가 중복 증가한다)
 */
export async function incrementView(postId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  await db.rpc("community_increment_view", { p_post_id: postId }).then(
    () => {},
    () => {}
  );
}

/**
 * 게시판별 글 개수 (홈 카드 표시용)
 * DB 집계(RPC) 우선 — 행을 끌어와 세는 방식은 글이 5천 건을 넘으면 숫자가 굳는다.
 * RPC가 없는 환경(구버전 마이그레이션)에서는 기존 방식으로 폴백한다.
 */
export async function getBoardCounts(): Promise<Record<string, number>> {
  const db = getSupabase();
  if (!db) return {};
  const counts: Record<string, number> = {};

  const { data: agg, error } = await db.rpc("community_board_counts");
  if (!error && Array.isArray(agg)) {
    for (const row of agg as { board_id: string; cnt: number | string }[]) {
      counts[row.board_id] = Number(row.cnt) || 0;
    }
    return counts;
  }
  if (error) console.error("[community:board_counts]", error.message);

  // 폴백: community_board_counts RPC 미적용 환경
  const { data } = await db
    .from("community_posts")
    .select("board_id")
    .eq("status", "published")
    .limit(5000);
  for (const row of (data ?? []) as { board_id: string }[]) {
    counts[row.board_id] = (counts[row.board_id] ?? 0) + 1;
  }
  return counts;
}

export interface FeedResult {
  posts: PostSummary[];
  total: number;
}

/**
 * 전체글보기 / 인기글 피드.
 * boardIds는 읽기 권한이 있는 게시판만 넘긴다(빈 배열이면 즉시 빈 결과).
 * sort: "recent" = 최신순, "popular" = 최근 30일 좋아요·조회수순
 */
export async function listFeed(
  boardIds: string[],
  { page = 1, q = "", sort = "recent" }: { page?: number; q?: string; sort?: "recent" | "popular" } = {}
): Promise<FeedResult> {
  if (boardIds.length === 0) return { posts: [], total: 0 };
  const db = getSupabase();
  if (!db) return { posts: [], total: 0 };

  const term = sanitizeSearch(q);
  const from = (page - 1) * PAGE_SIZE;

  let query = db
    .from("community_posts")
    .select("*, board:community_boards(slug,name)", { count: "exact" })
    .eq("status", "published")
    .in("board_id", boardIds);

  if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);

  if (sort === "popular") {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    query = query
      .gte("created_at", since)
      .order("like_count", { ascending: false })
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { posts: (data ?? []) as PostSummary[], total: count ?? 0 };
}

/** 커뮤니티 전체 통계 (사이드바 프로필 카드) */
export async function getCommunityStats(): Promise<{ posts: number; members: number }> {
  const db = getSupabase();
  if (!db) return { posts: 0, members: 0 };
  const [{ count: posts }, { count: members }] = await Promise.all([
    db.from("community_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return { posts: posts ?? 0, members: members ?? 0 };
}

// ── 포인트 · 멤버 랭킹 (Skool 방식) ─────────────────────────────

/**
 * 멤버 포인트 랭킹. since 를 주면 그 시점 이후 받은 좋아요만 집계, 없으면 전체 기간.
 * RPC(community_member_ranking) 우선, 미적용 환경에서는 JS 집계로 폴백한다.
 */
export async function getMemberRanking(
  since?: Date,
  limit = 50
): Promise<MemberRank[]> {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db.rpc("community_member_ranking", {
    p_since: since ? since.toISOString() : null,
  });
  if (!error && Array.isArray(data)) {
    return (data as { author_id: string; author_name: string; points: number | string }[])
      .slice(0, limit)
      .map((r) => ({ author_id: r.author_id, author_name: r.author_name, points: Number(r.points) || 0 }));
  }
  if (error) console.error("[community:ranking]", error.message);

  // 폴백: likes + posts 를 앱에서 조인 집계 (RPC 미적용 환경)
  let likesQuery = db.from("community_post_likes").select("post_id, created_at").limit(5000);
  if (since) likesQuery = likesQuery.gte("created_at", since.toISOString());
  const { data: likes } = await likesQuery;
  if (!likes || likes.length === 0) return [];

  const postIds = Array.from(new Set((likes as { post_id: string }[]).map((l) => l.post_id)));
  const { data: posts } = await db
    .from("community_posts")
    .select("id, author_id, author_name, status")
    .in("id", postIds);

  const byPost = new Map(
    ((posts ?? []) as { id: string; author_id: string | null; author_name: string; status: string }[])
      .filter((p) => p.author_id && p.status === "published")
      .map((p) => [p.id, p])
  );
  const acc = new Map<string, MemberRank>();
  for (const l of likes as { post_id: string }[]) {
    const post = byPost.get(l.post_id);
    if (!post || !post.author_id) continue;
    const cur = acc.get(post.author_id) ?? { author_id: post.author_id, author_name: post.author_name, points: 0 };
    cur.points += 1;
    acc.set(post.author_id, cur);
  }
  return Array.from(acc.values()).sort((a, b) => b.points - a.points).slice(0, limit);
}

/**
 * 작성자별 전체 기간 점수 맵 (피드 카드의 레벨 배지용).
 * 랭킹 전체를 한 번 집계해 Map 으로 접는다 — 멤버 규모에서 충분히 저렴하다.
 */
export async function getPointsMap(): Promise<Record<string, number>> {
  const ranking = await getMemberRanking(undefined, 1000);
  const map: Record<string, number> = {};
  for (const r of ranking) map[r.author_id] = r.points;
  return map;
}
