/**
 * /insights — 비블의 칼럼이 커뮤니티 "비블 bibl 칼럼" 게시판으로 통합됨 (2026-08-30).
 * 기존에 공유된 링크가 깨지지 않도록 리다이렉트만 남긴다.
 * (칼럼 작성용 /insights/admin 은 그대로 유지)
 */
import { redirect } from "next/navigation";

export default function InsightsRedirect() {
  redirect("/community?cat=column");
}
