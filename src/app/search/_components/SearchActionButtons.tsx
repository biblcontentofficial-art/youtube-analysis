"use client";

interface ActionButtonProps {
  label: string;
  icon: string;
  event?: string;
}

export function ActionButton({ label, icon, event }: ActionButtonProps) {
  const handleClick = () => {
    if (event) window.dispatchEvent(new Event(event));
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
