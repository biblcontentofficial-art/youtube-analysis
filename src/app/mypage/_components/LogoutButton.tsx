"use client";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button
      onClick={() => signOut(() => router.push("/"))}
      className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition text-sm font-medium"
    >
      로그아웃
    </button>
  );
}
