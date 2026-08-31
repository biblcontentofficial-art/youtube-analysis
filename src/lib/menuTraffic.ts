/** 트래픽 분석 대상 네비 메뉴 (page_visits.page 키 = 표시 순서) */
export const MENUS = [
  { key: "incubating", label: "브랜드 인큐베이팅", path: "/incubating" },
  { key: "community", label: "커뮤니티&자료", path: "/community" },
  { key: "trend-search", label: "유튜브 트렌드 서치", path: "/trend-search" },
  { key: "consulting-class", label: "팀비블 1:1 컨설팅", path: "/studio/class/consulting" },
  { key: "studio", label: "유튜브 채널 대행", path: "/studio" },
] as const;

export const MENU_KEYS: readonly string[] = MENUS.map((m) => m.key);
