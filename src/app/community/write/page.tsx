import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { getBoards, getPost } from "@/lib/communityDb";
import {
  canManagePost,
  canModerateCommunity,
  canWriteBoard,
  type Board,
  type Viewer,
} from "@/lib/community";
import PostForm from "./_components/PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "글쓰기 | 비블 커뮤니티",
  robots: { index: false, follow: false },
};

/** 권한 없음·글 없음 등 안내 화면 */
function Notice({ title, desc, href, cta }: { title: string; desc: string; href: string; cta: string }) {
  // 컨테이너·<main>은 community/layout.tsx가 제공하므로 여기서는 카드만 렌더한다
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-14 text-center">
      <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm text-neutral-400">{desc}</p>
      <Link
        href={href}
        className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200"
      >
        {cta}
      </Link>
    </div>
  );
}

export default async function CommunityWritePage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; id?: string }>;
}) {
  const { board: boardParam, id: postId } = await searchParams;

  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/community/write");

  const viewer: Viewer = { id: user.id, email: user.email, plan: user.plan };
  const canModerate = canModerateCommunity(viewer);

  // 글쓰기 가능한 게시판만 노출
  const allBoards = await getBoards();
  const writable = allBoards.filter((b) => canWriteBoard(b, viewer));

  // ── 수정 모드 ─────────────────────────────────────────────
  if (postId) {
    const post = await getPost(postId);
    if (!post) {
      return (
        <Notice
          title="글을 찾을 수 없습니다"
          desc="이미 삭제되었거나 잘못된 주소입니다."
          href="/community"
          cta="커뮤니티로 이동"
        />
      );
    }
    if (!canManagePost(post, viewer)) {
      return (
        <Notice
          title="수정 권한이 없습니다"
          desc="작성자 본인 또는 운영진만 이 글을 수정할 수 있습니다."
          href={post.board?.slug ? `/community/${post.board.slug}/${post.id}` : "/community"}
          cta="글로 돌아가기"
        />
      );
    }

    // 수정 대상 글의 게시판이 목록에 없으면(권한·비활성 등) 선택지에 보강한다
    let options: Board[] = writable;
    if (post.board?.slug && !writable.some((b) => b.slug === post.board!.slug)) {
      const db = getSupabase();
      if (db) {
        const { data } = await db
          .from("community_boards")
          .select("*")
          .eq("id", post.board_id)
          .maybeSingle();
        if (data) options = [data as Board, ...writable];
      }
    }

    return (
      <PostForm
        boards={options}
        canModerate={canModerate}
        postId={post.id}
        initialBoardSlug={post.board?.slug ?? boardParam ?? ""}
        initialTitle={post.title}
        initialContent={post.content}
        initialIsNotice={post.is_notice}
      />
    );
  }

  // ── 신규 작성 ─────────────────────────────────────────────
  if (writable.length === 0) {
    return (
      <Notice
        title="글을 쓸 수 있는 게시판이 없습니다"
        desc="현재 계정 권한으로 작성 가능한 게시판이 없습니다. 운영진에게 문의해 주세요."
        href="/community"
        cta="커뮤니티로 이동"
      />
    );
  }

  const initialBoardSlug =
    (boardParam && writable.some((b) => b.slug === boardParam) ? boardParam : "") || writable[0].slug;

  return (
    <PostForm
      boards={writable}
      canModerate={canModerate}
      initialBoardSlug={initialBoardSlug}
      initialTitle=""
      initialContent=""
      initialIsNotice={false}
    />
  );
}
