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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cnScore, scoreCellBgClass } from "@/lib/score-style";
import { teamBadgeClass } from "@/components/live-indicator";
import type { PoolPlayerRow, TeamRow } from "@/types";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "name" | "total";

const TEAM_ORDER = [
  "Skip",
  "Morc",
  "GG",
  "Emil",
  "Chuck",
  "Bho",
];

const TOP_PAYOUTS = [
  {
    label: "Low Team Winner",
    team: "GG",
    amount: "$155",
    detail: "Team score -36",
  },
  {
    label: "2nd Low Team",
    team: "Chuck",
    amount: "$50",
    detail: "Team score -30",
  },
  {
    label: "Best Golfer Team",
    team: "Chuck",
    amount: "$60",
    detail: "Rory score -12",
  },
];

const LOW_ROUND_PAYOUTS = [
  { team: "GG", detail: "$5 Burns Thursday" },
  { team: "Chuck", detail: "+$5 Rory Thursday, +$10 Rory Friday" },
  { team: "Skip", detail: "$5 Scheffler Saturday" },
  { team: "Bho", detail: "$5 Young Saturday" },
  { team: "Emil", detail: "$5 Hatton Sunday" },
  { team: "Morc", detail: "$5 Woodland Sunday" },
];

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

  /** Summary order: always by score (lowest first), with tie labels T2, T3, … */
  const summaryRows = useMemo(() => {
    const list = [...teams].sort((a, b) => a.total_to_par - b.total_to_par);
    const rows: { rankLabel: string; team: TeamRow; isLeader: boolean }[] = [];
    let i = 0;
    while (i < list.length) {
      const score = list[i].total_to_par;
      let j = i + 1;
      while (j < list.length && list[j].total_to_par === score) j++;
      const rankStart = i + 1;
      const tied = j - i > 1;
      const rankLabel = tied ? `T${rankStart}` : String(rankStart);
      for (let k = i; k < j; k++) {
        rows.push({
          rankLabel,
          team: list[k],
          isLeader: i === 0,
        });
      }
      i = j;
    }
    return rows;
  }, [teams]);

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
            scores of 8 (CUT players don&apos;t count).{" "}
            <strong>Today</strong> and <strong>Thru</strong> sync from the PGA Tour
            feed when scores update. Expand a team for the full scorecard; click the
            team total or → for a larger view.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-amber-200/60 bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30 px-4 py-5 md:px-6">
            <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-masters-green md:text-xl">
              Team summary
            </h3>
            <div className="overflow-x-auto rounded-lg border border-masters-green/15 bg-white/90 shadow-inner">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b border-masters-green/20 bg-masters-green text-left text-white">
                    <th className="px-3 py-2.5 font-semibold md:px-4">Rank</th>
                    <th className="px-3 py-2.5 font-semibold md:px-4">Team</th>
                    <th className="px-3 py-2.5 text-right font-semibold md:px-4">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-masters-ink/50"
                      >
                        No team data yet.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map(({ rankLabel, team: t, isLeader }) => (
                      <tr
                        key={t.name}
                        className={cn(
                          "border-b border-masters-green/10 transition-colors",
                          isLeader && "bg-emerald-50/90"
                        )}
                      >
                        <td className="px-3 py-2.5 font-semibold text-masters-green tabular-nums md:px-4">
                          {rankLabel}
                        </td>
                        <td className="px-3 py-2.5 md:px-4">
                          <Badge
                            variant="gold"
                            className={cn(
                              "text-white shadow-sm",
                              teamBadgeClass(t.name)
                            )}
                          >
                            {t.name}
                          </Badge>
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2.5 text-right text-lg font-bold tabular-nums md:px-4",
                            cnScore(t.score_display)
                          )}
                        >
                          {t.score_display}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-b border-amber-200/50 bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/20 px-4 py-5 md:px-6">
            <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-masters-green md:text-xl">
              Payouts
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-amber-200/70 bg-amber-50/80 p-4">
                <h4 className="font-display text-base font-semibold text-masters-green">
                  Top payouts
                </h4>
                <div className="mt-3 space-y-2">
                  {TOP_PAYOUTS.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-3 rounded-md bg-white/80 px-3 py-2 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-masters-ink">
                          {item.label}: <span className="text-masters-green">{item.team}</span>
                        </p>
                        <p className="text-xs text-masters-ink/60">{item.detail}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-masters-green">
                        {item.amount}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-masters-ink/60">
                  Chuck total payout: $125
                </p>
              </div>

              <div className="rounded-lg border border-masters-green/15 bg-white/90 p-4 shadow-inner">
                <h4 className="font-display text-base font-semibold text-masters-green">
                  Low rounds
                </h4>
                <div className="mt-3 space-y-2">
                  {LOW_ROUND_PAYOUTS.map((item) => (
                    <div
                      key={`${item.team}-${item.detail}`}
                      className="flex items-start justify-between gap-3 rounded-md border border-masters-green/10 px-3 py-2"
                    >
                      <Badge
                        variant="gold"
                        className={cn("text-white shadow-sm", teamBadgeClass(item.team))}
                      >
                        {item.team}
                      </Badge>
                      <p className="min-w-0 flex-1 text-right text-sm text-masters-ink/80">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-2 pt-4 text-xs font-medium uppercase tracking-wide text-masters-ink/50 md:px-6">
            Rosters & detail
          </div>

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
                    Score
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
                            {expanded && (
                              <TeamScorecardTable
                                rows={roster}
                                teamName={t.name}
                                teamScoreDisplay={t.score_display}
                              />
                            )}
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
                        <TeamScorecardTable
                          rows={roster}
                          teamName={t.name}
                          teamScoreDisplay={t.score_display}
                        />
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
            <DialogDescription className="sr-only">
              Full team roster with today, thru, and total scores.
            </DialogDescription>
          </DialogHeader>
          {openTeam && (
            <TeamScorecardTable
              rows={playersByTeam[openTeam] ?? []}
              teamScoreDisplay={
                teams.find((x) => x.name === openTeam)?.score_display ?? "E"
              }
              hideTeamBanner
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function dashDisplay(s: string): string {
  const t = s.trim();
  if (t === "—" || t === "") return "-";
  return s;
}

function sortPoolByName(rows: PoolPlayerRow[]): PoolPlayerRow[] {
  return [...rows].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

function playerTotalDisplay(p: PoolPlayerRow): string {
  const st = (p.status || "").toLowerCase();
  if (st === "pending") return "—";
  if (st === "cut" || st === "mc") return "CUT";
  if (p.total_to_par === 0) return "E";
  if (p.total_to_par > 0) return `+${p.total_to_par}`;
  return String(p.total_to_par);
}

function TeamScorecardTable({
  rows,
  teamName,
  teamScoreDisplay,
  hideTeamBanner = false,
}: {
  rows: PoolPlayerRow[];
  /** Shown in the light-green banner above the column headers (omit when `hideTeamBanner`). */
  teamName?: string;
  teamScoreDisplay: string;
  hideTeamBanner?: boolean;
}) {
  const sorted = sortPoolByName(rows);
  if (sorted.length === 0) {
    return (
      <p className="mt-2 text-xs text-masters-ink/50">
        No players in pool yet.
      </p>
    );
  }
  return (
    <div className="mt-3 w-full overflow-x-auto rounded-md border border-masters-green/25 bg-white shadow-sm">
      <table className="w-full min-w-[300px] text-sm">
        <thead>
          {!hideTeamBanner && teamName && (
            <tr className="bg-emerald-100">
              <th
                colSpan={4}
                className="px-3 py-2 text-left font-bold uppercase tracking-wide text-masters-green"
              >
                {teamName}
              </th>
            </tr>
          )}
          <tr className="border-b border-masters-green/20 bg-masters-green text-left text-white">
            <th className="px-2 py-2 pl-3 font-semibold">Player</th>
            <th className="px-2 py-2 text-center font-semibold">Today</th>
            <th className="px-2 py-2 text-center font-semibold">Thru</th>
            <th className="px-2 py-2 pr-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const totalDisp = playerTotalDisplay(p);
            const todayDisp = dashDisplay(p.today);
            const thruDisp = dashDisplay(p.thru);
            return (
              <tr key={p.id} className="border-b border-masters-green/10">
                <td className="px-2 py-1.5 pl-3 font-medium text-masters-ink">
                  {p.full_name}
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 text-center tabular-nums",
                    scoreCellBgClass(todayDisp)
                  )}
                >
                  {todayDisp}
                </td>
                <td className="px-2 py-1.5 text-center tabular-nums text-masters-ink/80">
                  {thruDisp}
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 pr-3 text-right tabular-nums font-medium",
                    scoreCellBgClass(totalDisp)
                  )}
                >
                  {totalDisp}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-masters-green/30">
            <td
              colSpan={3}
              className="px-2 py-2 pl-3 text-right text-xs font-semibold uppercase tracking-wide text-masters-ink/70"
            >
              Best 4 of 8 (total)
            </td>
            <td
              className={cn(
                "px-2 py-2 pr-3 text-right text-lg font-bold tabular-nums md:text-xl",
                "bg-yellow-300 text-masters-ink shadow-inner",
                cnScore(teamScoreDisplay)
              )}
            >
              {teamScoreDisplay}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
