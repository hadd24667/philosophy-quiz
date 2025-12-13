import { cn } from "../lib/utils";

export default function Button({ className, variant = "primary", size = "md", ...props }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
    secondary: "bg-white text-slate-900 hover:bg-slate-50 ring-1 ring-slate-200 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200"
  };
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-base" };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-soft transition outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className
      )}
      {...props}
    />
  );
}
