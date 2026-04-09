"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cnScore } from "@/lib/score-style";
import { teamBadgeClass } from "@/components/live-indicator";
import type { PoolPlayerRow, TeamRow } from "@/types";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "name" | "total";

const TEAM_ORDER = ["CHUCK", "GG", "EMIL", "SKIP", "BHO", "MORC"];

export function TeamStandings({
  teams,
  playersByTeam,
}: {
  teams: TeamRow[];
  playersByTeam: Record<string, PoolPlayerRow[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const toggleRoster = (name: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const sorted = useMemo(() => {
    const list = [...teams];
    list.sort((a, b) => {
      if (sortKey === "rank") {
        return (a.rank ?? 99) - (b.rank ?? 99);
      }
      if (sortKey === "name") {
        return TEAM_ORDER.indexOf(a.name) - TEAM_ORDER.indexOf(b.name);
      }
      return a.total_to_par - b.total_to_par;
    });
    return list;
  }, [teams, sortKey]);

  const toggleSort = (key: SortKey) => setSortKey(key);

  const leaderName = sorted[0]?.name;

  return (
    <>
      <Card className="overflow-hidden border-masters-green/20 shadow-md">
        <CardHeader className="border-b border-masters-green/10 bg-gradient-to-r from-masters-green/5 to-transparent pb-4">
          <CardTitle className="font-display text-2xl text-masters-green">
            Team standings
          </CardTitle>
          <p className="text-sm text-masters-ink/60">
            Team total = sum of each team&apos;s <strong>4 best</strong> (lowest)
            scores of 8. Use the arrow to expand rosters. Click total or → for full
            Today / Thru / Pos. Lowest team total wins.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    className="cursor-pointer w-16"
                    onClick={() => toggleSort("rank")}
                  >
                    Rank
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Team
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => toggleSort("total")}
                  >
                    Total to par
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((t) => {
                  const isLeader = t.name === leaderName;
                  const roster = playersByTeam[t.name] ?? [];
                  const expanded = expandedTeams.has(t.name);
                  return (
                    <TableRow
                      key={t.name}
                      data-state={openTeam === t.name ? "selected" : undefined}
                      className={cn("align-top", isLeader && "bg-emerald-50/80")}
                    >
                      <TableCell className="font-medium">
                        {t.rank ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-masters-green/20 bg-white/90 text-masters-green shadow-sm transition hover:bg-masters-green/10",
                              expanded && "bg-masters-green/10"
                            )}
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? `Hide ${t.name} players`
                                : `Show ${t.name} players`
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoster(t.name);
                            }}
                          >
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                expanded && "rotate-90"
                              )}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <Badge
                              variant="gold"
                              className={cn(
                                "text-white shadow-sm",
                                teamBadgeClass(t.name)
                              )}
                            >
                              {t.name}
                            </Badge>
                            {expanded && <TeamRosterInline rows={roster} />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "cursor-pointer text-right text-lg tabular-nums font-semibold align-top transition hover:opacity-80",
                          cnScore(t.score_display)
                        )}
                        onClick={() => setOpenTeam(t.name)}
                        title="Open full scorecard"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenTeam(t.name);
                          }
                        }}
                      >
                        {t.score_display}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer align-top pt-5 text-masters-ink/40 hover:text-masters-green"
                        onClick={() => setOpenTeam(t.name)}
                        title="Open full scorecard"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenTeam(t.name);
                          }
                        }}
                        aria-label={`Open ${t.name} scorecard`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y divide-masters-green/10">
            {sorted.map((t) => {
              const isLeader = t.name === leaderName;
              const roster = playersByTeam[t.name] ?? [];
              const expanded = expandedTeams.has(t.name);
              return (
                <div
                  key={t.name}
                  className={cn(
                    "px-4 py-4 transition-colors",
                    isLeader && "bg-emerald-50/80"
                  )}
                >
                  <div className="flex w-full items-start gap-2">
                    <button
                      type="button"
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-masters-green/20 bg-white/90 text-masters-green shadow-sm",
                        expanded && "bg-masters-green/10"
                      )}
                      aria-expanded={expanded}
                      aria-label={
                        expanded
                          ? `Hide ${t.name} players`
                          : `Show ${t.name} players`
                      }
                      onClick={() => toggleRoster(t.name)}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expanded && "rotate-90"
                        )}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-[2rem] text-lg font-semibold text-masters-green">
                          {t.rank ?? "—"}
                        </span>
                        <Badge
                          variant="gold"
                          className={cn(
                            "text-white shadow-sm",
                            teamBadgeClass(t.name)
                          )}
                        >
                          {t.name}
                        </Badge>
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded-md px-1 py-1 text-masters-ink/70 hover:bg-masters-green/10 hover:text-masters-green"
                          onClick={() => setOpenTeam(t.name)}
                          aria-label={`Open ${t.name} full scorecard`}
                        >
                          <span
                            className={cn(
                              "text-xl tabular-nums font-semibold",
                              cnScore(t.score_display)
                            )}
                          >
                            {t.score_display}
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0" />
                        </button>
                      </div>
                      {expanded && (
                        <TeamRosterInline rows={roster} className="mt-3 w-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openTeam} onOpenChange={() => setOpenTeam(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-amber-700">
              {openTeam} — players
            </DialogTitle>
          </DialogHeader>
          {openTeam && (
            <PlayerTable rows={playersByTeam[openTeam] ?? []} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function playerTotalDisplay(p: PoolPlayerRow): string {
  if (p.total_to_par === 0) return "E";
  if (p.total_to_par > 0) return `+${p.total_to_par}`;
  return String(p.total_to_par);
}

function TeamRosterInline({
  rows,
  className,
}: {
  rows: PoolPlayerRow[];
  className?: string;
}) {
  const sorted = [...rows].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );
  if (sorted.length === 0) {
    return (
      <p className={cn("mt-2 text-xs text-masters-ink/50", className)}>
        No players in pool yet.
      </p>
    );
  }
  return (
    <ul
      className={cn(
        "mt-2 space-y-1 border-t border-masters-green/10 pt-2 text-xs sm:text-sm",
        className
      )}
    >
      {sorted.map((p) => {
        const td = playerTotalDisplay(p);
        return (
          <li
            key={p.id}
            className="flex items-baseline justify-between gap-2 text-masters-ink/90"
          >
            <span className="min-w-0 break-words font-medium leading-snug">
              {p.full_name}
            </span>
            <span
              className={cn(
                "shrink-0 tabular-nums text-xs font-semibold sm:text-sm",
                cnScore(td)
              )}
            >
              {td}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PlayerTable({ rows }: { rows: PoolPlayerRow[] }) {
  const sorted = [...rows].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-masters-green/15">
      <table className="w-full text-sm">
        <thead className="bg-masters-green text-white">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Player</th>
            <th className="px-2 py-2 text-left font-semibold">Today</th>
            <th className="px-2 py-2 text-left font-semibold">Thru</th>
            <th className="px-2 py-2 text-right font-semibold">Total</th>
            <th className="px-2 py-2 text-right font-semibold">Pos</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const active = p.status === "active";
            const totalDisp = playerTotalDisplay(p);
            return (
              <tr
                key={p.id}
                className={cn(
                  "border-b border-masters-green/10 last:border-0",
                  active && "bg-emerald-50/80"
                )}
              >
                <td className="px-3 py-2 font-medium text-masters-ink">
                  {p.full_name}
                </td>
                <td className={cn("px-2 py-2", cnScore(p.today))}>
                  {p.today}
                </td>
                <td className="px-2 py-2 text-masters-ink/80">{p.thru}</td>
                <td
                  className={cn(
                    "px-2 py-2 text-right tabular-nums",
                    cnScore(totalDisp)
                  )}
                >
                  {totalDisp}
                </td>
                <td className="px-2 py-2 text-right text-masters-ink/80">
                  {p.position}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
