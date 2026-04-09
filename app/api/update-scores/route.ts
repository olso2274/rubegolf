import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { runScoreUpdate } from "@/lib/update-scores";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function verifyCronOrAdmin(request: Request): Promise<boolean> {
  const cron = process.env.CRON_SECRET;
  if (cron) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${cron}`) return true;
    if (request.headers.get("x-cron-secret") === cron) return true;
  }
  const jar = await cookies();
  if (isValidAdminCookie(jar.get(ADMIN_COOKIE_NAME)?.value)) return true;
  if (process.env.NODE_ENV === "development" && !cron) return true;
  return false;
}

export async function GET(request: Request) {
  if (!(await verifyCronOrAdmin(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const result = await runScoreUpdate();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await verifyCronOrAdmin(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const result = await runScoreUpdate();
  return NextResponse.json(result);
}
