import "server-only";
import { api } from "./api";
export const googleCookie = "pl_google_verifier";
export const googleCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/google",
  maxAge: 600,
};
export function socialOrigin() {
  const value = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(value.hostname);
  if (
    value.username ||
    value.password ||
    value.pathname !== "/" ||
    value.search ||
    value.hash ||
    !["http:", "https:"].includes(value.protocol) ||
    (process.env.NODE_ENV === "production" &&
      (value.protocol !== "https:" || local)) ||
    (value.protocol === "http:" && !local)
  )
    throw new Error(
      "Configure NEXT_PUBLIC_SITE_URL as the canonical website origin; production requires public HTTPS.",
    );
  return value.origin;
}
export async function googleEnabled() {
  try {
    const status = await api<{ enabled: boolean; redirect_uri: string }>(
      "/api/auth/social/google/",
    );
    return (
      status.enabled &&
      status.redirect_uri === `${socialOrigin()}/auth/google/callback`
    );
  } catch {
    return false;
  }
}
