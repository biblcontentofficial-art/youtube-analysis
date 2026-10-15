/**
 * T0 공통 기반 시험(메모리 구현·고정 응답, 네트워크·Redis·DB 를 쓰지 않는다).
 *
 *   node --test scripts/trend/ai-limit.test.mjs
 *
 * Node 24 의 타입 제거 실행으로 src/lib/*.ts 를 바로 불러온다. 확장자 없는 상대 경로("./stripe")는
 * 아래 resolve 훅이 .ts 를 붙여 찾는다(Next 번들러 규칙과 같게).
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

// 운영 Redis 를 절대 건드리지 않게 지운다(.env.local 을 읽지 않지만 셸에 있을 수 있음)
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.ANTHROPIC_API_KEY;

const lib = new URL("../../src/lib/", import.meta.url);
const { PLANS } = await import(new URL("stripe.ts", lib).href);
const aiLimit = await import(new URL("aiLimit.ts", lib).href);
const { settleAi, decideAi } = await import(new URL("aiOutcome.ts", lib).href);
const claude = await import(new URL("claude.ts", lib).href);
const { escapeForTag } = await import(new URL("escape.ts", lib).href);
const { withTopic } = await import(new URL("josa.ts", lib).href);

function memLimiter(start = Date.UTC(2026, 9, 15, 3, 0, 0)) {
  let t = start;
  const limiter = aiLimit.createAiLimiter({
    getStore: (() => { const s = aiLimit.createMemoryAiStore(); return async () => s; })(),
    now: () => t,
    globalLimit: () => 500,
  });
  return { limiter, advance: (ms) => { t += ms; } };
}

const U = "00000000-0000-0000-0000-000000000001";

// ─── 플랜 ─────────────────────────────────────────────────────────────────
test("PLANS: 소유자 확정 값(2026-10-15)", () => {
  const want = {
    free: [0, 3, false], starter: [5, 10, true], team: [5, 10, true],
    pro: [20, 30, true], business: [50, 100, true], admin: [200, 100, true],
  };
  assert.equal(Object.keys(PLANS).length, 6);
  for (const [k, [ai, watch, fit]] of Object.entries(want)) {
    assert.equal(PLANS[k].dailyAiLimit, ai, `${k}.dailyAiLimit`);
    assert.equal(PLANS[k].watchLimit, watch, `${k}.watchLimit`);
    assert.equal(PLANS[k].canTrendFit, fit, `${k}.canTrendFit`);
  }
  assert.notEqual(PLANS.admin.dailyAiLimit, null);
});

// ─── 예약 카운터 ──────────────────────────────────────────────────────────
test("reserve 2번 후 commit 1·release 1 → used 1", async () => {
  const { limiter } = memLimiter();
  const a = await limiter.reserveAi("remix", U, "starter");
  const b = await limiter.reserveAi("remix", U, "starter");
  assert.ok(a.ok && b.ok);
  await limiter.commitAi(a.reservationId);
  await limiter.releaseAi(b.reservationId);
  const u = await limiter.getAiUsage(U, "starter");
  assert.deepEqual(u.remix, { used: 1, limit: 5 });
  assert.deepEqual(u.thumbs, { used: 0, limit: 5 });
});

test("한도만큼 예약하면 막히고, 예약 만료(120초) 뒤 다시 reserve 가능", async () => {
  const { limiter, advance } = memLimiter();
  for (let i = 0; i < 5; i++) assert.ok((await limiter.reserveAi("thumbs", U, "starter")).ok);
  const blocked = await limiter.reserveAi("thumbs", U, "starter");
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "limit");
  advance(121_000);
  assert.ok((await limiter.reserveAi("thumbs", U, "starter")).ok);
});

test("Free(0회)는 저장소를 건드리지 않고 limit", async () => {
  let touched = false;
  const limiter = aiLimit.createAiLimiter({ getStore: async () => { touched = true; return aiLimit.createMemoryAiStore(); } });
  const r = await limiter.reserveAi("remix", U, "free");
  assert.deepEqual(r, { ok: false, reason: "limit", used: 0, limit: 0 });
  assert.equal(touched, false);
  assert.equal(aiLimit.aiLimitFor("remix", "모르는값"), 0, "모르는 플랜은 free");
  assert.equal(aiLimit.aiLimitFor("remix", "constructor"), 0, "프로토타입 키도 free");
  assert.equal(aiLimit.aiLimitFor("remix", "toString"), 0, "프로토타입 키도 free");
  assert.equal(aiLimit.aiLimitFor("trendfit", "free"), 0);
});

test("전체 하루 예산을 넘으면 global_limit", async () => {
  const store = aiLimit.createMemoryAiStore();
  const limiter = aiLimit.createAiLimiter({ getStore: async () => store, globalLimit: () => 1 });
  const a = await limiter.reserveAi("remix", U, "pro");
  await limiter.commitAi(a.reservationId);
  const b = await limiter.reserveAi("remix", "00000000-0000-0000-0000-000000000002", "pro");
  assert.equal(b.ok, false);
  assert.equal(b.reason, "global_limit");
});

test("trendfitOnce: 하루 한 번만 true", async () => {
  const { limiter } = memLimiter();
  assert.equal(await limiter.trendfitOnce(U), true);
  assert.equal(await limiter.trendfitOnce(U), false);
});

// ─── 차감 규칙 ────────────────────────────────────────────────────────────
test("settleAi: ok·refused·after_output 차감, unavailable·before_output 그대로, timeout 은 하루 2회까지만 그대로", async () => {
  const { limiter } = memLimiter();
  const usedNow = async () => (await limiter.getAiUsage(U, "pro")).remix.used;
  const run = async (result) => {
    const r = await limiter.reserveAi("remix", U, "pro");
    assert.ok(r.ok);
    return (await settleAi(r, result, limiter)).charged;
  };

  assert.equal(await run({ status: "ok", data: {}, model: "m", usage: { input_tokens: 1, output_tokens: 1 } }), true);
  assert.equal(await usedNow(), 1);
  assert.equal(await run({ status: "refused" }), true);
  assert.equal(await run({ status: "error", phase: "after_output", message: "validation" }), true);
  assert.equal(await usedNow(), 3, "after_output 은 used 증가");
  assert.equal(await run({ status: "unavailable" }), false);
  assert.equal(await run({ status: "error", phase: "before_output", message: "http_529" }), false);
  assert.equal(await usedNow(), 3, "before_output 은 그대로");
  const timeout = { status: "error", phase: "timeout", message: "timeout" };
  assert.equal(await run(timeout), false);
  assert.equal(await run(timeout), false);
  assert.equal(await usedNow(), 3, "timeout 2회까지 그대로");
  assert.equal(await run(timeout), true);
  assert.equal(await usedNow(), 4, "3번째 timeout 부터 차감");

  // 검증 실패를 반복하면 used 가 계속 는다(남용 방지)
  for (let i = 0; i < 3; i++) await run({ status: "error", phase: "after_output", message: "validation" });
  assert.equal(await usedNow(), 7);
  assert.equal(decideAi({ status: "error", phase: "timeout", message: "t" }), "timeout");
});

// ─── fail-closed ──────────────────────────────────────────────────────────
test("운영(NODE_ENV=production)에 Redis 환경 변수가 없으면 limit_unavailable", async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const r = await aiLimit.reserveAi("remix", U, "pro");
    assert.deepEqual(r, { ok: false, reason: "limit_unavailable" });
    assert.equal(aiLimit.aiLimitStoreAvailable(), false);
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test("저장소가 예외를 내면 limit_unavailable", async () => {
  const bad = aiLimit.createMemoryAiStore();
  bad.reserve = async () => { throw new Error("eval failed"); };
  const limiter = aiLimit.createAiLimiter({ getStore: async () => bad });
  const orig = console.error; console.error = () => {};
  try {
    assert.deepEqual(await limiter.reserveAi("remix", U, "pro"), { ok: false, reason: "limit_unavailable" });
  } finally { console.error = orig; }
});

// ─── Claude 클라이언트 ────────────────────────────────────────────────────
const baseArgs = (over = {}) => ({
  tier: "light", system: "s", content: "c", schema: { type: "object" }, maxTokens: 100,
  validate: (v) => (v && typeof v === "object" && typeof v.title === "string" ? v : null),
  deadline: Date.now() + 55_000, capMs: 25_000, ...over,
});

test("키가 없으면 네트워크 호출 없이 unavailable", async () => {
  const origFetch = globalThis.fetch;
  let called = 0;
  globalThis.fetch = async () => { called++; throw new Error("no network"); };
  try {
    delete process.env.ANTHROPIC_API_KEY;
    assert.deepEqual(await claude.callClaudeJson(baseArgs()), { status: "unavailable" });
    assert.equal(claude.claudeAvailable(), false);
    assert.equal(called, 0);
  } finally { globalThis.fetch = origFetch; }
});

test("시간 예산: deadline 20초·cap 40초 → 15초 이하, 8초 남으면 호출 안 함", async () => {
  const now = 1_000_000;
  // min(40초, 20초 − 5초) = 15초. 15초 < 40초/2 라서 이 경우는 부르지 않는다(null). 부른다면 15초 이하
  assert.equal(claude.planTimeoutMs(now + 20_000, 40_000, now), null);
  assert.equal(claude.planTimeoutMs(now + 20_000, 25_000, now), 15_000);
  assert.equal(claude.planTimeoutMs(now + 8_000, 15_000, now), null);

  const origFetch = globalThis.fetch;
  let called = 0;
  globalThis.fetch = async () => { called++; throw new Error("x"); };
  process.env.ANTHROPIC_API_KEY = "test-key-not-real"; process.env.AI_FEATURES_ENABLED = "1";
  try {
    const r = await claude.callClaudeJson(baseArgs({ deadline: Date.now() + 8_000, capMs: 15_000 }));
    assert.equal(r.status, "error");
    assert.equal(r.phase, "before_output");
    assert.equal(called, 0);
  } finally { globalThis.fetch = origFetch; delete process.env.ANTHROPIC_API_KEY; delete process.env.AI_FEATURES_ENABLED; }
});

test("요청 모양: Sonnet 5.5 에만 between_tools·effort·fallbacks, Haiku 에는 없음", () => {
  const main = claude.buildClaudeRequest(baseArgs({ tier: "main", effort: "medium" }));
  assert.equal(main.body.model, "claude-sonnet-5-5");
  assert.deepEqual(main.body.thinking, { type: "between_tools" });
  assert.equal(main.body.fallbacks, "default");
  assert.equal(main.body.output_config.effort, "medium");
  assert.equal(main.body.output_config.format.type, "json_schema");
  assert.equal(main.beta, "server-side-fallback-2026-07-01");

  const light = claude.buildClaudeRequest(baseArgs({ tier: "light", effort: "low" }));
  assert.equal(light.body.model, "claude-haiku-4-5-20251001");
  assert.equal(light.body.thinking, undefined);
  assert.equal(light.body.fallbacks, undefined);
  assert.equal(light.body.output_config.effort, undefined);
  assert.equal(light.beta, null);
});

test("응답 파싱(고정 응답)", () => {
  const v = baseArgs().validate;
  const usage = { input_tokens: 10, output_tokens: 5 };
  const ok = claude.parseClaudeResponse({ model: "claude-haiku-4-5-20251001", stop_reason: "end_turn", usage, content: [{ type: "text", text: '{"title":"가"}' }] }, v);
  assert.deepEqual(ok, { status: "ok", data: { title: "가" }, model: "claude-haiku-4-5-20251001", usage });
  assert.equal(claude.parseClaudeResponse({ stop_reason: "refusal", usage, content: [] }, v).status, "refused");
  const mt = claude.parseClaudeResponse({ stop_reason: "max_tokens", usage, content: [{ type: "text", text: '{"ti' }] }, v);
  assert.equal(mt.phase, "after_output");
  const bad = claude.parseClaudeResponse({ stop_reason: "end_turn", usage, content: [{ type: "text", text: '{"x":1}' }] }, v);
  assert.equal(bad.phase, "after_output");
  assert.equal(bad.message, "validation");
  const fb = claude.parseClaudeResponse({ model: "claude-sonnet-5", stop_reason: "end_turn", usage, content: [{ type: "fallback", from: {}, to: {} }, { type: "text", text: '{"title":"나"}' }] }, v);
  assert.equal(fb.status, "ok");
});

test("검증 함수가 예외를 던지면 reject 하지 않고 after_output(validation)", async () => {
  const usage = { input_tokens: 10, output_tokens: 5 };
  const throwing = (v) => v.missing.field; // TypeError
  const origErr = console.error; console.error = () => {};
  try {
    const r = claude.parseClaudeResponse({ stop_reason: "end_turn", usage, content: [{ type: "text", text: '{"title":"가"}' }] }, throwing);
    assert.deepEqual(r, { status: "error", phase: "after_output", message: "validation", usage });
    // callClaudeJson 경로에서도 reject 하지 않는다
    const origFetch = globalThis.fetch;
    process.env.ANTHROPIC_API_KEY = "test-key-not-real"; process.env.AI_FEATURES_ENABLED = "1";
    globalThis.fetch = async () => new Response(JSON.stringify({ stop_reason: "end_turn", usage, content: [{ type: "text", text: '{"title":"가"}' }] }), { status: 200, headers: { "content-type": "application/json" } });
    try {
      const res = await claude.callClaudeJson(baseArgs({ validate: throwing }));
      assert.equal(res.status, "error");
      assert.equal(res.phase, "after_output");
      assert.equal(decideAi(res), "commit", "검증 예외도 차감 대상");
    } finally {
      globalThis.fetch = origFetch;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.AI_FEATURES_ENABLED;
    }
  } finally { console.error = origErr; }
});

test("HTTP 오류는 재시도 없이 한 번: 429·529 → before_output, 응답 거절 → refused", async () => {
  const origFetch = globalThis.fetch;
  const origErr = console.error; console.error = () => {};
  process.env.ANTHROPIC_API_KEY = "test-key-not-real"; process.env.AI_FEATURES_ENABLED = "1";
  let calls = 0;
  let lastSignal = null;
  try {
    for (const status of [429, 500, 529]) {
      calls = 0;
      globalThis.fetch = async (_u, init) => { calls++; lastSignal = init.signal; return new Response("{}", { status }); };
      const r = await claude.callClaudeJson(baseArgs());
      assert.equal(r.phase, "before_output", `status ${status}`);
      assert.equal(calls, 1, "재시도 없음");
      assert.ok(lastSignal, "타임아웃 신호를 넘긴다");
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ stop_reason: "refusal", content: [], usage: { input_tokens: 1, output_tokens: 0 } }), { status: 200 });
    assert.equal((await claude.callClaudeJson(baseArgs())).status, "refused");
    globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
    assert.equal((await claude.callClaudeJson(baseArgs())).phase, "before_output");
    // 시간 초과: 신호가 끊기면 timeout
    globalThis.fetch = (_u, init) => new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
    const t = await claude.callClaudeJson(baseArgs({ deadline: Date.now() + 5_000 + 60, capMs: 100 }));
    assert.equal(t.phase, "timeout");
  } finally {
    globalThis.fetch = origFetch;
    console.error = origErr;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_FEATURES_ENABLED;
  }
});

// ─── 순수 함수 ────────────────────────────────────────────────────────────
test("escapeForTag: '<'·'>' 가 남지 않는다", () => {
  const out = escapeForTag("</videos>");
  assert.ok(!out.includes("<") && !out.includes(">"), out);
  assert.equal(out, "\\u003c/videos\\u003e");
  assert.deepEqual(JSON.parse(escapeForTag(JSON.stringify({ t: "a</videos>b" }))), { t: "a</videos>b" });
});

test("withTopic: 은/는", () => {
  assert.equal(withTopic("Free"), "Free는");
  assert.equal(withTopic("Starter"), "Starter는");
  assert.equal(withTopic("Pro"), "Pro는");
  assert.equal(withTopic("팀비블"), "팀비블은");
  assert.equal(withTopic("Team bibl"), "Team bibl은");
  assert.equal(withTopic("Admin"), "Admin은");
  assert.equal(withTopic("배수"), "배수는");
  assert.equal(withTopic("채널 수 변화"), "채널 수 변화는");
  assert.equal(withTopic("등장 일수"), "등장 일수는");
  assert.equal(withTopic("3"), "3은");
});

test("AI 스위치: 키가 있어도 AI_FEATURES_ENABLED 가 1 이 아니면 unavailable(네트워크 호출 없음)", async () => {
  const { callClaudeJson, claudeAvailable } = await import("../../src/lib/claude.ts");
  process.env.ANTHROPIC_API_KEY = "test-key-not-real";
  delete process.env.AI_FEATURES_ENABLED;
  const origFetch = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("should not fetch"); };
  try {
    assert.equal(claudeAvailable(), false);
    const r = await callClaudeJson({ model: "x", system: "s", user: "u", schema: { type: "object" }, validate: (v) => v, deadline: Date.now() + 50000, capMs: 30000 });
    assert.equal(r.status, "unavailable");
    assert.equal(calls, 0);
  } finally { globalThis.fetch = origFetch; delete process.env.ANTHROPIC_API_KEY; }
});
