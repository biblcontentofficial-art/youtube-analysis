"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition text-sm font-medium"
    >
      로그아웃
    </button>
  );
}
