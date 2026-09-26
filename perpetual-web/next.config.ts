import type { NextConfig } from "next";
const production = process.env.NODE_ENV === "production";
// Route type generation also loads production config, but must work with local HTTP URLs.
if (production && !process.argv.includes("typegen")) {
  for (const name of ["API_BASE_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const value = process.env[name];
    if (!value) throw new Error(name + " must be set for a production build.");
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      throw new Error(
        name + " must be an HTTP(S) origin without credentials or a path.",
      );
    if (url.protocol !== "https:")
      throw new Error(name + " must use HTTPS in production.");
  }
}
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async rewrites() {
    if (production) return [];
    const base = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      "",
    );
    return [{ source: "/media/:path*", destination: base + "/media/:path*" }];
  },
  async headers() {
    return [
      ...[
        "/account/:path*",
        "/sign-in",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth/:path*",
      ].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      {
        source: "/:path*",
        headers: [
          ...(production
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
