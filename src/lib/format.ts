export function formatKoreanNumber(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (n >= 100_000_000) return `${Math.floor(n / 100_000_000)}억`;
  if (n >= 10_000) return `${Math.floor(n / 10_000)}만`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}천`;
  return `${Math.floor(n)}`;
}

export function formatSubscribers(n: number): string {
  if (!Number.isFinite(n)) return "-명";
  if (n >= 100_000_000) return `${Math.floor(n / 100_000_000)}억명`;
  if (n >= 10_000) return `${Math.floor(n / 10_000)}만명`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}천명`;
  return `${Math.floor(n)}명`;
}

export function formatDateYYYYMMDotDD(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}


/**
 * 만·억 단위 짧은 숫자(소수 한 자리, .0 은 떼어 낸다). 1만 미만은 쉼표만.
 * 예: 9,940 · 1.8만 · 74.4만 · 300만 · 1.2억. 앱 결과 표·영상 정보·채널 리포트·수집한 영상 통계가 함께 쓴다.
 */
export function formatCompactKo(n: number): string {
  if (!Number.isFinite(n)) return "-";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  const one = (v: number) => {
    const s = (Math.round(v * 10) / 10).toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  // 9999.95만 이상은 반올림하면 10000만이 되므로 억으로 올린다
  if (a >= 99_999_500) return `${sign}${one(a / 100_000_000)}억`;
  if (a >= 10_000) return `${sign}${one(a / 10_000)}만`;
  return `${sign}${Math.round(a).toLocaleString("ko-KR")}`;
}

/**
 * 아웃라이어 배수 = 영상 조회수 ÷ 채널 평균 조회수(채널 누적 조회수 ÷ 영상 수).
 * 10배 미만은 소수 한 자리, 이상은 정수. 계산할 수 없으면 '-'. 검색 결과 표·브레이크아웃이 함께 쓴다.
 */
export function outlierLabel(ratio: number | null | undefined): string {
  const r = ratio ?? 0;
  if (!r || !Number.isFinite(r)) return "-";
  if (r >= 10) return `${Math.round(r).toLocaleString("ko-KR")}배`;
  return `${r.toFixed(1).replace(/\.0$/, "")}배`;
}
