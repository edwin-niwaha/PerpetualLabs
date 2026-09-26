import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms";
import { websiteContent } from "@/lib/website-content";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Perpetual Labs in Kampala, Uganda. Discuss a website, business software, infrastructure, or IT support.",
};

export default async function Contact() {
  const { company, section } = await websiteContent();
  const intro = section("contact");

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" /> {intro.eyebrow}
          </p>
          <h1>{intro.title}</h1>
        </div>
        <p className={styles.lead}>{intro.description}</p>
      </header>

      <section className={styles.layout} aria-label="Get in touch">
        <aside className={styles.aside}>
          <div className={styles.asideTop}>
            <span className={styles.kicker}>Good work starts here</span>
            <ArrowUpRight size={26} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <h2>
            Here in Kampala.
            <br />
            <em>Ready to connect.</em>
          </h2>
          <p className={styles.asideCopy}>
            An idea, a challenge, or a fresh start. Let’s talk about what comes
            next.
          </p>

          <div className={`contact-methods ${styles.methods}`}>
            <a href={company.phoneHref}>
              <span className={styles.icon}>
                <Phone size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Call us</span>
                <strong>{company.phone}</strong>
              </div>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a href={`mailto:${company.email}`}>
              <span className={styles.icon}>
                <Mail size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Email us</span>
                <strong>{company.email}</strong>
              </div>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <div>
              <span className={styles.icon}>
                <MapPin size={19} aria-hidden="true" />
              </span>
              <div>
                <span>Find us</span>
                <p>{company.location}</p>
              </div>
            </div>
          </div>

          <a
            className={`whatsapp-link ${styles.whatsapp}`}
            href={company.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={20} aria-hidden="true" />
            Start a WhatsApp conversation
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <div className={styles.signature}>
            <span>Perpetual Labs</span>
            <span>Ideas into possibilities.</span>
          </div>
        </aside>

        <div className={styles.formPanel}>
          <div className={styles.formHeading}>
            <span className={styles.kicker}>
              A little detail. A great beginning.
            </span>
            <span className={styles.formNumber} aria-hidden="true">
              01 / HELLO
            </span>
          </div>
          <h2>Tell us what you have in mind.</h2>
          <p className={styles.formDescription}>
            Share a few details about your business and what you’d like to make
            happen.
          </p>
          <ContactForm />
        </div>
      </section>

      <div className={styles.closing}>
        <span>
          Thoughtful technology. <em>Practical possibilities.</em>
        </span>
        <span>
          Websites <i>/</i> Software <i>/</i> IT support
        </span>
      </div>
    </div>
  );
}
