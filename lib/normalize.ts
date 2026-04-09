/**
 * Normalize player names for matching pool ↔ PGA leaderboard data.
 */

export function normalizePlayerName(name: string): string {
  const trimmed = name.trim();
  const nfd = trimmed.normalize("NFD").replace(/\p{M}/gu, "");
  return nfd.toLowerCase().replace(/\s+/g, " ");
}

/** Optional manual overrides when PGA display differs from draft spelling */
export const NAME_MATCH_OVERRIDES: Record<string, string> = {
  // normalized pool key → normalized PGA key (if different)
  "j.j. spaun": "j j spaun",
  "jj spaun": "j j spaun",
};

export function applyOverride(normalizedPoolKey: string): string {
  return NAME_MATCH_OVERRIDES[normalizedPoolKey] ?? normalizedPoolKey;
}
