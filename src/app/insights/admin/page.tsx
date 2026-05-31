import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/adminAuth";
import PostEditor from "./_components/PostEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "새 글 작성 | 비블 인사이트",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/insights/admin");
  if (!isAdmin({ email: user.email, plan: user.plan })) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-slate-400">관리자만 접근 가능합니다.</p>
      </main>
    );
  }
  return <PostEditor />;
}
