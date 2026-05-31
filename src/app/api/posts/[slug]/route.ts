/**
 * GET    /api/posts/[slug]   — 공개 조회 + view_count++ (published만)
 * PATCH  /api/posts/[slug]   — 어드민 수정
 * DELETE /api/posts/[slug]   — 어드민 삭제
 *
 * slug 이지만 id(uuid)로도 조회 가능 (어드민 에디터 편의)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";
import { slugify, normalizeCategory } from "@/lib/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findPost(slugOrId: string) {
  const db = getSupabase();
  if (!db) return { db: null, post: null };
  if (UUID_RE.test(slugOrId)) {
    const { data } = await db.from("posts").select("*").eq("id", slugOrId).maybeSingle();
    return { db, post: data };
  }
  // 한글 slug 인코딩 대응: 원본/디코딩/인코딩 후보 모두 시도
  const dec = (() => { try { return decodeURIComponent(slugOrId); } catch { return slugOrId; } })();
  const enc = (() => { try { return encodeURIComponent(slugOrId); } catch { return slugOrId; } })();
  for (const s of Array.from(new Set([slugOrId, dec, enc]))) {
    const { data } = await db.from("posts").select("*").eq("slug", s).maybeSingle();
    if (data) return { db, post: data };
  }
  return { db, post: null };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, post } = await findPost(slug);
  if (!post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  // draft 인 경우 어드민만 조회 가능
  if (post.status !== "published") {
    const user = await currentUser();
    if (!isAdmin({ email: user?.email, plan: user?.plan })) {
      return NextResponse.json({ message: "비공개 글입니다." }, { status: 404 });
    }
  } else if (db) {
    // 조회수 증가 (non-blocking, best-effort)
    db.from("posts").update({ view_count: (post.view_count ?? 0) + 1 }).eq("id", post.id).then(() => {});
  }

  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  if (!user || !isAdmin({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const { db, post } = await findPost(slug);
  if (!db || !post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = String(body.title).trim();
  if (body.subtitle !== undefined) update.subtitle = body.subtitle ? String(body.subtitle) : null;
  if (body.cover_image !== undefined) update.cover_image = body.cover_image ? String(body.cover_image) : null;
  if (Array.isArray(body.content)) update.content = body.content;
  if (body.description !== undefined) update.description = body.description ? String(body.description).slice(0, 300) : null;
  if (body.category !== undefined) update.category = normalizeCategory(body.category);
  if (Array.isArray(body.tags)) update.tags = body.tags.slice(0, 10).map(String);
  if (body.slug !== undefined) update.slug = slugify(String(body.slug));

  if (body.status !== undefined) {
    const status = body.status === "published" ? "published" : "draft";
    update.status = status;
    if (status === "published" && !post.published_at) {
      update.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await db.from("posts").update(update).eq("id", post.id).select().single();
  if (error) {
    console.error("[posts:update]", error);
    return NextResponse.json({ message: "수정 실패: " + error.message }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  if (!user || !isAdmin({ email: user.email, plan: user.plan })) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const { db, post } = await findPost(slug);
  if (!db || !post) return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });

  const { error } = await db.from("posts").delete().eq("id", post.id);
  if (error) return NextResponse.json({ message: "삭제 실패: " + error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
