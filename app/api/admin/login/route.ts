import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  ADMIN_COOKIE_NAME,
  getExpectedAdminToken,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const expectedPass = process.env.ADMIN_PASSWORD;
  const token = getExpectedAdminToken();
  if (!expectedPass || !token) {
    return NextResponse.json(
      { ok: false, message: "Admin not configured" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const password = body.password ?? "";
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(expectedPass, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, message: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
