"use server";
import { revalidatePath } from "next/cache";
import { actionFailure } from "./action-errors";
import { authenticated, currentProfile } from "./session";
import { editors } from "./content-editors";
import type { FormState } from "./types";

export async function saveContent(
  kind: string,
  id: number | null,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const profile = await currentProfile();
    if (!profile?.is_staff)
      return {
        message:
          "Administrator access is required. Please sign in with a staff account.",
      };
    const config = Object.hasOwn(editors, kind) ? editors[kind] : null;
    if (
      !config ||
      (!config.singleton && id === null && !config.canCreate) ||
      (id !== null && (!Number.isSafeInteger(id) || id < 1))
    )
      return { message: "This content cannot be edited." };
    const payload: Record<string, unknown> = {};
    const uploads = new FormData();
    let multipart = false;
    const errors: Record<string, string[]> = {};
    for (const field of config.fields) {
      const raw = form.get(field.name);
      if (field.type === "image") {
        const remove =
          field.removable && form.get(`${field.name}_remove`) === "on";
        if (raw instanceof File && raw.size) {
          if (remove)
            return {
              message:
                "Choose either a replacement image or remove the current image.",
            };
          if (
            raw.size > 4 * 1024 * 1024 ||
            !["image/jpeg", "image/png", "image/webp"].includes(raw.type)
          )
            return {
              errors: {
                [field.name]: ["Choose a JPEG, PNG or WebP image up to 4 MB."],
              },
            };
          uploads.set(field.name, raw);
          multipart = true;
        } else if (remove) {
          if (field.name === "portrait") payload.remove_image = true;
          else payload[field.name] = null;
        }
        continue;
      }
      if (raw !== null && typeof raw !== "string")
        return { message: "Invalid field value." };
      const value = (raw || "").trim();
      if (field.type === "checkbox") payload[field.name] = raw === "on";
      else if (field.type === "number") {
        const number = Number(value);
        if (
          !value ||
          !Number.isSafeInteger(number) ||
          number < 0 ||
          number > 2147483647
        )
          errors[field.name] = ["Use a whole number from 0 to 2147483647."];
        payload[field.name] = number;
      } else {
        if (field.required && !value)
          errors[field.name] = ["This field is required."];
        if (field.maxLength && value.length > field.maxLength)
          errors[field.name] = [`Use at most ${field.maxLength} characters.`];
        if (
          field.options &&
          !field.options.some((option) => option.value === value)
        )
          errors[field.name] = ["Choose a valid option."];
        payload[field.name] =
          field.type === "lines"
            ? value
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
            : value;
      }
    }
    if (Object.keys(errors).length)
      return { errors, message: "Please check the highlighted fields." };
    const path =
      config.singleton || id === null
        ? config.endpoint
        : `${config.endpoint}${id}/`;
    if (multipart) {
      for (const [key, value] of Object.entries(payload))
        uploads.set(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
    }
    await authenticated(
      path,
      {
        method: config.singleton || id !== null ? "PATCH" : "POST",
        body: multipart ? uploads : JSON.stringify(payload),
      },
      true,
    );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        id === null && !config.singleton
          ? "Content created. Published items are now visible on the website."
          : "Changes saved. The website is up to date.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteContent(
  kind: string,
  id: number,
): Promise<FormState> {
  try {
    const profile = await currentProfile();
    const config = Object.hasOwn(editors, kind) ? editors[kind] : null;
    if (
      !profile?.is_staff ||
      !config?.canDelete ||
      !Number.isSafeInteger(id) ||
      id < 1
    )
      return { message: "This content cannot be deleted." };
    await authenticated(`${config.endpoint}${id}/`, { method: "DELETE" }, true);
    revalidatePath("/", "layout");
    return { ok: true, message: "Item deleted." };
  } catch (error) {
    return actionFailure(error);
  }
}
