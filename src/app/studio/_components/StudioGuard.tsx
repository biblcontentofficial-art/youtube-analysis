"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioGuard() {
  const router = useRouter();

  useEffect(() => {
    const hasCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("studio_access="));
    if (!hasCookie) {
      router.replace("/");
    }
  }, [router]);

  return null;
}
