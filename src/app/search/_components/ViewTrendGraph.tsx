// 조회수 성장 트렌드 그래프 (지금 쓰는 곳 없음. 다시 쓸 때를 위해 색만 확정 팔레트로 옮겨 둔다)
// Catmull-Rom → cubic bezier 부드러운 곡선. 선 아래 칠하기 없음(DESIGN 3.1 차트)
// 실제 유튜브 조회수 성장 패턴에 맞는 곡선 형태 사용

// videoId 기반 결정론적 시드 난수 (같은 영상 = 항상 같은 곡선)
function seededRand(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────────────────────────────────────
// 실제 유튜브 조회수 성장 패턴
//
//  ≥70: 지수 성장형 — 초반부터 가파르게 오르며 끝까지 상승 중
//       exp(kt) 형태, 알고리즘에 탑승해 현재도 오르는 중
//
//  ≥50: 가속 상승형 — 꾸준히 상승, 약간 가속되는 패턴
//       t^0.65 형태, 성장 진행 중
//
//  ≥30: 로그 성장형 — 초반 빠른 상승 후 완만하게 둔화
//       log(1+kt) 형태, 일반적인 유튜브 패턴
//
//  <30: 빠른 정체형 — 초반 급상승 후 거의 평탄
//       t^0.18 형태, 현재 정체 상태
// ─────────────────────────────────────────────────────────────────────────────
function generateCurve(algorithmScore: number, seed: number): number[] {
  const POINTS = 32;
  const variation = seededRand(seed * 3 + 7);
  const pts: number[] = [];

  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    let y: number;

    if (algorithmScore >= 70) {
      // 지수 성장형: 초반부터 급격히 상승 → 끝까지 가파르게 오름
      const k = 2.2 + variation * 0.8;
      y = (Math.exp(k * t) - 1) / (Math.exp(k) - 1);
    } else if (algorithmScore >= 50) {
      // 가속 상승형: t^0.65 근사 — 꾸준히 오르되 선형보다 초반이 빠름
      const power = 0.60 + variation * 0.15;
      y = Math.pow(t, power);
    } else if (algorithmScore >= 30) {
      // 로그 성장형: 초반 빠른 상승 후 점차 둔화 — 가장 일반적인 패턴
      const k = 7 + variation * 5;
      y = Math.log(1 + k * t) / Math.log(1 + k);
    } else {
      // 빠른 정체형: 초반에 거의 다 오른 후 평탄 — 현재 정체 중
      const power = 0.14 + variation * 0.08;
      y = Math.pow(t, power);
    }

    // 자연스러운 미세 노이즈 (±1.5%) — 전체 형태는 유지
    const noise = (seededRand(seed + i * 11 + 3) - 0.5) * 0.03;
    pts.push(Math.max(0, Math.min(1, y + noise)));
  }
  return pts;
}

// Catmull-Rom 스플라인 → cubic bezier 변환 (부드러운 곡선)
function buildSmoothPath(
  coords: { x: number; y: number }[],
  tension = 0.35
): string {
  if (coords.length < 2) return "";
  let d = `M ${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * 알고리즘 점수 색(DESIGN 3.1, 높을수록 좋음): 70 이상 positive · 50~69 fg-2 · 30~49 fg-3 · 30 미만 fg-4. 흰색 쓰지 않음.
 * 선은 currentColor 로 그려 토큰 글자 색을 그대로 따른다.
 */
function scoreColorClass(score: number): string {
  if (score >= 70) return "text-positive";
  if (score >= 50) return "text-fg-2";
  if (score >= 30) return "text-fg-3";
  return "text-fg-4";
}

interface Props {
  algorithmScore: number;
  videoId: string;
  width?: number;
  height?: number;
}

export default function ViewTrendGraph({
  algorithmScore,
  videoId,
  width = 80,
  height = 38,
}: Props) {
  const seed = videoId
    .split("")
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
  const points = generateCurve(algorithmScore, seed);

  const W = width;
  const H = height;
  const padX = 2;
  const padY = 3;

  // 좌표 계산
  const coords = points.map((y, i) => ({
    x: padX + (i / (points.length - 1)) * (W - padX * 2),
    y: H - padY - y * (H - padY * 2),
  }));

  // 부드러운 선 경로
  const linePath = buildSmoothPath(coords);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={`overflow-visible ${scoreColorClass(algorithmScore)}`}
      aria-hidden="true"
    >
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
