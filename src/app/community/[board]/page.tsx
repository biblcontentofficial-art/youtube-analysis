/**
 * /community/[board] — 구 게시판 URL을 통합 피드의 카테고리 필터로 리다이렉트.
 * 글 상세(/community/[board]/[id])는 그대로 유지되므로 이 세그먼트는 남긴다.
 * slug 유효성 검사는 하지 않는다 — 피드가 빈 결과로 알아서 처리한다.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BoardRedirect({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;
  let slug = board;
  try {
    slug = decodeURIComponent(board);
  } catch {
    // 잘못된 인코딩은 원본 그대로 사용
  }
  redirect(`/community?cat=${encodeURIComponent(slug)}`);
}
