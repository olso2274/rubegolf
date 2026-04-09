/** Placeholder while LiveBoard loads client-only (avoids hydration issues with extensions/Radix). */
export function LiveBoardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="h-6 w-40 rounded bg-masters-green/15" />
        <div className="h-9 w-72 max-w-full rounded-md bg-masters-green/10" />
      </div>
      <div className="h-64 w-full rounded-xl border border-masters-green/15 bg-white/50" />
    </div>
  );
}
