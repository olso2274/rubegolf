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

function getPreferredTournamentIds(): string[] {
  const raw = [getPgaTournamentEnv(), ...MASTERS_TOURNAMENT_ID_CANDIDATES].filter(
    (x): x is string => Boolean(x && String(x).trim())
  );
  const seen = new Set<string>();
  return raw.filter((id) => {
    const k = id.trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Resolves the leaderboard for this pool's tournament only.
 *
 * Important: this app is pinned to the 2026 Masters. Do not follow PGA's
 * "current tournament" pointers here, or the next event on the schedule can
 * overwrite the finished Masters results in Supabase.
 */
export async function resolveLeaderboardForTournament(): Promise<{
  tid: string;
  leaderboard: LeaderboardPlayer[];
} | null> {
  const ordered = getPreferredTournamentIds();

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
  const website = await fetchLeaderboardFromWebsite(ordered);
  if (website && website.leaderboard.length > 0) {
    return website;
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

function extractNextDataJson(html: string): Record<string, unknown> | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getTournamentWebsiteUrls(tournamentId: string): string[] {
  const tid = tournamentId.trim();
  const slugBase = "https://www.pgatour.com/tournaments/2026/masters-tournament";
  return [
    `${slugBase}/${encodeURIComponent(tid)}`,
    `${slugBase}/${encodeURIComponent(tid)}/leaderboard`,
  ];
}

/**
 * Fallback for when `statdata.pgatour.com` is blocked or flaky.
 * Reads the Masters tournament page directly so future PGA events cannot leak in.
 */
export async function fetchLeaderboardFromWebsite(
  tournamentIds: string[]
): Promise<{
  tid: string;
  leaderboard: LeaderboardPlayer[];
} | null> {
  for (const requestedTid of tournamentIds) {
    const urls = getTournamentWebsiteUrls(requestedTid);
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: PGA_HEADERS,
          cache: "no-store",
        });
        if (!res.ok) continue;
        const html = await res.text();
        const nextData = extractNextDataJson(html);
        if (!nextData) continue;

        const props = (nextData.props as Record<string, unknown> | undefined)
          ?.pageProps as Record<string, unknown> | undefined;
        if (!props) continue;

        const propsLeaderboardId = props.leaderboardId;
        const pageTournamentId = (
          (props.pageContext as Record<string, unknown> | undefined)
            ?.tournaments as Array<Record<string, unknown>> | undefined
        )?.[0]?.leaderboardId;
        const tid =
          typeof propsLeaderboardId === "string" && propsLeaderboardId.trim()
            ? propsLeaderboardId
            : typeof pageTournamentId === "string" && pageTournamentId.trim()
              ? pageTournamentId
              : requestedTid;

        const queries =
          (
            (props.dehydratedState as Record<string, unknown> | undefined)
              ?.queries as Array<Record<string, unknown>> | undefined
          ) ?? [];

        const leaderboardQuery = queries.find((q) => {
          const key = q.queryKey;
          return Array.isArray(key) && key[0] === "leaderboard";
        });
        if (!leaderboardQuery) continue;

        const players =
          (
            ((leaderboardQuery.state as Record<string, unknown> | undefined)
              ?.data as Record<string, unknown> | undefined)
              ?.players as Array<Record<string, unknown>> | undefined
          ) ?? [];
        if (players.length === 0) continue;

        const syntheticRows = players.map((row) => {
          const player = row.player as Record<string, unknown> | undefined;
          const scoring = row.scoringData as Record<string, unknown> | undefined;
          return {
            player,
            playerState: scoring?.playerState,
            roundStatus: scoring?.roundStatus,
            position: scoring?.position,
            score: scoring?.total,
            today: scoring?.score,
            thru: scoring?.thru,
          } satisfies Record<string, unknown>;
        });

        const leaderboard = parseLeaderboardJson(syntheticRows);
        if (leaderboard.length > 0) {
          return { tid, leaderboard };
        }
      } catch {
        /* try next Masters page */
      }
    }
  }
  return null;
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
