import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Layers,
} from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { businessProducts } from "@/lib/business-products";
import { mobileProjects, projectImage } from "@/lib/mobile-projects";
import { notFound } from "next/navigation";
import { content } from "@/lib/api";
import { safeImage, safeWebsite } from "@/lib/site";
import { ContactCta } from "@/components/ui";
import { ProjectArtwork } from "@/components/project-artwork";
async function getProject(slug: string) {
  const portfolioItem = [...businessProducts, ...mobileProjects].find(
    (item) => item.slug === slug,
  );
  if (portfolioItem) return portfolioItem;
  const [data, products] = await Promise.all([
    content("projects"),
    content("products"),
  ]);
  const product = products.items.find((item) => item.slug === slug);
  if (product) return product;
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
  const image = projectImage(item.slug) || safeImage(item.image);
  const status = "status" in item ? item.status : null;
  const website = safeWebsite(item.website_url);
  const statusLabel =
    status === "live"
      ? "Live product"
      : status === "complete"
        ? "Complete"
        : status === "development"
          ? "In development"
          : status === "available"
            ? "Available"
            : "Selected work";
  const planned = item.slug === "perpetuallearn";
  const features = item.focus || [];
  return (
    <div className="project-detail-view">
      <article className="shell project-case">
        <nav className="project-case-nav" aria-label="Project navigation">
          <Link href="/projects" className="text-link">
            <ArrowLeft size={16} /> All projects
          </Link>
          <span
            className={`case-status ${status === "development" ? "case-status-development" : ""}`}
          >
            <span aria-hidden="true" />
            {statusLabel}
          </span>
        </nav>
        <header className="project-case-header">
          <span className="eyebrow">
            {item.project_type || "A Perpetual Labs project"}
          </span>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </header>
        <div className="project-case-showcase">
          <figure className="project-case-figure">
            <div className="project-case-image">
              {image ? (
                <ProductImage
                  src={image}
                  alt={
                    "image_alt" in item && typeof item.image_alt === "string"
                      ? item.image_alt
                      : item.title
                  }
                  title={item.title}
                  fallbackSrc={projectImage(item.slug)}
                  sizes="(max-width: 960px) 100vw, 65vw"
                  eager
                />
              ) : (
                <ProjectArtwork project={item} />
              )}
            </div>
            <figcaption>
              <span>
                PERPETUAL LABS /{" "}
                {item.project_type?.startsWith("Mobile application")
                  ? "MOBILE"
                  : "DIGITAL PRODUCTS"}
              </span>
              <Layers size={17} aria-hidden="true" />
            </figcaption>
          </figure>
          <aside
            className="project-case-overview"
            aria-labelledby="project-overview-title"
          >
            <span className="eyebrow">The overview</span>
            <h2 id="project-overview-title">
              {planned
                ? "A look at what’s ahead."
                : "Thoughtfully built. Purposefully made."}
            </h2>
            <p className="project-case-description">
              {item.detail || item.description}
            </p>
            <dl className="project-case-facts">
              <div>
                <dt>Category</dt>
                <dd>{item.project_type || "Digital product"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel}</dd>
              </div>
              {item.completion_date && (
                <div>
                  <dt>Completed</dt>
                  <dd>
                    {new Date(item.completion_date).toLocaleDateString(
                      "en-GB",
                      { month: "long", year: "numeric", timeZone: "UTC" },
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <div className="project-case-actions">
              {website && (
                <a
                  className="button"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit project <ArrowUpRight size={18} />
                </a>
              )}
              <Link
                href="/contact"
                className={website ? "text-link" : "button"}
              >
                Discuss a similar project <ArrowUpRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
        {features.length > 0 && (
          <section
            className="project-case-capabilities"
            aria-labelledby="project-features-title"
          >
            <div className="project-case-section-heading">
              <div>
                <span className="eyebrow">
                  {planned ? "On the roadmap" : "At a glance"}
                </span>
                <h2 id="project-features-title">
                  {planned
                    ? "Planned capabilities."
                    : "What it brings together."}
                </h2>
              </div>
              <span className="project-case-count">
                {String(features.length).padStart(2, "0")}{" "}
                {planned ? "planned capabilities" : "core capabilities"}
              </span>
            </div>
            <ul className="project-case-feature-grid">
              {features.map((feature, index) => {
                const separator = feature.indexOf(":");
                const title =
                  separator === -1 ? feature : feature.slice(0, separator);
                const description =
                  separator === -1 ? null : feature.slice(separator + 1).trim();
                return (
                  <li key={feature} className="project-case-feature">
                    <div className="project-case-feature-top">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {planned ? (
                        <Layers size={19} aria-hidden="true" />
                      ) : (
                        <Check size={19} aria-hidden="true" />
                      )}
                    </div>
                    <h3>{title}</h3>
                    {description && <p>{description}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {!!item.technologies?.length && (
          <section className="project-case-stack" aria-label="Technologies">
            <span className="eyebrow">Built with</span>
            <ul>
              {item.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </section>
        )}
        <div className="project-case-more">
          <div>
            <span className="eyebrow">There’s more to explore</span>
            <h2>Different ideas. Same care.</h2>
          </div>
          <Link href="/projects" className="text-link">
            View all projects <ArrowRight size={18} />
          </Link>
        </div>
      </article>
      <ContactCta />
    </div>
  );
}
