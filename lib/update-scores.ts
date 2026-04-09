import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabase } from "@/lib/supabase";
import {
  fetchCurrentTournamentId,
  fetchLeaderboard,
  scoreDisplayFromTotal,
} from "@/lib/pga";
import { buildLeaderboardMap, findLeaderboardRow } from "@/lib/matching";
import type { UpdateScoresResult } from "@/types";

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
