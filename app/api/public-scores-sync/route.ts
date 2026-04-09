import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase";
import {
  checkPublicSyncCooldown,
  recordPublicSyncTime,
  runScoreUpdate,
} from "@/lib/update-scores";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Public, rate-limited PGA fetch + Supabase upsert (cooldown via app_settings).
 * GitHub Actions / cron should use /api/update-scores with CRON_SECRET instead.
 */
export async function POST() {
  try {
    if (process.env.PUBLIC_SCORE_SYNC_ENABLED === "false") {
      return NextResponse.json(
        { ok: false, message: "Public score sync is disabled." },
        { status: 403 }
      );
    }

    let supabase;
    try {
      supabase = createServiceSupabase();
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase not configured",
          error: e instanceof Error ? e.message : String(e),
        },
        { status: 503 }
      );
    }

    const gate = await checkPublicSyncCooldown(supabase);
    if (!gate.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: gate.message,
          retryAfterSeconds: gate.retryAfterSeconds,
        },
        { status: gate.retryAfterSeconds > 0 ? 429 : 503 }
      );
    }

    const result = await runScoreUpdate();
    if (result.ok) {
      try {
        await recordPublicSyncTime(supabase);
      } catch (e) {
        console.error("[public-scores-sync] recordPublicSyncTime", e);
      }
    }

    /** Always 200 so the browser does not log “failed resource” for expected PGA/DB outcomes (`ok: false`). */
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("[public-scores-sync]", e);
    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error during score sync.",
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
