"use client";

import Link from "next/link";

interface Props {
  current: string;
}

const TABS = [
  { key: "analytics", label: "내 계정 분석", icon: "chart" },
  { key: "saved", label: "수집함", icon: "folder" },
] as const;

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";
  switch (type) {
    case "chart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "folder":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ThreadsTabNav({ current }: Props) {
  return (
    <div className="flex gap-1 border-b border-gray-800">
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/threads?tab=${tab.key}`}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${
              active
                ? "border-teal-500 text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700"
            }`}
          >
            <TabIcon type={tab.icon} active={active} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
