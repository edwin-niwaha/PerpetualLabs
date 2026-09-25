import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div>
            <Brand />
            <p>
              Thoughtfully designed.
              <br />
              Built for what comes next.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <span className="eyebrow">Explore</span>
              <Link href="/about">About us</Link>
              <Link href="/services">Services</Link>
              <Link href="/projects">Our work</Link>
              <Link href="/blog">Journal</Link>
            </div>
            <div>
              <span className="eyebrow">Connect</span>
              <Link href="/contact">
                Start a conversation <ArrowUpRight size={14} />
              </Link>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/register">Create an account</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Perpetual Labs.</span>
          <span>Ideas in motion. Possibilities ahead.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
