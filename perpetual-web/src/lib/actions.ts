"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { actionFailure } from "./action-errors";
import { authenticated, clearSession, saveSession } from "./session";
import type { FormState, Profile } from "./types";

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
  date_of_birth: z
    .union([z.iso.date(), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  first_name: z.string().trim().max(50),
  last_name: z.string().trim().max(50),
  bio: z.string().trim().max(2000),
});
export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const result = loginSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  let profile: Profile;
  try {
    const tokens = await api<{ access: string; refresh: string }>(
      "/api/auth/login/",
      { method: "POST", body: JSON.stringify(result.data) },
    );
    profile = await api<Profile>("/api/auth/profile/", {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    await saveSession(tokens);
  } catch (error) {
    return actionFailure(error);
  }
  redirect(profile?.is_staff ? "/account/content" : "/account");
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
    return actionFailure(error);
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
    const jar = await cookies();
    const init = { method: "POST", body: JSON.stringify(result.data) };
    type Receipt = { message: string; email_status: "accepted" | "pending" };
    const receipt =
      jar.has("pl_access") || jar.has("pl_refresh")
        ? await authenticated<Receipt>("/api/auth/contacts/", init, true)
        : await api<Receipt>("/api/auth/contacts/", init);
    revalidatePath("/account");
    return { ok: true, message: receipt.message };
  } catch (error) {
    return actionFailure(error);
  }
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
    return actionFailure(error);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your profile has been updated." };
}
export async function signOut() {
  await clearSession();
  redirect("/sign-in");
}
