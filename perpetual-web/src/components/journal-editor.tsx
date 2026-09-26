"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { JournalMarkdown } from "./journal-markdown";
import {
  validateJournal,
  type JournalSaveState,
} from "@/lib/journal-validation";
import { safeImage } from "@/lib/site";
import { readingTime } from "@/lib/journal";

export type JournalDraft = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  topic: string;
  image: string;
  cover_image?: string | null;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
  publication_status: string;
};
export function JournalEditor({ entry }: { entry?: JournalDraft }) {
  const [body, setBody] = useState(entry?.content || "");
  const [preview, setPreview] = useState(false);
  const [state, setState] = useState<JournalSaveState>({});
  const [pending, setPending] = useState(false);
  const [intent, setIntent] = useState("draft");
  const saving = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [openedAt] = useState(() => Date.now());
  const [schedule, setSchedule] = useState("");
  const [changedSchedule, setChangedSchedule] = useState(false);
  const savedEntry = state.entry || entry;
  const publication = changedSchedule
    ? schedule && Number.isFinite(Date.parse(schedule))
      ? new Date(schedule).toISOString()
      : schedule
    : savedEntry?.published_at || "";
  const errorProps = (name: string) => ({
    id: `journal-${name}`,
    "aria-invalid": Boolean(state.errors?.[name]),
    "aria-describedby": state.errors?.[name]
      ? `journal-${name}-error`
      : undefined,
  });
  const error = (name: string) =>
    state.errors?.[name] ? (
      <span className="journal-field-error" id={`journal-${name}-error`}>
        {state.errors[name].join(" ")}
      </span>
    ) : null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const formElement = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const chosenIntent = submitter?.value || "draft";
    const form = new FormData(formElement);
    form.set("intent", chosenIntent);
    if (savedEntry?.id) form.set("id", String(savedEntry.id));
    const errors = validateJournal(form);
    if (Object.keys(errors).length) {
      setState((previous) => ({
        ...previous,
        ok: false,
        message: "Please check the highlighted fields.",
        errors,
      }));
      if (errors.content) setPreview(false);
      requestAnimationFrame(() =>
        document.getElementById(`journal-${Object.keys(errors)[0]}`)?.focus(),
      );
      return;
    }
    saving.current = true;
    setPending(true);
    setIntent(chosenIntent);
    setState((previous) => ({ entry: previous.entry }));
    const controller = new AbortController();
    const deadline = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const result: JournalSaveState = await response.json();
      if (!response.ok && !result.message) throw new Error();
      setState((previous) => ({
        ...result,
        entry: result.entry || previous.entry,
      }));
      if (result.ok && result.entry) {
        window.history.replaceState(
          null,
          "",
          `/account/journal?edit=${result.entry.id}`,
        );
        setChangedSchedule(false);
        setSchedule("");
        const file = formElement.elements.namedItem(
          "cover_image",
        ) as HTMLInputElement;
        if (file) file.value = "";
        const remove = formElement.elements.namedItem(
          "remove_cover",
        ) as HTMLInputElement;
        if (remove) remove.checked = false;
      }
    } catch {
      setState((previous) => ({
        entry: previous.entry,
        message:
          "The save could not be confirmed. Your writing is still here. Check All entries before retrying to avoid creating a duplicate.",
      }));
    } finally {
      window.clearTimeout(deadline);
      saving.current = false;
      setPending(false);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      className="journal-composer form-stack"
      aria-busy={pending}
    >
      <div className="journal-compose-heading">
        <div>
          <span className="journal-eyebrow">WRITE SOMETHING WORTH SHARING</span>
          <h2>Your story starts here.</h2>
          <p>
            Title, introduction and entry content are required. Everything else
            is optional.
          </p>
        </div>
        <span className="journal-draft-badge">
          {savedEntry?.is_published ? "Published / scheduled" : "Draft"}
        </span>
      </div>
      <div ref={statusRef} tabIndex={-1} className="journal-save-feedback">
        {state.message && (
          <div
            role={state.ok ? "status" : "alert"}
            className={`form-message ${state.ok ? "success" : "failure"}`}
          >
            {state.message}
            {state.ok && (
              <p>
                <Link href="/account/journal">Return to your entries →</Link>
              </p>
            )}
          </div>
        )}
        {pending && (
          <p role="status">
            {intent === "publish" ? "Publishing" : "Saving draft"}… Uploading a
            cover may take a little longer. Keep this page open.
          </p>
        )}
      </div>
      <fieldset disabled={pending} className="journal-compose-fields">
        <label className="field">
          Entry title
          <input
            name="title"
            aria-label="Entry title"
            {...errorProps("title")}
            required
            maxLength={255}
            defaultValue={entry?.title}
            placeholder="What’s on your mind today?"
          />
          <small>Give readers a clear idea of what they’ll learn.</small>
          {error("title")}
        </label>
        <div className="journal-composer-row">
          <label className="field">
            Topic
            <input
              name="topic"
              {...errorProps("topic")}
              maxLength={100}
              defaultValue={entry?.topic}
              placeholder="e.g. Studio notes"
            />
            {error("topic")}
          </label>
          <label className="field">
            Cover image URL (optional)
            <input
              type="url"
              name="image"
              {...errorProps("image")}
              maxLength={200}
              defaultValue={entry?.image}
              placeholder="https://res.cloudinary.com/…"
            />
            {error("image")}
          </label>
        </div>
        <div className="field">
          <label htmlFor="journal-cover_image">Upload cover image</label>
          {savedEntry?.cover_image && safeImage(savedEntry.cover_image) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeImage(savedEntry.cover_image)!}
              alt="Current journal cover"
              width={200}
              height={120}
              style={{ objectFit: "contain", maxWidth: "100%" }}
            />
          )}
          <input
            type="file"
            name="cover_image"
            {...errorProps("cover_image")}
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const input = event.currentTarget;
              input.setCustomValidity(
                input.files?.[0] && input.files[0].size > 4 * 1024 * 1024
                  ? "Choose an image up to 4 MB."
                  : "",
              );
              input.reportValidity();
            }}
          />
          <button
            type="button"
            className="journal-clear-upload"
            onClick={() => {
              const input = document.getElementById(
                "journal-cover_image",
              ) as HTMLInputElement;
              input.value = "";
              input.setCustomValidity("");
              setState((previous) => ({
                ...previous,
                ok: false,
                errors: Object.fromEntries(
                  Object.entries(previous.errors || {}).filter(
                    ([key]) => key !== "cover_image",
                  ),
                ),
              }));
            }}
          >
            Clear selected file
          </button>
          <small>
            JPEG, PNG or WebP, up to 4 MB. An uploaded cover takes priority over
            the URL.
          </small>
          {error("cover_image")}
        </div>
        {savedEntry?.cover_image && (
          <label>
            <input type="checkbox" name="remove_cover" /> Remove current cover
            image
          </label>
        )}
        <label className="field">
          Short introduction
          <textarea
            name="excerpt"
            {...errorProps("excerpt")}
            required
            maxLength={600}
            rows={3}
            defaultValue={entry?.excerpt}
            placeholder="A few sentences to invite readers in."
          />
          {error("excerpt")}
        </label>
        <div className="journal-editor-toolbar">
          <strong>The entry</strong>
          <div>
            <button
              type="button"
              aria-pressed={!preview}
              onClick={() => setPreview(false)}
            >
              Write
            </button>
            <button
              type="button"
              aria-pressed={preview}
              onClick={() => setPreview(true)}
            >
              Preview
            </button>
          </div>
        </div>
        <p className="form-note" id="markdown-help">
          Use ## for headings, **bold**, - for lists, and [text](https://…) for
          links. HTML is not supported.
        </p>
        <textarea
          {...errorProps("content")}
          aria-label="Entry content"
          aria-describedby={`markdown-help${state.errors?.content ? " journal-content-error" : ""}`}
          name="content"
          required
          maxLength={80000}
          rows={18}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={preview ? "journal-hidden-editor" : "journal-body-input"}
        />
        {error("content")}
        {preview && (
          <div className="journal-preview">
            <JournalMarkdown>
              {body || "Your preview will appear here."}
            </JournalMarkdown>
          </div>
        )}
        <p className="form-note">
          {body.trim() ? body.trim().split(/\s+/).length : 0} words ·{" "}
          {readingTime(body)} min read
        </p>
        <div className="journal-publish">
          <div>
            <label className="field">
              Schedule publication (optional)
              <input
                type="datetime-local"
                {...errorProps("published_at")}
                value={schedule}
                onChange={(e) => {
                  setSchedule(e.target.value);
                  setChangedSchedule(true);
                }}
              />
              {error("published_at")}
            </label>
            <input type="hidden" name="published_at" value={publication} />
            {publication && (
              <button
                type="button"
                onClick={() => {
                  setSchedule("");
                  setChangedSchedule(true);
                }}
              >
                Clear schedule / publish now
              </button>
            )}
            <p className="form-note">
              Times use your device’s timezone. Leave blank to publish now.
              {savedEntry?.published_at && !changedSchedule
                ? ` Existing publication: ${new Date(savedEntry.published_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC. This time will be preserved.`
                : ""}
            </p>
          </div>
          <div className="journal-publish-actions">
            <button
              className="button secondary"
              name="intent"
              value="draft"
              disabled={pending}
            >
              {pending && intent === "draft" ? "Saving…" : "Save draft"}
            </button>
            <button
              className="button"
              name="intent"
              value="publish"
              disabled={pending}
            >
              {pending && intent === "publish"
                ? "Publishing…"
                : publication && Date.parse(publication) > openedAt
                  ? "Schedule entry"
                  : savedEntry?.is_published
                    ? "Update published entry"
                    : "Publish entry"}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
