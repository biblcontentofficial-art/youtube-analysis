/**
 * T1 cron 단계 디스패처 시험(모의 저장소, 네트워크·DB 를 쓰지 않는다).
 *
 *   node --test scripts/trend/jobs.test.mjs
 *
 * Node 24 의 타입 제거 실행으로 src/lib/trend/jobs.ts 를 바로 불러온다(ai-limit.test.mjs 와 같은 resolve 훅).
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
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

// 운영 DB 를 절대 건드리지 않게 지운다(기본 저장소는 getSupabase() 가 null 이면 오류를 던진다)
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.TREND_PURGE_BREAKOUT;

const J = await import(new URL("../../src/lib/trend/jobs.ts", import.meta.url).href);

// 2026-10-14 12:00 KST → kstToday(-1..-3) = 10-13, 10-12, 10-11
const NOW = Date.parse("2026-10-14T12:00:00+09:00");

/** 모의 저장소: eligible = 집계 대상 행이 있는 날짜, jobs = trend_jobs 행, briefed = trend_briefings 날짜 */
function mockStore({ eligible = [], jobs = [], briefed = [] } = {}) {
  const writes = [];
  const purges = [];
  const rows = jobs.map((j) => ({ ...j }));
  const store = {
    async eligibleDates(dates) { return dates.filter((d) => eligible.includes(d)); },
    async getJobs(step, dates) { return rows.filter((j) => j.step === step && dates.includes(j.job_date)); },
    async writeJob(row) {
      writes.push(row);
      const i = rows.findIndex((j) => j.step === row.step && j.job_date === row.job_date);
      if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.push({ ...row });
    },
    async briefedDates(dates) { return dates.filter((d) => briefed.includes(d)); },
    async purgeExpired(today, purgeBreakout) { purges.push({ today, purgeBreakout }); return { breakout_views: 0 }; },
  };
  return { store, writes, purges, rows };
}

function make(opts, now = () => NOW) {
  const m = mockStore(opts);
  const jobs = J.createJobs({ store: () => m.store, now });
  return { ...m, jobs };
}

const iso = (ms) => new Date(ms).toISOString();

// ─── pendingDates ─────────────────────────────────────────────────────────
test("pendingDates: 10-13 행이 있고 trend_jobs(10-13, terms) 가 없으면 포함", async () => {
  const { jobs } = make({ eligible: ["2026-10-13"] });
  assert.deepEqual(await jobs.pendingDates("terms"), ["2026-10-13"]);
});

test("pendingDates: ok 면 빠진다", async () => {
  const { jobs } = make({
    eligible: ["2026-10-13"],
    jobs: [{ job_date: "2026-10-13", step: "terms", status: "ok", started_at: iso(NOW - 3600_000), attempts: 1 }],
  });
  assert.deepEqual(await jobs.pendingDates("terms"), []);
});

test("pendingDates: running 이 3분 전이면(멈춘 기록) 다시 들어가고, 1분 전이면 빠진다", async () => {
  const stale = make({
    eligible: ["2026-10-13"],
    jobs: [{ job_date: "2026-10-13", step: "terms", status: "running", started_at: iso(NOW - 3 * 60_000), attempts: 1 }],
  });
  assert.deepEqual(await stale.jobs.pendingDates("terms"), ["2026-10-13"]);
  const fresh = make({
    eligible: ["2026-10-13"],
    jobs: [{ job_date: "2026-10-13", step: "terms", status: "running", started_at: iso(NOW - 60_000), attempts: 1 }],
  });
  assert.deepEqual(await fresh.jobs.pendingDates("terms"), []);
});

test("pendingDates: failed·skipped 는 다시 처리, 다른 단계의 ok 는 상관없음, 행 없는 날짜·범위 밖 날짜는 제외", async () => {
  const { jobs } = make({
    eligible: ["2026-10-13", "2026-10-12", "2026-10-11", "2026-10-10"],
    jobs: [
      { job_date: "2026-10-13", step: "views_d1", status: "ok", started_at: iso(NOW), attempts: 1 },
      { job_date: "2026-10-12", step: "terms", status: "failed", started_at: iso(NOW), attempts: 2 },
      { job_date: "2026-10-11", step: "terms", status: "skipped", started_at: iso(NOW), attempts: 1 },
    ],
  });
  assert.deepEqual(await jobs.pendingDates("terms"), ["2026-10-13", "2026-10-12", "2026-10-11"]);
  const none = make({ eligible: ["2026-10-10"] });
  assert.deepEqual(await none.jobs.pendingDates("terms"), []);
});

// ─── pendingBriefDate ─────────────────────────────────────────────────────
test("pendingBriefDate: 브리핑 없고 시도 3회 미만인 가장 최근 날짜 하나", async () => {
  const { jobs } = make({
    eligible: ["2026-10-13", "2026-10-12", "2026-10-11"],
    briefed: ["2026-10-13"],
    jobs: [{ job_date: "2026-10-12", step: "brief", status: "failed", started_at: iso(NOW), attempts: 3 }],
  });
  assert.equal(await jobs.pendingBriefDate(), "2026-10-11");
  const empty = make({ eligible: [] });
  assert.equal(await empty.jobs.pendingBriefDate(), null);
});

// ─── runSteps ─────────────────────────────────────────────────────────────
test("runSteps dry: 등록 안 된 단계는 skipped(not_registered), purge 는 would_run, trend_jobs 쓰기 0", async () => {
  const m = make({ eligible: ["2026-10-13"] });
  m.jobs.registerStep("purge", J.purgeStep(() => m.store, () => NOW));
  const res = await m.jobs.runSteps(["purge", "terms", "views_d1", "notify", "track"], { dry: true, deadline: NOW + 55_000 });
  assert.equal(res.length, 5);
  assert.deepEqual(res[0], { step: "purge", date: "2026-10-14", status: "skipped", ms: 0, detail: "would_run" });
  for (const r of res.slice(1)) {
    assert.equal(r.status, "skipped");
    assert.equal(r.detail, "not_registered");
  }
  assert.equal(m.writes.length, 0);
  assert.equal(m.purges.length, 0);
});

test("runSteps: 단계마다 running(attempts+1) → ok 기록, 예외는 failed 로 남기고 다음 단계 진행", async () => {
  const m = make({
    eligible: ["2026-10-13", "2026-10-12"],
    jobs: [{ job_date: "2026-10-12", step: "terms", status: "failed", started_at: iso(NOW - 86400_000), attempts: 1 }],
  });
  const seen = [];
  m.jobs.registerStep("terms", { scope: "date", run: async (d) => { seen.push(d); if (d === "2026-10-12") throw new Error("boom"); return { status: "ok", detail: { rows: 3 } }; } });
  m.jobs.registerStep("views_d1", { scope: "date", run: async () => ({ status: "skipped", detail: "no_breakout_rows" }) });
  const res = await m.jobs.runSteps(["terms", "views_d1"], { dry: false, deadline: NOW + 55_000 });
  assert.deepEqual(seen, ["2026-10-13", "2026-10-12"]);
  assert.deepEqual(res.map((r) => [r.step, r.date, r.status]), [
    ["terms", "2026-10-13", "ok"],
    ["terms", "2026-10-12", "failed"],
    ["views_d1", "2026-10-13", "skipped"],
    ["views_d1", "2026-10-12", "skipped"],
  ]);
  assert.equal(res[1].error, "boom");
  const t13 = m.writes.filter((w) => w.step === "terms" && w.job_date === "2026-10-13");
  assert.deepEqual(t13.map((w) => [w.status, w.attempts]), [["running", 1], ["ok", 1]]);
  const t12 = m.writes.filter((w) => w.step === "terms" && w.job_date === "2026-10-12");
  assert.deepEqual(t12.map((w) => [w.status, w.attempts]), [["running", 2], ["failed", 2]]);
  assert.equal(t12[1].error, "boom");
  assert.ok(t13[1].finished_at);
});

test("runSteps: 멈춘 running(3분 전)은 다시 처리하고 결과에 recovered 'stale' 을 남긴다, 정상 기록은 표시 없음", async () => {
  const m = make({
    eligible: ["2026-10-13", "2026-10-12"],
    jobs: [{ job_date: "2026-10-13", step: "terms", status: "running", started_at: iso(NOW - 3 * 60_000), attempts: 1 }],
  });
  m.jobs.registerStep("terms", { scope: "date", run: async () => ({ status: "ok" }) });
  const warn = console.warn;
  const warned = [];
  console.warn = (...a) => warned.push(a.join(" "));
  let res;
  try {
    res = await m.jobs.runSteps(["terms"], { dry: false, deadline: NOW + 55_000 });
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(res.map((r) => [r.date, r.status, r.recovered]), [
    ["2026-10-13", "ok", "stale"],
    ["2026-10-12", "ok", undefined],
  ]);
  assert.equal(m.writes.filter((w) => w.job_date === "2026-10-13")[0].attempts, 2);
  assert.ok(warned.some((x) => x.includes("stale")));
});

test("runSteps: 남은 시간이 10초 미만이면 나머지는 skipped(time_budget), attempts 는 그대로", async () => {
  let t = NOW;
  const m = make({ eligible: ["2026-10-13"] }, () => t);
  m.jobs.registerStep("terms", { scope: "date", run: async () => { t += 50_000; return { status: "ok" }; } });
  m.jobs.registerStep("views_d1", { scope: "date", run: async () => ({ status: "ok" }) });
  const res = await m.jobs.runSteps(["terms", "views_d1"], { dry: false, deadline: NOW + 55_000 });
  assert.deepEqual(res.map((r) => [r.step, r.status, r.detail]), [
    ["terms", "ok", null],
    ["views_d1", "skipped", "time_budget"],
  ]);
  const w = m.writes.find((x) => x.step === "views_d1");
  assert.equal(w.status, "skipped");
  assert.equal(w.attempts, 0);
});

test("runSteps: date 를 주면 따라잡기 대신 그 날짜만(ok 여도 다시), run_day 단계는 오늘, track 은 그날 ok 면 already_done", async () => {
  const m = make({
    eligible: ["2026-10-13"],
    jobs: [
      { job_date: "2026-10-10", step: "terms", status: "ok", started_at: iso(NOW), attempts: 1 },
      { job_date: "2026-10-14", step: "track", status: "ok", started_at: iso(NOW), attempts: 1 },
    ],
  });
  const seen = [];
  m.jobs.registerStep("terms", { scope: "date", run: async (d) => { seen.push(["terms", d]); return { status: "ok" }; } });
  m.jobs.registerStep("track", { scope: "run_day", run: async (d) => { seen.push(["track", d]); return { status: "ok" }; } });
  const manual = await m.jobs.runSteps(["terms"], { date: "2026-10-10", dry: true, deadline: NOW + 55_000 });
  assert.deepEqual(manual.map((r) => [r.date, r.status]), [["2026-10-10", "ok"]]);
  const auto = await m.jobs.runSteps(["track"], { dry: true, deadline: NOW + 55_000 });
  assert.deepEqual(auto.map((r) => [r.date, r.status, r.detail]), [["2026-10-14", "skipped", "already_done"]]);
  assert.deepEqual(seen, [["terms", "2026-10-10"]]);
});

test("runSteps: 따라잡을 날짜가 없으면 nothing_pending, 저장소 오류는 failed(pending_dates)로 남기고 계속", async () => {
  const m = make({ eligible: [] });
  m.jobs.registerStep("terms", { scope: "date", run: async () => ({ status: "ok" }) });
  const res = await m.jobs.runSteps(["terms"], { dry: false, deadline: NOW + 55_000 });
  assert.deepEqual(res, [{ step: "terms", date: null, status: "skipped", ms: 0, detail: "nothing_pending" }]);

  const broken = J.createJobs({ store: () => ({ ...m.store, eligibleDates: async () => { throw new Error("db down"); } }), now: () => NOW });
  broken.registerStep("terms", { scope: "date", run: async () => ({ status: "ok" }) });
  broken.registerStep("purge", J.purgeStep(() => m.store, () => NOW));
  const r2 = await broken.runSteps(["terms", "purge"], { dry: false, deadline: NOW + 55_000 });
  assert.equal(r2[0].status, "failed");
  assert.equal(r2[0].error, "db down");
  assert.equal(r2[1].status, "ok");
});

test("purgeStep: 기본은 breakout_videos 도 정리(소유자 결정), TREND_PURGE_BREAKOUT=0 이면 끔, 미래 날짜는 오늘로", async () => {
  const m = make({});
  const step = J.purgeStep(() => m.store, () => NOW);
  const out = await step.run("2026-10-14", { dry: false, deadline: NOW + 55_000 });
  assert.equal(out.status, "ok");
  assert.deepEqual(m.purges.at(-1), { today: "2026-10-14", purgeBreakout: true });
  process.env.TREND_PURGE_BREAKOUT = "0";
  try {
    await step.run("2026-10-20", { dry: false, deadline: NOW + 55_000 });
    assert.deepEqual(m.purges.at(-1), { today: "2026-10-14", purgeBreakout: false });
  } finally {
    delete process.env.TREND_PURGE_BREAKOUT;
  }
});

test("운영 디스패처: purge 만 등록, 나머지는 아직 없음", () => {
  assert.deepEqual([...J.jobs.registry.keys()], ["purge"]);
  assert.deepEqual(J.STEP_NAMES, ["purge", "terms", "views_d1", "notify", "track", "brief"]);
});
