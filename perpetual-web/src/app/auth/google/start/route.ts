import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { api } from "@/lib/api";
import { googleCookie, googleCookieOptions, socialOrigin } from "@/lib/social";
export async function GET() {
  const origin = socialOrigin();
  try {
    const verifier = randomBytes(32).toString("base64url");
    const data = await api<{ url: string }>("/api/auth/social/google/start/", {
      method: "POST",
      body: JSON.stringify({
        challenge: createHash("sha256").update(verifier).digest("hex"),
      }),
    });
    const url = new URL(data.url);
    if (
      url.origin !== "https://accounts.google.com" ||
      url.pathname !== "/o/oauth2/v2/auth" ||
      url.searchParams.get("redirect_uri") !== `${origin}/auth/google/callback`
    )
      throw new Error("Invalid provider URL");
    const response = NextResponse.redirect(url);
    response.cookies.set(googleCookie, verifier, googleCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/sign-in?social_error=unavailable", origin),
    );
  }
}
