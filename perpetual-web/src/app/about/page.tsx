import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Target,
  Telescope,
  Code2,
  Network,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { ContactCta } from "@/components/ui";
import { content } from "@/lib/api";
import { safeImage } from "@/lib/site";
import { websiteContent } from "@/lib/website-content";
import styles from "./about.module.css";
import defaults from "@/lib/site-defaults.json";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Perpetual Labs. Discover our mission, vision, and the people building websites, software, and reliable IT solutions in Kampala.",
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
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            About Perpetual Labs
          </p>
          <h1 id="about-title">{intro.title}</h1>
          <p className={styles.lead}>{intro.description}</p>
          <div className={styles.actions}>
            <Link href="/contact" className="button">
              Let’s build something{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <a href="#our-purpose" className={styles.storyLink}>
              Our mission & vision <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.visualHeader}>
            <span>THINK. BUILD. SUPPORT.</span>
            <ArrowUpRight size={22} aria-hidden="true" />
          </div>
          <div className={styles.orbit} aria-hidden="true">
            <span className={styles.orbitRing} />
            <span className={styles.orbitRing} />
            <span className={styles.orbitRing} />
            <span className={styles.orbitCore}>
              pl<span>perpetual labs</span>
            </span>
            <span className={styles.orbitDot} />
          </div>
          <div className={styles.visualCopy}>
            <p>Grounded in {company.location}.</p>
            <h2>
              Built around
              <br />
              your possibilities.
            </h2>
          </div>
          <div className={styles.visualTags}>
            <span>
              <Code2 size={14} aria-hidden="true" />
              Build
            </span>
            <span>
              <Network size={14} aria-hidden="true" />
              Connect
            </span>
            <span>
              <Handshake size={14} aria-hidden="true" />
              Support
            </span>
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
        id="our-purpose"
        className={`${styles.shell} ${styles.purposeSection}`}
        aria-labelledby="purpose-title"
      >
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>01 / Why we do what we do</p>
            <h2 id="purpose-title">
              A clear purpose.
              <br />
              <em>A shared direction.</em>
            </h2>
          </div>
          <p>
            Our mission shapes the work we do today. Our vision keeps us looking
            toward what technology can make possible.
          </p>
        </div>
        <div className={styles.purpose}>
          <article className={styles.mission} aria-labelledby="mission-title">
            <div className={styles.cardTop}>
              <span className={styles.eyebrow}>What drives us</span>
              <Target size={28} strokeWidth={1.4} aria-hidden="true" />
            </div>
            <h2 id="mission-title">Our mission.</h2>
            <p>{company.mission?.trim() || defaults.settings.mission}</p>
            <div className={styles.purposeNote}>
              Useful tools. Confident businesses.
              <ArrowUpRight size={19} aria-hidden="true" />
            </div>
          </article>
          <article className={styles.vision} aria-labelledby="vision-title">
            <div className={styles.cardTop}>
              <span className={styles.eyebrow}>Where we’re going</span>
              <Telescope size={28} strokeWidth={1.4} aria-hidden="true" />
            </div>
            <h2 id="vision-title">Our vision.</h2>
            <p>{company.vision?.trim() || defaults.settings.vision}</p>
            <div className={styles.purposeNote}>
              Stronger foundations. New possibilities.
              <ArrowUpRight size={19} aria-hidden="true" />
            </div>
          </article>
        </div>
      </section>

      <section
        id="our-story"
        className={`${styles.shell} ${styles.story}`}
        aria-labelledby="story-title"
      >
        <div>
          <p className={styles.eyebrow}>02 / Our story</p>
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

      {values.length > 0 && (
        <section
          className={`${styles.shell} ${styles.values}`}
          aria-labelledby="values-title"
        >
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>03 / What guides us</p>
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
                <p className={styles.eyebrow}>04 / People of Perpetual</p>
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
