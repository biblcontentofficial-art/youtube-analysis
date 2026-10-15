/**
 * C7 관심 목록 화면(props 만 받음, 데이터·인증 호출 없음). 데이터는 src/lib/trend/watch.ts(listWatch · listNotifications).
 * 근거: docs/trend-dev/spec.md 3.7 · 1.3 · DESIGN.md 6.9 입력 · 6.10 목록 · 6.12 태그 · 6.13 상태 상자 · 6.15 .ext · 6.20 빈 상태
 *
 *   <WatchView data={data} badge={3} />                 탭 페이지(섹션 머리 + 탭 줄 + 본문)
 *   <WatchSection data={data} heading="h2" />           본문만(정보 구조를 안 B·C 로 바꿀 때 다른 페이지에 넣는다)
 *   <WatchView data={data} preview initialError="limit" />   로컬 미리보기(요청 없이 표시만 바뀜, 한도 문구를 처음부터 보임)
 *
 * - 두 칸: 1024 이상 12칸 격자(왼쪽 4칸 관리 · 오른쪽 8칸 새 영상). 1024 미만은 새 영상을 먼저, 관리를 아래에(볼 것이 위).
 *   DOM 순서도 새 영상 → 관리(키보드 순서 = 모바일 순서), 1024 이상에서만 order 로 관리를 왼쪽에 둔다.
 *   걸린 영상이 하나도 없으면(처음 쓰는 사용자 등) 1024 미만에서도 관리를 위에 둔다. 볼 것이 없고, 아래로 밀린 '추가'가
 *   첫 화면 오른쪽 아래 카카오 버튼에 가리지 않게 한다(DESIGN 8, 360×780).
 * - 새 영상: 게시 날짜별 묶음('10월 14일 게시'), 같은 영상에 키워드·채널이 함께 걸리면 한 줄에 이유 태그 둘.
 *   안 읽은 항목은 제목 font-semibold text-fg + 태그 '새'(6.12 기본 모양, 색 없음). 빨간 배지·원형 배지 없음.
 *   페이지를 열면 안 읽은 것을 한 번 읽음 처리(MarkNotificationsRead, POST)하되 이번 화면 표시는 그대로 둔다.
 * - 읽음 처리는 탭 숫자(badge, notification_unread_count 전체 개수)가 0보다 크면 보낸다(목록 200개 밖의 안 읽은 알림도 처리).
 * - 목록 아래 DerivedNotice '알림 기준(평균 대비·구독자 대비)은'. 불러오기 실패(error)는 6.13 오류 상자(빈 상태 문구로 떨어지지 않음).
 */
import { SectionHeader } from "@/components/ui/section-header";
import { cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { WarningIcon } from "@/components/ui/icons";
import { DerivedNotice } from "@/components/ui/notice";
import type { NotificationItem, WatchList } from "@/lib/trend/watch";
import { BreakoutTabs } from "../_components/BreakoutTabs";
import { MarkNotificationsRead, WatchManager } from "./WatchManager";

/** 섹션 설명(spec 3.7). 스켈레톤(loading.tsx)도 같은 글자를 그려 줄바꿈·높이를 실제와 맞춘다 */
export const WATCH_DESC = "등록한 키워드·채널의 영상이 브레이크아웃에 오르면 여기에 모아 드립니다. 매일 아침 수집 뒤 갱신됩니다(보통 오전 8시 전).";

export type WatchPageData = { state: "ok"; watch: WatchList; notifications: NotificationItem[] } | { state: "error" };

/** 칸 제목(관심 키워드 · 관심 채널 · 새 영상) */
export const COL_HEAD = "text-body font-semibold text-fg";

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;

/** 화면 숫자 표기(브레이크아웃 영상 탭 num() 과 같은 규칙: 6.2만 · 8,200) */
function num(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(n >= 1_000_000_000 ? 0 : 1).replace(/\.0$/, "")}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}

/** '2026-10-14' → '10월 14일' */
function monthDay(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(m)}월 ${Number(day)}일`;
}

/** 유튜브로 나가는 ↗(DESIGN 6.15 .ext: 평소 무채색, 링크 hover·포커스 때만 유튜브 빨강) */
function ExtIcon() {
  return (
    <svg className="ext ml-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** 6.13 오류 상자(기호와 제목만 negative, 면 칠하지 않음) */
function ErrorBox({ className }: { className?: string }) {
  return (
    <div role="status" className={cx("flex gap-3 rounded-card border border-line bg-surface p-4", className)}>
      <WarningIcon className="mt-0.5 shrink-0 text-negative" />
      <div className="min-w-0">
        <p className="text-ui font-semibold text-negative">데이터를 불러오지 못했습니다.</p>
        <p className="mt-0.5 text-body-sm text-fg-3">잠시 뒤 새로고침해 주세요.</p>
      </div>
    </div>
  );
}

/** 6.20 빈 상태(목록 자리 안) */
function EmptyBox({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={cx("flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8", className)}>
      <div>
        <p className="text-ui font-semibold text-fg">{title}</p>
        <p className="mt-1 text-body-sm text-fg-3">{body}</p>
      </div>
    </div>
  );
}

type Reason = { kind: "keyword"; term: string } | { kind: "channel" };
type VideoItem = {
  videoId: string;
  title: string | null;
  thumbnail: string | null;
  channelId: string | null;
  channelTitle: string | null;
  viewCount: number | null;
  unread: boolean;
  reasons: Reason[];
};

/** 알림 → 게시 날짜별 묶음(새 날짜 먼저). 같은 날짜·영상의 키워드·채널 알림은 한 줄로 합친다(이유는 키워드 먼저) */
export function groupNotifications(items: NotificationItem[]): { date: string; videos: VideoItem[] }[] {
  const byDate = new Map<string, Map<string, VideoItem>>();
  for (const n of items) {
    let day = byDate.get(n.snapshotDate);
    if (!day) byDate.set(n.snapshotDate, (day = new Map()));
    let v = day.get(n.videoId);
    if (!v) {
      v = { videoId: n.videoId, title: n.title, thumbnail: n.thumbnail, channelId: n.channelId, channelTitle: n.channelTitle, viewCount: n.viewCount, unread: false, reasons: [] };
      day.set(n.videoId, v);
    }
    if (!n.read) v.unread = true;
    v.reasons.push(n.kind === "keyword" ? { kind: "keyword", term: n.term ?? "" } : { kind: "channel" });
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([date, m]) => ({
      date,
      videos: [...m.values()].map((v) => ({ ...v, reasons: [...v.reasons].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "keyword" ? -1 : 1)) })),
    }));
}

function reasonLabel(r: Reason): string {
  return r.kind === "keyword" ? `키워드 · ${r.term}` : "채널";
}

/** 영상 한 줄(영상 탭 목록 모양, 길이 표시 없음: 알림에는 길이를 저장하지 않는다) */
function VideoRow({ v, heading: H }: { v: VideoItem; heading: "h4" | "h5" }) {
  const thumb = v.thumbnail ?? `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`;
  return (
    <li className="flex gap-3 py-4 md:gap-4">
      <a href={watchUrl(v.videoId)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="relative w-28 shrink-0 self-start overflow-hidden rounded-control bg-surface-2 md:w-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
      </a>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5">
          {v.unread ? <span className={badgeClass()}>새</span> : null}
          {v.reasons.map((r, i) => (
            <span key={i} className={badgeClass()}>{reasonLabel(r)}</span>
          ))}
        </p>
        <H className={cx("mt-1.5 text-ui leading-[1.5] md:text-body", v.unread ? "font-semibold text-fg" : "font-medium text-fg-1")}>
          <a href={watchUrl(v.videoId)} target="_blank" rel="noopener noreferrer" className="line-clamp-2 transition-colors duration-150 hover:text-fg">
            {v.unread ? <span className="sr-only">새 영상: </span> : null}
            {v.title ?? "제목 없음"}<ExtIcon /><span className="sr-only"> (새 창)</span>
          </a>
        </H>
        {v.channelTitle && v.channelId ? (
          <a href={channelUrl(v.channelId)} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-micro text-fg-3 transition-colors duration-150 hover:text-fg">{v.channelTitle}</a>
        ) : null}
        {v.viewCount != null ? (
          <p className="tnum mt-0.5 text-micro text-fg-3">조회수 <span className="font-semibold text-fg-2">{num(v.viewCount)}회</span></p>
        ) : null}
      </div>
    </li>
  );
}

/** 새 영상 칸 */
function NewVideos({ items, heading: H }: { items: NotificationItem[]; heading: "h2" | "h3" }) {
  const groups = groupNotifications(items);
  const sub = H === "h2" ? "h3" : "h4";
  const row = H === "h2" ? "h4" : "h5";
  const total = groups.reduce((n, g) => n + g.videos.length, 0);
  return (
    <section aria-labelledby="watch-new-title">
      <div className="flex items-baseline justify-between gap-3">
        <H id="watch-new-title" className={COL_HEAD}>새 영상</H>
        {total ? <p className="text-caption text-fg-3">최근 30일 · <span className="tnum">{total}</span>개</p> : null}
      </div>
      {groups.length === 0 ? (
        <EmptyBox className="mt-3" title="아직 걸린 영상이 없습니다." body="다음 수집은 내일 아침 6시입니다." />
      ) : (
        <div className="mt-3 flex flex-col gap-6">
          {groups.map((g) => {
            const Sub = sub;
            return (
              <div key={g.date}>
                <Sub className="border-b border-line pb-2 text-body-sm font-semibold text-fg-2">{monthDay(g.date)} 게시</Sub>
                <ul className="divide-y divide-line-soft">
                  {g.videos.map((v) => (
                    <VideoRow key={v.videoId} v={v} heading={row} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <DerivedNotice what="알림 기준(평균 대비·구독자 대비)은" className="mt-3" />
    </section>
  );
}

/** 본문(제목·설명·두 칸이나 오류 상자). 섹션 머리·탭 줄은 그리지 않는다 */
export function WatchSection({
  data,
  heading = "h1",
  preview = false,
  initialError,
  unread,
}: {
  data: WatchPageData;
  heading?: "h1" | "h2";
  /** 안 읽은 알림 전체 개수(탭 숫자와 같은 값). 0보다 크면 열 때 읽음 처리를 보낸다 */
  unread?: number;
  /** 로컬 미리보기: 등록·삭제·읽음 처리 요청을 보내지 않는다 */
  preview?: boolean;
  /** 미리보기에서 처음부터 보일 관리 칸 오류 */
  initialError?: "limit";
}) {
  const H = heading;
  const col = heading === "h1" ? "h2" : "h3";
  const hasUnread = (unread ?? 0) > 0 || (data.state === "ok" && data.notifications.some((n) => !n.read));
  /** 걸린 영상이 없으면 1024 미만에서도 관리 칸을 위에(DOM 순서도 같이) */
  const managerFirst = data.state === "ok" && data.notifications.length === 0;
  return (
    <section aria-labelledby="watch-title">
      <div className="max-w-3xl">
        <H id="watch-title" className="text-h3 md:text-h2">관심 목록</H>
        <p className="mt-2 text-ui text-fg-2 md:text-body">{WATCH_DESC}</p>
      </div>

      {data.state === "error" ? (
        <ErrorBox className="mt-8" />
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-8">
          {managerFirst ? null : (
            <div className="min-w-0 lg:order-2 lg:col-span-8">
              <NewVideos items={data.notifications} heading={col} />
            </div>
          )}
          <div className="min-w-0 lg:order-1 lg:col-span-4">
            <WatchManager initial={data.watch} preview={preview} initialError={initialError} heading={col} />
          </div>
          {managerFirst ? (
            <div className="min-w-0 lg:order-2 lg:col-span-8">
              <NewVideos items={data.notifications} heading={col} />
            </div>
          ) : null}
        </div>
      )}
      {hasUnread && !preview ? <MarkNotificationsRead /> : null}
    </section>
  );
}

/** 탭 페이지 전체(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다 */
export function WatchView({
  data,
  badge,
  preview,
  initialError,
}: {
  data: WatchPageData;
  badge?: number;
  preview?: boolean;
  initialError?: "limit";
}) {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="WATCH" />
        <BreakoutTabs current="watch" badge={badge} />
        <WatchSection data={data} preview={preview} initialError={initialError} unread={badge} />
      </div>
    </main>
  );
}
