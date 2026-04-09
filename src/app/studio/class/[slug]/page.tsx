import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse, getPublishedCourses, getFreeLessons, getTotalLessons } from "@/lib/courses";
import { currentUser } from "@/lib/auth";
import CourseEnrollButton from "./_components/CourseEnrollButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPublishedCourses()
    .filter((c) => c.category === "lecture")
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return {
    title: `${course.title} — TMK STUDIO`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course || course.category !== "lecture") notFound();

  // 현재 유저 수강권 확인
  let hasPurchased = false;
  try {
    const user = await currentUser();
    const purchased = ((user as any)?.purchased_courses as string[]) ?? [];
    hasPurchased = purchased.includes(course.slug);
  } catch { /* 비로그인 */ }

  const freeLessons = getFreeLessons(course);
  const totalLessons = getTotalLessons(course);
  const discountRate = course.originalPrice
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <Link href="/studio/class" className="text-xs text-gray-500 hover:text-gray-300 transition inline-flex items-center gap-1 mb-6">
          ← 강의 목록
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── 좌측: 강의 정보 ────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* 헤더 */}
            <div>
              {course.badge && (
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white mb-3">
                  {course.badge}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{course.title}</h1>
              <p className="text-gray-400 mb-4">{course.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1 text-amber-400">
                  ★ {course.rating} <span className="text-gray-500">({course.enrollCount}명 수강)</span>
                </span>
                <span>{course.level}</span>
                <span>{totalLessons}개 강의</span>
                <span>{course.totalDuration}</span>
              </div>
            </div>

            {/* 강의 소개 */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
              <h2 className="font-semibold mb-3">강의 소개</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{course.description}</p>
            </div>

            {/* 이런 분께 추천 */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
              <h2 className="font-semibold mb-4">이 강의에 포함된 것</h2>
              <ul className="space-y-2">
                {course.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-teal-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 커리큘럼 */}
            <div>
              <h2 className="font-bold text-lg mb-4">커리큘럼</h2>
              <div className="space-y-3">
                {course.curriculum.map((section) => (
                  <details key={section.id} className="rounded-xl bg-gray-900 border border-gray-800 group" open={section.id === course.curriculum[0].id}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="font-medium text-sm">{section.title}</span>
                      <span className="text-xs text-gray-500">{section.lessons.length}개 강의</span>
                    </summary>
                    <div className="border-t border-gray-800">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                              lesson.isFree ? "bg-teal-900/50 text-teal-400" : "bg-gray-800 text-gray-500"
                            }`}>
                              {lesson.isFree ? "▶" : "🔒"}
                            </div>
                            <span className="text-sm text-gray-300 truncate">{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            {lesson.isFree && (
                              <span className="text-[10px] text-teal-400 bg-teal-900/30 px-1.5 py-0.5 rounded">미리보기</span>
                            )}
                            <span className="text-xs text-gray-600">{lesson.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              {freeLessons.length > 0 && (
                <p className="text-xs text-gray-500 mt-3">{freeLessons.length}개 강의 무료 미리보기 가능</p>
              )}
            </div>

            {/* 강사 소개 */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
              <h2 className="font-semibold mb-4">강사 소개</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xl shrink-0">
                  B
                </div>
                <div>
                  <div className="font-medium mb-1">{course.instructor}</div>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{course.instructorBio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 우측: 구매 카드 (sticky) ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
              {/* 가격 */}
              <div>
                {course.originalPrice && discountRate > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600 line-through">
                      {course.originalPrice.toLocaleString()}원
                    </span>
                    <span className="text-xs font-bold text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">
                      {discountRate}% 할인
                    </span>
                  </div>
                )}
                <div className="text-2xl font-bold text-white">{course.priceLabel}</div>
              </div>

              {/* CTA */}
              <CourseEnrollButton
                courseSlug={course.slug}
                courseTitle={course.title}
                price={course.price}
                priceLabel={course.priceLabel}
                hasPurchased={hasPurchased}
              />

              {/* 포함 내용 요약 */}
              <div className="border-t border-gray-800 pt-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">포함 내용</p>
                {[
                  `${totalLessons}개 강의`,
                  course.totalDuration,
                  "1년 무제한 재수강",
                  "수료증 발급",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-teal-400">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
