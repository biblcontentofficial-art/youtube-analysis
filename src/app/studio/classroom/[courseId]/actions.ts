"use server";

import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

/**
 * 특정 강의(lessonId)를 완료로 표시 — profiles 테이블에 기록
 */
export async function markLessonComplete(courseSlug: string, lessonId: string) {
  const user = await currentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const db = getSupabase();
  if (!db) throw new Error("DB not configured");

  const { data: profile } = await db
    .from("profiles")
    .select("lesson_progress")
    .eq("id", user.id)
    .single();

  const existing = (profile?.lesson_progress as Record<string, string[]>) ?? {};
  const courseProgress = existing[courseSlug] ?? [];

  if (courseProgress.includes(lessonId)) return; // 이미 완료

  const updated = {
    ...existing,
    [courseSlug]: [...courseProgress, lessonId],
  };

  await db
    .from("profiles")
    .update({ lesson_progress: updated })
    .eq("id", user.id);

  revalidatePath(`/studio/classroom/${courseSlug}`);
}
