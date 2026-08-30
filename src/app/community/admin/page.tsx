import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canModerateCommunity, type Board } from "@/lib/community";
import BoardManager from "./_components/BoardManager";
import GradeManager from "./_components/GradeManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "게시판 관리 | 비블 커뮤니티",
  robots: { index: false, follow: false },
};

/** 컨테이너·<main>은 community/layout.tsx가 제공한다 */
function Shell({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export default async function CommunityAdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/community/admin");

  if (!canModerateCommunity({ email: user.email, plan: user.plan })) {
    return (
      <Shell>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-14 text-center">
          <h1 className="text-xl font-bold tracking-tight text-white">운영진만 접근할 수 있습니다</h1>
          <p className="mt-3 text-sm text-neutral-400">게시판 관리는 커뮤니티 운영진 계정으로만 열 수 있습니다.</p>
          <Link
            href="/community"
            className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            커뮤니티로 이동
          </Link>
        </div>
      </Shell>
    );
  }

  const db = getSupabase();
  if (!db) {
    return (
      <Shell>
        <p className="text-sm text-neutral-400">DB가 연결되지 않았습니다.</p>
      </Shell>
    );
  }

  const { data, error } = await db
    .from("community_boards")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) console.error("[community:admin]", error.message);

  const boards = (data ?? []) as Board[];

  return (
    <Shell>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">게시판 관리</h1>
          <p className="mt-2 text-sm text-neutral-400">
            그룹명과 정렬순서를 바꿔 카페 메뉴 구조를 그대로 옮길 수 있습니다.
          </p>
        </div>
        <Link href="/community" className="text-sm text-neutral-400 transition hover:text-white">
          커뮤니티
        </Link>
      </div>

      <BoardManager boards={boards} />

      <GradeManager />
    </Shell>
  );
}
