"use client";

import dynamic from "next/dynamic";
import { LiveBoardSkeleton } from "@/components/live-board-skeleton";
import type { PoolPlayerRow, TeamRow } from "@/types";

const LiveBoard = dynamic(
  () => import("@/components/live-board").then((mod) => mod.LiveBoard),
  {
    ssr: false,
    loading: () => <LiveBoardSkeleton />,
  }
);

export function LiveBoardClient({
  initialTeams,
  initialPlayers,
  configError,
}: {
  initialTeams: TeamRow[];
  initialPlayers: PoolPlayerRow[];
  configError?: string | null;
}) {
  return (
    <LiveBoard
      initialTeams={initialTeams}
      initialPlayers={initialPlayers}
      configError={configError}
    />
  );
}
