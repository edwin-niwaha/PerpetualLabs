"use server";

import { revalidatePath } from "next/cache";
import { authenticated } from "./session";
import { actionFailure } from "./action-errors";
import type { FormState } from "./types";

export async function setNotificationRead(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const id = Number(form.get("id"));
  const read = form.get("read");
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !["true", "false"].includes(String(read))
  )
    return { message: "Invalid notification." };
  try {
    await authenticated(
      `/api/auth/notifications/${id}/`,
      { method: "PATCH", body: JSON.stringify({ read: read === "true" }) },
      true,
    );
  } catch (error) {
    return actionFailure(error);
  }
  revalidatePath("/account");
  return { ok: true };
}
