export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const description =
  "Thoughtful design. Purposeful engineering. Explore Perpetual Labs and start a conversation about your next digital project.";
export function safeImage(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
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
