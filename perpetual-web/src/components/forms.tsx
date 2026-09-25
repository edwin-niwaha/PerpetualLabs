"use client";
import { useActionState, startTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { signIn, register, sendContact, updateProfile } from "@/lib/actions";
import type { FormState, Profile } from "@/lib/types";
function preserveInputs(action: (form: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}
type FieldProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  defaultValue?: string;
  state: FormState;
  multiline?: boolean;
  hint?: string;
};
function Field({
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  maxLength,
  defaultValue,
  state,
  multiline,
  hint,
}: FieldProps) {
  const error = state.errors?.[name]?.join(" ");
  const props = {
    id: name,
    name,
    placeholder,
    required,
    maxLength,
    defaultValue,
    "aria-invalid": !!error as boolean,
    "aria-describedby": error
      ? name + "-error"
      : hint
        ? name + "-hint"
        : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {!required && <span> (optional)</span>}
      </label>
      {multiline ? (
        <textarea {...props} rows={5} />
      ) : (
        <input {...props} type={type} autoComplete={autoComplete} />
      )}
      {hint && <small id={name + "-hint"}>{hint}</small>}
      {error && (
        <small id={name + "-error"} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
function Status({ state }: { state: FormState }) {
  return state.message ? (
    <div
      role={state.ok ? "status" : "alert"}
      className={`form-message ${state.ok ? "success" : "failure"}`}
    >
      {state.ok && <CheckCircle2 size={20} />}
      <span>{state.message}</span>
    </div>
  ) : null;
}
function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="button form-submit" disabled={pending} type="submit">
      {pending ? "Please wait…" : children}
      {pending ? (
        <LoaderCircle size={18} className="spin" />
      ) : (
        <ArrowUpRight size={18} />
      )}
    </button>
  );
}
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const signup = mode === "register";
  const [state, action, pending] = useActionState(
    signup ? register : signIn,
    {},
  );
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="form-stack"
    >
      <Status state={state} />
      <Field
        name="username"
        label="Username"
        autoComplete="username"
        maxLength={150}
        state={state}
      />
      {signup && (
        <Field
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          maxLength={254}
          state={state}
        />
      )}
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={signup ? "new-password" : "current-password"}
        maxLength={128}
        state={state}
        hint={
          signup
            ? "At least 8 characters. Avoid common passwords and personal information."
            : undefined
        }
      />
      {signup && (
        <Field
          name="confirm_password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          state={state}
        />
      )}
      <Submit pending={pending}>{signup ? "Create account" : "Sign in"}</Submit>
      <p className="form-alternative">
        {signup ? "Already have an account?" : "New to Perpetual Labs?"}{" "}
        <Link href={signup ? "/sign-in" : "/register"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, {});
  if (state.ok)
    return (
      <div className="contact-success">
        <CheckCircle2 size={42} />
        <h2>You’re on our radar.</h2>
        <Status state={state} />
        <Link className="text-link" href="/">
          Back to home <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="form-stack"
    >
      <Status state={state} />
      <div className="form-row">
        <Field
          name="name"
          label="Your name"
          autoComplete="name"
          maxLength={255}
          state={state}
        />
        <Field
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          maxLength={254}
          state={state}
        />
      </div>
      <Field
        name="user_message"
        label="What do you have in mind?"
        placeholder="Tell us about your project, a question, or your feedback…"
        maxLength={5000}
        multiline
        state={state}
      />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="form-note">
        We’ll use the details you share to respond to your message. Please don’t
        include passwords or sensitive information.
      </p>
      <Submit pending={pending}>Send message</Submit>
    </form>
  );
}
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    <form
      action={action}
      onSubmit={preserveInputs(action)}
      className="form-stack"
    >
      <Status state={state} />
      <div className="form-row">
        <Field
          name="first_name"
          label="First name"
          autoComplete="given-name"
          maxLength={50}
          defaultValue={profile.first_name || ""}
          required={false}
          state={state}
        />
        <Field
          name="last_name"
          label="Last name"
          autoComplete="family-name"
          maxLength={50}
          defaultValue={profile.last_name || ""}
          required={false}
          state={state}
        />
      </div>
      <Field
        name="bio"
        label="A little about you"
        maxLength={2000}
        defaultValue={profile.bio || ""}
        multiline
        required={false}
        state={state}
      />
      <Submit pending={pending}>Save changes</Submit>
    </form>
  );
}
