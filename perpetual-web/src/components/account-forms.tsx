"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  forgotPassword,
  resetPassword,
  changePassword,
  managePicture,
} from "@/lib/account-actions";
import { Field, Status, Submit } from "./forms";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="form-stack">
      <Status state={state} />
      <Field
        name="username"
        label="Username"
        autoComplete="username"
        maxLength={150}
        state={state}
      />
      <Submit pending={pending}>Send reset link</Submit>
      <Link className="text-link" href="/sign-in">
        Back to sign in
      </Link>
    </form>
  );
}

export function PasswordForm({
  mode,
  uid = "",
  token = "",
}: {
  mode: "reset" | "change";
  uid?: string;
  token?: string;
}) {
  const [state, action, pending] = useActionState(
    mode === "reset" ? resetPassword : changePassword,
    {},
  );
  return (
    <form action={action} className="form-stack">
      <Status state={state} />
      {mode === "reset" ? (
        <>
          <input type="hidden" name="uid" value={uid} />
          <input type="hidden" name="token" value={token} />
        </>
      ) : (
        <Field
          name="current_password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          state={state}
        />
      )}
      <Field
        name="new_password"
        label="New password"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        state={state}
        hint="At least 8 characters. Avoid common passwords and personal information."
      />
      <Field
        name="confirm_password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        state={state}
      />
      <p className="form-note">
        You will need to sign in again on all devices after updating your
        password.
      </p>
      <Submit pending={pending}>
        {mode === "reset" ? "Reset password" : "Change password"}
      </Submit>
      {mode === "reset" && (
        <Link className="text-link" href="/forgot-password">
          Request a new reset link
        </Link>
      )}
    </form>
  );
}

export function ResetPasswordForm() {
  const [credentials, setCredentials] = useState<{
    uid: string;
    token: string;
  } | null>(null);
  const captured = useRef(false);
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    setCredentials({
      uid: params.get("uid") || "",
      token: params.get("token") || "",
    });
    // Keep reset credentials only in this page's memory after opening the email.
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, []);
  if (!credentials) return <p role="status">Opening your reset link…</p>;
  if (
    !credentials.uid ||
    !credentials.token ||
    credentials.uid.length > 128 ||
    credentials.token.length > 128
  )
    return (
      <div className="form-stack">
        <p role="alert">
          This reset link is incomplete. Request a new link to continue.
        </p>
        <Link className="text-link" href="/forgot-password">
          Request a new reset link
        </Link>
      </div>
    );
  return <PasswordForm mode="reset" {...credentials} />;
}

export function ProfilePictureForm({ hasPicture }: { hasPicture: boolean }) {
  const [state, action, pending] = useActionState(managePicture, {});
  const [fileError, setFileError] = useState("");
  return (
    <div className="form-stack">
      <form action={action} className="form-stack">
        <Status state={state} />
        <div className="field">
          <label htmlFor="profile_picture">Profile picture</label>
          <input
            id="profile_picture"
            name="profile_picture"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            disabled={pending}
            aria-invalid={!!fileError || !!state.errors?.profile_picture}
            aria-describedby="picture-hint picture-error"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileError(
                file && file.size > 4 * 1024 * 1024
                  ? "Choose an image no larger than 4 MB."
                  : "",
              );
            }}
          />
          <small id="picture-hint">
            JPEG, PNG, or WebP, up to 4 MB. Your image will be visible on your
            account.
          </small>
          <small id="picture-error" className="field-error">
            {fileError || state.errors?.profile_picture?.join(" ")}
          </small>
        </div>
        <Submit pending={pending} disabled={!!fileError}>
          {hasPicture ? "Change picture" : "Upload picture"}
        </Submit>
      </form>
      {hasPicture && (
        <form action={action}>
          <input type="hidden" name="intent" value="remove" />
          <button
            className="button button-secondary"
            type="submit"
            disabled={pending}
          >
            {pending ? "Removing…" : "Remove picture"}
          </button>
        </form>
      )}
    </div>
  );
}
