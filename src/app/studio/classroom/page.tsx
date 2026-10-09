import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { COURSES, calcProgress } from "@/lib/courses";
import { buttonClass, cx } from "@/components/ui/button";
import { CARD, CARD_LINK } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "내 강의실 · TMK STUDIO",
};

export default async function ClassroomPage() {
  let user = null;
  try {
    user = await currentUser();
  } catch { /* auth 미설정 */ }

  if (!user) {
    redirect("/sign-in?redirect=/studio/classroom");
  }

  const purchasedSlugs = ((user as any).purchased_courses as string[]) ?? [];
  const progressMap = ((user as any).lesson_progress as Record<string, string[]>) ?? {};

  const myCourses = COURSES.filter(
    (c) => c.published && purchasedSlugs.includes(c.slug)
  );

  return (
    <main id="main">
      <div className="border-b border-line">
        <div className="mx-auto max-w-wide px-6 py-10 lg:px-8">
          <Link
            href="/studio"
            className="-my-3 mb-1 inline-flex h-11 items-center gap-1 text-caption text-fg-3 transition-colors duration-150 hover:text-fg"
          >
            <span aria-hidden="true">←</span> TMK STUDIO
          </Link>
          <h1 className="text-h3 text-fg md:text-h2">내 강의실</h1>
          <p className="mt-2 text-body-sm text-fg-3">
            {user.firstName
              ? `${user.firstName}님, 오늘도 성장하는 하루 되세요.`
              : "수강 중인 강의를 확인하세요."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-wide px-6 py-12 lg:px-8">
        {myCourses.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 md:p-8">
            <div>
              <h2 className="text-ui font-semibold text-fg">아직 수강 중인 강의가 없습니다</h2>
              <p className="mt-1 text-body-sm text-fg-3">강의를 구매하면 여기서 바로 수강할 수 있습니다.</p>
            </div>
            <Link href="/studio/class" className={buttonClass({ variant: "secondary" })}>
              강의 보러가기
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {myCourses.map((course) => {
              const completedIds = progressMap[course.slug] ?? [];
              const prog = calcProgress(course, completedIds);

              return (
                <li key={course.slug}>
                  <Link
                    href={`/studio/classroom/${course.slug}`}
                    className={cx(CARD, CARD_LINK, "flex h-full flex-col p-5 sm:p-6")}
                  >
                    <h2 className="text-lead font-bold leading-[1.4] text-fg">{course.title}</h2>
                    <div className="mt-auto pt-6">
                      <div className="flex items-baseline justify-between gap-3 text-body-sm">
                        <span className="tnum text-fg-2">
                          {prog.completed} / {prog.total}개 강의 완료
                        </span>
                        <span className="tnum font-semibold text-fg">
                          {prog.percent === 100 ? "수료 완료" : `${prog.percent}%`}
                        </span>
                      </div>
                      {/* 진도 막대(DESIGN 6.23): 완료여도 기능 색을 쓰지 않는다 */}
                      <div
                        role="progressbar"
                        aria-label={`${course.title} 진도`}
                        aria-valuenow={prog.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
                      >
                        <div className="h-full bg-chart-1" style={{ width: `${prog.percent}%` }} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
