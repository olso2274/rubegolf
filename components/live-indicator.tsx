"use client";

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
  loading,
}: {
  lastUpdated: string | null;
  onRefresh: () => void;
  loading?: boolean;
}) {
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
        <span className="text-masters-ink/60">· Updating every 5 min</span>
      </span>
      {lastUpdated && (
        <span className="text-masters-ink/60">
          Last sync:{" "}
          <time dateTime={lastUpdated}>
            {new Date(lastUpdated).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}
