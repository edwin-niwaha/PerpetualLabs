import type { Article } from "./types";
export function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220));
}
export function journalDate(article: Article) {
  return new Date(
    article.published_at || article.created_at,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
