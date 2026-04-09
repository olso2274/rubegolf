/** Shared types for Masters Pool leaderboard */

export interface TeamRow {
  id: number;
  name: string;
  rank: number | null;
  total_to_par: number;
  score_display: string;
}

export interface PoolPlayerRow {
  id: number;
  team_name: string;
  full_name: string;
  pga_id: string | null;
  today: string;
  thru: string;
  total_to_par: number;
  position: string;
  status: string;
  last_updated: string;
}

export interface LeaderboardPlayer {
  fullName: string;
  normalizedKey: string;
  today: string;
  thru: string;
  totalToPar: number | null;
  position: string;
  status: string;
  /** true if player made cut / still active in tournament context */
  isActive: boolean;
}

export interface UpdateScoresResult {
  ok: boolean;
  message: string;
  tournamentId?: string;
  playersUpdated?: number;
  teamsUpdated?: number;
  error?: string;
  /** Seconds until another public sync is allowed (HTTP 429) */
  retryAfterSeconds?: number;
}
