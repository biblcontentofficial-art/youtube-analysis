/**
 * /insights/[slug] — 비블의 칼럼이 커뮤니티 "비블 bibl 칼럼" 게시판으로 통합됨 (2026-08-30).
 * 개별 글 링크는 칼럼 게시판 피드로 보낸다.
 */
import { redirect } from "next/navigation";

export default function InsightPostRedirect() {
  redirect("/community?cat=column");
}
