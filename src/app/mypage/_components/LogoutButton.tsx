"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { buttonClass, cx } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-busy={loading || undefined}
      // 처리 중 문구로 바뀌어도 폭이 같게(옆 버튼이 밀리지 않게)
      className={cx(buttonClass({ variant: "secondary" }), "min-w-28")}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
