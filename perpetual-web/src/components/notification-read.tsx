"use client";
import { useActionState } from "react";
import { setNotificationRead } from "@/lib/portal-actions";

export function NotificationRead({ id, read }: { id: number; read: boolean }) {
  const [state, action, pending] = useActionState(setNotificationRead, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="read" value={String(!read)} />
      <button type="submit" disabled={pending} className="text-link">
        {pending ? "Saving…" : read ? "Mark unread" : "Mark as read"}
      </button>
      {state.message && <p role="alert">{state.message}</p>}
    </form>
  );
}
