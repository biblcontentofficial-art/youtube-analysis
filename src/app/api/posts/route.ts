/**
 * GET  /api/posts        — 공개 (published 만)
 * POST /api/posts        — 어드민 only (신규 작성)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";
import { slugify, normalizeCategory } from "@/lib/posts";

export async function GET(req: NextRequest) {
  const db = getSupabase();
  if (!db) return NextResponse.json({ posts: [] });

  const includeDrafts = req.nextUrl.searchParams.get("includeDrafts") === "1";

  let query = db
    .from("posts")
    .select("id, slug, title, subtitle, cover_image, description, tags, status, published_at, view_count, author_name, created_at, updated_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (includeDrafts) {
    // 어드민만 drafts 포함 가능
    const user = await currentUser();
    if (!isAdmin({ email: user?.email, plan: user?.plan })) {
      return NextResponse.json({ message: "관리자만 임시저장 글을 볼 수 있습니다." }, { status: 403 });
    }
  } else {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.limit(100);
  if (error) {
    console.error("[posts:list]", error);
    return NextResponse.json({ message: "목록을 불러올 수 없습니다." }, { status: 500 });
  }
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (!isAdmin({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자만 작성할 수 있습니다." }, { status: 403 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ message: "제목이 필요합니다." }, { status: 400 });

  const baseSlug = body.slug ? slugify(String(body.slug)) : slugify(title);

  // slug 중복 회피
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: exists } = await db.from("posts").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  const status = body.status === "published" ? "published" : "draft";
  const insert = {
    slug,
    title,
    subtitle: body.subtitle ? String(body.subtitle) : null,
    cover_image: body.cover_image ? String(body.cover_image) : null,
    content: Array.isArray(body.content) ? body.content : [],
    description: body.description ? String(body.description).slice(0, 300) : null,
    category: normalizeCategory(body.category),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 10).map(String) : [],
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    author_id: user.id,
    author_name: body.author_name ? String(body.author_name) : "비블",
  };

  const { data, error } = await db.from("posts").insert(insert).select().single();
  if (error) {
    console.error("[posts:create]", error);
    return NextResponse.json({ message: "글 작성에 실패했습니다. " + error.message }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}
