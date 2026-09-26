"use client";
import { useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { journalResults } from "@/lib/journal-search";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Search, BookOpen, X } from "lucide-react";
import type { Article } from "@/lib/types";
import { journalDate, readingTime } from "@/lib/journal";

function Artwork({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const image = article.image; // Normalized by the server before entering this client component.
  return (
    <div className={`journal-art ${image ? "has-image" : ""}`}>
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={
            featured
              ? "(max-width: 760px) 100vw, 55vw"
              : "(max-width: 760px) 100vw, 33vw"
          }
          priority={featured}
        />
      ) : (
        <>
          <span className="journal-orbit" />
          <span className="journal-orbit second" />
          <span className="journal-art-label">
            PERPETUAL
            <br />
            FIELD NOTES
          </span>
          <span className="journal-art-number">
            {String(article.id).padStart(3, "0")}
          </span>
        </>
      )}
    </div>
  );
}
export function JournalArchive({ articles }: { articles: Article[] }) {
  const params = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const { query, topic, order, page, pages, total, entries } = journalResults(
    articles,
    params,
  );
  const topics = [
    ...new Set(articles.map((a) => a.category).filter((t): t is string => !!t)),
  ].sort();
  const active = !!query || !!topic || order !== "newest";
  function update(changes: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const url = window.location.pathname + (next.size ? `?${next}` : "");
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function clear() {
    update({ q: "", topic: "", sort: "" });
  }
  function changePage(next: number) {
    update({ page: next === 1 ? "" : String(next) });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      className="journal-archive journal-browser"
      aria-labelledby="entries-heading"
    >
      <div className="journal-archive-heading">
        <div>
          <h2 id="entries-heading" tabIndex={-1} ref={heading}>
            Explore the journal<span>.</span>
          </h2>
          <p>Find something useful for your next idea.</p>
        </div>
        <label className="journal-sort">
          <span>Sort by</span>
          <select
            aria-label="Sort entries"
            value={order}
            onChange={(event) =>
              update({
                sort: event.target.value === "newest" ? "" : event.target.value,
              })
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="shortest">Shortest read</option>
          </select>
        </label>
      </div>
      <div className="journal-search-area">
        <label htmlFor="journal-search">Search journal</label>
        <div className="journal-search">
          <Search size={20} aria-hidden="true" />
          <input
            id="journal-search"
            ref={search}
            type="search"
            placeholder="Search by title, topic, or author"
            value={query}
            maxLength={150}
            aria-controls="journal-results"
            onChange={(event) => update({ q: event.target.value }, true)}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                update({ q: "" }, true);
                search.current?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="journal-tools">
        <div
          className="journal-topics"
          role="group"
          aria-label="Filter by topic"
        >
          {["", ...topics].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={topic === value}
              onClick={() => update({ topic: value })}
            >
              {value || "All entries"}
              <span aria-hidden="true">
                {value
                  ? articles.filter((article) => article.category === value)
                      .length
                  : articles.length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="journal-result-summary">
        <p
          className="journal-results"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {total
            ? `Showing ${(page - 1) * 6 + 1}–${Math.min(page * 6, total)} of ${total} ${total === 1 ? "entry" : "entries"}`
            : "0 entries"}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
          {topic ? ` in ${topic}` : ""}
        </p>
        {active && (
          <button type="button" className="journal-clear" onClick={clear}>
            Clear filters <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div id="journal-results">
        {entries.length ? (
          <div className="journal-grid">
            {entries.map((article, index) => (
              <article className="journal-card" key={article.id}>
                <Link
                  href={`/blog/${article.slug}`}
                  className="journal-card-image"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Artwork
                    article={article}
                    featured={page === 1 && index === 0}
                  />
                </Link>
                <div className="journal-card-body">
                  <p className="journal-eyebrow">
                    {article.category || "Field notes"}
                    {!active && page === 1 && index === 0 && (
                      <span className="journal-latest">Latest</span>
                    )}
                  </p>
                  <h3>
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p>{article.excerpt}</p>
                  <div className="journal-meta">
                    <time dateTime={article.published_at || article.created_at}>
                      {journalDate(article)}
                    </time>
                    <span>{readingTime(article.content)} min read</span>
                  </div>
                  <div className="journal-card-bottom">
                    <span className="journal-byline">By {article.author}</span>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="journal-read"
                      aria-label={`Read ${article.title}`}
                    >
                      Read entry <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="journal-empty">
            <BookOpen size={32} aria-hidden="true" />
            <h3>
              {articles.length
                ? "No entries found"
                : "Every journal starts with a first page."}
            </h3>
            <p>
              {articles.length
                ? "Try a shorter search or choose another topic. You can also clear your filters to see every entry."
                : "Our first notes are on their way. Come back soon for ideas and updates from Perpetual Labs."}
            </p>
            {articles.length > 0 && (
              <button type="button" className="button" onClick={clear}>
                Show all entries
              </button>
            )}
          </div>
        )}
      </div>
      {pages > 1 && (
        <nav className="journal-pagination" aria-label="Journal pages">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => changePage(page - 1)}
          >
            ← Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page === pages}
            onClick={() => changePage(page + 1)}
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}

export function JournalRetry() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
    >
      {pending ? "Trying again…" : "Try again"}
    </button>
  );
}
