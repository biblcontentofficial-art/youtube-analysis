/**
 * POST /api/posts/from-text  (어드민 전용)
 *
 * body: { text: string, sourceLabel?: string, category?: string,
 *         provider?: "anthropic"|"openai"|"gemini", mode?: "expand"|"preserve" }
 *
 * 스레드 글 등 임의 텍스트를 붙여넣어 칼럼 draft로 변환.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";
import { slugify, normalizeCategory, POST_CATEGORIES, type PostBlock } from "@/lib/posts";

export const runtime = "nodejs";
export const maxDuration = 120;

type Provider = "anthropic" | "openai" | "gemini";

interface Body {
  text?: string;
  sourceLabel?: string;
  category?: string;
  provider?: Provider;
  mode?: "expand" | "preserve";
}

interface GeneratedPost {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  blocks: PostBlock[];
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !isAdmin({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body: Body = await req.json().catch(() => ({}));
  const text = (body.text || "").trim();
  if (text.length < 30) {
    return NextResponse.json({ message: "변환할 텍스트가 너무 짧습니다. (최소 30자)" }, { status: 400 });
  }

  const provider: Provider = body.provider || "anthropic";
  const category = normalizeCategory(body.category);
  const clipped = text.slice(0, 16000);
  const mode = body.mode === "preserve" ? "preserve" : "expand";
  const sourceLabel = body.sourceLabel || "글 원문";

  let generated: GeneratedPost;
  try {
    generated = await generateColumn(provider, clipped, sourceLabel, category, mode);
  } catch (e) {
    return NextResponse.json({ message: e instanceof Error ? e.message : "AI 변환 실패" }, { status: 502 });
  }

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
    cover_image: null,
    content: generated.blocks,
    description: generated.description || null,
    category: normalizeCategory(generated.category || category),
    tags: generated.tags?.slice(0, 5) ?? [],
    status: "draft",
    author_id: user.id,
    author_name: "비블",
  };

  const { data, error } = await db.from("posts").insert(insert).select("id, slug").single();
  if (error) {
    console.error("[from-text] insert error:", error);
    return NextResponse.json({ message: "초안 저장 실패: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug });
}

// ─────────────────────────────────────────────────────────────────────
function buildPrompt(sourceText: string, sourceLabel: string, category: string, mode: "expand" | "preserve"): string {
  const lengthRule =
    mode === "expand"
      ? `- 분량: 본문 전체 3000~4000자 (한국어 기준, 공백 포함). 원문이 짧아도 맥락을 풍부하게 확장.\n`
      : `- 분량: 원문의 길이와 톤을 최대한 유지하되 글로 읽기 좋게 다듬기. 억지로 늘리지 말 것.\n`;

  return (
    `아래는 ${sourceLabel}입니다.\n` +
    `[참고 카테고리] ${category} (유튜브/비즈니스/마케팅/브랜딩 중 가장 적합한 것으로 조정 가능)\n\n` +
    `=== 원문 시작 ===\n${sourceText}\n=== 원문 끝 ===\n\n` +
    `이 글의 핵심 메시지를 바탕으로, 독자가 읽을 수 있는 "비즈니스 칼럼/인사이트 아티클"로 재구성해줘.\n\n` +
    `[작성 규칙]\n` +
    lengthRule +
    `- 말투: 단정하고 신뢰감 있는 '~합니다' 격식체. 군더더기·인사말·"이 글에서는~" 같은 메타표현 금지.\n` +
    `- 원문의 사실·주장에 충실하게 유지하고 없는 사실을 지어내지 말 것.\n` +
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
  sourceText: string,
  sourceLabel: string,
  category: string,
  mode: "expand" | "preserve"
): Promise<GeneratedPost> {
  const prompt = buildPrompt(sourceText, sourceLabel, category, mode);
  const system =
    "당신은 유튜브·비즈니스·마케팅·브랜딩 전문 칼럼니스트입니다. 항상 유효한 JSON만 출력합니다.";

  let raw = "";
  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
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
    if (!key) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
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
    if (!key) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
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

  const blocks = sanitizeBlocks(Array.isArray(obj.blocks) ? obj.blocks : []);
  if (blocks.length === 0) throw new Error("AI가 본문을 생성하지 못했습니다.");

  const cat = POST_CATEGORIES.includes(obj.category as never) ? (obj.category as string) : fallbackCategory;

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
