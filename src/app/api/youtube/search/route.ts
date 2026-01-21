import { NextResponse } from "next/server";
import { searchVideosWithDetails } from "@/lib/youtube";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const maxResults = Number(searchParams.get("maxResults") ?? 12);

  if (!q) {
    return NextResponse.json(
      { error: "Missing query param: q" },
      { status: 400 },
    );
  }

  try {
    const items = await searchVideosWithDetails(q, Math.min(25, maxResults));
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

