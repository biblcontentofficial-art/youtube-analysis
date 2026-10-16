/**
 * /trend-search/breakout/keywords 스켈레톤(DESIGN 6.19). 서버가 로그인 확인·기간 통계·단어 목록을 읽는 동안
 * 섹션 머리 → 탭 줄 → 제목 → 기준 줄 → 캡션 줄 → 표 행 8줄을 실제와 같은 폭·여백·높이로 그린다. 인증·데이터 호출 없음.
 * - 길이 칩은 없다(가로 롱폼 전용, 2026-10-16). 캡션은 고정 문구라 실제 글자(COUNTED_CAPTION)를 그린다.
 * - 1024 이상: 표 머리 + 행(순위 · 주제어 · 채널 수 · 변화 · 썸네일 w-24 두 장, 오른쪽 pr-14 는 실제 표와 같은 카카오 버튼 여백), 행 높이는 실제 행과 같은 약 75px
 * - 1024 미만: 목록 행(순위·주제어 한 줄 · 채널 수 한 줄 · 썸네일 w-28 두 장)
 */
import { SectionHeader } from "@/components/ui/section-header";
import { COUNTED_CAPTION } from "@/lib/trend/rules";
import { BreakoutTabs } from "../_components/BreakoutTabs";

const BAR = "rounded-control bg-surface-2";
const ROWS = 8;
/** 스켈레톤 깜빡임(6.19, 움직임 줄이기 설정이면 멈춤) */
const PULSE = "animate-pulse motion-reduce:animate-none";

export default function KeywordsLoading() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <div role="status">
        <span className="sr-only">불러오는 중</span>
      </div>
      <div className="mx-auto w-full max-w-wide px-6 py-10 md:py-14 lg:px-8">
        <SectionHeader caption="유튜브 트렌드 서치" label="RISING" />
        <BreakoutTabs current="keywords" />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-3xl">
            <h1 className="text-h3 md:text-h2">급상승 키워드</h1>
            {/* 설명 자리(두 줄까지) */}
            <div aria-hidden="true" className={PULSE}>
              <div className="mt-2 flex h-[27px] items-center md:h-[30px]">
                <div className={`${BAR} h-4 w-full max-w-xl`} />
              </div>
            </div>
          </div>
          {/* 기준 줄 자리 */}
          <div aria-hidden="true" className={`flex h-[21px] items-center ${PULSE}`}>
            <div className={`${BAR} h-3 w-64`} />
          </div>
        </div>

        {/* 캡션(실제와 같은 글자) */}
        <p className="mt-6 text-caption text-fg-3">{COUNTED_CAPTION}</p>

        <div aria-hidden="true" className={PULSE}>

          {/* 1024 이상: 표 */}
          <div className="mt-6 hidden lg:block">
            <div className="flex h-11 items-center gap-6 border-y border-line">
              <div className={`${BAR} h-3 w-8`} />
              <div className={`${BAR} ml-6 h-3 w-12`} />
              <div className="ml-auto flex items-center gap-10 pr-14">
                <div className={`${BAR} h-3 w-14`} />
                <div className={`${BAR} h-3 w-10`} />
                <div className={`${BAR} h-3 w-48`} />
              </div>
            </div>
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="flex h-[75px] items-center gap-6 border-b border-line-soft">
                <div className={`${BAR} h-4 w-8`} />
                <div className={`${BAR} ml-6 h-4 w-40`} />
                <div className="ml-auto flex items-center gap-10 pr-14">
                  <div className={`${BAR} h-4 w-32`} />
                  <div className={`${BAR} h-4 w-14`} />
                  <div className="flex w-52 gap-2">
                    <div className="aspect-video w-24 rounded-control bg-surface-2" />
                    <div className="aspect-video w-24 rounded-control bg-surface-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 1024 미만: 목록 */}
          <div className="-mx-6 mt-6 divide-y divide-line-soft border-y border-line lg:hidden">
            {Array.from({ length: ROWS }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex h-6 items-center gap-2">
                  <div className={`${BAR} h-3 w-5`} />
                  <div className={`${BAR} h-4 w-32`} />
                </div>
                <div className="mt-1 flex h-5 items-center">
                  <div className={`${BAR} h-3 w-40`} />
                </div>
                <div className="mt-2.5 flex gap-2">
                  <div className="aspect-video w-28 rounded-control bg-surface-2" />
                  <div className="aspect-video w-28 rounded-control bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
