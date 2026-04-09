"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flower2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { TeamStandings } from "@/components/team-standings";
import { LiveIndicator } from "@/components/live-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import type { PoolPlayerRow, TeamRow } from "@/types";

function groupPlayers(
  players: PoolPlayerRow[]
): Record<string, PoolPlayerRow[]> {
  const map: Record<string, PoolPlayerRow[]> = {};
  for (const p of players) {
    if (!map[p.team_name]) map[p.team_name] = [];
    map[p.team_name].push(p);
  }
  return map;
}

export function LiveBoard({
  initialTeams,
  initialPlayers,
  configError,
}: {
  initialTeams: TeamRow[];
  initialPlayers: PoolPlayerRow[];
  configError?: string | null;
}) {
  const [teams, setTeams] = useState<TeamRow[]>(initialTeams);
  const [players, setPlayers] = useState<PoolPlayerRow[]>(initialPlayers);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(configError ?? null);
  /** Server time from last successful sync; also persisted so refresh keeps the banner accurate. */
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("masters_last_sync");
    } catch {
      return null;
    }
  });

  /** Newest `last_updated` on any pool row (when PGA sync last wrote scores). */
  const databaseUpdatedAt = useMemo(() => {
    if (!players.length) return null;
    const times = players
      .map((p) => new Date(p.last_updated).getTime())
      .filter((t) => Number.isFinite(t));
    if (times.length === 0) return null;
    try {
      return new Date(Math.max(...times)).toISOString();
    } catch {
      return null;
    }
  }, [players]);

  const load = useCallback(async () => {
    if (configError) return;
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const [tRes, pRes] = await Promise.all([
        supabase.from("teams").select("*").order("rank", { ascending: true }),
        supabase.from("pool_players").select("*"),
      ]);
      if (tRes.error) throw tRes.error;
      if (pRes.error) throw pRes.error;
      setTeams((tRes.data as TeamRow[]) ?? []);
      setPlayers((pRes.data as PoolPlayerRow[]) ?? []);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load leaderboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [configError]);

  const syncScores = useCallback(async () => {
    if (configError) return;
    setSyncLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public-scores-sync", { method: "POST" });
      const j = (await res.json()) as {
        ok?: boolean;
        message?: string;
        retryAfterSeconds?: number;
        syncedAt?: string;
      };
      if (res.status === 429) {
        setError(
          j.message ??
            `Wait ${j.retryAfterSeconds ?? ""}s before syncing again.`
        );
        return;
      }
      if (!res.ok) {
        setError(j.message ?? "Score sync failed.");
        return;
      }
      if (!j.ok) {
        const err = j as { message?: string; error?: string };
        setError(
          [err.message ?? "Score sync did not complete.", err.error]
            .filter(Boolean)
            .join(" — ")
        );
        return;
      }
      {
        const iso = j.syncedAt ?? new Date().toISOString();
        setLastSyncedAt(iso);
        try {
          sessionStorage.setItem("masters_last_sync", iso);
        } catch {
          /* ignore quota / private mode */
        }
      }
      await load();
    } catch {
      setError("Score sync request failed.");
    } finally {
      setSyncLoading(false);
    }
  }, [configError, load]);

  useEffect(() => {
    if (configError) return;
    let cancelled = false;
    let supabase: ReturnType<typeof createBrowserSupabase> | null = null;
    try {
      supabase = createBrowserSupabase();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Supabase is not configured in this build (check NEXT_PUBLIC_* env on Vercel and redeploy)."
      );
      return;
    }

    const channel = supabase
      .channel("masters-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          if (!cancelled) void load();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pool_players" },
        () => {
          if (!cancelled) void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [configError, load]);

  const playersByTeam = useMemo(() => groupPlayers(players), [players]);

  if (configError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Configuration required</p>
        <p className="mt-2 text-sm opacity-90">{configError}</p>
        <p className="mt-4 text-sm text-masters-ink/70">
          Data may be delayed — tournament not active, or Supabase env vars are
          missing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-rose-400" aria-hidden />
          <p className="text-sm font-medium text-masters-green/80">
            Live leaderboard
          </p>
        </div>
        <LiveIndicator
          lastSuccessfulSyncAt={lastSyncedAt}
          databaseUpdatedAt={databaseUpdatedAt}
          onRefresh={() => void load()}
          onSyncScores={() => void syncScores()}
          loading={loading}
          syncLoading={syncLoading}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error} — showing last known values when available.
        </p>
      )}

      {teams.length === 0 && !loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <p className="text-center text-sm text-masters-ink/60">
            No teams yet. Seed the database (see README).
          </p>
        </div>
      ) : (
        <TeamStandings teams={teams} playersByTeam={playersByTeam} />
      )}
    </div>
  );
}
