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
import { content } from "@/lib/api";
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
          <Eyebrow>Independent thinking. Lasting possibilities.</Eyebrow>
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
          <p>
            We bring thoughtful design and purposeful engineering together to
            turn your next idea into something that matters.
          </p>
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
          <span>PERPETUAL LABS — IDEAS IN MOTION</span>
          <a href="#what-we-do">
            A little further down <ArrowDown size={15} />
          </a>
        </div>
      </section>
      <div className="principle-strip">
        <div className="shell">
          <span>Think with curiosity</span>
          <Asterisk />
          <span>Design with intention</span>
          <Asterisk />
          <span>Build with purpose</span>
          <Asterisk />
          <span>Keep moving forward</span>
        </div>
      </div>
      <section className="section shell" id="what-we-do">
        <SectionHeading
          label="01 / What we do"
          title="Good thinking. Great making."
          href="/services"
          link="All services"
        />
        <div className="section-lead">
          <p>
            From the first question to the final detail, we make room for ideas
            that deserve to become real.
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
            label="02 / Selected work"
            title="Ideas, out in the world."
            href="/projects"
            link="View all work"
          />
          {projects.items.length ? (
            <ProjectsGrid items={projects.items.slice(0, 4)} />
          ) : (
            <EmptyState subject="projects" unavailable={projects.unavailable} />
          )}
        </div>
      </section>
      <section className="section shell approach">
        <div>
          <Eyebrow>03 / The way we think</Eyebrow>
          <h2>
            Better questions.
            <br />
            More meaningful
            <br />
            <span className="serif-word">possibilities.</span>
          </h2>
          <Link href="/about" className="text-link">
            Meet Perpetual Labs <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="approach-list">
          {[
            [
              "01",
              "Start with the why.",
              "Before deciding what to build, we make space to understand the problem and the people behind it.",
            ],
            [
              "02",
              "Make it feel right.",
              "Clear ideas become thoughtful experiences. Every interaction should have a reason to be there.",
            ],
            [
              "03",
              "Build for what’s next.",
              "Considered engineering makes room for change, so the next step can build on the last.",
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
              label="In their words"
              title="The people behind the projects."
            />
            <div className="testimonial-grid">
              {testimonials.items.slice(0, 3).map((t) => (
                <figure key={t.id}>
                  <span className="quote-mark">“</span>
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
      <section className="section shell">
        <SectionHeading
          label="04 / The journal"
          title="Notes from the lab."
          href="/blog"
          link="Read the journal"
        />
        {articles.items.length ? (
          <ArticlesGrid items={articles.items.slice(0, 3)} />
        ) : (
          <EmptyState subject="articles" unavailable={articles.unavailable} />
        )}
      </section>
      <ContactCta />
    </>
  );
}
