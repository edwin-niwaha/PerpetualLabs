import type { Metadata } from "next";
import { content } from "@/lib/api";
import { PageIntro, EmptyState, ContactCta } from "@/components/ui";
import { ServicesGrid } from "@/components/content-cards";
export const metadata: Metadata = {
  title: "Services",
  description: "Explore the services available from Perpetual Labs.",
};
export default async function Services() {
  const data = await content("services");
  return (
    <>
      <PageIntro
        label="Our services"
        title="From what if, to what’s next."
        description="Explore how we can help shape, build, and move your next idea forward."
      />
      <section className="shell listing-section">
        {data.items.length ? (
          <ServicesGrid items={data.items} />
        ) : (
          <EmptyState subject="services" unavailable={data.unavailable} />
        )}
      </section>
      <ContactCta />
    </>
  );
}
