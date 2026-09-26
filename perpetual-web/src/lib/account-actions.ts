"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { actionFailure } from "./action-errors";
import { authenticated, clearSession } from "./session";
import type { FormState } from "./types";

const passwords = z.object({
  new_password: z.string().min(8, "Use at least 8 characters.").max(128),
  confirm_password: z.string().min(1, "Confirm your new password.").max(128),
});
const matchPasswords = (data: {
  new_password: string;
  confirm_password: string;
}) => data.new_password === data.confirm_password;
const mismatch = {
  path: ["confirm_password"],
  message: "Passwords do not match.",
};
const resetSchema = passwords
  .extend({
    uid: z.string().min(1).max(128),
    token: z.string().min(1).max(128),
  })
  .refine(matchPasswords, mismatch);
const changeSchema = passwords
  .extend({
    current_password: z
      .string()
      .min(1, "Enter your current password.")
      .max(128),
  })
  .refine(matchPasswords, mismatch);

async function accountFailure(error: unknown): Promise<FormState> {
  if (error instanceof ApiError && error.status === 401) {
    await clearSession();
    redirect("/sign-in?expired=1");
  }
  return actionFailure(error);
}

export async function forgotPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = z
    .object({
      username: z.string().trim().min(1, "Enter your username.").max(150),
    })
    .safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    const receipt = await api<{ message: string }>(
      "/api/auth/forgot-password/",
      { method: "POST", body: JSON.stringify(result.data) },
    );
    return { ok: true, message: receipt.message };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function resetPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = resetSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    await api("/api/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(result.data),
    });
  } catch (error) {
    return actionFailure(error);
  }
  await clearSession();
  redirect("/sign-in?password_changed=1");
}

export async function changePassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = changeSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { errors: z.flattenError(result.error).fieldErrors };
  try {
    await authenticated(
      "/api/auth/change-password/",
      { method: "POST", body: JSON.stringify(result.data) },
      true,
    );
  } catch (error) {
    return accountFailure(error);
  }
  await clearSession();
  redirect("/sign-in?password_changed=1");
}

export async function updatePicture(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const picture = form.get("profile_picture");
  if (!(picture instanceof File) || !picture.size)
    return { errors: { profile_picture: ["Choose a profile picture."] } };
  if (picture.size > 4 * 1024 * 1024)
    return {
      errors: { profile_picture: ["Choose an image no larger than 4 MB."] },
    };
  if (!["image/jpeg", "image/png", "image/webp"].includes(picture.type))
    return {
      errors: { profile_picture: ["Choose a JPEG, PNG, or WebP image."] },
    };
  const body = new FormData();
  body.set("profile_picture", picture);
  try {
    await authenticated(
      "/api/auth/profile/picture/",
      { method: "PUT", body },
      true,
    );
  } catch (error) {
    return accountFailure(error);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your profile picture has been updated." };
}

export async function removePicture(): Promise<FormState> {
  try {
    await authenticated(
      "/api/auth/profile/picture/",
      { method: "DELETE" },
      true,
    );
  } catch (error) {
    return accountFailure(error);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your profile picture has been removed." };
}

export async function managePicture(
  state: FormState,
  form: FormData,
): Promise<FormState> {
  return form.get("intent") === "remove"
    ? removePicture()
    : updatePicture(state, form);
}
