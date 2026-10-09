import { auth, currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSearchUsage } from "@/lib/searchLimit";
import { getChannelUsage } from "@/lib/channelLimit";
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

  const [payments, subscription] = await Promise.all([
    getPayments(userId).catch(() => []),
    getSubscription(userId).catch(() => null),
  ]);

  return (
    <MyPageView
      paymentSuccess={searchParams.payment === "success"}
      user={user}
      plan={plan}
      usage={usage}
      chUsage={chUsage}
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
