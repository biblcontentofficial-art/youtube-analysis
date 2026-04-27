import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
const VALID_PLANS = ["free", "starter", "pro", "business", "admin", "team"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = user.email ?? "";
  if (!isAdmin({ email, plan: user.plan })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const { updateUserPlan } = await import("@/lib/auth");
    await updateUserPlan(params.id, plan);
    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("Plan update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
