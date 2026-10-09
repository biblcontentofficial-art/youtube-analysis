import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse, getPublishedCourses, getFreeLessons, getTotalLessons } from "@/lib/courses";
import { currentUser } from "@/lib/auth";
import CourseEnrollButton from "./_components/CourseEnrollButton";
import { CheckIcon, LockIcon, PlayIcon } from "@/components/ui/icons";

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
    title: `${course.title} · TMK STUDIO`,
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
    <main className="min-h-screen bg-canvas text-fg">
      <div className="mx-auto max-w-wide px-6 py-8 lg:px-8">
        <Link
          href="/studio/class"
          className="mb-6 inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg"
        >
          <span aria-hidden="true">←</span> 강의 목록
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── 좌측: 강의 정보 ────────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">
            {/* 헤더 */}
            <div>
              {course.badge && (
                <span className="mb-3 inline-flex items-center rounded-md border border-line-strong px-1.5 py-0.5 text-micro font-bold text-fg-2">
                  {course.badge}
                </span>
              )}
              <h1 className="mb-3 text-h3 md:text-h2">{course.title}</h1>
              <p className="mb-4 text-body text-fg-2">{course.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 text-body-sm text-fg-3">
                <span className="flex items-center gap-1 text-caution">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                  </svg>
                  <span className="sr-only">평점</span>
                  {course.rating} <span className="text-fg-3">({course.enrollCount}명 수강)</span>
                </span>
                <span>{course.level}</span>
                <span>{totalLessons}개 강의</span>
                <span>{course.totalDuration}</span>
              </div>
            </div>

            {/* 강의 소개 */}
            <div className="rounded-card border border-line bg-surface p-5 md:p-6">
              <h2 className="mb-3 text-ui font-semibold">강의 소개</h2>
              <p className="text-body-sm text-fg-2">{course.description}</p>
            </div>

            {/* 이런 분께 추천 */}
            <div className="rounded-card border border-line bg-surface p-5 md:p-6">
              <h2 className="mb-4 text-ui font-semibold">이 강의에 포함된 것</h2>
              <ul className="space-y-2">
                {course.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-fg-2">
                    <CheckIcon size={16} className="mt-1 text-fg-3" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 커리큘럼 */}
            <div>
              <h2 className="mb-4 text-h4">커리큘럼</h2>
              <div className="space-y-3">
                {course.curriculum.map((section) => (
                  <details key={section.id} className="group rounded-card border border-line bg-surface" open={section.id === course.curriculum[0].id}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-4">
                      <span className="text-body-sm font-medium">{section.title}</span>
                      <span className="shrink-0 text-caption text-fg-3">{section.lessons.length}개 강의</span>
                    </summary>
                    <div className="border-t border-line">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-2/55">
                          <div className="flex min-w-0 items-center gap-3">
                            {lesson.isFree ? (
                              <PlayIcon size={16} className="text-fg-2" />
                            ) : (
                              <LockIcon size={16} className="text-fg-4" />
                            )}
                            <span className="truncate text-body-sm text-fg-2">{lesson.title}</span>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-3">
                            {lesson.isFree && (
                              <span className="rounded-md border border-line-strong px-1.5 py-0.5 text-micro text-fg-2">미리보기</span>
                            )}
                            <span className="text-caption tabular-nums text-fg-3">{lesson.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              {freeLessons.length > 0 && (
                <p className="mt-3 text-caption text-fg-3">{freeLessons.length}개 강의 무료 미리보기 가능</p>
              )}
            </div>

            {/* 강사 소개 */}
            <div className="rounded-card border border-line bg-surface p-5 md:p-6">
              <h2 className="mb-4 text-ui font-semibold">강사 소개</h2>
              <div className="flex items-start gap-4">
                <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-xl font-black">
                  B
                </div>
                <div>
                  <div className="mb-1 font-medium">{course.instructor}</div>
                  <p className="whitespace-pre-line text-body-sm text-fg-2">{course.instructorBio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 우측: 구매 카드 (sticky, 전역 네비 높이 + 16px 아래에 붙는다) ─────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-[calc(var(--nav-h,56px)+1rem)] space-y-4 rounded-panel border border-line bg-surface p-6">
              {/* 가격 */}
              <div>
                {course.originalPrice && discountRate > 0 && (
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-body-sm tabular-nums text-fg-3 line-through">
                      {course.originalPrice.toLocaleString()}원
                    </span>
                    <span className="rounded-md border border-line-strong px-1.5 py-0.5 text-micro font-bold text-fg">
                      {discountRate}% 할인
                    </span>
                  </div>
                )}
                <div className="text-h3 tabular-nums">{course.priceLabel}</div>
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
              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-caption font-medium text-fg-3">포함 내용</p>
                {[
                  `${totalLessons}개 강의`,
                  course.totalDuration,
                  "1년 무제한 재수강",
                  "수료증 발급",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-caption text-fg-2">
                    <CheckIcon size={16} className="text-fg-3" /> {item}
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
