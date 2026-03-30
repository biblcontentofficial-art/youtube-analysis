"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "all",   label: "전체" },
  { key: "text",  label: "텍스트" },
  { key: "image", label: "이미지" },
  { key: "video", label: "영상" },
] as const;

type FilterKey = (typeof TABS)[number]["key"];

interface Props {
  current: FilterKey;
}

export default function ThreadsFilterTab({ current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(key: FilterKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", key);
    router.push(`/threads?${params.toString()}`);
  }

  return (
    <div className="flex gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            current === tab.key
              ? "bg-teal-500 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
