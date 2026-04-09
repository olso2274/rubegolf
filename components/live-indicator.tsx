"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEAM_COLORS: Record<string, string> = {
  CHUCK: "bg-sky-600",
  GG: "bg-violet-600",
  EMIL: "bg-orange-600",
  SKIP: "bg-rose-600",
  BHO: "bg-blue-700",
  MORC: "bg-teal-600",
};

export function teamBadgeClass(name: string) {
  return TEAM_COLORS[name] ?? "bg-masters-green";
}

export function LiveIndicator({
  lastUpdated,
  onRefresh,
  onSyncScores,
  loading,
  syncLoading,
}: {
  lastUpdated: string | null;
  onRefresh: () => void;
  /** Fetch PGA data and write to Supabase (rate-limited) */
  onSyncScores?: () => void;
  loading?: boolean;
  syncLoading?: boolean;
}) {
  /** LiveBoard is client-only (dynamic ssr:false) — safe to format in render; avoids stale labels from useEffect lag. */
  const lastSyncLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-masters-ink/80">
      <span className="inline-flex items-center gap-2 rounded-full border border-masters-green/20 bg-white/80 px-3 py-1 shadow-sm">
        <span
          className="relative flex h-2 w-2"
          aria-hidden
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-medium text-masters-green">Live</span>
        <span className="text-masters-ink/60">
          · Auto-sync via GitHub Actions (optional)
        </span>
      </span>
      {lastUpdated && lastSyncLabel && (
        <span className="text-masters-ink/60">
          Last sync:{" "}
          <time dateTime={lastUpdated}>{lastSyncLabel}</time>
        </span>
      )}
      {onSyncScores && (
        <Button
          type="button"
          variant="gold"
          size="sm"
          onClick={onSyncScores}
          disabled={syncLoading || loading}
          className="gap-2 font-semibold"
        >
          <RefreshCw
            className={cn("h-4 w-4", syncLoading && "animate-spin")}
          />
          Sync scores
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading || syncLoading}
        className="gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        Reload board
      </Button>
    </div>
  );
}
