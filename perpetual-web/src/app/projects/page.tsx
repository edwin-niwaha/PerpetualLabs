import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ProjectsGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Our work",
  description: "Explore projects from Perpetual Labs.",
};
export default async function Projects() {
  const data = await content("projects");
  return (
    <>
      <PageIntro
        label="Our work"
        title="Thought becomes tangible."
        description="A closer look at the ideas, details, and decisions behind our projects."
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
