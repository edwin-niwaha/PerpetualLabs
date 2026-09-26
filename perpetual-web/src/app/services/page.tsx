import Link from "next/link";
import { Faq } from "@/components/faq";
import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ServicesGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Services",
  description:
    "Website development, custom software, infrastructure, cybersecurity, databases, cloud services, and IT consulting from Perpetual Labs.",
};
export default async function Services() {
  const data = await content("services");
  return (
    <div className="catalogue-page">
      <PageIntro
        label="Our services"
        title="The right technology. For your next step."
        description="From your first website to the systems behind your business, explore practical services built around the way you work."
      />
      <nav className="shell catalogue-links" aria-label="Page shortcuts">
        <Link href="#browse">
          Browse services <span aria-hidden="true">↓</span>
        </Link>
        <Link href="#frequently-asked-questions">Common questions</Link>
        <Link href="/contact">
          Let’s talk about your idea <span aria-hidden="true">↗</span>
        </Link>
      </nav>
      <section
        id="browse"
        aria-label="Available services"
        className="shell listing-section"
      >
        {data.items.length ? (
          <ServicesGrid items={data.items} />
        ) : (
          <EmptyState subject="services" unavailable={data.unavailable} />
        )}
      </section>
      <Faq />
      <ContactCta />
    </div>
  );
}
