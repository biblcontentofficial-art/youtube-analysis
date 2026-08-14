import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { migrateExistingUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";
  const refCode = searchParams.get("ref");

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

  // 마케팅 수신 동의 기록 (로그인 폼의 선택 체크박스 → mkt=1|0)
  // 동의(1)는 항상 갱신, 미동의(0)는 최초 의사표시일 때만 기록 (기존 동의를 조용히 철회하지 않음)
  const mkt = searchParams.get("mkt");
  if (mkt === "1" || mkt === "0") {
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const admin = getSupabase();
      if (admin) {
        if (mkt === "1") {
          await admin
            .from("profiles")
            .update({ marketing_consent: true, marketing_consent_at: new Date().toISOString() })
            .eq("id", data.user.id);
        } else {
          await admin
            .from("profiles")
            .update({ marketing_consent: false, marketing_consent_at: new Date().toISOString() })
            .eq("id", data.user.id)
            .is("marketing_consent_at", null);
        }
      }
    } catch (e) {
      console.error("[Auth Callback] Marketing consent error:", e);
      // 동의 기록 실패해도 로그인은 진행
    }
  }

  // 추천 코드 적용 (쿠키에 저장 → 클라이언트에서 API 호출)
  if (refCode) {
    response.cookies.set("bibl_ref_code", refCode, {
      maxAge: 60 * 60, // 1시간
      path: "/",
      httpOnly: false,
    });
  }

  return response;
}
