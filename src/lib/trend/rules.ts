/**
 * 트렌드 서치 규칙 상수(순수, import 없음). 소유자가 기준을 바꾸는 한 곳.
 * A1(급상승 키워드)·B4(브리핑)·C7(알림)·C8(내 채널 추천)이 같은 단어 목록과 기준을 쓴다.
 *
 * 토크나이저(tokenize.ts)는 Node 직접 시험을 위해 아무것도 import 하지 않으므로, 단어 목록은
 * TOKEN_RULES 로 묶어 호출하는 쪽이 넘긴다: tokenizeTitle(title, { rules: TOKEN_RULES, bareForms }).
 * 오탐·누락을 발견하면 여기 목록에 더하고, scripts/trend/fixtures/titles.json 에 가상 제목으로 시험을 넣는다.
 */

/** 쇼츠 기준(초). src/lib/breakout.ts 의 SHORTS_MAX_SEC 와 같아야 한다(복제: 이 파일은 import 를 하지 않는다) */
export const SHORTS_MAX_SEC = 180;

/** A1: 최근 7일 서로 다른 채널 수 하한(가로 롱폼). 소유자 결정 2026-10-15: 3곳 */
export const MIN_RECENT_CHANNELS = 3;
/** A1: 최근 기간 수집 일수가 이보다 적으면 sparse */
export const MIN_RECENT_DAYS = 3;
/** A1: 이전 기간 수집 일수가 이보다 적으면 비교 대신 top(많이 나온 단어) */
export const MIN_PRIOR_DAYS = 5;
/** A1: 증가 배수가 이 값 이상일 때 배수를 보인다 */
export const RISING_SHOW_MULTIPLIER = 2;
/** A1: 한 번에 보이는 최대 단어 수 */
export const RISING_LIMIT = 50;
/** A1 top: 최근 30일 수집일 중 이 비율 이상 나온 단어는 '상시어'로 뺀다(소유자 결정 60%) */
export const TOP_MAX_DAY_RATIO = 0.6;
/** A1 top: 최근 30일 수집 일수가 이 값 이상일 때만 상시어 거르기를 한다 */
export const TOP_MIN_HIST_DAYS = 6;
/** A3 d1 복사: 게시일 D1_CUTOFF_DAYS 일 뒤 한국 시각 이 시 전에 수집된 행만 day 1 로 복사한다 */
export const D1_CUTOFF_KST_HOUR = 18;
/**
 * A3 d1 복사 기한(게시 날짜에서 며칠 뒤까지). 소유자 결정 2026-10-15: 느슨한 조건(2일 이내) = 2.
 * 1 이면 엄격(다음 날 한국 18시 전, 정기 수집 값만). 2026-10-15 데이터로 1 은 10-14 226행, 2 는 10-13 279행이 더해진다.
 */
export const D1_CUTOFF_DAYS = 2;
/** A3 track: 한 번 실행에서 videos.list(statistics) 호출 상한(호출 1회 = 1 unit, 50개 묶음). 넘으면 앞 1,000개만 잰다 */
export const TRACK_MAX_CALLS = 20;
/** A3 track: videos.list 한 번에 넣는 영상 수(YouTube 상한) */
export const TRACK_BATCH = 50;
/** A3 흐름 '꾸준히 성장': 7일 조회수가 다음 날의 이 배수 이상 */
export const FLOW_STEADY_X = 3;
/** A3 흐름 '꾸준히 성장': 3일 값이 있으면 7일 조회수가 3일의 이 배수 이상이어야 한다 */
export const FLOW_STEADY_V3_X = 1.3;
/** A3 흐름 '초반 집중': 7일 조회수가 다음 날의 이 배수 미만 */
export const FLOW_EARLY_X = 1.5;
/** A3: 7일 증가 배수(▲)는 이 값 이상일 때만 보인다 */
export const GROWTH_SHOW_MULTIPLIER = 2;
/** A3: 정렬 기준 상위 몇 개를 그리는가 */
export const GROWTH_LIMIT = 50;

function set(words: string): Set<string> {
  return new Set(words.split(/\s+/).filter(Boolean));
}

/** 해시태그 불용어(소문자, '#' 없이) */
export const TAG_STOP = set(`shorts 쇼츠 short 유튜브 youtube fyp`);

/**
 * 불용어(정규화 뒤 전체 일치). 해시태그에도 적용한다.
 * 방송 형식어·부사·일반어·요일·시간어, 그리고 실제 데이터에서 위를 덮은 일반어(spec 3.1 top 상태의 일반어 문제).
 */
export const STOP_WORDS = set(`
  shorts short 쇼츠 유튜브 youtube fyp
  live 라이브 ep vs feat ft mv official full 풀버전 다시보기 하이라이트 모음 풀영상 실시간 스트림 스트리밍
  the of and in on to with for my is it at by from this that you your me we are be not
  진짜 너무 이렇게 지금 없는 있는 하는 결국 드디어 정말 완전 가장 처음 오늘 이유 방법 순간 근황 공개 영상 방송 채널
  역대급 미친 이제 다시 사람 사람들 세상 시작 전부 절대 직접 만에 상황 상대 함께 바로 등장 마지막 충격 레전드
  무슨 내가 남자 여자 엄마 아빠 이번 우리 그냥 모든 최고 대박 하지만 제대로
  어제 내일 요즘 오랜만 월요일 화요일 수요일 목요일 금요일 토요일 일요일 주말 이번주 오늘의
  갔더니 빠진 떴다 실제 그리고 그래서 그런데 근데 이런 저런 그런 어떤 많은 모두 다들 또 왜 어떻게 누가 뭐가 이건 그게 이게
  en eng kor sub cc 없이 나를 너를 저를
  만든 받은 웃긴 난리난 보면 아무 걸까 몰아보기 비하인드 최종화 예고 티저 선공개
  나는 너는 내 네 저는 제가 우리가 우리의 하고 해서 하면 했다 한다 된다 됐다 같은 처럼 정도 때문 때문에 위해 대한 관련
`);

/**
 * 일반어 점검 목록(시험·detail.generic_in_top10 용). 실제 10-13·10-14 의 '많이 나온 단어' 상위를 채우던 단어.
 * 여기 있다고 버리지는 않는다(버리는 것은 STOP_WORDS).
 */
export const GENERIC_WORDS = set(`한국 역대급 중국 미친 이제 게임 상대 세상 시작 전부 절대 만에 직접 남자`);

/**
 * 규칙 예외(그대로 둔다): 용언형 끝 검사·조사 떼기·불용어 검사를 하지 않는다.
 * 용언형처럼 끝나는 명사(냉장고·시카고)나, 조사처럼 끝나는데 앞부분도 단어인 명사(경상도·고양이)를 넣는다.
 */
export const ALLOW_TERMS = set(`냉장고 시카고 산티아고 샌디에이고 경상도 전라도 충청도 고양이 어린이 원숭이`);

/** 토크나이저에 넘기는 묶음 */
export const TOKEN_RULES = { stopWords: STOP_WORDS, allowTerms: ALLOW_TERMS, tagStop: TAG_STOP };

/**
 * breakout_videos 행 중 집계에 쓰는 칼럼. 이 판정을 쓰는 select 는 반드시 video_format,duration_sec 를 같이 읽는다
 * (빠뜨리면 롱폼 판정이 안 되어 모든 행이 집계에서 빠진다. 타입으로 막으려고 두 칼럼을 필수로 둔다).
 */
export type CountedRowLike = {
  kind: string | null;
  category_id: string | number | null;
  outlier: number | null;
  /** long | shorts | vertical | live. 칼럼 추가 전 수집분은 null */
  video_format: string | null;
  duration_sec: number | null;
};

/**
 * 가로 롱폼인가(소유자 결정 2026-10-16: 브레이크아웃 모든 탭은 가로 롱폼만, 쇼츠·세로·라이브 제외).
 * video_format 이 있으면 'long' 만, 없으면(칼럼 추가 전 수집분) 길이가 SHORTS_MAX_SEC 초과일 때만 롱폼으로 본다.
 * SQL 은 trend_longform_only.sql 의 coalesce(bv.video_format, case when bv.duration_sec > p_shorts_max then 'long' else 'shorts' end) = 'long'.
 */
export function isLongFormRow(row: Pick<CountedRowLike, "video_format" | "duration_sec">): boolean {
  if (row.video_format != null) return row.video_format === "long";
  return row.duration_sec != null && Number(row.duration_sec) > SHORTS_MAX_SEC;
}

/**
 * 집계 대상 행(trend_dev.sql 머리 주석 + trend_longform_only.sql 과 같은 조건): kind 가 없고(뉴스·홈쇼핑·이슈 제외),
 * 분류 칼럼이 생기기 전 수집 행(kind·category_id·outlier 모두 null, 2026-10-07 의 221행)이 아니고, 가로 롱폼(isLongFormRow)인 행.
 */
export function isCountedRow(row: CountedRowLike): boolean {
  return row.kind == null && !(row.category_id == null && row.outlier == null) && isLongFormRow(row);
}

/** 화면 캡션(급상승 키워드·지금 크는 채널·성장 추적 공통). 스켈레톤도 같은 글자를 그린다 */
export const COUNTED_CAPTION = "가로 롱폼 영상 기준(쇼츠·세로·라이브 제외), 뉴스·홈쇼핑·정치·이슈 채널은 빼고 셉니다";

/** 분류 칼럼이 생기기 전 수집 행(집계 제외, detail.excluded_legacy 로 센다) */
export function isLegacyRow(row: Pick<CountedRowLike, "kind" | "category_id" | "outlier">): boolean {
  return row.kind == null && row.category_id == null && row.outlier == null;
}

/* ───────── A3 성장 추적(T5) 순수 함수 ─────────
 * v1·v3·v7 = 게시 다음 날·3일 뒤·7일 뒤 조회수, m1·m3·m7 = 잰 시각(RPC trend_growth 그대로).
 * m 이 null 이면 그 시점은 아직 안 잼(측정 전), m 은 있는데 v 가 null 이면 응답에서 빠진 영상(비공개·삭제).
 */

export type FlowInput = {
  v1: number | null;
  v3: number | null;
  v7: number | null;
  m1: string | null;
  m3: string | null;
  m7: string | null;
};
/** steady = 꾸준히 성장, early = 초반 집중, pending = 7일 측정 전, gone = 7일에 비공개·삭제. null = 표시 없음 */
export type Flow = "steady" | "early" | "pending" | "gone";
export type CellState = "pending" | "gone" | "value";

/**
 * 흐름 구분. 판정 순서: 7일 측정 전 → 7일 비공개·삭제 → 다음 날 값 없음(판단 불가, null)
 * → 꾸준히 성장(v7 ≥ 3×v1 이고, 3일 값이 있으면 v7 ≥ 1.3×v3) → 초반 집중(v7 < 1.5×v1) → 그 밖 null.
 */
export function classifyFlow({ v1, v3, v7, m7 }: FlowInput): Flow | null {
  if (m7 == null) return "pending";
  if (v7 == null) return "gone";
  if (v1 == null) return null;
  if (v7 >= FLOW_STEADY_X * v1 && (v3 == null || v7 >= FLOW_STEADY_V3_X * v3)) return "steady";
  if (v7 < FLOW_EARLY_X * v1) return "early";
  return null;
}

/** 칸 하나의 상태: 값이 있으면 value, 잰 시각도 없으면 측정 전, 잰 시각만 있으면 비공개·삭제 */
export function cellState(v: number | null, m: string | null): CellState {
  if (v != null) return "value";
  return m == null ? "pending" : "gone";
}

/** 7일 증가 배수(v7 ÷ v1). 둘 다 있고 v1 > 0 일 때만 숫자 */
export function growthMultiplier(v1: number | null, v7: number | null): number | null {
  if (v1 == null || v7 == null || v1 <= 0) return null;
  return v7 / v1;
}

/**
 * d1 복사 기한(UTC ISO). 게시 날짜(YYYY-MM-DD, 한국) + D1_CUTOFF_DAYS 일의 한국 D1_CUTOFF_KST_HOUR 시.
 * 이 시각 전에 수집된 breakout_videos 행만 day 1 로 복사한다(재수집으로 부푼 값·늦게 잰 값 제외).
 */
export function d1Cutoff(date: string, days = D1_CUTOFF_DAYS, hour = D1_CUTOFF_KST_HOUR): string {
  const start = Date.parse(`${date}T00:00:00+09:00`);
  return new Date(start + days * 86400_000 + hour * 3600_000).toISOString();
}
