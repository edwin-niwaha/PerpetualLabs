import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { ContactCta } from "@/components/ui";
async function getArticle(slug: string) {
  const data = await content("blog");
  if (data.unavailable) throw new Error("Article content unavailable");
  return data.items.find((item) => item.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const item = await getArticle((await params).slug);
  return {
    title: item?.title || "Article",
    description: item?.excerpt.slice(0, 160),
    openGraph: {
      type: "article",
      title: item?.title,
      description: item?.excerpt.slice(0, 160),
    },
  };
}
export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getArticle((await params).slug);
  if (!item) notFound();
  const image = safeImage(item.image);
  return (
    <>
      <article className="shell detail-page">
        <Link href="/blog" className="text-link">
          ← Back to the journal
        </Link>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.excerpt}</p>
        <div className="detail-meta">
          <span>By {item.author}</span>
          <time dateTime={item.created_at}>
            {new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          {item.category && <span>{item.category}</span>}
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
        <div className="prose">{item.content}</div>
      </article>
      <ContactCta />
    </>
  );
}
