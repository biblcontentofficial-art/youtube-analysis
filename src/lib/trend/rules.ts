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

/** A1: 최근 7일 서로 다른 채널 수 하한(롱폼). 소유자 결정 2026-10-15: 3곳 */
export const MIN_RECENT_CHANNELS = 3;
/** A1: 쇼츠 하한. 소유자 결정 2026-10-15: 2곳(쇼츠는 하루 수집량이 롱폼의 1/3 안팎) */
export const MIN_RECENT_CHANNELS_SHORTS = 2;
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
/** A3 d1 복사: 게시일 다음 날 한국 시각 이 시 전에 수집된 행만 day 1 로 복사한다 */
export const D1_CUTOFF_KST_HOUR = 18;

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

/** breakout_videos 행 중 집계에 쓰는 칼럼 */
export type CountedRowLike = { kind: string | null; category_id: string | number | null; outlier: number | null };

/**
 * 집계 대상 행(trend_dev.sql 머리 주석과 같은 조건): kind 가 없고(뉴스·홈쇼핑·이슈 제외),
 * 분류 칼럼이 생기기 전 수집 행(kind·category_id·outlier 모두 null, 2026-10-07 의 221행)이 아닌 행.
 */
export function isCountedRow(row: CountedRowLike): boolean {
  return row.kind == null && !(row.category_id == null && row.outlier == null);
}

/** 분류 칼럼이 생기기 전 수집 행(집계 제외, detail.excluded_legacy 로 센다) */
export function isLegacyRow(row: CountedRowLike): boolean {
  return row.kind == null && row.category_id == null && row.outlier == null;
}
