import Link from "next/link";
import { Faq } from "@/components/faq";
import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { ProjectsGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Our work",
  description:
    "Explore PendezaConnect, JobellStores, DuukaYo, and FinCore from Perpetual Labs.",
};
export default async function Projects() {
  const [data, products] = await Promise.all([
    content("projects"),
    content("products"),
  ]);
  return (
    <div className="catalogue-page">
      <PageIntro
        label="Our work"
        title="Everyday work. Thoughtfully reimagined."
        description="Connecting communities, powering online stores, and simplifying finance. Explore our growing family of products."
      />
      <nav className="shell catalogue-links" aria-label="Page shortcuts">
        <Link href="#browse">
          Browse our work <span aria-hidden="true">↓</span>
        </Link>
        <Link href="#frequently-asked-questions">Common questions</Link>
        <Link href="/contact">
          Let’s talk about your idea <span aria-hidden="true">↗</span>
        </Link>
      </nav>
      <section
        id="browse"
        aria-label="Products and projects"
        className="shell listing-section"
      >
        {products.items.length > 0 && <ProductGrid items={products.items} />}
        {data.items.length ? (
          <ProjectsGrid items={data.items} />
        ) : !products.items.length ? (
          <EmptyState
            subject="projects"
            unavailable={data.unavailable || products.unavailable}
          />
        ) : null}
      </section>
      <Faq />
      <ContactCta />
    </div>
  );
}
