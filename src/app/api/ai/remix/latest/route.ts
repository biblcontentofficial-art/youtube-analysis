/**
 * 같은 영상의 오늘 기획 초안(본인 것, 가장 최근 성공 1건). 근거: docs/trend-dev/spec.md 3.5 · roadmap T7
 *
 * GET ?videoId=  → { data: RemixResult | null, input: { topic, audience } | null }
 *   '오늘' = 횟수와 같은 UTC 날짜(한국 오전 9시부터). 대화상자를 닫았다 다시 열면 이 값을 먼저 보여 준다.
 *   401 비로그인 · 400 videoId 형식 오류. DB 가 없거나 오류면 data null(화면은 빈 입력으로 시작).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { VIDEO_ID_RE, validateRemix } from "@/lib/trend/remix-schema";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  const videoId = req.nextUrl.searchParams.get("videoId") ?? "";
  if (!VIDEO_ID_RE.test(videoId)) return NextResponse.json({ error: "invalid_video" }, { status: 400, headers: NO_STORE });

  const db = getSupabase();
  if (!db) return NextResponse.json({ data: null, input: null }, { headers: NO_STORE });

  const since = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z").toISOString();
  const { data, error } = await db
    .from("ai_generations")
    .select("output, input, created_at")
    .eq("user_id", userId)
    .eq("feature", "remix")
    .eq("ref_id", videoId)
    .eq("status", "ok")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[remix/latest] select error:", error.message);
    return NextResponse.json({ data: null, input: null }, { headers: NO_STORE });
  }
  // 저장된 값도 한 번 더 검증해 화면이 깨지지 않게 한다
  const output = data ? validateRemix(data.output) : null;
  const input = data?.input && typeof data.input === "object" ? (data.input as Record<string, unknown>) : null;
  return NextResponse.json(
    {
      data: output,
      input: output && input ? { topic: String(input.topic ?? ""), audience: String(input.audience ?? "") } : null,
    },
    { headers: NO_STORE },
  );
}
