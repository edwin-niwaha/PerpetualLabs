import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { currentProfile } from "@/lib/session";
import { signOut } from "@/lib/actions";
import { PageIntro } from "@/components/ui";
import { ProfileForm } from "@/components/forms";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function Account() {
  const profile = await currentProfile();
  if (!profile) redirect("/sign-in");
  return (
    <>
      <PageIntro
        label="Your space"
        title={`Hello, ${profile.first_name || profile.username}.`}
        description="A few details that make your account yours."
      />
      <section className="shell account-layout">
        <aside className="account-card">
          <span className="avatar">
            <UserRound size={28} />
          </span>
          <h2>{profile.username}</h2>
          <p>{profile.email}</p>
          <span className="account-label">
            Username and email are fixed for this account.
          </span>
          <form action={signOut}>
            <button className="text-link" type="submit">
              Sign out <LogOut size={18} />
            </button>
          </form>
        </aside>
        <div className="form-panel">
          <h2>Profile settings</h2>
          <p className="muted">Update your name and introduce yourself.</p>
          <ProfileForm profile={profile} />
        </div>
      </section>
    </>
  );
}
