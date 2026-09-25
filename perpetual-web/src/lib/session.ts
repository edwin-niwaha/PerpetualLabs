import "server-only";
import { cookies } from "next/headers";
import { api, ApiError } from "./api";
import type { Profile } from "./types";

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function saveSession(tokens: { access: string; refresh: string }) {
  const jar = await cookies();
  jar.set("pl_access", tokens.access, { ...options, maxAge: 30 * 60 });
  jar.set("pl_refresh", tokens.refresh, { ...options, maxAge: 24 * 60 * 60 });
}
export async function clearSession() {
  const jar = await cookies();
  jar.delete("pl_access");
  jar.delete("pl_refresh");
}
export async function authenticated<T>(
  path: string,
  init: RequestInit = {},
  writable = false,
): Promise<T> {
  const jar = await cookies();
  const access = jar.get("pl_access")?.value;
  const refresh = jar.get("pl_refresh")?.value;
  const request = (token: string) =>
    api<T>(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  if (access) {
    try {
      return await request(access);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    }
  }
  if (!refresh)
    throw new ApiError(401, {
      detail: "Your session has ended. Please sign in again.",
    });
  const tokens = await api<{ access: string }>("/api/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
  if (writable)
    jar.set("pl_access", tokens.access, { ...options, maxAge: 30 * 60 });
  return request(tokens.access);
}
export async function currentProfile(): Promise<Profile | null> {
  try {
    return await authenticated<Profile>("/api/auth/profile/");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
