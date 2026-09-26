import type { Metadata } from "next";
import { AccountAuthPanel } from "@/components/account-auth-panel";
import { ForgotPasswordForm } from "@/components/account-forms";
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};
export default function ForgotPassword() {
  return (
    <AccountAuthPanel
      title="Forgot your password?"
      description="Enter your account username. We will email a reset link to the address on your account."
    >
      <ForgotPasswordForm />
    </AccountAuthPanel>
  );
}
