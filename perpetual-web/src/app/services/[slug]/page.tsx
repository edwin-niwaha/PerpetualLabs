import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { notFound } from "next/navigation";
import { content } from "@/lib/api";
import { ContactCta, Eyebrow } from "@/components/ui";
async function getService(slug: string) {
  const data = await content("services");
  if (data.unavailable) throw new Error("Service content unavailable");
  return data.items.find((item) => item.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const item = await getService((await params).slug);
  return {
    title: item?.title || "Service",
    description: item?.description.slice(0, 160),
  };
}
export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getService((await params).slug);
  if (!item) notFound();
  return (
    <>
      <article className="shell detail-page">
        <Link className="text-link" href="/services">
          ← All services
        </Link>
        <h1>{item.title}</h1>
        <Eyebrow>Built around your business</Eyebrow>
        <div className="prose" style={{ marginTop: 30 }}>
          {item.description}
        </div>
        {!!item.highlights?.length && (
          <section className="detail-capabilities">
            <h2>How we can help</h2>
            <ul>
              {item.highlights.map((highlight) => (
                <li key={highlight}>
                  <Check size={18} />
                  {highlight}
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link href="/contact" className="button">
          Discuss your project ↗
        </Link>
      </article>
      <ContactCta />
    </>
  );
}
