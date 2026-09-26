import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { journalDate, readingTime } from "@/lib/journal";
import { JournalMarkdown } from "@/components/journal-markdown";
import { JournalShare } from "@/components/journal-share";
async function getArticle(slug: string) {
  const data = await content("blog");
  if (data.unavailable) throw new Error("Journal unavailable");
  return {
    item: data.items.find((a) => a.slug === slug),
    articles: data.items,
  };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { item } = await getArticle((await params).slug);
  return item
    ? {
        title: item.title,
        description: item.excerpt,
        openGraph: {
          type: "article",
          title: item.title,
          description: item.excerpt,
          publishedTime: item.published_at || item.created_at,
        },
      }
    : { title: "Entry not found" };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { item, articles } = await getArticle((await params).slug);
  if (!item) notFound();
  const image = safeImage(item.image);
  const related = articles
    .filter((a) => a.id !== item.id)
    .sort(
      (a, b) =>
        Number(b.category === item.category) -
        Number(a.category === item.category),
    )
    .slice(0, 3);
  return (
    <div className="shell journal-reader">
      <Link className="journal-back" href="/blog">
        ← Back to the journal
      </Link>
      <article>
        <header className="journal-reader-header">
          <p className="journal-eyebrow">{item.category || "FIELD NOTES"}</p>
          <h1>{item.title}</h1>
          <p className="journal-deck">{item.excerpt}</p>
          <div className="journal-meta">
            <span>By {item.author}</span>
            <time dateTime={item.published_at || item.created_at}>
              {journalDate(item)}
            </time>
            <span>{readingTime(item.content)} min read</span>
          </div>
        </header>
        {image && (
          <div className="journal-cover">
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1000px"
            />
          </div>
        )}
        <JournalMarkdown>{item.content}</JournalMarkdown>
        <JournalShare />
      </article>
      {related.length > 0 && (
        <section className="journal-related">
          <p className="journal-eyebrow">KEEP EXPLORING</p>
          <h2>Another page to turn.</h2>
          <div>
            {related.map((a) => (
              <Link key={a.id} href={`/blog/${a.slug}`}>
                <span>
                  {a.category || "Field notes"} · {readingTime(a.content)} min
                  read
                </span>
                <h3>{a.title} ↗</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
