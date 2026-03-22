import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCourses } from "@/lib/courses";

export const metadata: Metadata = {
  title: "강의 목록 — TMK STUDIO",
  description: "비블의 유튜브 성장 강의 및 1:1 컨설팅. 실전으로 검증된 채널 운영 노하우를 배우세요.",
};

const CATEGORY_LABEL: Record<string, string> = {
  lecture: "온라인 강의",
  consulting: "1:1 컨설팅",
  agency: "채널 대행",
};

export default function ClassListPage() {
  const courses = getPublishedCourses();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-screen-xl mx-auto px-4 py-10">
          <Link href="/studio" className="text-xs text-gray-500 hover:text-gray-300 transition mb-4 inline-flex items-center gap-1">
            ← TMK STUDIO
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">강의 & 서비스</h1>
          <p className="text-gray-400 text-sm">
            70만 구독자가 검증한 유튜브 성장 방법론 — 강의, 컨설팅, 대행 중 선택하세요.
          </p>
        </div>
      </div>

      {/* 강의 그리드 */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={
                course.category === "consulting" || course.category === "agency"
                  ? "/studio/consulting"
                  : `/studio/class/${course.slug}`
              }
              className="group rounded-2xl bg-gray-900 border border-gray-800 hover:border-teal-700/60 transition overflow-hidden flex flex-col"
            >
              {/* 썸네일 */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                <div className="text-5xl opacity-10">
                  {course.category === "consulting" ? "💬" : course.category === "agency" ? "🎬" : "📚"}
                </div>
                {course.badge && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                    {course.badge}
                  </span>
                )}
                {course.category === "lecture" && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-[10px] text-gray-300">
                    {course.totalDuration}
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {CATEGORY_LABEL[course.category]}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    ★ {course.rating}
                    <span className="text-gray-600">({course.enrollCount})</span>
                  </div>
                </div>

                <h2 className="font-bold text-white group-hover:text-teal-400 transition mb-1 text-base leading-snug">
                  {course.title}
                </h2>
                <p className="text-xs text-gray-500 mb-4 flex-1 line-clamp-2">{course.subtitle}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {course.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                  {course.originalPrice && course.originalPrice > course.price ? (
                    <div>
                      <div className="text-xs text-gray-600 line-through">
                        {course.originalPrice.toLocaleString()}원
                      </div>
                      <div className="font-bold text-teal-400 text-sm">{course.priceLabel}</div>
                    </div>
                  ) : (
                    <div className="font-bold text-teal-400 text-sm">{course.priceLabel}</div>
                  )}
                  <span className="text-xs text-gray-500">
                    {course.level} · {course.instructor}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 안내 배너 */}
        <div className="mt-12 rounded-2xl bg-teal-950/30 border border-teal-900/50 p-6 text-center">
          <p className="text-sm text-teal-300 mb-3">
            어떤 서비스가 나에게 맞는지 모르겠다면?
          </p>
          <Link
            href="/studio/consulting"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-semibold transition"
          >
            무료 상담 신청하기
          </Link>
        </div>
      </div>
    </main>
  );
}
