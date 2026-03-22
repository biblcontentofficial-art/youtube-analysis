"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Course, Lesson } from "@/lib/courses";
import { markLessonComplete } from "../actions";

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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단 바 */}
      <div className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/studio/classroom" className="text-xs text-gray-500 hover:text-gray-300 transition shrink-0">
              ← 내 강의실
            </Link>
            <span className="text-gray-700">|</span>
            <span className="text-xs text-gray-400 truncate">{course.title}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <div className="w-24 h-1 rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${percent}%` }} />
              </div>
              <span>{percent}%</span>
            </div>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition"
            >
              {sidebarOpen ? "목록 닫기" : "목록 열기"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 플레이어 영역 */}
        <div className={`flex-1 flex flex-col overflow-y-auto ${sidebarOpen ? "md:pr-80" : ""}`}>
          {/* 비디오 */}
          <div className="bg-black w-full aspect-video">
            {currentLesson.videoUrl ? (
              <iframe
                src={currentLesson.videoUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <div className="text-5xl mb-4 opacity-30">▶</div>
                <p className="text-sm">영상이 준비 중입니다</p>
                <p className="text-xs mt-1">관리자가 영상을 업로드하면 자동으로 표시됩니다</p>
              </div>
            )}
          </div>

          {/* 강의 정보 */}
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {currentIndex + 1} / {totalLessons}
                </p>
                <h1 className="text-xl font-bold">{currentLesson.title}</h1>
                {currentLesson.description && (
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{currentLesson.description}</p>
                )}
              </div>
              <button
                onClick={handleMarkComplete}
                disabled={isCompleted || isPending}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isCompleted
                    ? "bg-teal-900/40 text-teal-400 cursor-default"
                    : "bg-teal-600 hover:bg-teal-500 text-white"
                }`}
              >
                {isCompleted ? "완료 ✓" : isPending ? "처리 중..." : "완료 표시"}
              </button>
            </div>

            {/* 이전/다음 */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              {prevLesson ? (
                <Link
                  href={`/studio/classroom/${course.slug}?lesson=${prevLesson.id}`}
                  className="flex-1 py-2.5 rounded-lg border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition text-center"
                >
                  ← 이전 강의
                </Link>
              ) : <div className="flex-1" />}
              {nextLesson ? (
                <Link
                  href={`/studio/classroom/${course.slug}?lesson=${nextLesson.id}`}
                  className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-white transition text-center"
                >
                  다음 강의 →
                </Link>
              ) : (
                <div className="flex-1 py-2.5 rounded-lg bg-teal-900/30 border border-teal-800/50 text-sm text-teal-400 text-center flex items-center justify-center gap-1">
                  강의 완료 🎉
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 커리큘럼 */}
        {sidebarOpen && (
          <aside className="hidden md:flex flex-col w-80 border-l border-gray-800 bg-gray-900/50 fixed right-0 top-12 bottom-0 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">커리큘럼</span>
              <span className="text-xs text-teal-400">{completed}/{totalLessons} 완료</span>
            </div>
            {course.curriculum.map((section) => (
              <div key={section.id}>
                <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 sticky top-0">
                  <p className="text-xs font-medium text-gray-400">{section.title}</p>
                </div>
                {section.lessons.map((lesson) => {
                  const done = completedIds.includes(lesson.id);
                  const active = lesson.id === currentLesson.id;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/studio/classroom/${course.slug}?lesson=${lesson.id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-xs transition border-b border-gray-800/50 ${
                        active
                          ? "bg-teal-900/30 text-teal-300"
                          : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                        done ? "bg-teal-600 text-white" : active ? "border-2 border-teal-400" : "border border-gray-600"
                      }`}>
                        {done ? "✓" : ""}
                      </div>
                      <span className="flex-1 leading-snug">{lesson.title}</span>
                      <span className="text-gray-600 shrink-0">{lesson.duration}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
