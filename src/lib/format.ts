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

