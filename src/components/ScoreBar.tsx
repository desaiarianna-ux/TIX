type Props = { label: string; score: number; color: "blue" | "rose" };

export function ScoreBar({ label, score, color }: Props) {
  const barColor = color === "blue" ? "bg-blue-600" : "bg-rose-600";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-xl font-bold">{score}</p>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-200">
        <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
