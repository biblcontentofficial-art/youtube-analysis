"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function NavUser() {
  const { isSignedIn, isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />;
  }

  if (isSignedIn) {
    const initials = (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase();
    const imageUrl = user.imageUrl;

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
      <SignInButton mode="redirect" forceRedirectUrl="/sign-in">
        <button className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition">
          로그인
        </button>
      </SignInButton>
      <SignUpButton mode="redirect" forceRedirectUrl="/sign-in">
        <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-md transition font-medium">
          시작하기
        </button>
      </SignUpButton>
    </div>
  );
}
