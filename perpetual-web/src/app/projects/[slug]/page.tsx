import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { content } from "@/lib/api";
import { safeImage, safeWebsite } from "@/lib/site";
import { ContactCta } from "@/components/ui";
async function getProject(slug: string) {
  const data = await content("projects");
  if (data.unavailable) throw new Error("Project content unavailable");
  return data.items.find((item) => item.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const item = await getProject((await params).slug);
  return {
    title: item?.title || "Project",
    description: item?.description.slice(0, 160),
  };
}
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getProject((await params).slug);
  if (!item) notFound();
  const image = safeImage(item.image);
  const website = safeWebsite(item.website_url);
  return (
    <>
      <article className="shell detail-page">
        <Link href="/projects" className="text-link">
          ← All work
        </Link>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.description}</p>
        <div className="detail-meta">
          <span>
            Completed{" "}
            {new Date(item.completion_date).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </span>
          {item.technologies?.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        {image && (
          <div className="detail-image">
            <Image
              src={image}
              alt={item.title}
              fill
              sizes="(max-width: 850px) 100vw, 850px"
              priority
            />
          </div>
        )}
        {item.detail && <div className="prose">{item.detail}</div>}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            Visit project ↗
          </a>
        )}
      </article>
      <ContactCta />
    </>
  );
}
