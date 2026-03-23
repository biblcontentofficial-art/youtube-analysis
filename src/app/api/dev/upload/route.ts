import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const dest = (formData.get("dest") as string) || "studio";

  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 저장 경로: public/{dest}/{originalName}
  const dir = path.join(process.cwd(), "public", dest);
  fs.mkdirSync(dir, { recursive: true });

  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, buffer);

  const publicUrl = `/${dest}/${fileName}`;
  return NextResponse.json({ url: publicUrl });
}
