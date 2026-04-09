import { applyOverride, normalizePlayerName } from "./normalize";
import type { LeaderboardPlayer } from "@/types";

/** Build lookup: normalized key → first matching leaderboard row */
export function buildLeaderboardMap(
  players: LeaderboardPlayer[]
): Map<string, LeaderboardPlayer> {
  const map = new Map<string, LeaderboardPlayer>();
  for (const p of players) {
    if (!map.has(p.normalizedKey)) map.set(p.normalizedKey, p);
  }
  return map;
}

export function findLeaderboardRow(
  poolFullName: string,
  map: Map<string, LeaderboardPlayer>
): LeaderboardPlayer | undefined {
  const key = applyOverride(normalizePlayerName(poolFullName));
  let row = map.get(key);
  if (row) return row;
  const base = normalizePlayerName(poolFullName);
  row = map.get(base);
  return row;
}
