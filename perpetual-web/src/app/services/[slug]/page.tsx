import type { Metadata } from "next";
import Link from "next/link";
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
        <Eyebrow>Designed around your next step</Eyebrow>
        <div className="prose" style={{ marginTop: 30 }}>
          {item.description}
        </div>
        <Link href="/contact" className="button">
          Discuss your project ↗
        </Link>
      </article>
      <ContactCta />
    </>
  );
}
