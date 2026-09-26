import { googleEnabled } from "@/lib/social";
const errors: Record<string, string> = {
  cancelled:
    "Google sign-in was cancelled. You can try again or use your password.",
  failed: "Google sign-in could not be completed. Please start again.",
  unavailable:
    "Google sign-in is not available yet. Please use your username and password.",
  existing_account:
    "An account already uses this email. Sign in with your existing username and password.",
};
export async function SocialLogin({ error }: { error?: string }) {
  const enabled = await googleEnabled();
  return (
    <div className="social-login">
      {error && (
        <p role="alert" className="form-message failure">
          {errors[error] || errors.failed}
        </p>
      )}
      {enabled ? (
        <a className="button" href="/auth/google/start">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.06.97-3.38.97-2.6 0-4.81-1.75-5.6-4.1H3.06v2.59A10 10 0 0 0 12 22z"
            />
            <path
              fill="#FBBC05"
              d="M6.4 13.95a6 6 0 0 1 0-3.9V7.46H3.06a10 10 0 0 0 0 9.08l3.34-2.59z"
            />
            <path
              fill="#EA4335"
              d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.46l3.34 2.59c.79-2.35 3-4.1 5.6-4.1z"
            />
          </svg>
          Continue with Google
        </a>
      ) : (
        <p className="form-note">
          Google sign-in is being set up. You can use your username and password
          below.
        </p>
      )}
      {enabled && (
        <p className="form-note">Or use your username and password</p>
      )}
    </div>
  );
}
