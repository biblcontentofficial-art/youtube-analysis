import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, PlanKey } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const plan = req.nextUrl.searchParams.get("plan") as PlanKey;
  if (!plan || !PLANS[plan] || plan === "free") {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
      success_url: `${appUrl}/search?upgraded=1`,
      cancel_url: `${appUrl}/pricing`,
    });

    return NextResponse.redirect(session.url!);
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.redirect(new URL("/pricing?error=payment", req.url));
  }
}
