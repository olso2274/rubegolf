import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceSupabase } from "@/lib/supabase";
import {
  fetchCurrentTournamentId,
  fetchLeaderboard,
  scoreDisplayFromTotal,
} from "@/lib/pga";
import { buildLeaderboardMap, findLeaderboardRow } from "@/lib/matching";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import type { UpdateScoresResult } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function verifyCronOrAdmin(request: Request): Promise<boolean> {
  const cron = process.env.CRON_SECRET;
  if (cron) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${cron}`) return true;
    if (request.headers.get("x-cron-secret") === cron) return true;
  }
  const jar = await cookies();
  if (isValidAdminCookie(jar.get(ADMIN_COOKIE_NAME)?.value)) return true;
  if (process.env.NODE_ENV === "development" && !cron) return true;
  return false;
}

async function runUpdate(): Promise<UpdateScoresResult> {
  let supabase;
  try {
    supabase = createServiceSupabase();
  } catch (e) {
    return {
      ok: false,
      message: "Supabase not configured",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const tid = await fetchCurrentTournamentId();
  if (!tid) {
    return {
      ok: false,
      message: "No active tournament id from PGA (tournament may not be live)",
    };
  }

  let leaderboard;
  try {
    leaderboard = await fetchLeaderboard(tid);
  } catch (e) {
    return {
      ok: false,
      message: "Leaderboard fetch failed — showing last synced data",
      tournamentId: tid,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const map = buildLeaderboardMap(leaderboard);

  const { data: poolRows, error: poolErr } = await supabase
    .from("pool_players")
    .select("id, full_name, team_name");

  if (poolErr || !poolRows?.length) {
    return {
      ok: false,
      message: "Could not load pool players from database",
      tournamentId: tid,
      error: poolErr?.message ?? "empty pool",
    };
  }

  let playersUpdated = 0;
  const teamTotals = new Map<string, number>();

  for (const row of poolRows) {
    const lb = findLeaderboardRow(row.full_name, map);
    const totalToPar = lb?.totalToPar ?? 0;
    const today = lb?.today ?? "—";
    const thru = lb?.thru ?? "—";
    const position = lb?.position ?? "—";
    const status = lb
      ? lb.isActive
        ? "active"
        : lb.status || "inactive"
      : "pending";

    const { error: upErr } = await supabase
      .from("pool_players")
      .update({
        today,
        thru,
        total_to_par: lb?.totalToPar ?? 0,
        position,
        status,
        last_updated: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!upErr) playersUpdated++;

    teamTotals.set(
      row.team_name,
      (teamTotals.get(row.team_name) ?? 0) + totalToPar
    );
  }

  const { data: teams } = await supabase.from("teams").select("name");

  let teamsUpdated = 0;
  const list = teams ?? [];
  const scored = list
    .map((t) => {
      const total = teamTotals.get(t.name) ?? 0;
      return { name: t.name, total_to_par: total };
    })
    .sort((a, b) => a.total_to_par - b.total_to_par);

  for (let i = 0; i < scored.length; i++) {
    const t = scored[i];
    const { error } = await supabase
      .from("teams")
      .update({
        rank: i + 1,
        total_to_par: t.total_to_par,
        score_display: scoreDisplayFromTotal(t.total_to_par),
      })
      .eq("name", t.name);
    if (!error) teamsUpdated++;
  }

  return {
    ok: true,
    message: "Scores updated",
    tournamentId: tid,
    playersUpdated,
    teamsUpdated,
  };
}

export async function GET(request: Request) {
  if (!(await verifyCronOrAdmin(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const result = await runUpdate();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await verifyCronOrAdmin(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const result = await runUpdate();
  return NextResponse.json(result);
}
