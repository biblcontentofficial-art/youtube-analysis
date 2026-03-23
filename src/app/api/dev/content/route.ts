import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// dev 환경에서만 동작
const CONTENT_PATH = path.join(process.cwd(), "src/app/studio/studio-content.json");

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const raw = fs.readFileSync(CONTENT_PATH, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const body = await req.json();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
