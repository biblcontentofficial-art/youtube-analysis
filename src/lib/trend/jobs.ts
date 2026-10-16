/**
 * 트렌드 cron 단계 디스패처(서버 전용). 경로는 /api/cron/trend, 설계는 docs/trend-dev/spec.md 6장.
 *
 * - 단계(StepName)는 registerStep 으로 등록한다. 등록 안 된 단계는 실행하지 않고 skipped(not_registered).
 * - scope 'date'   : 처리 대상 = snapshot_date. date 를 안 주면 최근 3일(kstToday(-1..-3)) 중
 *                    breakout_videos 집계 대상 행이 있고 trend_jobs 에 ok 가 없는 날짜를 모두 돈다(따라잡기).
 *                    brief 만 예외: trend_briefings 가 없고 attempts < 3 인 가장 최근 날짜 하나.
 * - scope 'run_day': 처리 대상 = 실행한 날(kstToday(0)). purge 는 always 라 매번 돈다.
 * - 단계마다 trend_jobs(job_date, step) 에 running(attempts+1) → ok|skipped|failed 를 남긴다.
 *   단계끼리는 메모리로 결과를 넘기지 않는다(뒤 단계는 DB 를 다시 읽는다). 예외는 잡고 다음 단계로 간다.
 * - 마감(deadline)까지 10초 미만이면 남은 단계는 skipped(time_budget). 다음 실행 때 따라잡는다.
 * - dry 이면 trend_jobs 에 쓰지 않는다. 등록된 단계에도 dry 를 넘겨 DB 쓰기·외부 호출을 하지 않게 한다.
 *
 * 시험: scripts/trend/jobs.test.mjs(createJobs 에 모의 저장소를 넣는다). Node 타입 제거 실행으로 바로 불러오므로
 * 이 파일은 상대 경로 import 와 지울 수 있는 타입 문법만 쓴다.
 */
import { getSupabase } from "../supabase";
import { SHORTS_MAX_SEC } from "./rules";

export type StepName = "purge" | "terms" | "views_d1" | "track" | "notify" | "brief";
export const STEP_NAMES: StepName[] = ["purge", "terms", "views_d1", "notify", "track", "brief"];

export type StepScope = "date" | "run_day";
export type StepDetail = string | Record<string, unknown> | null;
export type StepContext = { dry: boolean; deadline: number };
export type StepOutcome = { status: "ok" | "skipped"; detail?: StepDetail };
export type StepDef = {
  scope: StepScope;
  /** run_day 단계 중 그날 이미 ok 여도 매번 도는 단계(purge) */
  always?: boolean;
  run: (date: string, ctx: StepContext) => Promise<StepOutcome>;
};

export type JobStatus = "running" | "ok" | "skipped" | "failed";
export type StepResult = {
  step: StepName;
  date: string | null;
  status: JobStatus;
  ms: number;
  detail: StepDetail;
  error?: string;
  /** 직전 기록이 멈춘 running(2분 초과)이었으면 'stale'. spec 6.1: 멈춘 기록은 failed(stale)로 보고 다시 처리한다 */
  recovered?: "stale";
};

export type JobRow = { job_date: string; step: string; status: JobStatus; started_at: string; attempts: number };
export type JobWrite = {
  job_date: string;
  step: string;
  status: JobStatus;
  started_at: string;
  finished_at: string | null;
  attempts: number;
  detail: StepDetail;
  error: string | null;
};

/** DB 접근(시험에서는 모의 객체로 바꾼다) */
export interface JobStore {
  /** 주어진 날짜 중 breakout_videos 집계 대상 행이 하나라도 있는 날짜 */
  eligibleDates(dates: string[]): Promise<string[]>;
  getJobs(step: string, dates: string[]): Promise<JobRow[]>;
  writeJob(row: JobWrite): Promise<void>;
  /** 주어진 날짜 중 trend_briefings 행이 있는 날짜 */
  briefedDates(dates: string[]): Promise<string[]>;
  purgeExpired(today: string, purgeBreakout: boolean): Promise<unknown>;
}

/** 남은 시간이 이보다 적으면 다음 단계를 시작하지 않는다 */
export const MIN_REMAINING_MS = 10_000;
/** running 인 채 이보다 오래된 기록은 함수가 강제 종료된 것으로 본다 */
export const STALE_RUNNING_MS = 2 * 60_000;
/** 따라잡기 범위(kstToday(-1) ~ kstToday(-CATCHUP_DAYS)) */
export const CATCHUP_DAYS = 3;
/** brief 는 같은 날짜를 이 횟수까지만 시도한다 */
export const BRIEF_MAX_ATTEMPTS = 3;

/** now(ms) 기준 한국 시간 날짜 'YYYY-MM-DD'(offsetDays 만큼 이동). src/lib/kst.ts kstToday 와 같은 계산 */
export function kstDate(nowMs: number, offsetDays = 0): string {
  return new Date(nowMs + 9 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
}

/** 이 기록이 다시 처리할 대상인가: 없음·failed·skipped·멈춘 running 은 대상, ok 와 진행 중 running 은 아님 */
export function isDue(job: JobRow | undefined, nowMs: number): boolean {
  if (!job) return true;
  if (job.status === "ok") return false;
  if (job.status === "running") return isStaleRunning(job, nowMs);
  return true;
}

/** running 인 채 2분 넘게 지난 기록(함수가 강제 종료된 것으로 본다) */
export function isStaleRunning(job: JobRow | undefined, nowMs: number): boolean {
  return job?.status === "running" && nowMs - new Date(job.started_at).getTime() > STALE_RUNNING_MS;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function createJobs({ store, now = () => Date.now() }: { store: () => JobStore; now?: () => number }) {
  const registry = new Map<StepName, StepDef>();

  function registerStep(name: StepName, def: StepDef) {
    registry.set(name, def);
  }

  function recentDates(days: number): string[] {
    const t = now();
    return Array.from({ length: days }, (_, i) => kstDate(t, -(i + 1)));
  }

  /** 따라잡기 대상 날짜(최근 날짜 먼저). 집계 대상 행이 있고 trend_jobs 에 ok 가 없는 날짜 */
  async function pendingDates(step: StepName, days = CATCHUP_DAYS): Promise<string[]> {
    const s = store();
    const eligible = await s.eligibleDates(recentDates(days));
    if (!eligible.length) return [];
    const jobs = await s.getJobs(step, eligible);
    const t = now();
    return eligible.filter((d) => isDue(jobs.find((j) => j.job_date === d), t)).sort().reverse();
  }

  /** brief 따라잡기: 최근 날짜 중 집계 대상 행이 있고 브리핑이 없으며 시도가 3회 미만인 가장 최근 날짜 하나 */
  async function pendingBriefDate(days = CATCHUP_DAYS): Promise<string | null> {
    const s = store();
    const eligible = (await s.eligibleDates(recentDates(days))).sort().reverse();
    if (!eligible.length) return null;
    const [done, jobs] = await Promise.all([s.briefedDates(eligible), s.getJobs("brief", eligible)]);
    const t = now();
    for (const d of eligible) {
      if (done.includes(d)) continue;
      const job = jobs.find((j) => j.job_date === d);
      if (job && job.attempts >= BRIEF_MAX_ATTEMPTS) continue;
      if (!isDue(job, t)) continue;
      return d;
    }
    return null;
  }

  /** trend_jobs 쓰기. 실패해도 단계 실행은 막지 않는다(로그만) */
  async function write(row: JobWrite, dry: boolean) {
    if (dry) return;
    try {
      await store().writeJob(row);
    } catch (e) {
      console.error(`[trend/jobs] trend_jobs write ${row.step} ${row.job_date}:`, errMsg(e));
    }
  }

  async function prevJob(step: StepName, date: string): Promise<JobRow | undefined> {
    try {
      return (await store().getJobs(step, [date])).find((j) => j.job_date === date);
    } catch (e) {
      console.error(`[trend/jobs] trend_jobs read ${step} ${date}:`, errMsg(e));
      return undefined;
    }
  }

  async function runOne(name: StepName, def: StepDef, date: string, ctx: StepContext, prev: JobRow | undefined): Promise<StepResult> {
    const startMs = now();
    const startedAt = new Date(startMs).toISOString();
    const attempts = (prev?.attempts ?? 0) + 1;
    const base = { job_date: date, step: name, started_at: startedAt, attempts };
    // 멈춘 running 을 이어받는 경우: 덮어쓰기 전에 그 사실을 로그와 결과(recovered)에 남긴다
    const stale = isStaleRunning(prev, startMs);
    if (stale) console.warn(`[trend/jobs] ${name} ${date}: stale running (started ${prev?.started_at}), retrying`);
    const mark = stale ? { recovered: "stale" as const } : {};
    await write({ ...base, status: "running", finished_at: null, detail: null, error: null }, ctx.dry);
    try {
      const out = await def.run(date, ctx);
      const detail = out.detail ?? null;
      const ms = now() - startMs;
      await write({ ...base, status: out.status, finished_at: new Date(now()).toISOString(), detail, error: null }, ctx.dry);
      return { step: name, date, status: out.status, ms, detail, ...mark };
    } catch (e) {
      const ms = now() - startMs;
      const error = errMsg(e);
      console.error(`[trend/jobs] ${name} ${date} failed:`, error);
      await write({ ...base, status: "failed", finished_at: new Date(now()).toISOString(), detail: null, error }, ctx.dry);
      return { step: name, date, status: "failed", ms, detail: null, error, ...mark };
    }
  }

  /**
   * 단계들을 순서대로 실행한다. date 를 주면 따라잡기 대신 그 날짜만(run_day 단계도 그 날짜를 실행한 날로 본다).
   * 반환은 (단계, 날짜)마다 한 줄.
   */
  async function runSteps(names: StepName[], opts: { date?: string; dry: boolean; deadline: number }): Promise<StepResult[]> {
    const ctx: StepContext = { dry: opts.dry, deadline: opts.deadline };
    const results: StepResult[] = [];
    let outOfTime = false;

    const budgetLeft = () => opts.deadline - now() >= MIN_REMAINING_MS;

    const timeBudgetSkip = async (name: StepName, date: string | null, prev: JobRow | undefined) => {
      results.push({ step: name, date, status: "skipped", ms: 0, detail: "time_budget" });
      if (!date) return;
      // 실행하지 않았으므로 attempts 는 올리지 않는다. 진행 중인 다른 실행의 running 은 덮지 않는다.
      if (prev && !isDue(prev, now())) return;
      const at = new Date(now()).toISOString();
      await write({ job_date: date, step: name, status: "skipped", started_at: at, finished_at: at, attempts: prev?.attempts ?? 0, detail: "time_budget", error: null }, opts.dry);
    };

    for (const name of names) {
      const def = registry.get(name);
      if (!def) {
        results.push({ step: name, date: opts.date ?? null, status: "skipped", ms: 0, detail: "not_registered" });
        continue;
      }

      // 이 단계가 처리할 날짜 목록
      let dates: string[];
      try {
        if (opts.date) dates = [opts.date];
        else if (def.scope === "run_day") dates = [kstDate(now(), 0)];
        else if (name === "brief") {
          const d = await pendingBriefDate();
          dates = d ? [d] : [];
        } else dates = await pendingDates(name);
      } catch (e) {
        const error = errMsg(e);
        console.error(`[trend/jobs] ${name} pending dates failed:`, error);
        results.push({ step: name, date: opts.date ?? null, status: "failed", ms: 0, detail: "pending_dates", error });
        continue;
      }

      if (!dates.length) {
        results.push({ step: name, date: null, status: "skipped", ms: 0, detail: "nothing_pending" });
        continue;
      }

      for (const date of dates) {
        const prev = await prevJob(name, date);
        if (outOfTime || !budgetLeft()) {
          outOfTime = true;
          await timeBudgetSkip(name, date, prev);
          continue;
        }
        // run_day 단계(track 등)는 그날 이미 끝났으면 다시 돌지 않는다. date 를 손으로 주면 다시 돈다.
        if (!opts.date && def.scope === "run_day" && !def.always && !isDue(prev, now())) {
          results.push({ step: name, date, status: "skipped", ms: 0, detail: "already_done" });
          continue;
        }
        results.push(await runOne(name, def, date, ctx, prev));
      }
    }
    return results;
  }

  return { registerStep, pendingDates, pendingBriefDate, runSteps, registry };
}

// ─── 운영 저장소(Supabase service role) ─────────────────────────────────────

function requireDb() {
  const db = getSupabase();
  if (!db) throw new Error("supabase_unavailable");
  return db;
}

export const supabaseJobStore: JobStore = {
  async eligibleDates(dates) {
    const db = requireDb();
    // 집계 대상 행: kind is null 이고, 분류 칼럼이 생기기 전 수집 행(category_id·outlier 모두 null)이 아니고(trend_dev.sql 머리 주석),
    // 가로 롱폼인 행(rules.ts isLongFormRow 와 같은 조건, 소유자 결정 2026-10-16). or() 두 번은 AND 로 묶인다
    const found = await Promise.all(
      dates.map(async (d) => {
        const { data, error } = await db
          .from("breakout_videos")
          .select("video_id")
          .eq("snapshot_date", d)
          .is("kind", null)
          .or("category_id.not.is.null,outlier.not.is.null")
          .or(`video_format.eq.long,and(video_format.is.null,duration_sec.gt.${SHORTS_MAX_SEC})`)
          .limit(1);
        if (error) throw new Error(`breakout_videos: ${error.message}`);
        return (data?.length ?? 0) > 0 ? d : null;
      }),
    );
    return found.filter((d): d is string => d !== null);
  },

  async getJobs(step, dates) {
    if (!dates.length) return [];
    const { data, error } = await requireDb()
      .from("trend_jobs")
      .select("job_date,step,status,started_at,attempts")
      .eq("step", step)
      .in("job_date", dates);
    if (error) throw new Error(`trend_jobs: ${error.message}`);
    return (data ?? []) as JobRow[];
  },

  async writeJob(row) {
    const { error } = await requireDb().from("trend_jobs").upsert(row, { onConflict: "job_date,step" });
    if (error) throw new Error(`trend_jobs upsert: ${error.message}`);
  },

  async briefedDates(dates) {
    if (!dates.length) return [];
    const { data, error } = await requireDb().from("trend_briefings").select("snapshot_date").in("snapshot_date", dates);
    if (error) throw new Error(`trend_briefings: ${error.message}`);
    return (data ?? []).map((r: { snapshot_date: string }) => r.snapshot_date);
  },

  async purgeExpired(today, purgeBreakout) {
    const { data, error } = await requireDb().rpc("trend_purge_expired", { p_today: today, p_purge_breakout: purgeBreakout });
    if (error) throw new Error(`trend_purge_expired: ${error.message}`);
    return data;
  },
};

// ─── 단계 정의 ────────────────────────────────────────────────────────────

/**
 * purge(보관 기한 정리, spec 6.2): 입력 유무와 상관없이 매일. RPC trend_purge_expired 한 번.
 * breakout_videos 30일 정리는 소유자 결정(2026-10-15)으로 기본 켬. TREND_PURGE_BREAKOUT=0 일 때만 끈다.
 * date 를 손으로 주더라도 오늘보다 뒤 날짜로는 지우지 않는다(지우는 범위가 늘어나지 않게).
 */
export function purgeStep(store: () => JobStore, now: () => number = () => Date.now()): StepDef {
  return {
    scope: "run_day",
    always: true,
    async run(date, { dry }) {
      const today = kstDate(now(), 0);
      const pToday = date > today ? today : date;
      const purgeBreakout = process.env.TREND_PURGE_BREAKOUT !== "0";
      if (dry) return { status: "skipped", detail: "would_run" };
      const deleted = await store().purgeExpired(pToday, purgeBreakout);
      return { status: "ok", detail: { p_today: pToday, purge_breakout: purgeBreakout, deleted } };
    },
  };
}

/** 운영 디스패처. 뒤 항목(T2 terms·T5 views_d1/track·T9 notify·T6 brief)이 jobs.registerStep 으로 단계를 더한다. */
export const jobs = createJobs({ store: () => supabaseJobStore });
jobs.registerStep("purge", purgeStep(() => supabaseJobStore));
