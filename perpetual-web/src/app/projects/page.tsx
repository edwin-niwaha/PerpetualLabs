import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ProjectsGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Our work",
  description:
    "Meet PureShopper, DonorLink, StockTrack, FinCore, CoreHR, and SchoolSync: business software from Perpetual Labs.",
};
export default async function Projects() {
  const data = await content("projects");
  return (
    <>
      <PageIntro
        label="Our work"
        title="Everyday work. Thoughtfully reimagined."
        description="Explore software for retail, nonprofit organizations, finance, people management, and education. Each product starts with a real operational need."
      />
      <section className="shell listing-section">
        {data.items.length ? (
          <ProjectsGrid items={data.items} />
        ) : (
          <EmptyState subject="projects" unavailable={data.unavailable} />
        )}
      </section>
      <ContactCta />
    </>
  );
}
