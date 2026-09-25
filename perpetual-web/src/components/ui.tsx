import Link from "next/link";
import { ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span className="status-dot" />
      {children}
    </div>
  );
}
export function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro shell">
      <Eyebrow>{label}</Eyebrow>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function SectionHeading({
  label,
  title,
  href,
  link,
}: {
  label: string;
  title: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <Eyebrow>{label}</Eyebrow>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-link">
          {link || "Explore more"}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  unavailable,
  subject,
}: {
  unavailable: boolean;
  subject: string;
}) {
  return (
    <div className="empty-state">
      <Plus size={24} />
      <div>
        <h3>{unavailable ? "A brief pause." : "More to come."}</h3>
        <p>
          {unavailable
            ? `Our ${subject} couldn’t be loaded. Please try again shortly.`
            : `New ${subject} will appear here when published. In the meantime, let’s talk about what you have in mind.`}
        </p>
      </div>
      <Link href="/contact" className="text-link">
        Get in touch <ArrowRight size={17} />
      </Link>
    </div>
  );
}
export function ContactCta() {
  return (
    <section className="shell cta-wrap">
      <div className="contact-cta">
        <div>
          <Eyebrow>Make the next move</Eyebrow>
          <h2>
            Good things start
            <br />
            with a conversation.
          </h2>
        </div>
        <Link
          className="round-link"
          href="/contact"
          aria-label="Start a conversation"
        >
          <ArrowUpRight size={42} />
        </Link>
        <span className="cta-note">Your idea. Our next conversation.</span>
      </div>
    </section>
  );
}
