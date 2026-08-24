/**
 * 비블 커뮤니티 공용 타입 · 상수 · 권한 헬퍼
 * (DB 접근은 서버에서 getSupabase() 서비스 롤로만 수행한다)
 */
import { isAdmin, canEditInsights } from "@/lib/adminAuth";

// ── 타입 ────────────────────────────────────────────────────────
export type ReadRole = "all" | "member";
export type WriteRole = "member" | "staff";

export interface Board {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  group_name: string;
  sort_order: number;
  read_role: ReadRole;
  write_role: WriteRole;
  allow_files: boolean;
  is_active: boolean;
}

export interface CommunityPost {
  id: string;
  board_id: string;
  author_id: string | null;
  author_name: string;
  title: string;
  content: string;
  is_notice: boolean;
  status: "published" | "deleted";
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string;
  content: string;
  status: "published" | "deleted";
  created_at: string;
}

export interface Attachment {
  id: string;
  post_id: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  storage_path: string;
  download_count: number;
  created_at: string;
}

/** 목록에서 쓰는 게시글 요약 (게시판 이름 조인 포함) */
export interface PostSummary extends CommunityPost {
  board?: { slug: string; name: string } | null;
}

// ── 상수 ────────────────────────────────────────────────────────
export const PAGE_SIZE = 20;
export const STORAGE_BUCKET = "community-files";
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_TITLE_LEN = 120;
export const MAX_CONTENT_LEN = 20000;
export const MAX_COMMENT_LEN = 2000;

/** 자료실 첨부 허용 확장자 (실행 파일 계열은 제외) */
export const ALLOWED_FILE_EXT = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp", "hwpx",
  "txt", "csv", "md",
  "zip", "7z",
  "png", "jpg", "jpeg", "gif", "webp", "svg",
  "mp4", "mov", "webm", "mp3", "wav",
  "psd", "ai", "sketch", "fig",
];

// ── 권한 ────────────────────────────────────────────────────────
export interface Viewer {
  id: string;
  email: string;
  plan: string;
}

/** 커뮤니티 운영진(공지·자료실 작성, 게시판 관리, 타인 글 삭제) */
export function canModerateCommunity(user: Pick<Viewer, "email" | "plan"> | null): boolean {
  if (!user) return false;
  return isAdmin({ email: user.email, plan: user.plan }) || canEditInsights({ email: user.email, plan: user.plan });
}

/** 게시판 읽기 권한 */
export function canReadBoard(board: Pick<Board, "read_role">, user: Viewer | null): boolean {
  if (board.read_role === "all") return true;
  return !!user;
}

/** 게시판 글쓰기 권한 */
export function canWriteBoard(board: Pick<Board, "write_role">, user: Viewer | null): boolean {
  if (!user) return false;
  if (board.write_role === "staff") return canModerateCommunity(user);
  return true;
}

/** 글·댓글 수정/삭제 권한 (작성자 본인 또는 운영진) */
export function canManagePost(
  post: Pick<CommunityPost, "author_id">,
  user: Viewer | null
): boolean {
  if (!user) return false;
  if (post.author_id && post.author_id === user.id) return true;
  return canModerateCommunity(user);
}

// ── 표시 헬퍼 ───────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (!bytes) return "0B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)}${units[i]}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

/** 작성자 표시명 (닉네임 없으면 이메일 앞부분 마스킹) */
export function displayName(name: string | null | undefined, email?: string | null): string {
  if (name && name.trim()) return name.trim();
  if (email) {
    const head = email.split("@")[0];
    return head.length <= 3 ? head : `${head.slice(0, 3)}***`;
  }
  return "비블 회원";
}

/** 목록 미리보기용 본문 요약 */
export function excerpt(content: string, max = 120): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

/** 게시판 목록을 그룹별로 묶는다 */
export function groupBoards(boards: Board[]): { group: string; boards: Board[] }[] {
  const map = new Map<string, Board[]>();
  for (const b of boards) {
    const list = map.get(b.group_name) ?? [];
    list.push(b);
    map.set(b.group_name, list);
  }
  return Array.from(map.entries()).map(([group, list]) => ({
    group,
    boards: list.sort((a, b) => a.sort_order - b.sort_order),
  }));
}
