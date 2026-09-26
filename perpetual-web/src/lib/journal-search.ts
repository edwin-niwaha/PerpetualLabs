import type { Article } from "./types";
import { readingTime } from "./journal";

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function journalResults(
  articles: Article[],
  params: Pick<URLSearchParams, "get">,
) {
  const query = (params.get("q") || "").slice(0, 150);
  const topic = params.get("topic") || "";
  const requestedSort = params.get("sort");
  const order =
    requestedSort === "oldest" || requestedSort === "shortest"
      ? requestedSort
      : "newest";
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const filtered = articles
    .filter((article) => {
      const text = normalize(
        `${article.title} ${article.excerpt} ${article.author} ${article.category || ""}`,
      );
      return (
        (!topic || article.category === topic) &&
        words.every((word) => text.includes(word))
      );
    })
    .sort((a, b) => {
      if (order === "shortest") {
        const difference = readingTime(a.content) - readingTime(b.content);
        if (difference) return difference;
      }
      const difference =
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime();
      return (order === "oldest" ? -difference : difference) || b.id - a.id;
    });
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const requestedPage = Number(params.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage)
    ? Math.min(pages, Math.max(1, requestedPage))
    : 1;
  return {
    query,
    topic,
    order,
    page,
    pages,
    total: filtered.length,
    entries: filtered.slice((page - 1) * 6, page * 6),
  };
}
