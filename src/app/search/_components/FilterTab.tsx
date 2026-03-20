"use client";

import Link from "next/link";
import { useNavigationLoading } from "@/app/_components/NavigationLoader";

interface Props {
  href: string;
  active: boolean;
  label: string;
}

export default function FilterTab({ href, active, label }: Props) {
  const { showLoading } = useNavigationLoading();

  return (
    <Link
      href={href}
      onClick={() => { if (!active) showLoading("필터 적용 중..."); }}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-teal-600 text-white"
          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}
