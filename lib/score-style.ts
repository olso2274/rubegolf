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

/**
 * Spreadsheet-style cell background for Today / Total columns (stroke play).
 * CUT / status words get neutral fill; over par red-tint, under par blue-tint.
 */
export function scoreCellBgClass(value: string): string {
  const raw = String(value).trim();
  const s = raw.toUpperCase();
  if (s === "—" || s === "-" || s === "–" || raw === "")
    return "bg-white text-zinc-800";
  if (s === "CUT" || s === "MC" || s === "WD" || s === "DQ" || s === "DNS")
    return "bg-zinc-100 text-zinc-900 font-semibold";
  if (s === "E" || s === "EVEN" || s === "0" || s === "+0")
    return "bg-white text-zinc-800";
  if (s.startsWith("-")) return "bg-sky-100 text-sky-900 font-semibold";
  if (s.startsWith("+")) return "bg-red-100 text-red-900 font-semibold";
  const n = parseInt(s.replace(/[^\d+-]/g, ""), 10);
  if (!Number.isNaN(n)) {
    if (n < 0) return "bg-sky-100 text-sky-900 font-semibold";
    if (n > 0) return "bg-red-100 text-red-900 font-semibold";
    return "bg-white text-zinc-800";
  }
  return "bg-white text-zinc-800";
}
