// 조회수 성장 트렌드 그래프
// algorithmScore 구간별로 수학적으로 완전히 다른 곡선 사용 → 직관적 구분
// 색상은 AlgorithmBadge와 완전 동기화

// videoId 기반 결정론적 시드 난수 (같은 영상 = 항상 같은 곡선)
function seededRand(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────
// 4개 구간별 완전히 다른 곡선 함수
//
//  ≥70 (🔥 orange): 하키스틱 — 대부분 낮다가 끝에서 수직상승
//                   y = t^(3.5~5)   → 지금 알고리즘 급탑승 중
//
//  ≥50 (⚡ yellow): 가속 성장 — 위쪽으로 꾸준히 가속
//                   y = t^(1.8~2.5) → 성장 중
//
//  ≥30 (teal):      완만한 S커브 — 중간 지점 변곡, 이후 안정
//                   logistic(mid=0.45~0.55) → 꾸준하지만 둔화
//
//   <30 (gray):     로그 정체 — 초반 빠른 상승 후 평탄
//                   y = sqrt(t) or log → 과거 인기, 현재 정체
// ─────────────────────────────────────────────
function generateCurve(algorithmScore: number, seed: number): number[] {
  const POINTS = 24;
  // 시드로 구간 내 미세 변형 (0~1)
  const variation = seededRand(seed * 3 + 7);

  const pts: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    let y: number;

    if (algorithmScore >= 70) {
      // 🔥 하키스틱: 끝에서 급상승 (power 3.5~5.5)
      const power = 3.5 + variation * 2.0;
      y = Math.pow(t, power);
    } else if (algorithmScore >= 50) {
      // ⚡ 가속 성장: t^1.8~2.6 (아래로 볼록 — 점점 빨라짐)
      const power = 1.8 + variation * 0.8;
      y = Math.pow(t, power);
    } else if (algorithmScore >= 30) {
      // 🟢 완만한 S커브: logistic, 변곡점 0.40~0.55 사이
      const mid = 0.40 + variation * 0.15;
      const k = 7.0;
      const f = (x: number) => 1 / (1 + Math.exp(-k * (x - mid)));
      const f0 = f(0), f1 = f(1);
      y = (f(t) - f0) / (f1 - f0 || 1);
    } else {
      // ⚫ 로그 정체: 초반 빠른 상승 → 급격히 평탄 (sqrt ~ log 사이)
      // power 0.25~0.45: 값이 낮을수록 더 빨리 정체
      const power = 0.25 + variation * 0.20;
      y = Math.pow(t, power);
    }

    // 자연스러운 미세 노이즈 (±2%) — 전체 형태는 유지
    const noise = (seededRand(seed + i * 11 + 3) - 0.5) * 0.04;
    pts.push(Math.max(0, Math.min(1, y + noise)));
  }
  return pts;
}

interface Props {
  algorithmScore: number;
  videoId: string;
  width?: number;
  height?: number;
}

export default function ViewTrendGraph({ algorithmScore, videoId, width = 80, height = 38 }: Props) {
  const seed = videoId.split("").reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
  const points = generateCurve(algorithmScore, seed);

  const W = width, H = height;
  const padX = 2, padY = 3;

  // AlgorithmBadge 색상과 완전 동기화
  // >= 70: orange-500  / >= 50: yellow-500  / >= 30: teal-500  / <30: gray-500
  const color =
    algorithmScore >= 70 ? "#f97316"   // orange-500 (🔥)
    : algorithmScore >= 50 ? "#eab308" // yellow-500 (⚡)
    : algorithmScore >= 30 ? "#14b8a6" // teal-500
    : "#6b7280";                       // gray-500

  const coords = points.map((y, i) => {
    const x = padX + (i / (points.length - 1)) * (W - padX * 2);
    const svgY = H - padY - y * (H - padY * 2);
    return `${x.toFixed(1)},${svgY.toFixed(1)}`;
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
