import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { GalaxyHero } from "@/components/galaxy-hero";
import { ProductGrid } from "@/components/product-grid";
import { safeImage, safeWebsite } from "@/lib/site";
import {
  Eyebrow,
  SectionHeading,
  EmptyState,
  ContactCta,
} from "@/components/ui";
import { ServicesGrid, ArticlesGrid } from "@/components/content-cards";
import { Faq } from "@/components/faq";
import { content } from "@/lib/api";
import { websiteContent } from "@/lib/website-content";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { company, section, features } = await websiteContent();
  const [services, products, articles, testimonials, visuals] =
    await Promise.all([
      content("services"),
      content("products"),
      content("blog"),
      content("testimonials"),
      content("visuals"),
    ]);
  const galaxy = visuals.items.find((v) => v.key === "galaxy");
  const earth = visuals.items.find((v) => v.key === "earth");
  return (
    <>
      <GalaxyHero
        copy={section("home-hero")}
        galaxy={safeImage(galaxy?.image)}
        earth={safeImage(earth?.image)}
        credit={galaxy?.credit || ""}
        source={safeWebsite(galaxy?.source_url)}
      />
      <div className="principle-strip">
        <div className="shell">
          <span>Based in {company.location}</span>
          <Asterisk />
          <span>Building since {company.founded}</span>
          <Asterisk />
          <span>Business-focused solutions</span>
          <Asterisk />
          <span>Support beyond launch</span>
        </div>
      </div>
      <section className="section shell" id="what-we-do">
        <SectionHeading
          label={section("home-services").eyebrow}
          title={section("home-services").title}
          href="/services"
          link="Explore all services"
        />
        <div className="section-lead">
          <p>{section("home-services").description}</p>
        </div>
        {services.items.length ? (
          <ServicesGrid items={services.items.slice(0, 3)} />
        ) : (
          <EmptyState subject="services" unavailable={services.unavailable} />
        )}
      </section>
      <section className="work-section product-section" id="products">
        <div className="shell section">
          <SectionHeading
            label={section("home-products").eyebrow}
            title={section("home-products").title}
            href="/projects"
            link="Explore our products"
          />
          <div className="section-lead">
            <p>{section("home-products").description}</p>
          </div>
          {products.items.filter((p) => p.is_featured).length ? (
            <ProductGrid
              items={products.items.filter((p) => p.is_featured).slice(0, 4)}
            />
          ) : (
            <EmptyState subject="projects" unavailable={products.unavailable} />
          )}
        </div>
      </section>
      <section className="section shell approach">
        <div>
          <Eyebrow>{section("home-approach").eyebrow}</Eyebrow>
          <h2 className="preserve-lines">{section("home-approach").title}</h2>
          {section("home-approach").description && (
            <p>{section("home-approach").description}</p>
          )}
          <Link href="/about" className="text-link">
            Get to know Perpetual Labs <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="approach-list">
          {features
            .filter((f) => f.group === "approach")
            .map((feature, index) => {
              const n = String(index + 1).padStart(2, "0");
              const { title: t, description: d } = feature;
              return (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                  <ArrowUpRight size={20} />
                </div>
              );
            })}
        </div>
      </section>
      {testimonials.items.length > 0 && (
        <section className="testimonials-section">
          <div className="shell section">
            <SectionHeading
              label="Client perspectives"
              title="The work matters. So do the relationships."
            />
            <div className="testimonial-grid">
              {testimonials.items.slice(0, 3).map((t) => (
                <figure key={t.id}>
                  <span className="quote-mark" aria-hidden="true">
                    “
                  </span>
                  <blockquote>{t.content}</blockquote>
                  <figcaption>
                    <strong>{t.name}</strong>
                    <span>
                      {t.position}
                      {t.company ? ` · ${t.company}` : ""}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
      {articles.items.length > 0 && (
        <section className="section shell">
          <SectionHeading
            label="The journal"
            title="Notes from the lab."
            href="/blog"
            link="Read the journal"
          />
          <ArticlesGrid items={articles.items.slice(0, 3)} />
        </section>
      )}
      <Faq />
      <ContactCta />
    </>
  );
}
