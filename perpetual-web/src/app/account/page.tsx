import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { currentProfile } from "@/lib/session";
import { signOut } from "@/lib/actions";
import { ClientPortal } from "@/components/client-portal";
import Image from "next/image";
import { safeImage } from "@/lib/site";
import { ProfilePictureForm } from "@/components/account-forms";
import { ProfileForm } from "@/components/forms";
import styles from "./account.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Client portal",
  robots: { index: false, follow: false },
};
export default async function Account() {
  const profile = await currentProfile();
  if (!profile) redirect("/sign-in");
  const picture = safeImage(profile.profile_picture || undefined);
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;
  const initials = (
    profile.first_name
      ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`
      : profile.username.slice(0, 2)
  ).toUpperCase();
  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <UserRound size={15} aria-hidden="true" /> Client portal
          </p>
          <h1>Hello, {profile.first_name || profile.username}.</h1>
          <p>
            Your conversations, notifications, and next steps — all in one
            place.
          </p>
        </div>
        <Link className={styles.websiteLink} href="/">
          View website <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.identity} aria-labelledby="account-identity">
          <div className={styles.identityTop}>
            <span className={styles.avatar} aria-hidden="true">
              {picture ? (
                <Image
                  src={picture}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                />
              ) : (
                initials
              )}
            </span>
            <span className={styles.role}>
              {profile.is_staff ? (
                <ShieldCheck size={13} aria-hidden="true" />
              ) : (
                <UserRound size={13} aria-hidden="true" />
              )}
              {profile.is_staff ? "Administrator" : "Client"}
            </span>
            <h2 id="account-identity">{displayName}</h2>
            <p>Your Perpetual Labs account</p>
          </div>
          <div className={styles.identityDetails}>
            <dl>
              <div>
                <dt>Username</dt>
                <dd>@{profile.username}</dd>
              </div>
              <div>
                <dt>Email address</dt>
                <dd>{profile.email || "No email address provided"}</dd>
              </div>
            </dl>
            <p className={styles.fixedNote}>
              <LockKeyhole size={14} aria-hidden="true" />
              <span>Username and email are fixed for this account.</span>
            </p>
          </div>
          <Link className={styles.websiteLink} href="/account/change-password">
            Change password
          </Link>
          <form action={signOut} className={styles.signOut}>
            <button type="submit">
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </aside>
        <div className={styles.mainColumn}>
          {profile.is_staff && (
            <section className={styles.admin} aria-labelledby="admin-heading">
              <span className={styles.adminIcon}>
                <LayoutDashboard size={22} aria-hidden="true" />
              </span>
              <div>
                <p className={styles.eyebrow}>Administrator workspace</p>
                <h2 id="admin-heading">Your website, up to date.</h2>
                <p>Manage page copy, company information, FAQs and products.</p>
              </div>
              <Link href="/account/content">
                Manage website content{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </section>
          )}
          <ClientPortal />
          <section
            className={styles.settings}
            aria-labelledby="profile-heading"
          >
            <div className={styles.panelHeading}>
              <span className={styles.settingsIcon}>
                <Settings2 size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="profile-heading">Profile settings</h2>
                <p>Update your name and introduce yourself.</p>
              </div>
            </div>
            <div className={styles.editor}>
              <ProfileForm profile={profile} />
              <div className={styles.pictureEditor}>
                <ProfilePictureForm hasPicture={!!profile.profile_picture} />
              </div>
            </div>
          </section>
          <p className={styles.saveNote}>
            Your changes are applied when you select Save changes.
          </p>
        </div>
      </div>
    </div>
  );
}
