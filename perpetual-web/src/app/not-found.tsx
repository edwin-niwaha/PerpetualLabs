import Link from "next/link";
import { Eyebrow } from "@/components/ui";
export default function NotFound() {
  return (
    <section className="shell error-page">
      <Eyebrow>404 / A small detour</Eyebrow>
      <h1>A little off course.</h1>
      <p>This page may have moved, or hasn’t been published yet.</p>
      <Link className="button" href="/">
        Back to familiar ground ↗
      </Link>
    </section>
  );
}
