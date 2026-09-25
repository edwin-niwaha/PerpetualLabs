import type { Metadata } from "next";
import { AuthForm } from "@/components/forms";
import { Eyebrow } from "@/components/ui";
import { Orbit } from "@/components/orbit";
export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};
export default function Register() {
  return (
    <section className="shell auth-layout">
      <div className="auth-visual">
        <Orbit />
        <p>
          A new connection.
          <br />
          <span className="serif-word">More possibilities.</span>
        </p>
      </div>
      <div className="auth-panel">
        <Eyebrow>Join the conversation</Eyebrow>
        <h1>
          Make yourself
          <br />
          at home.
        </h1>
        <p className="muted">Create your Perpetual Labs account.</p>
        <AuthForm mode="register" />
      </div>
    </section>
  );
}
