/**
 * AI 키워드 진단 API — 사용자가 명시 클릭 시 LLM에 키워드 컨텍스트를 전달
 *
 * ToS III.E.4h 회피 전략:
 * - bibl lab이 derived metric을 "offer"하지 않음
 * - 사용자 명시 액션 + 외부 LLM이 답변
 * - 모든 응답에 "외부 AI 생성" disclaimer 표시
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

interface Body {
  query: string;
  totalResults: number;
  topVideoTitles?: string[];
  topAvgViews?: number;
  recentRatio?: number;
  bigChannelRatio?: number;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body: Body = await req.json().catch(() => ({} as Body));
  if (!body?.query) {
    return NextResponse.json({ message: "키워드가 비어있습니다." }, { status: 400 });
  }

  const topTitles = (body.topVideoTitles || []).slice(0, 10);

  const prompt =
    `유튜브 키워드 진단:\n\n` +
    `[키워드] ${body.query}\n` +
    `[검색 결과 수] 약 ${body.totalResults}개\n` +
    (body.topAvgViews ? `[상위 10개 평균 조회수] ${body.topAvgViews.toLocaleString()}회\n` : "") +
    (body.recentRatio !== undefined ? `[최근 30일 업로드 비율] ${Math.round(body.recentRatio * 100)}%\n` : "") +
    (body.bigChannelRatio !== undefined ? `[10만 구독자 이상 채널 비율] ${Math.round(body.bigChannelRatio * 100)}%\n` : "") +
    (topTitles.length > 0 ? `\n[상위 영상 제목 샘플]\n${topTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n` : "") +
    `\n위 정보를 바탕으로 다음을 한국어로 짧고 명확하게 답변해줘 (10줄 이내):\n` +
    `1) 이 키워드 시장의 현재 상태 (포화/성장/니치) — 1-2줄\n` +
    `2) 신규 진입자가 차별화할 수 있는 구체적 앵글 3가지 — 각 1줄\n` +
    `3) 추천 영상 길이/형식 (쇼츠 vs 롱폼) — 1줄\n` +
    `4) 피해야 할 흔한 실수 — 1줄`;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "당신은 유튜브 콘텐츠 기획 전문 컨설턴트입니다. 짧고 실용적인 한국어 답변을 줍니다. 절대 'YouTube 공식 메트릭'처럼 들리는 표현을 쓰지 않습니다." },
            { role: "user", content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ message: "AI 진단 실패: " + (data.error?.message || "OpenAI 오류") }, { status: 500 });
      }
      const text = data?.choices?.[0]?.message?.content;
      if (!text) return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
      return NextResponse.json({ text, provider: "openai" });
    } catch (e) {
      console.error("[keyword-insight] OpenAI error:", e);
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ message: "AI 진단 실패: " + (data.error?.message || "Anthropic 오류") }, { status: 500 });
      }
      const text = data?.content?.[0]?.text;
      if (!text) return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
      return NextResponse.json({ text, provider: "anthropic" });
    } catch (e) {
      console.error("[keyword-insight] Anthropic error:", e);
    }
  }

  return NextResponse.json(
    { message: "AI 분석을 위한 API 키가 설정되지 않았습니다. 'ChatGPT에서 분석' 버튼을 사용해주세요." },
    { status: 503 }
  );
}
