import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSearchUsage } from "@/lib/searchLimit";
import { getChannelUsage } from "@/lib/channelLimit";
import { getAiUsage } from "@/lib/aiLimit";
import { getPayments, getSubscription } from "@/lib/db";
import LogoutButton from "./_components/LogoutButton";
import RecentSearches from "./_components/RecentSearches";
import CancelSubscriptionButton from "./_components/CancelSubscriptionButton";
import DeleteAccountButton from "./_components/DeleteAccountButton";
import ReferralSection from "./_components/ReferralSection";
import MyPageView from "./_components/MyPageView";

export default async function MyPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const plan = (user?.plan as string) || "free";

  let usage = { used: 0, limit: 3, isMonthly: false, unlimited: false };
  try {
    usage = await getSearchUsage();
  } catch {}

  let chUsage = { used: 0, limit: 1, unlimited: false, isDaily: true };
  try {
    const cu = await getChannelUsage();
    chUsage = { used: cu.used, limit: cu.limit, unlimited: cu.unlimited, isDaily: cu.isDaily };
  } catch {}

  // 영상 기획 초안(B5) 하루 사용량은 결제 조회와 함께 읽는다. 표시용 조회라 실패하면 줄을 숨긴다(차단은 /api/ai/remix 의 reserveAi)
  const [payments, subscription, aiUsage] = await Promise.all([
    getPayments(userId).catch(() => []),
    getSubscription(userId).catch(() => null),
    getAiUsage(userId, plan, ["remix"])
      .then((u) => u.remix ?? null)
      .catch(() => null),
  ]);

  return (
    <MyPageView
      paymentSuccess={searchParams.payment === "success"}
      user={user}
      plan={plan}
      usage={usage}
      chUsage={chUsage}
      aiUsage={aiUsage}
      payments={payments}
      subscription={subscription}
      referral={<ReferralSection />}
      recentSearches={<RecentSearches />}
      logout={<LogoutButton />}
      renderCancel={(cancelled) => <CancelSubscriptionButton cancelled={cancelled} />}
      renderDelete={(hasSubscription) => <DeleteAccountButton hasSubscription={hasSubscription} />}
    />
  );
}
