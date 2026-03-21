import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminDashboard from "./_components/AdminDashboard";

import { isAdminEmail } from "@/lib/adminAuth";

export default async function AdminPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (!isAdminEmail(email)) {
    redirect("/");
  }

  const displayName = user.firstName || user.username || email.split("@")[0] || "Admin";

  return (
    <main className="min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/search" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-white">bibl</span>
                <span className="text-teal-400"> lab</span>
              </span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm font-medium">Admin</span>
          </div>
          <div className="text-sm text-gray-500">
            로그인: <span className="text-gray-300">{displayName}</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">관리자 대시보드</h1>
          <p className="text-gray-500 mt-1 text-sm">사용자 현황 및 서비스 통계를 확인합니다.</p>
        </div>

        <AdminDashboard />
      </div>
    </main>
  );
}
