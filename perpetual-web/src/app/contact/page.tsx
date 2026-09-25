import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { PageIntro } from "@/components/ui";
import { ContactForm } from "@/components/forms";
import { company } from "@/lib/company-content";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Perpetual Labs in Kampala, Uganda. Discuss a website, business software, infrastructure, or IT support.",
};
export default function Contact() {
  return (
    <>
      <PageIntro
        label="A conversation is a good start"
        title="Let’s put your next idea to work."
        description="Tell us what you want to build, improve, or simplify. We’ll help you think through the next step."
      />
      <section className="shell contact-layout">
        <aside className="contact-aside">
          <span className="eyebrow">Talk to Perpetual Labs</span>
          <h2>
            Here in Kampala.
            <br />
            Ready to connect.
          </h2>
          <div className="contact-methods">
            <div>
              <MapPin size={19} />
              <div>
                <span>Find us</span>
                <p>{company.location}</p>
              </div>
            </div>
            <a href={company.phoneHref}>
              <Phone size={19} />
              <div>
                <span>Call us</span>
                <strong>{company.phone}</strong>
              </div>
            </a>
            <a href={`mailto:${company.email}`}>
              <Mail size={19} />
              <div>
                <span>Email us</span>
                <strong>{company.email}</strong>
              </div>
            </a>
          </div>
          <a
            className="text-link whatsapp-link"
            href={company.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            Start a WhatsApp conversation <ArrowUpRight size={18} />
          </a>
        </aside>
        <div className="form-panel">
          <h2>Tell us what you have in mind.</h2>
          <p className="muted">
            A few details about your business and priorities are a helpful place
            to start.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
