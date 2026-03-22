/**
 * POST /api/studio/enroll
 *
 * 수강권 부여 API — 관리자가 직접 수강생에게 강의 접근권을 부여하거나
 * Toss 결제 완료 후 웹훅에서 호출합니다.
 *
 * Body: { userId: string, courseSlug: string }
 * Authorization: Bearer ADMIN_SECRET
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getCourse } from "@/lib/courses";

export async function POST(req: NextRequest) {
  // 관리자 인증
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string; courseSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, courseSlug } = body;
  if (!userId || !courseSlug) {
    return NextResponse.json({ error: "userId and courseSlug are required" }, { status: 400 });
  }

  // 강의 존재 확인
  const course = getCourse(courseSlug);
  if (!course) {
    return NextResponse.json({ error: `Course '${courseSlug}' not found` }, { status: 404 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existing = (user.publicMetadata?.purchased_courses as string[]) ?? [];

    if (existing.includes(courseSlug)) {
      return NextResponse.json({ ok: true, message: "Already enrolled" });
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        purchased_courses: [...existing, courseSlug],
      },
    });

    return NextResponse.json({ ok: true, message: `Enrolled ${userId} in ${courseSlug}` });
  } catch (err) {
    console.error("[studio/enroll] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
