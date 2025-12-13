import { cn } from "../lib/utils";

export default function Badge({ tone = "blue", children }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    gray: "bg-slate-100 text-slate-700 ring-slate-200",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200"
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1", tones[tone] ?? tones.blue)}>
      {children}
    </span>
  );
}
