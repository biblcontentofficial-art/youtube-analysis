import { getTrendingRefreshUsage } from "@/lib/trendingLimit";

export async function GET() {
  const result = await getTrendingRefreshUsage();
  return Response.json(result);
}
