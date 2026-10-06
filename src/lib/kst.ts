/**
 * 한국 시간(Asia/Seoul) 기준 날짜·요일·시각.
 *
 * getDay()·getHours()·getDate() 는 실행 환경의 시간대를 따른다. 서버(Vercel 은 UTC)와
 * 브라우저(사용자 시간대)가 달라서, 클라이언트 컴포넌트가 렌더 중에 쓰면 SSR 결과와
 * 하이드레이션 결과가 어긋나고 업로드 시간도 9시간 틀어진다. 이 모듈은 어디서 실행해도 같은 값을 낸다.
 */
const KST_WEEKDAY_HOUR = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  weekday: "short",
  hour: "numeric",
});

const KST_DATE = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 한국 시간 요일(0=일요일)과 시(0~23). 날짜를 읽을 수 없으면 null. */
export function kstWeekdayHour(iso: string): { weekday: number; hour: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  let weekday = -1;
  let hour = -1;
  for (const part of KST_WEEKDAY_HOUR.formatToParts(d)) {
    if (part.type === "weekday") weekday = WEEKDAYS.indexOf(part.value);
    else if (part.type === "hour") hour = Number(part.value);
  }
  if (weekday < 0 || !(hour >= 0 && hour <= 23)) return null;
  return { weekday, hour };
}

/** 한국 시간 날짜 "2026. 10. 7." (기존 화면 표기와 같은 모양). 날짜를 읽을 수 없으면 "-". */
export function formatKstDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  let year = "";
  let month = "";
  let day = "";
  for (const part of KST_DATE.formatToParts(d)) {
    if (part.type === "year") year = part.value;
    else if (part.type === "month") month = part.value;
    else if (part.type === "day") day = part.value;
  }
  return `${year}. ${month}. ${day}.`;
}
