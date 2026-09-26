import { test, expect } from "@playwright/test";
import { validateJournal } from "../src/lib/journal-validation";
test("journal validation rejects whitespace, invalid dates, unsafe covers and unknown intent", () => {
  const form = new FormData();
  form.set("title", "   ");
  form.set("excerpt", "x".repeat(601));
  form.set("content", "   ");
  form.set("published_at", "invalid");
  form.set("image", "https://example.com/image.png");
  form.set("intent", "delete");
  expect(Object.keys(validateJournal(form)).sort()).toEqual(
    ["title", "excerpt", "content", "published_at", "image", "intent"].sort(),
  );
});
