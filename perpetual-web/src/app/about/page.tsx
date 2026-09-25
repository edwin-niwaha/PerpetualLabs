import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro, ContactCta, SectionHeading } from "@/components/ui";
import { Orbit } from "@/components/orbit";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
export const metadata: Metadata = {
  title: "About",
  description: "Get to know the thinking behind Perpetual Labs.",
};
export default async function About() {
  const team = await content("team");
  return (
    <>
      <PageIntro
        label="A little about us"
        title="Curiosity is a good place to start."
        description="Perpetual Labs brings design and technology together around a simple ambition: making useful things, thoughtfully."
      />
      <section className="shell about-story">
        <Orbit />
        <div>
          <span className="eyebrow">Our direction</span>
          <h2>
            Keep asking.
            <br />
            Keep making.
            <br />
            Keep moving.
          </h2>
          <p>
            We’re interested in the space between an idea and its possibilities.
            The questions that clarify it. The design that gives it shape. The
            engineering that makes it work.
          </p>
          <p>
            Our aim is to create digital experiences that feel considered, serve
            a purpose, and leave room to grow.
          </p>
        </div>
      </section>
      <section className="shell section">
        <SectionHeading
          label="What guides us"
          title="Principles, put into practice."
        />
        <div className="values-grid">
          {[
            [
              "01",
              "Clarity",
              "Make complex ideas easier to understand and use.",
            ],
            [
              "02",
              "Care",
              "Pay attention to the details and the people they affect.",
            ],
            [
              "03",
              "Curiosity",
              "Stay open to better questions and different perspectives.",
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
        <section className="shell section">
          <SectionHeading label="People of the lab" title="Meet the team." />
          <div className="team-grid">
            {team.items.map((person) => (
              <article key={person.id}>
                {safeImage(person.image) && (
                  <Image
                    src={safeImage(person.image)!}
                    alt={person.name}
                    width={400}
                    height={400}
                  />
                )}
                <h3>{person.name}</h3>
                <p>{person.position.replaceAll("_", " ")}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <ContactCta />
    </>
  );
}
