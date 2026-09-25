import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ArticlesGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes, ideas, and perspectives from the Perpetual Labs journal.",
};
export default async function Blog() {
  const data = await content("blog");
  return (
    <>
      <PageIntro
        label="The journal"
        title="A little food for thought."
        description="Notes from the lab on design, technology, and the ideas that keep us curious."
      />
      <section className="shell listing-section">
        {data.items.length ? (
          <ArticlesGrid items={data.items} />
        ) : (
          <EmptyState subject="articles" unavailable={data.unavailable} />
        )}
      </section>
      <ContactCta />
    </>
  );
}
