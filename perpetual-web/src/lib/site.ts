export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const description =
  "Perpetual Labs builds websites and business software, with IT infrastructure, security, cloud services, and support from Kampala, Uganda.";
export function safeImage(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const apiOrigin = new URL(
      process.env.API_BASE_URL || "http://127.0.0.1:8000",
    ).origin;
    if (
      url.origin === apiOrigin &&
      url.pathname.startsWith("/media/") &&
      /\.(webp|png|jpe?g)$/i.test(url.pathname)
    )
      return url.pathname;
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com"
      ? value
      : null;
  } catch {
    return null;
  }
}
export function safeWebsite(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}
