import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/session";
import { PasswordForm } from "@/components/account-forms";
import styles from "../account.module.css";
export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};
export default async function ChangePassword() {
  if (!(await currentProfile())) redirect("/sign-in");
  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <h1>Change password</h1>
        <Link className={styles.websiteLink} href="/account">
          Back to your account
        </Link>
      </header>
      <section className={styles.settings} aria-label="Change password">
        <div className={styles.editor}>
          <PasswordForm mode="change" />
        </div>
      </section>
    </div>
  );
}
