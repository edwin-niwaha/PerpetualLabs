import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authenticated, currentProfile } from "@/lib/session";
import { editors } from "@/lib/content-editors";
import { ContentEditor } from "@/components/content-editor";
import {
  ArrowUpRight,
  Building2,
  FileText,
  CircleHelp,
  Gem,
  Package,
  UserRound,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import styles from "./workspace.module.css";

export const metadata: Metadata = {
  title: "Website content",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
const categoryIcons: Record<string, typeof FileText> = {
  team: UserRound,
  services: Gem,
  testimonials: UserRound,
  visuals: FileText,
  settings: Building2,
  sections: FileText,
  faqs: CircleHelp,
  features: Gem,
  products: Package,
};

export default async function ContentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await currentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.is_staff) redirect("/account");
  const { tab } = await searchParams;
  const kind = tab && Object.hasOwn(editors, tab) ? tab : "settings";
  const config = editors[kind];
  let records: Record<string, unknown>[] = [];
  let unavailable = false;
  try {
    const data = await authenticated<
      Record<string, unknown> | Record<string, unknown>[]
    >(config.endpoint);
    records = config.singleton
      ? [data as Record<string, unknown>]
      : Array.isArray(data)
        ? data
        : (data.results as Record<string, unknown>[]);
    if (!Array.isArray(records)) throw new Error("Invalid response");
  } catch {
    unavailable = true;
  }
  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <LayoutDashboard size={15} aria-hidden="true" /> Content management
          </p>
          <h1>Administrator workspace</h1>
          <p>
            Edit your content, shape the story, and publish updates in one
            place.
          </p>
        </div>
        <Link
          className={styles.preview}
          href="/"
          target="_blank"
          rel="noopener noreferrer"
        >
          View website <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.navLabel}>Website content</p>
          <nav className={styles.nav} aria-label="Content categories">
            <Link href="/account/journal">
              <FileText size={18} aria-hidden="true" />
              Journal & daily posts
            </Link>
            {Object.entries(editors).map(([key, editor]) => {
              const Icon = categoryIcons[key] || FileText;
              return (
                <Link
                  key={key}
                  href={`/account/content?tab=${key}`}
                  aria-current={key === kind ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  {editor.title}
                </Link>
              );
            })}
          </nav>
          <Link className={styles.profile} href="/account">
            <UserRound size={18} aria-hidden="true" /> My profile
          </Link>
        </aside>
        <section className={styles.content} aria-labelledby="editor-title">
          <div className={styles.intro}>
            <div>
              <h2 id="editor-title">{config.title}</h2>
              <p>{config.description}</p>
            </div>
            {!unavailable && (
              <span className={styles.count}>
                {config.singleton
                  ? "Site settings"
                  : `${records.length} ${records.length === 1 ? "item" : "items"}`}
              </span>
            )}
          </div>
          {unavailable ? (
            <div role="alert" className="form-message failure">
              Content could not be loaded. Check that the API is running and
              migrations have been applied, then reload this page.
            </div>
          ) : (
            <>
              {records.map((record) => (
                <details
                  className={styles.record}
                  key={String(record.id)}
                  open={config.singleton}
                >
                  <summary>
                    <span className={styles.recordTitle}>
                      {String(
                        record.key ||
                          record.question ||
                          record.name ||
                          record.title ||
                          config.title,
                      )}
                    </span>
                    {typeof record.is_published === "boolean" && (
                      <span
                        className={
                          record.is_published ? styles.published : styles.draft
                        }
                      >
                        {record.is_published ? "Published" : "Draft"}
                      </span>
                    )}
                    <ChevronDown
                      className={styles.chevron}
                      size={18}
                      aria-hidden="true"
                    />
                  </summary>
                  <ContentEditor kind={kind} record={record} />
                </details>
              ))}
              {!records.length && (
                <div className={styles.empty}>
                  <FileText size={24} aria-hidden="true" />
                  <h3>No items yet</h3>
                  <p>
                    {config.canCreate
                      ? "Add your first item to get started."
                      : "Content will appear here when it is available."}
                  </p>
                </div>
              )}
              {config.canCreate && (
                <details className={`${styles.record} ${styles.create}`}>
                  <summary>
                    + Add {kind === "faqs" ? "a question" : "new item"}
                  </summary>
                  <ContentEditor kind={kind} />
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
