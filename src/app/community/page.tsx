/**
 * /community — 카페형 커뮤니티 홈
 * ① 상단 배너  ② 게시판 미리보기 위젯 격자(최대 6칸)  ③ 전체 게시판 칩 목록
 *
 * 위젯 후보는 canReadBoard를 통과한 게시판뿐이다.
 * 회원 전용 게시판은 후보 단계에서 빠지므로 비로그인 방문자에게 글 제목이 새지 않는다.
 */

import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getBoards, getBoardCounts, listBoardPreviews } from "@/lib/communityDb";
import { canReadBoard, groupBoards, type Board } from "@/lib/community";
import PreviewWidget from "./_components/PreviewWidget";

export const dynamic = "force-dynamic";

/** 위젯으로 먼저 올릴 게시판 (카페 홈 배치 순서) */
const WIDGET_PRIORITY = ["column", "notice", "greeting", "challenge", "qna", "results"];
const MAX_WIDGETS = 6;
const PER_BOARD = 6;

/** 우선순위 slug 먼저, 나머지는 sort_order 순으로 채워 최대 6개 */
function pickWidgetBoards(readable: Board[]): Board[] {
  const picked: Board[] = [];
  const taken = new Set<string>();

  for (const slug of WIDGET_PRIORITY) {
    if (picked.length >= MAX_WIDGETS) break;
    const board = readable.find((b) => b.slug === slug);
    if (board && !taken.has(board.id)) {
      picked.push(board);
      taken.add(board.id);
    }
  }
  for (const board of readable) {
    if (picked.length >= MAX_WIDGETS) break;
    if (taken.has(board.id)) continue;
    picked.push(board);
    taken.add(board.id);
  }
  return picked;
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3 shrink-0 text-neutral-500"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default async function CommunityHome() {
  const [user, boards, counts] = await Promise.all([
    currentUser(),
    getBoards(),
    getBoardCounts(),
  ]);

  const readable = boards.filter((b) => canReadBoard(b, user));
  const widgetBoards = pickWidgetBoards(readable);
  const previews = await listBoardPreviews(widgetBoards, PER_BOARD);

  const groups = groupBoards(boards);

  return (
    <div className="space-y-8">
      {/* ① 상단 배너 */}
      <section className="flex flex-col gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-snug tracking-tight text-white md:text-2xl">
            유튜브로 사업을 키우는 사람들이 모인 곳
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            채널 기획부터 촬영·편집·수익화까지, 직접 부딪힌 사람들이 답을 나눕니다.
          </p>
        </div>
        <Link
          href="/studio"
          className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-black hover:bg-neutral-200"
        >
          유튜브 채널 대행 문의하기
        </Link>
      </section>

      {/* ② 게시판 미리보기 위젯 */}
      {previews.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {previews.map((p) => (
            <PreviewWidget
              key={p.board.id}
              board={p.board}
              posts={p.posts}
              notices={p.notices}
              variant={p.board.slug === "column" ? "card" : "list"}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-10 text-center text-sm text-neutral-600">
          표시할 게시판이 없습니다
        </p>
      )}

      {/* ③ 전체 게시판 */}
      {groups.length > 0 && (
        <section>
          <h2 className="text-base font-bold tracking-tight text-white">전체 게시판</h2>
          <div className="mt-4 space-y-5">
            {groups.map((g) => (
              <div key={g.group}>
                <p className="text-xs font-bold text-neutral-500">{g.group}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.boards.map((b) => (
                    <Link
                      key={b.id}
                      href={`/community/${b.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600 hover:text-white"
                    >
                      {b.read_role === "member" && (
                        <>
                          <LockIcon />
                          <span className="sr-only">회원 전용</span>
                        </>
                      )}
                      <span className="truncate">{b.name}</span>
                      <span className="tabular-nums text-[11px] text-neutral-500">
                        {counts[b.id] ?? 0}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
