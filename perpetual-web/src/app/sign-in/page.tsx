import { SocialLogin } from "@/components/social-login";
import type { Metadata } from "next";
import { AuthForm } from "@/components/forms";
import { Eyebrow } from "@/components/ui";
import { GalaxyAuth } from "@/components/galaxy-auth";
import { content } from "@/lib/api";
import { safeImage, safeWebsite } from "@/lib/site";
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
  const [params, visuals] = await Promise.all([
    searchParams,
    content("visuals"),
  ]);
  const galaxy = visuals.items.find((v) => v.key === "galaxy");
  const earth = visuals.items.find((v) => v.key === "earth");
  return (
    <GalaxyAuth
      galaxy={safeImage(galaxy?.image)}
      earth={safeImage(earth?.image)}
      credit={galaxy?.credit || ""}
      source={safeWebsite(galaxy?.source_url)}
    >
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
      <p className="form-note">
        Clients can access their personal portal. Staff accounts also have
        access to website management.
      </p>
      <SocialLogin error={params.social_error} />
      <AuthForm mode="login" showRegistration={true} />
    </GalaxyAuth>
  );
}
