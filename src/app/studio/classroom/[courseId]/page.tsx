import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCourse, getTotalLessons, calcProgress } from "@/lib/courses";
import LessonPlayer from "./_components/LessonPlayer";

interface Props {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return {};
  return { title: `${course.title} 수강 — TMK STUDIO` };
}

export default async function ClassroomCoursePage({ params, searchParams }: Props) {
  const { courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  const course = getCourse(courseId);
  if (!course) notFound();

  let user = null;
  try {
    user = await currentUser();
  } catch { /* auth 미설정 */ }

  if (!user) {
    redirect(`/sign-in?redirect=/studio/classroom/${courseId}`);
  }

  const purchasedSlugs = ((user as any).purchased_courses as string[]) ?? [];
  if (!purchasedSlugs.includes(courseId)) {
    redirect(`/studio/class/${courseId}`);
  }

  const progressMap = ((user as any).lesson_progress as Record<string, string[]>) ?? {};
  const completedIds = progressMap[courseId] ?? [];
  const prog = calcProgress(course, completedIds);

  // 현재 재생할 강의 결정
  const allLessons = course.curriculum.flatMap((s) => s.lessons);
  const currentLesson = lessonId
    ? allLessons.find((l) => l.id === lessonId) ?? allLessons[0]
    : allLessons[0];

  const totalLessons = getTotalLessons(course);

  return (
    <LessonPlayer
      course={course}
      currentLesson={currentLesson}
      completedIds={completedIds}
      progress={prog}
      totalLessons={totalLessons}
      userId={user.id}
    />
  );
}
