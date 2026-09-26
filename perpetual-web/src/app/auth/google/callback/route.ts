import { NextRequest, NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { googleCookie, googleCookieOptions, socialOrigin } from "@/lib/social";
export async function GET(request: NextRequest) {
  const origin = socialOrigin();
  let destination = "/sign-in?social_error=failed";
  try {
    const verifier = request.cookies.get(googleCookie)?.value;
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    if (request.nextUrl.searchParams.has("error"))
      destination = "/sign-in?social_error=cancelled";
    else if (
      verifier &&
      /^[A-Za-z0-9_-]{43}$/.test(verifier) &&
      code &&
      code.length <= 4096 &&
      state &&
      /^[A-Za-z0-9_-]{43}$/.test(state)
    ) {
      const tokens = await api<{
        access: string;
        refresh: string;
        is_staff: boolean;
      }>("/api/auth/social/google/complete/", {
        method: "POST",
        body: JSON.stringify({ code, state, verifier }),
      });
      await saveSession(tokens);
      destination = tokens.is_staff ? "/account/content" : "/account";
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409)
      destination = "/sign-in?social_error=existing_account";
  }
  const response = NextResponse.redirect(new URL(destination, origin));
  response.cookies.set(googleCookie, "", {
    ...googleCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
