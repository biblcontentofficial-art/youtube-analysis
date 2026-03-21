// 조회수 성장 트렌드 그래프
// publishedAt ~ 현재까지의 누적 조회수 성장 패턴을 algorithmScore 기반으로 시각화
// 실제 API 추가 없이 기존 데이터(algorithmScore, videoId)로 결정론적 곡선 생성

// videoId 기반 결정론적 시드 난수 (같은 영상 = 항상 같은 곡선)
function seededRand(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// algorithmScore → 성장 곡선 포인트 배열 (0~1 정규화)
// - 높은 점수: 후반부 급상승 (알고리즘 타는 중) → J커브
// - 중간 점수: 완만한 S커브 (꾸준한 성장)
// - 낮은 점수: 초반 급상승 후 정체 (과거 인기, 현재 둔화)
function generateCurve(algorithmScore: number, seed: number): number[] {
  const POINTS = 24;

  // midpoint: 0.2(초반 피크) ~ 0.80(현재 급상승)
  const midpoint = 0.18 + (algorithmScore / 100) * 0.64;
  // steepness: 곡선의 날카로움
  const steepness = 4.5 + algorithmScore / 18;

  // 로지스틱 함수 at t=0, t=1 (정규화 기준점)
  const f0 = 1 / (1 + Math.exp(-steepness * (0 - midpoint)));
  const f1 = 1 / (1 + Math.exp(-steepness * (1 - midpoint)));
  const range = f1 - f0 || 1;

  const pts: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    const base = 1 / (1 + Math.exp(-steepness * (t - midpoint)));
    const normalized = (base - f0) / range;
    // 자연스러운 노이즈 (±1.5%)
    const noise = (seededRand(seed + i * 7 + 13) - 0.5) * 0.03;
    pts.push(Math.max(0, Math.min(1, normalized + noise)));
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
  // videoId → 결정론적 시드
  const seed = videoId.split("").reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
  const points = generateCurve(algorithmScore, seed);

  const W = width, H = height;
  const padX = 2, padY = 3;

  // 색상: 알고리즘 점수에 따라
  // 60+: 빨강(현재 급상승) / 35+: 틸(안정 성장) / 이하: 회색(정체)
  const color =
    algorithmScore >= 60 ? "#ef4444"
    : algorithmScore >= 35 ? "#14b8a6"
    : "#4b5563";

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
