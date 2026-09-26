import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const production = process.env.NODE_ENV === "production";
  // Require the configured public origin for every state-changing web request.
  // Do not use caller-controlled forwarded-host headers as a trust decision.
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const expected = production
      ? process.env.NEXT_PUBLIC_SITE_URL
      : request.nextUrl.origin;
    const origin = request.headers.get("origin");
    if (!expected || origin !== new URL(expected).origin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    // Components use inline style properties; script execution stays nonce-only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self'",
    `connect-src 'self'${production ? "" : " ws: wss:"}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  // HTML contains a per-request nonce; never share it through an intermediary cache.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|media/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2)$).*)",
  ],
};
