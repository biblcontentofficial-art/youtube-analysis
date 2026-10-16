/**
 * T2 한국어 제목 토크나이저·terms 집계 시험(네트워크·DB 를 쓰지 않는다).
 *
 *   node --test scripts/trend/tokenize.test.mjs
 *
 * src/lib/trend/tokenize.ts·rules.ts 는 import 가 없어 Node 24 타입 제거 실행으로 바로 불러온다.
 * terms.ts(buildTermRows) 는 상대 경로 import 를 쓰므로 jobs.test.mjs 와 같은 resolve 훅을 건다.
 * 제목은 fixtures/titles.json 의 가상 제목(실제 영상 제목 복사 아님).
 */
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

registerHooks({
  resolve(specifier, context, next) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const url = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  },
});

// 운영 DB 를 건드리지 않게 지운다(buildTermRows 는 순수 함수지만 혹시 모를 호출 대비)
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const T = await import(new URL("../../src/lib/trend/tokenize.ts", import.meta.url).href);
const R = await import(new URL("../../src/lib/trend/rules.ts", import.meta.url).href);
const TERMS = await import(new URL("../../src/lib/trend/terms.ts", import.meta.url).href);

const FIXTURES = JSON.parse(readFileSync(new URL("./fixtures/titles.json", import.meta.url), "utf8")).cases;

/** 운영과 같은 규칙으로 토큰화 */
const tok = (title, bare) => T.tokenizeTitle(title, { rules: R.TOKEN_RULES, ...(bare ? { bareForms: new Set(bare) } : {}) });

// ─── 수용 기준(roadmap T2 acceptance 1) ─────────────────────────────────

test("수용: [LIVE] 맨유가 1차전 와일드카드에서 ... #shorts #맨유", () => {
  const r = tok("[LIVE] 맨유가 1차전 와일드카드에서 ㅋㅋㅋ 2026 10월 #shorts #맨유", ["맨유", "와일드카드"]);
  for (const w of ["맨유", "1차전", "와일드카드"]) assert.ok(r.words.includes(w), `words 에 ${w}: ${r.words}`);
  for (const w of ["live", "ㅋㅋㅋ", "2026", "10월"]) assert.ok(!r.words.includes(w), `words 에 ${w} 없어야: ${r.words}`);
  assert.ok(r.tags.includes("맨유"), `tags: ${r.tags}`);
  assert.ok(!r.tags.includes("shorts"), `tags: ${r.tags}`);
});

test("수용: '요즘 갔더니 진짜' → 빈 배열", () => {
  assert.deepEqual(tok("요즘 갔더니 진짜").words, []);
});

test("수용: '한국' 그대로, '한국이'(bareForms 에 '한국') → '한국'", () => {
  assert.deepEqual(tok("한국").words, ["한국"]);
  assert.deepEqual(tok("한국이", ["한국"]).words, ["한국"]);
});

test("수용: '디스플레이'(bareForms 에 '디스플레' 없음) 그대로", () => {
  assert.deepEqual(tok("디스플레이", ["디스플레이", "플레이"]).words, ["디스플레이"]);
});

test("수용: '모르는'·'시키는'·'안되는' 버림", () => {
  for (const w of ["모르는", "시키는", "안되는", "생기는", "말하는", "해주는"]) {
    assert.deepEqual(tok(w).words, [], w);
    assert.deepEqual(tok(w, [w.slice(0, -1)]).words, [], `${w} (어간이 bareForms 에 있어도)`);
  }
});

test("수용: '챌린지'·'할머니'·'짜장면'·'캐나다' 그대로", () => {
  for (const w of ["챌린지", "할머니", "짜장면", "캐나다", "디즈니", "에너지", "이미지", "신진서", "어머니", "메시지"]) {
    assert.deepEqual(tok(w).words, [w], w);
  }
});

// ─── 세부 규칙 ─────────────────────────────────────────────────────────

test("bareForms 를 안 주면 조사를 떼지 않는다", () => {
  assert.deepEqual(tok("맨유가 와일드카드에서").words, ["맨유가", "와일드카드에서"]);
});

test("2글자 단어는 조사처럼 끝나도 떼지 않는다(한국·일본·마을)", () => {
  assert.deepEqual(tok("일본 마을 가을", ["일", "마", "가"]).words, ["일본", "마을", "가을"]);
});

test("숫자·날짜·연도·자모·한 글자 버림, '1차전'·'9단' 은 남김", () => {
  const r = tok("1 22 2026 2026년 10월 3회 1위 100만 3가지 2탄 5조 100만명 10월에 ㅋㅋ ㅠㅠ a 가 1차전 9단");
  assert.deepEqual(r.words, ["1차전", "9단"]);
});

test("해시태그: '#' 제거·소문자, TAG_STOP·숫자 버림, 한 제목 안 중복 제거", () => {
  assert.deepEqual(T.extractTags("#Shorts #쇼츠 #fyp #YouTube #맨유 #맨유 #KBO #2026 #ㅋㅋ", R.TOKEN_RULES), ["맨유", "kbo"]);
});

test("해시태그 본문은 단어로 다시 세지 않는다(word·tag 두 번 집계 방지)", () => {
  const r = tok("로또 당첨 후기 #로또1등도출근합니다 #맨유", ["로또"]);
  assert.deepEqual(r.words, ["로또", "당첨", "후기"]);
  assert.deepEqual(r.tags, ["로또1등도출근합니다", "맨유"]);
  // 제목 본문에도 같은 단어가 있으면 word 와 tag 로 한 번씩
  const r2 = tok("맨유 승리 #맨유");
  assert.deepEqual(r2.words, ["맨유", "승리"]);
  assert.deepEqual(r2.tags, ["맨유"]);
});

test("조사를 한 번 더 떼면 불용어가 되는 단어는 버린다(이번에는·오늘도·최고의)", () => {
  assert.deepEqual(tok("이번에는 다르다", ["이번에", "이번"]).words, ["다르다"]);
  assert.deepEqual(tok("이번에도 맨유", ["이번에", "맨유"]).words, ["맨유"]);
  assert.deepEqual(tok("오늘도 최고의 하루").words, ["하루"]);
  // 앞부분이 불용어가 아니면 그대로(근거가 없어 조사를 못 뗀 형태 포함)
  assert.deepEqual(tok("맨유는 강하다", ["맨유"]).words, ["맨유", "강하다"]);
  assert.deepEqual(tok("맨유가").words, ["맨유가"]);
});

test("normalizeTerm: NFC·소문자·앞뒤 공백", () => {
  // '한' 을 자모로 분해한 NFD 문자열도 같은 단어가 된다
  assert.equal(T.normalizeTerm("  ABC한  "), "abc한");
});

test("ALLOW_TERMS 는 용언형 끝·조사 규칙 예외(냉장고·경상도·고양이)", () => {
  assert.deepEqual(tok("냉장고 경상도 고양이", ["냉장", "경상", "고양"]).words, ["냉장고", "경상도", "고양이"]);
});

test("rules 를 안 주면 구조 규칙만(불용어는 남김)", () => {
  assert.deepEqual(T.tokenizeTitle("진짜 맛있는 김치 10월").words, ["진짜", "김치"]);
});

test("규칙 상수: SHORTS_MAX_SEC 는 breakout.ts 와 같다, 일반어 시험 목록", () => {
  const src = readFileSync(new URL("../../src/lib/breakout.ts", import.meta.url), "utf8");
  const m = src.match(/export const SHORTS_MAX_SEC = (\d+)/);
  assert.ok(m, "breakout.ts SHORTS_MAX_SEC");
  assert.equal(R.SHORTS_MAX_SEC, Number(m[1]));
  for (const w of ["역대급", "미친", "이제", "상대", "세상", "시작", "전부", "절대", "직접", "만에", "남자"]) assert.ok(R.STOP_WORDS.has(w), w);
  assert.equal(R.GENERIC_WORDS.size, 14);
});

test("isCountedRow: kind 있음·분류 칼럼 전 행·가로 롱폼 아닌 행 제외", () => {
  const LONG = { video_format: "long", duration_sec: 600 };
  assert.equal(R.isCountedRow({ kind: null, category_id: "24", outlier: 1.2, ...LONG }), true);
  assert.equal(R.isCountedRow({ kind: null, category_id: null, outlier: 0.8, ...LONG }), true);
  assert.equal(R.isCountedRow({ kind: "news", category_id: "25", outlier: 3, ...LONG }), false);
  assert.equal(R.isCountedRow({ kind: null, category_id: null, outlier: null, ...LONG }), false);
  assert.equal(R.isLegacyRow({ kind: null, category_id: null, outlier: null }), true);
  // 쇼츠·세로·라이브는 집계하지 않는다(소유자 결정 2026-10-16)
  for (const video_format of ["shorts", "vertical", "live"]) {
    assert.equal(R.isCountedRow({ kind: null, category_id: "24", outlier: 1.2, video_format, duration_sec: 900 }), false, video_format);
  }
  // 칼럼을 읽지 않은 행(둘 다 없음)은 롱폼으로 보지 않는다
  assert.equal(R.isCountedRow({ kind: null, category_id: "24", outlier: 1.2 }), false);
});

test("isLongFormRow: video_format 우선, 없으면 180초 초과만", () => {
  assert.equal(R.isLongFormRow({ video_format: "long", duration_sec: 600 }), true);
  assert.equal(R.isLongFormRow({ video_format: "vertical", duration_sec: 600 }), false);
  assert.equal(R.isLongFormRow({ video_format: "live", duration_sec: 7200 }), false);
  assert.equal(R.isLongFormRow({ video_format: "shorts", duration_sec: 40 }), false);
  // 칼럼 추가 전 수집분(video_format null): 길이로만
  assert.equal(R.isLongFormRow({ video_format: null, duration_sec: 181 }), true);
  assert.equal(R.isLongFormRow({ video_format: null, duration_sec: 180 }), false);
  assert.equal(R.isLongFormRow({ video_format: null, duration_sec: null }), false);
  // video_format 이 long 이면 길이가 짧게 적혀 있어도 롱폼(SQL coalesce 와 같은 순서)
  assert.equal(R.isLongFormRow({ video_format: "long", duration_sec: 100 }), true);
});

// ─── 가상 제목 40개 ────────────────────────────────────────────────────

test("가상 제목 40개", async (t) => {
  assert.equal(FIXTURES.length, 40);
  for (const c of FIXTURES) {
    await t.test(c.title, () => {
      const r = tok(c.title, c.bare);
      if (c.exact) assert.deepEqual(r.words, c.exact);
      for (const w of c.has ?? []) assert.ok(r.words.includes(w), `words 에 '${w}' 있어야: [${r.words}]`);
      for (const w of c.not ?? []) assert.ok(!r.words.includes(w), `words 에 '${w}' 없어야: [${r.words}]`);
      for (const w of c.tags ?? []) assert.ok(r.tags.includes(w), `tags 에 '${w}' 있어야: [${r.tags}]`);
      for (const w of c.notTags ?? []) assert.ok(!r.tags.includes(w), `tags 에 '${w}' 없어야: [${r.tags}]`);
      assert.equal(new Set(r.words).size, r.words.length, "중복 없음");
    });
  }
});

// ─── terms 집계(순수 부분) ─────────────────────────────────────────────

test("buildTermRows: 서로 다른 채널 수·영상 수·대표 영상·길이 구분·말뭉치 근거 어간화", () => {
  const row = (video_id, channel_id, title, view_count, duration_sec = 600, video_format = null) => ({
    video_id, channel_id, title, view_count, duration_sec, video_format, kind: null, category_id: "24", outlier: 1,
  });
  const rows = [
    row("v1", "c1", "맨유 승리 요약", 100),
    row("v2", "c1", "맨유가 또 이겼다", 300), // 같은 채널: 채널 수는 1 그대로
    row("v3", "c2", "맨유의 새 감독", 50),
    row("v4", "c3", "맨유 감독 인터뷰", 900),
    row("v5", "c4", "맨유 하이라이트 #맨유 #shorts", 10, 40), // 쇼츠(길이로 판정): 세지 않는다
    row("v6", "c5", "디스플레이 비교", 5, 600, "long"),
    row("v7", "c6", "맨유 세로 브이로그", 20, 600, "vertical"), // 세로: 세지 않는다
    row("v8", "c7", "맨유 경기 라이브 다시보기", 30, 7200, "live"), // 라이브: 세지 않는다
  ];
  const out = TERMS.buildTermRows(rows, ["감독"]);
  const long = Object.fromEntries(out.long.map((r) => [`${r.term_type}:${r.term}`, r]));
  assert.equal(long["word:맨유"].channel_count, 3);
  assert.equal(long["word:맨유"].video_count, 4);
  assert.deepEqual(long["word:맨유"].channel_ids, ["c1", "c2", "c3"]);
  assert.deepEqual(long["word:맨유"].sample_video_ids, ["v4", "v2", "v1"]);
  assert.equal(long["word:감독"].channel_count, 2);
  assert.ok(long["word:디스플레이"], "디스플레이 보존");
  assert.equal(out.long[0].term, "맨유", "채널 수 순 정렬");
  // 가로 롱폼 전용: 쇼츠·세로·라이브 행은 어떤 단어도 만들지 않고, shorts 는 언제나 빈 배열
  assert.equal(long["tag:맨유"], undefined);
  assert.equal(long["word:브이로그"], undefined);
  assert.equal(long["word:경기"], undefined);
  assert.deepEqual(out.shorts, []);
  assert.deepEqual(out.videosByFormat, { long: 5, excluded: 3 });
  // 같은 입력이면 같은 결과(두 번 실행해도 행 수 같음)
  assert.deepEqual(TERMS.buildTermRows(rows, ["감독"]).long, out.long);
});

test("addDays", () => {
  assert.equal(TERMS.addDays("2026-10-01", -1), "2026-09-30");
  assert.equal(TERMS.addDays("2026-10-14", -30), "2026-09-14");
});
