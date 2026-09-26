import type { Metadata } from "next";
import { AccountAuthPanel } from "@/components/account-auth-panel";
import { ResetPasswordForm } from "@/components/account-forms";
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function ResetPassword() {
  return (
    <AccountAuthPanel
      title="Choose a new password."
      description="Use a strong password that you do not use for other accounts."
    >
      <ResetPasswordForm />
    </AccountAuthPanel>
  );
}
