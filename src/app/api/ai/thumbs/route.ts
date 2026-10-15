/**
 * B6 썸네일 공통점 정리. 근거: docs/trend-dev/spec.md 3.6·4.5·5.2 · roadmap T8
 *
 * POST { query, videos:[{ videoId, title, viewCount }] }   (videos 1~16개, videoId 11자 정규식, title 100자, query 50자)
 *   200 { data, videoIds, charged:true, remaining }
 *   400 { error:'invalid_query'|'invalid_videos'|'invalid_body' }     401 { error:'unauthorized' }
 *   429 { error:'limit', used, limit, remaining:0 }                    한도 초과(Free 는 limit 0)
 *   503 { error:'ai_unavailable' }                                     키 없음·한도 저장소·전체 하루 예산(차감 없음)
 *   503 { error:'ai_temporary', charged:false } / 502 { error:'generation_failed', charged:true }   호출 실패(차감은 settleAi)
 *
 * 순서와 차감 규칙은 src/lib/trend/thumbs-schema.ts 의 runThumbs(시험: scripts/trend/thumbs.test.mjs).
 * plan 은 getUserPlan(userId)(auth.ts, profiles)로만 정한다. 본문 plan 필드는 읽지 않는다.
 * 이미지는 서버가 videoId 로 만든 https://i.ytimg.com/vi/{id}/mqdefault.jpg 만 보낸다(본문의 썸네일 주소는 받지 않음).
 * 성공하면 ai_generations 에 저장한다(input 에는 query·videoId 목록만).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { reserveAi } from "@/lib/aiLimit";
import { settleAi } from "@/lib/aiOutcome";
import { callClaudeJson, claudeAvailable } from "@/lib/claude";
import { getSupabase } from "@/lib/supabase";
import { THUMBS_SCHEMA, THUMBS_SYSTEM, runThumbs, validateThumbs } from "@/lib/trend/thumbs-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  // 마감(시작 + 55초)은 요청을 받은 이 시각부터 잰다(auth·본문 읽기 시간 포함)
  const startedAt = Date.now();
  const { userId } = await auth();
  const body = userId ? await req.json().catch(() => null) : null;

  const { status, body: out } = await runThumbs({
    userId,
    body,
    now: () => Date.now(),
    startedAt,
    getPlan: getUserPlan,
    available: claudeAvailable,
    reserve: (uid, plan) => reserveAi("thumbs", uid, plan),
    call: (content, n, deadline) =>
      callClaudeJson({
        tier: "main",
        effort: "low",
        system: THUMBS_SYSTEM,
        content,
        schema: THUMBS_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 8000,
        validate: (raw) => validateThumbs(raw, n),
        deadline,
        capMs: 40_000,
      }),
    settle: (reservation, result) => settleAi(reservation, result),
    save: async (row) => {
      const db = getSupabase();
      if (!db) return;
      const { error } = await db.from("ai_generations").insert({
        user_id: row.userId,
        feature: "thumbs",
        ref_id: row.query,
        input: row.input,
        output: row.output,
        model: row.model,
        usage: row.usage,
        status: "ok",
      });
      if (error) console.error("[thumbs] ai_generations insert error:", error.message);
    },
  });

  return NextResponse.json(out, { status, headers: NO_STORE });
}
