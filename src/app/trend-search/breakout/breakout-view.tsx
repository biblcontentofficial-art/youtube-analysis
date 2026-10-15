import Link from "next/link";
import { getBreakout, getBreakoutDates, kstToday, SHORTS_MAX_SEC, type BreakoutSort, type BreakoutType, type BreakoutVideo } from "@/lib/breakout";
import { SectionHeader } from "@/components/ui/section-header";
import { CHIP } from "@/components/ui/chip";
import { cx } from "@/components/ui/button";
import { outlierLabel } from "@/lib/format";
import { NUM, ROW, TABLE, TD, TH, TH_SORT, TH_SORT_ACTIVE } from "@/components/ui/table";
import { BreakoutTabs } from "./_components/BreakoutTabs";
import { RemixProvider } from "@/app/_components/remix/RemixProvider";
import { RemixButton } from "@/app/_components/remix/RemixButton";
import type { RemixVideo } from "@/lib/trend/remix-schema";

type SP = { date?: string; sort?: string; type?: string; min?: string; ex?: string };

const SORTS: { key: BreakoutSort; label: string }[] = [
  { key: "ratio", label: "구독자 대비 조회수" },
  { key: "outlier", label: "채널 평균 대비" },
  { key: "views", label: "조회수" },
  { key: "subs", label: "구독자" },
  { key: "recent", label: "게시일" },
];
const TYPES: { key: BreakoutType; label: string }[] = [
  { key: "long", label: "롱폼" },
  { key: "shorts", label: "쇼츠" },
];
const MINS: { key: string; value: number; label: string }[] = [
  { key: "1", value: 1, label: "조회수 ≥ 구독자" },
  { key: "3", value: 3, label: "구독자의 3배 이상" },
  { key: "10", value: 10, label: "구독자의 10배 이상" },
  { key: "0", value: 0, label: "모두 보기" },
];

function num(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(n >= 1_000_000_000 ? 0 : 1).replace(/\.0$/, "")}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}
function dur(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x: number) => String(x).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
function kstTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
function dateLabel(d: string): string {
  const [, m, day] = d.split("-");
  const w = "일월화수목금토"[new Date(`${d}T12:00:00+09:00`).getUTCDay()];
  return `${Number(m)}월 ${Number(day)}일 (${w})`;
}

/** 유튜브로 나가는 ↗ 표시(DESIGN 6.15 .ext: 평소 무채색, 링크 hover·포커스 때만 유튜브 빨강) */
function ExtIcon() {
  return (
    <svg className="ext ml-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** 표 행 → 기획 초안(B5) 입력. 대화상자는 페이지에 하나(RemixProvider), 행 버튼은 video 만 넘긴다 */
function remixVideo(v: BreakoutVideo): RemixVideo {
  return {
    videoId: v.video_id,
    title: v.title,
    channelTitle: v.channel_title,
    viewCount: v.view_count,
    subscriberCount: v.subscriber_count,
    durationSec: v.duration_sec,
    publishedAt: v.published_at,
    thumbnail: v.thumbnail ?? `https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`,
  };
}
/** 행 끝 '기획 초안' 고스트 버튼(36px, 터치 기기 44px) */
const REMIX_ROW_BTN = "h-9 px-3 text-body-sm pointer-coarse:h-11";

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;

/** 표 머리에서 정렬을 바꿀 수 있는 열(구독자 대비 조회수 정렬은 위 정렬 칩에만 있다) */
const SORT_COLS: { key: BreakoutSort; label: string; className: string }[] = [
  { key: "views", label: "조회수", className: "w-[120px] pr-6" },
  { key: "outlier", label: "평균 대비", className: "w-[104px] pr-6" },
  { key: "subs", label: "구독자", className: "w-[104px] pr-6" },
  { key: "recent", label: "게시일", className: "w-[112px] pr-2" },
];

/** 정렬 기준 숫자(DESIGN 6.10): 지금 정렬 중인 조회수·평균 대비·구독자 열에만 */
const SORT_NUM = "text-[18px] font-extrabold tracking-[-0.02em] text-fg";

/** 목록 화면(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다. */
export async function BreakoutView({ sp }: { sp: SP }) {
  const dates = await getBreakoutDates(30);
  const date = sp.date && dates.includes(sp.date) ? sp.date : dates[0] ?? kstToday(-1);
  const sort = (SORTS.find((s) => s.key === sp.sort)?.key ?? "ratio") as BreakoutSort;
  const type = (TYPES.find((t) => t.key === sp.type)?.key ?? "long") as BreakoutType; // 기본은 롱폼, 쇼츠는 따로
  const min = MINS.find((m) => m.key === sp.min) ?? MINS[0];
  const ex = sp.ex === "0" ? "0" : "1"; // 뉴스·홈쇼핑·정치·이슈 제외(기본 켜짐)
  const videos = dates.length ? await getBreakout({ date, sort, type, minRatio: min.value, excludeKinds: ex === "1" }) : [];

  const href = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ date, sort, type, min: min.key, ex, ...patch });
    return `/trend-search/breakout?${q.toString()}`;
  };

  return (
    <main className="min-h-screen bg-canvas text-fg">
      <RemixProvider>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="BREAKOUT" />
        <BreakoutTabs current="videos" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-h3 md:text-h2">브레이크아웃</h1>
            <p className="mt-2 text-ui text-fg-2 md:text-body">주제와 상관없이, 구독자 수에 비해 조회수가 잘 나온 영상입니다. 매일 아침 전날 올라온 영상을 모읍니다.</p>
          </div>
          <p className="text-body-sm text-fg-3">
            {dates.length ? <>{dateLabel(date)} 게시 · <span className="tnum font-semibold text-fg">{videos.length.toLocaleString()}</span>개</> : "아직 수집된 날짜가 없습니다"}
          </p>
        </div>

        {/* 날짜 */}
        {dates.length > 0 && (
          <nav aria-label="날짜" className="scrollbar-hide -mx-6 mt-8 flex gap-1.5 overflow-x-auto px-6 pb-1 lg:mx-0 lg:px-0">
            {dates.map((d) => (
              <Link key={d} href={href({ date: d })} aria-current={d === date ? "page" : undefined} className={CHIP}>{dateLabel(d)}</Link>
            ))}
          </nav>
        )}

        {/* 정렬·길이·기준 */}
        <div className="mt-4 flex flex-col gap-3 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between lg:border-b-0 lg:pb-0">
          <div className="flex flex-wrap gap-1.5" aria-label="정렬">
            {SORTS.map((s) => <Link key={s.key} href={href({ sort: s.key })} aria-current={s.key === sort ? "page" : undefined} className={CHIP}>{s.label}순</Link>)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => <Link key={t.key} href={href({ type: t.key })} aria-current={t.key === type ? "page" : undefined} className={CHIP}>{t.label}</Link>)}
            <span aria-hidden="true" className="mx-1 hidden w-px self-stretch bg-line sm:block" />
            {MINS.map((m) => <Link key={m.key} href={href({ min: m.key })} aria-current={m.key === min.key ? "page" : undefined} className={CHIP}>{m.label}</Link>)}
            <span aria-hidden="true" className="mx-1 hidden w-px self-stretch bg-line sm:block" />
            <Link href={href({ ex: ex === "1" ? "0" : "1" })} aria-pressed={ex === "1"} aria-current={ex === "1" ? "true" : undefined} className={CHIP}>
              뉴스·홈쇼핑·정치·이슈 제외
            </Link>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
            <p className="text-ui font-semibold text-fg">
              {dates.length ? "이 조건에 맞는 영상이 없습니다. 기준을 낮춰 보세요." : "첫 수집이 끝나면 여기에 영상이 나옵니다."}
            </p>
          </div>
        ) : (
          <>
            {/* 1024 이상 표(DESIGN 6.10 앱 표 값, 체크 열 없음): 영상 · 조회수 · 평균 대비 · 구독자 · 게시일 · 기획(1280 이상).
                1024~1279 는 제목 칸이 좁아지지 않게 '기획 초안' 버튼을 제목 아래 채널 줄 끝에 둔다 */}
            <table className={cx(TABLE, "mt-6 hidden lg:table")}>
              <thead>
                <tr>
                  <th scope="col" className={TH}>영상</th>
                  {SORT_COLS.map((c) => {
                    const active = c.key === sort;
                    return (
                      <th key={c.key} scope="col" aria-sort={active ? "descending" : undefined} className={cx(TH, "text-right", c.className)}>
                        <Link href={href({ sort: c.key })} className={cx(TH_SORT, active && TH_SORT_ACTIVE)}>
                          {c.label}{active ? <span aria-hidden="true"> ↓</span> : null}
                        </Link>
                      </th>
                    );
                  })}
                  <th scope="col" className={cx(TH, "hidden w-[88px] pl-2 text-right xl:table-cell")}>기획</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.video_id} className={ROW}>
                    <td className={cx(TD, "pr-6")}>
                      <div className="flex items-center gap-4">
                        <a href={watchUrl(v.video_id)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="relative w-32 shrink-0 overflow-hidden rounded-control bg-surface-2 xl:w-36">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.thumbnail ?? `https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                          <span className="tnum absolute bottom-1.5 right-1.5 rounded bg-canvas/80 px-1.5 py-0.5 text-micro font-semibold">
                            {v.duration_sec <= SHORTS_MAX_SEC ? "쇼츠" : dur(v.duration_sec)}
                          </span>
                        </a>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-ui font-medium leading-[1.5] text-fg-1">
                            <a href={watchUrl(v.video_id)} target="_blank" rel="noopener noreferrer" className="line-clamp-2 transition-colors duration-150 hover:text-fg">
                              {v.title}<ExtIcon /><span className="sr-only"> (새 창)</span>
                            </a>
                          </h2>
                          <div className="mt-1 flex min-w-0 items-center gap-2">
                            {v.channel_thumb && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.channel_thumb} alt="" width={20} height={20} loading="lazy" className="size-5 shrink-0 rounded-full bg-surface-2" />
                            )}
                            <a href={channelUrl(v.channel_id)} target="_blank" rel="noopener noreferrer" className="truncate text-caption text-fg-3 transition-colors duration-150 hover:text-fg">{v.channel_title}</a>
                            <RemixButton video={remixVideo(v)} variant="ghost" label="기획 초안" ariaLabel={`기획 초안, ${v.title}`} className={cx(REMIX_ROW_BTN, "-my-1 ml-auto xl:hidden")} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={cx(TD, NUM, "pr-6", sort === "views" ? SORT_NUM : "text-body-sm text-fg")}>{num(v.view_count)}</td>
                    <td className={cx(TD, NUM, "pr-6", sort === "outlier" ? SORT_NUM : (v.outlier ?? 0) >= 2 ? "text-body-sm font-bold text-fg" : "text-body-sm text-fg-3")} title="채널 평균 조회수 대비">{outlierLabel(v.outlier)}</td>
                    <td className={cx(TD, NUM, "pr-6", sort === "subs" ? SORT_NUM : "text-body-sm text-fg-2")}>{num(v.subscriber_count)}</td>
                    <td className={cx(TD, NUM, "pr-2 text-body-sm text-fg-3")}>{kstTime(v.published_at)}</td>
                    <td className={cx(TD, "hidden pl-2 text-right xl:table-cell")}>
                      <RemixButton video={remixVideo(v)} variant="ghost" label="기획 초안" ariaLabel={`기획 초안, ${v.title}`} className={cx(REMIX_ROW_BTN, "-mr-3")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 1024 미만 목록: 채널 한 줄 / 조회수 · 구독자 · 게시일 */}
            <ul className="-mx-6 mt-2 divide-y divide-line-soft lg:hidden">
              {videos.map((v) => (
                <li key={v.video_id} className="flex gap-3 px-6 py-4">
                  <a href={watchUrl(v.video_id)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="relative w-28 shrink-0 self-start overflow-hidden rounded-control bg-surface-2 md:w-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail ?? `https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                    <span className="tnum absolute bottom-1 right-1 rounded bg-canvas/80 px-1 py-0.5 text-micro font-semibold">
                      {v.duration_sec <= SHORTS_MAX_SEC ? "쇼츠" : dur(v.duration_sec)}
                    </span>
                  </a>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-ui font-medium leading-[1.5] text-fg-1 md:text-body">
                      <a href={watchUrl(v.video_id)} target="_blank" rel="noopener noreferrer" className="line-clamp-2">
                        {v.title}<ExtIcon /><span className="sr-only"> (새 창)</span>
                      </a>
                    </h2>
                    <a href={channelUrl(v.channel_id)} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-micro text-fg-3">{v.channel_title}</a>
                    <p className="tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 text-micro text-fg-3">
                      <span className="text-body-sm font-extrabold tracking-[-0.02em] text-fg">{num(v.view_count)}회</span>
                      <span>· 평균의 <span className={(v.outlier ?? 0) >= 2 ? "font-bold text-fg" : undefined}>{outlierLabel(v.outlier)}</span></span>
                      <span>· 구독자 {num(v.subscriber_count)}</span>
                      <span>· {kstTime(v.published_at)}</span>
                    </p>
                    <RemixButton video={remixVideo(v)} variant="ghost" label="기획 초안" ariaLabel={`기획 초안, ${v.title}`} className="-mb-2 -ml-2 mt-0.5 h-11 px-2 text-caption" />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-12 text-micro text-fg-3">조회수·구독자·게시일은 YouTube API Services 로 받은 공개 값이며, 수집 시점 기준입니다. 평균 대비(조회수 ÷ 채널 평균 조회수)와 구독자 대비 정렬은 이 공개 값을 단순 계산한 참고값으로, YouTube 공식 지표나 bibl lab 의 평가가 아닙니다.</p>
      </div>
      </RemixProvider>
    </main>
  );
}
