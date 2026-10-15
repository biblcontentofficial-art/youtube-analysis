/**
 * T9 C7 관심 키워드·채널 알림 시험(순수 규칙 + 모의 저장소, 네트워크·DB 를 쓰지 않는다).
 *
 *   node --test scripts/trend/notify.test.mjs
 *
 * Node 24 의 타입 제거 실행으로 src/lib/trend/{notify-match,notify}.ts 를 바로 불러온다.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const SRC = new URL("../../src/", import.meta.url);

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const url = new URL(specifier.slice(2) + ".ts", SRC);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const url = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  },
});

// 운영 DB 를 절대 건드리지 않게 지운다
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const M = await import(new URL("../../src/lib/trend/notify-match.ts", import.meta.url).href);
const N = await import(new URL("../../src/lib/trend/notify.ts", import.meta.url).href);

const sets = (keywords = [], channels = []) => ({ keywords: new Set(keywords), channels: new Set(channels) });
const video = (over = {}) => ({
  video_id: "v1",
  title: "맨유 1차전 하이라이트",
  channel_id: "UCaaaaaaaaaaaaaaaaaaaaaa",
  channel_title: "축구 채널",
  thumbnail: null,
  view_count: 1000,
  kind: null,
  category_id: "17",
  outlier: 2.5,
  ratio: 0.5,
  ...over,
});

test("normalizeWatch: 소문자·공백 제거, 2~30자", () => {
  assert.equal(M.normalizeWatch("맨 유"), "맨유");
  assert.equal(M.normalizeWatch("  LG  전자 "), "lg전자");
  assert.equal(M.normalizeWatch("가"), null);
  assert.equal(M.normalizeWatch("   "), null);
  assert.equal(M.normalizeWatch("가".repeat(30)), "가".repeat(30));
  assert.equal(M.normalizeWatch("가".repeat(31)), null);
  assert.equal(M.displayWatch("  맨   유 "), "맨 유");
});

test("matchVideo: 제목 '맨유 1차전' + outlier 2.5 → keyword 매치", () => {
  const term = M.normalizeWatch("맨 유");
  assert.deepEqual(M.matchVideo(video({ title: "맨유 1차전" }), sets([term])), [{ kind: "keyword", term: "맨유" }]);
  // 제목 속 공백도 지우고 비교한다
  assert.deepEqual(M.matchVideo(video({ title: "맨 유 1차전" }), sets(["맨유"])), [{ kind: "keyword", term: "맨유" }]);
});

test("matchVideo: ratio ≥ 1 이면 outlier 가 낮아도 매치", () => {
  assert.deepEqual(M.matchVideo(video({ outlier: 1.2, ratio: 1 }), sets(["맨유"])), [{ kind: "keyword", term: "맨유" }]);
});

test("matchVideo: outlier 1.2 && ratio 0.5 → 매치 없음", () => {
  assert.deepEqual(M.matchVideo(video({ outlier: 1.2, ratio: 0.5 }), sets(["맨유"])), []);
});

test("matchVideo: kind='news' 영상은 키워드 매치 없음, 채널 매치는 있음", () => {
  const v = video({ kind: "news" });
  assert.deepEqual(M.matchVideo(v, sets(["맨유"])), []);
  assert.deepEqual(M.matchVideo(v, sets(["맨유"], [v.channel_id])), [{ kind: "channel" }]);
});

test("matchVideo: kind·category_id·outlier 모두 null(분류 칼럼 전 수집 행)은 키워드·채널 모두 매치 없음", () => {
  const v = video({ kind: null, category_id: null, outlier: null, ratio: 5 });
  assert.deepEqual(M.matchVideo(v, sets(["맨유"])), []);
  assert.deepEqual(M.matchVideo(v, sets(["맨유"], [v.channel_id])), []);
});

test("matchVideo: 채널은 kind·배수와 상관없이 channel_id 일치", () => {
  const v = video({ outlier: 0.1, ratio: 0.01, title: "다른 이야기" });
  assert.deepEqual(M.matchVideo(v, sets([], [v.channel_id])), [{ kind: "channel" }]);
  assert.deepEqual(M.matchVideo(v, sets([], ["UCbbbbbbbbbbbbbbbbbbbbbb"])), []);
});

test("matchVideo: 2글자 이하 영문은 토큰이 같을 때만(다른 단어 속 'lg' 는 안 걸림)", () => {
  assert.deepEqual(M.matchVideo(video({ title: "LG 신형 냉장고 리뷰" }), sets(["lg"])), [{ kind: "keyword", term: "lg" }]);
  assert.deepEqual(M.matchVideo(video({ title: "#lg 신제품" }), sets(["lg"])), [{ kind: "keyword", term: "lg" }]);
  assert.deepEqual(M.matchVideo(video({ title: "Algorithm 이야기" }), sets(["lg"])), []);
  assert.deepEqual(M.matchVideo(video({ title: "LG전자 신제품" }), sets(["lg"])), []);
  // 3글자 이상은 포함 검사
  assert.deepEqual(M.matchVideo(video({ title: "LG전자 신제품" }), sets(["lg전자"])), [{ kind: "keyword", term: "lg전자" }]);
});

test("matchVideo: 키워드 여럿이면 정렬 순, 채널은 맨 뒤", () => {
  const v = video({ title: "맨유 리버풀 1차전" });
  assert.deepEqual(M.matchVideo(v, sets(["리버풀", "맨유"], [v.channel_id])), [
    { kind: "keyword", term: "리버풀" },
    { kind: "keyword", term: "맨유" },
    { kind: "channel" },
  ]);
});

test("withTopic·watchLimitMessage: 받침에 맞는 조사", () => {
  assert.equal(M.watchLimitMessage("Free", 3), "Free는 3개까지 등록할 수 있어요.");
  assert.equal(M.withTopic("팀비블"), "팀비블은");
  assert.equal(M.withTopic("Starter"), "Starter는");
  assert.equal(M.withTopic("Pro"), "Pro는");
  assert.equal(M.withTopic("Team bibl"), "Team bibl은");
  assert.equal(M.withTopic("Admin"), "Admin은");
});

test("CHANNEL_ID_RE: UC + 22자만", () => {
  assert.ok(M.CHANNEL_ID_RE.test("UC_x5XG1OV2P6uZZ5FSM9Ttw"));
  assert.ok(!M.CHANNEL_ID_RE.test("UC123"));
  assert.ok(!M.CHANNEL_ID_RE.test("fx-c01"));
});

/** notifications unique (user_id, video_id, kind) 를 흉내 내는 모의 저장소 */
function mockStore({ videos, keywords, channels }) {
  const table = new Map();
  return {
    table,
    store: {
      async videos() { return videos; },
      async keywords() { return keywords; },
      async channels() { return channels; },
      async insertIgnore(rows) {
        let n = 0;
        for (const r of rows) {
          const key = `${r.user_id}|${r.video_id}|${r.kind}`;
          if (table.has(key)) continue;
          table.set(key, r);
          n++;
        }
        return n;
      },
    },
  };
}

const CH = "UCaaaaaaaaaaaaaaaaaaaaaa";
const fixture = () => ({
  videos: [
    video({ video_id: "v1", title: "맨유 1차전", outlier: 2.5 }),
    video({ video_id: "v2", title: "맨유 리버풀 경기", outlier: 1.1, ratio: 0.2 }), // 기준 미달(키워드), 채널은 걸림
    video({ video_id: "v3", title: "뉴스 속 맨유", kind: "news", channel_id: "UCnnnnnnnnnnnnnnnnnnnnnn" }),
    video({ video_id: "v4", title: "맨유 옛 수집", kind: null, category_id: null, outlier: null, ratio: 9 }),
  ],
  keywords: [
    { user_id: "u1", term: "맨 유", term_norm: "맨유" },
    { user_id: "u2", term: "맨유", term_norm: "맨유" },
    { user_id: "u2", term: "리버풀", term_norm: "리버풀" },
  ],
  channels: [{ user_id: "u1", channel_id: CH }],
});

test("buildNotifications: 사용자·영상·종류마다 한 줄, 원래 표기로 term", () => {
  const f = fixture();
  const rows = N.buildNotifications("2026-10-14", f.videos, f.keywords, f.channels);
  const brief = rows.map((r) => `${r.user_id}:${r.video_id}:${r.kind}:${r.term ?? ""}`);
  assert.deepEqual(brief, [
    "u1:v1:channel:",
    "u1:v1:keyword:맨 유",
    "u1:v2:channel:",
    "u2:v1:keyword:맨유",
  ]);
  assert.ok(rows.every((r) => r.snapshot_date === "2026-10-14"));
});

test("runNotify: 같은 날짜를 두 번 돌려도 행이 늘지 않는다(unique 제약)", async () => {
  const m = mockStore(fixture());
  const n = N.createNotify({ store: () => m.store, now: () => 0 });
  const a = await n.runNotify("2026-10-14", { dry: false });
  assert.equal(a.status, "ok");
  assert.equal(a.detail.inserted, 4);
  assert.equal(a.detail.users, 2);
  assert.equal(a.detail.watchers, 2);
  const size = m.table.size;
  const b = await n.runNotify("2026-10-14", { dry: false });
  assert.equal(b.detail.inserted, 0);
  assert.equal(b.detail.matched, 4);
  assert.equal(m.table.size, size);
});

test("runNotify: dry 면 쓰지 않고 would_insert 만", async () => {
  const m = mockStore(fixture());
  const n = N.createNotify({ store: () => m.store, now: () => 0 });
  const r = await n.runNotify("2026-10-14", { dry: true });
  assert.equal(r.detail.would_insert, 4);
  assert.equal(m.table.size, 0);
});

test("runNotify: 집계 대상 행이 없으면 skipped(no_breakout_rows)", async () => {
  const m = mockStore({ ...fixture(), videos: [video({ kind: null, category_id: null, outlier: null })] });
  const n = N.createNotify({ store: () => m.store, now: () => 0 });
  const r = await n.runNotify("2026-10-07", { dry: false });
  assert.deepEqual(r, { status: "skipped", detail: "no_breakout_rows" });
});

test("runNotify: 500개씩 나눠 넣는다", async () => {
  const videos = Array.from({ length: 1200 }, (_, i) => video({ video_id: `v${String(i).padStart(4, "0")}`, title: "맨유 경기" }));
  const m = mockStore({ videos, keywords: [{ user_id: "u1", term: "맨유", term_norm: "맨유" }], channels: [] });
  const calls = [];
  const insert = m.store.insertIgnore;
  m.store.insertIgnore = async (rows) => { calls.push(rows.length); return insert(rows); };
  const r = await N.createNotify({ store: () => m.store, now: () => 0 }).runNotify("2026-10-14", { dry: false });
  assert.deepEqual(calls, [500, 500, 200]);
  assert.equal(r.detail.inserted, 1200);
});
