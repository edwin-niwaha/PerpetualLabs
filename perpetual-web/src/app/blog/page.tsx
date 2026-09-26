import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { JournalArchive, JournalRetry } from "@/components/journal-archive";
import { currentProfile } from "@/lib/session";
export const metadata: Metadata = {
  title: "Journal",
  description:
    "Daily notes, practical ideas, and stories from the people building Perpetual Labs.",
};
export default async function Blog() {
  const [data, profile] = await Promise.all([
    content("blog"),
    currentProfile().catch(() => null),
  ]);
  return (
    <div className="shell journal-page journal-browse-page">
      <header className="journal-header">
        <div>
          <p className="journal-eyebrow">
            <span /> THE PERPETUAL JOURNAL
          </p>
          <h1>Ideas in progress.</h1>
          <p className="journal-intro">
            Notes from the studio. Lessons from the work. A closer look at the
            technology and people moving us forward.
          </p>
        </div>
        <div className="journal-aside">
          <Link className="text-link" href="#entries-heading">
            Browse entries ↓
          </Link>
          {profile?.is_staff && (
            <Link className="button" href="/account/journal">
              Write an entry ↗
            </Link>
          )}
        </div>
      </header>
      {data.unavailable ? (
        <div className="journal-empty" role="alert">
          <h2>The journal is taking a moment.</h2>
          <p>We couldn’t load the entries. Please try again.</p>
          <JournalRetry />
        </div>
      ) : (
        <Suspense fallback={<p role="status">Loading journal entries…</p>}>
          <JournalArchive
            articles={data.items.map((article) => ({
              ...article,
              image: safeImage(article.image) || "",
            }))}
          />
        </Suspense>
      )}
      <aside className="journal-footer">
        <div>
          <p className="journal-eyebrow">KEEP THE CONVERSATION GOING</p>
          <h2>A thought of your own?</h2>
          <p>We’d love to hear what you’re thinking about.</p>
        </div>
        <Link className="button" href="/contact">
          Talk to us ↗
        </Link>
      </aside>
    </div>
  );
}
