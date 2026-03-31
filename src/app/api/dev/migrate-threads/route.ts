/**
 * 임시 마이그레이션 엔드포인트 — threads 테이블 생성
 * 사용 후 삭제할 것
 * GET /api/dev/migrate-threads?secret=CRON_SECRET
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "missing env vars" }, { status: 500 });
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS threads_connections (
      user_id          TEXT NOT NULL PRIMARY KEY,
      access_token     TEXT NOT NULL,
      threads_user_id  TEXT NOT NULL,
      username         TEXT NOT NULL,
      connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_threads_connections_user_id ON threads_connections(user_id)`,
    `ALTER TABLE threads_connections ENABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS saved_threads (
      user_id         TEXT NOT NULL,
      post_id         TEXT NOT NULL,
      text            TEXT,
      media_type      TEXT,
      permalink       TEXT,
      username        TEXT,
      followers_count INTEGER DEFAULT 0,
      like_count      INTEGER DEFAULT 0,
      repost_count    INTEGER DEFAULT 0,
      replies_count   INTEGER DEFAULT 0,
      viral_score     NUMERIC DEFAULT 0,
      published_at    TEXT,
      query           TEXT,
      memo            TEXT,
      is_favorite     BOOLEAN DEFAULT FALSE,
      saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, post_id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_saved_threads_user_id ON saved_threads(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_saved_threads_saved_at ON saved_threads(saved_at DESC)`,
    `ALTER TABLE saved_threads ENABLE ROW LEVEL SECURITY`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!res.ok) {
      // RPC가 없으면 다른 방법 시도
      results.push({ sql: sql.slice(0, 60), ok: false, error: await res.text() });
    } else {
      results.push({ sql: sql.slice(0, 60), ok: true });
    }
  }

  return NextResponse.json({ results });
}
