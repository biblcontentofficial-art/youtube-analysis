"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Course, Lesson } from "@/lib/courses";
import { markLessonComplete } from "../actions";
import { buttonClass, cx } from "@/components/ui/button";
import { CheckIcon, PlayIcon } from "@/components/ui/icons";

interface Props {
  course: Course;
  currentLesson: Lesson;
  completedIds: string[];
  progress: { completed: number; total: number; percent: number };
  totalLessons: number;
  userId: string;
}

export default function LessonPlayer({
  course,
  currentLesson,
  completedIds: initialCompleted,
  progress: initialProgress,
  totalLessons,
  userId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompleted);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allLessons = course.curriculum.flatMap((s) => s.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = allLessons[currentIndex + 1];
  const prevLesson = allLessons[currentIndex - 1];

  const isCompleted = completedIds.includes(currentLesson.id);
  const completed = completedIds.length;
  const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  const handleMarkComplete = () => {
    if (isCompleted) return;
    startTransition(async () => {
      await markLessonComplete(course.slug, currentLesson.id);
      setCompletedIds((prev) => [...prev, currentLesson.id]);
      if (nextLesson) {
        router.push(`/studio/classroom/${course.slug}?lesson=${nextLesson.id}`);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 바: 전역 네비 바로 아래에 붙는다 */}
      <div className="sticky top-[var(--nav-h,56px)] z-30 border-b border-line bg-canvas">
        <div className="flex h-12 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/studio/classroom"
              className="inline-flex h-11 shrink-0 items-center gap-1 text-caption text-fg-3 transition-colors duration-150 hover:text-fg"
            >
              <span aria-hidden="true">←</span> 내 강의실
            </Link>
            <span aria-hidden="true" className="h-4 w-px bg-line" />
            <span className="truncate text-caption text-fg-2">{course.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              {/* 진도 막대(DESIGN 6.23) */}
              <div
                role="progressbar"
                aria-label="강의 진도"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3"
              >
                <div className="h-full bg-chart-1" style={{ width: `${percent}%` }} />
              </div>
              <span className="tnum text-caption text-fg-2">{percent}%</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-controls="lesson-curriculum"
              className="hidden h-9 items-center rounded-md px-3 text-caption font-semibold text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg lg:inline-flex"
            >
              {sidebarOpen ? "목록 닫기" : "목록 열기"}
            </button>
          </div>
        </div>
      </div>

      {/* DESIGN 7.3 강의실: 왼쪽 커리큘럼 사이드바(6.26, sticky) + 오른쪽 플레이어. 1024 미만은 플레이어 아래에 목록 */}
      <div
        className={cx(
          "mx-auto grid w-full max-w-wide flex-1 items-start gap-6 px-4 py-6 lg:gap-8 lg:px-8",
          sidebarOpen && "lg:grid-cols-[18rem_minmax(0,1fr)]",
        )}
      >
        {/* 플레이어 영역 */}
        <div className="flex min-w-0 flex-col">
          {/* 비디오 */}
          <div className="aspect-video w-full overflow-hidden rounded-card bg-surface">
            {currentLesson.videoUrl ? (
              <iframe
                src={currentLesson.videoUrl}
                title={currentLesson.title}
                className="size-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-fg-3">
                <PlayIcon size={24} className="mb-3 text-fg-4" />
                <p className="text-body-sm">영상이 준비 중입니다</p>
                <p className="text-caption">관리자가 영상을 업로드하면 자동으로 표시됩니다</p>
              </div>
            )}
          </div>

          {/* 강의 정보 */}
          <div className="w-full pt-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="tnum mb-1 text-caption text-fg-3">
                  {currentIndex + 1} / {totalLessons}
                </p>
                <h1 className="text-h4 font-bold text-fg">{currentLesson.title}</h1>
                {currentLesson.description && (
                  <p className="mt-2 text-body-sm text-fg-2">{currentLesson.description}</p>
                )}
              </div>
              {isCompleted ? (
                <span className="inline-flex h-11 shrink-0 items-center gap-1.5 text-body-sm font-semibold text-fg-2">
                  <CheckIcon size={16} className="text-fg-3" />
                  완료
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={isPending}
                  className={cx(buttonClass(), "shrink-0")}
                >
                  {isPending ? "처리 중..." : "완료 표시"}
                </button>
              )}
            </div>

            {/* 이전/다음 */}
            <div className="flex gap-3 border-t border-line pt-4">
              {prevLesson ? (
                <Link
                  href={`/studio/classroom/${course.slug}?lesson=${prevLesson.id}`}
                  className={cx(buttonClass({ variant: "ghost" }), "flex-1")}
                >
                  <span aria-hidden="true">←</span> 이전 강의
                </Link>
              ) : <div className="flex-1" />}
              {nextLesson ? (
                <Link
                  href={`/studio/classroom/${course.slug}?lesson=${nextLesson.id}`}
                  className={cx(buttonClass({ variant: "secondary" }), "flex-1")}
                >
                  다음 강의 <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <p className="flex h-11 flex-1 items-center justify-center rounded-control border border-line text-body-sm text-fg-2">
                  강의 완료
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 커리큘럼 사이드바(DESIGN 6.26). 데스크톱은 전역 네비(--nav-h) + 상단 바(3rem) 아래에 붙는다. 닫아도 렌더해 aria-controls 대상이 남는다 */}
        <aside
          id="lesson-curriculum"
          aria-label="커리큘럼"
          className={cx(
            "rounded-card border border-line bg-surface p-2 lg:order-first lg:sticky lg:top-[calc(var(--nav-h,56px)+4rem)] lg:max-h-[calc(100dvh-var(--nav-h,56px)-5rem)] lg:overflow-y-auto",
            !sidebarOpen && "lg:hidden",
          )}
        >
            <div className="flex items-center justify-between px-3 pb-2 pt-2">
              <span className="text-caption font-semibold text-fg-2">커리큘럼</span>
              <span className="tnum text-caption text-fg-3">{completed}/{totalLessons} 완료</span>
            </div>
            {course.curriculum.map((section, si) => (
              <div key={section.id}>
                {si > 0 && <div aria-hidden="true" className="my-2 h-px bg-line-soft" />}
                <p className="px-3 pb-1 pt-3 text-caption text-fg-3">{section.title}</p>
                <ul>
                  {section.lessons.map((lesson) => {
                    const done = completedIds.includes(lesson.id);
                    const active = lesson.id === currentLesson.id;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/studio/classroom/${course.slug}?lesson=${lesson.id}`}
                          aria-current={active ? "page" : undefined}
                          className={cx(
                            "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-body-sm transition-colors duration-150 pointer-coarse:min-h-11",
                            active ? "bg-surface-2 font-semibold text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
                          )}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            {done && (
                              <>
                                <CheckIcon size={16} className="text-fg-3" />
                                <span className="sr-only">완료</span>
                              </>
                            )}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                          <span className="tnum shrink-0 text-caption text-fg-3">{lesson.duration}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </aside>
      </div>
    </div>
  );
}
