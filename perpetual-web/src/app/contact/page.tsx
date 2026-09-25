import type { Metadata } from "next";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { PageIntro } from "@/components/ui";
import { ContactForm } from "@/components/forms";
export const metadata: Metadata = {
  title: "Let’s talk",
  description:
    "Start a project conversation, ask a question, or share feedback with Perpetual Labs.",
};
export default function Contact() {
  return (
    <>
      <PageIntro
        label="Let’s talk"
        title="What’s on your mind?"
        description="A new idea, a question, or a little feedback. We’d love to hear it."
      />
      <section className="shell contact-layout">
        <aside className="contact-aside">
          <MessageSquare size={32} strokeWidth={1.3} />
          <h2>Every good project starts somewhere.</h2>
          <p>
            Tell us what you’re thinking. You don’t need a perfect brief to
            start a conversation.
          </p>
          <span className="contact-aside-bottom">
            Let’s see where it goes. <ArrowUpRight />
          </span>
        </aside>
        <div className="form-panel">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
