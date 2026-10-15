/**
 * B4 오늘의 브리핑 카드(서버 컴포넌트, 훅 없음). 근거: docs/trend-dev/spec.md 3.4 · roadmap T6 · DESIGN 6.7(앱 카드)
 *
 * 영상 탭 날짜 칩 위에 둔다. 데이터는 lib/trend/briefing.ts getBriefing(date) 가 만든 BriefingData.
 * 정보 구조를 안 B·C 로 바꿔도 그대로 옮겨 쓸 수 있게 탭 페이지와 분리해 props 만 받는다.
 *
 * 그리는 경우
 * - ai 'off'(AI 기능 준비 중, 소유자 결정 2026-10-15): 카드 자리에 '오늘의 브리핑 · 준비 중' 한 줄 상자. 외부 AI 안내 없음
 * - 브리핑 있음: 카드(01·02 실버 번호 + 라벨 + 문장, 롱폼/쇼츠 한 줄) + 바로 아래 AiNotice
 * - 브리핑 없음: 키 없음·brief 단계 skipped(no_api_key)·조회 실패·지난 날짜는 아무것도 그리지 않는다.
 *   가장 최근 날짜에서 brief 가 failed 면 준비 못 함 한 줄, 아직 ok·failed 가 아니면 대기 한 줄
 */
import { AiNotice } from "@/components/ui/notice";
import { briefingDateLabel, type BriefingData } from "@/lib/trend/briefing-schema";

type Props = BriefingData & {
  /** 고른 날짜 'YYYY-MM-DD' */
  date: string;
  /** 고른 날짜가 가장 최근 수집 날짜인가 */
  isLatest: boolean;
  className?: string;
};

const BRIEF_LABEL = "text-micro font-black tracking-[0.25em] text-silver";

function noKeyJob(detail: unknown): boolean {
  return detail === "no_api_key" || detail === "ai_disabled";
}

export function BriefingCard({ date, isLatest, briefing, briefJob, ai, error, className = "mt-8" }: Props) {
  if (ai === "off") {
    return (
      <div className={className}>
        <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 md:px-6">
          <p className="text-body-sm text-fg-3">
            <span className="font-semibold text-fg-2">오늘의 브리핑</span> · 준비 중
          </p>
          <span lang="en" aria-hidden="true" className={BRIEF_LABEL}>BRIEF</span>
        </div>
      </div>
    );
  }

  if (!briefing) {
    if (error || ai === "no_key" || !isLatest) return null;
    if (briefJob?.status === "skipped" && noKeyJob(briefJob.detail)) return null;
    if (briefJob?.status === "failed") {
      return <p className={`${className} text-body-sm text-fg-3`}>오늘 브리핑을 준비하지 못했습니다. 아래 영상 목록은 그대로 볼 수 있어요.</p>;
    }
    if (briefJob?.status === "ok") return null;
    return <p className={`${className} text-body-sm text-fg-3`}>브리핑은 보통 아침 9시 전에 올라와요.</p>;
  }

  const notes = [
    briefing.long_note ? { key: "long", label: "롱폼", text: briefing.long_note } : null,
    briefing.shorts_note ? { key: "shorts", label: "쇼츠", text: briefing.shorts_note } : null,
  ].filter((n): n is { key: string; label: string; text: string } => n !== null);

  return (
    <section aria-labelledby="brief-title" className={className}>
      <div className="rounded-card border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="brief-title" className="text-caption font-semibold text-fg">{briefingDateLabel(date)} 브리핑</h2>
          <span lang="en" aria-hidden="true" className={BRIEF_LABEL}>BRIEF</span>
        </div>
        <ol className="mt-4 space-y-3">
          {briefing.bullets.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="tnum w-6 shrink-0 pt-0.5 text-caption font-bold text-silver">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1 md:flex md:gap-4">
                <span className="block shrink-0 pt-0.5 text-caption text-fg-3 md:w-20">{b.label}</span>
                <p className="text-body-sm text-fg-2 md:text-ui">{b.text}</p>
              </div>
            </li>
          ))}
        </ol>
        {notes.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-line-soft pt-3 text-body-sm text-fg-3">
            {notes.map((n) => <p key={n.key}>{n.label} · {n.text}</p>)}
          </div>
        )}
      </div>
      <AiNotice />
    </section>
  );
}
