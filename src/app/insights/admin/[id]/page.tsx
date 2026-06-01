import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { canEditInsights } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import type { Post } from "@/lib/posts";
import PostEditor from "../_components/PostEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글 수정 | 비블 인사이트",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/insights/admin");
  if (!canEditInsights({ email: user.email, plan: user.plan })) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-slate-400">관리자만 접근 가능합니다.</p>
      </main>
    );
  }

  const db = getSupabase();
  if (!db) return <main className="p-10 text-slate-400">DB 미연결</main>;

  // id 또는 slug 둘 다 허용
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const column = UUID_RE.test(id) ? "id" : "slug";
  const { data: post } = await db.from("posts").select("*").eq(column, id).maybeSingle();
  if (!post) notFound();

  return <PostEditor initial={post as Post} />;
}
