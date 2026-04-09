"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEAM_COLORS: Record<string, string> = {
  Skip: "bg-sky-600",
  Morc: "bg-violet-600",
  GG: "bg-masters-green",
  Emil: "bg-rose-600",
  Chuck: "bg-blue-700",
  Bho: "bg-teal-600",
};

export function teamBadgeClass(name: string) {
  return TEAM_COLORS[name] ?? "bg-masters-green";
}

export function LiveIndicator({
  lastSuccessfulSyncAt,
  databaseUpdatedAt,
  onRefresh,
  onSyncScores,
  loading,
  syncLoading,
}: {
  /** Set only after a successful POST /api/public-scores-sync (or sessionStorage restore). */
  lastSuccessfulSyncAt: string | null;
  /** Max of pool_players.last_updated — reflects last DB write from a sync. */
  databaseUpdatedAt: string | null;
  onRefresh: () => void;
  /** Fetch PGA data and write to Supabase (rate-limited) */
  onSyncScores?: () => void;
  loading?: boolean;
  syncLoading?: boolean;
}) {
  /**
   * “Last sync” only when we have a successful client-visible sync time.
   * Otherwise “Data as of” so we don’t imply the Sync button worked when PGA has no event.
   */
  const { label, iso } = useMemo(() => {
    if (lastSuccessfulSyncAt) {
      return { label: "Last sync", iso: lastSuccessfulSyncAt } as const;
    }
    if (databaseUpdatedAt) {
      return { label: "Data as of", iso: databaseUpdatedAt } as const;
    }
    return { label: null, iso: null } as const;
  }, [lastSuccessfulSyncAt, databaseUpdatedAt]);

  const timeLabel = useMemo(() => {
    if (!iso) return null;
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [iso]);

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
      {label && iso && timeLabel && (
        <span className="text-masters-ink/60">
          {label}: <time dateTime={iso}>{timeLabel}</time>
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
