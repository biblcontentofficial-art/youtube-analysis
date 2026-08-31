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
  type MemberGrade,
  type Membership,
  type Viewer,
  GUEST_MEMBERSHIP,
  gradeForPoints,
  PAGE_SIZE,
  POINT_RULES,
  BRAND_AUTHOR_EMAILS,
  BRAND_AVATAR_EMAIL,
  canModerateCommunity,
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

/**
 * 최근 며칠 안에 새 글이 올라온 게시판 id 집합 (메뉴 New 배지용).
 * 글이 3일간 안 올라오면 자연히 집합에서 빠져 배지가 사라지고,
 * 새 글이 올라오면 다시 3일간 유지된다.
 */
export async function getRecentBoardIds(days = 3): Promise<Set<string>> {
  const db = getSupabase();
  if (!db) return new Set();
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { data } = await db
    .from("community_posts")
    .select("board_id")
    .eq("status", "published")
    .gte("created_at", since)
    .limit(2000);
  return new Set(((data ?? []) as { board_id: string }[]).map((r) => r.board_id));
}

// ── 회원 등급 (활동 5단계 + 팀비블 멤버십) ──────────────────────
/**
 * 뷰어의 신분을 조회한다. 운영자는 항상 6등급.
 * 본인 방문 시점에 활동 점수를 다시 계산해 저장하므로, 글·댓글·좋아요가
 * 쌓이면 다음 방문에서 자동으로 승급된다.
 * 등급 테이블이 없는 환경(마이그레이션 전)에서는 브론즈로 취급해 기존 동작을 지킨다.
 */
export async function getViewerMembership(user: Viewer | null): Promise<Membership> {
  if (!user) return GUEST_MEMBERSHIP;
  if (canModerateCommunity(user)) return { grade: 6, points: 0, isTeambibl: true };
  const db = getSupabase();
  if (!db) return { grade: 2, points: 0, isTeambibl: false };

  const { data, error } = await db
    .from("community_member_grades")
    .select("grade, points, is_teambibl")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    const code = (error as { code?: string }).code ?? "";
    const missing = code === "42P01" || code === "PGRST205" || code === "42703";
    return { grade: missing ? 2 : 1, points: 0, isTeambibl: false };
  }

  const isTeambibl = !!data?.is_teambibl;
  const storedPoints = Number(data?.points ?? 0);
  const storedGrade = Math.min(Math.max(Number(data?.grade ?? 1), 1), 5) as MemberGrade;

  const computed = await computePoints(user.id);
  if (computed === null) {
    // 집계 실패 — 저장된 값을 그대로 쓴다 (0점으로 덮어써 강등시키지 않는다)
    return { grade: storedGrade, points: storedPoints, isTeambibl };
  }

  const points = computed;
  // 한 번 오른 등급은 내려가지 않는다 (글 삭제·규칙 변경으로 강등되는 불쾌감 방지)
  const grade = Math.max(gradeForPoints(points), storedGrade) as MemberGrade;

  if (!data || storedPoints !== points || storedGrade !== grade) {
    const patch: Record<string, unknown> = {
      user_id: user.id,
      grade,
      points,
      updated_at: new Date().toISOString(),
    };
    // granted_by 는 운영자가 남긴 값이므로 신규 행에만 기록한다
    if (!data) patch.granted_by = "auto";
    await db.from("community_member_grades").upsert(patch, { onConflict: "user_id" });
  }

  return { grade, points, isTeambibl };
}

/** 서울 기준 날짜(YYYY-MM-DD) */
function seoulDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** 날짜별 개수에 일일 상한을 적용해 합산한다 (서울 기준 하루) */
function cappedCount(timestamps: string[], dailyCap: number): number {
  const byDay = new Map<string, number>();
  for (const iso of timestamps) {
    const day = seoulDay(iso);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  let total = 0;
  for (const n of byDay.values()) total += Math.min(n, dailyCap);
  return total;
}

/** 연속 출석 보너스 (7일 연속마다) */
function streakBonus(visitDates: string[]): number {
  if (visitDates.length === 0) return 0;
  const days = Array.from(new Set(visitDates)).sort();
  let bonus = 0;
  let run = 1;
  for (let i = 1; i <= days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const cur = i < days.length ? new Date(`${days[i]}T00:00:00Z`).getTime() : -1;
    if (cur >= 0 && cur - prev === 86400000) {
      run += 1;
    } else {
      bonus += Math.floor(run / POINT_RULES.streakDays) * POINT_RULES.streakBonus;
      run = 1;
    }
  }
  return bonus;
}

/**
 * 활동 점수 계산 (글·댓글은 일일 상한 적용, 받은 좋아요는 남이 누른 것만)
 * 원본 데이터에서 매번 다시 계산하므로 규칙을 바꾸면 전원에게 자동 반영된다.
 * 조회가 하나라도 실패하면 null 을 돌려준다 — 0점으로 잘못 저장해 강등시키지 않기 위해서다.
 */
export async function computePoints(userId: string): Promise<number | null> {
  const db = getSupabase();
  if (!db) return null;

  const [postRes, commentRes, visitRes] = await Promise.all([
    db.from("community_posts").select("id, created_at")
      .eq("author_id", userId).eq("status", "published").limit(2000),
    db.from("community_comments").select("created_at")
      .eq("author_id", userId).eq("status", "published").limit(2000),
    db.from("community_visits").select("visit_date").eq("user_id", userId).limit(2000),
  ]);
  if (postRes.error || commentRes.error || visitRes.error) return null;

  const posts = postRes.data ?? [];
  const comments = commentRes.data ?? [];
  const visits = (visitRes.data ?? []).map((v) => String(v.visit_date));

  // 받은 좋아요: 자기 자신이 누른 것은 제외한다 (자기 좋아요로 점수를 올리는 우회 차단)
  let likesReceived = 0;
  const postIds = posts.map((p) => p.id as string);
  for (let i = 0; i < postIds.length; i += 200) {
    const { count, error } = await db
      .from("community_post_likes")
      .select("post_id", { count: "exact", head: true })
      .in("post_id", postIds.slice(i, i + 200))
      .neq("user_id", userId);
    if (error) return null;
    likesReceived += count ?? 0;
  }

  return (
    cappedCount(posts.map((p) => String(p.created_at)), POINT_RULES.postDailyCap) * POINT_RULES.post +
    cappedCount(comments.map((c) => String(c.created_at)), POINT_RULES.commentDailyCap) * POINT_RULES.comment +
    likesReceived * POINT_RULES.likeReceived +
    visits.length * POINT_RULES.visitDay +
    streakBonus(visits)
  );
}

/** 오늘(서울 기준) 방문 기록. 이미 있으면 무시 → 하루 1회만 쌓인다 */
export async function recordVisit(userId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  await db
    .from("community_visits")
    .upsert({ user_id: userId, visit_date: today }, { onConflict: "user_id,visit_date", ignoreDuplicates: true });
}

/** 운영자가 팀비블(수강생) 멤버십을 부여·해제한다 */
export async function setTeambibl(
  userId: string,
  isTeambibl: boolean,
  grantedBy: string
): Promise<string | null> {
  const db = getSupabase();
  if (!db) return "DB 미연결";
  const { error } = await db.from("community_member_grades").upsert(
    {
      user_id: userId,
      is_teambibl: isTeambibl,
      granted_by: grantedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error ? error.message : null;
}

export interface GradeMember {
  user_id: string;
  grade: number;
  granted_by: string | null;
  email: string | null;
  name: string | null;
}

/** 팀비블 수강생 목록 */
export async function listTeambiblMembers(): Promise<GradeMember[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from("community_member_grades")
    .select("user_id, grade, granted_by")
    .eq("is_teambibl", true)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error || !data?.length) return [];

  const ids = data.map((r) => r.user_id);
  const { data: profiles } = await db.from("profiles").select("id, email, first_name").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((r) => ({
    user_id: r.user_id,
    grade: r.grade,
    granted_by: r.granted_by,
    email: byId.get(r.user_id)?.email ?? null,
    name: byId.get(r.user_id)?.first_name ?? null,
  }));
}

/** 이메일로 회원 프로필 조회 (팀비블 부여용 · 대소문자 무시 정확 일치) */
export async function findProfileByEmail(
  email: string
): Promise<{ id: string; email: string } | null> {
  const db = getSupabase();
  if (!db) return null;
  // ilike 는 % _ 를 와일드카드로 해석하므로 이스케이프해 "정확 일치"로만 쓴다
  const exact = email.trim().replace(/[\\%_*]/g, "\\$&");
  const { data } = await db
    .from("profiles")
    .select("id, email")
    .ilike("email", exact)
    .maybeSingle();
  return data ? { id: data.id, email: data.email } : null;
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

// ── 프로필 사진 (소셜 로그인 아바타) ────────────────────────────
/**
 * auth 사용자 메타데이터의 프로필 사진을 id → URL 로 돌려준다.
 * (profiles 테이블에는 아바타 컬럼이 없어 admin API 로 조회하고,
 *  같은 사용자를 매 요청 조회하지 않도록 프로세스 내 캐시를 둔다)
 */
const AVATAR_TTL_MS = 10 * 60 * 1000;
const avatarCache = new Map<string, { url: string | null; at: number }>();

/** 카카오 아바타는 http 로 내려오는 경우가 있어 https 로 올린다 (혼합 콘텐츠 차단 방지) */
function normalizeAvatar(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  const https = url.startsWith("http://") ? `https://${url.slice(7)}` : url;
  return https.startsWith("https://") ? https : null;
}

export async function getAvatarMap(
  userIds: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const db = getSupabase();
  if (!db) return {};

  const now = Date.now();
  const ids = Array.from(new Set(userIds.filter((v): v is string => !!v)));
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const id of ids) {
    const hit = avatarCache.get(id);
    if (hit && now - hit.at < AVATAR_TTL_MS) {
      if (hit.url) out[id] = hit.url;
    } else {
      missing.push(id);
    }
  }

  await Promise.all(
    missing.map(async (id) => {
      try {
        const { data, error } = await db.auth.admin.getUserById(id);
        if (error) throw error;
        const meta = data.user?.user_metadata ?? {};
        const url = normalizeAvatar(meta.avatar_url) ?? normalizeAvatar(meta.picture);
        avatarCache.set(id, { url, at: Date.now() });
        if (url) out[id] = url;
      } catch {
        // 조회 실패는 이니셜 아바타로 자연스럽게 폴백된다
        avatarCache.set(id, { url: null, at: Date.now() });
      }
    })
  );

  // 브랜드 명의 계정(우지윤 등)은 이름과 마찬가지로 사진도 비블 공식 계정으로 통일한다
  const { data: profiles } = await db.from("profiles").select("id, email").in("id", ids);
  const brandIds = (profiles ?? [])
    .filter((p) => BRAND_AUTHOR_EMAILS.includes((p.email ?? "").trim().toLowerCase()))
    .map((p) => p.id as string);

  if (brandIds.length > 0) {
    const brandUrl = await getBrandAvatar();
    for (const id of brandIds) {
      if (brandUrl) out[id] = brandUrl;
      else delete out[id];
    }
  }

  return out;
}

/** 비블 공식 계정의 프로필 사진 (브랜드 명의 글에 공통 사용) */
async function getBrandAvatar(): Promise<string | null> {
  const db = getSupabase();
  if (!db) return null;
  const cached = avatarCache.get("__brand__");
  if (cached && Date.now() - cached.at < AVATAR_TTL_MS) return cached.url;

  let url: string | null = null;
  try {
    const { data: owner } = await db
      .from("profiles")
      .select("id")
      .ilike("email", BRAND_AVATAR_EMAIL)
      .maybeSingle();
    if (owner?.id) {
      const { data } = await db.auth.admin.getUserById(owner.id as string);
      const meta = data?.user?.user_metadata ?? {};
      url = normalizeAvatar(meta.avatar_url) ?? normalizeAvatar(meta.picture);
    }
  } catch {
    url = null;
  }
  avatarCache.set("__brand__", { url, at: Date.now() });
  return url;
}

/**
 * 작성자 id → 회원 등급 (아바타 배지용).
 * 운영진은 프로필의 email·plan 으로 판정하고, 나머지는 등급 테이블을 따른다.
 * 등급 테이블이 없는 환경에서는 크리에이터(2)로 취급해 표시가 깨지지 않게 한다.
 */
export async function getGradeMap(
  userIds: (string | null | undefined)[]
): Promise<Record<string, MemberGrade>> {
  const db = getSupabase();
  if (!db) return {};
  const ids = Array.from(new Set(userIds.filter((v): v is string => !!v)));
  if (ids.length === 0) return {};

  const [{ data: profiles }, gradeRes] = await Promise.all([
    db.from("profiles").select("id, email, plan").in("id", ids),
    db.from("community_member_grades").select("user_id, grade").in("user_id", ids),
  ]);

  // 등급 테이블·컬럼이 없는 환경에서는 브론즈로 취급해 표시가 깨지지 않게 한다
  const tableMissing = !!gradeRes.error;
  const stored = new Map<string, number>(
    (gradeRes.data ?? []).map((r) => [r.user_id as string, Number(r.grade)])
  );

  const out: Record<string, MemberGrade> = {};
  for (const p of profiles ?? []) {
    const id = p.id as string;
    if (canModerateCommunity({ email: p.email ?? "", plan: p.plan ?? "" })) {
      out[id] = 6; // 운영자
      continue;
    }
    const g = stored.get(id) ?? (tableMissing ? 2 : 1);
    out[id] = Math.min(Math.max(g, 1), 5) as MemberGrade;
  }
  return out;
}
