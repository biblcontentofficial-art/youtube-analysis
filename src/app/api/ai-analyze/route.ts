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
 *   2. ANTHROPIC_API_KEY가 있으면 Anthropic 호출
 *   3. 둘 다 없으면 안내 메시지 + 새 탭에서 ChatGPT 직접 열기 권유
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "요청 본문이 잘못되었습니다." }, { status: 400 });
  }

  const {
    videoTitle,
    videoViews,
    videoDescription,
    channelTitle,
    channelSubscribers,
    channelAvgViews,
    channelTotalVideos,
  } = body;

  const prompt =
    `다음 유튜브 영상이 잘 된 이유를 분석해 줘. 단순한 메트릭 평가가 아니라 콘텐츠 기획 관점에서 인사이트를 줘.\n\n` +
    `[영상]\n` +
    `제목: ${videoTitle}\n` +
    `조회수: ${(videoViews ?? 0).toLocaleString()}회\n` +
    (videoDescription ? `설명(앞부분): ${videoDescription}\n` : "") +
    `\n[채널]\n` +
    `채널명: ${channelTitle}\n` +
    `구독자: ${(channelSubscribers ?? 0).toLocaleString()}명\n` +
    `총 영상 수: ${channelTotalVideos ?? 0}개\n` +
    `채널 평균 조회수: ${(channelAvgViews ?? 0).toLocaleString()}회\n\n` +
    `다음 3가지를 짧고 명확하게 한국어로 5-8줄 안에 답해줘:\n` +
    `1) 이 영상이 채널 평균보다 잘됐다면 그 이유 (제목, 주제, 시기 등)\n` +
    `2) 벤치마킹 포인트 (다른 크리에이터가 따라하면 좋을 요소)\n` +
    `3) 비슷한 콘텐츠 기획 아이디어 1개`;

  // 1) OpenAI 우선 사용
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "당신은 유튜브 콘텐츠 기획 전문 컨설턴트입니다. 짧고 실용적인 한국어 답변을 줍니다." },
            { role: "user", content: prompt },
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[ai-analyze] OpenAI error:", data);
        return NextResponse.json({ message: "AI 분석 실패: " + (data.error?.message || "OpenAI 오류") }, { status: 500 });
      }
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
      }
      return NextResponse.json({ text, provider: "openai" });
    } catch (e) {
      console.error("[ai-analyze] OpenAI fetch error:", e);
    }
  }

  // 2) Anthropic 사용
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[ai-analyze] Anthropic error:", data);
        return NextResponse.json({ message: "AI 분석 실패: " + (data.error?.message || "Anthropic 오류") }, { status: 500 });
      }
      const text = data?.content?.[0]?.text;
      if (!text) {
        return NextResponse.json({ message: "AI 응답이 비어있습니다." }, { status: 500 });
      }
      return NextResponse.json({ text, provider: "anthropic" });
    } catch (e) {
      console.error("[ai-analyze] Anthropic fetch error:", e);
    }
  }

  // 3) 둘 다 없을 때 — 새 탭에서 ChatGPT 사용하도록 안내
  return NextResponse.json(
    {
      message:
        "AI 분석을 위한 API 키가 설정되지 않았습니다. 아래 'ChatGPT에서 분석 요청' 버튼을 사용해주세요. (관리자: Vercel 환경변수에 OPENAI_API_KEY 또는 ANTHROPIC_API_KEY를 설정하면 자동 분석이 가능합니다)",
    },
    { status: 503 }
  );
}
