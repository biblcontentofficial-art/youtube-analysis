import { NextResponse } from "next/server";
import { getSearchUsage } from "@/lib/searchLimit";

export async function GET() {
  const usage = await getSearchUsage();
  return NextResponse.json(usage);
}
