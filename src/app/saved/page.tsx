import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SavedPage() {
  const { sessionClaims } = await auth();
  const plan = (sessionClaims?.publicMetadata as Record<string, string> | undefined)?.plan;
  if (plan !== "admin") redirect("/search");

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🔖</div>
        <h1 className="text-2xl font-bold">수집한 영상</h1>
        <p className="text-gray-500 text-sm">개발 중인 기능입니다.</p>
        <span className="inline-block text-xs bg-purple-900/50 border border-purple-700 text-purple-300 px-3 py-1 rounded-full">Admin 미리보기</span>
      </div>
    </main>
  );
}
