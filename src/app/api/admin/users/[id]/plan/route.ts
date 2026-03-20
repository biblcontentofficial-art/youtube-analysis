import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["bibl.content.official@gmail.com"];
const VALID_PLANS = ["free", "starter", "pro", "business"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let plan: string;
  try {
    const body = await req.json();
    plan = body.plan;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${params.id}/metadata`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_metadata: { plan } }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Clerk PATCH error:", text);
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("Plan update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
