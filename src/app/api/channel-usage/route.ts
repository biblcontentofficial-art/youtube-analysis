import { NextResponse } from "next/server";
import { getChannelUsage } from "@/lib/channelLimit";

export async function GET() {
  const usage = await getChannelUsage();
  return NextResponse.json(usage);
}
