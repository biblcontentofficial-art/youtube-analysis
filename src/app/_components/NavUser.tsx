"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

/** 네비 '시작하기' 보조 버튼(DESIGN 6.5 secondary, 높이 44px · 1280 이상 36px) */
const NAV_START_BUTTON =
  "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-control border border-line-strong bg-surface px-4 text-body-sm font-semibold text-fg transition-colors duration-150 hover:border-line-hover hover:bg-surface-2 nav:h-9";

/**
 * 네비 오른쪽의 로그인 상태 표시(DESIGN 6.2). 인증 확인은 이 클라이언트 잎에서만 한다
 * (루트 레이아웃에서 auth()·cookies() 를 부르면 사이트 전체가 동적 렌더로 떨어진다).
 */
export function useSessionUser(): { user: User | null; loaded: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // getSession()은 로컬 스토리지에서 즉시 읽으므로 빠름 (UI 표시용)
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoaded(true);
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        setUser(session?.user ?? null);
        setLoaded(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loaded };
}

/** 로그인 확인 전 자리. 로그아웃 버튼 묶음과 같은 폭의 빈 칸(펄스 없음) */
export function NavUserPlaceholder() {
  return <span aria-hidden="true" className="block h-11 w-[84px] nav:h-9 nav:w-[152px]" />;
}

/** 로그아웃 상태: 로그인(고스트, 1280 이상만) + 시작하기(보조 버튼). 첫 화면의 흰 면은 검색창 하나라 보조로 둔다 */
export function NavAuthLinks() {
  return (
    <>
      <Link
        href="/sign-in"
        className="hidden h-9 items-center whitespace-nowrap rounded-control px-3 text-body-sm font-medium text-fg-2 transition-colors duration-150 hover:text-fg nav:inline-flex"
      >
        로그인
      </Link>
      <Link
        href="/sign-in"
        className={NAV_START_BUTTON}
      >
        시작하기
      </Link>
    </>
  );
}

/** 로그인 상태: 아바타(누름 영역 44px). 누르면 마이페이지 */
export function NavAvatar({ user }: { user: User }) {
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const initials = (
    user.user_metadata?.full_name?.[0] ||
    user.user_metadata?.name?.[0] ||
    user.email?.[0] ||
    "U"
  ).toUpperCase();
  // Google: avatar_url 또는 picture, Kakao: avatar_url 또는 picture
  const imageUrl = user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.user_metadata?.profile_image;

  return (
    <Link
      href="/mypage"
      aria-label="마이페이지"
      className="group inline-flex size-11 shrink-0 items-center justify-center rounded-full"
    >
      <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-surface-3 transition-opacity group-hover:opacity-80">
        {imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover"
            onError={handleImgError}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span aria-hidden="true" className="text-caption font-bold text-fg-1">{initials}</span>
        )}
      </span>
    </Link>
  );
}

/**
 * 오른쪽 사용자 칸. 확인 전 = 같은 폭 자리, 로그인 = 아바타, 로그아웃 = 로그인·시작하기.
 * hideAuthLinks: 로그인·가입 화면에서는 로그인·시작하기를 숨긴다.
 */
export default function NavUser({
  user,
  loaded,
  hideAuthLinks = false,
}: {
  user: User | null;
  loaded: boolean;
  hideAuthLinks?: boolean;
}) {
  if (!loaded) return hideAuthLinks ? null : <NavUserPlaceholder />;
  if (user) return <NavAvatar user={user} />;
  if (hideAuthLinks) return null;
  return <NavAuthLinks />;
}
