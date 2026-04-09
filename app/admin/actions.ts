"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceSupabase } from "@/lib/supabase";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";

async function requireAdmin() {
  const jar = await cookies();
  if (!isValidAdminCookie(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Unauthorized");
  }
}

export async function upsertPoolPlayer(formData: FormData) {
  await requireAdmin();
  const idRaw = formData.get("id");
  const idStr = idRaw != null ? String(idRaw).trim() : "";
  const team_name = String(formData.get("team_name") ?? "").trim();
  const pick_number = parseInt(String(formData.get("pick_number") ?? "0"), 10);
  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!team_name || !full_name || !pick_number) {
    return { ok: false, message: "Missing fields" };
  }

  const supabase = createServiceSupabase();

  if (idStr) {
    const { error } = await supabase
      .from("pool_players")
      .update({
        team_name,
        pick_number,
        full_name,
      })
      .eq("id", Number(idStr));
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("pool_players").insert({
      team_name,
      pick_number,
      full_name,
    });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deletePoolPlayer(id: number) {
  await requireAdmin();
  const supabase = createServiceSupabase();
  const { error } = await supabase.from("pool_players").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}
