import type { Metadata } from "next";
import { AuthForm } from "@/components/forms";
import { Eyebrow } from "@/components/ui";
import { Orbit } from "@/components/orbit";
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; expired?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="shell auth-layout">
      <div className="auth-visual">
        <Orbit />
        <p>
          Good to have you
          <br />
          <span className="serif-word">back in the loop.</span>
        </p>
      </div>
      <div className="auth-panel">
        <Eyebrow>Your Perpetual account</Eyebrow>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to manage your profile.</p>
        {params.created && (
          <div role="status" className="form-message success">
            Your account is ready. Sign in to get started.
          </div>
        )}
        {params.expired && (
          <div role="status" className="form-message failure">
            Your session has ended. Please sign in again.
          </div>
        )}
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
