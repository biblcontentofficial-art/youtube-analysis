/**
 * /community/incubating → /incubating 으로 이전됨 (공개 페이지).
 * 기존에 공유된 링크가 깨지지 않도록 리다이렉트만 남긴다.
 */
import { redirect } from "next/navigation";

export default function CommunityIncubatingRedirect() {
  redirect("/incubating");
}
