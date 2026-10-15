/**
 * AI 키워드 진단 API — 사용자가 명시 클릭 시 LLM에 키워드 컨텍스트를 전달
 *
 * ToS III.E.4h 회피 전략:
 * - bibl lab이 derived metric을 "offer"하지 않음
 * - 사용자 명시 액션 + 외부 LLM이 답변
 * - 모든 응답에 "외부 AI 생성" disclaimer 표시
 *
 * 사용자가 OpenAI(ChatGPT) / Anthropic(Claude) / Google(Gemini) / xAI(Grok) 중 선택
 *
 * 보호(T0b, spec 5.3): 하루 횟수 reserveAi('insight') · 입력 상한(query 50자·제목 10개×100자) · 사용자 입력은 태그 안에만.
 * 횟수 초과 429 { error:'limit', used, limit, message } / 저장소·전체 예산 503 { error:'ai_unavailable' }.
 * Anthropic 모델은 CLAUDE_MODELS.light(env CLAUDE_MODEL_LIGHT), 키는 기존 ANTHROPIC_API_KEY.
 */

import { auth, getUserPlan } from "@/lib/auth";
import { reserveAi } from "@/lib/aiLimit";
import { settleAi } from "@/lib/aiOutcome";
import { CLAUDE_MODELS } from "@/lib/claude";
import {
  buildInsightPrompt,
  callAnthropic,
  callGemini,
  callOpenAiCompatible,
  cleanInsightInput,
  limitFailure,
  toClaudeResult,
  type InsightProvider,
  type ProviderResult,
} from "@/lib/legacyAi";
import { NextRequest, NextResponse } from "next/server";

const PROVIDERS: Record<InsightProvider, { label: string; envKey: string; missing: string }> = {
  openai: { label: "ChatGPT", envKey: "OPENAI_API_KEY", missing: "ChatGPT (OpenAI)" },
  anthropic: { label: "Claude", envKey: "ANTHROPIC_API_KEY", missing: "Claude (Anthropic)" },
  gemini: { label: "Gemini", envKey: "GEMINI_API_KEY", missing: "Gemini (Google)" },
  grok: { label: "Grok", envKey: "GROK_API_KEY", missing: "Grok (xAI)" },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const input = cleanInsightInput(raw);
  if (!input.query) {
    return NextResponse.json({ message: "키워드가 비어있습니다." }, { status: 400 });
  }
  const provider = input.provider;
  if (!provider) {
    return NextResponse.json({ message: "지원하지 않는 provider 입니다." }, { status: 400 });
  }

  const cfg = PROVIDERS[provider];
  const key = process.env[cfg.envKey];
  if (!key) return missingKey(cfg.missing); // 키가 없으면 횟수를 건드리지 않는다

  const { system, user } = buildInsightPrompt(input);

  const plan = await getUserPlan(userId);
  const reservation = await reserveAi("insight", userId, plan);
  if (!reservation.ok) {
    const f = limitFailure(reservation);
    return NextResponse.json(f.body, { status: f.status });
  }

  let result: ProviderResult;
  if (provider === "openai") {
    result = await callOpenAiCompatible({ url: "https://api.openai.com/v1/chat/completions", key, model: "gpt-4o-mini", system, user, maxTokens: 800 });
  } else if (provider === "anthropic") {
    result = await callAnthropic({ key, model: CLAUDE_MODELS.light, system, user, maxTokens: 800 });
  } else if (provider === "gemini") {
    result = await callGemini({ key, model: "gemini-1.5-flash", system, user, maxTokens: 800 });
  } else {
    result = await callOpenAiCompatible({ url: "https://api.x.ai/v1/chat/completions", key, model: "grok-2-latest", system, user, maxTokens: 800 });
  }

  await settleAi(reservation, toClaudeResult(result));

  if (result.ok) {
    return NextResponse.json({ text: result.text, provider, providerLabel: cfg.label });
  }
  if (result.kind === "http") {
    return NextResponse.json({ message: `${cfg.label} 진단 실패: ` + (result.detail || "오류") }, { status: 500 });
  }
  if (result.kind === "connection") {
    console.error(`[keyword-insight] ${provider} error:`, result.detail);
    return NextResponse.json({ message: "AI 진단 중 오류가 발생했습니다." }, { status: 500 });
  }
  return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
}

function missingKey(label: string) {
  return NextResponse.json(
    { message: `${label} API 키가 설정되지 않았습니다. 다른 AI를 선택하거나 'ChatGPT 새 탭' 백업을 사용해주세요.` },
    { status: 503 }
  );
}
