import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabase } from "@/lib/supabase";
import {
  fetchCurrentTournamentId,
  fetchLeaderboard,
  scoreDisplayFromTotal,
} from "@/lib/pga";
import { buildLeaderboardMap, findLeaderboardRow } from "@/lib/matching";
import type { UpdateScoresResult } from "@/types";

/** Count best ball scores per team (Masters-style: 4 lowest of 8). */
const BEST_BALL_COUNT = 4;

/**
 * Value used when ordering players to pick the "best" scores for the team total.
 * Lower is better in stroke play. Unmatched players sort last.
 */
function totalForBestBallRanking(totalToPar: number, status: string): number {
  if (status === "pending") return Number.POSITIVE_INFINITY;
  return totalToPar;
}

/** Sum of the `take` lowest (best) finite scores among the team's players. */
function teamTotalFromBestScores(
  scores: number[],
  take: number = BEST_BALL_COUNT
): number {
  const finite = scores.filter(
    (x) => typeof x === "number" && Number.isFinite(x) && x < Number.POSITIVE_INFINITY
  );
  if (finite.length === 0) return 0;
  finite.sort((a, b) => a - b);
  const n = Math.min(take, finite.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += finite[i];
  return sum;
}

export async function runScoreUpdate(): Promise<UpdateScoresResult> {
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
  const teamScoreLists = new Map<string, number[]>();

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

    const rankingScore = totalForBestBallRanking(totalToPar, status);
    const list = teamScoreLists.get(row.team_name) ?? [];
    list.push(rankingScore);
    teamScoreLists.set(row.team_name, list);
  }

  const teamTotals = new Map<string, number>();
  for (const [name, scores] of teamScoreLists) {
    teamTotals.set(
      name,
      teamTotalFromBestScores(scores, BEST_BALL_COUNT)
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

const SETTINGS_KEY = "last_public_sync";

export function getPublicSyncCooldownMs(): number {
  const s = parseInt(process.env.PUBLIC_SYNC_COOLDOWN_SECONDS ?? "300", 10);
  return (Number.isFinite(s) && s > 0 ? s : 300) * 1000;
}

/** Returns true if public sync is allowed (cooldown passed). Sets lock timestamp on success path by caller. */
export async function checkPublicSyncCooldown(
  supabase: SupabaseClient
): Promise<
  | { ok: true; lastAt: number }
  | { ok: false; message: string; retryAfterSeconds: number }
> {
  const cooldown = getPublicSyncCooldownMs();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message:
        "Sync lock not configured. Run the app_settings SQL in Supabase (see README).",
      retryAfterSeconds: 0,
    };
  }

  const raw = data?.value;
  const lastAt = raw ? new Date(raw).getTime() : 0;
  const elapsed = Date.now() - lastAt;
  if (elapsed < cooldown) {
    const retryAfterSeconds = Math.ceil((cooldown - elapsed) / 1000);
    return {
      ok: false,
      message: `Please wait ${retryAfterSeconds}s before syncing again.`,
      retryAfterSeconds,
    };
  }
  return { ok: true, lastAt };
}

export async function recordPublicSyncTime(
  supabase: SupabaseClient
): Promise<void> {
  const iso = new Date().toISOString();
  await supabase.from("app_settings").upsert(
    { key: SETTINGS_KEY, value: iso },
    { onConflict: "key" }
  );
}
