import { Plus } from "lucide-react";
import { questions } from "@/lib/company-content";
import { SectionHeading } from "./ui";
export function Faq() {
  return (
    <section className="shell section faq-section">
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
