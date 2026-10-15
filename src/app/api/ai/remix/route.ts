/**
 * B5 '이 영상처럼 기획하기' 기획 초안. 근거: docs/trend-dev/spec.md 3.5·4.4·5.2 · roadmap T7
 *
 * POST { video:{ videoId, title, channelTitle, viewCount, subscriberCount, durationSec, publishedAt }, topic, audience? }
 *   200 { data, charged:true, remaining }
 *   400 { error:'invalid_video'|'invalid_topic'|'invalid_body' }       401 { error:'unauthorized' }
 *   429 { error:'limit', used, limit, remaining:0 }                       한도 초과(Free 는 limit 0)
 *   503 { error:'ai_unavailable' }                                        키 없음·한도 저장소·전체 하루 예산(차감 없음)
 *   503 { error:'ai_temporary', charged:false } / 502 { error:'generation_failed', charged:true }   호출 실패(차감은 settleAi)
 *
 * 순서와 차감 규칙은 src/lib/trend/remix-schema.ts 의 runRemix(시험: scripts/trend/remix.test.mjs).
 * plan 은 getUserPlan(userId)(auth.ts, profiles)로만 정한다. 본문 plan 필드는 읽지 않는다.
 * 성공하면 ai_generations 에 저장한다(input 에는 topic·audience·videoId 만). 요청 중에 대화상자를 닫아도 끝까지 처리한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { reserveAi } from "@/lib/aiLimit";
import { settleAi } from "@/lib/aiOutcome";
import { callClaudeJson, claudeAvailable } from "@/lib/claude";
import { getSupabase } from "@/lib/supabase";
import { REMIX_SCHEMA, REMIX_SYSTEM, runRemix, validateRemix } from "@/lib/trend/remix-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = userId ? await req.json().catch(() => null) : null;

  const { status, body: out } = await runRemix({
    userId,
    body,
    now: () => Date.now(),
    getPlan: getUserPlan,
    available: claudeAvailable,
    reserve: (uid, plan) => reserveAi("remix", uid, plan),
    call: (prompt, deadline) =>
      callClaudeJson({
        tier: "light",
        system: REMIX_SYSTEM,
        content: prompt,
        schema: REMIX_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 4000,
        validate: validateRemix,
        deadline,
        capMs: 25_000,
      }),
    settle: (reservation, result) => settleAi(reservation, result),
    save: async (row) => {
      const db = getSupabase();
      if (!db) return;
      const { error } = await db.from("ai_generations").insert({
        user_id: row.userId,
        feature: "remix",
        ref_id: row.videoId,
        input: row.input,
        output: row.output,
        model: row.model,
        usage: row.usage,
        status: "ok",
      });
      if (error) console.error("[remix] ai_generations insert error:", error.message);
    },
  });

  return NextResponse.json(out, { status, headers: NO_STORE });
}
