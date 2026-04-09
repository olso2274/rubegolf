import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "masters_pool_admin";

export function getExpectedAdminToken(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || !password) return null;
  return createHmac("sha256", secret).update(password).digest("hex");
}

export function isValidAdminCookie(value: string | undefined): boolean {
  const expected = getExpectedAdminToken();
  if (!expected || !value) return false;
  try {
    const a = Buffer.from(value, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { COOKIE as ADMIN_COOKIE_NAME };
