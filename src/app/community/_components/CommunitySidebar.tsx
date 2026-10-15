/**
 * 커뮤니티 좌측 사이드바 (카페형 · 데스크톱 전용)
 * 상단 정보 카드(멤버·글 수, 새 포스트, 오픈채팅방) 아래에
 * 즐겨찾는 게시판(전체글보기·인기글)과 그룹별 게시판 메뉴를 카페 순서 그대로 나열한다.
 * 그룹 소제목 사이 구분선은 한 겹만 둔다(DESIGN 6.26).
 *
 * 게시판 링크 규약: 피드는 /community?cat={slug} 쿼리 파라미터로 필터링한다.
 * (피드 페이지의 ?cat= 파싱과 반드시 같은 slug 규약을 쓴다)
 * 지금 보고 있는 게시판 표시는 SidebarBoardLink(클라이언트 잎)가 URL 로 판정한다.
 * 메뉴 카드는 데스크톱에서 네비 아래에 붙어(sticky) 길어도 안에서 스크롤된다.
 */

import { KakaoTalkIcon } from "@/components/ui/icons";
import { BOARD_LINK_OVERRIDES, groupBoards, type Board } from "@/lib/community";
import { buttonClass } from "@/components/ui/button";
import NewPostButton from "./NewPostButton";
import SidebarBoardLink, { NewBadge, type SidebarCurrent } from "./SidebarBoardLink";

export { NewBadge };

interface Props {
  boards: Board[];
  stats: { posts: number; members: number };
  /** board_id → 게시글 수 (getBoardCounts) */
  counts: Record<string, number>;
  /** 최근 3일 내 새 글이 올라온 게시판 id (New 배지) */
  recentBoardIds: Set<string>;
  /** 고정 화면용: 지금 보고 있는 곳을 URL 대신 이 값으로 표시 */
  current?: SidebarCurrent;
}

/** 카페 원본에서 굵게 강조된 메뉴 (소유자 예외 노란 강조, DESIGN 3.4) */
const EMPHASIZED_SLUGS = new Set(["incubating-apply"]);

const GROUP_TITLE = "px-3 pb-1 pt-3 text-caption text-fg-3";
const GROUP_DIVIDER = "my-2 h-px bg-line-soft";
const COUNT = "ml-2 shrink-0 text-micro tnum text-fg-3";

export default function CommunitySidebar({ boards, stats, counts, recentBoardIds, current }: Props) {
  const groups = groupBoards(boards);

  return (
    // lg:h-full: aside(본문 높이만큼 늘어남)를 채워야 안쪽 메뉴 카드의 sticky 가 본문 끝까지 따라온다
    <div className="space-y-4 lg:h-full">
      {/* 커뮤니티 정보 */}
      <div className="rounded-card border border-line bg-surface p-5">
        <p className="text-body-sm font-bold text-fg">비블 커뮤니티</p>
        <p className="mt-1.5 text-caption text-fg-3">유튜브로 사업을 키우는 사람들의 공간</p>
        <p className="mt-3 text-caption text-fg-3">
          멤버{" "}
          <span className="tnum font-semibold text-fg-1">{stats.members.toLocaleString()}</span>
          {" · "}글{" "}
          <span className="tnum font-semibold text-fg-1">{stats.posts.toLocaleString()}</span>
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <NewPostButton className={buttonClass({ variant: "secondary", block: true })} />
          <a
            href="https://open.kakao.com/o/gsMC55Jh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-control border border-line-strong bg-surface px-4 py-2.5 text-center transition-colors duration-150 hover:border-line-hover hover:bg-surface-2"
          >
            <span className="flex items-center gap-1.5 text-body-sm font-semibold text-fg">
              <KakaoTalkIcon size={20} />
              비블 오픈채팅방 참여<span className="sr-only"> (새 창)</span>
            </span>
            <span className="mt-0.5 block text-caption text-fg-3">참여코드 230000</span>
          </a>
        </div>
      </div>

      {/* 게시판 메뉴 (카페형: 소제목 + 구분선 한 겹). 데스크톱에서 네비 아래에 고정 */}
      <nav
        aria-label="게시판 메뉴"
        data-sidebar-scroll=""
        className="rounded-card border border-line bg-surface p-2 lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:max-h-[calc(100dvh-var(--nav-h)-2rem)] lg:overflow-y-auto"
      >
        {/* 즐겨찾는 게시판 */}
        <p className={GROUP_TITLE}>즐겨찾는 게시판</p>
        <ul className="flex flex-col">
          <li>
            <SidebarBoardLink href="/community" target={{ kind: "all" }} current={current}>
              <span>전체글보기</span>
              <span className={COUNT}>{stats.posts.toLocaleString()}</span>
            </SidebarBoardLink>
          </li>
          <li>
            <SidebarBoardLink href="/community?sort=popular" target={{ kind: "popular" }} current={current}>
              <span>인기글</span>
            </SidebarBoardLink>
          </li>
        </ul>

        {/* 그룹별 게시판 */}
        {groups.map(({ group, boards: groupItems }) => (
          <div key={group}>
            <div aria-hidden="true" className={GROUP_DIVIDER} />
            <p className={GROUP_TITLE}>{group}</p>
            <ul className="flex flex-col">
              {groupItems.map((b) => {
                // 일부 메뉴는 피드 대신 안내 페이지로 직행한다 (글 수·New 배지 미표시)
                const override = BOARD_LINK_OVERRIDES[b.slug];
                if (override) {
                  return (
                    <li key={b.id}>
                      <SidebarBoardLink href={override} target={{ kind: "none" }} current={current}>
                        <span className="truncate">{b.name}</span>
                      </SidebarBoardLink>
                    </li>
                  );
                }
                return (
                  <li key={b.id}>
                    {/* 피드 카테고리 필터 규약: /community?cat={slug} */}
                    <SidebarBoardLink
                      href={`/community?cat=${b.slug}`}
                      target={{ kind: "board", slug: b.slug }}
                      current={current}
                    >
                      <span className="flex min-w-0 items-center">
                        <span
                          className={
                            EMPHASIZED_SLUGS.has(b.slug)
                              ? "truncate font-bold text-owner-yellow"
                              : "truncate"
                          }
                        >
                          {b.name}
                        </span>
                        {recentBoardIds.has(b.id) && <NewBadge />}
                      </span>
                      <span className={COUNT}>{counts[b.id] ?? 0}</span>
                    </SidebarBoardLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
