import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PageIntro, ContactCta, SectionHeading } from "@/components/ui";
import { Orbit } from "@/components/orbit";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { company } from "@/lib/company-content";
export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Perpetual Labs: a Kampala-based team building websites, software, and reliable IT solutions since 2020.",
};
export default async function About() {
  const team = await content("team");
  return (
    <>
      <PageIntro
        label="Built on curiosity. Grounded in Kampala."
        title="Technology with people at its heart."
        description="Since 2020, Perpetual Labs has helped businesses put technology to work through software, infrastructure, and ongoing support."
      />
      <section className="shell about-story">
        <Orbit />
        <div>
          <span className="eyebrow">Our story / Est. {company.founded}</span>
          <h2>
            A practical partner.
            <br />A shared ambition.
          </h2>
          <p>
            We began as a small team with a focus on useful, dependable IT
            solutions. Today, our work spans the customer-facing website, the
            systems behind the business, and the support that keeps them moving.
          </p>
          <p>
            Based in {company.location}, we shape each solution around the
            organization using it—with attention to quality, integrity, and the
            relationship beyond delivery.
          </p>
          <Link className="text-link story-link" href="/services">
            Explore what we do <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="shell section mission-grid">
        <article>
          <span className="eyebrow">01 / Our mission</span>
          <h2>
            Make technology
            <br />
            work for business.
          </h2>
          <p>{company.mission}</p>
        </article>
        <article>
          <span className="eyebrow">02 / Our vision</span>
          <h2>
            A stronger foundation
            <br />
            for what’s next.
          </h2>
          <p>{company.vision}</p>
        </article>
      </section>
      <section className="shell section values-section">
        <SectionHeading
          label="What guides us"
          title="The standards behind the work."
        />
        <div className="values-grid">
          {[
            [
              "01",
              "Excellence",
              "Careful delivery, dependable performance, and attention to the details.",
            ],
            [
              "02",
              "Client focus",
              "Your needs shape the solution. We listen before we build.",
            ],
            [
              "03",
              "Innovation",
              "Keep learning, explore better approaches, and make change useful.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span className="eyebrow">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      {team.items.length > 0 && (
        <section className="team-section">
          <div className="shell section">
            <SectionHeading
              label="People of Perpetual"
              title="A team you can put a name to."
            />
            <div className="team-grid">
              {team.items.map((person) => (
                <article className="team-card" key={person.id}>
                  {safeImage(person.image) ? (
                    <Image
                      src={safeImage(person.image)!}
                      alt={person.name}
                      width={400}
                      height={400}
                    />
                  ) : (
                    <span className="team-initials" aria-hidden="true">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <h3>{person.name}</h3>
                  <p>{person.position.replaceAll("_", " ")}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      <ContactCta />
    </>
  );
}
