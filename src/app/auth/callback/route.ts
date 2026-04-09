import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { migrateExistingUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[Auth Callback] Error:", error?.message);
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  // 신규 유저인 경우 기존 Clerk 데이터 마이그레이션
  try {
    await migrateExistingUser(data.user.id, data.user.email ?? "");
  } catch (e) {
    console.error("[Auth Callback] Migration error:", e);
    // 마이그레이션 실패해도 로그인은 진행
  }

  return response;
}
