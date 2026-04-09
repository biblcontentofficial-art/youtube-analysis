/**
 * /api/threads/saved
 * GET   — 수집한 스레드 목록
 * POST  — 게시물 수집 (배열)
 * PATCH — 메모·즐겨찾기 업데이트
 * DELETE — 단건 삭제(postId) 또는 전체 삭제
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@/lib/auth";
import { PLANS, PlanKey } from "@/lib/stripe";
import {
  upsertSavedThread,
  getSavedThreads,
  deleteSavedThread,
  clearSavedThreads,
  updateSavedThread,
} from "@/lib/db";

async function requireProPlus() {
  const { userId } = await auth();
  if (!userId) return { error: "로그인이 필요합니다", status: 401, userId: null };

  const user = await currentUser();
  const plan = ((user?.plan as PlanKey) ?? "free") as PlanKey;
  const planData = PLANS[plan in PLANS ? plan : "free"];

  if (!planData.canCollect) {
    return { error: "Pro 플랜부터 수집 기능을 이용할 수 있어요", status: 403, userId: null };
  }
  return { error: null, status: 200, userId };
}

export async function GET() {
  const { error, status, userId } = await requireProPlus();
  if (error || !userId) return NextResponse.json({ error }, { status });

  const threads = await getSavedThreads(userId);
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const { error, status, userId } = await requireProPlus();
  if (error || !userId) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const posts: Array<Record<string, unknown>> = body.posts ?? [];

  if (!posts.length) {
    return NextResponse.json({ error: "수집할 게시물이 없어요" }, { status: 400 });
  }

  let saved = 0;
  let failed = 0;

  for (const p of posts) {
    try {
      await upsertSavedThread({
        userId,
        postId: String(p.id ?? ""),
        text: p.text ? String(p.text) : undefined,
        mediaType: p.media_type ? String(p.media_type) : undefined,
        permalink: p.permalink ? String(p.permalink) : undefined,
        username: p.username ? String(p.username) : undefined,
        followersCount: Number(p.followers_count ?? 0),
        likeCount: Number(p.like_count ?? 0),
        repostCount: Number(p.repost_count ?? 0),
        repliesCount: Number(p.replies_count ?? 0),
        viralScore: Number(p.viral_score ?? 0),
        publishedAt: p.timestamp ? String(p.timestamp) : undefined,
        query: p.query ? String(p.query) : undefined,
      });
      saved++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ saved, failed });
}

export async function PATCH(req: NextRequest) {
  const { error, status, userId } = await requireProPlus();
  if (error || !userId) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const postId = body.postId as string | undefined;
  if (!postId) return NextResponse.json({ error: "postId 필요" }, { status: 400 });

  const updates: { memo?: string; is_favorite?: boolean } = {};
  if (typeof body.memo === "string") updates.memo = body.memo;
  if (typeof body.is_favorite === "boolean") updates.is_favorite = body.is_favorite;

  await updateSavedThread(userId, postId, updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { error, status, userId } = await requireProPlus();
  if (error || !userId) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  const postId = (body as Record<string, unknown>).postId as string | undefined;

  if (postId) {
    await deleteSavedThread(userId, postId);
  } else {
    await clearSavedThreads(userId);
  }

  return NextResponse.json({ ok: true });
}
