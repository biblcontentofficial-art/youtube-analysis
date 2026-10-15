/**
 * A2 지금 크는 채널 화면(props 만 받음, 데이터·인증 호출 없음). 데이터는 src/lib/trend/channels.ts 의 getRecurringChannels.
 * 근거: docs/trend-dev/spec.md 3.2 · 1.3 · DESIGN.md 6.6 칩 · 6.10 표/목록 · 6.13 상태 상자 · 6.15 .ext · 6.20 빈 상태 · 6.30 아바타
 *
 *   <ChannelsView data={result} />                          탭 페이지(섹션 머리 + 탭 줄 + 본문)
 *   <ChannelsSection data={result} heading="h2" />          본문만(정보 구조를 안 B·C 로 바꿀 때 다른 페이지에 넣는다)
 *   <ChannelsView data={result} actionSlot={(c) => <WatchButton channel={c} />} />   C7 이 동작 자리를 채운다
 *
 * - 1024 이상 표(채널 · 등장 일수 · 영상 수 · 구독자 · 최근 등장 · 동작), 미만 목록('3일 · 5편 · 구독자 6.2만 · 최근 10/14').
 * - 동작 자리(actionSlot)는 표의 마지막 열과 목록 메타 줄 아래 왼쪽 두 곳에 그린다(모바일에서도 관심 등록). 없으면 열·줄을 그리지 않는다.
 *   모바일은 카카오 플로팅 버튼 자리(오른쪽 76px, DESIGN 6.17)를 피해 왼쪽 정렬한다.
 * - 모바일 목록의 채널명·최근 영상 링크는 각각 높이 24px 이상(DESIGN 8 터치 최소)이다.
 * - 흰색은 정렬 기준 열(등장 일수)에만. 채널명·최근 영상은 유튜브로 나가는 링크(.ext, 새 창).
 * - 빈 상태(empty)는 6.20 상자, 불러오기 실패(error)는 6.13 오류 상자(빈 상태 문구로 떨어지지 않음).
 * - 칩 주소는 기본값을 빼고 만든다(14일 · 전체 · 10만 미만이면 쿼리 없음). 미리보기는 basePath 에 자기 주소를 넘긴다.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { CHIP } from "@/components/ui/chip";
import { cx } from "@/components/ui/button";
import { WarningIcon } from "@/components/ui/icons";
import { DerivedNotice } from "@/components/ui/notice";
import { NUM, ROW, TABLE, TD, TH, TH_SORT_ACTIVE } from "@/components/ui/table";
import {
  CHANNEL_DAYS,
  CHANNEL_FORMATS,
  CHANNEL_LIMIT,
  CHANNEL_MAX_SUBS,
  type ChannelDays,
  type ChannelFormat,
  type ChannelMaxSubs,
  type ChannelQuery,
  type RecurringChannel,
  type RecurringResult,
} from "@/lib/trend/channels";
import { BreakoutTabs } from "../_components/BreakoutTabs";

const PAGE_PATH = "/trend-search/breakout/channels";

/** 섹션 설명(spec 3.2). 스켈레톤(loading.tsx)도 같은 글자를 그려 줄바꿈·높이를 실제와 맞춘다 */
export const CHANNELS_DESC = "최근 브레이크아웃에 여러 번 오른 구독자 10만 미만 채널입니다. 벤치마킹 후보로 보세요.";

const DAYS_LABEL: Record<ChannelDays, string> = { 14: "최근 14일", 30: "최근 30일" };
const FORMAT_LABEL: Record<ChannelFormat, string> = { all: "전체", long: "롱폼", shorts: "쇼츠" };
const SUBS_LABEL: Record<ChannelMaxSubs, string> = { 100_000: "10만 미만", 10_000: "1만 미만" };

/** 정렬 기준 숫자(DESIGN 6.10 앱 표, 브레이크아웃 영상 탭과 같은 값) */
const SORT_NUM = "text-[18px] font-extrabold tracking-[-0.02em] text-fg";

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;

/** 화면 숫자 표기(브레이크아웃 영상 탭 num() 과 같은 규칙: 6.2만 · 8,200) */
function num(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(n >= 1_000_000_000 ? 0 : 1).replace(/\.0$/, "")}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}

/** 'YYYY-MM-DD' → 'M/D' */
function md(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 칩 주소. 기본값(첫 값)은 쿼리에서 뺀다. basePath 에 이미 쿼리가 있으면 이어 붙인다 */
function chipHref(basePath: string, q: ChannelQuery, patch: Partial<ChannelQuery>): string {
  const next = { ...q, ...patch };
  const params = new URLSearchParams();
  if (next.days !== CHANNEL_DAYS[0]) params.set("days", String(next.days));
  if (next.format !== CHANNEL_FORMATS[0]) params.set("format", next.format);
  if (next.maxSubs !== CHANNEL_MAX_SUBS[0]) params.set("subs", String(next.maxSubs));
  const qs = params.toString();
  if (!qs) return basePath;
  return `${basePath}${basePath.includes("?") ? "&" : "?"}${qs}`;
}

/** 유튜브로 나가는 ↗(DESIGN 6.15 .ext: 평소 무채색, 링크 hover·포커스 때만 유튜브 빨강) */
function ExtIcon() {
  return (
    <svg className="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/**
 * 채널 아바타 32px(DESIGN 6.30). 빈 자리는 surface-3 + 첫 글자.
 * 그림은 첫 글자 위에 겹쳐 둔다. 그림 주소가 깨져도(유튜브 썸네일 만료 등) 첫 글자가 보인다(서버 컴포넌트라 onError 없이).
 */
function Avatar({ c }: { c: RecurringChannel }) {
  return (
    <span aria-hidden="true" className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-caption font-semibold text-fg-2">
      {Array.from(c.channelTitle.trim())[0] ?? ""}
      {c.channelThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.channelThumb} alt="" width={32} height={32} loading="lazy" decoding="async" className="absolute inset-0 size-full rounded-full object-cover" />
      ) : null}
    </span>
  );
}

/** 채널명(유튜브 채널, 새 창) + 아래 최근 영상 제목 한 줄(유튜브 영상, 새 창). 1024 미만은 두 링크 모두 min-h-6(누름 영역 24px) */
function ChannelText({ c }: { c: RecurringChannel }) {
  return (
    <div className="min-w-0 flex-1">
      <a
        href={channelUrl(c.channelId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-6 min-w-0 items-center gap-1 text-ui font-medium leading-[1.5] text-fg-1 transition-colors duration-150 hover:text-fg lg:min-h-0"
      >
        <span className="truncate">{c.channelTitle}</span>
        <ExtIcon />
        <span className="sr-only"> (새 창)</span>
      </a>
      {c.latestVideoId && c.latestTitle ? (
        <a
          href={watchUrl(c.latestVideoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-6 min-w-0 items-center gap-1 text-caption text-fg-3 transition-colors duration-150 hover:text-fg lg:min-h-0"
        >
          <span className="sr-only">최근 영상: </span>
          <span className="truncate">{c.latestTitle}</span>
          <ExtIcon />
          <span className="sr-only"> (새 창)</span>
        </a>
      ) : null}
    </div>
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

/**
 * 오른쪽 기준 줄: 기간(기준 날짜까지) · 채널 수(상한 CHANNEL_LIMIT 에 닿으면 '상위 50곳').
 * 오류면 그리지 않고, 빈 상태면 기간만 보인다(아래 빈 상태 상자와 같은 말을 되풀이하지 않게).
 */
function RangeLine({ data }: { data: RecurringResult }) {
  if (data.state === "error" || !data.start || !data.end) return null;
  const n = data.rows.length;
  return (
    <p className="text-body-sm text-fg-3">
      {DAYS_LABEL[data.days]}(<span className="tnum">{md(data.start)}~{md(data.end)}</span>)
      {n > 0 ? (
        <>
          {" · "}{n >= CHANNEL_LIMIT ? "상위 " : null}<span className="tnum font-semibold text-fg">{n}</span>곳
        </>
      ) : null}
    </p>
  );
}

type ActionSlot = (c: RecurringChannel) => ReactNode;

/**
 * 표(1024 이상) + 목록(1024 미만) + 캡션·파생값 안내.
 * 마지막 열 오른쪽 pr-14: 카카오 플로팅 버튼(right-6 size-14)이 1024~1375 폭에서 마지막 열 글자를 가리지 않게 비워 둔다(급상승 키워드 표와 같은 값).
 */
function ChannelList({ data, actionSlot }: { data: RecurringResult; actionSlot?: ActionSlot }) {
  const hasAction = Boolean(actionSlot);
  return (
    <div>
      <table className={cx(TABLE, "hidden lg:table")}>
        <thead>
          <tr>
            <th scope="col" className={TH}>채널</th>
            <th scope="col" aria-sort="descending" className={cx(TH, "w-[112px] text-right")}>
              <span className={cx("inline-flex h-10 items-center", TH_SORT_ACTIVE)}>등장 일수<span aria-hidden="true" className="ml-1">↓</span></span>
            </th>
            <th scope="col" className={cx(TH, "w-[96px] text-right")}>영상 수</th>
            <th scope="col" className={cx(TH, "w-[104px] text-right")}>구독자</th>
            <th scope="col" className={cx(TH, "text-right", hasAction ? "w-[112px]" : "w-[168px] pr-14")}>최근 등장</th>
            {hasAction ? <th scope="col" className={cx(TH, "w-[176px] pl-6 pr-14 text-right")}><span className="sr-only">동작</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((c) => (
            <tr key={c.channelId} className={ROW}>
              <td className={cx(TD, "pr-6")}>
                <div className="flex items-center gap-3">
                  <Avatar c={c} />
                  <ChannelText c={c} />
                </div>
              </td>
              <td className={cx(TD, NUM, SORT_NUM)}>{c.days}일</td>
              <td className={cx(TD, NUM, "text-body-sm text-fg-2")}>{c.videos}편</td>
              <td className={cx(TD, NUM, "text-body-sm text-fg-2")}>{num(c.subscriberCount)}</td>
              <td className={cx(TD, NUM, "text-body-sm text-fg-3", !hasAction && "pr-14")}>{md(c.lastDate)}</td>
              {hasAction ? <td className={cx(TD, "pl-6 pr-14 text-right")}>{actionSlot!(c)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="-mx-6 divide-y divide-line-soft border-y border-line lg:hidden">
        {data.rows.map((c) => (
          <li key={c.channelId} className="flex gap-3 px-6 py-4">
            <Avatar c={c} />
            <div className="min-w-0 flex-1">
              <ChannelText c={c} />
              <p className="tnum mt-0.5 text-micro text-fg-3">
                <span className="whitespace-nowrap"><span className="text-body-sm font-extrabold tracking-[-0.02em] text-fg">{c.days}일</span> ·</span>{" "}
                <span className="whitespace-nowrap">{c.videos}편 ·</span>{" "}
                <span className="whitespace-nowrap">구독자 {num(c.subscriberCount)} ·</span>{" "}
                <span className="whitespace-nowrap">최근 {md(c.lastDate)}</span>
              </p>
              {/* 동작은 메타 아래 왼쪽(오른쪽 76px 는 카카오 버튼 자리, DESIGN 6.17) */}
              {hasAction ? <div className="mt-1 flex">{actionSlot!(c)}</div> : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-3">구독자 수는 가장 최근 수집일 값입니다.</p>
      <DerivedNotice what="등장 일수와 영상 수는" />
    </div>
  );
}

/** 상태에 맞는 본문(칩 줄 아래) */
function Body({ data, actionSlot }: { data: RecurringResult; actionSlot?: ActionSlot }) {
  switch (data.state) {
    case "error":
      return <ErrorBox className="mt-6" />;
    case "empty":
      return (
        <EmptyBox
          className="mt-6"
          title="조건에 맞는 채널이 아직 없습니다."
          body={data.days === 14 ? "수집 날짜가 쌓이면 늘어납니다. 기간을 30일로 넓혀 보세요." : "수집 날짜가 쌓이면 늘어납니다."}
        />
      );
    case "ok":
      return <div className="mt-6"><ChannelList data={data} actionSlot={actionSlot} /></div>;
  }
}

/** 칩 묶음 사이 세로 선(640 이상) */
function Divider() {
  return <span aria-hidden="true" className="hidden h-5 w-px bg-line sm:block" />;
}

/** 본문(제목·설명·기준 줄·칩·표나 상태 상자). 섹션 머리·탭 줄은 그리지 않는다 */
export function ChannelsSection({
  data,
  basePath = PAGE_PATH,
  heading = "h1",
  actionSlot,
}: {
  data: RecurringResult;
  /** 칩 주소의 앞부분(미리보기는 자기 주소를 넘긴다) */
  basePath?: string;
  heading?: "h1" | "h2";
  /** 행마다 동작(C7 관심 등록). 표 마지막 열과 목록 메타 줄 아래 왼쪽에 그린다 */
  actionSlot?: ActionSlot;
}) {
  const H = heading;
  const q: ChannelQuery = { days: data.days, format: data.format, maxSubs: data.maxSubs };
  return (
    <section aria-labelledby="channels-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <H id="channels-title" className="text-h3 md:text-h2">지금 크는 채널</H>
          <p className="mt-2 text-ui text-fg-2 md:text-body">{CHANNELS_DESC}</p>
        </div>
        <RangeLine data={data} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <nav aria-label="기간" className="flex gap-1.5">
          {CHANNEL_DAYS.map((d) => (
            <Link key={d} href={chipHref(basePath, q, { days: d })} aria-current={d === q.days ? "page" : undefined} className={CHIP}>{DAYS_LABEL[d]}</Link>
          ))}
        </nav>
        <Divider />
        <nav aria-label="영상 길이" className="flex gap-1.5">
          {CHANNEL_FORMATS.map((f) => (
            <Link key={f} href={chipHref(basePath, q, { format: f })} aria-current={f === q.format ? "page" : undefined} className={CHIP}>{FORMAT_LABEL[f]}</Link>
          ))}
        </nav>
        <Divider />
        <nav aria-label="구독자" className="flex gap-1.5">
          {CHANNEL_MAX_SUBS.map((s) => (
            <Link key={s} href={chipHref(basePath, q, { maxSubs: s })} aria-current={s === q.maxSubs ? "page" : undefined} className={CHIP}>{SUBS_LABEL[s]}</Link>
          ))}
        </nav>
        <Divider />
        <p className="text-caption text-fg-3">뉴스·홈쇼핑·정치·이슈 채널은 빼고 셉니다</p>
      </div>

      <Body data={data} actionSlot={actionSlot} />
    </section>
  );
}

/** 탭 페이지 전체(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다 */
export function ChannelsView({
  data,
  basePath,
  badge,
  actionSlot,
}: {
  data: RecurringResult;
  basePath?: string;
  badge?: number;
  actionSlot?: ActionSlot;
}) {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="CHANNELS" />
        <BreakoutTabs current="channels" badge={badge} />
        <ChannelsSection data={data} basePath={basePath} actionSlot={actionSlot} />
      </div>
    </main>
  );
}
