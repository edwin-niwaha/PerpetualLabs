import { test, expect } from "@playwright/test";
import { journalResults } from "../src/lib/journal-search";
import type { Article } from "../src/lib/types";
const articles: Article[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  title: index === 0 ? "Café security ideas" : `Studio note ${index}`,
  excerpt: "Practical cloud lessons",
  category: index < 7 ? "Design" : "Engineering",
  author: "Alex",
  content: "word ".repeat((index + 1) * 220),
  image: "",
  slug: `note-${index}`,
  created_at: `2026-09-${String(index + 1).padStart(2, "0")}T10:00:00Z`,
}));

test("journal search combines words, handles accents, and filters topics", () => {
  expect(
    journalResults(
      articles,
      new URLSearchParams("q=cafe+cloud&topic=Design"),
    ).entries.map((item) => item.id),
  ).toEqual([1]);
  expect(
    journalResults(articles, new URLSearchParams("q=cafe&topic=Engineering"))
      .total,
  ).toBe(0);
});
test("journal sorting uses publication dates and reading length without mutating input", () => {
  expect(journalResults(articles, new URLSearchParams()).entries[0].id).toBe(8);
  expect(
    journalResults(articles, new URLSearchParams("sort=oldest")).entries[0].id,
  ).toBe(1);
  expect(
    journalResults(articles, new URLSearchParams("sort=shortest")).entries[0]
      .id,
  ).toBe(1);
  expect(articles[0].id).toBe(1);
});
test("journal pagination clamps invalid and out-of-range links", () => {
  for (const value of ["-1", "bad", "1.5", "Infinity"])
    expect(
      journalResults(articles, new URLSearchParams(`page=${value}`)).page,
    ).toBe(1);
  const last = journalResults(articles, new URLSearchParams("page=99999"));
  expect(last.page).toBe(2);
  expect(last.entries).toHaveLength(2);
  expect(journalResults([], new URLSearchParams("page=5")).page).toBe(1);
});
