import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, Target, Telescope } from "lucide-react";
import Link from "next/link";
import { ContactCta } from "@/components/ui";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { websiteContent } from "@/lib/website-content";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Perpetual Labs: a Kampala-based team building websites, software, and reliable IT solutions since 2020.",
};

export default async function About() {
  const { company, section, features } = await websiteContent();
  const team = await content("team");
  const intro = section("about");
  const values = features.filter((feature) => feature.group === "values");

  return (
    <div className={styles.page}>
      <section
        className={`${styles.shell} ${styles.hero}`}
        aria-labelledby="about-title"
      >
        <div className={styles.heroCopy}>
          <h1 id="about-title">{intro.title}</h1>
          <p className={styles.lead}>{intro.description}</p>
          <div className={styles.actions}>
            <Link href="/contact" className="button">
              Let’s build something{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <a href="#our-story" className={styles.storyLink}>
              Our story <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div className={`${styles.shell} ${styles.context}`}>
        <span>Independent thinking. Lasting partnerships.</span>
        <span>
          Websites <i aria-hidden="true">/</i> Software{" "}
          <i aria-hidden="true">/</i> IT support
        </span>
      </div>

      <section
        id="our-story"
        className={`${styles.shell} ${styles.story}`}
        aria-labelledby="story-title"
      >
        <div>
          <p className={styles.eyebrow}>01 / Our story</p>
          <h2 id="story-title">
            A practical partner.
            <br />
            <em>A shared ambition.</em>
          </h2>
          <Link className={styles.storyLink} href="/services">
            Explore what we do <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.storyCopy}>
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
          <div className={styles.storyNote}>
            <span className={styles.noteMark} aria-hidden="true">
              ↗
            </span>
            <span>
              Thoughtful technology.
              <br />
              <strong>Practical possibilities.</strong>
            </span>
          </div>
        </div>
      </section>

      <section
        className={`${styles.shell} ${styles.purpose}`}
        aria-label="Our mission and vision"
      >
        <article className={styles.mission}>
          <div className={styles.cardTop}>
            <span className={styles.eyebrow}>Our mission</span>
            <Target size={24} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <h2>
            Make technology
            <br />
            work for business.
          </h2>
          <p>{company.mission}</p>
        </article>
        <article className={styles.vision}>
          <div className={styles.cardTop}>
            <span className={styles.eyebrow}>Our vision</span>
            <Telescope size={24} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <h2>
            A stronger foundation
            <br />
            for what’s next.
          </h2>
          <p>{company.vision}</p>
        </article>
      </section>

      {values.length > 0 && (
        <section
          className={`${styles.shell} ${styles.values}`}
          aria-labelledby="values-title"
        >
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>02 / What guides us</p>
              <h2 id="values-title">
                The standards
                <br />
                <em>behind the work.</em>
              </h2>
            </div>
            <p>
              How we think, how we build, and how we show up for the people we
              work with.
            </p>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((feature, index) => (
              <article key={`${feature.title}-${index}`}>
                <span className={styles.valueNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {team.items.length > 0 && (
        <section className={styles.teamSection} aria-labelledby="team-title">
          <div className={styles.shell}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>03 / People of Perpetual</p>
                <h2 id="team-title">
                  Good people.
                  <br />
                  <em>Shared curiosity.</em>
                </h2>
              </div>
              <p>
                A team you can put a name to. Meet the people behind the ideas,
                the details, and the work.
              </p>
            </div>
            <div className={styles.teamGrid}>
              {team.items.map((person, index) => {
                const portrait = safeImage(person.image);
                return (
                  <article
                    className={`team-card ${styles.person}`}
                    key={person.id}
                  >
                    <div className={styles.portrait}>
                      {portrait ? (
                        <Image
                          src={portrait}
                          alt={person.name}
                          width={400}
                          height={400}
                          sizes="(max-width: 600px) 90vw, (max-width: 1000px) 44vw, 24vw"
                        />
                      ) : (
                        <span className={styles.initials} aria-hidden="true">
                          {person.name
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      )}
                      <span className={styles.personIndex} aria-hidden="true">
                        PL / {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className={styles.personInfo}>
                      <h3>{person.name}</h3>
                      <p>{person.position.replaceAll("_", " ")}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <ContactCta />
    </div>
  );
}
