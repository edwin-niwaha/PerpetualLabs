import Link from "next/link";
import { Faq } from "@/components/faq";
import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { businessProducts } from "@/lib/business-products";
import { mobileProjects } from "@/lib/mobile-projects";
import { ProjectsGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Our work",
  description:
    "Explore web products and mobile applications from Perpetual Labs, including PerpetualHr, PerpetualLearn, PendezaConnect, and DuukaYo.",
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
        description="From the browser to your pocket. Explore the websites, business platforms, and mobile applications we build for everyday life."
      />
      <nav className="shell catalogue-links" aria-label="Page shortcuts">
        <Link href="#browse">
          Browse our work <span aria-hidden="true">↓</span>
        </Link>
        <Link href="#business-products">
          Business platforms <span aria-hidden="true">↓</span>
        </Link>
        <Link href="#mobile-apps">
          Mobile applications <span aria-hidden="true">↓</span>
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
      <section
        id="business-products"
        className="shell mobile-project-section"
        aria-labelledby="business-product-title"
      >
        <div className="mobile-project-heading">
          <div>
            <span className="eyebrow">People. Potential. Progress.</span>
            <h2 id="business-product-title">Better work. Brighter futures.</h2>
          </div>
          <p>
            Thoughtful platforms for supporting your people and opening up new
            possibilities for learning.
          </p>
        </div>
        <ProductGrid items={businessProducts} />
      </section>
      <section
        id="mobile-apps"
        className="shell mobile-project-section"
        aria-labelledby="mobile-project-title"
      >
        <div className="mobile-project-heading">
          <div>
            <span className="eyebrow">Built for life on the move</span>
            <h2 id="mobile-project-title">Big ideas. Pocket-sized.</h2>
          </div>
          <p>
            Purpose-built mobile experiences that keep communities connected and
            businesses moving.
          </p>
        </div>
        <ProductGrid items={mobileProjects} />
      </section>
      <Faq />
      <ContactCta />
    </div>
  );
}
