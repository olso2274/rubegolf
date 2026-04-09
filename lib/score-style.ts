import { cn } from "@/lib/utils";

/** Styling for stroke totals relative to par (display string or numeric) */
export function scoreTextClass(value: string | number): string {
  const s = String(value).trim().toUpperCase();
  if (s === "—" || s === "-" || s === "") return "text-zinc-500";
  if (s === "E" || s === "EVEN") return "text-zinc-600";
  if (s.startsWith("-")) return "text-emerald-600 font-semibold";
  if (s.startsWith("+")) return "text-red-600 font-semibold";
  const n = typeof value === "number" ? value : parseInt(s, 10);
  if (!Number.isNaN(n)) {
    if (n < 0) return "text-emerald-600 font-semibold";
    if (n > 0) return "text-red-600 font-semibold";
    return "text-zinc-600";
  }
  return "text-zinc-700";
}

export function cnScore(value: string | number, className?: string) {
  return cn(scoreTextClass(value), className);
}
