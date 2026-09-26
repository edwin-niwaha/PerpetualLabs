import { Plus } from "lucide-react";
import { websiteContent } from "@/lib/website-content";
import { SectionHeading } from "./ui";
export async function Faq() {
  const { faqs: questions } = await websiteContent();
  if (!questions.length) return null;
  return (
    <section
      id="frequently-asked-questions"
      className="shell section faq-section"
      aria-label="Frequently asked questions"
    >
      <SectionHeading
        label="Before we begin"
        title="Good questions. Clear answers."
      />
      <div className="faq-list">
        {questions.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus size={20} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
