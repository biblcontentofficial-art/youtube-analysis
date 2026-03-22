import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { COURSES, calcProgress } from "@/lib/courses";

export const metadata: Metadata = {
  title: "내 강의실 — TMK STUDIO",
};

export default async function ClassroomPage() {
  let user = null;
  try {
    user = await currentUser();
  } catch { /* Clerk 미설정 */ }

  if (!user) {
    redirect("/sign-in?redirect=/studio/classroom");
  }

  const purchasedSlugs = (user.publicMetadata?.purchased_courses as string[]) ?? [];
  const progressMap = (user.publicMetadata?.lesson_progress as Record<string, string[]>) ?? {};

  const myCourses = COURSES.filter(
    (c) => c.published && purchasedSlugs.includes(c.slug)
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-screen-xl mx-auto px-4 py-10">
          <Link href="/studio" className="text-xs text-gray-500 hover:text-gray-300 transition mb-4 inline-flex items-center gap-1">
            ← TMK STUDIO
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">내 강의실</h1>
          <p className="text-gray-400 text-sm">
            {user.firstName
              ? `${user.firstName}님, 오늘도 성장하는 하루 되세요.`
              : "수강 중인 강의를 확인하세요."}
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {myCourses.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-6 opacity-20">📚</div>
            <h2 className="text-lg font-semibold mb-3">아직 수강 중인 강의가 없습니다</h2>
            <p className="text-sm text-gray-500 mb-8">강의를 구매하면 여기서 바로 수강할 수 있습니다.</p>
            <Link
              href="/studio/class"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition text-sm"
            >
              강의 보러가기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course) => {
              const completedIds = progressMap[course.slug] ?? [];
              const prog = calcProgress(course, completedIds);

              return (
                <Link
                  key={course.slug}
                  href={`/studio/classroom/${course.slug}`}
                  className="group rounded-2xl bg-gray-900 border border-gray-800 hover:border-teal-700/60 transition overflow-hidden"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                    <div className="text-4xl opacity-10">📚</div>
                    {prog.percent === 100 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-teal-900/40">
                        <span className="text-teal-400 font-bold text-sm">수료 완료 ✓</span>
                      </div>
                    )}
                  </div>
                  {/* 진행률 바 */}
                  <div className="h-1 bg-gray-800">
                    <div
                      className="h-full bg-teal-500 transition-all"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white group-hover:text-teal-400 transition mb-2">{course.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{prog.completed} / {prog.total}개 강의 완료</span>
                      <span className="font-medium text-teal-400">{prog.percent}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
