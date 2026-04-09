import { normalizePlayerName } from "./normalize";
import type { LeaderboardPlayer } from "@/types";

const PGA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.pgatour.com/",
  Origin: "https://www.pgatour.com",
};

/** Masters statdata id fallbacks when `message.json` has no tid (bracket access avoids bundler dropping env). */
/** Masters statdata ids (avoid short numeric-only ids — wrong event). */
const MASTERS_TOURNAMENT_ID_CANDIDATES = ["R2026014", "2026014"] as const;

/**
 * Optional override from Vercel: `PGA_TOURNAMENT_ID` or `NEXT_PUBLIC_PGA_TOURNAMENT_ID`
 * (public name is OK — it is only a tournament id, not a secret).
 */
export function getPgaTournamentEnv(): string | null {
  const a = process.env["PGA_TOURNAMENT_ID"]?.trim();
  if (a) return a;
  const b = process.env["NEXT_PUBLIC_PGA_TOURNAMENT_ID"]?.trim();
  if (b) return b;
  return null;
}

export async function fetchMessageJsonTournamentId(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://statdata.pgatour.com/r/current/message.json",
      { headers: PGA_HEADERS, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const tour = data.currentTournament as Record<string, unknown> | undefined;
    const tid =
      (data.tid as string) ??
      (data.tId as string) ??
      (data.TournamentId as string) ??
      (data.tournamentId as string) ??
      (data.tournament_id as string) ??
      (data.currentTournamentId as string) ??
      tour?.tid ??
      tour?.id ??
      tour?.tournamentId;
    if (typeof tid === "string" && tid.length > 0) return tid;
    if (typeof tid === "number") return String(tid);
    return null;
  } catch {
    return null;
  }
}

export async function fetchCurrentTournamentId(): Promise<string | null> {
  const override = getPgaTournamentEnv();
  if (override) return override;
  return await fetchMessageJsonTournamentId();
}

/**
 * Resolves a tournament id and leaderboard in one pass: env → message.json → Masters fallbacks,
 * first candidate that returns a non-empty leaderboard wins.
 */
export async function resolveLeaderboardForTournament(): Promise<{
  tid: string;
  leaderboard: LeaderboardPlayer[];
} | null> {
  const messageTid = await fetchMessageJsonTournamentId();
  const raw = [
    getPgaTournamentEnv(),
    messageTid,
    ...MASTERS_TOURNAMENT_ID_CANDIDATES,
  ].filter((x): x is string => Boolean(x && String(x).trim()));
  const seen = new Set<string>();
  const ordered = raw.filter((id) => {
    const k = id.trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  for (const tid of ordered) {
    try {
      const leaderboard = await fetchLeaderboard(tid);
      if (leaderboard.length > 0) {
        return { tid, leaderboard };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

export function parseRelativeToPar(
  input: string | number | null | undefined
): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    if (Number.isNaN(input)) return null;
    return input;
  }
  const s = String(input).trim().toUpperCase();
  if (s === "" || s === "E" || s === "EVEN") return 0;
  if (s === "MC" || s === "WD" || s === "DQ" || s === "DNS" || s === "CUT")
    return null;
  const m = s.match(/^([+-]?)(\d+)$/);
  if (m) {
    const sign = m[1] === "-" ? -1 : 1;
    const n = parseInt(m[2], 10);
    if (m[1] === "" && !s.startsWith("+") && !s.startsWith("-")) {
      return parseInt(s, 10);
    }
    return sign * n;
  }
  const n = parseInt(s.replace(/[^\d+-]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

function parseScoreDisplay(totalToPar: number | null): string {
  if (totalToPar === null) return "—";
  if (totalToPar === 0) return "E";
  return totalToPar > 0 ? `+${totalToPar}` : String(totalToPar);
}

function getString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

function buildFullName(row: Record<string, unknown>): string {
  const direct = getString(row, [
    "playerName",
    "player_name",
    "displayName",
    "name",
    "fullName",
  ]);
  if (direct) return direct;
  const fn = getString(row, ["firstName", "first_name"]);
  const ln = getString(row, ["lastName", "last_name"]);
  if (fn || ln) return `${fn} ${ln}`.trim();
  const player = row.player as Record<string, unknown> | undefined;
  if (player && typeof player === "object") {
    return buildFullName(player);
  }
  return "";
}

function extractRows(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return data as Record<string, unknown>[];
    }
    return [];
  }
  if (typeof data !== "object") return [];
  const d = data as Record<string, unknown>;

  const tryLists: unknown[] = [
    d.leaderboardRows,
    d.leaderboardrows,
    d.players,
    d.rows,
    Array.isArray(d.leaderboard) ? d.leaderboard : undefined,
  ];
  const lb = d.leaderboard;
  if (lb && typeof lb === "object" && !Array.isArray(lb)) {
    const L = lb as Record<string, unknown>;
    tryLists.push(L.players, L.leaderboardRows);
  }
  for (const list of tryLists) {
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0];
      if (first && typeof first === "object" && !Array.isArray(first)) {
        return list as Record<string, unknown>[];
      }
    }
  }

  if (Array.isArray(d.standings)) {
    const out: Record<string, unknown>[] = [];
    for (const s of d.standings) {
      if (s && typeof s === "object") {
        const p = (s as Record<string, unknown>).players;
        if (Array.isArray(p) && p.length > 0) {
          out.push(...(p as Record<string, unknown>[]));
        }
      }
    }
    if (out.length > 0) return out;
  }

  if (d.data && typeof d.data === "object") {
    return extractRows(d.data);
  }

  return [];
}

function getToday(row: Record<string, unknown>): string {
  const today = row.today as Record<string, unknown> | string | number | undefined;
  if (typeof today === "number") return String(today);
  if (typeof today === "string") return today;
  if (today && typeof today === "object") {
    const s = getString(today, ["score", "display", "strokesRelativeToPar"]);
    if (s) return s;
  }
  const t = getString(row, [
    "todayScore",
    "today_score",
    "today",
    "roundScore",
  ]);
  return t || "—";
}

function getThru(row: Record<string, unknown>): string {
  const tour = row.tournament as Record<string, unknown> | undefined;
  if (tour && typeof tour === "object") {
    const th = getString(tour, ["thru", "holesCompleted", "Thru"]);
    if (th) return th;
  }
  const th = getString(row, [
    "thru",
    "Thru",
    "holesCompleted",
    "holesThru",
    "holesCompleted",
  ]);
  return th || "—";
}

function getTotalToPar(row: Record<string, unknown>): number | null {
  const tour = row.tournament as Record<string, unknown> | undefined;
  if (tour && typeof tour === "object") {
    const sc = (tour as Record<string, unknown>).score as
      | Record<string, unknown>
      | undefined;
    if (sc && typeof sc === "object") {
      const p =
        parseRelativeToPar(sc.relativeToPar as string) ??
        parseRelativeToPar(sc.relative_to_par as string);
      if (p !== null) return p;
    }
    const p =
      parseRelativeToPar(tour.score as string) ??
      parseRelativeToPar(tour.scoreRelativeToPar as string);
    if (p !== null) return p;
  }
  const keys = [
    "totalPar",
    "total_par",
    "totalToPar",
    "total_to_par",
    "to_par",
    "toPar",
    "total",
    "score",
    "relativeToPar",
    "relative_to_par",
  ];
  for (const k of keys) {
    const p = parseRelativeToPar(row[k] as string | number);
    if (p !== null) return p;
  }
  return null;
}

function getPosition(row: Record<string, unknown>): string {
  const pos = getString(row, [
    "position",
    "LeaderboardPosition",
    "leaderboardPosition",
    "pos",
  ]);
  const tied = row.tied === true || row.tied === "T";
  if (pos && tied) return pos.startsWith("T") ? pos : `T${pos}`;
  return pos || "—";
}

function getStatus(row: Record<string, unknown>): string {
  if (row.isCut === true) return "cut";
  const st = getString(row, [
    "status",
    "playerState",
    "tournamentStatus",
    "cutStatus",
    "roundStatus",
  ]).toString();
  return st || "active";
}

function isActive(row: Record<string, unknown>): boolean {
  const status = getStatus(row).toLowerCase();
  if (["wd", "dq", "dns", "cut"].includes(status)) return false;
  const total = getTotalToPar(row);
  if (total === null && status.includes("mc")) return false;
  return true;
}

export async function fetchLeaderboard(
  tournamentId: string
): Promise<LeaderboardPlayer[]> {
  const tid = encodeURIComponent(tournamentId.trim());
  const urls = [
    `https://statdata.pgatour.com/r/${tid}/leaderboard-v2mini.json`,
    `https://statdata.pgatour.com/r/${tid}/leaderboard-v2.json`,
    `https://statdata.pgatour.com/r/${tid}/leaderboard.json`,
  ];
  let lastErr: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: PGA_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) continue;
      const j = await res.json();
      const parsed = parseLeaderboardJson(j);
      if (parsed.length > 0) return parsed;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("leaderboard_fetch_failed");
}

export function parseLeaderboardJson(data: unknown): LeaderboardPlayer[] {
  const rows = extractRows(data);
  const out: LeaderboardPlayer[] = [];
  for (const row of rows) {
    const fullName = buildFullName(row);
    if (!fullName) continue;
    const normalizedKey = normalizePlayerName(fullName);
    const totalToPar = getTotalToPar(row);
    const today = getToday(row);
    const thru = getThru(row);
    const position = getPosition(row);
    const status = getStatus(row);
    const active = isActive(row);
    out.push({
      fullName,
      normalizedKey,
      today: today || "—",
      thru: thru || "—",
      totalToPar,
      position,
      status: status.toLowerCase() || "active",
      isActive: active,
    });
  }
  return out;
}

export function scoreDisplayFromTotal(totalToPar: number | null): string {
  return parseScoreDisplay(totalToPar);
}
