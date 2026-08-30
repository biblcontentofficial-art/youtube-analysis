/**
 * 비블 커뮤니티 공용 타입 · 상수 · 권한 헬퍼
 * (DB 접근은 서버에서 getSupabase() 서비스 롤로만 수행한다)
 */
import { isAdmin, canEditInsights } from "@/lib/adminAuth";

// ── 타입 ────────────────────────────────────────────────────────
export type ReadRole = "all" | "member";
/**
 * 게시판 쓰기 권한 (회원 등급제와 연동)
 * all = 새싹(1단계)부터 · member = 크리에이터(2단계)부터
 * teambibl = 팀비블(3단계)부터 · staff = 운영진(4단계)만
 */
export type WriteRole = "all" | "member" | "teambibl" | "staff";

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

/**
 * 자료실 첨부 허용 확장자 (실행 파일 계열은 제외)
 * svg 제외: 비공개 버킷 서명 URL이 인라인 렌더될 때 저장형 XSS가 되기 때문.
 */
export const ALLOWED_FILE_EXT: string[] = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp", "hwpx",
  "txt", "csv", "md",
  "zip", "7z",
  "png", "jpg", "jpeg", "gif", "webp",
  "mp4", "mov", "webm", "mp3", "wav",
  "psd", "ai", "sketch", "fig",
];

/**
 * 확장자 → MIME 매핑.
 * 클라이언트가 보낸 MIME은 신뢰하지 않고, 확장자에서 서버가 다시 결정한다.
 * 목록에 없는 확장자(psd·ai·sketch·fig 등 바이너리 원본)는 application/octet-stream 으로 떨어진다.
 */
export const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  hwp: "application/x-hwp",
  hwpx: "application/hwp+zip",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/plain",
  zip: "application/zip",
  "7z": "application/x-7z-compressed",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

/** 확장자로 안전한 MIME을 결정한다 (미등록 확장자는 다운로드 전용 타입) */
export function safeMimeForExt(ext: string): string {
  const key = (ext || "").trim().toLowerCase().replace(/^\./, "");
  return EXT_MIME[key] ?? "application/octet-stream";
}

/**
 * 게시판 slug로 쓸 수 없는 값.
 * /community/[board] 보다 정적 세그먼트가 우선하므로, 이 slug로 게시판을 만들면
 * 해당 게시판에 영원히 접근할 수 없다.
 */
export const RESERVED_BOARD_SLUGS: string[] = [
  "write", "admin", "new", "api", "sign", "confirm", "view", "all", "popular",
  "ranking", "about", "incubating",
];

/**
 * 게시판 메뉴를 피드 대신 특정 페이지로 직행시키는 오버라이드.
 * (사이드바·모바일 칩에서 사용 — 게시판 자체는 유지되고 글도 전체글보기에 남는다)
 */
export const BOARD_LINK_OVERRIDES: Record<string, string> = {
  agency: "/studio",
  consult: "/studio/class/consulting",
};

/**
 * 검색어 정제.
 * PostgREST or() 파서가 깨지지 않도록 % , ( ) * " \ 를 제거하고 trim 후 50자로 자른다.
 */
export function sanitizeSearch(q: string): string {
  if (!q) return "";
  return q.replace(/[%,()*"\\]/g, "").trim().slice(0, 50).trim();
}

// ── 포인트 · 레벨 (Skool 방식: 내 글이 좋아요를 받으면 1점) ──────
/** 레벨별 필요 누적 점수 (LV.1 = 0점 시작, 최대 LV.8) */
export const LEVEL_THRESHOLDS = [0, 5, 20, 65, 155, 515, 2015, 8015];

/** 누적 점수 → 레벨 (1~8) */
export function levelForPoints(points: number): number {
  let lv = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) lv = i + 1;
  }
  return lv;
}

/** 다음 레벨까지 남은 점수 (최고 레벨이면 null) */
export function pointsToNextLevel(points: number): number | null {
  const lv = levelForPoints(points);
  if (lv >= LEVEL_THRESHOLDS.length) return null;
  return LEVEL_THRESHOLDS[lv] - points;
}

/** 랭킹 한 줄 */
export interface MemberRank {
  author_id: string;
  author_name: string;
  points: number;
}

// ── 회원 등급 (4단계) ───────────────────────────────────────────
/**
 * 1 새싹: 가입 직후. 가입인사 게시판에만 글쓰기 (댓글·좋아요는 가능)
 * 2 크리에이터: 활동 조건을 채우면 자동 등업. 일반 게시판 글쓰기
 * 3 팀비블: 수강생. 운영진이 수동 부여. 팀비블 공간 글쓰기 추가
 * 4 운영진: 비블 팀 (canModerateCommunity 로 판정, 저장하지 않는다)
 */
export type MemberGrade = 1 | 2 | 3 | 4;

export const GRADE_NAMES: Record<MemberGrade, string> = {
  1: "새싹",
  2: "크리에이터",
  3: "팀비블",
  4: "운영진",
};

/** 새싹 → 크리에이터 자동 등업 조건 (전부 충족 시) */
export const PROMOTION_CRITERIA = {
  posts: 1,      // 게시글 1개 이상
  comments: 4,   // 댓글 4개 이상
  visitDays: 4,  // 방문 4일 이상
  likesGiven: 10, // 좋아요 누른 횟수 10회 이상
} as const;

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

/**
 * 게시판 읽기 권한.
 * 커뮤니티 전체가 비블랩 회원 전용이므로 로그인이 최소 조건이다
 * (레이아웃 게이트와 같은 규칙 — 클라이언트 내비게이션으로 게이트를 건너뛰어도 여기서 막힌다).
 * read_role 은 나중에 특정 게시판만 더 좁힐 때 쓰기 위해 남겨둔다.
 */
export function canReadBoard(_board: Pick<Board, "read_role">, user: Viewer | null): boolean {
  return !!user;
}

/**
 * 게시판 글쓰기 권한 (회원 등급 기준)
 * grade 는 getViewerGrade()로 조회한 값을 넘긴다 (운영진은 항상 4).
 */
export function canWriteBoard(
  board: Pick<Board, "write_role">,
  user: Viewer | null,
  grade: MemberGrade
): boolean {
  if (!user) return false;
  if (canModerateCommunity(user)) return true;
  switch (board.write_role) {
    case "all":
      return true;
    case "member":
      return grade >= 2;
    case "teambibl":
      return grade >= 3;
    case "staff":
      return false;
    default:
      return false;
  }
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
