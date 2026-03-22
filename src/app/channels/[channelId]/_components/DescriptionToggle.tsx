"use client";
import { useState } from "react";

export default function DescriptionToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const SHORT = 120;
  const isLong = text.length > SHORT;
  const shown = expanded || !isLong ? text : text.slice(0, SHORT) + "…";

  return (
    <div className="space-y-1">
      <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{shown}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-teal-400 hover:text-teal-300 transition"
        >
          {expanded ? "접기 ↑" : "더 보기 ↓"}
        </button>
      )}
    </div>
  );
}
