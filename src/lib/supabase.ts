/**
 * Supabase 클라이언트 (서버 전용 - Service Role Key 사용)
 * 환경변수 없으면 null 반환 → DB 연동 없이도 서비스 정상 동작
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  _supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _supabase;
}
