"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { authenticated, clearSession, saveSession } from "./session";
import type { FormState } from "./types";

const username = z.string().trim().min(1, "Enter your username.").max(150);
const password = z.string().min(8, "Use at least 8 characters.").max(128);
const email = z.email("Enter a valid email address.").max(254);
const loginSchema = z.object({
  username,
  password: z.string().min(1, "Enter your password.").max(128),
});
const registerSchema = z
  .object({
    username: username.regex(
      /^[\w.@+-]+$/,
      "Use letters, numbers, and @ . + - _ only.",
    ),
    email,
    password,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });
const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(255),
  email,
  user_message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(5000),
});
const profileSchema = z.object({
  first_name: z.string().trim().max(50),
  last_name: z.string().trim().max(50),
  bio: z.string().trim().max(2000),
});
function failure(error: unknown): FormState {
  if (error instanceof ApiError) {
    if (error.status >= 500)
      return {
        message: "We could not connect right now. Please try again shortly.",
      };
    if (error.status === 429)
      return {
        message: "Too many attempts. Please wait a while before trying again.",
      };
    const errors = Object.fromEntries(
      Object.entries(error.data).filter(([, v]) => Array.isArray(v)),
    ) as Record<string, string[]>;
    return {
      message: error.data.non_field_errors
        ? String(error.data.non_field_errors)
        : error.message,
      errors,
    };
  }
  return { message: "Something went wrong. Please try again." };
}
export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const result = loginSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    const tokens = await api<{ access: string; refresh: string }>(
      "/api/auth/login/",
      { method: "POST", body: JSON.stringify(result.data) },
    );
    await saveSession(tokens);
  } catch (error) {
    return failure(error);
  }
  redirect("/account");
}
export async function register(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = registerSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  const { username, email, password } = result.data;
  try {
    await api("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  } catch (error) {
    return failure(error);
  }
  redirect("/sign-in?created=1");
}
export async function sendContact(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (form.get("website")) return { message: "Unable to submit this message." };
  const result = contactSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    await api("/api/auth/contacts/", {
      method: "POST",
      body: JSON.stringify(result.data),
    });
  } catch (error) {
    return failure(error);
  }
  return {
    ok: true,
    message:
      "Message received. Thank you for getting in touch — we’ll take it from here.",
  };
}
export async function updateProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = profileSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    await authenticated(
      "/api/auth/profile/",
      { method: "PATCH", body: JSON.stringify(result.data) },
      true,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
      redirect("/sign-in?expired=1");
    }
    return failure(error);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your profile has been updated." };
}
export async function signOut() {
  await clearSession();
  redirect("/sign-in");
}
