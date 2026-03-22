"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * 특정 강의(lessonId)를 완료로 표시 — Clerk publicMetadata에 기록
 */
export async function markLessonComplete(courseSlug: string, lessonId: string) {
  const user = await currentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const existing = (user.publicMetadata?.lesson_progress as Record<string, string[]>) ?? {};
  const courseProgress = existing[courseSlug] ?? [];

  if (courseProgress.includes(lessonId)) return; // 이미 완료

  const updated = {
    ...existing,
    [courseSlug]: [...courseProgress, lessonId],
  };

  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      lesson_progress: updated,
    },
  });

  revalidatePath(`/studio/classroom/${courseSlug}`);
}
