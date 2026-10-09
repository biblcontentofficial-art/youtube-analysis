/**
 * 채널 지표 등급(채널 찾기 표·채널 상세가 함께 쓴다). 서버·클라이언트 공용, 의존성 없음.
 * 근거: DESIGN.md 3.1 (색만으로 말하지 않는다 · 흰색은 좋음이 아니다) · 로드맵 C15
 *
 * - '높음'을 빨강으로 쓰지 않는다(/search 의 Worst=빨강과 충돌). 등급은 무채색 밝기 단계(fg·fg-2·fg-3·fg-4)
 *   + 등급 글자로 말한다. 기준값은 기존 화면 값 그대로(결정 12 기본 C: 정렬·값 변경 없음).
 * - 표 아래·지표 아래에 범례 한 줄(gradeLegend)을 함께 둔다.
 */
import { formatCompactKo } from "@/lib/format";

export type GradeLevel = 0 | 1 | 2 | 3;

/** 단계별 글자 톤. Tailwind 가 찾을 수 있게 완성된 문자열 */
export const GRADE_TONE: Record<GradeLevel, string> = {
  0: "font-bold text-fg",
  1: "font-semibold text-fg-2",
  2: "font-medium text-fg-3",
  3: "font-medium text-fg-4",
};

export const GRADE_LABEL: Record<GradeLevel, string> = {
  0: "매우 높음",
  1: "높음",
  2: "보통",
  3: "낮음",
};

/** 지표별 기준값 [매우 높음, 높음, 보통] 이상. 단위는 범례에 쓴다 */
export const GRADE_THRESHOLDS = {
  /** 조회수/구독자 비율(배), 채널 찾기 표 기준 */
  viewPerSub: { cut: [200, 80, 30] as const, unit: "배" },
  /** 조회수/구독자 비율(배), 채널 상세 기준(기존 상세 화면 값 500·200·80 그대로) */
  viewPerSubDetail: { cut: [500, 200, 80] as const, unit: "배" },
  /** 월 평균 구독자 증가(명/월) */
  monthlySubs: { cut: [50_000, 10_000, 3_000] as const, unit: "/월" },
  /** 영상당 평균 조회수(회) */
  avgViews: { cut: [500_000, 100_000, 30_000] as const, unit: "회" },
} as const;

export type GradeMetric = keyof typeof GRADE_THRESHOLDS;

export function gradeLevel(metric: GradeMetric, value: number): GradeLevel {
  const [hi, mid, lo] = GRADE_THRESHOLDS[metric].cut;
  if (value >= hi) return 0;
  if (value >= mid) return 1;
  if (value >= lo) return 2;
  return 3;
}

/** 범례 한 줄: '매우 높음 200배 이상 · 높음 80배 이상 · 보통 30배 이상 · 낮음 그 아래' */
export function gradeLegend(metric: GradeMetric): { level: GradeLevel; text: string }[] {
  const { cut, unit } = GRADE_THRESHOLDS[metric];
  const n = (v: number) => `${formatCompactKo(v)}${unit}`;
  return [
    { level: 0, text: `${GRADE_LABEL[0]} ${n(cut[0])} 이상` },
    { level: 1, text: `${GRADE_LABEL[1]} ${n(cut[1])} 이상` },
    { level: 2, text: `${GRADE_LABEL[2]} ${n(cut[2])} 이상` },
    { level: 3, text: `${GRADE_LABEL[3]} 그 아래` },
  ];
}
