/**
 * POST /api/posts/from-youtube  (어드민 전용)
 *
 * body: { url: string, transcript?: string, category?: string, provider?: "anthropic"|"openai"|"gemini" }
 *
 * 흐름:
 *  1) url → 자막 추출 (transcript 직접 전달 시 그걸 사용)
 *  2) LLM 으로 칼럼/인사이트(3000~4000자) + 메타 변환 (JSON)
 *  3) posts 테이블에 draft 저장
 *  4) { id, slug } 반환 → 클라이언트가 편집 화면으로 이동
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canEditInsights } from "@/lib/adminAuth";
import { fetchYouTubeTranscript } from "@/lib/transcript";
import {
  extractYouTubeId,
  slugify,
  normalizeCategory,
  POST_CATEGORIES,
  type PostBlock,
} from "@/lib/posts";

export const runtime = "nodejs";
export const maxDuration = 120;

type Provider = "anthropic" | "openai" | "gemini";

interface Body {
  url?: string;
  transcript?: string;
  category?: string;
  provider?: Provider;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !canEditInsights({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body: Body = await req.json().catch(() => ({}));
  const url = (body.url || "").trim();
  const videoId = extractYouTubeId(url);
  if (!videoId && !body.transcript) {
    return NextResponse.json({ message: "유효한 YouTube URL이 필요합니다." }, { status: 400 });
  }

  // ── 1) 자막 ──
  let transcript = (body.transcript || "").trim();
  let ytTitle = "";
  if (!transcript) {
    try {
      const r = await fetchYouTubeTranscript(url);
      transcript = r.text;
      ytTitle = r.title || "";
    } catch (e) {
      return NextResponse.json(
        { message: e instanceof Error ? e.message : "자막 추출 실패", needTranscript: true },
        { status: 422 }
      );
    }
  }
  if (transcript.length < 100) {
    return NextResponse.json({ message: "자막이 너무 짧습니다.", needTranscript: true }, { status: 422 });
  }

  // 영상 제목 보강 (oEmbed)
  if (!ytTitle && videoId) {
    try {
      const m = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (m.ok) ytTitle = (await m.json())?.title || "";
    } catch { /* ignore */ }
  }

  // 자막 길이 제한 (토큰 보호) — 약 16000자
  const clipped = transcript.slice(0, 16000);

  // ── 2) LLM 변환 ──
  const provider: Provider = body.provider || "anthropic";
  let generated: GeneratedPost;
  try {
    generated = await generateColumn(provider, clipped, ytTitle, normalizeCategory(body.category));
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "AI 변환 실패" },
      { status: 502 }
    );
  }

  // ── 3) draft 저장 ──
  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const baseSlug = slugify(generated.title);
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: exists } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  const insert = {
    slug,
    title: generated.title,
    subtitle: generated.subtitle || null,
    cover_image: videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null,
    content: generated.blocks,
    description: generated.description || null,
    category: normalizeCategory(generated.category || body.category),
    tags: generated.tags?.slice(0, 5) ?? [],
    status: "draft",
    author_id: user.id,
    author_name: "비블",
  };

  const { data, error } = await db.from("posts").insert(insert).select("id, slug").single();
  if (error) {
    console.error("[from-youtube] insert error:", error);
    return NextResponse.json({ message: "초안 저장 실패: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug, sourceVideoId: videoId });
}

// ─────────────────────────────────────────────────────────────────────
interface GeneratedPost {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  blocks: PostBlock[];
}

function buildPrompt(transcript: string, ytTitle: string, category: string): string {
  return (
    `아래는 한 유튜브 영상의 자막(대본) 전문입니다.\n` +
    (ytTitle ? `[영상 제목] ${ytTitle}\n` : "") +
    `[참고 카테고리] ${category} (유튜브/비즈니스/마케팅/브랜딩 중 가장 적합한 것으로 조정 가능)\n\n` +
    `=== 자막 시작 ===\n${transcript}\n=== 자막 끝 ===\n\n` +
    `이 영상의 핵심 메시지를 바탕으로, 독자가 읽을 수 있는 "비즈니스 칼럼/인사이트 아티클"로 재구성해줘.\n\n` +
    `[작성 규칙]\n` +
    `- 분량: 본문 전체 3000~4000자 (한국어 기준, 공백 포함).\n` +
    `- 말투: 단정하고 신뢰감 있는 '~합니다' 격식체. 군더더기·인사말·"영상에서는~" 같은 메타표현 금지.\n` +
    `- 구어체 자막을 그대로 옮기지 말고, 글로 읽기 좋게 재서술. 사실·주장은 영상 내용에 충실하게 유지하고 없는 사실을 지어내지 말 것.\n` +
    `- 구조: 도입(문제제기) → 본론(소제목 2~4개로 논리 전개) → 마무리(독자 행동 제안).\n` +
    `- 소제목은 heading(level 2) 블록으로, 핵심 문장은 callout 또는 quote 블록으로 적절히 활용.\n\n` +
    `[출력 형식] 반드시 아래 JSON 한 개만 출력 (코드펜스·설명 금지):\n` +
    `{\n` +
    `  "title": "후킹되는 칼럼 제목 (40자 이내)",\n` +
    `  "subtitle": "한 줄 부제 (60자 이내)",\n` +
    `  "description": "검색결과용 요약 (150자 이내)",\n` +
    `  "category": "유튜브|비즈니스|마케팅|브랜딩 중 하나",\n` +
    `  "tags": ["태그", "3~5개"],\n` +
    `  "blocks": [\n` +
    `    { "type": "paragraph", "text": "문단 내용" },\n` +
    `    { "type": "heading", "level": 2, "text": "소제목" },\n` +
    `    { "type": "callout", "emoji": "💡", "text": "핵심 강조" },\n` +
    `    { "type": "quote", "text": "인용/핵심 문장", "cite": "출처(선택)" }\n` +
    `  ]\n` +
    `}\n` +
    `blocks는 paragraph/heading/callout/quote/divider/list 타입만 사용. text 안에서 **굵게**, *기울임* 마크다운 사용 가능.`
  );
}

async function generateColumn(
  provider: Provider,
  transcript: string,
  ytTitle: string,
  category: string
): Promise<GeneratedPost> {
  const prompt = buildPrompt(transcript, ytTitle, category);
  const system =
    "당신은 유튜브·비즈니스·마케팅·브랜딩 전문 칼럼니스트입니다. 항상 유효한 JSON만 출력합니다.";

  let raw = "";
  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Claude(ANTHROPIC_API_KEY)가 서버에 설정되지 않았습니다. console.anthropic.com에서 키를 발급받아 Vercel 환경변수 ANTHROPIC_API_KEY에 등록 후 재배포하세요. (또는 ChatGPT·Gemini를 선택하세요)");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error("Claude 오류: " + (d.error?.message || res.status));
    raw = d?.content?.[0]?.text || "";
  } else if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("ChatGPT(OPENAI_API_KEY)가 서버에 설정되지 않았습니다. platform.openai.com/api-keys에서 키를 발급받아 Vercel 환경변수 OPENAI_API_KEY에 등록 후 재배포하세요.");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error("ChatGPT 오류: " + (d.error?.message || res.status));
    raw = d?.choices?.[0]?.message?.content || "";
  } else {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini(GEMINI_API_KEY)가 서버에 설정되지 않았습니다. aistudio.google.com/apikey에서 무료 키를 발급받아 Vercel 환경변수 GEMINI_API_KEY에 등록 후 재배포하세요.");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7, responseMimeType: "application/json" },
        }),
      }
    );
    const d = await res.json();
    if (!res.ok) throw new Error("Gemini 오류: " + (d.error?.message || res.status));
    raw = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  return parseGenerated(raw, category);
}

function parseGenerated(raw: string, fallbackCategory: string): GeneratedPost {
  // 코드펜스 제거 + 첫 { ~ 마지막 } 추출
  let json = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = json.indexOf("{");
  const e = json.lastIndexOf("}");
  if (s >= 0 && e > s) json = json.slice(s, e + 1);

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("AI 응답을 해석하지 못했습니다. 다시 시도해주세요.");
  }

  const blocksRaw = Array.isArray(obj.blocks) ? obj.blocks : [];
  const blocks = sanitizeBlocks(blocksRaw);
  if (blocks.length === 0) throw new Error("AI가 본문을 생성하지 못했습니다.");

  const cat = POST_CATEGORIES.includes(obj.category as never)
    ? (obj.category as string)
    : fallbackCategory;

  return {
    title: String(obj.title || "제목 없음").slice(0, 80),
    subtitle: String(obj.subtitle || "").slice(0, 120),
    description: String(obj.description || "").slice(0, 200),
    category: cat,
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 5) : [],
    blocks,
  };
}

function sanitizeBlocks(arr: unknown[]): PostBlock[] {
  const out: PostBlock[] = [];
  for (const b of arr) {
    if (!b || typeof b !== "object") continue;
    const o = b as Record<string, unknown>;
    const t = o.type;
    if (t === "paragraph" && typeof o.text === "string") out.push({ type: "paragraph", text: o.text });
    else if (t === "heading" && typeof o.text === "string") {
      const lvl = o.level === 1 || o.level === 3 ? o.level : 2;
      out.push({ type: "heading", level: lvl as 1 | 2 | 3, text: o.text });
    } else if (t === "callout" && typeof o.text === "string")
      out.push({ type: "callout", emoji: typeof o.emoji === "string" ? o.emoji : "💡", text: o.text });
    else if (t === "quote" && typeof o.text === "string")
      out.push({ type: "quote", text: o.text, cite: typeof o.cite === "string" ? o.cite : undefined });
    else if (t === "divider") out.push({ type: "divider" });
    else if (t === "list" && Array.isArray(o.items))
      out.push({ type: "list", ordered: !!o.ordered, items: o.items.map(String) });
  }
  return out;
}
