import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["bibl.content.official@gmail.com"];

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  plan: string;
  createdAt: number;
  lastActiveAt: number | null;
};

export async function GET() {
  // Check if the requesting user is an admin
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch users from Clerk Backend API
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.clerk.com/v1/users?limit=100&order_by=-created_at", {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Clerk API error:", text);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const clerkUsers = await response.json();

    const users: AdminUser[] = clerkUsers.map((u: Record<string, unknown>) => {
      const emailAddresses = u.email_addresses as Array<{ email_address: string }> | undefined;
      const publicMetadata = (u.public_metadata as Record<string, unknown>) ?? {};
      return {
        id: u.id as string,
        email: emailAddresses?.[0]?.email_address ?? "",
        firstName: (u.first_name as string | null) ?? null,
        lastName: (u.last_name as string | null) ?? null,
        plan: (publicMetadata.plan as string) ?? "free",
        createdAt: u.created_at as number,
        lastActiveAt: (u.last_active_at as number | null) ?? null,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
