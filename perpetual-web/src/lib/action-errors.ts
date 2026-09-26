import "server-only";
import { ApiError } from "./api";
import type { FormState } from "./types";

export function actionFailure(error: unknown): FormState {
  if (!(error instanceof ApiError))
    return { message: "Something went wrong. Please try again." };
  if (error.status >= 500)
    return {
      message:
        "The service is unavailable. Your changes have not been confirmed; please try again shortly.",
    };
  if (error.status === 429)
    return {
      message: "Too many attempts. Please wait a while before trying again.",
    };
  const errors = Object.fromEntries(
    Object.entries(error.data).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) &&
        entry[1].every((value) => typeof value === "string"),
    ),
  );
  return {
    message: errors.non_field_errors?.join(" ") || error.message,
    errors,
  };
}
