"use client";
import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

export default function DescriptionToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (!text) return null;

  const SHORT = 120;
  const isLong = text.length > SHORT;
  const shown = expanded || !isLong ? text : text.slice(0, SHORT) + "…";

  return (
    <div>
      <p id={id} className="whitespace-pre-wrap text-body-sm text-fg-2 wrap-anywhere md:text-ui">{shown}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={id}
          className="mt-1 inline-flex h-11 items-center gap-1 text-body-sm font-semibold text-fg transition-colors hover:text-fg-2"
        >
          {expanded ? "접기" : "더 보기"}
          <ChevronDownIcon size={16} className={`text-fg-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
