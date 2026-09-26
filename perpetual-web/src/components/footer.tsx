import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { websiteContent } from "@/lib/website-content";
export async function Footer() {
  const { company } = await websiteContent();
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div>
            <Brand />
            <p>{company.introduction}</p>
            <span className="footer-location">
              {company.location} · Since {company.founded}
            </span>
          </div>
          <div className="footer-links">
            <div>
              <span className="eyebrow">Explore</span>
              <Link href="/about">About us</Link>
              <Link href="/services">Services</Link>
              <Link href="/projects">Our work</Link>
            </div>
            <div>
              <span className="eyebrow">Let’s connect</span>
              <a href={`mailto:${company.email}`}>
                {company.email}
                <ArrowUpRight size={14} />
              </a>
              <a href={company.phoneHref}>{company.phone}</a>
              <Link href="/contact">
                Start a conversation <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {company.name}.
          </span>
          <span>Thoughtful technology. Practical possibilities.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
