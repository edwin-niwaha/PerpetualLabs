import { SocialLogin } from "@/components/social-login";
import type { Metadata } from "next";
import { AuthForm } from "@/components/forms";
import { Eyebrow } from "@/components/ui";
import { GalaxyAuth } from "@/components/galaxy-auth";
export const metadata: Metadata = {
  title: "Client portal sign in",
  robots: { index: false, follow: false },
};
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    password_changed?: string;
    expired?: string;
    social_error?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <GalaxyAuth>
      <Eyebrow>Perpetual Labs · Client portal</Eyebrow>
      <h1 className="preserve-lines">Welcome back.</h1>
      <p className="muted">
        Sign in to your notifications, email updates, and upcoming services.
      </p>
      {params.password_changed && (
        <div role="status" className="form-message success">
          Your password has been updated. Sign in with your new password.
        </div>
      )}
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
      <SocialLogin error={params.social_error} />
      <AuthForm mode="login" showRegistration={true} />
    </GalaxyAuth>
  );
}
