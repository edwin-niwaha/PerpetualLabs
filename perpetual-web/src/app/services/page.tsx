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
    <>
      <PageIntro
        label="Our services"
        title="The right technology. For your next step."
        description="From your first website to the systems behind your business, explore practical services built around the way you work."
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
