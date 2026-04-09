import { auth, getUserPlan } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getSavedVideos, upsertSavedVideo, deleteSavedVideo, clearSavedVideos } from "@/lib/db";
import { PLANS, PlanKey } from "@/lib/stripe";

async function getAuthedUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const plan = await getUserPlan(userId);
  const planData = PLANS[plan as PlanKey] ?? PLANS.free;
  return { userId, plan, canSavedVideos: planData.canSavedVideos };
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.canSavedVideos) return NextResponse.json({ error: "Pro 플랜 이상 필요" }, { status: 403 });

    const videos = await getSavedVideos(user.userId);
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.canSavedVideos) return NextResponse.json({ error: "Pro 플랜 이상 필요" }, { status: 403 });

    const body = await req.json().catch(() => ({ videos: [] }));
    const { videos } = body;

    if (!videos || !Array.isArray(videos)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      videos.map((v: any) =>
        upsertSavedVideo({
          userId: user.userId,
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          channelThumbnail: v.channelThumbnail,
          subscriberCount: v.subscriberCount,
          viewCount: v.viewCount,
          publishedAt: v.publishedAt,
          score: v.score,
          performanceRatio: v.performanceRatio,
          query: v.query,
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.error(`[saved-videos] ${failed}/${videos.length} 영상 저장 실패`);
    }

    return NextResponse.json({ ok: true, saved: videos.length - failed, failed });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.canSavedVideos) return NextResponse.json({ error: "Pro 플랜 이상 필요" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { videoId } = body;

    if (videoId) {
      await deleteSavedVideo(user.userId, videoId);
    } else {
      await clearSavedVideos(user.userId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
