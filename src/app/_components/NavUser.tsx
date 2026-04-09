"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export default function NavUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoaded(true);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />;
  }

  if (user) {
    const initials = (
      user.user_metadata?.full_name?.[0] ||
      user.user_metadata?.name?.[0] ||
      user.email?.[0] ||
      "U"
    ).toUpperCase();
    const imageUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    return (
      <Link href="/mypage" className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 hover:border-teal-500 transition flex items-center justify-center bg-gray-800">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="프로필" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-xs font-bold">{initials}</span>
        )}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a href="/sign-in" className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition">
        로그인
      </a>
      <a href="/sign-in" className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-md transition font-medium">
        시작하기
      </a>
    </div>
  );
}
