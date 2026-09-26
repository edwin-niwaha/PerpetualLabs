"use client";
import {
  startTransition,
  useActionState,
  useId,
  useRef,
  useState,
} from "react";
import { saveContent, deleteContent } from "@/lib/content-actions";
import { editors } from "@/lib/content-editors";
import { safeImage } from "@/lib/site";
import type { FormState } from "@/lib/types";

export function ContentEditor({
  kind,
  record,
}: {
  kind: string;
  record?: Record<string, unknown>;
}) {
  const config = editors[kind];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletion, deleteAction, deleting] = useActionState(
    async () => deleteContent(kind, Number(record?.id)),
    {} as FormState,
  );
  const prefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const id = typeof record?.id === "number" ? record.id : null;
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (previous, data) => {
      const result = await saveContent(kind, id, previous, data);
      if (result.ok) {
        if (!record) formRef.current?.reset();
        else
          formRef.current
            ?.querySelectorAll<HTMLInputElement>(
              'input[type="file"], input[name$="_remove"]',
            )
            .forEach((input) => {
              if (input.type === "file") input.value = "";
              else input.checked = false;
            });
      }
      return result;
    },
    {},
  );
  return (
    <>
      <form
        ref={formRef}
        action={action}
        className="form-stack content-editor"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
      >
        {state.message && (
          <div
            role={state.ok ? "status" : "alert"}
            className={`form-message ${state.ok ? "success" : "failure"}`}
          >
            {state.message}
          </div>
        )}
        {state.errors &&
          Object.entries(state.errors)
            .filter(
              ([name]) => !config.fields.some((field) => field.name === name),
            )
            .map(([name, errors]) => (
              <p className="admin-field-errors" key={name}>
                {errors.join(" ")}
              </p>
            ))}
        {config.fields.map((field) => {
          const fieldId = `${prefix}-${field.name}`;
          const error = state.errors?.[field.name]?.join(" ");
          const raw = record?.[field.name];
          const value = Array.isArray(raw)
            ? raw.join("\n")
            : String(raw ?? (field.type === "number" ? 0 : ""));
          const props = {
            id: fieldId,
            name: field.name,
            required: field.required,
            maxLength: field.maxLength,
            "aria-invalid": !!error,
            "aria-describedby": error ? `${fieldId}-error` : undefined,
          };
          return (
            <div
              className={`field${field.type === "textarea" || field.type === "lines" ? " content-field-wide" : ""}${field.type === "checkbox" ? " content-field-check" : ""}`}
              key={field.name}
            >
              <label htmlFor={fieldId}>{field.label}</label>
              {field.type === "image" ? (
                <>
                  {safeImage(String(raw || record?.image || "")) && (
                    // Staff previews use the same restricted sources as public images.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={safeImage(String(raw || record?.image || ""))!}
                      alt="Current image"
                      width={160}
                      height={120}
                      style={{ objectFit: "contain", maxWidth: "100%" }}
                    />
                  )}
                  <input
                    {...props}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const input = event.currentTarget;
                      input.setCustomValidity(
                        input.files?.[0] &&
                          input.files[0].size > 4 * 1024 * 1024
                          ? "Choose an image up to 4 MB."
                          : "",
                      );
                      input.reportValidity();
                    }}
                  />
                  <small>
                    JPEG, PNG or WebP, up to 4 MB. Leave empty to keep the
                    current image.
                  </small>
                  {record && field.removable && (
                    <label>
                      <input type="checkbox" name={`${field.name}_remove`} />{" "}
                      Remove current picture
                    </label>
                  )}
                </>
              ) : field.type === "textarea" || field.type === "lines" ? (
                <textarea {...props} defaultValue={value} rows={3} />
              ) : field.type === "select" ? (
                <select
                  {...props}
                  defaultValue={value || field.options?.[0]?.value}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  {...props}
                  type="checkbox"
                  defaultChecked={raw === true}
                />
              ) : (
                <input
                  {...props}
                  type={field.type || "text"}
                  defaultValue={value}
                  min={field.type === "number" ? 0 : undefined}
                  step={field.type === "number" ? 1 : undefined}
                />
              )}
              {error && (
                <small className="field-error" id={`${fieldId}-error`}>
                  {error}
                </small>
              )}
            </div>
          );
        })}
        <div className="content-editor-actions">
          <p>Changes go live when you save.</p>
          <button type="submit" className="button" disabled={pending}>
            {pending
              ? "Saving…"
              : record
                ? "Save changes"
                : "Create item"}
          </button>
        </div>
      </form>
      {record && config.canDelete && (
        <form
          action={deleteAction}
          className="content-delete"
          style={{ padding: "0 22px 22px" }}
        >
          {deletion.message && <p role="alert">{deletion.message}</p>}
          {confirmDelete ? (
            <>
              <p>
                Delete this item permanently? It will be removed from the
                website.
              </p>
              <button className="button" type="submit" disabled={deleting}>
                {deleting ? "Deleting…" : "Confirm deletion"}
              </button>{" "}
              <button type="button" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}>
              Delete item
            </button>
          )}
        </form>
      )}
    </>
  );
}
