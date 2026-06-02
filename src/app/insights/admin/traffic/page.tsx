import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";
import TrafficClient from "./TrafficClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "인사이트 트래픽 | 비블 인사이트",
  robots: { index: false, follow: false },
};

export default async function InsightsTrafficPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/insights/admin/traffic");
  if (!isAdmin({ email: user.email, plan: user.plan })) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-slate-400">관리자만 접근 가능합니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/insights" className="text-sm text-slate-400 hover:text-white">← 인사이트</Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-2">인사이트 트래픽</h1>
            <p className="text-sm text-slate-500 mt-1">글별 방문 수와 유입 소스(구글·네이버·유튜브 등)를 확인합니다.</p>
          </div>
          <Link
            href="/insights/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold transition shrink-0"
          >
            새 글 작성
          </Link>
        </div>

        <TrafficClient />
      </div>
    </main>
  );
}
