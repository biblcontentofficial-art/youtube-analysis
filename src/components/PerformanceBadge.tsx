export default function PerformanceBadge({ score }: { score: "Good" | "Normal" | "Bad" }) {
  const colors = {
    Good: "bg-green-500/20 text-green-400 border-green-500/50",
    Normal: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    Bad: "bg-red-500/20 text-red-400 border-red-500/50",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[score] || colors.Normal}`}>
      {score}
    </span>
  );
}