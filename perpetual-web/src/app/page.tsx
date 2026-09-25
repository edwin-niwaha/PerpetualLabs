import Link from "next/link";
import { ArrowUpRight, ArrowDown, Asterisk } from "lucide-react";
import { Orbit } from "@/components/orbit";
import {
  Eyebrow,
  SectionHeading,
  EmptyState,
  ContactCta,
} from "@/components/ui";
import {
  ServicesGrid,
  ProjectsGrid,
  ArticlesGrid,
} from "@/components/content-cards";
import { Faq } from "@/components/faq";
import { content } from "@/lib/api";
import { company } from "@/lib/company-content";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [services, projects, articles, testimonials] = await Promise.all([
    content("services"),
    content("projects"),
    content("blog"),
    content("testimonials"),
  ]);
  return (
    <>
      <section className="shell hero">
        <div className="hero-copy">
          <Eyebrow>Thoughtful technology. Built in Kampala.</Eyebrow>
          <h1>
            Big ideas.
            <br />
            Built to <span className="serif-word">go</span>
            <br />
            <span className="hero-last">
              further.
              <Asterisk className="hero-asterisk" strokeWidth={1.3} />
            </span>
          </h1>
          <p>{company.introduction}</p>
          <div className="hero-actions">
            <Link className="button" href="/contact">
              Let’s build something <ArrowUpRight size={19} />
            </Link>
            <Link className="text-link" href="/projects">
              Explore our work <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <Orbit />
        <div className="hero-caption">
          <span>PERPETUAL LABS / SOFTWARE, WEBSITES & IT SOLUTIONS</span>
          <a href="#what-we-do">
            Discover what we do <ArrowDown size={15} />
          </a>
        </div>
      </section>
      <div className="principle-strip">
        <div className="shell">
          <span>Based in Kampala, Uganda</span>
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
          label="01 / How we help"
          title="Better tools. Stronger businesses."
          href="/services"
          link="Explore all services"
        />
        <div className="section-lead">
          <p>
            A connected approach to your technology—from the website customers
            see to the systems your team relies on.
          </p>
        </div>
        {services.items.length ? (
          <ServicesGrid items={services.items.slice(0, 3)} />
        ) : (
          <EmptyState subject="services" unavailable={services.unavailable} />
        )}
      </section>
      <section className="work-section">
        <div className="shell section">
          <SectionHeading
            label="02 / From the lab"
            title="Built around the way you work."
            href="/projects"
            link="Explore our products"
          />
          <div className="section-lead">
            <p>
              Retail, nonprofit operations, finance, and more. Meet the products
              designed to make everyday work simpler.
            </p>
          </div>
          {projects.items.length ? (
            <ProjectsGrid items={projects.items.slice(0, 4)} />
          ) : (
            <EmptyState subject="projects" unavailable={projects.unavailable} />
          )}
        </div>
      </section>
      <section className="section shell approach">
        <div>
          <Eyebrow>03 / A practical partnership</Eyebrow>
          <h2>
            Understand the need.
            <br />
            Build the right thing.
            <br />
            <span className="serif-word">Keep it moving.</span>
          </h2>
          <Link href="/about" className="text-link">
            Get to know Perpetual Labs <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="approach-list">
          {[
            [
              "01",
              "Your business comes first.",
              "We start with the people, processes, and priorities the technology needs to serve.",
            ],
            [
              "02",
              "A solution shaped to fit.",
              "Websites, software, and infrastructure are tailored to your needs, with attention to usability and reliability.",
            ],
            [
              "03",
              "A partner beyond delivery.",
              "Maintenance, training, and ongoing support help your team keep getting value from its systems.",
            ],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
          ))}
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
