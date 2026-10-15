/**
 * AI 분석 API — 사용자가 명시적으로 "AI에게 이 영상이 잘 된 이유 묻기" 버튼을 클릭할 때만 호출됨
 *
 * YouTube ToS III.E.4h 회피 전략:
 * - bibl lab 자체가 derived metric을 "제공(offer)"하는 게 아니라,
 *   외부 LLM(OpenAI/Anthropic)이 사용자에게 직접 답변
 * - UI에 "외부 AI가 생성한 텍스트, bibl lab의 메트릭이나 평가가 아님" 명시
 *
 * 우선순위:
 *   1. OPENAI_API_KEY가 있으면 OpenAI 호출
 *   2. ANTHROPIC_API_KEY가 있으면 Anthropic 호출(모델 CLAUDE_MODELS.light, env CLAUDE_MODEL_LIGHT)
 *   3. 둘 다 없으면 안내 메시지 + 새 탭에서 ChatGPT 직접 열기 권유
 *
 * 보호(T0b, spec 5.3): 하루 횟수 reserveAi('analyze') · 입력 상한(제목 100자·설명 500자) · 사용자 입력은 태그 안에만.
 * 횟수 초과 429 { error:'limit', used, limit, message } / 저장소·전체 예산 503 { error:'ai_unavailable' }.
 */

import { auth, getUserPlan } from "@/lib/auth";
import { reserveAi } from "@/lib/aiLimit";
import { settleAi } from "@/lib/aiOutcome";
import { CLAUDE_MODELS } from "@/lib/claude";
import {
  buildAnalyzePrompt,
  callAnthropic,
  callOpenAiCompatible,
  cleanAnalyzeInput,
  limitFailure,
  toClaudeResult,
  type ProviderResult,
} from "@/lib/legacyAi";
import { NextRequest, NextResponse } from "next/server";

const NO_KEY_MESSAGE =
  "AI 분석을 위한 API 키가 설정되지 않았습니다. 아래 'ChatGPT에서 분석 요청' 버튼을 사용해주세요. (관리자: Vercel 환경변수에 OPENAI_API_KEY 또는 ANTHROPIC_API_KEY를 설정하면 자동 분석이 가능합니다)";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "요청 본문이 잘못되었습니다." }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // 키가 하나도 없으면 횟수를 건드리지 않고 기존 안내 — 새 탭에서 ChatGPT 사용하도록
  if (!openaiKey && !anthropicKey) {
    return NextResponse.json({ message: NO_KEY_MESSAGE }, { status: 503 });
  }

  const { system, user } = buildAnalyzePrompt(cleanAnalyzeInput(body));

  const plan = await getUserPlan(userId);
  const reservation = await reserveAi("analyze", userId, plan);
  if (!reservation.ok) {
    const f = limitFailure(reservation);
    return NextResponse.json(f.body, { status: f.status });
  }

  let result: ProviderResult = { ok: false, kind: "connection" };
  let provider: "openai" | "anthropic" = "openai";

  // 1) OpenAI 우선 사용. 연결 오류일 때만 Anthropic 으로 넘어간다(기존 동작)
  if (openaiKey) {
    result = await callOpenAiCompatible({
      url: "https://api.openai.com/v1/chat/completions",
      key: openaiKey,
      model: "gpt-4o-mini",
      system,
      user,
      maxTokens: 600,
    });
    if (!result.ok && result.kind === "connection") console.error("[ai-analyze] OpenAI fetch error:", result.detail);
  }

  // 2) Anthropic 사용
  if (anthropicKey && (!openaiKey || (!result.ok && result.kind === "connection"))) {
    provider = "anthropic";
    result = await callAnthropic({ key: anthropicKey, model: CLAUDE_MODELS.light, system, user, maxTokens: 600 });
    if (!result.ok && result.kind === "connection") console.error("[ai-analyze] Anthropic fetch error:", result.detail);
  }

  await settleAi(reservation, toClaudeResult(result));

  if (result.ok) {
    return NextResponse.json({ text: result.text, provider });
  }
  const label = provider === "openai" ? "OpenAI" : "Anthropic";
  if (result.kind === "http") {
    console.error(`[ai-analyze] ${label} error:`, result.status, result.detail);
    return NextResponse.json({ message: "AI 분석 실패: " + (result.detail || `${label} 오류`) }, { status: 500 });
  }
  if (result.kind === "connection") {
    // 연결 오류로 끝나면 예전과 같은 503 안내(ChatGPT 새 탭 백업). 예약은 위 settleAi 에서 release 됨
    return NextResponse.json({ message: NO_KEY_MESSAGE }, { status: 503 });
  }
  return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
}
