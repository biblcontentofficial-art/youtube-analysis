/* eslint-disable @next/next/no-img-element -- YouTube 썸네일·채널 아이콘은 원본 URL 그대로(시안과 같은 크기, 최적화 서버를 거치지 않는다) */
/**
 * 검색 결과 미리보기(R23 흡수, 2026-10-16 홈에서 /trend-search 허브로 옮김): 캡처 이미지가 아니라 HTML 표. DESIGN 6.10 홈 미리보기 값 · 6.7 미리보기 패널 · 7.1 3행.
 * - 데이터는 home-preview.json 정적 스냅숏(날짜 포함). YouTube 데이터 보관 규정에 따라 날짜와 함께 주기적으로 교체한다.
 * - 표 안은 장식(aria-hidden, 누를 수 없음). 체크 열·알고리즘 확률 열 없음. 1440 5행 · 1024 미만 목록 3행.
 * - 아래 링크는 /search?q=… 로 바로 보내지 않는다(HomePreviewLink: 로그인 또는 검색 화면).
 * - 도구 탭은 앱과 같은 3개(결정 18 기본 B: '채널 분석' 탭 없음).
 */
import { cx } from "@/components/ui/button";
import { TABLE, TD_PREVIEW, TH_PREVIEW, TH_SORT_ACTIVE } from "@/components/ui/table";
import { badgeClass } from "@/components/ui/badge";
import Link from "next/link";
import { HomePreviewLink } from "@/app/_components/HomeSearch";
import preview from "./home-preview.json";

const PREVIEW_LINK =
  "inline-flex h-11 items-center gap-1.5 self-start font-semibold text-fg transition-colors duration-150 hover:text-fg-2 sm:-my-2 sm:self-auto";

type PreviewRow = (typeof preview.rows)[number];

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const TOOL_TABS = ["영상 찾기", "채널 찾기", "수집한 영상"];

function Thumb({ row, className }: { row: PreviewRow; className: string }) {
  return (
    <span className={cx("relative block shrink-0 overflow-hidden rounded-md bg-surface-2", className)}>
      <img src={thumb(row.videoId)} alt="" width={320} height={180} className="aspect-video w-full object-cover" loading="lazy" decoding="async" />
      <span className="tnum absolute bottom-1 right-1 rounded bg-canvas/80 px-1 py-0.5 text-micro font-semibold leading-none">{row.duration}</span>
    </span>
  );
}

/**
 * className: 바깥 여백을 바꿀 때(기본 mt-7·sm:mt-8·lg:mt-10).
 * linkHref: 검색 기능(HomeSearchProvider) 밖에서 쓸 때 아래 링크를 이 주소로 가는 일반 링크로 바꾼다(홈 서비스의 트렌드 서치 카드).
 */
export default function HomeResultPreview({ className = "mt-7 sm:mt-8 lg:mt-10", linkHref }: { className?: string; linkHref?: string } = {}) {
  const rows = preview.rows.slice(0, 5);
  const mobileRows = preview.rows.slice(0, 3);

  return (
    <figure className={cx("overflow-hidden rounded-panel border border-line bg-surface", className)}>
      <div aria-hidden="true" className="pointer-events-none select-none">
        <div className="hidden items-center justify-between gap-4 border-b border-line px-5 sm:flex">
          <div className="-mb-px flex gap-5 text-caption">
            {TOOL_TABS.map((tab, i) => (
              <span
                key={tab}
                className={
                  i === 0
                    ? "inline-flex h-11 items-center border-b-2 border-accent font-semibold text-accent"
                    : "inline-flex h-11 items-center border-b-2 border-transparent text-fg-3"
                }
              >
                {tab}
              </span>
            ))}
          </div>
          <span className={badgeClass()}>예시 화면</span>
        </div>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:justify-between sm:gap-3 sm:px-5 lg:border-b-0">
          <p className="text-body-sm font-extrabold">
            {`‘${preview.keyword}’ 결과 ${preview.resultCount}개`}
          </p>
          <div className="hidden rounded-control border border-line p-1 text-micro sm:inline-flex">
            <span className="rounded-md px-2.5 py-1 text-fg-3">전체</span>
            <span className="rounded-md bg-surface-3 px-2.5 py-1 font-semibold text-fg">쇼츠 제외</span>
            <span className="rounded-md px-2.5 py-1 text-fg-3">쇼츠만</span>
          </div>
          <span className={cx(badgeClass(), "sm:hidden")}>예시 화면</span>
        </div>

        {/* 1024 이상 표: 영상 · 채널(1280 이상) · 조회수 · 구독자 · 게시일 */}
        <table className={cx(TABLE, "hidden lg:table")}>
          <thead>
            <tr>
              <th scope="col" className={cx(TH_PREVIEW, "pl-5")}>영상</th>
              <th scope="col" className={cx(TH_PREVIEW, "hidden w-[208px] xl:table-cell")}>채널</th>
              <th scope="col" className={cx(TH_PREVIEW, TH_SORT_ACTIVE, "w-[104px] pr-5 text-right")}>조회수 ↓</th>
              <th scope="col" className={cx(TH_PREVIEW, "w-24 pr-5 text-right")}>구독자</th>
              <th scope="col" className={cx(TH_PREVIEW, "w-[136px] pr-16 text-right min-[1376px]:w-24 min-[1376px]:pr-5")}>게시일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.videoId}>
                <td className={cx(TD_PREVIEW, "pl-5 pr-6")}>
                  <span className="flex items-center gap-4">
                    <Thumb row={row} className="w-32" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-ui leading-[1.5] text-fg-1">{row.title}</span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 text-caption text-fg-3 xl:hidden">
                        <img src={row.channelIcon} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full bg-surface-2" loading="lazy" decoding="async" />
                        <span className="truncate">{row.channel}</span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className={cx(TD_PREVIEW, "hidden pr-4 xl:table-cell")}>
                  <span className="flex min-w-0 items-center gap-2">
                    <img src={row.channelIcon} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full bg-surface-2" loading="lazy" decoding="async" />
                    <span className="truncate text-body-sm text-fg-2">{row.channel}</span>
                  </span>
                </td>
                <td className={cx(TD_PREVIEW, "tnum pr-5 text-right text-base font-extrabold tracking-[-0.01em]")}>{row.views}</td>
                <td className={cx(TD_PREVIEW, "tnum pr-5 text-right text-body-sm text-fg-2")}>{row.subscribers}</td>
                <td className={cx(TD_PREVIEW, "pr-16 text-right text-body-sm text-fg-3 min-[1376px]:pr-5")}>{row.published}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 1024 미만 목록 3행: 채널 한 줄 / 조회수 · 게시일 */}
        <ul className="divide-y divide-line-soft lg:hidden">
          {mobileRows.map((row) => (
            <li key={row.videoId} className="flex gap-3 px-4 py-3.5 sm:px-5">
              <Thumb row={row} className="w-28 self-start sm:w-36" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-body-sm leading-[1.5] text-fg-1">{row.title}</span>
                <span className="mt-1 block truncate text-micro text-fg-3">{row.channel}</span>
                <span className="tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 text-micro text-fg-3">
                  <span className="text-body-sm font-extrabold leading-[1.4] tracking-[-0.02em] text-fg">{`${row.views}회`}</span>
                  <span>{`· ${row.published}`}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="flex flex-col gap-1 border-t border-line px-4 py-3 text-caption sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <span className="text-fg-3">
          <time dateTime={preview.capturedAt}>{preview.capturedLabel}</time>
          {` YouTube 공개 검색 결과 · ${preview.sortLabel}`}
        </span>
        {linkHref ? (
          <Link href={linkHref} className={PREVIEW_LINK}>
            트렌드 서치에서 직접 검색하기 <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <HomePreviewLink className={PREVIEW_LINK} />
        )}
      </figcaption>
    </figure>
  );
}
