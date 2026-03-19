"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export default function NavUser() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />;
  }

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition">
          로그인
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-md transition font-medium">
          시작하기
        </button>
      </SignUpButton>
    </div>
  );
}
