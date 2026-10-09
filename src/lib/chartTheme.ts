/**
 * 차트·히트맵 색 설정 한 곳(채널 분석·스레드 차트가 함께 쓴다). 서버·클라이언트 공용, 의존성 없음.
 * 근거: DESIGN.md 2.1 '차트·히트맵' · 3.1 차트·히트맵 규칙 (모노크롬 실버)
 *
 * - 주 계열 chart-1(흰) 2px, 비교 계열 chart-2 점선, 배경 막대 chart-3, 눈금선 chart-grid, 축 line-strong, 눈금 글자 fg-3.
 * - 툴팁은 surface-2 면 + line-strong 테두리. 선 아래 칠하기(area fill) 없음.
 * - 평가가 있는 값(점수·등급·상승·하락)만 기능 색. 양(평가 없음)은 무채색.
 * - 값은 CSS 변수로 둔다. SVG 속성(stroke·fill)과 인라인 style 모두 var() 를 읽는다.
 *   토큰 값을 바꾸면 차트가 따라온다(hex 를 여기 다시 적지 않는다).
 *
 *   <Line dataKey="views" {...CHART_LINE_PRIMARY} />
 *   <Line dataKey="prev" {...CHART_LINE_COMPARE} />
 *   <CartesianGrid {...CHART_GRID} />
 *   <XAxis tick={CHART_TICK} axisLine={CHART_AXIS} tickLine={false} />
 *   <Tooltip contentStyle={CHART_TOOLTIP} labelStyle={CHART_TOOLTIP_LABEL} />
 */

export const CHART_COLORS = {
  /** 주 계열(흰) */
  primary: "var(--color-chart-1)",
  /** 비교 계열(fg-3 회색, 점선) */
  compare: "var(--color-chart-2)",
  /** 배경 막대·Normal 막대 */
  muted: "var(--color-chart-3)",
  /** 눈금선 */
  grid: "var(--color-chart-grid)",
  /** 축 선 */
  axis: "var(--color-line-strong)",
  /** 눈금 글자 */
  tick: "var(--color-fg-3)",
  /** 평가가 있는 값만: 상승·좋음 / 주의 / 하락·나쁨 */
  positive: "var(--color-positive)",
  caution: "var(--color-caution)",
  negative: "var(--color-negative)",
} as const;

/** 주 계열 선: 흰 2px, 점은 같은 색 작은 점, 선 아래 칠하기 없음 */
export const CHART_LINE_PRIMARY = {
  stroke: CHART_COLORS.primary,
  strokeWidth: 2,
  dot: { fill: CHART_COLORS.primary, r: 2.5, strokeWidth: 0 },
  activeDot: { fill: CHART_COLORS.primary, r: 4, strokeWidth: 0 },
  fill: "none",
} as const;

/** 비교 계열 선: chart-2 점선 1.5px, 점 없음 */
export const CHART_LINE_COMPARE = {
  stroke: CHART_COLORS.compare,
  strokeWidth: 1.5,
  strokeDasharray: "2 4",
  dot: false,
  fill: "none",
} as const;

/** 배경 막대 */
export const CHART_BAR_MUTED = { fill: CHART_COLORS.muted } as const;

/** 눈금선: 가로만, 실선 1px */
export const CHART_GRID = { stroke: CHART_COLORS.grid, strokeDasharray: "0", vertical: false } as const;

/** 축 선 */
export const CHART_AXIS = { stroke: CHART_COLORS.axis } as const;

/** 눈금 글자: 12px fg-3 (최소 글자 12px, DESIGN 4.2) */
export const CHART_TICK = { fill: CHART_COLORS.tick, fontSize: 12 } as const;

/** 툴팁 상자 */
export const CHART_TOOLTIP = {
  backgroundColor: "var(--color-surface-2)",
  border: "1px solid var(--color-line-strong)",
  borderRadius: 8,
  color: "var(--color-fg)",
  fontSize: 13,
  boxShadow: "none",
} as const;

/** 툴팁 머리(날짜 등) */
export const CHART_TOOLTIP_LABEL = { color: "var(--color-fg-3)", fontSize: 12 } as const;

/** 툴팁 hover 막대(세로선) */
export const CHART_TOOLTIP_CURSOR = { stroke: CHART_COLORS.axis, strokeWidth: 1 } as const;

/**
 * 히트맵 5단계(heat-1 가장 어두움 ~ heat-5 가장 밝음). 1·2단계는 흰 글자, 3단계부터 검정 글자(accent-ink).
 * 대비(DESIGN 2.1): 흰 글자 16.48 · 9.29, 검정 글자 4.89 · 9.68 · 17.94 (모두 4.5:1 이상).
 * Tailwind 가 찾을 수 있게 완성된 클래스 문자열로 둔다.
 */
export const HEAT_LEVELS = [
  "bg-heat-1 text-fg",
  "bg-heat-2 text-fg",
  "bg-heat-3 text-accent-ink",
  "bg-heat-4 text-accent-ink",
  "bg-heat-5 text-accent-ink",
] as const;

/** 0~1 비율을 히트맵 단계(0~4)로. 값이 없으면(0 이하) 가장 어두운 단계 */
export function heatLevel(ratio: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(ratio) || ratio <= 0.2) return 0;
  if (ratio <= 0.4) return 1;
  if (ratio <= 0.6) return 2;
  if (ratio <= 0.8) return 3;
  return 4;
}
