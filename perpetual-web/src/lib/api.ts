import "server-only";
import { apiUrl } from "./api-url";
import type { ContentMap } from "./types";
import { chooseContent } from "./company-content";

const base = process.env.API_BASE_URL || "http://127.0.0.1:8000";
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>,
  ) {
    super(
      typeof data.detail === "string"
        ? data.detail
        : "Request could not be completed.",
    );
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(apiUrl(path, base), {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(
        options.method && options.method !== "GET" ? 30000 : 10000,
      ),
      headers,
      redirect: "error",
    });
  } catch {
    throw new ApiError(503, {
      detail: "We could not connect right now. Please try again shortly.",
    });
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => {
    throw new ApiError(502, {
      detail: "The service returned an invalid response.",
    });
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      data && typeof data === "object" && !Array.isArray(data) ? data : {},
    );
  return data as T;
}
export const endpoints = {
  services: "/api/services/list/",
  products: "/api/projects/products/",
  visuals: "/api/projects/visuals/",
  projects: "/api/projects/list/",
  blog: "/api/blog/blog-posts/",
  testimonials: "/api/testimonials/list/",
  team: "/api/auth/team-members/list/",
};
export async function content<K extends keyof ContentMap>(
  kind: K,
): Promise<{ items: ContentMap[K][]; unavailable: boolean }> {
  try {
    const data = await api<ContentMap[K][] | { results: ContentMap[K][] }>(
      endpoints[kind],
    );
    const items = Array.isArray(data) ? data : data.results;
    if (!Array.isArray(items)) throw new ApiError(502, {});
    return chooseContent(kind, items);
  } catch {
    return chooseContent(kind, null);
  }
}
