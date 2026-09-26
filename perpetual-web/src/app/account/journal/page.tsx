import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { authenticated, currentProfile } from "@/lib/session";
import { JournalEditor, type JournalDraft } from "@/components/journal-editor";
export const metadata: Metadata = {
  title: "Journal workspace",
  robots: { index: false, follow: false },
};
export default async function JournalWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const profile = await currentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.is_staff) redirect("/account");
  const { edit } = await searchParams;
  if (edit && edit !== "new" && !/^[1-9]\d*$/.test(edit)) notFound();
  let entries: JournalDraft[] = [];
  let unavailable = false;
  try {
    if (edit && edit !== "new")
      entries = [
        await authenticated<JournalDraft>(`/api/blog/journal/${edit}/`),
      ];
    else if (!edit)
      entries = await authenticated<JournalDraft[]>("/api/blog/journal/");
  } catch {
    unavailable = true;
  }
  const entry = entries.find((e) => String(e.id) === edit);
  if (!unavailable && edit && edit !== "new" && !entry) notFound();
  return (
    <div className="shell journal-workspace">
      <Link className="journal-back" href="/account/content">
        ← Website workspace
      </Link>
      <header>
        <div>
          <p className="journal-eyebrow">YOUR DAILY WRITING SPACE</p>
          <h1>
            {edit
              ? entry
                ? "Edit your entry."
                : "A fresh page."
              : "The journal desk."}
          </h1>
          <p>Capture an idea, save a draft, and publish when you’re ready.</p>
        </div>
        <Link
          className="button secondary"
          href={edit ? "/account/journal" : "/blog"}
        >
          {edit ? "All entries" : "View journal ↗"}
        </Link>
      </header>
      {unavailable ? (
        <p role="alert">
          Your entries could not be loaded. Please refresh shortly.
        </p>
      ) : edit ? (
        <JournalEditor key={edit} entry={entry} />
      ) : (
        <>
          <div className="journal-workspace-bar">
            <p>
              {entries.length} entries ·{" "}
              {entries.filter((e) => !e.is_published).length} drafts
            </p>
            <Link className="button" href="/account/journal?edit=new">
              + Write an entry
            </Link>
          </div>
          {!entries.length && (
            <div className="journal-empty">
              <h2>Start with today.</h2>
              <p>Your drafts and published entries will live here.</p>
            </div>
          )}
          <div className="journal-entry-list">
            {entries.map((e) => (
              <Link key={e.id} href={`/account/journal?edit=${e.id}`}>
                <div>
                  <span className="journal-eyebrow">
                    {e.publication_status} · {e.topic || "Field notes"}
                  </span>
                  <h3>{e.title}</h3>
                  <p>{e.excerpt}</p>
                </div>
                <span>Edit →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
