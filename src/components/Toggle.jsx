import { cn } from "../lib/utils";

export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 select-none cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-7 w-12 rounded-full ring-1 transition",
          checked ? "bg-blue-600 ring-blue-200" : "bg-slate-200 ring-slate-300"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </label>
  );
}
