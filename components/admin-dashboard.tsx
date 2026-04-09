"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { upsertPoolPlayer } from "@/app/admin/actions";
import type { PoolPlayerRow } from "@/types";

const TEAMS = ["CHUCK", "GG", "EMIL", "SKIP", "BHO", "MORC"];

export function AdminDashboard({ players }: { players: PoolPlayerRow[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function forceUpdate() {
    setUpdating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/update-scores", { method: "POST" });
      const j = (await res.json()) as { ok?: boolean; message?: string };
      setMsg(j.message ?? (j.ok ? "Update complete" : "Update failed"));
    } catch {
      setMsg("Request failed");
    } finally {
      setUpdating(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-masters-green">
            Pool admin
          </h1>
          <p className="text-sm text-masters-ink/60">
            Seed data lives in SQL — edit rows here if a name must be corrected.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={() => void forceUpdate()} disabled={updating}>
            {updating ? "Updating…" : "Force update scores"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">View live board</Link>
          </Button>
          <Button variant="ghost" type="button" onClick={() => void logout()}>
            Log out
          </Button>
        </div>
      </div>

      {msg && (
        <p className="rounded-lg border border-masters-green/20 bg-white px-4 py-3 text-sm text-masters-ink">
          {msg}
        </p>
      )}

      <Card className="border-masters-green/20">
        <CardHeader>
          <CardTitle>Edit player</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPlayerForm
            onDone={(m) => setMsg(m)}
          />
        </CardContent>
      </Card>

      <Card className="border-masters-green/20">
        <CardHeader>
          <CardTitle>All pool players</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Team</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Today</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.team_name}</TableCell>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell className="text-right">{p.today}</TableCell>
                  <TableCell className="text-right">{p.total_to_par}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EditPlayerForm({ onDone }: { onDone: (m: string) => void }) {
  return (
    <form
      action={async (fd) => {
        const r = await upsertPoolPlayer(fd);
        onDone(r.ok ? "Saved." : (r.message ?? "Error"));
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <label className="text-sm font-medium text-masters-ink sm:col-span-2">
        Row ID (optional — set to update an existing row; leave blank to insert)
        <input
          name="id"
          placeholder="e.g. 12"
          className="mt-1 w-full rounded-md border border-masters-green/20 px-3 py-2"
        />
      </label>
      <label className="text-sm font-medium text-masters-ink">
        Team
        <select
          name="team_name"
          required
          className="mt-1 w-full rounded-md border border-masters-green/20 px-3 py-2"
          defaultValue={TEAMS[0]}
        >
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-masters-ink sm:col-span-2">
        Full name
        <input
          name="full_name"
          required
          className="mt-1 w-full rounded-md border border-masters-green/20 px-3 py-2"
          placeholder="First Last"
        />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="default">
          Save player
        </Button>
      </div>
    </form>
  );
}
