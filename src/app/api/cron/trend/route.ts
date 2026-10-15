/**
 * 트렌드 cron 단계 디스패처(설계: docs/trend-dev/spec.md 6장, 단계 실행: src/lib/trend/jobs.ts)
 *
 * GET /api/cron/trend?step=data    purge → terms → views_d1 → notify → track (최근 3일 따라잡기, 22:05 UTC)
 * GET /api/cron/trend?step=brief   brief 따라잡기(최근 3일 중 브리핑 없는 가장 최근 날짜 하나, 23:05 UTC)
 * GET /api/cron/trend?step=all     전부
 * GET /api/cron/trend?step=terms&date=YYYY-MM-DD   단계 하나, 따라잡기 대신 그 날짜만(손으로 다시 돌릴 때)
 * GET /api/cron/trend?step=views_d1&date=YYYY-MM-DD  그 게시 날짜의 다음 날 조회수를 breakout_views 로 복사(T5)
 * GET /api/cron/trend?step=track&date=YYYY-MM-DD     그날을 '실행한 날'로 보고 3일 전·7일 전 게시 영상을 다시 잰다(T5, videos.list)
 * GET /api/cron/trend?step=brief&date=YYYY-MM-DD     그날 브리핑을 만든다(T6, Claude). AI 를 부를 수 없으면 skipped(no_api_key|ai_disabled)
 * GET /api/cron/trend?step=notify&date=YYYY-MM-DD    그날 브레이크아웃에 걸린 관심 키워드·채널 알림을 notifications 에 넣는다(T9, 다시 돌려도 행이 늘지 않음)
 * &dry=1  trend_jobs·다른 테이블에 쓰지 않고 결과만 돌려준다(로컬 .env.local 은 운영 DB 를 가리키므로 로컬은 항상 dry=1)
 *         예외: T2 수용 시험으로 2026-10-14 terms 를 로컬에서 기록했다. 백필 때 그 날짜도 다시 돌린다(src/lib/trend/terms.ts 머리 주석).
 *
 * Vercel Cron 이 Authorization: Bearer <CRON_SECRET> 로 호출한다.
 * 응답 { ok, results: [{ step, date, status, ms, detail }] }. 등록 안 된 단계는 skipped(not_registered).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/authUtils";
import { jobs, STEP_NAMES, kstDate, type StepName } from "@/lib/trend/jobs";
import { termsStep } from "@/lib/trend/terms";
import { trackStep, viewsD1Step } from "@/lib/trend/track";
import { briefStep } from "@/lib/trend/briefing";
import { notifyStep } from "@/lib/trend/notify";

// 단계 등록(T2 terms · T5 views_d1·track · T6 brief · T9 notify)
jobs.registerStep("terms", termsStep);
jobs.registerStep("views_d1", viewsD1Step);
jobs.registerStep("track", trackStep);
jobs.registerStep("notify", notifyStep);
jobs.registerStep("brief", briefStep);

export const maxDuration = 60;
export const dynamic = "force-dynamic";
/**
 * Next 14 는 force-dynamic 경로에서도 supabase-js 의 fetch(GET·POST rpc 모두)를 데이터 캐시에 넣는다(로컬 .next/cache/fetch-cache 에서 확인,
 * revalidate 31536000). 그러면 trend_jobs·breakout_videos 읽기가 옛 응답을 돌려주고 replace_breakout_terms 가 실행되지 않는다.
 */
export const fetchCache = "force-no-store";
export const revalidate = 0;

/** 함수 시작 + 55초를 마감으로 각 단계에 넘긴다(maxDuration 60 보다 5초 일찍) */
const BUDGET_MS = 55_000;

const GROUPS: Record<string, StepName[]> = {
  data: ["purge", "terms", "views_d1", "notify", "track"],
  brief: ["brief"],
  all: STEP_NAMES,
};

function parseSteps(step: string | null): StepName[] | null {
  const s = step ?? "data";
  if (GROUPS[s]) return GROUPS[s];
  return (STEP_NAMES as string[]).includes(s) ? [s as StepName] : null;
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  if (!verifyBearerToken(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const steps = parseSteps(sp.get("step"));
  if (!steps) {
    return NextResponse.json({ ok: false, error: `unknown step (data|brief|all|${STEP_NAMES.join("|")})` }, { status: 400 });
  }

  const rawDate = sp.get("date");
  let date: string | undefined;
  if (rawDate) {
    const d = new Date(`${rawDate}T00:00:00Z`);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === rawDate;
    if (!valid || rawDate > kstDate(started, 0)) {
      return NextResponse.json({ ok: false, error: "date must be YYYY-MM-DD and not after today (KST)" }, { status: 400 });
    }
    date = rawDate;
  }

  const dryParam = sp.get("dry");
  const dry = dryParam === "1" || dryParam === "true";

  try {
    const results = await jobs.runSteps(steps, { date, dry, deadline: started + BUDGET_MS });
    return NextResponse.json({ ok: results.every((r) => r.status !== "failed"), dry, results });
  } catch (e) {
    console.error("[cron:trend]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
