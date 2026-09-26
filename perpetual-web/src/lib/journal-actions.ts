import "server-only";
import { validateJournal, type JournalSaveState } from "./journal-validation";
import { authenticated, currentProfile } from "./session";
import { actionFailure } from "./action-errors";
import type { FormState } from "./types";
export async function saveJournal(
  id: number | null,
  _: FormState,
  form: FormData,
): Promise<JournalSaveState> {
  try {
    const profile = await currentProfile();
    if (!profile?.is_staff)
      return {
        message: profile
          ? "Staff access is required."
          : "Your session has ended. Please sign in again.",
        status: profile ? 403 : 401,
      };
    if (id !== null && (!Number.isSafeInteger(id) || id < 1))
      return { message: "Invalid entry." };
    const title = String(form.get("title") || "").trim();
    const excerpt = String(form.get("excerpt") || "").trim();
    const content = String(form.get("content") || "").trim();
    const topic = String(form.get("topic") || "").trim();
    const image = String(form.get("image") || "").trim();
    const publish = form.get("intent") === "publish";
    const schedule = String(form.get("published_at") || "");
    const errors = validateJournal(form);
    if (Object.keys(errors).length)
      return { message: "Please check the highlighted fields.", errors };
    const payload = {
      title,
      excerpt,
      content,
      topic,
      image,
      is_published: publish,
      published_at: schedule || null,
      remove_cover: form.get("remove_cover") === "on",
    };
    const cover = form.get("cover_image");
    let body: string | FormData = JSON.stringify(payload);
    if (cover instanceof File && cover.size) {
      if (payload.remove_cover)
        return { message: "Choose either a replacement or remove the cover." };
      if (
        cover.size > 4 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(cover.type)
      )
        return { message: "Choose a JPEG, PNG or WebP image up to 4 MB." };
      body = new FormData();
      for (const [key, value] of Object.entries(payload))
        body.set(key, value === null ? "" : String(value));
      body.set("cover_image", cover);
    }
    const saved = await authenticated<NonNullable<JournalSaveState["entry"]>>(
      `/api/blog/journal/${id ? `${id}/` : ""}`,
      {
        method: id ? "PATCH" : "POST",
        body,
      },
      true,
    );
    return {
      ok: true,
      entry: saved,
      message: publish
        ? schedule && Date.parse(schedule) > Date.now()
          ? "Entry scheduled. It will appear at the selected time."
          : "Entry published. It is now in the journal."
        : "Draft saved. It is only visible to staff.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
