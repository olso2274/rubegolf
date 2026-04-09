import { cookies } from "next/headers";
import { AdminLogin } from "@/components/admin-login";
import { AdminDashboard } from "@/components/admin-dashboard";
import { createServerAnonClient } from "@/lib/supabase";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import type { PoolPlayerRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const jar = await cookies();
  const authed = isValidAdminCookie(jar.get(ADMIN_COOKIE_NAME)?.value);

  if (!authed) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <AdminLogin />
      </div>
    );
  }

  const supabase = createServerAnonClient();
  const { data, error } = await supabase
    .from("pool_players")
    .select("*")
    .order("team_name", { ascending: true })
    .order("pick_number", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-red-700">
        Could not load players: {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <AdminDashboard players={(data as PoolPlayerRow[]) ?? []} />
    </div>
  );
}
