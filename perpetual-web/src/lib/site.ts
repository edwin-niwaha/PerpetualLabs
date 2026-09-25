export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const description =
  "Perpetual Labs builds websites and business software, with IT infrastructure, security, cloud services, and support from Kampala, Uganda.";
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
