/**
 * A1 급상승 키워드 화면(props 만 받음, 데이터·인증 호출 없음). 데이터는 src/lib/trend/rising.ts 의 getRisingTerms.
 * 근거: docs/trend-dev/spec.md 3.1 · DESIGN.md 6.6 칩 · 6.10 표/목록 · 6.12 태그 · 6.13 상태 상자 · 6.20 빈 상태
 *
 *   <KeywordsView data={result} fit={{ kind: "card", registered }} />   탭 페이지(섹션 머리 + 탭 줄 + 본문)
 *   <KeywordsSection data={result} heading="h2" />                      본문만(정보 구조를 안 B·C 로 바꿀 때 다른 페이지에 넣는다)
 *
 * - 1024 이상 표(순위 · 주제어 · 채널 수 · 변화 · 대표 영상), 미만 목록. '변화' 열은 state 'rising' 에서만.
 * - 화면 숫자는 원본 횟수(이전 N곳 → 최근 M곳)가 먼저. 배수(최근 ÷ 이전)는 두 기간 수집 일수가 같고
 *   RISING_SHOW_MULTIPLIER 이상일 때만 '▲ n배' positive 글자. 이전 0곳이면 '새로 등장' 태그.
 * - 흰색은 정렬 기준 열(채널 수)·최근 채널 수·주제어에만. 상승 표시는 positive 글자 + ▲ 만(색 면 없음).
 * - 빈 상태(sparse·empty·none)는 6.20 상자, 불러오기 실패(error)는 6.13 오류 상자(빈 상태 문구로 떨어지지 않음).
 * - 가로 롱폼 전용(소유자 결정 2026-10-16: 쇼츠·세로·라이브 제외). 길이 칩은 없고 캡션 줄(COUNTED_CAPTION)에 기준을 적는다.
 * - C8 '내 채널에 맞는 주제'(roadmap T10): 캡션 줄 아래·표 위. fit 이 없으면 그리지 않는다. 카드 데이터는 같은 급상승 키워드로
 *   고르므로 표가 있는 상태(rising·top)에서만 보인다. Starter 미만은 잠금 줄(6.29: 라벨 fg-3 + Starter 태그, 자물쇠·흐림 없음),
 *   그 밖은 클라이언트 잎 TrendFitCard(이 화면은 Claude 를 부르지 않고 기다리지도 않는다).
 */
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { cx } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { InfoIcon, WarningIcon } from "@/components/ui/icons";
import { DerivedNotice } from "@/components/ui/notice";
import { NUM, ROW, TABLE, TD, TH, TH_SORT_ACTIVE } from "@/components/ui/table";
import { COUNTED_CAPTION, MIN_PRIOR_DAYS, MIN_RECENT_DAYS, RISING_SHOW_MULTIPLIER } from "@/lib/trend/rules";
import type { RisingResult, RisingRow, RisingSample, RisingWindow } from "@/lib/trend/rising";
import { BreakoutTabs } from "../_components/BreakoutTabs";
import { TrendFitCard, type TrendFitPreview } from "./TrendFitCard";

/** C8 카드 자리. locked = Starter 미만 잠금 줄, card = 카드 잎(registered: user_channels 행 유무) */
export type KeywordsFit = { kind: "locked" } | { kind: "card"; registered: boolean; preview?: TrendFitPreview };

/** 잠금 태그(DESIGN 6.12 Pro 모양, 글자만 Starter. 트렌드 서치 허브 PLAN_TAG 와 같은 값) */
const PLAN_TAG = "inline-flex items-center rounded border border-line-strong px-1 text-micro leading-[18px] text-fg-3";

/** 'YYYY-MM-DD' → 'M/D' */
function md(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 표시할 배수('3.2배'). 두 기간 수집 일수가 다르거나 기준 미만이면 null */
function multiplier(row: RisingRow, w: RisingWindow): string | null {
  if (row.priorChannels <= 0 || w.recentDays !== w.priorDays) return null;
  const m = row.recentChannels / row.priorChannels;
  return m >= RISING_SHOW_MULTIPLIER ? `${m.toFixed(1).replace(/\.0$/, "")}배` : null;
}

function termLabel(row: RisingRow): string {
  return row.termType === "tag" ? `#${row.term}` : row.term;
}

/** '변화' 칸 내용(rising 상태에서만 부른다) */
function Change({ row, w }: { row: RisingRow; w: RisingWindow }) {
  if (row.priorChannels === 0) return <span className={badgeClass()}>새로 등장</span>;
  const m = multiplier(row, w);
  return m ? <span className="tnum text-body-sm font-semibold text-positive"><span aria-hidden="true">▲ </span><span className="sr-only">증가 </span>{m}</span> : null;
}

/** 유튜브로 나가는 ↗(DESIGN 6.15 .ext: 평소 무채색, 링크 hover·포커스 때만 유튜브 빨강) */
function ExtIcon({ className }: { className?: string }) {
  return (
    <svg className={cx("ext", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** 대표 영상 썸네일 하나(유튜브 새 창). ↗ 는 길이 표시와 같은 자리(오른쪽 아래 단색 막) */
function Thumb({ s, className }: { s: RisingSample; className: string }) {
  const label = s.title ? `${s.title}${s.channelTitle ? `, ${s.channelTitle}` : ""}` : "대표 영상";
  return (
    <a
      href={`https://www.youtube.com/watch?v=${s.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={s.title ?? undefined}
      aria-label={`${label} (새 창)`}
      className={cx("relative block shrink-0 overflow-hidden rounded-control bg-surface-2", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.thumbnail} alt="" width={320} height={180} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
      <span className="absolute bottom-1 right-1 inline-flex rounded bg-canvas/80 px-1 py-0.5 text-micro leading-none">
        <ExtIcon />
      </span>
    </a>
  );
}

function Thumbs({ samples, className, thumbClass }: { samples: RisingSample[]; className?: string; thumbClass: string }) {
  if (!samples.length) return null;
  return (
    <div className={cx("flex gap-2", className)}>
      {samples.map((s) => <Thumb key={s.videoId} s={s} className={thumbClass} />)}
    </div>
  );
}

/** 6.13 안내 상자(기호 fg-2, 면 칠하지 않음) */
function InfoBox({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div role="status" className={cx("flex gap-3 rounded-card border border-line bg-surface p-4", className)}>
      <InfoIcon className="mt-0.5 shrink-0 text-fg-2" />
      <div className="min-w-0">
        <p className="text-ui font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-body-sm text-fg-3">{body}</p>
      </div>
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

/** 오른쪽 기준 줄. 기간 통계가 없으면(error·empty) 그리지 않는다 */
function WindowLine({ state, w }: { state: RisingResult["state"]; w: RisingWindow | null }) {
  if (!w || state === "error" || state === "empty") return null;
  const range = `최근 7일(${md(w.start)}~${md(w.end)})`;
  if (w.mode === "rising") {
    return (
      <p className="text-body-sm text-fg-3">
        {range}과 그 전 7일 비교 · 수집된 날 <span className="tnum">{w.recentDays}일·{w.priorDays}일</span>
      </p>
    );
  }
  return (
    <p className="text-body-sm text-fg-3">
      {range} · 수집된 날 <span className="tnum">{w.recentDays}일</span>
    </p>
  );
}

/**
 * 표(1024 이상) + 목록(1024 미만) + 파생값 안내.
 * 대표 영상 열 오른쪽 pr-14: 카카오 플로팅 버튼(right-6 size-14)이 1024~1375 폭에서 마지막 썸네일을 가리지 않게 비워 둔다.
 */
function RisingList({ data }: { data: RisingResult }) {
  const w = data.window!;
  const showChange = data.state === "rising";
  return (
    <div>
      <table className={cx(TABLE, "hidden lg:table")}>
        <thead>
          <tr>
            <th scope="col" className={cx(TH, "w-16")}>순위</th>
            <th scope="col" className={TH}>주제어</th>
            <th scope="col" aria-sort="descending" className={cx(TH, "w-[200px] text-right")}>
              <span className={cx("inline-flex h-10 items-center", TH_SORT_ACTIVE)}>채널 수<span aria-hidden="true"> ↓</span></span>
            </th>
            {showChange ? <th scope="col" className={cx(TH, "w-[132px] pl-8")}>변화</th> : null}
            <th scope="col" className={cx(TH, "w-[272px] pl-4 pr-14")}>대표 영상</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={`${r.termType}:${r.term}`} className={ROW}>
              <td className={cx(TD, "tnum text-body-sm text-fg-3")}>{String(i + 1).padStart(2, "0")}</td>
              <td className={cx(TD, "break-keep pr-4 text-ui font-semibold text-fg")}>{termLabel(r)}</td>
              <td className={cx(TD, NUM, "text-body-sm text-fg-3")}>
                이전 {r.priorChannels}곳 → 최근 <span className="font-bold text-fg">{r.recentChannels}곳</span>
              </td>
              {showChange ? <td className={cx(TD, "pl-8")}><Change row={r} w={w} /></td> : null}
              <td className={cx(TD, "pl-4 pr-14")}>
                <Thumbs samples={r.samples} thumbClass="w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ol className="-mx-6 divide-y divide-line-soft border-y border-line lg:hidden">
        {data.rows.map((r, i) => {
          const m = showChange ? multiplier(r, w) : null;
          const fresh = showChange && r.priorChannels === 0;
          return (
            <li key={`${r.termType}:${r.term}`} className="px-6 py-4">
              <p className="flex items-baseline gap-2">
                <span className="tnum text-body-sm text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="break-keep text-ui font-semibold text-fg">{termLabel(r)}</span>
              </p>
              <p className="tnum mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-caption text-fg-3">
                <span>이전 {r.priorChannels}곳 → 최근 <span className="font-bold text-fg">{r.recentChannels}곳</span></span>
                {fresh ? (
                  <span className="inline-flex items-center gap-x-1"><span aria-hidden="true">·</span><span className={badgeClass()}>새로 등장</span></span>
                ) : m ? (
                  <span className="inline-flex items-center gap-x-1"><span aria-hidden="true">·</span><span className="font-semibold text-positive"><span aria-hidden="true">▲ </span><span className="sr-only">증가 </span>{m}</span></span>
                ) : null}
              </p>
              <Thumbs samples={r.samples} className="mt-2.5" thumbClass="w-28" />
            </li>
          );
        })}
      </ol>
      <DerivedNotice what="채널 수 변화와 배수는" className="mt-3" />
    </div>
  );
}

/** C8 잠금 줄(Starter 미만). 누르면 요금제(허브 잠긴 도구와 같은 동작) */
function FitLocked({ className }: { className?: string }) {
  return (
    <Link
      href="/pricing"
      className={cx(
        "group flex min-h-11 items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-3 transition-colors duration-150 hover:border-line-hover",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-body-sm font-semibold text-fg-3">
        내 채널에 맞는 주제
        <span aria-hidden="true" className={PLAN_TAG}>Starter</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-body-sm font-semibold text-fg-2">
        <span className="sr-only">Starter 이상 필요, </span>
        <span className="hidden sm:inline">요금제 보기</span>
        <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}

/** C8 자리(캡션 줄 아래). 표가 있는 상태에서만 */
function FitSlot({ data, fit, heading }: { data: RisingResult; fit?: KeywordsFit; heading: "h2" | "h3" }) {
  if (!fit || (data.state !== "rising" && data.state !== "top")) return null;
  if (fit.kind === "locked") return <FitLocked className="mt-6" />;
  return <TrendFitCard registered={fit.registered} mode={data.window?.mode ?? null} heading={heading} preview={fit.preview} className="mt-6" />;
}

/** 상태에 맞는 본문(캡션 줄 아래) */
function Body({ data }: { data: RisingResult }) {
  const w = data.window;
  switch (data.state) {
    case "error":
      return <ErrorBox className="mt-6" />;
    case "empty":
      return <EmptyBox className="mt-6" title="첫 수집이 끝나면 여기에 주제어가 나옵니다." body="매일 아침 6시에 전날 영상을 모읍니다." />;
    case "sparse":
      return (
        <EmptyBox
          className="mt-6"
          title="아직 주제어를 셀 만큼 데이터가 모이지 않았습니다."
          body={`최근 7일 중 ${w?.recentDays ?? 0}일 수집됨, ${MIN_RECENT_DAYS}일 이상 필요합니다.`}
        />
      );
    case "none":
      return (
        <EmptyBox
          className="mt-6"
          title="기준을 넘는 주제어가 없습니다."
          body="수집 날짜가 쌓이면 늘어납니다. 내일 다시 확인해 주세요."
        />
      );
    case "top":
      return (
        <>
          <InfoBox
            className="mt-6"
            title="비교할 이전 기간 데이터가 아직 부족합니다."
            body={`지금은 최근 7일에 많이 쓰인 주제어를 보여 드립니다. 이전 7일 중 ${w?.priorDays ?? 0}일 수집됨, ${MIN_PRIOR_DAYS}일 이상이면 증가율로 바뀝니다.`}
          />
          <div className="mt-6"><RisingList data={data} /></div>
        </>
      );
    case "rising":
      return <div className="mt-6"><RisingList data={data} /></div>;
  }
}

/** 본문(제목·설명·기준 줄·캡션·표나 상태 상자). 섹션 머리·탭 줄은 그리지 않는다 */
export function KeywordsSection({
  data,
  heading = "h1",
  fit,
}: {
  data: RisingResult;
  heading?: "h1" | "h2";
  /** C8 카드 자리(없으면 그리지 않음) */
  fit?: KeywordsFit;
}) {
  const H = heading;
  return (
    <section aria-labelledby="rising-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <H id="rising-title" className="text-h3 md:text-h2">급상승 키워드</H>
          <p className="mt-2 text-ui text-fg-2 md:text-body">브레이크아웃 영상 제목에서 최근 7일 동안 새로 많이 쓰인 주제어입니다. 서로 다른 채널 수로 셉니다.</p>
        </div>
        <WindowLine state={data.state} w={data.window} />
      </div>

      <p className="mt-6 text-caption text-fg-3">{COUNTED_CAPTION}</p>

      <FitSlot data={data} fit={fit} heading={heading === "h1" ? "h2" : "h3"} />
      <Body data={data} />
    </section>
  );
}

/** 탭 페이지 전체(로그인 확인 뒤). 로컬 미리보기에서도 재사용한다 */
export function KeywordsView({
  data,
  badge,
  fit,
}: {
  data: RisingResult;
  badge?: number;
  fit?: KeywordsFit;
}) {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="RISING" />
        <BreakoutTabs current="keywords" badge={badge} />
        <KeywordsSection data={data} fit={fit} />
      </div>
    </main>
  );
}
