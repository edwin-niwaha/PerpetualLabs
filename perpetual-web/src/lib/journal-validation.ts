export const journalLimits = {
  title: 255,
  excerpt: 600,
  content: 80000,
  topic: 100,
  image: 200,
};
export function validateJournal(form: FormData): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const [key, limit] of Object.entries(journalLimits)) {
    const value = String(form.get(key) || "").trim();
    if (["title", "excerpt", "content"].includes(key) && !value)
      errors[key] = ["This field is required."];
    else if (value.length > limit)
      errors[key] = [`Use ${limit.toLocaleString()} characters or fewer.`];
  }
  const image = String(form.get("image") || "").trim();
  if (image) {
    try {
      const url = new URL(image);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "res.cloudinary.com" ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      errors.image = [
        "Use an HTTPS Cloudinary image URL, or upload a cover below.",
      ];
    }
  }
  const schedule = String(form.get("published_at") || "");
  if (schedule && !Number.isFinite(Date.parse(schedule)))
    errors.published_at = ["Choose a valid publication date and time."];
  if (!["draft", "publish"].includes(String(form.get("intent"))))
    errors.intent = ["Choose Save draft or Publish entry."];
  const cover = form.get("cover_image");
  if (cover instanceof File && cover.size) {
    if (
      cover.size > 4 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(cover.type)
    )
      errors.cover_image = ["Choose a JPEG, PNG or WebP image up to 4 MB."];
    if (form.get("remove_cover") === "on")
      errors.cover_image = [
        "Choose either a replacement image or removal, not both.",
      ];
  }
  return errors;
}
export type JournalSaveState = import("./types").FormState & {
  status?: number;
  entry?: {
    id: number;
    slug: string;
    is_published: boolean;
    published_at: string | null;
    cover_image?: string | null;
  };
};
