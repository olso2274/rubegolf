import { LiveBoard } from "@/components/live-board";
import { createServerAnonClient } from "@/lib/supabase";
import type { PoolPlayerRow, TeamRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <LiveBoard
          initialTeams={[]}
          initialPlayers={[]}
          configError="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
        />
      </div>
    );
  }

  const supabase = createServerAnonClient();
  const [teamsRes, playersRes] = await Promise.all([
    supabase.from("teams").select("*").order("rank", { ascending: true }),
    supabase.from("pool_players").select("*"),
  ]);

  const initialTeams = (teamsRes.data as TeamRow[]) ?? [];
  const initialPlayers = (playersRes.data as PoolPlayerRow[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <LiveBoard
        initialTeams={initialTeams}
        initialPlayers={initialPlayers}
        configError={
          teamsRes.error
            ? teamsRes.error.message
            : playersRes.error
              ? playersRes.error.message
              : null
        }
      />
      <footer className="mt-16 border-t border-masters-green/10 pt-8 text-center text-sm text-masters-ink/50">
        Built for fun · Data from PGA Tour (unofficial public feeds) · Not
        affiliated with Augusta National or the Masters Tournament
      </footer>
    </div>
  );
}
