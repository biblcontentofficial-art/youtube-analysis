/**
 * 트렌드 서치 AI 하루 사용량. 근거: docs/trend-dev/spec.md 2.3·5.2 · roadmap T0
 *
 * GET → { remix: { used, limit }, thumbs: { used, limit }, available }
 *   available = Claude 키 있음 && 한도 저장소 사용 가능(운영에서 Redis 없으면 false).
 *   false 면 화면은 AI 버튼 자리를 <AiLockedButton /> 으로 바꾼다.
 * plan 은 서버에서 getUserPlan(userId)(auth.ts, profiles)로만 정한다. 요청 값은 쓰지 않는다.
 * 비로그인 401.
 */
import { NextResponse } from "next/server";
import { auth, getUserPlan } from "@/lib/auth";
import { aiLimitStoreAvailable, getAiUsage } from "@/lib/aiLimit";
import { claudeAvailable } from "@/lib/claude";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const plan = await getUserPlan(userId);
  const usage = await getAiUsage(userId, plan, ["remix", "thumbs"]);
  return NextResponse.json(
    {
      remix: usage.remix,
      thumbs: usage.thumbs,
      available: claudeAvailable() && aiLimitStoreAvailable(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
