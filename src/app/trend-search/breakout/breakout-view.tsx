import Link from "next/link";
import { getBreakout, getBreakoutDates, kstToday, SHORTS_MAX_SEC, type BreakoutSort, type BreakoutType } from "@/lib/breakout";
import { SectionHeader } from "@/components/ui/section-header";
import { CHIP } from "@/components/ui/chip";

type SP = { date?: string; sort?: string; type?: string; min?: string };

const SORTS: { key: BreakoutSort; label: string }[] = [
  { key: "ratio", label: "구독자 대비 조회수" },
  { key: "views", label: "조회수" },
  { key: "subs", label: "구독자" },
  { key: "recent", label: "게시일" },
];
const TYPES: { key: BreakoutType; label: string }[] = [
  { key: "all", label: "전체" },
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

/** 목록 화면(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다. */
export async function BreakoutView({ sp }: { sp: SP }) {
  const dates = await getBreakoutDates(30);
  const date = sp.date && dates.includes(sp.date) ? sp.date : dates[0] ?? kstToday(-1);
  const sort = (SORTS.find((s) => s.key === sp.sort)?.key ?? "ratio") as BreakoutSort;
  const type = (TYPES.find((t) => t.key === sp.type)?.key ?? "all") as BreakoutType;
  const min = MINS.find((m) => m.key === sp.min) ?? MINS[0];
  const videos = dates.length ? await getBreakout({ date, sort, type, minRatio: min.value }) : [];

  const href = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ date, sort, type, min: min.key, ...patch });
    return `/trend-search/breakout?${q.toString()}`;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-10 md:px-6 md:py-14">
        <SectionHeader caption="유튜브 트렌드 서치" label="BREAKOUT" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">브레이크아웃</h1>
            <p className="mt-2 text-neutral-300">주제와 상관없이, 구독자 수에 비해 조회수가 잘 나온 영상입니다. 매일 아침 전날 올라온 영상을 모읍니다.</p>
          </div>
          <p className="text-sm text-neutral-400">
            {dates.length ? <>{dateLabel(date)} 게시 · <span className="font-semibold text-white">{videos.length.toLocaleString()}</span>개</> : "아직 수집된 날짜가 없습니다"}
          </p>
        </div>

        {/* 날짜 */}
        {dates.length > 0 && (
          <nav aria-label="날짜" className="scrollbar-hide mt-8 flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => (
              <Link key={d} href={href({ date: d })} aria-current={d === date ? "page" : undefined} className={CHIP}>{dateLabel(d)}</Link>
            ))}
          </nav>
        )}

        {/* 정렬·길이·기준 */}
        <div className="mt-4 flex flex-col gap-3 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="정렬">
            {SORTS.map((s) => <Link key={s.key} href={href({ sort: s.key })} aria-current={s.key === sort ? "page" : undefined} className={CHIP}>{s.label}순</Link>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => <Link key={t.key} href={href({ type: t.key })} aria-current={t.key === type ? "page" : undefined} className={CHIP}>{t.label}</Link>)}
            <span aria-hidden="true" className="mx-1 hidden w-px self-stretch bg-neutral-800 sm:block" />
            {MINS.map((m) => <Link key={m.key} href={href({ min: m.key })} aria-current={m.key === min.key ? "page" : undefined} className={CHIP}>{m.label}</Link>)}
          </div>
        </div>

        {videos.length === 0 ? (
          <p className="py-24 text-center text-neutral-400">
            {dates.length ? "이 조건에 맞는 영상이 없습니다. 기준을 낮춰 보세요." : "첫 수집이 끝나면 여기에 영상이 나옵니다."}
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {videos.map((v) => (
              <li key={v.video_id}>
                <a href={`https://www.youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail ?? `https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover transition-opacity duration-150 group-hover:opacity-90" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                      {v.duration_sec <= SHORTS_MAX_SEC ? "쇼츠" : dur(v.duration_sec)}
                    </span>
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-white group-hover:underline group-hover:underline-offset-4">{v.title}</h2>
                </a>
                <div className="mt-2 flex items-center gap-2">
                  {v.channel_thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.channel_thumb} alt="" width={24} height={24} loading="lazy" className="size-6 shrink-0 rounded-full bg-neutral-900" />
                  )}
                  <a href={`https://www.youtube.com/channel/${v.channel_id}`} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-neutral-300 hover:text-white">{v.channel_title}</a>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-sm tabular-nums">
                  <div><dt className="text-xs text-neutral-400">조회수</dt><dd className="font-bold text-white">{num(v.view_count)}</dd></div>
                  <div><dt className="text-xs text-neutral-400">구독자</dt><dd className="text-neutral-200">{num(v.subscriber_count)}</dd></div>
                  <div><dt className="text-xs text-neutral-400">게시일</dt><dd className="text-neutral-200">{kstTime(v.published_at)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-12 text-xs text-neutral-400">조회수·구독자·게시일은 YouTube API Services 로 받은 공개 값이며, 수집 시점 기준입니다.</p>
      </div>
    </main>
  );
}
