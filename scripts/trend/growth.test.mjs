/**
 * T5 A3 성장 추적 시험(순수 규칙 + 모의 저장소, 네트워크·DB 를 쓰지 않는다).
 *
 *   node --test scripts/trend/growth.test.mjs
 *
 * Node 24 의 타입 제거 실행으로 src/lib/trend/{rules,track,growth}.ts 를 바로 불러온다.
 * track.ts 가 불러오는 src/lib/breakout.ts 는 '@/lib/…' 별칭을 쓰므로 resolve 훅에서 src/ 로 바꾼다.
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

// 운영 DB·YouTube 를 절대 건드리지 않게 지운다
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
for (const k of Object.keys(process.env)) if (k.startsWith("YOUTUBE_API_KEY")) delete process.env[k];

const R = await import(new URL("../../src/lib/trend/rules.ts", import.meta.url).href);
const T = await import(new URL("../../src/lib/trend/track.ts", import.meta.url).href);
const G = await import(new URL("../../src/lib/trend/growth.ts", import.meta.url).href);

const AT = "2026-10-15T00:00:00.000Z";
const flow = (o) => R.classifyFlow({ v1: null, v3: null, v7: null, m1: null, m3: null, m7: null, ...o });

// ─── classifyFlow ───────────────────────────────────────────────────────

test("classifyFlow: 수용 기준 다섯 가지", () => {
  assert.equal(flow({ v1: 1000, v3: 2000, v7: 3500, m1: AT, m3: AT, m7: AT }), "steady");
  assert.equal(flow({ v1: 1000, v3: 1300, v7: 1400, m1: AT, m3: AT, m7: AT }), "early");
  assert.equal(flow({ v1: 1000, m1: AT, m3: null, m7: null }), "pending");
  assert.equal(flow({ v1: 1000, v3: 1200, v7: null, m1: AT, m3: AT, m7: AT }), "gone");
  assert.equal(flow({ v1: null, m1: null, v7: 5000, m7: AT }), null);
  assert.equal(R.growthMultiplier(null, 5000), null);
});

test("classifyFlow: 경계값", () => {
  // v7 = 정확히 3×v1, v3 없음 → steady
  assert.equal(flow({ v1: 1000, v7: 3000, m1: AT, m7: AT }), "steady");
  // v7 = 3×v1 이지만 3일 값의 1.3배 미만 → steady 아님, 1.5배 이상이라 early 도 아님 → null
  assert.equal(flow({ v1: 1000, v3: 2400, v7: 3000, m1: AT, m3: AT, m7: AT }), null);
  // v7 = 정확히 1.3×v3 → steady
  assert.equal(flow({ v1: 1000, v3: 2500, v7: 3250, m1: AT, m3: AT, m7: AT }), "steady");
  // v7 = 정확히 1.5×v1 → early 아님(미만만) → null
  assert.equal(flow({ v1: 1000, v7: 1500, m1: AT, m7: AT }), null);
  assert.equal(flow({ v1: 1000, v7: 1499, m1: AT, m7: AT }), "early");
  // 3일에 비공개(v3 null, m3 있음)였다가 7일에 다시 보임 → v3 조건 없이 판단
  assert.equal(flow({ v1: 1000, v3: null, v7: 4000, m1: AT, m3: AT, m7: AT }), "steady");
  // 7일 측정 전이면 v1 이 없어도 pending(판정 순서)
  assert.equal(flow({ v1: null, m1: null, m7: null }), "pending");
  // 7일 비공개면 v1 이 없어도 gone
  assert.equal(flow({ v1: null, m1: null, v7: null, m7: AT }), "gone");
});

test("cellState · growthMultiplier", () => {
  assert.equal(R.cellState(null, null), "pending");
  assert.equal(R.cellState(null, AT), "gone");
  assert.equal(R.cellState(1234, AT), "value");
  assert.equal(R.cellState(0, AT), "value");
  assert.equal(R.growthMultiplier(1000, 4100), 4.1);
  assert.equal(R.growthMultiplier(1000, null), null);
  assert.equal(R.growthMultiplier(0, 5000), null);
  assert.equal(R.GROWTH_SHOW_MULTIPLIER, 2);
});

test("d1Cutoff: 게시일 + 2일 한국 18시(소유자 결정 느슨한 조건), 엄격은 + 1일", () => {
  assert.equal(R.D1_CUTOFF_DAYS, 2);
  assert.equal(R.d1Cutoff("2026-10-13"), "2026-10-15T09:00:00.000Z");
  assert.equal(R.d1Cutoff("2026-10-13", 1), "2026-10-14T09:00:00.000Z");
});

// ─── copyD1 ────────────────────────────────────────────────────────────

/** 모의 저장소. source = 날짜별 breakout_videos 행, views = breakout_views 행 */
function mockStore({ source = {}, views = [] } = {}) {
  const rows = views.map((v) => ({ ...v }));
  const log = { inserts: [], upserts: [] };
  const store = {
    async sourceRows(date) { return (source[date] ?? []).map((r) => ({ ...r })); },
    async measuredIds(date, offset) {
      return new Set(rows.filter((v) => v.snapshot_date === date && v.day_offset === offset).map((v) => v.video_id));
    },
    async insertIgnore(list) {
      let n = 0;
      for (const r of list) {
        if (rows.some((v) => v.video_id === r.video_id && v.day_offset === r.day_offset)) continue;
        rows.push({ ...r });
        n++;
      }
      log.inserts.push(list.length);
      return n;
    },
    async upsert(list) {
      for (const r of list) {
        const i = rows.findIndex((v) => v.video_id === r.video_id && v.day_offset === r.day_offset);
        if (i >= 0) rows[i] = { ...r }; else rows.push({ ...r });
      }
      log.upserts.push(list.length);
      return list.length;
    },
  };
  return { store, rows, log };
}

const counted = (id, at, views = 5000) => ({ video_id: id, view_count: views, collected_at: at, kind: null, category_id: "22", outlier: 1.2, video_format: "long", duration_sec: 600 });
const legacy = (id, at) => ({ video_id: id, view_count: 9000, collected_at: at, kind: null, category_id: null, outlier: null, video_format: "long", duration_sec: 600 });
const news = (id, at) => ({ video_id: id, view_count: 9000, collected_at: at, kind: "news", category_id: "25", outlier: 2, video_format: "long", duration_sec: 600 });
/** 가로 롱폼이 아닌 행(쇼츠·세로·라이브). 집계 대상이 아니라 복사·재측정하지 않는다(2026-10-16) */
const nonLong = (id, at, video_format, duration_sec = 600) => ({ ...counted(id, at), video_format, duration_sec });

test("copyD1: 기한 안 집계 대상 행만 복사, measured_at = collected_at, 다시 돌리면 0행", async () => {
  const src = {
    "2026-10-13": [
      counted("a", "2026-10-14T14:00:00Z"), // 10-14 23시 KST: 엄격이면 늦음, 느슨하면 안
      counted("b", "2026-10-13T21:00:00Z"), // 다음 날 06시 KST 정기 수집
      counted("c", "2026-10-15T10:00:00Z"), // 10-15 19시 KST: 느슨해도 늦음
      legacy("d", "2026-10-13T21:00:00Z"),
      news("e", "2026-10-13T21:00:00Z"),
      nonLong("f", "2026-10-13T21:00:00Z", "shorts", 40),
      nonLong("g", "2026-10-13T21:00:00Z", "vertical"),
      nonLong("h", "2026-10-13T21:00:00Z", "live", 7200),
    ],
  };
  const m = mockStore({ source: src });
  const tr = T.createTrack({ store: () => m.store, fetchStats: async () => { throw new Error("no fetch"); } });

  const dry = await tr.copyD1("2026-10-13", { dry: true });
  assert.equal(dry.status, "ok");
  assert.equal(dry.detail.counted, 3);
  assert.equal(dry.detail.videos, 2);
  assert.equal(dry.detail.late, 1);
  assert.equal(dry.detail.would_insert, 2);
  assert.equal(m.rows.length, 0, "dry 는 쓰지 않는다");

  const res = await tr.copyD1("2026-10-13", { dry: false });
  assert.equal(res.detail.inserted, 2);
  assert.deepEqual(m.rows.map((r) => [r.video_id, r.day_offset, r.snapshot_date, r.view_count, r.measured_at]).sort(), [
    ["a", 1, "2026-10-13", 5000, "2026-10-14T14:00:00.000Z"],
    ["b", 1, "2026-10-13", 5000, "2026-10-13T21:00:00.000Z"],
  ]);

  const again = await tr.copyD1("2026-10-13", { dry: false });
  assert.equal(again.detail.existing, 2);
  assert.equal(again.detail.inserted, 0);
});

test("copyD1: 집계 대상 0 → skipped(no_breakout_rows), 모두 늦게 수집 → skipped(late_collection)", async () => {
  const m = mockStore({
    source: {
      "2026-10-07": [legacy("x", "2026-10-08T07:00:00Z"), counted("y", "2026-10-14T13:00:00Z")],
      "2026-10-06": [legacy("z", "2026-10-08T07:00:00Z")],
    },
  });
  const tr = T.createTrack({ store: () => m.store, fetchStats: async () => null });
  assert.deepEqual(await tr.copyD1("2026-10-06", { dry: true }), { status: "skipped", detail: "no_breakout_rows" });
  const late = await tr.copyD1("2026-10-07", { dry: false });
  assert.equal(late.status, "skipped");
  assert.equal(late.detail.reason, "late_collection");
  assert.equal(late.detail.videos, 0);
  assert.equal(m.rows.length, 0);
});

// ─── trackOffsets ──────────────────────────────────────────────────────

function ids(prefix, n) {
  return Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(3, "0")}`);
}

test("trackOffsets: 두 offset 을 한 줄로 50개씩, 응답에 없는 id 는 null, 같은 날 두 번째는 호출 0회", async () => {
  const run = "2026-10-15";
  const d3 = ids("t", 120); // 2026-10-12
  const d7 = ids("s", 130); // 2026-10-08
  const m = mockStore({
    source: {
      "2026-10-12": [
        ...d3.map((id) => counted(id, "2026-10-12T21:00:00Z")),
        legacy("old", "2026-10-12T21:00:00Z"),
        // 쇼츠·세로·라이브는 다시 재지 않는다(쿼터 절약). 호출 수·대상 수가 아래 기대값 그대로여야 한다
        ...ids("x", 60).map((id, i) => nonLong(id, "2026-10-12T21:00:00Z", ["shorts", "vertical", "live"][i % 3], i % 3 === 0 ? 40 : 900)),
      ],
      "2026-10-08": d7.map((id) => counted(id, "2026-10-15T01:00:00Z")),
    },
  });
  const calls = [];
  const fetchStats = async (list) => {
    calls.push(list.length);
    const out = new Map();
    for (const id of list) if (id !== "s005") out.set(id, { view_count: 1000, like_count: 10, comment_count: 1 });
    return out;
  };
  const tr = T.createTrack({ store: () => m.store, fetchStats, now: () => Date.parse("2026-10-14T22:10:00Z") });

  const dry = await tr.trackOffsets(run, { dry: true });
  assert.equal(dry.status, "ok");
  assert.equal(dry.detail.offset3.date, "2026-10-12");
  assert.equal(dry.detail.offset7.date, "2026-10-08");
  assert.equal(dry.detail.offset3.videos, 120);
  assert.equal(dry.detail.offset7.videos, 130);
  // (120 + 130) / 50 = 5 (offset 별로 나누면 3 + 3 = 6)
  assert.equal(dry.detail.units, 5);
  assert.ok(dry.detail.units <= Math.ceil((120 + 130) / 50) && dry.detail.units <= 20);
  assert.equal(calls.length, 0, "dry 는 videos.list 를 부르지 않는다");
  assert.equal(m.rows.length, 0);

  const first = await tr.trackOffsets(run, { dry: false });
  assert.equal(first.status, "ok");
  assert.equal(first.detail.calls, 5);
  assert.deepEqual(calls, [50, 50, 50, 50, 50]);
  assert.equal(m.rows.length, 250);
  assert.equal(first.detail.missing, 1);
  const gone = m.rows.find((r) => r.video_id === "s005");
  assert.equal(gone.view_count, null);
  assert.equal(gone.day_offset, 7);
  assert.equal(gone.snapshot_date, "2026-10-08");
  assert.equal(gone.measured_at, "2026-10-14T22:10:00.000Z");
  assert.equal(m.rows.filter((r) => r.day_offset === 3).length, 120);

  calls.length = 0;
  const second = await tr.trackOffsets(run, { dry: false });
  assert.equal(second.status, "skipped");
  assert.equal(second.detail.reason, "already_measured");
  assert.equal(second.detail.calls, 0);
  assert.equal(calls.length, 0, "두 번째 실행은 videos.list 0회");
});

test("trackOffsets: 호출 상한 20회(1,000개), 대상 0 이면 skipped, 응답 없음이면 저장 뒤 실패", async () => {
  const big = ids("b", 1100);
  const m = mockStore({ source: { "2026-10-12": big.map((id) => counted(id, "2026-10-12T21:00:00Z")) } });
  const tr = T.createTrack({ store: () => m.store, fetchStats: async () => new Map() });
  const dry = await tr.trackOffsets("2026-10-15", { dry: true });
  assert.equal(dry.detail.units, 20);
  assert.equal(dry.detail.truncated, 100);

  const empty = mockStore();
  const tr0 = T.createTrack({ store: () => empty.store, fetchStats: async () => new Map() });
  const none = await tr0.trackOffsets("2026-10-15", { dry: false });
  assert.equal(none.status, "skipped");
  assert.equal(none.detail.reason, "no_breakout_rows");

  let n = 0;
  const quota = mockStore({ source: { "2026-10-08": ids("q", 120).map((id) => counted(id, "2026-10-08T21:00:00Z")) } });
  const trq = T.createTrack({
    store: () => quota.store,
    fetchStats: async (list) => (++n === 1 ? new Map(list.map((id) => [id, { view_count: 1, like_count: null, comment_count: null }])) : null),
  });
  await assert.rejects(() => trq.trackOffsets("2026-10-15", { dry: false }), /youtube_unavailable: measured 50\/120/);
  assert.equal(quota.rows.length, 50, "응답 받은 묶음까지는 저장");
});

// ─── growth.ts 조립 ────────────────────────────────────────────────────

const row = (id, v1, v3, v7) => ({
  videoId: id, title: id, channelId: "c", channelTitle: "c", thumbnail: null, durationSec: 600, publishedAt: null,
  v1, v3, v7, m1: v1 == null ? null : AT, m3: v3 == null ? null : AT, m7: v7 == null ? null : AT,
});

test("defaultGrowthDate · firstD7Date · parseGrowthQuery", () => {
  const dates = [
    { date: "2026-10-14", hasD3: false, hasD7: false },
    { date: "2026-10-12", hasD3: true, hasD7: false },
    { date: "2026-10-08", hasD3: true, hasD7: true },
    { date: "2026-10-07", hasD3: true, hasD7: true },
  ];
  assert.equal(G.defaultGrowthDate(dates), "2026-10-08");
  assert.equal(G.defaultGrowthDate(dates.slice(0, 2)), "2026-10-14");
  assert.equal(G.defaultGrowthDate([]), null);
  assert.equal(G.firstD7Date(dates, "2026-10-15"), null);
  assert.equal(G.firstD7Date([{ date: "2026-10-13", hasD3: false, hasD7: false }], "2026-10-15"), "2026-10-20");
  assert.equal(G.firstD7Date([], "2026-10-15"), "2026-10-21");
  assert.equal(G.firstD7Date([{ date: "2026-10-01", hasD3: true, hasD7: false }], "2026-10-15"), "2026-10-16");
  assert.deepEqual(G.parseGrowthQuery({ date: "x", sort: "nope" }), { date: null, sort: "growth" });
  // 가로 롱폼 전용: 예전 주소의 format 은 무시한다
  assert.deepEqual(G.parseGrowthQuery({ date: "2026-10-08", format: "shorts", sort: "v1" }), { date: "2026-10-08", sort: "v1" });
});

test("buildGrowthResult: 정렬(null 뒤로)·상위 50개·total·날짜 없으면 기본 날짜", () => {
  const rows = [
    row("a", 1000, 2000, 3500), // 3.5배
    row("b", 1000, 1300, 1400), // 1.4배
    row("c", null, null, 90000), // 배수 없음
    row("d", 2000, 5000, 20000), // 10배
    row("e", 5000, null, null), // 7일 측정 전
  ];
  const dates = [{ date: "2026-10-08", hasD3: true, hasD7: true }];
  const g = G.buildGrowthResult({ q: { date: null, sort: "growth" }, dates, rows, today: "2026-10-15" });
  assert.equal(g.state, "ok");
  assert.equal(g.date, "2026-10-08");
  assert.deepEqual(g.rows.map((r) => r.videoId), ["d", "a", "b", "c", "e"]);
  const v7 = G.buildGrowthResult({ q: { date: "2026-10-08", sort: "v7" }, dates, rows, today: "2026-10-15" });
  assert.deepEqual(v7.rows.map((r) => r.videoId), ["c", "d", "a", "b", "e"]);
  const v1 = G.buildGrowthResult({ q: { date: "2026-10-08", sort: "v1" }, dates, rows, today: "2026-10-15" });
  assert.deepEqual(v1.rows.map((r) => r.videoId), ["e", "d", "a", "b", "c"]);

  const many = Array.from({ length: 120 }, (_, i) => row(`m${String(i).padStart(3, "0")}`, 1000, 2000, 1000 + i * 100));
  const big = G.buildGrowthResult({ q: { date: "1999-01-01", sort: "growth" }, dates, rows: many, today: "2026-10-15" });
  assert.equal(big.rows.length, 50);
  assert.equal(big.total, 120);
  assert.equal(big.date, "2026-10-08", "칩 목록에 없는 날짜는 기본 날짜로");

  const empty = G.buildGrowthResult({ q: { date: null, sort: "growth" }, dates: [], rows: [], today: "2026-10-15" });
  assert.equal(empty.state, "empty");
  assert.equal(empty.firstD7, "2026-10-21");
});
