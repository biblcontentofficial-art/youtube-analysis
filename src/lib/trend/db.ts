/**
 * 트렌드 서치 DB 도우미(서버 전용). 테이블·RPC 는 supabase/migrations/trend_dev.sql.
 *
 * 함정: Supabase(PostgREST)는 한 번에 최대 1,000행만 돌려준다(max-rows). 14일치 breakout_videos(약 5,000행)를
 * select 한 번으로 읽으면 말없이 잘린다(조사 중 실제로 1행만 잡힌 적 있음, research.md 73행).
 * 많은 행은 RPC(집계)로 줄이거나 selectAllPaged 로 range() 를 반복해 읽는다.
 */
import { getSupabase } from "@/lib/supabase";

/** RPC 호출. Supabase 가 없거나(환경 변수 없음) 오류면 빈 배열 */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.rpc(fn, args);
  if (error) {
    console.error(`[trend/db] rpc ${fn} error:`, error.message);
    return [];
  }
  if (data == null) return [];
  return (Array.isArray(data) ? data : [data]) as T[];
}

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

/**
 * range() 를 반복해 끝까지 읽는다. 쿼리 빌더는 한 번 쓰면 다시 못 쓰므로 페이지마다 새로 만드는 함수를 받는다.
 * 순서가 흔들리면 페이지가 겹치거나 빠지므로 빌더에 고유한 order() 를 꼭 넣는다.
 *
 *   const rows = await selectAllPaged((db, from, to) =>
 *     db.from("breakout_videos").select("video_id,snapshot_date").gte("snapshot_date", since)
 *       .order("snapshot_date").order("video_id").range(from, to));
 */
export async function selectAllPaged<T>(
  build: (db: NonNullable<ReturnType<typeof getSupabase>>, from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
  maxRows = 50_000,
): Promise<T[]> {
  const db = getSupabase();
  if (!db) return [];
  const out: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await build(db, from, from + pageSize - 1);
    if (error) {
      console.error("[trend/db] selectAllPaged error:", error.message);
      break;
    }
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}
