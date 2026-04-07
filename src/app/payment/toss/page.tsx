import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TOSS_PLANS, TossPlanKey } from "@/lib/toss";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function TossCheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/pricing");

  const plan = searchParams.plan as TossPlanKey;
  if (!plan || !TOSS_PLANS[plan]) redirect("/pricing");

  const user = await currentUser();
  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  // 순수 HTML 결제 페이지로 리다이렉트 (React/Next.js 환경 우회)
  const params = new URLSearchParams({ plan, email: userEmail, name: userName });
  redirect(`/api/toss/billing/page?${params.toString()}`);
}
