/** Constrain authenticated server requests to the configured API origin. */
export function apiUrl(path: string, base: string): URL {
  const origin = new URL(base);
  if (
    !["https:", "http:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("API_BASE_URL must be an HTTP(S) origin.");
  if (!path.startsWith("/api/") || path.includes("\\"))
    throw new Error("Only API-relative paths are allowed.");
  const url = new URL(path, origin);
  if (url.origin !== origin.origin || !url.pathname.startsWith("/api/"))
    throw new Error("The request must stay within the configured API.");
  return url;
}
